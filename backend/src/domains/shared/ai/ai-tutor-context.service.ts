import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CoursService } from '@/domains/learning/course/cours.service';
import {
  Cours,
  CoursDocument,
} from '@/infrastructure/database/schemas/learning/course.schema';
import type { ChapterContextBundle, TutorSource } from '@/domains/shared/ai/ai-tutor.types';
import { SemanticRetrievalService } from '@/domains/shared/ai/embeddings/semantic-retrieval.service';
import { TranscriptionService } from '@/domains/shared/ai/transcription/transcription.service';

type ResolvedChapter = {
  chapter: {
    id?: string;
    titre?: string;
    title?: string;
    description?: string;
    content?: string;
    notes?: string;
    aiTutorEnabled?: boolean;
    transcript?: Array<{ text: string; startMs: number; endMs: number }>;
  };
  section: { titre?: string; title?: string };
};

@Injectable()
export class AiTutorContextService {
  private readonly contextCharLimit: number;
  private readonly maxSources: number;
  private readonly enrichmentEnabled: boolean;
  private readonly transcriptEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly coursService: CoursService,
    private readonly semanticRetrieval: SemanticRetrievalService,
    private readonly transcriptionService: TranscriptionService,
    @InjectModel(Cours.name) private readonly coursModel: Model<CoursDocument>,
  ) {
    this.contextCharLimit = this.parseNumberConfig(
      'AI_CONTEXT_CHAR_LIMIT',
      16000,
      2000,
      80000,
    );
    this.maxSources = this.parseNumberConfig('AI_TUTOR_MAX_SOURCES', 5, 1, 12);
    this.enrichmentEnabled =
      (this.configService.get<string>('AI_TUTOR_ENRICHMENT') ?? 'true') !==
      'false';
    this.transcriptEnabled =
      (this.configService.get<string>('AI_TUTOR_TRANSCRIPT') ?? 'true') !==
      'false';
  }

  private parseNumberConfig(
    key: string,
    fallback: number,
    min: number,
    max: number,
  ): number {
    const raw = this.configService.get<string>(key);
    const value = Number(raw);
    if (!Number.isFinite(value)) return fallback;
    return Math.min(Math.max(value, min), max);
  }

  async buildChapterContext(
    courseId: string,
    chapterId: string,
  ): Promise<ChapterContextBundle> {
    const course = await this.coursService.obtenirCours(courseId);
    if (!course) throw new NotFoundException('Course not found');

    const resolved = this.findChapter(course, chapterId);
    if (!resolved) throw new NotFoundException('Chapter not found');

    const { chapter, section } = resolved;
    const courseDoc = await this.coursModel.findById(courseId).lean();
    const courseAiEnabled =
      (courseDoc as any)?.aiTutorEnabled !== false;
    const chapterAiEnabled =
      chapter.aiTutorEnabled !== undefined
        ? Boolean(chapter.aiTutorEnabled)
        : courseAiEnabled;

    const sectionTitle = String(section.titre ?? section.title ?? '');
    const chapterTitle = String(chapter.titre ?? chapter.title ?? '');
    const content = String(chapter.description ?? chapter.content ?? '');
    const notes = String(chapter.notes ?? '');

    const sources = this.buildSources(chapterTitle, content, notes);
    const transcriptSources = this.buildTranscriptSources(chapter);
    const baseWithTranscript = [...sources, ...transcriptSources].slice(
      0,
      this.maxSources,
    );
    const enrichedSources = await this.enrichWithCommunityKnowledge(
      baseWithTranscript,
      (courseDoc as any)?.communityId as string | undefined,
      chapterTitle,
      content,
    );
    const contextText = this.truncateContext(
      [
        `Course: ${course.titre}`,
        `Section: ${sectionTitle}`,
        `Chapter: ${chapterTitle}`,
        '',
        'Numbered sources:',
        ...enrichedSources.map((s) => `[${s.id}] ${s.label}\n${s.excerpt}`),
      ].join('\n'),
    );

    return {
      courseId: String(courseId),
      courseTitle: String(course.titre || ''),
      chapterId: String(chapterId),
      chapterTitle,
      sectionTitle,
      contextText,
      sources: enrichedSources,
      aiTutorEnabled: chapterAiEnabled,
    };
  }

  /**
   * Convert transcript segments into tutor sources with [mm:ss] timestamps
   * so the tutor can cite "at [00:42]" and the video player can seek there.
   * Groups segments into ~800-char chunks to stay within source limits.
   */
  private buildTranscriptSources(chapter: ResolvedChapter['chapter']): TutorSource[] {
    if (!this.transcriptEnabled || !chapter.transcript?.length) return [];
    const segments = chapter.transcript;
    const chunks: Array<{ startMs: number; text: string }> = [];
    let current = { startMs: segments[0].startMs, text: '' };

    for (const seg of segments) {
      if (current.text.length + seg.text.length > 800 && current.text) {
        chunks.push(current);
        current = { startMs: seg.startMs, text: seg.text };
      } else {
        current.text = `${current.text} ${seg.text}`.trim();
      }
    }
    if (current.text) chunks.push(current);

    const label = `${chapter.titre ?? chapter.title ?? 'Chapter'} — Video transcript`;
    return chunks.slice(0, 3).map((chunk, i) => {
      const stamp = this.transcriptionService.formatTimestamp(chunk.startMs);
      return {
        id: `t${i + 1}`,
        label: `${label} [${stamp}]`,
        excerpt: chunk.text.slice(0, 800),
      };
    });
  }

  /**
   * Augment chapter sources with related community knowledge (posts,
   * resources, other chapters) found via semantic retrieval. Disabled by
   * default when embeddings are off. Skips the current chapter to avoid
   * duplication and respects AI_TUTOR_MAX_SOURCES.
   */
  private async enrichWithCommunityKnowledge(
    baseSources: TutorSource[],
    communityId: string | undefined,
    chapterTitle: string,
    chapterContent: string,
  ): Promise<TutorSource[]> {
    if (
      !this.enrichmentEnabled ||
      !this.semanticRetrieval.isAvailable() ||
      !communityId ||
      baseSources.length >= this.maxSources
    ) {
      return baseSources;
    }
    const query = `${chapterTitle}\n${chapterContent}`.trim().slice(0, 1000);
    if (!query) return baseSources;
    const docs = await this.semanticRetrieval
      .retrieve({
        communityId,
        query,
        limit: this.maxSources - baseSources.length,
        visibility: ['member', 'public'],
        minScore: 0.2,
      })
      .catch(() => null);
    if (!docs || docs.length === 0) return baseSources;

    const existingExcerpts = new Set(
      baseSources.map((s) => s.excerpt.slice(0, 80)),
    );
    const extra: TutorSource[] = [];
    let index = baseSources.length + 1;
    for (const doc of docs) {
      if (extra.length + baseSources.length >= this.maxSources) break;
      const excerpt = String(doc.extractedText || '').slice(0, 800);
      if (!excerpt || existingExcerpts.has(excerpt.slice(0, 80))) continue;
      existingExcerpts.add(excerpt.slice(0, 80));
      extra.push({
        id: `s${index}`,
        label: String(doc.title || doc.sourceType || 'Community knowledge'),
        excerpt,
      });
      index += 1;
    }
    return [...baseSources, ...extra];
  }

  private findChapter(course: any, chapterId: string): ResolvedChapter | null {
    const normalizedId = String(chapterId);
    if (!course?.sections) return null;
    for (const section of course.sections) {
      const chapitres = section.chapitres || [];
      const chapter = chapitres.find((c: any) => String(c.id) === normalizedId);
      if (chapter) {
        return { chapter, section };
      }
    }
    return null;
  }

  private buildSources(
    chapterTitle: string,
    content: string,
    notes: string,
  ): TutorSource[] {
    const blocks: Array<{ label: string; text: string }> = [];
    if (content.trim()) {
      blocks.push({ label: `${chapterTitle} — Content`, text: content });
    }
    if (notes.trim()) {
      blocks.push({ label: `${chapterTitle} — Instructor notes`, text: notes });
    }

    const excerpts: TutorSource[] = [];
    let index = 1;
    const minLen = 40;

    for (const block of blocks) {
      const paragraphs = block.text
        .split(/\n{2,}|\r\n{2,}/)
        .map((p) => p.replace(/\s+/g, ' ').trim())
        .filter((p) => p.length >= minLen);

      if (paragraphs.length === 0 && block.text.trim().length >= minLen) {
        paragraphs.push(block.text.replace(/\s+/g, ' ').trim().slice(0, 1200));
      }

      for (const paragraph of paragraphs) {
        if (excerpts.length >= this.maxSources) break;
        excerpts.push({
          id: `s${index}`,
          label: block.label,
          excerpt: paragraph.slice(0, 800),
        });
        index += 1;
      }
      if (excerpts.length >= this.maxSources) break;
    }

    if (excerpts.length === 0) {
      excerpts.push({
        id: 's1',
        label: chapterTitle || 'Chapter',
        excerpt: 'No detailed chapter text was provided.',
      });
    }

    return excerpts;
  }

  private truncateContext(context: string): string {
    if (context.length <= this.contextCharLimit) return context;
    return `${context.slice(0, this.contextCharLimit)}\n\n[Context truncated.]`;
  }

  getSourceIdSet(sources: TutorSource[]): Set<string> {
    return new Set(sources.map((s) => s.id));
  }
}
