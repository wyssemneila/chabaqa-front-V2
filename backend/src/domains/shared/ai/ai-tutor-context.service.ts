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

type ResolvedChapter = {
  chapter: {
    id?: string;
    titre?: string;
    title?: string;
    description?: string;
    content?: string;
    notes?: string;
    aiTutorEnabled?: boolean;
  };
  section: { titre?: string; title?: string };
};

@Injectable()
export class AiTutorContextService {
  private readonly contextCharLimit: number;
  private readonly maxSources: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly coursService: CoursService,
    @InjectModel(Cours.name) private readonly coursModel: Model<CoursDocument>,
  ) {
    this.contextCharLimit = this.parseNumberConfig(
      'AI_CONTEXT_CHAR_LIMIT',
      16000,
      2000,
      80000,
    );
    this.maxSources = this.parseNumberConfig('AI_TUTOR_MAX_SOURCES', 5, 1, 12);
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
    const contextText = this.truncateContext(
      [
        `Course: ${course.titre}`,
        `Section: ${sectionTitle}`,
        `Chapter: ${chapterTitle}`,
        '',
        'Numbered sources:',
        ...sources.map((s) => `[${s.id}] ${s.label}\n${s.excerpt}`),
      ].join('\n'),
    );

    return {
      courseId: String(courseId),
      courseTitle: String(course.titre || ''),
      chapterId: String(chapterId),
      chapterTitle,
      sectionTitle,
      contextText,
      sources,
      aiTutorEnabled: chapterAiEnabled,
    };
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
