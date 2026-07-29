import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import OpenAI from 'openai';
import {
  Cours,
  CoursDocument,
} from '@/infrastructure/database/schemas/learning/course.schema';

export type TranscriptSegment = {
  text: string;
  startMs: number;
  endMs: number;
};

/**
 * TranscriptionService — transcribes chapter videos into timestamped text
 * segments stored on the chapter (`transcript` field). The AI tutor then uses
 * these segments as additional context sources so learners can ask
 * "what did they say about X at minute 12?" and the answer can cite
 * `[00:42]` timestamps.
 *
 * Strategy (free-first):
 *  - Uses the OpenAI SDK pointed at the configured provider (OpenRouter or
 *    Ollama Cloud) with a Whisper-compatible audio transcription endpoint.
 *  - Falls back gracefully: if no API key is configured, the transcription is
 *    skipped and `transcribeChapter` returns `{ segments: [], skipped: true }`.
 *  - The actual audio fetch + transcription is triggered by the creator when
 *    they save a chapter with a video URL; failures never block the save.
 *
 * NOTE: OpenRouter does not currently expose a transcription endpoint. In
 * production, set TRANSCRIPTION_API_KEY + TRANSCRIPTION_BASE_URL to a
 * Whisper-compatible API (OpenAI, Groq Whisper, fine-tuned self-host). The
 * service auto-detects availability and degrades to a no-op when unavailable.
 */
