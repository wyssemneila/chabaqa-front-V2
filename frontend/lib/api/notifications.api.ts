import { apiClient, ApiSuccessResponse } from './client';
import type { Notification } from './types';

export interface PushPublicKeyResponse {
  enabled: boolean;
  publicKey: string | null;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushStatusResponse {
  supported: boolean;
  enabled: boolean;
  subscriptionCount: number;
}

export interface ChannelPreferencesPayload {
  inApp?: boolean;
  email?: boolean;
  push?: boolean;
}

export interface PreferenceItemPayload {
  communityId?: string | null;
  type: string;
  channels: ChannelPreferencesPayload;
}

export interface NotificationMutePayload {
  targetType: 'thread' | 'user' | 'community';
  targetId: string;
  reason?: string;
  expiresAt?: string;
}

export interface NotificationPreferencesResponse {
  preferences: Record<string, ChannelPreferencesPayload>;
  quietHours: {
    start: string;
    end: string;
    isEnabled: boolean;
  };
}

// Notifications API
export const notificationsApi = {
  // Get all notifications
  getAll: async (params?: { page?: number; limit?: number }): Promise<{ items: Notification[]; total: number; page: number; limit: number }> => {
    const response = await apiClient.get<{ success: boolean; message: string; data: Notification[] }>('/notifications', params);

    const payload: any =
      (response as any)?.data?.data ??
      (response as any)?.data ??
      response;

    const notifications = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.notifications)
          ? payload.notifications
          : [];

    return {
      items: notifications,
      total: notifications.length,
      page: params?.page || 1,
      limit: params?.limit || 20
    };
  },

  // Mark notification as read
  markAsRead: async (id: string): Promise<ApiSuccessResponse<Notification>> => {
    return apiClient.patch<ApiSuccessResponse<Notification>>(`/notifications/${id}/read`);
  },

  // Mark all as read
  markAllAsRead: async (): Promise<ApiSuccessResponse<void>> => {
    return apiClient.patch<ApiSuccessResponse<void>>('/notifications/read-all');
  },

  // Delete notification
  delete: async (id: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.delete<ApiSuccessResponse<void>>(`/notifications/${id}`);
  },

  // Get Web Push public key
  getPushPublicKey: async (): Promise<ApiSuccessResponse<PushPublicKeyResponse>> => {
    return apiClient.get<ApiSuccessResponse<PushPublicKeyResponse>>('/notifications/push/public-key');
  },

  // Save browser push subscription
  subscribePush: async (subscription: PushSubscriptionPayload): Promise<ApiSuccessResponse<void>> => {
    return apiClient.post<ApiSuccessResponse<void>>('/notifications/push/subscribe', subscription);
  },

  // Remove browser push subscription
  unsubscribePush: async (endpoint: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.post<ApiSuccessResponse<void>>('/notifications/push/unsubscribe', { endpoint });
  },

  // Get push status (support + permission + subscriptions)
  getPushStatus: async (): Promise<ApiSuccessResponse<PushStatusResponse>> => {
    return apiClient.get<ApiSuccessResponse<PushStatusResponse>>('/notifications/push/status');
  },

  // Send test push notification
  sendTestPush: async (): Promise<ApiSuccessResponse<{ sent: boolean; message: string }>> => {
    return apiClient.post<ApiSuccessResponse<{ sent: boolean; message: string }>>('/notifications/push/test');
  },

  // Get notification preferences (legacy global)
  getPreferences: async (): Promise<ApiSuccessResponse<NotificationPreferencesResponse>> => {
    return apiClient.get<ApiSuccessResponse<NotificationPreferencesResponse>>('/notifications/preferences');
  },

  // Update notification preferences (legacy global + quiet hours)
  updatePreferences: async (data: {
    preferences?: Record<string, ChannelPreferencesPayload>;
    quietHours?: { start?: string; end?: string; isEnabled?: boolean };
  }): Promise<ApiSuccessResponse<NotificationPreferencesResponse>> => {
    return apiClient.put<ApiSuccessResponse<NotificationPreferencesResponse>>('/notifications/preferences', data);
  },

  // Get preference items (per-community overrides)
  getPreferenceItems: async (communityId?: string): Promise<ApiSuccessResponse<PreferenceItemPayload[]>> => {
    const params = communityId !== undefined ? { communityId } : undefined;
    return apiClient.get<ApiSuccessResponse<PreferenceItemPayload[]>>('/notifications/preferences/items', params);
  },

  // Upsert a single preference item
  upsertPreferenceItem: async (item: PreferenceItemPayload): Promise<ApiSuccessResponse<PreferenceItemPayload>> => {
    return apiClient.put<ApiSuccessResponse<PreferenceItemPayload>>('/notifications/preferences/items', item);
  },

  // Bulk upsert preference items
  bulkUpsertPreferenceItems: async (items: PreferenceItemPayload[]): Promise<ApiSuccessResponse<PreferenceItemPayload[]>> => {
    return apiClient.put<ApiSuccessResponse<PreferenceItemPayload[]>>('/notifications/preferences/items/bulk', { items });
  },

  // Get all mutes
  getMutes: async (): Promise<ApiSuccessResponse<NotificationMutePayload[]>> => {
    return apiClient.get<ApiSuccessResponse<NotificationMutePayload[]>>('/notifications/mutes');
  },

  // Create or update a mute
  createMute: async (mute: NotificationMutePayload): Promise<ApiSuccessResponse<NotificationMutePayload>> => {
    return apiClient.post<ApiSuccessResponse<NotificationMutePayload>>('/notifications/mutes', mute);
  },

  // Remove a mute
  removeMute: async (targetType: string, targetId: string): Promise<ApiSuccessResponse<{ removed: boolean }>> => {
    return apiClient.delete<ApiSuccessResponse<{ removed: boolean }>>(`/notifications/mutes/${targetType}/${targetId}`);
  },
};
