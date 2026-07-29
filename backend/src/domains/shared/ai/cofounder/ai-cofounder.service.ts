import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiLaunchPlanService } from './ai-launch-plan.service';
import { AiPublishService } from '../ai-publish.service';
import {
  BuildCommunityDto,
  CreateLaunchPlanDto,
  PublishDraftDto,
} from './dto/ai-cofounder.dto';
import { isUnsupportedImageInputError } from '@/shared/utils/ai-error.util';
import OpenAI from 'openai';

export interface OnboardingFlowInput {
  creatorId: string;
  niche: string;
  audience: string;
  promise: string;
  price?: number;
  currency?: string;
}

export interface OnboardingFlowResult {
  community: {
    draft: { nom: string; description: string; price: number; currency: string; status: string };
    landingCopy: { headline: string; subheadline: string; bullets: string[] };
    posts: Array<{ title: string; content: string }>;
  };
  course: {
    draft: { title: string; description: string; price: number; currency: string };
    landingCopy: { headline: string; subheadline: string; bullets: string[] };
  };
  launchPlan: { durationDays: number; goal: string; milestones: string[] };
  skipped: boolean;
  reason?: string;
}

@Injectable()
export class AiCofounderService {
  private readonly logger = new Logger(AiCofounderService.name);
  private readonly client: OpenAI | null;
  private readonly models: string[];
  private readonly temperature = 0.45;
  private readonly maxTokens = 2400;

