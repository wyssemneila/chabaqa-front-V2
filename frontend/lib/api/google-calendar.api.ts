import { apiClient } from '../core/client';

export interface GoogleCalendarStatus {
  connected: boolean;
  hasValidAccess: boolean;
}

export interface GoogleAuthUrl {
  authUrl: string;
}

export interface GoogleCalendarResponse {
  success: boolean;
  message: string;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? value as Record<string, unknown> : {};

const unwrapPayload = <T>(raw: unknown): T => {
  const root = asRecord(raw);
  const data = asRecord(root.data);
  if (data.data !== undefined) return data.data as T;
  if (root.data !== undefined && root.success !== undefined) return root.data as T;
  if (root.data !== undefined && root.authUrl === undefined && root.connected === undefined && root.message === undefined) {
    return root.data as T;
  }
  return raw as T;
};

/**
 * Google Calendar API Service
 * Note: Backend returns data directly (not wrapped in { success, data })
 */
export const googleCalendarApi = {
  /**
   * Get Google OAuth authorization URL
   */
  getAuthUrl: async (): Promise<{ data: GoogleAuthUrl }> => {
    const response = await apiClient.get<unknown>('/google-calendar/auth-url');
    const payload = unwrapPayload<GoogleAuthUrl>(response);
    return { data: payload };
  },

  /**
   * Handle OAuth callback (exchange code for tokens)
   */
  handleCallback: async (code: string): Promise<{ data: GoogleCalendarResponse }> => {
    const response = await apiClient.post<unknown>('/google-calendar/callback', { code });
    const payload = unwrapPayload<GoogleCalendarResponse>(response);
    return { data: payload };
  },

  /**
   * Get Google Calendar connection status
   */
  getConnectionStatus: async (): Promise<{ data: GoogleCalendarStatus }> => {
    const response = await apiClient.get<unknown>('/google-calendar/status');
    const payload = unwrapPayload<GoogleCalendarStatus>(response);
    return { data: payload };
  },

  /**
   * Disconnect Google Calendar
   */
  disconnect: async (): Promise<{ data: GoogleCalendarResponse }> => {
    const response = await apiClient.post<unknown>('/google-calendar/disconnect');
    const payload = unwrapPayload<GoogleCalendarResponse>(response);
    return { data: payload };
  },
};
