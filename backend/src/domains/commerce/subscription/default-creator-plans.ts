import { PlanTier } from '@/infrastructure/database/schemas/commerce/plan.schema';

export const DEFAULT_CREATOR_PLAN_DOCS = [
  {
    tier: PlanTier.STARTER,
    name: 'Starter',
    priceDTPerMonth: 39,
    yearlyPriceDTPerMonth: 31,
    yearlyTotalDT: 372,
    trialDays: 7,
    limits: {
      communitiesMax: 1,
      membersMax: 100,
      coursesActivationMax: 3,
      storageGB: 5,
      adminsMax: 1,
      emailCampaignRecipientsPerMonth: 0,
      whatsappMessagesPerMonth: 0,
      analyticsLookbackDays: 30,
      sessionBookingsPerMonth: 0,
      creatorFieldGenerationsPerMonth: 25,
    },
    features: {
      courses: true,
      products: true,
      challenges: false,
      sessions: false,
      events: false,
      automationQuota: 0,
      branding: false,
      gamification: false,
      verifiedBadge: false,
      featuredBadge: false,
    },
    transactionFeePercent: 7.9,
    transactionFixedFeeDT: 0.5,
    isActive: true,
  },
  {
    tier: PlanTier.GROWTH,
    name: 'Growth',
    priceDTPerMonth: 99,
    yearlyPriceDTPerMonth: 79,
    yearlyTotalDT: 948,
    trialDays: 7,
    limits: {
      communitiesMax: 1,
      membersMax: 500,
      coursesActivationMax: 999999,
      storageGB: 50,
      adminsMax: 2,
      emailCampaignRecipientsPerMonth: 1000,
      whatsappMessagesPerMonth: 250,
      analyticsLookbackDays: 180,
      sessionBookingsPerMonth: 300,
      creatorFieldGenerationsPerMonth: 150,
    },
    features: {
      courses: true,
      products: true,
      challenges: true,
      sessions: true,
      events: true,
      automationQuota: 1000,
      branding: false,
      gamification: true,
      verifiedBadge: true,
      featuredBadge: false,
    },
    transactionFeePercent: 4.9,
    transactionFixedFeeDT: 0.5,
    isActive: true,
  },
  {
    tier: PlanTier.PRO,
    name: 'Pro',
    priceDTPerMonth: 159,
    yearlyPriceDTPerMonth: 127,
    yearlyTotalDT: 1524,
    trialDays: 7,
    limits: {
      communitiesMax: 1,
      membersMax: 999999,
      coursesActivationMax: 999999,
      storageGB: 300,
      adminsMax: 3,
      emailCampaignRecipientsPerMonth: 15000,
      whatsappMessagesPerMonth: 1000,
      analyticsLookbackDays: 365,
      sessionBookingsPerMonth: 1000,
      creatorFieldGenerationsPerMonth: 500,
    },
    features: {
      courses: true,
      products: true,
      challenges: true,
      sessions: true,
      events: true,
      automationQuota: 15000,
      branding: true,
      gamification: true,
      verifiedBadge: true,
      featuredBadge: true,
    },
    transactionFeePercent: 2.9,
    transactionFixedFeeDT: 0.5,
    isActive: true,
  },
] as const;

export function normalizeCreatorPlanTier(tier: string): PlanTier | null {
  const normalized = String(tier || '').trim().toLowerCase();
  return Object.values(PlanTier).includes(normalized as PlanTier)
    ? (normalized as PlanTier)
    : null;
}

export function getDefaultCreatorPlanDoc(tier: string) {
  const normalized = normalizeCreatorPlanTier(tier);
  return DEFAULT_CREATOR_PLAN_DOCS.find((plan) => plan.tier === normalized) || null;
}