@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name);
  private readonly client: OpenAI | null;
  private readonly model: string;
  private readonly maxAudioBytes: number;
  private readonly enabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Cours.name) private readonly coursModel: Model<CoursDocument>,
  ) {
    const apiKey =
      this.configService.get<string>('TRANSCRIPTION_API_KEY') ||
      this.configService.get<string>('OPENROUTER_API_KEY') ||
      '';
    const baseURL =
      this.configService.get<string>('TRANSCRIPTION_BASE_URL') ||
      this.configService.get<string>('OPENROUTER_BASE_URL') ||
      'https://openrouter.ai/api/v1';

    this.model =
      this.configService.get<string>('TRANSCRIPTION_MODEL') || 'whisper-1';
    this.maxAudioBytes = Number(
      this.configService.get<string>('TRANSCRIPTION_MAX_AUDIO_BYTES') ||
        25 * 1024 * 1024,
    );
    this.enabled = Boolean(apiKey);
    this.client = apiKey
      ? new OpenAI({
          apiKey,
          baseURL,
          timeout: Number(
            this.configService.get<string>('TRANSCRIPTION_TIMEOUT_MS') ||
              120000,
          ),
        })
      : null;

    if (!this.enabled) {
      this.logger.warn(
        'TranscriptionService disabled — no TRANSCRIPTION_API_KEY set. Video transcripts will not be generated.',
      );
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Transcribe a chapter's video and store the segments on the chapter.
   * Returns the segments. Non-throwing: failures are logged and an empty
   * array is returned so callers (chapter save) are never blocked.
   */
  async transcribeChapter(
    courseId: string,
    chapterId: string,
    options: { force?: boolean } = {},
  ): Promise<{ segments: TranscriptSegment[]; skipped: boolean }> {
    if (!this.enabled || !this.client) {
      return { segments: [], skipped: true };
    }

    try {
      const course = await this.coursModel.findById(courseId).lean().exec();
      if (!course) return { segments: [], skipped: true };

      const chapter = this.findChapter(course, chapterId);
      if (!chapter || !chapter.videoUrl) {
        return { segments: [], skipped: true };
      }

      if (!options.force && Array.isArray(chapter.transcript) && chapter.transcript.length > 0) {
        return { segments: chapter.transcript as TranscriptSegment[], skipped: true };
      }

      const audioBuffer = await this.fetchAudio(chapter.videoUrl);
      if (!audioBuffer) return { segments: [], skipped: true };

      const segments = await this.callTranscriptionApi(audioBuffer);
      if (segments.length === 0) return { segments: [], skipped: true };

      // Persist the transcript on the chapter.
      await this.coursModel.updateOne(
        { _id: new Types.ObjectId(courseId) },
        { $set: { [`sections.$[sec].chapitres.$[ch].transcript`]: segments } },
        {
          arrayFilters: [
            { 'sec.chapitres.id': chapterId },
            { 'ch.id': chapterId },
          ],
        },
      );

      this.logger.log(
        `Transcribed chapter ${chapterId}: ${segments.length} segments`,
      );
      return { segments, skipped: false };
    } catch (error: any) {
      this.logger.warn(
        `transcribeChapter failed for ${chapterId}: ${error?.message || error}`,
      );
      return { segments: [], skipped: true };
    }
  }

  private findChapter(course: any, chapterId: string) {
    for (const section of course.sections || []) {
      for (const chapter of section.chapitres || []) {
        if (String(chapter.id) === String(chapterId)) return chapter;
      }
    }
    return null;
  }

  /**
   * Fetch the audio/video file as a Buffer. For YouTube/Vimeo we can't fetch
   * directly — in that case this returns null and transcription is skipped.
   * For direct video URLs (e.g. MinIO/S3) we fetch the bytes.
   */
  private async fetchAudio(videoUrl: string): Promise<Buffer | null> {
    try {
      // Skip platform URLs we can't transcribe directly.
      if (
        /youtube\.com|youtu\.be|vimeo\.com/i.test(videoUrl)
      ) {
        this.logger.debug(
          `Skipping transcription for platform video: ${videoUrl}`,
        );
        return null;
      }

      const res = await fetch(videoUrl);
      if (!res.ok) {
        this.logger.warn(`Audio fetch failed (${res.status}): ${videoUrl}`);
        return null;
      }
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (buffer.byteLength > this.maxAudioBytes) {
        this.logger.warn(
          `Audio too large (${buffer.byteLength} > ${this.maxAudioBytes})`,
        );
        return null;
      }
      return buffer;
    } catch (error: any) {
      this.logger.warn(`fetchAudio failed: ${error?.message || error}`);
      return null;
    }
  }

  /**
   * Call the Whisper-compatible transcription API. Parses verbose_json output
   * into timestamped segments.
   */
  private async callTranscriptionApi(
    audioBuffer: Buffer,
  ): Promise<TranscriptSegment[]> {
    if (!this.client) return [];
    try {
      const file = new File([audioBuffer], 'audio.mp4', {
        type: 'audio/mp4',
      });
      const res = await this.client.audio.transcriptions.create({
        file,
        model: this.model,
        response_format: 'verbose_json',
        timestamp_granularities: ['segment'],
      } as any);

      const segments = (res as any)?.segments;
      if (!Array.isArray(segments)) return [];
      return segments
        .map((seg: any) => ({
          text: String(seg.text || '').trim(),
          startMs: Math.round(Number(seg.start || 0) * 1000),
          endMs: Math.round(Number(seg.end || 0) * 1000),
        }))
        .filter((s: TranscriptSegment) => s.text.length > 0);
    } catch (error: any) {
      this.logger.warn(
        `Transcription API call failed: ${error?.message || error}`,
      );
      return [];
    }
  }

  /**
   * Build a flat transcript string with [mm:ss] timestamps for the tutor
   * context. Caps total length to stay within the context budget.
   */
  formatTranscriptForContext(
    segments: TranscriptSegment[],
    maxChars = 6000,
  ): string {
    if (!segments?.length) return '';
    const lines: string[] = [];
    let totalLen = 0;
    for (const seg of segments) {
      const stamp = this.formatTimestamp(seg.startMs);
      const line = `[${stamp}] ${seg.text}`;
      if (totalLen + line.length > maxChars) break;
      lines.push(line);
      totalLen += line.length + 1;
    }
    return lines.join('\n');
  }

  formatTimestamp(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
}
