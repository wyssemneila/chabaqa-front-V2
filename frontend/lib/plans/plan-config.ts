/**
 * Canonical plan configuration — single source of truth for all plan data.
 * Mirrors the backend seed-plans.ts values exactly.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type PlanTier = 'starter' | 'growth' | 'pro';

export interface PlanLimits {
  membersMax: number;
  adminsMax: number;
  coursesActivationMax: number;
  storageGB: number;
  emailCampaignRecipientsPerMonth: number;
  whatsappMessagesPerMonth: number;
  sessionBookingsPerMonth: number;
  analyticsLookbackDays: number;
}

export interface PlanFeatures {
  courses: boolean;
  products: boolean;
  challenges: boolean;
  sessions: boolean;
  events: boolean;
  branding: boolean;
  gamification: boolean;
  verifiedBadge: boolean;
  featuredBadge: boolean;
}

export interface Plan {
  tier: PlanTier;
  name: string;
  monthlyPrice: number;
  yearlyMonthlyPrice: number;
  yearlyTotal: number;
  transactionFee: number;
  currency: string;
  trialDays: number;
  highlight?: boolean;
  limits: PlanLimits;
  features: PlanFeatures;
}

export type PlanMap = Record<PlanTier, Plan>;

// ── ENV Flag ───────────────────────────────────────────────────────────────

export const PLAN_ENFORCEMENT_MODE =
  process.env.NEXT_PUBLIC_PLAN_ENFORCEMENT_MODE === 'true';

// ── Plan Definitions ───────────────────────────────────────────────────────

export const PLANS: PlanMap = {
  starter: {
    tier: 'starter',
    name: 'Starter',
    monthlyPrice: 39,
    yearlyMonthlyPrice: 31,
    yearlyTotal: 372,
    transactionFee: 7.9,
    currency: 'TND',
    trialDays: 7,
    limits: {
      membersMax: 100, adminsMax: 1, coursesActivationMax: 3, storageGB: 5,
      emailCampaignRecipientsPerMonth: 0, whatsappMessagesPerMonth: 0,
      sessionBookingsPerMonth: 0, analyticsLookbackDays: 30,
    },
    features: {
      courses: true, products: true, challenges: false, sessions: false,
      events: false, branding: false, gamification: false,
      verifiedBadge: false, featuredBadge: false,
    },
  },
  growth: {
    tier: 'growth',
    name: 'Growth',
    monthlyPrice: 99,
    yearlyMonthlyPrice: 79,
    yearlyTotal: 948,
    transactionFee: 4.9,
    currency: 'TND',
    trialDays: 7,
    highlight: true,
    limits: {
      membersMax: 500, adminsMax: 2, coursesActivationMax: 999, storageGB: 50,
      emailCampaignRecipientsPerMonth: 1000, whatsappMessagesPerMonth: 250,
      sessionBookingsPerMonth: 300, analyticsLookbackDays: 180,
    },
    features: {
      courses: true, products: true, challenges: true, sessions: true,
      events: true, branding: false, gamification: true,
      verifiedBadge: true, featuredBadge: false,
    },
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    monthlyPrice: 159,
    yearlyMonthlyPrice: 127,
    yearlyTotal: 1524,
    transactionFee: 2.9,
    currency: 'TND',
    trialDays: 7,
    limits: {
      membersMax: 999999, adminsMax: 3, coursesActivationMax: 999999, storageGB: 300,
      emailCampaignRecipientsPerMonth: 15000, whatsappMessagesPerMonth: 1000,
      sessionBookingsPerMonth: 1000, analyticsLookbackDays: 365,
    },
    features: {
      courses: true, products: true, challenges: true, sessions: true,
      events: true, branding: true, gamification: true,
      verifiedBadge: true, featuredBadge: true,
    },
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────

export const PLAN_TIERS: PlanTier[] = ['starter', 'growth', 'pro'];

export function minimumPlanForFeature(feature: keyof PlanFeatures): PlanTier {
  for (const tier of PLAN_TIERS) {
    if (PLANS[tier].features[feature]) return tier;
  }
  return 'pro';
}

export function formatLimit(value: number, suffix = ''): string {
  if (value >= 999999) return 'Unlimited';
  if (value >= 999) return 'Unlimited';
  return `${value.toLocaleString()}${suffix}`;
}

export const ADD_ONS = {
  extraAdminSeat: { priceTND: 15, label: 'Extra admin seat', per: '/month' },
  extraStorage: {
    starter: { priceTND: 12, per100GB: true },
    growth: { priceTND: 10, per100GB: true },
    pro: { priceTND: 9, per100GB: true },
  },
} as const;
