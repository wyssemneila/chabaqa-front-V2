import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
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
import {
  PresignRequest,
  PresignResult,
  StorageAdapter,
  StorageObjectMetadata,
} from '@/domains/content/media/storage/storage-adapter.interface';

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
    const key = String(storageKey || '').replace(/^\/+/, '');
    if (
      !key ||
      key.includes('\\') ||
      key.includes('\0') ||
      key.split('/').some((segment) => !segment || segment === '.' || segment === '..')
    ) {
      throw new BadRequestException('Invalid media storage key');
    }
    return key;
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

  async presignDownload(storageKey: string, fileName?: string, expiresInSeconds = 300): Promise<string> {
    const key = this.normalizeKey(storageKey);
    const safeName = String(fileName || '').replace(/["\r\n]/g, '_');
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ...(safeName ? { ResponseContentDisposition: `attachment; filename="${safeName}"` } : {}),
    });
    return getSignedUrl(this.getClient(), command, { expiresIn: Math.min(Math.max(expiresInSeconds, 60), 900) });
  }

  async presignUpload(req: PresignRequest): Promise<PresignResult> {
    const key = this.normalizeKey(req.storageKey || req.fileName);
    const signedHeaders = new Set([
      'content-type',
      'content-length',
      'x-amz-checksum-sha256',
      ...Object.keys(req.metadata || {}).map((name) => `x-amz-meta-${name}`),
    ]);
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: req.mimeType || 'application/octet-stream',
      ContentLength: req.size,
      ChecksumSHA256: req.checksumSha256,
      Metadata: req.metadata,
    });
    const uploadUrl = await getSignedUrl(this.getClient(), command, {
      expiresIn: 900,
      signableHeaders: signedHeaders,
      unhoistableHeaders: signedHeaders,
    });
    const headers: Record<string, string> = {
      'Content-Type': req.mimeType || 'application/octet-stream',
      'Content-Length': String(req.size),
    };
    if (req.checksumSha256) headers['x-amz-checksum-sha256'] = req.checksumSha256;
    for (const [name, value] of Object.entries(req.metadata || {})) {
      headers[`x-amz-meta-${name}`] = value;
    }
    return {
      uploadMode: 'direct',
      uploadUrl,
      method: 'PUT',
      headers,
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

  async getObjectMetadata(storageKey: string): Promise<StorageObjectMetadata | null> {
    try {
      const key = this.normalizeKey(storageKey);
      const result = await this.getClient().send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ChecksumMode: 'ENABLED',
      }));
      return {
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        checksumSha256: result.ChecksumSHA256,
        metadata: result.Metadata,
      };
    } catch {
      return null;
    }
  }
}
