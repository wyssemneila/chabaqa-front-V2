import { apiClient } from './client';

export interface CommunityTransaction {
  id: string;
  date: string;
  buyerId: string;
  buyerName: string;
  buyerEmail?: string;
  contentType: string;
  contentId: string;
  amountDT: number;
  creatorNetDT: number;
  platformFeeDT: number;
  status: string;
  paymentMethod?: string;
}

export const communityFinanceApi = {
  getTransactions: async (
    communityId: string,
    params?: { page?: number; limit?: number; status?: string; from?: string; to?: string },
  ) => {
    const res = await apiClient.get<any>(`/communities/${communityId}/finance/transactions`, params);
    return res?.data ?? res;
  },

  getTransactionStats: async (communityId: string) => {
    const res = await apiClient.get<any>(`/communities/${communityId}/finance/transactions/stats`);
    return res?.data ?? res;
  },
};
