import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subscription, SubscriptionDocument } from '@/infrastructure/database/schemas/commerce/subscription.schema';
import { Plan, PlanDocument, PlanFeatures, PlanLimits, PlanTier } from '@/infrastructure/database/schemas/commerce/plan.schema';

export interface EffectiveLimits {
  communitiesMax: number;
  membersMax: number;
  coursesActivationMax: number;
  storageGB: number;
  adminsMax: number;
  emailCampaignRecipientsPerMonth: number;
  whatsappMessagesPerMonth: number;
  analyticsLookbackDays: number;
  sessionBookingsPerMonth: number;
}

export interface PlanFeatureGateDetails {
  code: 'PLAN_FEATURE_REQUIRED';
  feature: keyof PlanFeatures;
  featureLabel: string;
  currentPlan: PlanTier;
  requiredPlan: PlanTier;
  message: string;
}

/** Returns true when plan enforcement is active (production mode). */
function isPlanEnforcementEnabled(): boolean {
  return process.env.PLAN_ENFORCEMENT_MODE === 'true';
}

/** Generous unlimited limits used when enforcement is OFF (dev / beta). */
const UNLIMITED_LIMITS: EffectiveLimits = {
  communitiesMax: 999,
  membersMax: 999999,
  coursesActivationMax: 9999,
  storageGB: 9999,
  adminsMax: 999,
  emailCampaignRecipientsPerMonth: 999999,
  whatsappMessagesPerMonth: 999999,
  analyticsLookbackDays: 365,
  sessionBookingsPerMonth: 999999,
};

const PLAN_ORDER: PlanTier[] = [PlanTier.STARTER, PlanTier.GROWTH, PlanTier.PRO];
const PLAN_NAMES: Record<string, string> = {
  [PlanTier.STARTER]: 'Starter',
  [PlanTier.GROWTH]: 'Growth',
  [PlanTier.PRO]: 'Pro',
  [PlanTier.ENTERPRISE]: 'Enterprise',
};

const FALLBACK_PLAN_LIMITS: Record<PlanTier.STARTER | PlanTier.GROWTH | PlanTier.PRO, EffectiveLimits> = {
  [PlanTier.STARTER]: {
    communitiesMax: 1,
    membersMax: 100,
    coursesActivationMax: 3,
    storageGB: 5,
    adminsMax: 1,
    emailCampaignRecipientsPerMonth: 0,
    whatsappMessagesPerMonth: 0,
    analyticsLookbackDays: 30,
    sessionBookingsPerMonth: 0,
  },
  [PlanTier.GROWTH]: {
    communitiesMax: 1,
    membersMax: 500,
    coursesActivationMax: 999999,
    storageGB: 50,
    adminsMax: 2,
    emailCampaignRecipientsPerMonth: 1000,
    whatsappMessagesPerMonth: 250,
    analyticsLookbackDays: 180,
    sessionBookingsPerMonth: 300,
  },
  [PlanTier.PRO]: {
    communitiesMax: 1,
    membersMax: 999999,
    coursesActivationMax: 999999,
    storageGB: 300,
    adminsMax: 3,
    emailCampaignRecipientsPerMonth: 15000,
    whatsappMessagesPerMonth: 1000,
    analyticsLookbackDays: 365,
    sessionBookingsPerMonth: 1000,
  },
};

const FEATURE_LABELS: Partial<Record<keyof PlanFeatures, string>> = {
  courses: 'Courses',
  products: 'Products',
  challenges: 'Challenges',
  sessions: '1:1 sessions',
  events: 'Events',
  automationQuota: 'Automation',
  branding: 'Remove Chabaqa branding',
  gamification: 'Gamification',
  verifiedBadge: 'Verified creator badge',
  featuredBadge: 'Featured creator badge',
};

const FEATURE_MINIMUM_PLAN: Partial<Record<keyof PlanFeatures, PlanTier>> = {
  challenges: PlanTier.GROWTH,
  sessions: PlanTier.GROWTH,
  events: PlanTier.GROWTH,
  automationQuota: PlanTier.GROWTH,
  gamification: PlanTier.GROWTH,
  verifiedBadge: PlanTier.GROWTH,
  branding: PlanTier.PRO,
  featuredBadge: PlanTier.PRO,
};

const LIMIT_LABELS: Record<keyof EffectiveLimits, string> = {
  communitiesMax: 'communities',
  membersMax: 'members',
  coursesActivationMax: 'active courses',
  storageGB: 'GB of storage',
  adminsMax: 'admin seats',
  emailCampaignRecipientsPerMonth: 'email recipients per month',
  whatsappMessagesPerMonth: 'WhatsApp messages per month',
  analyticsLookbackDays: 'analytics history days',
  sessionBookingsPerMonth: 'session bookings per month',
};

function formatLimit(value: number): string {
  return value >= 999999 ? 'unlimited' : value.toLocaleString('en-US');
}

