import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import { isAbsolute, relative, resolve } from 'path';
import { PresignRequest, PresignResult, StorageAdapter, StorageObjectMetadata } from '@/domains/content/media/storage/storage-adapter.interface';
import { resolveUploadsRoot } from '@/domains/shared/upload/upload-paths';

@Injectable()
export class DiskStorageAdapter implements StorageAdapter {
  readonly driver: 'disk' = 'disk';

  private readonly uploadsRoot = resolveUploadsRoot();

  private resolveStoragePath(storageKey: string): string {
    const filePath = resolve(this.uploadsRoot, String(storageKey || ''));
    const relativePath = relative(this.uploadsRoot, filePath);
    if (!relativePath || relativePath.startsWith('..') || isAbsolute(relativePath)) {
      throw new Error('Invalid media storage key');
    }
    return filePath;
  }

  async presignUpload(_req: PresignRequest): Promise<PresignResult> {
    return {
      uploadMode: 'proxy',
      uploadUrl: '/api/media/upload',
      method: 'POST',
      expiresInSeconds: 0,
    };
  }

  async deleteByStorageKey(storageKey: string): Promise<void> {
    await fs.unlink(this.resolveStoragePath(storageKey));
  }

  async exists(storageKey: string): Promise<boolean> {
    return existsSync(this.resolveStoragePath(storageKey));
  }

  async getObjectMetadata(storageKey: string): Promise<StorageObjectMetadata | null> {
    try {
      const stats = await fs.stat(this.resolveStoragePath(storageKey));
      return stats.isFile() ? { contentLength: stats.size } : null;
    } catch {
      return null;
    }
  }

  async presignDownload(): Promise<string> {
    throw new Error('Private downloads require S3 object storage');
  }
}
