import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import OpenAI from 'openai';
import { isUnsupportedImageInputError } from '@/shared/utils/ai-error.util';
import {
  Community,
  CommunityDocument,
} from '@/infrastructure/database/schemas/community/community.schema';

export interface WhatsappAutoReplyInput {
  communityId: string;
  contactName?: string;
  inboundMessage: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface WhatsappAutoReplyResult {
  reply: string;
  model: string;
  skipped: boolean;
  reason?: string;
}

export interface WhatsappBroadcastDraftInput {
  communityId: string;
  goal: string;
  audience: string;
  tone?: string;
  context?: string;
}

export interface WhatsappBroadcastDraftResult {
  message: string;
  variants: string[];
  model: string;
  skipped: boolean;
  reason?: string;
}

/**
 * WhatsappAiService — AI assistance for WhatsApp communication:
 *  1. Auto-reply to inbound WhatsApp messages using community context, so
 *     members get an instant helpful response before a human replies.
 *  2. Broadcast message drafting from a creator's goal/audience, reusing
 *     the same free-first OpenRouter/Ollama Cloud LLM as the rest of the AI
 *     platform.
 *
 * Both features degrade gracefully: if no API key is configured, callers get
 * `skipped: true` and the WhatsApp flow continues without AI.
 */
@Injectable()
export class WhatsappAiService {
  private readonly logger = new Logger(WhatsappAiService.name);
  private readonly client: OpenAI | null;
  private readonly models: string[];
  private readonly temperature: number;
  private readonly maxTokens: number;
  private readonly autoReplyEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Community.name) private readonly communityModel: Model<CommunityDocument>,
  ) {
    const aiProvider = (
      this.configService.get<string>('AI_PROVIDER') || 'OPENROUTER'
    ).toUpperCase();
    const useOllamaCloud = aiProvider === 'OLLAMA_CLOUD';
    const apiKey = useOllamaCloud
      ? this.configService.get<string>('OLLAMA_API_KEY') || ''
      : this.configService.get<string>('OPENROUTER_API_KEY') || '';
    const baseURL = useOllamaCloud
      ? this.configService.get<string>('OLLAMA_BASE_URL') || 'https://ollama.com/v1'
      : this.configService.get<string>('OPENROUTER_BASE_URL') ||
        'https://openrouter.ai/api/v1';

    this.client = apiKey
      ? new OpenAI({
          apiKey,
          baseURL,
          timeout: Number(
            this.configService.get<string>('WHATSAPP_AI_TIMEOUT_MS') || 30000,
          ),
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
                    'Chabaqa WhatsApp AI',
                },
              }),
        })
      : null;

    const primary =
      this.configService.get<string>('WHATSAPP_AI_MODEL') ||
      this.configService.get<string>('AI_MODEL') ||
      (useOllamaCloud
        ? 'gpt-oss:20b-cloud'
        : 'google/gemini-2.5-flash-lite');
    const fallback =
      this.configService.get<string>('WHATSAPP_AI_FALLBACK_MODELS') ||
      this.configService.get<string>('AI_FALLBACK_MODELS') ||
      (useOllamaCloud
        ? 'minimax-m2.1:cloud,glm-4.7:cloud'
        : 'google/gemini-2.0-flash-lite-001,mistralai/mistral-small-3.1-24b-instruct:free');
    this.models = [
      ...new Set([primary, ...fallback.split(',')].map((v) => v.trim()).filter(Boolean)),
    ];
    this.temperature = Number(
      this.configService.get<string>('WHATSAPP_AI_TEMPERATURE') || 0.4,
    );
    this.maxTokens = Math.min(
      Math.max(
        Number(this.configService.get<string>('WHATSAPP_AI_MAX_TOKENS') || 500),
        120,
      ),
      1500,
    );
    this.autoReplyEnabled =
      (this.configService.get<string>('WHATSAPP_AI_AUTOREPLY') ?? 'false') ===
      'true';
  }

  isEnabled(): boolean {
    return Boolean(this.client);
  }

  isAutoReplyEnabled(): boolean {
    return this.isEnabled() && this.autoReplyEnabled;
  }

  /**
   * Generate a short auto-reply to an inbound WhatsApp message.
   * Returns `skipped: true` when AI is disabled or the message is too short.
   */
  async generateAutoReply(
    input: WhatsappAutoReplyInput,
  ): Promise<WhatsappAutoReplyResult> {
    if (!this.isAutoReplyEnabled() || !this.client) {
      return { reply: '', model: '', skipped: true, reason: 'disabled' };
    }
    const trimmed = String(input.inboundMessage || '').trim();
    if (trimmed.length < 2) {
      return { reply: '', model: '', skipped: true, reason: 'too-short' };
    }

    const community = await this.communityModel
      .findById(input.communityId)
      .lean()
      .exec();
    const communityName = String(community?.name || 'our community');
    const communityDesc = String(community?.short_description || '').slice(0, 300);

    const system = [
      `You are the friendly WhatsApp assistant for "${communityName}".`,
      communityDesc ? `About: ${communityDesc}` : '',
      'Reply concisely (max ~40 words), warmly, in the same language as the user.',
      'If unsure, tell them a human will follow up. Never invent prices or dates.',
      'Do not use markdown or emojis unless the user used them.',
    ]
      .filter(Boolean)
      .join('\n');

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: system },
    ];
    for (const turn of input.conversationHistory || []) {
      messages.push({ role: turn.role, content: turn.content });
    }
    messages.push({ role: 'user', content: trimmed });

    for (const model of this.models) {
      try {
        const completion = await this.client.chat.completions.create({
          model,
          temperature: this.temperature,
          max_tokens: this.maxTokens,
          messages,
        });
        const reply = String(
          completion.choices?.[0]?.message?.content || '',
        ).trim();
        if (reply) {
          return { reply, model, skipped: false };
        }
      } catch (error: any) {
        if (isUnsupportedImageInputError(error)) break;
        this.logger.warn(
          `WhatsApp auto-reply failed (${model}): ${error?.message || error}`,
        );
      }
    }
    return { reply: '', model: '', skipped: true, reason: 'provider-error' };
  }

  /**
   * Draft a broadcast message from a creator's goal + audience description.
   * Returns a primary message and 2 short variants for A/B testing.
   */
  async generateBroadcastDraft(
    input: WhatsappBroadcastDraftInput,
  ): Promise<WhatsappBroadcastDraftResult> {
    if (!this.isEnabled() || !this.client) {
      return {
        message: '',
        variants: [],
        model: '',
        skipped: true,
        reason: 'disabled',
      };
    }

    const community = await this.communityModel
      .findById(input.communityId)
      .lean()
      .exec();
    const communityName = String(community?.name || 'our community');

    const tone = String(input.tone || 'friendly, concise').slice(0, 60);
    const goal = String(input.goal || '').slice(0, 800);
    const audience = String(input.audience || 'all members').slice(0, 400);
    const extra = String(input.context || '').slice(0, 800);

    const prompt = [
      `Community: ${communityName}`,
      `Audience: ${audience}`,
      `Goal: ${goal}`,
      extra ? `Extra context: ${extra}` : '',
      `Tone: ${tone}`,
      '',
      'Write a WhatsApp broadcast message (max ~120 words) that members will actually read.',
      'Then write 2 shorter variants (max ~60 words each) for A/B testing.',
      'Return ONLY valid JSON: {"message": string, "variants": string[]}. No markdown.',
    ]
      .filter(Boolean)
      .join('\n');

    for (const model of this.models) {
      try {
        const completion = await this.client.chat.completions.create({
          model,
          temperature: this.temperature,
          max_tokens: this.maxTokens,
          messages: [
            {
              role: 'system',
              content:
                'You are Chabaqa WhatsApp AI. Return only valid JSON for broadcast drafts. No markdown.',
            },
            { role: 'user', content: prompt },
          ],
        });
        const raw = String(
          completion.choices?.[0]?.message?.content || '',
        ).trim();
        const parsed = this.parseJsonObject(raw);
        const message = String(parsed?.message || '').trim();
        const variants = Array.isArray(parsed?.variants)
          ? parsed.variants.map((v: any) => String(v || '').trim()).filter(Boolean)
          : [];
        if (message) {
          return { message, variants, model, skipped: false };
        }
      } catch (error: any) {
        if (isUnsupportedImageInputError(error)) break;
        this.logger.warn(
          `WhatsApp broadcast draft failed (${model}): ${error?.message || error}`,
        );
      }
    }
    return {
      message: '',
      variants: [],
      model: '',
      skipped: true,
      reason: 'provider-error',
    };
  }

  private parseJsonObject(raw: string): any {
    if (!raw) return null;
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  }
}
