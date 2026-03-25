import type { UploadedFile } from './types';
import { mediaApi } from './media.api';

// Storage API
export const storageApi = {
  // Normalize upload response shapes returned by backend.
  // Backend may return:
  // - { filename, originalName, url, ... }
  // - { success: true, data: { filename, originalName, url } }
  // - { success: true, file: { ... } }
  // - { success: true, data: { file: { ... } } }
  // This function ensures the UI always gets { filename, originalName, url }.
  normalizeUploadedFile: (res: any): UploadedFile => {
    const root = res?.data ?? res;
    const file = root?.file ?? root?.data?.file ?? root;

    return {
      filename: file?.filename,
      originalName: file?.originalName,
      url: file?.url,
      size: file?.size,
      mimetype: file?.mimetype,
      type: file?.type,
      uploadedAt: file?.uploadedAt,
    } as UploadedFile;
  },

  // Upload single file
  upload: async (file: File): Promise<UploadedFile> => {
    const asset = await mediaApi.uploadSmart(file, { purpose: 'generic' });
    return {
      assetId: asset.assetId,
      filename: asset.storageKey.split('/').pop() || '',
      originalName: file.name,
      url: asset.url,
      size: asset.size,
      mimetype: asset.mimeType,
      type: asset.mediaType,
      uploadedAt: asset.createdAt,
    } as UploadedFile;
  },

  // Upload image (uses /upload/image endpoint with 'image' field name)
  uploadImage: async (file: File): Promise<UploadedFile> => {
    const asset = await mediaApi.uploadSmart(file, { purpose: 'generic', visibility: 'public' });
    return {
      assetId: asset.assetId,
      filename: asset.storageKey.split('/').pop() || '',
      originalName: file.name,
      url: asset.url,
      size: asset.size,
      mimetype: asset.mimeType,
      type: asset.mediaType,
      uploadedAt: asset.createdAt,
    } as UploadedFile;
  },

  // Upload multiple files
  uploadMultiple: async (files: File[]): Promise<{ files: UploadedFile[]; totalFiles: number; successCount: number; errorCount: number }> => {
    const settled = await Promise.allSettled(
      files.map((file) => mediaApi.uploadSmart(file, { purpose: 'generic' })),
    );
    const uploaded = settled
      .filter((entry): entry is PromiseFulfilledResult<any> => entry.status === 'fulfilled')
      .map((entry) => entry.value);

    return {
      files: uploaded.map((asset) => ({
        assetId: asset.assetId,
        filename: asset.storageKey.split('/').pop() || '',
        originalName: asset.storageKey.split('/').pop() || '',
        url: asset.url,
        size: asset.size,
        mimetype: asset.mimeType,
        type: asset.mediaType,
        uploadedAt: asset.createdAt,
      })) as UploadedFile[],
      totalFiles: files.length,
      successCount: uploaded.length,
      errorCount: settled.length - uploaded.length,
    };
  },

  // Delete file
  delete: async (assetId: string): Promise<{ success: boolean; message: string }> => {
    const deleted = await mediaApi.deleteAsset(assetId);
    return { success: true, message: `Asset ${deleted.assetId} deleted` };
  },

  // Get file info
  getFile: async (assetId: string): Promise<UploadedFile> => {
    const asset = await mediaApi.getAsset(assetId);
    return {
      filename: asset.storageKey.split('/').pop() || '',
      originalName: asset.storageKey.split('/').pop() || '',
      url: asset.url,
      size: asset.size,
      mimetype: asset.mimeType,
      type: asset.mediaType,
      uploadedAt: asset.createdAt,
    };
  },
};
