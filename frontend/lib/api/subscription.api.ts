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

export type BillingInterval = 'month' | 'year';

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
  WHATSAPP_SENT = 'whatsapp_sent',
  AUTOMATION_TRIGGERED = 'automation_triggered',
}

export enum SubscriptionAddonType {
  STORAGE_50GB = 'storage_50gb',
  ADMIN_SEAT = 'admin_seat',
}

// ============ INTERFACES & TYPES ============

export interface PlanLimits {
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
  yearlyPriceDTPerMonth?: number;
  yearlyTotalDT?: number;
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
  billingInterval?: BillingInterval;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingAt?: string;
  trialEndsAt?: string;
  amount?: number;
  currency?: string;
  hasPaymentMethod: boolean;
  paymentBrand?: string;
  paymentLast4?: string;
  provider?: string;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  providerCheckoutSessionId?: string;
  providerPriceId?: string;
  communitiesMax?: number;
  membersMax?: number;
  coursesActivationMax?: number;
  storageGB?: number;
  adminsMax?: number;
  emailCampaignRecipientsPerMonth?: number;
  whatsappMessagesPerMonth?: number;
  analyticsLookbackDays?: number;
  sessionBookingsPerMonth?: number;
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
  whatsappMessagesSent?: number;
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

export interface SubscriptionAddon {
  _id?: string;
  id?: string;
  type: SubscriptionAddonType;
  label: string;
  quantity: number;
  unitAmount: number;
  currency: string;
  billingInterval: BillingInterval;
  status?: 'active' | 'canceled';
  storageGBDelta?: number;
  adminsDelta?: number;
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

const unwrapPayload = <T,>(response: any, fallback: T): T => (
  response?.data?.data ?? response?.data ?? response ?? fallback
) as T;

export const normalizeInvoiceList = (response: any): PaginatedResponse<Invoice> => {
  const payload = unwrapPayload<any>(response, {});
  const invoices = Array.isArray(payload?.invoices)
    ? payload.invoices
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];

  return {
    success: true,
    data: invoices,
    pagination: {
      total: Number(payload?.total ?? payload?.pagination?.total ?? invoices.length),
      page: Number(payload?.page ?? payload?.pagination?.page ?? 1),
      limit: Number(payload?.limit ?? payload?.pagination?.limit ?? invoices.length),
      totalPages: Number(payload?.totalPages ?? payload?.pagination?.totalPages ?? payload?.pages ?? 1),
    },
  } as PaginatedResponse<Invoice>;
};

export const createSubscriptionIdempotencyKey = (provider: string, tier: PlanTier, interval: BillingInterval) => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `subscription:${provider}:${tier}:${interval}:${crypto.randomUUID()}`;
  }
  return `subscription:${provider}:${tier}:${interval}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
};

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
    return normalizeInvoiceList(await apiClient.get('/subscriptions/invoices', params));
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

  async getAvailableAddons(): Promise<ApiSuccessResponse<SubscriptionAddon[]> | SubscriptionAddon[]> {
    return apiClient.get('/subscriptions/add-ons/available');
  },

  async getMyAddons(): Promise<ApiSuccessResponse<SubscriptionAddon[]> | SubscriptionAddon[]> {
    return apiClient.get('/subscriptions/add-ons');
  },

  async purchaseAddon(_data: { type: SubscriptionAddonType; quantity?: number; billingInterval?: BillingInterval }): Promise<ApiSuccessResponse<SubscriptionAddon> | SubscriptionAddon> {
    throw new Error('Add-on checkout is not available yet. Contact support for admin-reviewed add-ons.');
  },

  async cancelAddon(addonId: string): Promise<ApiSuccessResponse<SubscriptionAddon> | SubscriptionAddon> {
    return apiClient.delete(`/subscriptions/add-ons/${addonId}`);
  },

  async getMemberRevenueSubscriptions(params: GetAllSubscriptionsParams = {}): Promise<PaginatedResponse<CreatorSubscription>> {
    return apiClient.get('/subscriptions/member-revenue', params);
  },

  async getMemberRevenueStats(params: GetAllSubscriptionsParams = {}): Promise<ApiSuccessResponse<SubscriptionStats> | SubscriptionStats> {
    return apiClient.get('/subscriptions/member-revenue/stats', params);
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
    return apiClient.post('/payment/stripe-link/init/subscription', {
      tier,
      interval,
      idempotencyKey: createSubscriptionIdempotencyKey('stripe', tier, interval),
    });
  },

  createStripeCustomerPortal: async (): Promise<ApiSuccessResponse<{ portalUrl: string }> | { portalUrl: string }> => {
    return apiClient.post('/payment/stripe-link/customer-portal');
  },
};
