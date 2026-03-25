import { apiClient, ApiSuccessResponse, PaginatedResponse } from './client';
import type { User } from './types';

// ============ ENUMS ============

export enum PlanTier {
  STARTER = 'starter',
  GROWTH = 'growth',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  TRIALING = 'trialing',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAID = 'paid',
  VOID = 'void',
  UNCOLLECTIBLE = 'uncollectible',
}

export enum UsageMetricType {
  COMMUNITIES_CREATED = 'communities_created',
  MEMBERS_ADDED = 'members_added',
  COURSES_ACTIVATED = 'courses_activated',
  STORAGE_USED = 'storage_used',
  ADMINS_ADDED = 'admins_added',
  API_REQUESTS = 'api_requests',
  EMAIL_SENT = 'email_sent',
  AUTOMATION_TRIGGERED = 'automation_triggered',
}

// ============ INTERFACES & TYPES ============

export interface PlanLimits {
  communitiesMax: number;
  membersMax: number;
  coursesActivationMax: number;
  storageGB: number;
  adminsMax: number;
}

export interface PlanFeatures {
  courses: boolean;
  challenges: boolean;
  sessions: boolean;
  products: boolean;
  events: boolean;
  automationQuota: number;
  branding: boolean;
  gamification: boolean;
  verifiedBadge: boolean;
  featuredBadge: boolean;
}

export interface SubscriptionPlan {
  tier: PlanTier;
  name: string;
  priceDTPerMonth: number;
  trialDays: number;
  limits: PlanLimits;
  features: PlanFeatures;
  transactionFeePercent: number;
  transactionFixedFeeDT: number;
  isActive: boolean;
}

export interface CreatorSubscription {
  id: string;
  creatorId: string;
  plan: PlanTier;
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt?: string;
  hasPaymentMethod: boolean;
  paymentBrand?: string;
  paymentLast4?: string;
  provider?: string;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrialRemaining {
  isTrialing: boolean;
  expiresAt: string | null;
  remaining: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
  };
  message: string;
}

export interface SetupBillingData {
  providerCustomerId: string;
  paymentBrand?: string;
  paymentLast4?: string;
  provider?: 'stripe' | 'paypal' | 'custom';
}

export interface UpgradePlanData {
  tier: PlanTier;
}

export interface SubscriptionStats {
  totalSubscribers: number;
  activeSubscribers: number;
  monthlyRevenue: number;
  averageSubscriptionValue: number;
  trialSubscribers: number;
  canceledSubscribers: number;
  pastDueSubscribers: number;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  amount: number;
  currency: string;
  quantity: number;
}

