import { PLAN_SEED_DOCS } from './seed-plans';
import { PlanTier } from '@/infrastructure/database/schemas/commerce/plan.schema';

describe('PLAN_SEED_DOCS', () => {
  it('keeps creator plan pricing, limits, and fees aligned with the public contract', () => {
    expect(PLAN_SEED_DOCS).toEqual([
      expect.objectContaining({
        tier: PlanTier.STARTER,
        priceDTPerMonth: 39,
        yearlyPriceDTPerMonth: 31,
        yearlyTotalDT: 372,
        trialDays: 7,
        transactionFeePercent: 7.9,
        transactionFixedFeeDT: 0.5,
        limits: expect.objectContaining({
          communitiesMax: 1,
          membersMax: 100,
          coursesActivationMax: 3,
          storageGB: 5,
          adminsMax: 1,
        }),
        features: expect.objectContaining({
          courses: true,
          products: true,
          challenges: false,
          sessions: false,
          events: false,
          branding: false,
        }),
      }),
      expect.objectContaining({
        tier: PlanTier.GROWTH,
        priceDTPerMonth: 99,
        yearlyPriceDTPerMonth: 79,
        yearlyTotalDT: 948,
        trialDays: 7,
        transactionFeePercent: 4.9,
        transactionFixedFeeDT: 0.5,
        limits: expect.objectContaining({
          communitiesMax: 1,
          membersMax: 500,
          coursesActivationMax: 999999,
          storageGB: 50,
          adminsMax: 2,
          emailCampaignRecipientsPerMonth: 1000,
          whatsappMessagesPerMonth: 250,
          sessionBookingsPerMonth: 300,
        }),
        features: expect.objectContaining({
          challenges: true,
          sessions: true,
          events: true,
          branding: false,
          gamification: true,
          verifiedBadge: true,
        }),
      }),
      expect.objectContaining({
        tier: PlanTier.PRO,
        priceDTPerMonth: 159,
        yearlyPriceDTPerMonth: 127,
        yearlyTotalDT: 1524,
        trialDays: 7,
        transactionFeePercent: 2.9,
        transactionFixedFeeDT: 0.5,
        limits: expect.objectContaining({
          communitiesMax: 1,
          membersMax: 999999,
          coursesActivationMax: 999999,
          storageGB: 300,
          adminsMax: 3,
          emailCampaignRecipientsPerMonth: 15000,
          whatsappMessagesPerMonth: 1000,
          sessionBookingsPerMonth: 1000,
        }),
        features: expect.objectContaining({
          challenges: true,
          sessions: true,
          events: true,
          branding: true,
          featuredBadge: true,
        }),
      }),
    ]);
  });
});
