import { apiClient } from './client';

export const communitySupportApi = {
  getQueue: async (
    communityId: string,
    params?: { page?: number; limit?: number; status?: 'open' | 'closed' },
  ) => {
    const res = await apiClient.get<any>(`/communities/${communityId}/support/queue`, params);
    return res?.data ?? res;
  },

  getMetrics: async (communityId: string) => {
    const res = await apiClient.get<any>(`/communities/${communityId}/support/metrics`);
    return res?.data ?? res;
  },

  assignConversation: async (communityId: string, conversationId: string) => {
    const res = await apiClient.patch<any>(`/communities/${communityId}/support/${conversationId}/assign`);
    return res?.data ?? res;
  },
};
