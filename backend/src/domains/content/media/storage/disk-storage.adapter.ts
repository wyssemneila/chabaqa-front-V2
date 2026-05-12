import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import { join } from 'path';
import { PresignRequest, PresignResult, StorageAdapter } from '@/domains/content/media/storage/storage-adapter.interface';
import { resolveUploadsRoot } from '@/domains/shared/upload/upload-paths';

@Injectable()
export class DiskStorageAdapter implements StorageAdapter {
  readonly driver: 'disk' = 'disk';

  private readonly uploadsRoot = resolveUploadsRoot();

  async presignUpload(_req: PresignRequest): Promise<PresignResult> {
    return {
      uploadMode: 'proxy',
      uploadUrl: '/api/media/upload',
      method: 'POST',
      expiresInSeconds: 0,
    };
  }

  async deleteByStorageKey(storageKey: string): Promise<void> {
    const filePath = join(this.uploadsRoot, storageKey);
    await fs.unlink(filePath);
  }

  async exists(storageKey: string): Promise<boolean> {
    return existsSync(join(this.uploadsRoot, storageKey));
  }
}
