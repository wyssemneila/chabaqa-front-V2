import { apiClient } from './client';

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

const unwrapPayload = <T>(raw: any): T => {
  if (raw?.data?.data !== undefined) return raw.data.data as T;
  if (raw?.data !== undefined && raw?.success !== undefined) return raw.data as T;
  if (raw?.data !== undefined && raw?.authUrl === undefined && raw?.connected === undefined && raw?.message === undefined) {
    return raw.data as T;
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
    const response = await apiClient.get<any>('/google-calendar/auth-url');
    const payload = unwrapPayload<GoogleAuthUrl>(response);
    return { data: payload };
  },

  /**
   * Handle OAuth callback (exchange code for tokens)
   */
  handleCallback: async (code: string): Promise<{ data: GoogleCalendarResponse }> => {
    const response = await apiClient.post<any>('/google-calendar/callback', { code });
    const payload = unwrapPayload<GoogleCalendarResponse>(response);
    return { data: payload };
  },

  /**
   * Get Google Calendar connection status
   */
  getConnectionStatus: async (): Promise<{ data: GoogleCalendarStatus }> => {
    const response = await apiClient.get<any>('/google-calendar/status');
    const payload = unwrapPayload<GoogleCalendarStatus>(response);
    return { data: payload };
  },

  /**
   * Disconnect Google Calendar
   */
  disconnect: async (): Promise<{ data: GoogleCalendarResponse }> => {
    const response = await apiClient.post<any>('/google-calendar/disconnect');
    const payload = unwrapPayload<GoogleCalendarResponse>(response);
    return { data: payload };
  },
};