  constructor(
    private readonly configService: ConfigService,
    private readonly launchPlanService: AiLaunchPlanService,
    private readonly publishService: AiPublishService,
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
          timeout: Number(this.configService.get<string>('AI_CREATE_TIMEOUT_MS') || 45000),
          ...(useOllamaCloud
            ? {}
            : {
                defaultHeaders: {
                  'HTTP-Referer': this.configService.get<string>('OPENROUTER_SITE_URL') || 'https://chabaqa.io',
                  'X-Title': this.configService.get<string>('OPENROUTER_APP_NAME') || 'Chabaqa AI Cofounder',
                },
              }),
        })
      : null;

    const primary =
      this.configService.get<string>('AI_CREATE_MODEL') ||
      this.configService.get<string>('AI_MODEL') ||
      (useOllamaCloud ? 'gpt-oss:20b-cloud' : 'google/gemini-2.5-flash-lite');
    const fallback =
      this.configService.get<string>('AI_CREATE_FALLBACK_MODELS') ||
      this.configService.get<string>('AI_FALLBACK_MODELS') ||
      (useOllamaCloud
        ? 'minimax-m2.1:cloud,glm-4.7:cloud'
        : 'google/gemini-2.0-flash-lite-001,mistralai/mistral-small-3.1-24b-instruct:free');
    this.models = [...new Set([primary, ...fallback.split(',')].map((v) => v.trim()).filter(Boolean))];
  }

  buildCommunity(input: BuildCommunityDto) {
    const title = `${input.niche} Studio`;
    return {
      type: 'community',
      reviewBadge: 'AI · Review before publish',
      draft: {
        nom: title,
        description: `${input.promise} for ${input.audience}.`,
        price: input.price ?? 0,
        currency: input.currency || 'TND',
        status: 'draft',
      },
      landingCopy: {
        headline: title,
        subheadline: input.promise,
        bullets: [
          `Built for ${input.audience}`,
          'Clear onboarding path',
          'Weekly creator-led momentum',
        ],
      },
      posts: [
        {
          title: 'Welcome and first win',
          content: `Introduce yourself and share what ${input.promise} means for you.`,
        },
        {
          title: 'Resource thread',
          content: 'Drop your best templates, examples, and questions here.',
        },
        {
          title: 'Accountability check-in',
          content:
            'What did you try this week, and what should we improve next?',
        },
      ],
    };
  }

  createLaunchPlan(input: CreateLaunchPlanDto, creatorId: string) {
    return this.launchPlanService.create(
      input.communityId,
      creatorId,
      input.durationDays,
      input.goal,
    );
  }

  fixFunnel(communityId: string) {
    return {
      communityId,
      reviewBadge: 'AI · Review before publish',
      insights: [
        'Tighten the promise above the fold',
        'Add a proof block before pricing',
        'Send one recovery email to warm leads',
      ],
      suggestedCopy: {
        headline: 'Make the first outcome obvious',
        cta: 'Start with the first lesson',
      },
    };
  }

  grow(communityId: string) {
    return {
      communityId,
      reviewBadge: 'AI · Review before publish',
      inactiveMembersQuery: { inactiveForDays: 14 },
      campaignDraft: {
        subject: 'A small reset for this week',
        preview: 'Come back with one simple action.',
        body: 'We prepared a small next step so you can regain momentum without catching up on everything.',
      },
    };
  }

  publishDraft(input: PublishDraftDto) {
    return this.publishService.publishDraft(
      input.draftType,
      input.draftPayload,
      input.confirm,
    );
  }

  /**
   * End-to-end AI onboarding wizard: generates a community draft + landing copy,
   * a first course draft, and a launch plan from a free-text creator description.
   */
  async generateOnboardingFlow(
    input: OnboardingFlowInput,
  ): Promise<OnboardingFlowResult> {
    if (!this.client) {
      return {
        community: this.buildCommunityFallback(input),
        course: this.buildCourseFallback(input),
        launchPlan: { durationDays: 7, goal: 'Launch', milestones: [] },
        skipped: true,
        reason: 'no-api-key',
      };
    }

    const prompt = [
      `Creator niche: ${input.niche}`,
      `Target audience: ${input.audience}`,
      `Core promise: ${input.promise}`,
      `Price: ${input.price ?? 0} ${input.currency || 'TND'}`,
      '',
      'Generate a JSON object with:',
      '  community.draft: {nom, description, price, currency, status}',
      '  community.landingCopy: {headline, subheadline, bullets: string[]}',
      '  community.posts: [{title, content}]',
      '  course.draft: {title, description, price, currency}',
      '  course.landingCopy: {headline, subheadline, bullets: string[]}',
      '  launchPlan: {durationDays, goal, milestones: string[]}',
      'Return ONLY valid JSON. No markdown.',
    ].join('\n');

    for (const model of this.models) {
      try {
        const completion = await this.client.chat.completions.create({
          model,
          temperature: this.temperature,
          max_tokens: this.maxTokens,
          messages: [
            { role: 'system', content: 'You are Chabaqa AI Cofounder. Return only valid JSON.' },
            { role: 'user', content: prompt },
          ],
        });
        const raw = String(completion.choices?.[0]?.message?.content || '').trim();
        const parsed = this.parseJsonObject(raw);
        if (parsed) {
          return {
            community: {
              draft: { ...this.buildCommunityFallback(input).draft, ...parsed.community?.draft },
              landingCopy: parsed.community?.landingCopy || this.buildCommunityFallback(input).landingCopy,
              posts: parsed.community?.posts || this.buildCommunityFallback(input).posts,
            },
            course: {
              draft: { ...this.buildCourseFallback(input).draft, ...parsed.course?.draft },
              landingCopy: parsed.course?.landingCopy || this.buildCourseFallback(input).landingCopy,
            },
            launchPlan: parsed.launchPlan || { durationDays: 7, goal: 'Launch', milestones: [] },
            skipped: false,
          };
        }
      } catch (error: any) {
        if (isUnsupportedImageInputError(error)) break;
        this.logger.warn(`Onboarding flow failed (${model}): ${error?.message || error}`);
      }
    }

    return {
      community: this.buildCommunityFallback(input),
      course: this.buildCourseFallback(input),
      launchPlan: { durationDays: 7, goal: 'Launch', milestones: [] },
      skipped: true,
      reason: 'provider-error',
    };
  }

  private parseJsonObject(raw: string): any | null {
    if (!raw) return null;
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    try { return JSON.parse(cleaned); } catch { return null; }
  }

  private buildCommunityFallback(input: OnboardingFlowInput) {
    const title = `${input.niche} Studio`;
    return {
      draft: { nom: title, description: `${input.promise} for ${input.audience}.`, price: input.price ?? 0, currency: input.currency || 'TND', status: 'draft' },
      landingCopy: { headline: title, subheadline: input.promise, bullets: [`Built for ${input.audience}`, 'Clear onboarding path', 'Weekly creator-led momentum'] },
      posts: [
        { title: 'Welcome and first win', content: `Introduce yourself and share what ${input.promise} means for you.` },
        { title: 'Resource thread', content: 'Drop your best templates, examples, and questions here.' },
        { title: 'Accountability check-in', content: 'What did you try this week, and what should we improve next?' },
      ],
    };
  }

  private buildCourseFallback(input: OnboardingFlowInput) {
    return {
      draft: { title: `First Course on ${input.niche}`, description: `${input.promise} — your first course for ${input.audience}.`, price: input.price ?? 0, currency: input.currency || 'TND' },
      landingCopy: { headline: `Learn ${input.niche}`, subheadline: input.promise, bullets: [] },
    };
  }
}
