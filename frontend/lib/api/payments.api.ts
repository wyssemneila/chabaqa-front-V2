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

export interface RequestPayoutData {
  amount: number;
  method?: string;
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
  getPayouts: async (params?: PaginationParams): Promise<PaginatedResponse<any>> => {
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
  getPayoutStats: async (): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/payouts/stats');
  },

  // Get available balance
  getAvailableBalance: async (): Promise<ApiSuccessResponse<{ availableBalance: number }>> => {
    return apiClient.get<ApiSuccessResponse<{ availableBalance: number }>>('/payouts/available-balance');
  },

  // Process payout (admin)
  processPayout: async (id: string): Promise<ApiSuccessResponse<any>> => {
    return apiClient.post<ApiSuccessResponse<any>>(`/payouts/${id}/process`);
  },

  // Cancel payout
  cancelPayout: async (id: string, reason?: string): Promise<ApiSuccessResponse<any>> => {
    return apiClient.post<ApiSuccessResponse<any>>(`/payouts/${id}/cancel`, { reason });
  },
};
