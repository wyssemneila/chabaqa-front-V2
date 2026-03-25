import { apiClient } from './client';

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
    purpose?: MediaPurpose;
    entityType?: string;
    entityId?: string;
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
    checksum?: string;
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
    const shouldTryPresign = file.size > 25 * 1024 * 1024 || file.type.startsWith('video/');
    if (!shouldTryPresign) {
      return mediaApi.upload(file, opts);
    }

    const presign = await mediaApi.presign({
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      purpose: opts?.purpose,
      entityType: opts?.entityType,
      entityId: opts?.entityId,
    });

    if (presign.uploadMode !== 'direct') {
      return mediaApi.upload(file, opts);
    }

    // Placeholder direct-upload branch: fallback to proxy in this build until S3 direct flow is wired.
    return mediaApi.upload(file, opts);
  },

  getAsset: async (assetId: string): Promise<MediaAsset> => {
    const res = await apiClient.get<MediaApiResponse<MediaAsset>>(`/media/${assetId}`);
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