@Injectable()
export class PolicyService {
  private readonly logger = new Logger(PolicyService.name);

  constructor(
    @InjectModel(Subscription.name) private readonly subModel: Model<SubscriptionDocument>,
    @InjectModel(Plan.name) private readonly planModel: Model<PlanDocument>,
  ) {}

  // ──────────────────────────────────────────────
  // Effective limits for a creator
  // ──────────────────────────────────────────────

  async getEffectiveLimitsForCreator(creatorId: Types.ObjectId | string): Promise<EffectiveLimits> {
    if (!isPlanEnforcementEnabled()) return UNLIMITED_LIMITS;

    const sub = await this.subModel
      .findOne({ creatorId: new Types.ObjectId(creatorId as any) })
      .lean();

    if (!sub) {
      // No subscription → most restrictive defaults (STARTER baseline)
      return {
        communitiesMax: 1,
        membersMax: 100,
        coursesActivationMax: 3,
        storageGB: 5,
        adminsMax: 1,
        emailCampaignRecipientsPerMonth: 0,
        whatsappMessagesPerMonth: 0,
        analyticsLookbackDays: 30,
        sessionBookingsPerMonth: 0,
      };
    }

    return {
      communitiesMax: sub.communitiesMax,
      membersMax: sub.membersMax,
      coursesActivationMax: sub.coursesActivationMax,
      storageGB: sub.storageGB,
      adminsMax: sub.adminsMax,
      emailCampaignRecipientsPerMonth: sub.emailCampaignRecipientsPerMonth ?? 0,
      whatsappMessagesPerMonth: sub.whatsappMessagesPerMonth ?? 0,
      analyticsLookbackDays: sub.analyticsLookbackDays ?? 30,
      sessionBookingsPerMonth: sub.sessionBookingsPerMonth ?? 0,
    };
  }

  // ──────────────────────────────────────────────
  // Active subscription check
  // ──────────────────────────────────────────────

  async hasActiveSubscription(creatorId: Types.ObjectId | string): Promise<boolean> {
    if (!isPlanEnforcementEnabled()) return true;

    const now = new Date();
    const sub = await this.subModel
      .findOne({ creatorId: new Types.ObjectId(creatorId as any) })
      .lean();
    if (!sub) return false;
    if (sub.status === 'active') return true;
    if (sub.status === 'trialing' && sub.trialEndsAt && new Date(sub.trialEndsAt).getTime() > now.getTime()) return true;
    return false;
  }

  // ──────────────────────────────────────────────
  // Feature-level gating (NEW)
  // ──────────────────────────────────────────────

  /**
   * Check whether the creator's plan includes a specific boolean feature.
   * Returns `true` when enforcement is OFF.
   */
  async canUseFeature(
    creatorId: Types.ObjectId | string,
    feature: keyof PlanFeatures,
  ): Promise<boolean> {
    if (!isPlanEnforcementEnabled()) return true;

    const plan = await this.getPlanForCreator(creatorId);
    if (!plan) return false;

    const value = plan.features[feature];
    return typeof value === 'boolean' ? value : (value as number) > 0;
  }

  /**
   * Load the Plan document for a creator (via their subscription tier).
   */
  async getPlanForCreator(creatorId: Types.ObjectId | string): Promise<Plan | null> {
    const sub = await this.subModel
      .findOne({ creatorId: new Types.ObjectId(creatorId as any) })
      .lean();
    if (!sub) return null;

    return this.planModel.findOne({ tier: sub.plan }).lean();
  }

  async getCurrentPlanTierForCreator(creatorId: Types.ObjectId | string): Promise<PlanTier> {
    const sub = await this.subModel
      .findOne({ creatorId: new Types.ObjectId(creatorId as any) })
      .select('plan')
      .lean();

    return (sub?.plan as PlanTier) || PlanTier.STARTER;
  }

  async buildFeatureUpgradeMessage(
    creatorId: Types.ObjectId | string,
    feature: keyof PlanFeatures,
  ): Promise<string> {
    const details = await this.buildFeatureGateDetails(creatorId, feature);
    return details.message;
  }

  async buildFeatureGateDetails(
    creatorId: Types.ObjectId | string,
    feature: keyof PlanFeatures,
  ): Promise<PlanFeatureGateDetails> {
    const currentTier = await this.getCurrentPlanTierForCreator(creatorId);
    const requiredTier = FEATURE_MINIMUM_PLAN[feature] || PlanTier.PRO;
    const featureLabel = FEATURE_LABELS[feature] || String(feature);
    const message = `${featureLabel} is not included in your current ${PLAN_NAMES[currentTier] || currentTier} plan. Upgrade to ${PLAN_NAMES[requiredTier] || requiredTier} or higher to unlock this feature.`;

    return {
      code: 'PLAN_FEATURE_REQUIRED',
      feature,
      featureLabel,
      currentPlan: currentTier,
      requiredPlan: requiredTier,
      message,
    };
  }

