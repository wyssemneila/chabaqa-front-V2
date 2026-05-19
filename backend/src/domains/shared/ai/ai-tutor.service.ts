import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import OpenAI from 'openai';
import {
  AiChapterConversation,
  AiChapterConversationDocument,
  AiChapterMessage,
} from '@/infrastructure/database/schemas/learning/ai-chapter-conversation.schema';
import {
  Community,
  CommunityDocument,
} from '@/infrastructure/database/schemas/community/community.schema';
import {
  Cours,
  CoursDocument,
} from '@/infrastructure/database/schemas/learning/course.schema';
import {
  extractAiProviderErrorMessage,
  getUnsupportedImageInputMessage,
  isUnsupportedImageInputError,
} from '@/shared/utils/ai-error.util';
import { AiTutorContextService } from '@/domains/shared/ai/ai-tutor-context.service';
import {
  buildModeSystemPrompt,
  parseJsonObject,
  validateChatResponse,
  validateQuizResponse,
  validateSimplifyResponse,
  validateSummaryResponse,
} from '@/domains/shared/ai/ai-tutor-response.validator';
import type {
  AiTutorIntent,
  AiTutorMode,
  TutorAskResponse,
  TutorQuizQuestion,
  TutorSource,
} from '@/domains/shared/ai/ai-tutor.types';

