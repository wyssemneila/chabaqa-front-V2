import { apiClient, ApiSuccessResponse } from './client';

export type TrackableContentType =
  | 'course'
  | 'challenge'
  | 'session'
  | 'event'
  | 'product'
  | 'post'
  | 'community'
  | 'resource'
  | 'subscription'
  | 'chapter';

export const trackingApi = {
  trackView: async (
    contentType: TrackableContentType,
    contentId: string,
    metadata?: Record<string, any>,
  ): Promise<ApiSuccessResponse<any>> => {
    return apiClient.post<ApiSuccessResponse<any>>(
      `/tracking/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/view`,
      { metadata: metadata || {} },
    );
  },
  trackStart: async (
    contentType: TrackableContentType,
    contentId: string,
    metadata?: Record<string, any>,
  ): Promise<ApiSuccessResponse<any>> => {
    return apiClient.post<ApiSuccessResponse<any>>(
      `/tracking/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/start`,
      { metadata: metadata || {} },
    );
  },
  trackComplete: async (
    contentType: TrackableContentType,
    contentId: string,
    metadata?: Record<string, any>,
  ): Promise<ApiSuccessResponse<any>> => {
    return apiClient.post<ApiSuccessResponse<any>>(
      `/tracking/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/complete`,
      { metadata: metadata || {} },
    );
  },
};

