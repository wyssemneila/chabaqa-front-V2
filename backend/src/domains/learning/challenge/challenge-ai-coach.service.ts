import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import OpenAI from 'openai';
import {
  Challenge,
  ChallengeDocument,
} from '@/infrastructure/database/schemas/learning/challenge.schema';
import {
  ChallengeSubmission,
  ChallengeSubmissionDocument,
} from '@/infrastructure/database/schemas/learning/challenge-submission.schema';
import { SemanticRetrievalService } from '@/domains/shared/ai/embeddings/semantic-retrieval.service';
import { isUnsupportedImageInputError } from '@/shared/utils/ai-error.util';

/**
 * AI coach for challenges. Two responsibilities:
 *  1. getHint() — a nudge toward the next step WITHOUT giving away the full
 *     answer, scoped to the task context + community knowledge (RAG).
 *  2. reviewSubmission() — instant feedback on a learner's submission, stored
 *     as `aiFeedback` on the submission. The creator's manual review still
 *     overrides the AI's verdict.
 *
 * Uses the same OpenAI-SDK-pointed-at-OpenRouter/Ollama pattern as the other
 * AI services. Falls back to a deterministic nudge/feedback string when no API
 * key is configured so the feature degrades gracefully.
 */
@Injectable()
export class ChallengeAiCoachService {
  private readonly logger = new Logger(ChallengeAiCoachService.name);
  private readonly client: OpenAI | null;
  private readonly models: string[];
  private readonly temperature: number;
  private readonly maxTokens: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly semanticRetrieval: SemanticRetrievalService,
    @InjectModel(Challenge.name) private readonly challengeModel: Model<ChallengeDocument>,
    @InjectModel(ChallengeSubmission.name)
    private readonly submissionModel: Model<ChallengeSubmissionDocument>,
  ) {
    const aiProvider = (this.configService.get<string>('AI_PROVIDER') || 'OPENROUTER').toUpperCase();
    const useOllamaCloud = aiProvider === 'OLLAMA_CLOUD';
    const apiKey = useOllamaCloud
      ? this.configService.get<string>('OLLAMA_API_KEY') || ''
      : this.configService.get<string>('OPENROUTER_API_KEY') || '';
    const baseURL = useOllamaCloud
      ? this.configService.get<string>('OLLAMA_BASE_URL') || 'https://ollama.com/v1'
      : this.configService.get<string>('OPENROUTER_BASE_URL') || 'https://openrouter.ai/api/v1';

    this.client = apiKey
      ? new OpenAI({
          apiKey,
          baseURL,
          timeout: Number(this.configService.get<string>('AI_COACH_TIMEOUT_MS') || 30000),
          ...(useOllamaCloud
            ? {}
            : {
                defaultHeaders: {
                  'HTTP-Referer':
                    this.configService.get<string>('OPENROUTER_SITE_URL') ||
                    this.configService.get<string>('FRONTEND_URL') ||
                    'https://chabaqa.io',
                  'X-Title':
                    this.configService.get<string>('OPENROUTER_APP_NAME') ||
                    'Chabaqa Challenge Coach',
                },
              }),
        })
      : null;

    const primary =
      this.configService.get<string>('AI_COACH_MODEL') ||
      this.configService.get<string>('AI_MODEL') ||
      (useOllamaCloud ? 'gpt-oss:20b-cloud' : 'google/gemini-2.5-flash-lite');
    const fallback =
      this.configService.get<string>('AI_COACH_FALLBACK_MODELS') ||
      this.configService.get<string>('AI_FALLBACK_MODELS') ||
      (useOllamaCloud
        ? 'minimax-m2.1:cloud,glm-4.7:cloud'
        : 'google/gemini-2.0-flash-001,google/gemini-2.0-flash-lite-001');
    this.models = [...new Set([primary, ...fallback.split(',')].map((v) => v.trim()).filter(Boolean))];
    this.temperature = Number(this.configService.get<string>('AI_COACH_TEMPERATURE') || 0.5);
    this.maxTokens = Math.min(
      Math.max(Number(this.configService.get<string>('AI_COACH_MAX_OUTPUT_TOKENS') || 700), 200),
      1500,
    );
  }

  private hasApiKey(): boolean {
    return Boolean(this.client);
  }

  /** Resolve a challenge + task by id (challengeId may be a slug). */
  private async resolveTask(challengeId: string, taskId: string) {
    const challenge = await this.challengeModel
      .findOne({
        $or: [{ _id: this.tryObjectId(challengeId) }, { slug: challengeId }, { id: challengeId }],
      })
      .lean()
      .exec();
    if (!challenge) throw new NotFoundException('Challenge not found');
    const tasks = (challenge as any).tasks || [];
    const task = tasks.find(
      (t: any) => String(t.id) === String(taskId) || String(t._id) === String(taskId),
    );
    if (!task) throw new NotFoundException('Task not found');
    return { challenge, task };
  }

  private tryObjectId(id: string): Types.ObjectId | null {
    try {
      return new Types.ObjectId(id);
    } catch {
      return null;
    }
  }

  /** Pull related community knowledge (RAG) for richer hints/feedback. */
  private async relatedKnowledge(
    communityId: string | undefined,
    query: string,
  ): Promise<string> {
    if (!this.semanticRetrieval.isAvailable() || !communityId) return '';
    const docs = await this.semanticRetrieval
      .retrieve({ communityId, query, limit: 4, visibility: ['member', 'public'] })
      .catch(() => null);
    if (!docs || docs.length === 0) return '';
    return docs
      .map((d, i) => `[${i + 1}] ${d.title}\n${String(d.extractedText || '').slice(0, 600)}`)
      .join('\n\n');
  }

  private async complete(system: string, user: string): Promise<string | null> {
    if (!this.client) return null;
    let lastError: any = null;
    for (const model of this.models) {
      try {
        const res = await this.client.chat.completions.create({
          model,
          temperature: this.temperature,
          max_tokens: this.maxTokens,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        });
        const text = res.choices?.[0]?.message?.content?.trim() || '';
        return text || null;
      } catch (error: any) {
        if (isUnsupportedImageInputError(error)) break;
        lastError = error;
        this.logger.warn(`coach call failed (${model}): ${error?.message || error}`);
      }
    }
    this.logger.warn(`coach completion failed: ${lastError?.message || lastError}`);
    return null;
  }

  /**
   * Return a hint that nudges the learner toward the next step without giving
   * away the full answer.
   */
  async getHint(challengeId: string, taskId: string): Promise<{ hint: string }> {
    const { challenge, task } = await this.resolveTask(challengeId, taskId);
    const context = await this.relatedKnowledge(
      String((challenge as any).communityId || ''),
      [task.title, task.description].filter(Boolean).join('\n'),
    );
    const system =
      'You are a challenge coach for a Chabaqa learning community. Give a short, encouraging hint that points the learner toward the next concrete step. Do NOT give the full answer or solve the task for them. 2-4 sentences. Plain text, no markdown.';
    const user = [
      `Challenge: ${challenge.title || ''}`,
      `Task: ${task.title || ''}`,
      `Task description: ${task.description || ''}`,
      `Deliverable: ${task.deliverable || ''}`,
      context ? `Related community knowledge:\n${context}` : '',
      `Learner question: I'm stuck on this task. What should I try next?`,
    ]
      .filter(Boolean)
      .join('\n\n');

    const hint = await this.complete(system, user);
    return {
      hint:
        hint ||
        'Try breaking the task into the smallest possible first step, do that step, and share it. The creator will review — you can iterate from there.',
    };
  }

  /**
   * Generate instant feedback on a submission. Stored on the submission as
   * `aiFeedback`. Creator review still overrides the AI verdict.
   */
  async reviewSubmission(submissionId: string): Promise<{ aiFeedback: string | null }> {
    const submission = await this.submissionModel
      .findById(submissionId)
      .lean()
      .exec();
    if (!submission) throw new NotFoundException('Submission not found');
    const challenge = await this.challengeModel.findById(submission.challengeId).lean().exec();
    if (!challenge) return { aiFeedback: null };

    const tasks = (challenge as any).tasks || [];
    const task = tasks.find(
      (t: any) => String(t.id) === String(submission.taskId) || String(t._id) === String(submission.taskId),
    );
    const context = await this.relatedKnowledge(
      String((challenge as any).communityId || ''),
      [task?.title, task?.description, submission.content].filter(Boolean).join('\n'),
    );
    const system =
      'You are a challenge coach reviewing a learner submission. Give kind, specific, actionable feedback in 3-5 short sentences. Point out one thing they did well and one concrete improvement. Do not assign a pass/fail verdict — the creator reviews that. Plain text, no markdown.';
    const user = [
      `Challenge: ${challenge.title || ''}`,
      `Task: ${task?.title || ''}`,
      `Task description: ${task?.description || ''}`,
      `Deliverable: ${task?.deliverable || ''}`,
      `Submission content: ${submission.content}`,
      submission.links?.length ? `Links: ${submission.links.join(', ')}` : '',
      context ? `Related community knowledge:\n${context}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const feedback = await this.complete(system, user);
    if (!feedback) return { aiFeedback: null };

    await this.submissionModel.updateOne(
      { _id: submission._id },
      { $set: { aiFeedback: feedback } },
    );
    return { aiFeedback: feedback };
  }
}