@Injectable()
export class AiTutorService {
  private readonly logger = new Logger(AiTutorService.name);
  private readonly openai: OpenAI;
  private readonly modelCandidates: string[];
  private readonly temperature: number;
  private readonly maxOutputTokens: number;
  private readonly historyMessageLimit: number;
  private readonly contextHistoryMessageLimit: number;
  private readonly maxSources: number;
  private readonly quizQuestionCount: number;
  private readonly promptVersion: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly contextService: AiTutorContextService,
    @InjectModel(AiChapterConversation.name)
    private readonly conversationModel: Model<AiChapterConversationDocument>,
    @InjectModel(Community.name)
    private readonly communityModel: Model<CommunityDocument>,
    @InjectModel(Cours.name)
    private readonly coursModel: Model<CoursDocument>,
  ) {
    const aiProvider = (
      this.configService.get<string>('AI_PROVIDER') || 'OPENROUTER'
    ).toUpperCase();
    const useOllamaCloud = aiProvider === 'OLLAMA_CLOUD';
    const apiKey = useOllamaCloud
      ? this.configService.get<string>('OLLAMA_API_KEY')
      : this.configService.get<string>('OPENROUTER_API_KEY');
    const baseURL = useOllamaCloud
      ? this.configService.get<string>('OLLAMA_BASE_URL') || 'https://ollama.com/v1'
      : this.configService.get<string>('OPENROUTER_BASE_URL') ||
        'https://openrouter.ai/api/v1';
    const siteUrl =
      this.configService.get<string>('OPENROUTER_SITE_URL') ||
      this.configService.get<string>('FRONTEND_URL') ||
      'https://chabaqa.io';
    const appName = useOllamaCloud
      ? this.configService.get<string>('OLLAMA_APP_NAME') || 'Chabaqa AI Tutor'
      : this.configService.get<string>('OPENROUTER_APP_NAME') ||
        'Chabaqa AI Tutor';
    const requestTimeoutMs = this.parseNumberConfig(
      'AI_REQUEST_TIMEOUT_MS',
      30000,
      5000,
      120000,
    );

    const primaryModel = (
      this.configService.get<string>('AI_MODEL') ||
      (useOllamaCloud ? 'gpt-oss:20b-cloud' : 'google/gemini-2.5-flash-lite')
    ).trim();
    const fallbackModels = (
      this.configService.get<string>('AI_FALLBACK_MODELS') ||
      (useOllamaCloud
        ? 'minimax-m2.1:cloud,glm-4.7:cloud'
        : 'google/gemini-2.0-flash-001,google/gemini-2.0-flash-lite-001,mistralai/mistral-small-3.1-24b-instruct:free')
    )
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    this.modelCandidates = [...new Set([primaryModel, ...fallbackModels])];
    this.temperature = this.parseNumberConfig('AI_TEMPERATURE', 0.3, 0, 1);
    this.maxOutputTokens = this.parseNumberConfig(
      'AI_MAX_OUTPUT_TOKENS',
      1200,
      128,
      4000,
    );
    this.historyMessageLimit = this.parseNumberConfig(
      'AI_HISTORY_MAX_MESSAGES',
      80,
      10,
      500,
    );
    this.contextHistoryMessageLimit = this.parseNumberConfig(
      'AI_CONTEXT_HISTORY_MESSAGES',
      14,
      0,
      60,
    );
    this.maxSources = this.parseNumberConfig('AI_TUTOR_MAX_SOURCES', 5, 1, 12);
    this.quizQuestionCount = this.parseNumberConfig(
      'AI_TUTOR_QUIZ_QUESTION_COUNT',
      4,
      3,
      8,
    );
    this.promptVersion =
      this.configService.get<string>('AI_TUTOR_PROMPT_VERSION') || 'tutor-v2';

    this.openai = new OpenAI({
      apiKey,
      baseURL,
      timeout: requestTimeoutMs,
      ...(useOllamaCloud
        ? {}
        : {
            defaultHeaders: {
              'HTTP-Referer': siteUrl,
              'X-Title': appName,
            },
          }),
    });
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

  private normalizeRequiredString(value: unknown, field: string): string {
    const normalized = String(value || '').trim();
    if (!normalized) throw new BadRequestException(`${field} is required`);
    return normalized;
  }

  private toUserObjectId(userId: unknown): Types.ObjectId {
    if (userId instanceof Types.ObjectId) return userId;
    const normalized = String(userId || '').trim();
    if (!normalized) throw new UnauthorizedException('User context is missing');
    if (!Types.ObjectId.isValid(normalized)) {
      throw new UnauthorizedException('Invalid user context');
    }
    return new Types.ObjectId(normalized);
  }

  async getChapterHistory(courseId: string, chapterId: string, userId: string) {
    await this.assertTutorEnabled(courseId, chapterId);
    const normalizedCourseId = this.normalizeRequiredString(courseId, 'courseId');
    const normalizedChapterId = this.normalizeRequiredString(chapterId, 'chapterId');
    const userObjectId = this.toUserObjectId(userId);

    const conversation = await this.conversationModel
      .findOne({
        userId: userObjectId,
        courseId: normalizedCourseId,
        chapterId: normalizedChapterId,
      })
      .select({ messages: 1 })
      .lean();

    return {
      courseId: normalizedCourseId,
      chapterId: normalizedChapterId,
      messages: this.toApiHistory((conversation as any)?.messages || []),
    };
  }

  async askChapter(
    courseId: string,
    chapterId: string,
    userId: unknown,
    question?: string,
    mode: AiTutorMode = 'chat',
  ): Promise<TutorAskResponse> {
    await this.assertTutorEnabled(courseId, chapterId);
    const normalizedCourseId = this.normalizeRequiredString(courseId, 'courseId');
    const normalizedChapterId = this.normalizeRequiredString(chapterId, 'chapterId');
    const userObjectId = this.toUserObjectId(userId);
    const normalizedMode = mode || 'chat';

    const userPrompt = this.resolveUserPrompt(normalizedMode, question);
    const ctx = await this.contextService.buildChapterContext(
      normalizedCourseId,
      normalizedChapterId,
    );

    if (!ctx.aiTutorEnabled) {
      throw new ForbiddenException('AI Course Tutor is disabled for this chapter.');
    }

    const conversation = await this.conversationModel
      .findOne({
        userId: userObjectId,
        courseId: normalizedCourseId,
        chapterId: normalizedChapterId,
      })
      .select({ messages: 1 })
      .lean();
    const historyMessages = this.toAssistantChatHistory(
      (conversation as any)?.messages || [],
    );

    const sourceIds = this.contextService.getSourceIdSet(ctx.sources);
    const systemPrompt = buildModeSystemPrompt(
      normalizedMode,
      ctx.courseTitle,
      ctx.chapterTitle,
      ctx.contextText,
      [...sourceIds],
      this.quizQuestionCount,
    );

    const quizMaxTokens = Math.min(
      4000,
      Math.max(this.maxOutputTokens, this.quizQuestionCount * 450 + 512),
    );
    const result = await this.callStructuredLlm(
      systemPrompt,
      historyMessages,
      userPrompt,
      normalizedMode,
      sourceIds,
      normalizedMode === 'quiz' ? quizMaxTokens : this.maxOutputTokens,
    );

    const intent = this.resolveIntent(normalizedMode, userPrompt, result);
    const displayContent = this.buildDisplayContent(normalizedMode, result);
    const assistantSources = this.extractSourcesFromResponse(result.response);

    try {
      await this.saveConversationTurn(
        userObjectId,
        normalizedCourseId,
        normalizedChapterId,
        userPrompt,
        displayContent,
        result.model,
        normalizedMode,
        intent,
        assistantSources,
        normalizedMode === 'quiz' && result.response.mode === 'quiz'
          ? {
              questionCount: result.response.questions.length,
              questions: result.response.questions,
            }
          : undefined,
      );
    } catch (persistError: any) {
      this.logger.error(
        `Failed to save tutor conversation: ${persistError?.message || persistError}`,
      );
    }

    this.logger.log(
      `tutor ask course=${normalizedCourseId} chapter=${normalizedChapterId} mode=${normalizedMode} intent=${intent} model=${result.model} qLen=${userPrompt.length} prompt=${this.promptVersion}`,
    );

    return {
      ...result.response,
      chapterId: normalizedChapterId,
      model: result.model,
    } as TutorAskResponse;
  }

  async updateCourseTutorSettings(
    courseId: string,
    userId: string,
    aiTutorEnabled: boolean,
  ) {
    await this.assertCourseCreator(courseId, userId);
    const course = await this.coursModel
      .findByIdAndUpdate(courseId, { $set: { aiTutorEnabled } }, { new: true })
      .select({ aiTutorEnabled: 1 })
      .lean();
    if (!course) throw new NotFoundException('Course not found');
    return { courseId: String(courseId), aiTutorEnabled: (course as any).aiTutorEnabled };
  }

  async updateChapterTutorSettings(
    courseId: string,
    chapterId: string,
    userId: string,
    aiTutorEnabled: boolean,
  ) {
    await this.assertCourseCreator(courseId, userId);
    const course = await this.coursModel.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');

    let found = false;
    for (const section of (course as any).sections || []) {
      for (const chapter of section.chapitres || []) {
        if (String(chapter.id) === String(chapterId)) {
          chapter.aiTutorEnabled = aiTutorEnabled;
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (!found) throw new NotFoundException('Chapter not found');

    course.markModified('sections');
    await course.save();
    return { courseId: String(courseId), chapterId: String(chapterId), aiTutorEnabled };
  }

  private resolveUserPrompt(mode: AiTutorMode, question?: string): string {
    const q = String(question || '').trim();
    switch (mode) {
      case 'summary':
        return q || 'Summarize this chapter with the main takeaways.';
      case 'quiz':
        return q || `Generate a ${this.quizQuestionCount}-question quiz for this chapter.`;
      case 'simplify':
        return q || 'Explain this chapter in simple terms for a beginner.';
      default:
        if (!q) throw new BadRequestException('Question is required');
        return q;
    }
  }

  private resolveIntent(
    mode: AiTutorMode,
    question: string,
    result: { response: TutorAskResponse },
  ): AiTutorIntent {
    if (mode === 'summary') return 'summary';
    if (mode === 'quiz') return 'quiz';
    if (mode === 'simplify') return 'simplify';
    if (result.response.mode === 'chat') {
      return result.response.intent;
    }
    const lower = question.toLowerCase();
    if (lower.includes('clarif') || lower.includes('confus')) return 'clarification';
    return 'question';
  }

  private extractSourcesFromResponse(response: TutorAskResponse): TutorSource[] {
    if (response.mode === 'quiz') return [];
    return response.sources || [];
  }

  private buildDisplayContent(
    mode: AiTutorMode,
    result: { response: TutorAskResponse; sources?: TutorSource[] },
  ): string {
    const r = result.response;
    if (r.mode === 'summary') {
      const points = r.keyPoints.map((p) => `• ${p}`).join('\n');
      return `${r.summary}\n\n${points}`;
    }
    if (r.mode === 'quiz') {
      return `Quiz: ${r.questions.length} questions generated.`;
    }
    if (r.mode === 'chat' || r.mode === 'simplify') {
      return r.answer;
    }
    return '';
  }

  private async callStructuredLlm(
    systemPrompt: string,
    historyMessages: Array<{ role: 'user' | 'assistant'; content: string }>,
    userPrompt: string,
    mode: AiTutorMode,
    allowedSourceIds: Set<string>,
    maxTokens: number = this.maxOutputTokens,
  ): Promise<{
    model: string;
    response: TutorAskResponse;
    sources?: TutorSource[];
  }> {
    let lastError: unknown = null;
    const errors: Array<{ model: string; status: string; message: string }> = [];

    for (const model of this.modelCandidates) {
      try {
        const completion = await this.openai.chat.completions.create({
          model,
          temperature: this.temperature,
          max_tokens: maxTokens,
          messages: [
            { role: 'system', content: systemPrompt },
            ...historyMessages,
            { role: 'user', content: userPrompt },
          ],
        });

        const raw = this.extractCompletionText(completion);
        if (!raw) throw new Error('Empty model response');

        let parsed = parseJsonObject(raw);
        if (!parsed) throw new Error('Invalid JSON from model');
        if (mode === 'quiz' && Array.isArray(parsed)) {
          parsed = { questions: parsed };
        }

        const validated = this.validateByMode(mode, parsed, allowedSourceIds);
        if (!validated.ok) throw new Error(validated.error);

        const response = this.toApiResponse(mode, validated.value);
        return {
          model,
          response,
          sources: 'sources' in validated.value ? validated.value.sources : undefined,
        };
      } catch (error: any) {
        if (isUnsupportedImageInputError(error)) {
          throw new BadRequestException(getUnsupportedImageInputMessage());
        }
        lastError = error;
        const message = extractAiProviderErrorMessage(error);
        const status = String(error?.status || error?.code || 'unknown');
        errors.push({ model, status, message });
        this.logger.warn(`Tutor model failed model=${model} status=${status}`);
      }
    }

    const allRateLimited =
      errors.length > 0 &&
      errors.every(
        (e) =>
          e.status === '429' ||
          e.message.toLowerCase().includes('rate limit'),
      );
    if (allRateLimited) {
      throw new ServiceUnavailableException(
        'AI provider is temporarily rate-limited. Please retry shortly.',
      );
    }

    this.logger.error(
      `Tutor failed all models: ${extractAiProviderErrorMessage(lastError)}`,
    );
    throw new BadGatewayException('Failed to generate a valid AI tutor response');
  }

  private validateByMode(
    mode: AiTutorMode,
    parsed: unknown,
    allowedSourceIds: Set<string>,
  ) {
    switch (mode) {
      case 'summary':
        return validateSummaryResponse(parsed, allowedSourceIds, this.maxSources);
      case 'quiz':
        return validateQuizResponse(parsed, allowedSourceIds, this.quizQuestionCount);
      case 'simplify':
        return validateSimplifyResponse(parsed, allowedSourceIds, this.maxSources);
      default:
        return validateChatResponse(parsed, allowedSourceIds, this.maxSources);
    }
  }

  private toApiResponse(mode: AiTutorMode, value: any): TutorAskResponse {
    switch (mode) {
      case 'summary':
        return {
          mode: 'summary',
          summary: value.summary,
          keyPoints: value.keyPoints,
          sources: value.sources,
          chapterId: '',
          model: '',
        };
      case 'quiz':
        return {
          mode: 'quiz',
          questions: value.questions,
          chapterId: '',
          model: '',
        };
      case 'simplify':
        return {
          mode: 'simplify',
          answer: value.answer,
          sources: value.sources,
          chapterId: '',
          model: '',
        };
      default:
        return {
          mode: 'chat',
          answer: value.answer,
          sources: value.sources,
          intent: value.intent,
          chapterId: '',
          model: '',
        };
    }
  }

  private extractCompletionText(completion: any): string {
    const raw = completion?.choices?.[0]?.message?.content;
    if (typeof raw === 'string') return raw.trim();
    if (Array.isArray(raw)) {
      return raw
        .map((item: any) => (typeof item?.text === 'string' ? item.text : ''))
        .join('\n')
        .trim();
    }
    return '';
  }

  private toAssistantChatHistory(
    messages: AiChapterMessage[],
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    if (!Array.isArray(messages) || this.contextHistoryMessageLimit <= 0) return [];
    return messages
      .filter(
        (m) =>
          m &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string' &&
          m.content.trim(),
      )
      .slice(-this.contextHistoryMessageLimit)
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content.trim(),
      }));
  }

  private toApiHistory(messages: AiChapterMessage[]) {
    return messages
      .filter(
        (m) =>
          m &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string' &&
          m.content.trim(),
      )
      .map((m) => ({
        role: m.role === 'assistant' ? 'ai' : 'user',
        content: m.content.trim(),
        createdAt: m.createdAt || null,
        mode: m.mode || null,
        intent: m.intent || null,
        sources: m.sources || [],
        metadata: m.metadata || null,
      }));
  }

  private async saveConversationTurn(
    userId: Types.ObjectId,
    courseId: string,
    chapterId: string,
    question: string,
    answer: string,
    model: string,
    mode: AiTutorMode,
    intent: AiTutorIntent,
    sources?: TutorSource[],
    metadata?: { questionCount?: number; questions?: TutorQuizQuestion[] },
  ) {
    const turnMessages: Partial<AiChapterMessage>[] = [
      {
        role: 'user',
        content: question,
        createdAt: new Date(),
        mode,
        intent,
      },
      {
        role: 'assistant',
        content: answer,
        createdAt: new Date(),
        model,
        mode,
        intent,
        sources: sources || [],
        metadata: metadata || undefined,
      },
    ];

    await this.conversationModel.updateOne(
      { userId, courseId, chapterId },
      {
        $setOnInsert: { userId, courseId, chapterId },
        $push: {
          messages: {
            $each: turnMessages,
            $slice: -this.historyMessageLimit,
          },
        },
      },
      { upsert: true },
    );
  }

  private async assertTutorEnabled(courseId: string, chapterId: string) {
    const course = await this.coursModel.findById(courseId).lean();
    if (!course) return;

    const communityId = String((course as any).communityId || '');
    if (communityId) {
      const community = await this.communityModel.findById(communityId).lean();
      if (
        community?.aiSettings &&
        community.aiSettings.courseTutorEnabled === false
      ) {
        throw new ForbiddenException(
          'AI Course Tutor is disabled for this community.',
        );
      }
    }

    if ((course as any).aiTutorEnabled === false) {
      throw new ForbiddenException('AI Course Tutor is disabled for this course.');
    }

    for (const section of (course as any).sections || []) {
      for (const chapter of section.chapitres || []) {
        if (String(chapter.id) === String(chapterId)) {
          if (chapter.aiTutorEnabled === false) {
            throw new ForbiddenException(
              'AI Course Tutor is disabled for this chapter.',
            );
          }
          return;
        }
      }
    }
  }

  private async assertCourseCreator(courseId: string, userId: string) {
    const course = await this.coursModel.findById(courseId).select({ creatorId: 1 }).lean();
    if (!course) throw new NotFoundException('Course not found');
    if (String((course as any).creatorId) !== String(userId)) {
      throw new ForbiddenException('Only the course creator can update tutor settings');
    }
  }
}
