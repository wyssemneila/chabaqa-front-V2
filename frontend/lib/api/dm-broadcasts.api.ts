import { apiClient } from './client';

export type DmBroadcastStatus = 'draft' | 'sending' | 'sent' | 'failed';
export type DmAutomationTrigger = 'new_member' | 'inactive_7' | 'inactive_30';

export interface DmBroadcast {
  _id: string;
  id?: string;
  communityId: string;
  creatorId: string;
  title?: string;
  body: string;
  status: DmBroadcastStatus;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  sentAt?: string;
  createdAt?: string;
}

export interface DmAutomation {
  _id: string;
  id?: string;
  communityId: string;
  creatorId: string;
  name: string;
  trigger: DmAutomationTrigger;
  delayHours: number;
  body: string;
  isActive: boolean;
  triggeredCount: number;
  lastTriggeredAt?: string;
  createdAt?: string;
}

const withId = <T extends { _id?: string; id?: string }>(item: T) => ({
  ...item,
  id: item.id || item._id,
});

export const dmBroadcastsApi = {
  listBroadcasts: async (communityId: string) => {
    const res = await apiClient.get<any>('/dm/broadcasts', { communityId });
    const data = res?.data ?? res;
    return {
      broadcasts: (data.broadcasts || []).map(withId) as DmBroadcast[],
    };
  },

  createBroadcast: async (payload: { communityId: string; title?: string; body: string }) => {
    const res = await apiClient.post<any>('/dm/broadcasts', payload);
    const data = res?.data ?? res;
    return { broadcast: withId(data.broadcast) as DmBroadcast };
  },

  sendBroadcast: async (id: string) => {
    const res = await apiClient.post<any>(`/dm/broadcasts/${id}/send`);
    const data = res?.data ?? res;
    return { broadcast: withId(data.broadcast) as DmBroadcast };
  },

  deleteBroadcast: async (id: string) => apiClient.delete(`/dm/broadcasts/${id}`),

  listAutomations: async (communityId: string) => {
    const res = await apiClient.get<any>('/dm/automations', { communityId });
    const data = res?.data ?? res;
    return {
      automations: (data.automations || []).map(withId) as DmAutomation[],
    };
  },

  createAutomation: async (payload: {
    communityId: string;
    name: string;
    trigger: DmAutomationTrigger;
    delayHours?: number;
    body: string;
  }) => {
    const res = await apiClient.post<any>('/dm/automations', payload);
    const data = res?.data ?? res;
    return { automation: withId(data.automation) as DmAutomation };
  },

  toggleAutomation: async (id: string) => {
    const res = await apiClient.patch<any>(`/dm/automations/${id}/toggle`);
    const data = res?.data ?? res;
    return { automation: withId(data.automation) as DmAutomation };
  },

  deleteAutomation: async (id: string) => apiClient.delete(`/dm/automations/${id}`),
};
