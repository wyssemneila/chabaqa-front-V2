import { apiClient, ApiSuccessResponse } from '../core/client';

type JsonObject = Record<string, unknown>;

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
    metadata?: JsonObject,
  ): Promise<ApiSuccessResponse<unknown>> => {
    return apiClient.post<ApiSuccessResponse<unknown>>(
      `/tracking/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/view`,
      { metadata: metadata || {} },
    );
  },
  trackStart: async (
    contentType: TrackableContentType,
    contentId: string,
    metadata?: JsonObject,
  ): Promise<ApiSuccessResponse<unknown>> => {
    return apiClient.post<ApiSuccessResponse<unknown>>(
      `/tracking/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/start`,
      { metadata: metadata || {} },
    );
  },
  trackComplete: async (
    contentType: TrackableContentType,
    contentId: string,
    metadata?: JsonObject,
  ): Promise<ApiSuccessResponse<unknown>> => {
    return apiClient.post<ApiSuccessResponse<unknown>>(
      `/tracking/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/complete`,
      { metadata: metadata || {} },
    );
  },
};
