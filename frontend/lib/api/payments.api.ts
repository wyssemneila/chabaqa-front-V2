import { apiClient, ApiSuccessResponse, PaginatedResponse, PaginationParams } from './client';
import type { PaymentIntent, Subscription } from './types';

export interface CreatePaymentIntentData {
  amount: number;
  currency?: string;
  metadata?: Record<string, any>;
}

export interface ConfirmPaymentData {
  paymentIntentId: string;
  paymentMethodId: string;
}

export interface CreateSubscriptionData {
  communityId: string;
  priceId: string;
}

export type PayoutMethod = 'bank_transfer' | 'paypal' | 'stripe';

export interface RequestPayoutData {
  amount: number;
  method: PayoutMethod;
  communityId: string;
  description?: string;
  itemsCount?: number;
}

export interface PayoutQueryParams extends PaginationParams {
  communityId?: string;
  status?: string;
  method?: PayoutMethod;
  startDate?: string;
  endDate?: string;
}

// Payments API
export const paymentsApi = {
  // Create payment intent
  createIntent: async (data: CreatePaymentIntentData): Promise<ApiSuccessResponse<PaymentIntent>> => {
    return apiClient.post<ApiSuccessResponse<PaymentIntent>>('/payment/intent', data);
  },

  // Confirm payment
  confirm: async (data: ConfirmPaymentData): Promise<ApiSuccessResponse<any>> => {
    return apiClient.post<ApiSuccessResponse<any>>('/payment/confirm', data);
  },

  // Get payment by ID
  getById: async (id: string): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>(`/payment/${id}`);
  },

  // Create subscription
  createSubscription: async (data: CreateSubscriptionData): Promise<ApiSuccessResponse<Subscription>> => {
    return apiClient.post<ApiSuccessResponse<Subscription>>('/payment/subscriptions', data);
  },

  // Get subscription by ID
  getSubscription: async (id: string): Promise<ApiSuccessResponse<Subscription>> => {
    return apiClient.get<ApiSuccessResponse<Subscription>>(`/payment/subscriptions/${id}`);
  },

  // Get payouts
  getPayouts: async (params?: PayoutQueryParams): Promise<PaginatedResponse<any>> => {
    return apiClient.get<PaginatedResponse<any>>('/payouts', params);
  },

  // Request payout
  requestPayout: async (data: RequestPayoutData): Promise<ApiSuccessResponse<any>> => {
    return apiClient.post<ApiSuccessResponse<any>>('/payouts', data);
  },

  // Get payout by ID
  getPayout: async (id: string): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>(`/payouts/${id}`);
  },

  // Get payout stats
  getPayoutStats: async (params?: Pick<PayoutQueryParams, 'communityId'>): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/payouts/stats', params);
  },

  // Get available balance
  getAvailableBalance: async (params?: Pick<PayoutQueryParams, 'communityId'>): Promise<ApiSuccessResponse<{ availableBalance: number; minimumPayoutAmount?: number }>> => {
    return apiClient.get<ApiSuccessResponse<{ availableBalance: number; minimumPayoutAmount?: number }>>('/payouts/available-balance', params);
  },

  // Process payout (admin)
  processPayout: async (id: string): Promise<ApiSuccessResponse<any>> => {
    return apiClient.post<ApiSuccessResponse<any>>(`/payouts/${id}/process`);
  },

  // Cancel payout
  cancelPayout: async (id: string, reason?: string): Promise<ApiSuccessResponse<any>> => {
    return apiClient.post<ApiSuccessResponse<any>>(`/payouts/${id}/cancel`, { reason });
  },

  // Refund a paid Stripe order (admin/creator with permission)
  refundOrder: async (orderId: string, reason?: string): Promise<ApiSuccessResponse<{ orderId: string; status: string }>> => {
    return apiClient.post<ApiSuccessResponse<{ orderId: string; status: string }>>(
      `/payment/order/${orderId}/refund`,
      { reason },
    );
  },
};
