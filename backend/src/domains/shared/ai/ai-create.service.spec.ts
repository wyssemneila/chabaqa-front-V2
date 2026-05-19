import { ConfigService } from '@nestjs/config';
import { AiCreateService } from '@/domains/shared/ai/ai-create.service';

describe('AiCreateService', () => {
  const makeService = () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'AI_PROVIDER') return 'OPENROUTER';
        return undefined;
      }),
    };
    return new AiCreateService(config as unknown as ConfigService);
  };

  it('returns a reviewable fallback course draft when no provider key is configured', async () => {
    const service = makeService();

    const result = await service.generateDraft({
      type: 'course',
      idea: 'A practical course for coaches to package and sell their first paid group program',
      audience: 'new coaches',
      outcome: 'launch a paid group program',
      niche: 'coaching',
      difficulty: 'beginner',
      monetization: 'paid',
      price: 99,
      currency: 'TND',
      language: 'English',
    });

    const draft = result.draft as any;
    expect(result.type).toBe('course');
    expect(draft.titre).toBeTruthy();
    expect(draft.isPublished).toBe(false);
    expect(draft.sections).toHaveLength(3);
    expect(result.landingPage.bullets.length).toBeGreaterThan(0);
    expect(result.launchCampaign.emailBody).toContain('Hi');
    expect(result.reviewChecklist.length).toBeGreaterThan(0);
  });
});
