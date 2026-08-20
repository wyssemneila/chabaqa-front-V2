import { apiClient } from '../core/client';

export type MediaType = 'image' | 'video' | 'document' | 'audio';
export type MediaPurpose =
  | 'community_logo'
  | 'community_cover'
  | 'course_video'
  | 'challenge_video'
  | 'dm_attachment'
  | 'manual_payment_proof'
  | 'wallet_topup_proof'
  | 'product_file'
  | 'generic';
export type MediaVisibility = 'public' | 'private';

export interface MediaAsset {
  assetId: string;
  url: string;
  mediaType: MediaType;
  purpose: MediaPurpose;
  visibility: MediaVisibility;
  mimeType: string;
  size: number;
  checksum: string;
  storageKey: string;
  createdAt: string;
  status: string;
  entityType?: string;
  entityId?: string;
}

interface MediaApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const mediaApi = {
  upload: async (
    file: File,
    opts?: {
      purpose?: MediaPurpose;
      entityType?: string;
      entityId?: string;
      visibility?: MediaVisibility;
    },
  ): Promise<MediaAsset> => {
    const res = await apiClient.uploadFile<MediaApiResponse<MediaAsset>>(
      '/media/upload',
      file,
      'file',
      {
        purpose: opts?.purpose || 'generic',
        entityType: opts?.entityType,
        entityId: opts?.entityId,
        visibility: opts?.visibility,
      },
    );
    return res.data;
  },

  presign: async (payload: {
    fileName: string;
    mimeType: string;
    size: number;
    checksum: string;
    purpose?: MediaPurpose;
    entityType?: string;
    entityId?: string;
    visibility?: MediaVisibility;
  }) => {
    const res = await apiClient.post<MediaApiResponse<{
      uploadMode: 'direct' | 'proxy';
      uploadUrl: string;
      method: 'PUT' | 'POST';
      fields?: Record<string, string>;
      headers?: Record<string, string>;
      expiresInSeconds: number;
      storageKey?: string;
      purpose?: MediaPurpose;
      note?: string;
    }>>('/media/presign', payload);
    return res.data;
  },

  complete: async (payload: {
    storageKey: string;
    fileName: string;
    mimeType: string;
    size: number;
    checksum: string;
    purpose?: MediaPurpose;
    entityType?: string;
    entityId?: string;
    visibility?: MediaVisibility;
  }): Promise<MediaAsset> => {
    const res = await apiClient.post<MediaApiResponse<MediaAsset>>('/media/complete', payload);
    return res.data;
  },

  uploadSmart: async (
    file: File,
    opts?: {
      purpose?: MediaPurpose;
      entityType?: string;
      entityId?: string;
      visibility?: MediaVisibility;
    },
  ): Promise<MediaAsset> => {
    // Direct upload is not yet consumed by this client. Do not buffer large files solely to preflight a checksum.
    return mediaApi.upload(file, opts);
  },

  getAsset: async (assetId: string): Promise<MediaAsset> => {
    const res = await apiClient.get<MediaApiResponse<MediaAsset>>(`/media/${assetId}`);
    return res.data;
  },

  listAssets: async (opts?: { entityType?: string; entityId?: string; limit?: number }): Promise<MediaAsset[]> => {
    const params = new URLSearchParams();
    if (opts?.entityType) params.set('entityType', opts.entityType);
    if (opts?.entityId) params.set('entityId', opts.entityId);
    if (opts?.limit) params.set('limit', String(opts.limit));
    const suffix = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<MediaApiResponse<MediaAsset[]>>(`/media${suffix}`);
    return res.data;
  },

  getAccess: async (assetId: string): Promise<{ assetId: string; url: string; expiresInSeconds: number; visibility: MediaVisibility }> => {
    const res = await apiClient.get<MediaApiResponse<{ assetId: string; url: string; expiresInSeconds: number; visibility: MediaVisibility }>>(
      `/media/${assetId}/access`,
    );
    return res.data;
  },

  deleteAsset: async (assetId: string): Promise<{ assetId: string; status: string }> => {
    const res = await apiClient.delete<MediaApiResponse<{ assetId: string; status: string }>>(`/media/${assetId}`);
    return res.data;
  },
};