export interface Invoice {
  id: string;
  customerId: string;
  subscriptionId: string;
  status: InvoiceStatus;
  invoiceNumber: string;
  total: number;
  subtotal: number;
  tax?: number;
  currency: string;
  invoiceDate: string;
  dueDate?: string;
  paidAt?: string;
  lineItems: InvoiceLineItem[];
  invoicePdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsageSummary {
  customerId: string;
  subscriptionId: string;
  periodStart: string;
  periodEnd: string;
  communitiesCreated: number;
  membersAdded: number;
  coursesActivated: number;
  storageUsedGB: number;
  adminsAdded: number;
  apiRequests?: number;
  emailsSent?: number;
  automationsTriggered?: number;
  planLimits: PlanLimits;
  usagePercentages: {
    communities: number;
    members: number;
    courses: number;
    storage: number;
    admins: number;
  };
}

// ============ API METHOD PAYLOADS ============

export interface GetAllSubscriptionsParams {
  status?: SubscriptionStatus;
  plan?: PlanTier;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CreatePlanData {
  tier: PlanTier;
  name: string;
  priceDTPerMonth: number;
  trialDays?: number;
  limits?: Partial<PlanLimits>;
  features?: Partial<PlanFeatures>;
  transactionFeePercent?: number;
  transactionFixedFeeDT?: number;
}

export interface UpdatePlanData extends Partial<CreatePlanData> { }

export interface RecordUsageData {
  metricType: UsageMetricType;
  value: number;
  resourceId?: string;
  metadata?: Record<string, any>;
}

export interface ExportSubscriptionsParams {
  status?: SubscriptionStatus;
  plan?: PlanTier;
  startDate?: string;
  endDate?: string;
}

// ============ API CLIENT ============

export const subscriptionApi = {
  /**
   * Get current creator's subscription
   */
  async getMySubscription(): Promise<ApiSuccessResponse<CreatorSubscription>> {
    return apiClient.get<ApiSuccessResponse<CreatorSubscription>>('/subscriptions/me');
  },

  /**
   * Start trial for creator
   */
  async startTrial(): Promise<ApiSuccessResponse<{ message: string; subscription: CreatorSubscription }>> {
    return apiClient.post('/subscriptions/start-trial');
  },

  /**
   * Setup billing method for creator
   */
  async setupBilling(data: SetupBillingData): Promise<ApiSuccessResponse<{ message: string; subscription: CreatorSubscription }>> {
    return apiClient.post('/subscriptions/setup-billing', data);
  },

  /**
   * Upgrade plan tier
   */
  async upgradePlan(data: UpgradePlanData): Promise<ApiSuccessResponse<{ message: string; subscription: CreatorSubscription }>> {
    return apiClient.post('/subscriptions/upgrade', data);
  },

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(): Promise<ApiSuccessResponse<{ message: string; subscription: CreatorSubscription }>> {
    return apiClient.post('/subscriptions/cancel');
  },

  /**
   * Get trial remaining time
   */
  async getTrialRemaining(): Promise<ApiSuccessResponse<TrialRemaining>> {
    return apiClient.get('/subscriptions/trial-remaining');
  },

  // Plan management
  async getPlans(): Promise<ApiSuccessResponse<SubscriptionPlan[]>> {
    return apiClient.get('/subscriptions/plans');
  },

  async getPlanByTier(tier: PlanTier): Promise<ApiSuccessResponse<SubscriptionPlan>> {
    return apiClient.get(`/subscriptions/plans/${tier}`);
  },

  async createPlan(planData: CreatePlanData): Promise<ApiSuccessResponse<SubscriptionPlan>> {
    return apiClient.post('/subscriptions/plans', planData);
  },

  async updatePlan(tier: PlanTier, planData: UpdatePlanData): Promise<ApiSuccessResponse<SubscriptionPlan>> {
    return apiClient.put(`/subscriptions/plans/${tier}`, planData);
  },

  async deletePlan(tier: PlanTier): Promise<ApiSuccessResponse<{ message: string }>> {
    return apiClient.delete(`/subscriptions/plans/${tier}`);
  },

  // Subscription management
  async getSubscriptionStats(): Promise<ApiSuccessResponse<SubscriptionStats>> {
    return apiClient.get('/subscriptions/stats');
  },

  async getAllSubscriptions(params: GetAllSubscriptionsParams = {}): Promise<PaginatedResponse<CreatorSubscription>> {
    return apiClient.get('/subscriptions/all', params);
  },

  async updateSubscription(
    subscriptionId: string,
    updateData: Partial<CreatorSubscription>
  ): Promise<ApiSuccessResponse<CreatorSubscription>> {
    return apiClient.put(`/subscriptions/${subscriptionId}`, updateData);
  },

  async deleteSubscription(subscriptionId: string): Promise<ApiSuccessResponse<{ message: string }>> {
    return apiClient.delete(`/subscriptions/${subscriptionId}`);
  },

  // Invoice management
  async getInvoices(
    params: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<Invoice>> {
    return apiClient.get('/subscriptions/invoices', params);
  },

  async getInvoiceById(invoiceId: string): Promise<ApiSuccessResponse<Invoice>> {
    return apiClient.get(`/subscriptions/invoices/${invoiceId}`);
  },

  // Usage tracking
  async recordUsage(usageData: RecordUsageData): Promise<ApiSuccessResponse<{ message: string }>> {
    return apiClient.post('/subscriptions/usage', usageData);
  },

  async getUsageSummary(params: { startDate?: string; endDate?: string } = {}): Promise<ApiSuccessResponse<UsageSummary>> {
    return apiClient.get('/subscriptions/usage', params);
  },

  /**
   * Export subscriptions to CSV
   */
  async exportSubscriptions(params: ExportSubscriptionsParams = {}): Promise<ApiSuccessResponse<{ message: string; downloadUrl: string }>> {
    return apiClient.post('/subscriptions/export', params);
  },

  // ============ HELPER FUNCTIONS ============

  /**
   * Check if creator has an active (or trialing) subscription
   */
  async hasActiveSubscription(): Promise<boolean> {
    try {
      const response = await this.getMySubscription();
      const sub = response.data;
      return sub && (sub.status === SubscriptionStatus.ACTIVE || sub.status === SubscriptionStatus.TRIALING);
    } catch {
      return false;
    }
  },

  /**
   * Get a summary of the current subscription status
   */
  async getSubscriptionSummary(): Promise<{
    hasSubscription: boolean;
    isActive: boolean;
    isTrialing: boolean;
    plan: PlanTier | 'none';
    status: SubscriptionStatus | 'none';
    currentPeriodEnd?: string;
    trialEndsAt?: string;
    cancelAtPeriodEnd: boolean;
    hasPaymentMethod: boolean;
  }> {
    try {
      const response = await this.getMySubscription();
      const sub = response.data;

      if (!sub) {
        return {
          hasSubscription: false,
          isActive: false,
          isTrialing: false,
          plan: 'none',
          status: 'none',
          cancelAtPeriodEnd: false,
          hasPaymentMethod: false,
        };
      }

      return {
        hasSubscription: true,
        isActive: sub.status === SubscriptionStatus.ACTIVE,
        isTrialing: sub.status === SubscriptionStatus.TRIALING,
        plan: sub.plan,
        status: sub.status,
        currentPeriodEnd: sub.currentPeriodEnd,
        trialEndsAt: sub.trialEndsAt,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        hasPaymentMethod: sub.hasPaymentMethod,
      };
    } catch {
      return {
        hasSubscription: false,
        isActive: false,
        isTrialing: false,
        plan: 'none',
        status: 'none',
        cancelAtPeriodEnd: false,
        hasPaymentMethod: false,
      };
    }
  },

  /**
   * Initiate Stripe Link payment for subscription
   */
  initStripePayment: async (tier: PlanTier, interval: 'month' | 'year' = 'month'): Promise<any> => {
    return apiClient.post('/payment/stripe-link/init/subscription', { tier, interval });
  },
};