  async buildLimitUpgradeMessage(
    creatorId: Types.ObjectId | string,
    limitKey: keyof EffectiveLimits,
    currentUsage: number,
  ): Promise<string> {
    const currentTier = await this.getCurrentPlanTierForCreator(creatorId);
    const limits = await this.getEffectiveLimitsForCreator(creatorId);
    const currentLimit = limits[limitKey] ?? 0;
    const label = LIMIT_LABELS[limitKey] || String(limitKey);
    const recommendedTier = await this.findRecommendedPlanForLimit(limitKey, currentLimit, currentTier);
    const usageText = `${currentUsage.toLocaleString('en-US')} / ${formatLimit(currentLimit)}`;

    if (recommendedTier) {
      return `You have reached your ${PLAN_NAMES[currentTier] || currentTier} plan limit for ${label} (${usageText}). Upgrade to ${PLAN_NAMES[recommendedTier] || recommendedTier} to increase this limit and continue.`;
    }

    return `You have reached your ${PLAN_NAMES[currentTier] || currentTier} plan limit for ${label} (${usageText}). No higher self-service plan currently increases this limit; contact support if you need more capacity.`;
  }

  private async findRecommendedPlanForLimit(
    limitKey: keyof EffectiveLimits,
    currentLimit: number,
    currentTier: PlanTier,
  ): Promise<PlanTier | null> {
    const currentIndex = PLAN_ORDER.indexOf(currentTier);
    const candidateTiers = PLAN_ORDER.slice(Math.max(currentIndex + 1, 0));

    for (const tier of candidateTiers) {
      const dbPlan = await this.planModel.findOne({ tier, isActive: true }).select('limits').lean();
      const candidateLimit = (dbPlan?.limits?.[limitKey as keyof PlanLimits] as number | undefined)
        ?? FALLBACK_PLAN_LIMITS[tier as PlanTier.STARTER | PlanTier.GROWTH | PlanTier.PRO]?.[limitKey]
        ?? 0;

      if (candidateLimit > currentLimit) {
        return tier;
      }
    }

    return null;
  }

  // ──────────────────────────────────────────────
  // Quota helpers (NEW)
  // ──────────────────────────────────────────────

  /**
   * Returns remaining automation/whatsapp quota for this billing period.
   * Returns a large number when enforcement is OFF.
   */
  async getRemainingQuota(
    creatorId: Types.ObjectId | string,
    quotaType: 'automation' | 'whatsapp' | 'emailCampaign' | 'sessionBookings',
    currentUsage: number,
  ): Promise<number> {
    if (!isPlanEnforcementEnabled()) return 999999;

    const limits = await this.getEffectiveLimitsForCreator(creatorId);

    let max: number;
    switch (quotaType) {
      case 'automation':
        const plan = await this.getPlanForCreator(creatorId);
        max = plan?.features?.automationQuota ?? 0;
        break;
      case 'whatsapp':
        max = limits.whatsappMessagesPerMonth;
        break;
      case 'emailCampaign':
        max = limits.emailCampaignRecipientsPerMonth;
        break;
      case 'sessionBookings':
        max = limits.sessionBookingsPerMonth;
        break;
      default:
        max = 0;
    }

    return Math.max(0, max - currentUsage);
  }

  /**
   * Get the analytics lookback days allowed for a creator.
   */
  async getAnalyticsLookbackDays(creatorId: Types.ObjectId | string): Promise<number> {
    if (!isPlanEnforcementEnabled()) return 365;

    const limits = await this.getEffectiveLimitsForCreator(creatorId);
    return limits.analyticsLookbackDays;
  }

  // ──────────────────────────────────────────────
  // Numeric limit checks (existing — unchanged API)
  // ──────────────────────────────────────────────

  async canActivateMoreCourses(creatorId: Types.ObjectId | string, currentActiveCount: number): Promise<boolean> {
    const limits = await this.getEffectiveLimitsForCreator(creatorId);
    return currentActiveCount < limits.coursesActivationMax;
  }

  async canCreateAnotherCommunity(creatorId: Types.ObjectId | string, currentCommunitiesCount: number): Promise<boolean> {
    const limits = await this.getEffectiveLimitsForCreator(creatorId);
    return currentCommunitiesCount < limits.communitiesMax;
  }

  async canAddMember(creatorId: Types.ObjectId | string, currentMembersCount: number): Promise<boolean> {
    const limits = await this.getEffectiveLimitsForCreator(creatorId);
    return currentMembersCount < limits.membersMax;
  }

  async canAddAdmin(creatorId: Types.ObjectId | string, currentAdminsCount: number): Promise<boolean> {
    const limits = await this.getEffectiveLimitsForCreator(creatorId);
    return currentAdminsCount < limits.adminsMax;
  }
}


