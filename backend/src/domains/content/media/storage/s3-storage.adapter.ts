import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createReadStream } from 'fs';
import { Readable } from 'stream';
import { PresignRequest, PresignResult, StorageAdapter } from '@/domains/content/media/storage/storage-adapter.interface';

@Injectable()
export class S3StorageAdapter implements StorageAdapter {
  readonly driver: 's3' = 's3';

  private readonly endpoint = process.env.S3_ENDPOINT || process.env.AWS_S3_ENDPOINT || '';
  private readonly region = process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1';
  private readonly bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || 'chabaqa-media';
  private readonly accessKeyId = process.env.S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID || '';
  private readonly secretAccessKey = process.env.S3_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY || '';
  private readonly forcePathStyle = (process.env.S3_FORCE_PATH_STYLE || 'true') !== 'false';

  private client?: S3Client;

  private getClient(): S3Client {
    if (!this.accessKeyId || !this.secretAccessKey) {
      throw new ServiceUnavailableException('S3 credentials are not configured');
    }
    if (!this.client) {
      this.client = new S3Client({
        endpoint: this.endpoint || undefined,
        region: this.region,
        forcePathStyle: this.forcePathStyle,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      });
    }
    return this.client;
  }

  private normalizeKey(storageKey: string): string {
    return storageKey.replace(/^\/+/, '');
  }

  async putFile(storageKey: string, filePath: string, contentType?: string): Promise<void> {
    const key = this.normalizeKey(storageKey);
    await this.getClient().send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: createReadStream(filePath),
      ContentType: contentType || 'application/octet-stream',
    }));
  }

  async getObjectStream(storageKey: string): Promise<{ stream: Readable; contentType?: string; contentLength?: number }> {
    const key = this.normalizeKey(storageKey);
    const result = await this.getClient().send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
    return {
      stream: result.Body as Readable,
      contentType: result.ContentType,
      contentLength: result.ContentLength,
    };
  }

  async presignUpload(req: PresignRequest): Promise<PresignResult> {
    const key = this.normalizeKey(req.storageKey || req.fileName);
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: req.mimeType || 'application/octet-stream',
      ContentLength: req.size,
    });
    const uploadUrl = await getSignedUrl(this.getClient(), command, { expiresIn: 900 });
    return {
      uploadMode: 'direct',
      uploadUrl,
      method: 'PUT',
      headers: {
        'Content-Type': req.mimeType || 'application/octet-stream',
      },
      expiresInSeconds: 900,
      storageKey: key,
    };
  }

  async deleteByStorageKey(storageKey: string): Promise<void> {
    const key = this.normalizeKey(storageKey);
    await this.getClient().send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
  }

  async exists(storageKey: string): Promise<boolean> {
    try {
      const key = this.normalizeKey(storageKey);
      await this.getClient().send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
      return true;
    } catch {
      return false;
    }
  }
}
