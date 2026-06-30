import { Injectable, Logger } from '@nestjs/common';

export type AiModerationResult = {
  score: number;
  status: 'approved' | 'flagged';
  reasons: string[];
  provider: 'openrouter' | 'heuristic';
};

@Injectable()
export class AiContentModerationService {
  private readonly logger = new Logger(AiContentModerationService.name);

  async analyze(input: { title?: string; body?: string; type: string }): Promise<AiModerationResult> {
    const text = [input.title, input.body].filter(Boolean).join('\n').slice(0, 8000);
    if (!text.trim()) return { score: 0, status: 'approved', reasons: [], provider: 'heuristic' };

    if (process.env.OPENROUTER_API_KEY) {
      const result = await this.analyzeWithOpenRouter(text, input.type).catch((error) => {
        this.logger.warn(`OpenRouter moderation failed, using heuristic fallback: ${error?.message || error}`);
        return null;
      });
      if (result) return result;
    }

    return this.analyzeHeuristically(text);
  }

  private async analyzeWithOpenRouter(text: string, type: string): Promise<AiModerationResult> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODERATION_MODEL || 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Return strict JSON only: {"score":0-100,"reasons":["..."],"status":"approved|flagged"}. Flag hate, harassment, sexual content involving minors, self-harm instructions, scams, illegal activity, explicit violence, and spam.' },
          { role: 'user', content: `Moderate this ${type} content:\n${text}` },
        ],
        temperature: 0,
        response_format: { type: 'json_object' },
      }),
    });
    if (!response.ok) throw new Error(`OpenRouter returned ${response.status}`);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content) as Partial<AiModerationResult>;
    const score = Math.max(0, Math.min(100, Number(parsed.score || 0)));
    return {
      score,
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons.map(String).slice(0, 5) : [],
      status: parsed.status === 'flagged' || score >= this.threshold() ? 'flagged' : 'approved',
      provider: 'openrouter',
    };
  }

  private analyzeHeuristically(text: string): AiModerationResult {
    const lower = text.toLowerCase();
    const rules = [
      { label: 'spam_or_scam', pattern: /free money|guaranteed profit|crypto pump|click here now|wire transfer/i, weight: 35 },
      { label: 'harassment', pattern: /kill yourself|worthless|idiot|stupid/i, weight: 30 },
      { label: 'violence', pattern: /how to make a bomb|attack plan|weapon instructions/i, weight: 50 },
      { label: 'adult_content', pattern: /explicit sexual|porn|nude/i, weight: 35 },
      { label: 'hate', pattern: /racial slur|hate group/i, weight: 50 },
    ];
    const matches = rules.filter((rule) => rule.pattern.test(lower));
    const score = Math.min(100, matches.reduce((sum, match) => sum + match.weight, 0));
    return { score, status: score >= this.threshold() ? 'flagged' : 'approved', reasons: matches.map((match) => match.label), provider: 'heuristic' };
  }

  private threshold(): number {
    return Number(process.env.AI_MODERATION_FLAG_THRESHOLD || 70);
  }
}
