import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { isUnsupportedImageInputError } from '@/shared/utils/ai-error.util';
import { CreateWithAiDto } from '@/domains/shared/ai/dto/create-with-ai.dto';

type DraftPayload = Record<string, any>;

@Injectable()
export class AiCreateService {
  private readonly logger = new Logger(AiCreateService.name);
  private readonly client: OpenAI;
  private readonly models: string[];
  private readonly temperature: number;
  private readonly maxTokens: number;

  constructor(private readonly configService: ConfigService) {
    const aiProvider = (this.configService.get<string>('AI_PROVIDER') || 'OPENROUTER').toUpperCase();
    const useOllamaCloud = aiProvider === 'OLLAMA_CLOUD';
    const apiKey = useOllamaCloud
      ? this.configService.get<string>('OLLAMA_API_KEY') || ''
      : this.configService.get<string>('OPENROUTER_API_KEY') || '';
    const baseURL = useOllamaCloud
      ? this.configService.get<string>('OLLAMA_BASE_URL') || 'https://ollama.com/v1'
      : this.configService.get<string>('OPENROUTER_BASE_URL') || 'https://openrouter.ai/api/v1';

    this.client = new OpenAI({
      apiKey,
      baseURL,
      timeout: Number(this.configService.get<string>('AI_CREATE_TIMEOUT_MS') || 45000),
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
                'Chabaqa AI Cofounder',
            },
          }),
    });

    const primary =
      this.configService.get<string>('AI_CREATE_MODEL') ||
      this.configService.get<string>('AI_MODEL') ||
      (useOllamaCloud ? 'gpt-oss:20b-cloud' : 'google/gemini-2.5-flash-lite');
    const fallback =
      this.configService.get<string>('AI_CREATE_FALLBACK_MODELS') ||
      this.configService.get<string>('AI_FALLBACK_MODELS') ||
      (useOllamaCloud
        ? 'minimax-m2.1:cloud,glm-4.7:cloud'
        : 'google/gemini-2.0-flash-001,google/gemini-2.0-flash-lite-001,mistralai/mistral-small-3.1-24b-instruct:free');
    this.models = [...new Set([primary, ...fallback.split(',')].map((v) => v.trim()).filter(Boolean))];
    this.temperature = Number(this.configService.get<string>('AI_CREATE_TEMPERATURE') || 0.45);
    this.maxTokens = Math.min(
      Math.max(Number(this.configService.get<string>('AI_CREATE_MAX_OUTPUT_TOKENS') || 2400), 700),
      5000,
    );
  }

  async generateDraft(input: CreateWithAiDto) {
    if (!this.hasApiKey()) {
      return this.buildFallbackDraft(input, 'fallback-no-api-key');
    }

    const prompt = this.buildPrompt(input);
    let lastError: any = null;

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
                'You are Chabaqa AI Cofounder. Return only valid JSON for draft objects creators can review before publishing. No markdown.',
            },
            { role: 'user', content: prompt },
          ],
        });
        const raw = completion.choices?.[0]?.message?.content?.trim() || '';
        const parsed = this.parseJsonObject(raw);
        const draft = this.normalizeDraft(input, parsed);
        return { ...draft, model, promptVersion: 'ai-create-v1' };
      } catch (error) {
        if (isUnsupportedImageInputError(error)) break;
        lastError = error;
        this.logger.warn(`AI create failed (${model}): ${(error as any)?.message || error}`);
      }
    }

    if (this.configService.get<string>('AI_CREATE_ALLOW_FALLBACK') !== 'false') {
      return this.buildFallbackDraft(input, 'fallback-provider-error');
    }
    throw new ServiceUnavailableException((lastError as any)?.message || 'AI generation failed');
  }

  private hasApiKey() {
    const provider = (this.configService.get<string>('AI_PROVIDER') || 'OPENROUTER').toUpperCase();
    return Boolean(this.configService.get<string>(provider === 'OLLAMA_CLOUD' ? 'OLLAMA_API_KEY' : 'OPENROUTER_API_KEY'));
  }

  private buildPrompt(input: CreateWithAiDto) {
    return [
      `Create a ${input.type} draft for Chabaqa, a paid learning community platform.`,
      `Idea: ${input.idea}`,
      `Audience: ${input.audience}`,
      `Desired outcome: ${input.outcome}`,
      `Niche: ${input.niche || 'infer'}`,
      `Difficulty: ${input.difficulty || 'beginner'}`,
      `Monetization: ${input.monetization || 'paid'}`,
      `Price: ${input.price ?? 'suggest'}`,
      `Currency: ${input.currency || 'TND'}`,
      `Language: ${input.language || 'English'}`,
      `Must include: ${(input.includes || []).join(', ') || 'practical outcomes, launch copy, and review notes'}`,
      'Return JSON with shape: { "draft": object, "landingPage": { "headline": string, "subheadline": string, "bullets": string[], "faq": [{"question": string, "answer": string}] }, "launchCampaign": { "subject": string, "preview": string, "emailBody": string, "dmScript": string }, "reviewChecklist": string[] }.',
      'For course draft use fields: titre, description, prix, isPaid, devise, category, niveau, duree, learningObjectives, requirements, notes, sections[{titre,description,ordre,chapitres[{titre,description,isPaid,prix,ordre,duree,notes}]}].',
      'For challenge draft use: title, description, startDate, endDate, category, difficulty, duration, isActive, sequentialProgression, participationFee, currency, depositRequired, isPremium, tasks[{day,title,description,deliverable,points,isActive,instructions,notes,resources[]}], resources[].',
      'For event draft use: title, description, startDate, endDate, startTime, endTime, timezone, category, type, location, onlineUrl, isActive, isPublished, sessions[], tickets[], speakers[], tags[].',
      'For product draft use: title, description, price, currency, category, type, isPublished, inventory, variants[], files[], licenseTerms, features[].',
      'For session draft use: title, description, duration, price, currency, category, maxBookingsPerWeek, notes, isActive, resources[].',
    ].join('\n');
  }

  private normalizeDraft(input: CreateWithAiDto, parsed: any) {
    const fallback = this.buildFallbackDraft(input, 'normalized-fallback');
    const draft = parsed?.draft && typeof parsed.draft === 'object' ? parsed.draft : {};
    return {
      type: input.type,
      draft: this.withDefaults(input, { ...fallback.draft, ...draft }),
      landingPage: this.normalizeLanding(parsed?.landingPage, fallback.landingPage),
      launchCampaign: { ...fallback.launchCampaign, ...(parsed?.launchCampaign || {}) },
      reviewChecklist: this.stringArray(parsed?.reviewChecklist, fallback.reviewChecklist).slice(0, 8),
    };
  }

  private withDefaults(input: CreateWithAiDto, draft: DraftPayload) {
    const price = input.monetization === 'free' ? 0 : Number(input.price ?? draft.price ?? draft.prix ?? 49);
    const currency = input.currency || draft.currency || draft.devise || 'TND';
    if (input.type === 'course') return { ...draft, prix: price, isPaid: price > 0, devise: currency, isPublished: false };
    if (input.type === 'challenge') return { ...draft, participationFee: price, currency, isActive: false };
    if (input.type === 'event') return { ...draft, isActive: true, isPublished: false };
    if (input.type === 'product') return { ...draft, price, currency, isPublished: false, type: draft.type || 'digital' };
    return { ...draft, price, currency, isActive: false };
  }

  private buildFallbackDraft(input: CreateWithAiDto, reason: string) {
    const title = this.titleFromIdea(input.idea);
    const price = input.monetization === 'free' ? 0 : input.price ?? 49;
    const currency = input.currency || 'TND';
    const common = {
      landingPage: {
        headline: title,
        subheadline: `A practical path for ${input.audience} to ${input.outcome}.`,
        bullets: ['Clear promise', 'Practical steps', 'Review before publishing'],
        faq: [{ question: 'Who is this for?', answer: input.audience }],
      },
      launchCampaign: {
        subject: `Introducing ${title}`,
        preview: `A new Chabaqa offer for ${input.audience}.`,
        emailBody: `Hi,\n\nI built ${title} to help you ${input.outcome}. Join us inside the community and start with the first step today.\n\nSee you inside.`,
        dmScript: `I made ${title} for ${input.audience}. Want me to send you the details?`,
      },
      reviewChecklist: ['Check the promise', 'Adjust pricing', 'Review dates and duration', 'Add your brand voice'],
      model: reason,
      promptVersion: 'ai-create-v1',
    };

    if (input.type === 'course') {
      return {
        type: input.type,
        draft: {
          titre: title,
          description: `A focused course helping ${input.audience} ${input.outcome}.`,
          prix: price,
          isPaid: price > 0,
          devise: currency,
          category: input.niche || 'Education',
          niveau: input.difficulty || 'beginner',
          duree: '3h',
          learningObjectives: [input.outcome, 'Apply the core method', 'Build a practical result'],
          requirements: ['Motivation to practice', 'Basic familiarity with the topic'],
          notes: 'Generated by Chabaqa AI Cofounder. Review before publishing.',
          isPublished: false,
          sections: [1, 2, 3].map((n) => ({
            titre: `Module ${n}: ${n === 1 ? 'Foundation' : n === 2 ? 'Practice' : 'Launch'}`,
            description: `Step ${n} toward ${input.outcome}.`,
            ordre: n,
            chapitres: [1, 2].map((c) => ({
              titre: `Lesson ${n}.${c}`,
              description: `A practical lesson for ${input.audience}.`,
              isPaid: price > 0,
              prix: 0,
              ordre: c,
              duree: '15:00',
              notes: '',
            })),
          })),
        },
        ...common,
      };
    }

    const base: any = {
      title,
      description: `A focused ${input.type} helping ${input.audience} ${input.outcome}.`,
      category: input.niche || 'Creator offer',
    };
    return {
      type: input.type,
      draft: this.withDefaults(input, {
        ...base,
        difficulty: input.difficulty || 'beginner',
        duration: input.type === 'session' ? 60 : '7 days',
        startDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        endDate: new Date(Date.now() + 14 * 86400000).toISOString(),
        startTime: '18:00',
        endTime: '19:30',
        timezone: 'Africa/Tunis',
        type: input.type === 'event' ? 'Online' : 'digital',
        onlineUrl: 'https://example.com/live',
        tasks: [1, 2, 3, 4, 5].map((day) => ({
          day,
          title: `Day ${day} action`,
          description: `Complete one practical step toward ${input.outcome}.`,
          deliverable: 'Share your progress in the community.',
          points: 100,
          isActive: true,
          instructions: 'Keep it small, visible, and reviewable.',
          resources: [],
        })),
        resources: [],
        sessions: [],
        tickets: [{ type: price > 0 ? 'regular' : 'free', name: 'General access', price, description: 'Standard access' }],
        speakers: [],
        tags: [input.niche || 'learning'],
        variants: [],
        files: [],
        licenseTerms: 'Personal use license.',
        features: ['Action plan', 'Templates', 'Community support'],
        maxBookingsPerWeek: 5,
        notes: 'Generated by Chabaqa AI Cofounder. Review before publishing.',
      }),
      ...common,
    };
  }

  private titleFromIdea(idea: string) {
    const words = idea.replace(/[^\w\s-]/g, '').split(/\s+/).filter(Boolean).slice(0, 8);
    return words.map((w) => w[0]?.toUpperCase() + w.slice(1)).join(' ') || 'New Chabaqa Offer';
  }

  private normalizeLanding(value: any, fallback: any) {
    return {
      headline: String(value?.headline || fallback.headline).slice(0, 140),
      subheadline: String(value?.subheadline || fallback.subheadline).slice(0, 260),
      bullets: this.stringArray(value?.bullets, fallback.bullets).slice(0, 6),
      faq: Array.isArray(value?.faq) ? value.faq.slice(0, 6) : fallback.faq,
    };
  }

  private stringArray(value: any, fallback: string[]) {
    return (Array.isArray(value) ? value : fallback).map((v) => String(v).trim()).filter(Boolean);
  }

  private parseJsonObject(raw: string) {
    const cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch {}
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Invalid JSON response');
  }
}
