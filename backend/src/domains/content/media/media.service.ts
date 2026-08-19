import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createHmac, randomUUID } from 'crypto';
import { createReadStream, existsSync } from 'fs';
import { Model, Types } from 'mongoose';
import { basename, extname, isAbsolute, join, relative, resolve } from 'path';
import { MediaAsset, MediaAssetDocument } from '@/infrastructure/database/schemas/content/media-asset.schema';
import { MediaCompleteDto, MediaPresignDto } from '@/domains/content/media/dto/media.dto';
import {
  MediaAssetStatus,
  MediaPurpose,
  MediaType,
  MediaVisibility,
  PURPOSE_DEFAULT_VISIBILITY,
  TYPE_MAX_BYTES,
} from '@/domains/content/media/media.types';
import { DiskStorageAdapter } from '@/domains/content/media/storage/disk-storage.adapter';
import { S3StorageAdapter } from '@/domains/content/media/storage/s3-storage.adapter';
import { StorageAdapter, StorageObjectMetadata } from '@/domains/content/media/storage/storage-adapter.interface';
import { getMediaPrivateTokenSecret } from '@/shared/utils/security-config.util';
import { ContentAccessService } from '@/shared/services/content-access.service';
import { getAllowedUploadCategory, isAllowedUploadMime } from '@/domains/shared/upload/upload-security.policy';

interface DirectUploadDetails {
  fileName: string;
  mimeType: string;
  size: number;
  checksum: string;
  checksumSha256: string;
  purpose: MediaPurpose;
  visibility: MediaVisibility;
  entityType?: string;
  entityId?: string;
  mediaType: MediaType;
  extension: string;
}

@Injectable()
export class MediaService {
  private readonly uploadsRoot = join(process.cwd(), process.env.UPLOAD_PATH || 'uploads');
  private readonly publicBaseUrl = (process.env.MEDIA_PUBLIC_BASE_URL || process.env.SERVER_URL || 'https://api.chabaqa.io').replace(/\/+$/, '');
  private readonly tokenSecret = getMediaPrivateTokenSecret();
  private readonly presignedEnabled = process.env.MEDIA_PRESIGNED_ENABLED === 'true';
  private readonly storageReadPreference = (process.env.MEDIA_STORAGE_READ_PREFERENCE || process.env.MEDIA_STORAGE_DRIVER || 'disk').toLowerCase();

  constructor(
    @InjectModel(MediaAsset.name) private readonly mediaModel: Model<MediaAssetDocument>,
    private readonly diskStorageAdapter: DiskStorageAdapter,
    private readonly s3StorageAdapter: S3StorageAdapter,
    private readonly contentAccessService: ContentAccessService,
  ) {}

  getStorageDriver(): 'disk' | 's3' {
    return (process.env.MEDIA_STORAGE_DRIVER || 'disk').toLowerCase() === 's3' ? 's3' : 'disk';
  }

  private getStorageAdapter(): StorageAdapter {
    return this.getStorageDriver() === 's3' ? this.s3StorageAdapter : this.diskStorageAdapter;
  }

  private toObjectId(value?: string): Types.ObjectId | undefined {
    if (!value || !Types.ObjectId.isValid(value)) return undefined;
    return new Types.ObjectId(value);
  }

  private getVisibility(purpose?: MediaPurpose, visibility?: MediaVisibility): MediaVisibility {
    if (visibility) return visibility;
    if (!purpose) return MediaVisibility.PUBLIC;
    return PURPOSE_DEFAULT_VISIBILITY[purpose] || MediaVisibility.PUBLIC;
  }

  private getPurpose(value?: string): MediaPurpose {
    if (!value) return MediaPurpose.GENERIC;
    if (!Object.values(MediaPurpose).includes(value as MediaPurpose)) {
      throw new BadRequestException('Invalid media purpose');
    }
    return value as MediaPurpose;
  }

  private getRequestedVisibility(purpose: MediaPurpose, value?: string): MediaVisibility {
    if (value && !Object.values(MediaVisibility).includes(value as MediaVisibility)) {
      throw new BadRequestException('Invalid media visibility');
    }
    return this.getVisibility(purpose, value as MediaVisibility | undefined);
  }

  private normalizeEntityValue(value: string | undefined, maxLength: number): string | undefined {
    const normalized = value?.trim();
    if (normalized && normalized.length > maxLength) {
      throw new BadRequestException('Invalid media entity reference');
    }
    return normalized || undefined;
  }

  private encodeMetadataValue(value?: string): string {
    return value ? `v_${Buffer.from(value, 'utf8').toString('base64url')}` : 'none';
  }

  private requireRequesterId(userId?: string): string {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new UnauthorizedException('Authenticated media owner is required');
    }
    return new Types.ObjectId(userId).toString();
  }

  private getDirectUploadDetails(dto: MediaPresignDto | MediaCompleteDto): DirectUploadDetails {
    const fileName = String(dto.fileName || '').trim();
    if (
      !fileName ||
      fileName.length > 255 ||
      fileName.includes('/') ||
      fileName.includes('\\') ||
      fileName.includes('\0')
    ) {
      throw new BadRequestException('Invalid media file name');
    }

    const category = getAllowedUploadCategory(fileName);
    if (!category) throw new BadRequestException('Unsupported media file type');
    const mimeType = String(dto.mimeType || '').trim().toLowerCase();
    if (!isAllowedUploadMime(category, mimeType)) {
      throw new BadRequestException('Invalid MIME type for media file');
    }

    const mediaType = category as MediaType;
    const size = dto.size;
    if (!Number.isSafeInteger(size) || size < 1 || size > TYPE_MAX_BYTES[mediaType]) {
      throw new BadRequestException('Invalid media file size');
    }

    const checksum = String(dto.checksum || '').toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(checksum)) {
      throw new BadRequestException('A SHA-256 checksum is required');
    }

    const purpose = this.getPurpose(dto.purpose);
    return {
      fileName,
      mimeType,
      size,
      checksum,
      checksumSha256: Buffer.from(checksum, 'hex').toString('base64'),
      purpose,
      visibility: this.getRequestedVisibility(purpose, dto.visibility),
      entityType: this.normalizeEntityValue(dto.entityType, 80),
      entityId: this.normalizeEntityValue(dto.entityId, 120),
      mediaType,
      extension: extname(fileName).toLowerCase(),
    };
  }

  private getDirectUploadMetadata(ownerId: string, details: DirectUploadDetails): Record<string, string> {
    return {
      'media-owner': ownerId,
      'media-purpose': details.purpose,
      'media-entity-type': this.encodeMetadataValue(details.entityType),
      'media-entity-id': this.encodeMetadataValue(details.entityId),
      'media-visibility': details.visibility,
      'media-size': String(details.size),
      'media-mime-type': details.mimeType,
      'media-checksum': details.checksum,
    };
  }

  private validateDirectStorageKey(storageKey: string, purpose: MediaPurpose, extension: string): string {
    const providedKey = String(storageKey || '');
    const key = providedKey.replace(/^\/+/, '');
    const keyPattern = new RegExp(
      `^${purpose}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}${extension.replace('.', '\\.')}$`,
      'i',
    );
    if (providedKey !== key || !keyPattern.test(key)) {
      throw new BadRequestException('Invalid direct upload storage key');
    }
    return key;
  }

  private isDirectObjectValid(
    object: StorageObjectMetadata | null,
    expectedMetadata: Record<string, string>,
    details: DirectUploadDetails,
  ): boolean {
    if (!object || object.contentLength !== details.size || object.contentType !== details.mimeType) return false;
    if (object.checksumSha256 !== details.checksumSha256) return false;
    const metadata = Object.fromEntries(
      Object.entries(object.metadata || {}).map(([key, value]) => [key.toLowerCase(), value]),
    );
    return Object.entries(expectedMetadata).every(([key, value]) => metadata[key] === value);
  }

  private buildPublicFileUrl(storageKey: string): string {
    return `${this.publicBaseUrl}/uploads/${storageKey}`;
  }

  private buildSignedToken(assetId: string, expires: number): string {
    const payload = `${assetId}.${expires}`;
    return createHmac('sha256', this.tokenSecret).update(payload).digest('hex');
  }

  private buildPrivateStreamUrl(assetId: string, ttlSeconds = 300): string {
    const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
    const token = this.buildSignedToken(assetId, expires);
    return `${this.publicBaseUrl}/api/media/private/${assetId}/file?expires=${expires}&token=${token}`;
  }

  isPrivateTokenValid(assetId: string, token: string, expires: number): boolean {
    if (!token || !expires || Number.isNaN(expires)) return false;
    if (expires < Math.floor(Date.now() / 1000)) return false;
    const expected = this.buildSignedToken(assetId, expires);
    return expected === token;
  }

  buildCanonicalData(asset: MediaAssetDocument) {
    return {
      assetId: String(asset._id),
      url: asset.url,
      mediaType: asset.mediaType,
      purpose: asset.purpose,
      visibility: asset.visibility,
      mimeType: asset.mimeType,
      size: asset.size,
      checksum: asset.checksum || '',
      storageKey: asset.storageKey,
      createdAt: asset.createdAt,
      status: asset.status,
      entityType: asset.entityType,
      entityId: asset.entityId,
    };
  }

  async createPresign(dto: MediaPresignDto, userId?: string) {
    if (!this.presignedEnabled) {
      return {
        success: true,
        data: {
          uploadMode: 'proxy',
          uploadUrl: '/api/media/upload',
          method: 'POST',
          expiresInSeconds: 0,
          note: 'Presigned uploads are disabled. Use proxy upload endpoint.',
        },
      };
    }

    if (this.getStorageDriver() !== 's3') {
      const result = await this.getStorageAdapter().presignUpload({
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        size: dto.size,
      });
      return {
        success: true,
        data: result,
      };
    }

    const ownerId = this.requireRequesterId(userId);
    const details = this.getDirectUploadDetails(dto);
    const storageKey = `${details.purpose}/${randomUUID()}${details.extension}`;
    const result = await this.getStorageAdapter().presignUpload({
      fileName: details.fileName,
      mimeType: details.mimeType,
      size: details.size,
      storageKey,
      checksumSha256: details.checksumSha256,
      metadata: this.getDirectUploadMetadata(ownerId, details),
    });

    return {
      success: true,
      data: {
        ...result,
        purpose: details.purpose,
        visibility: details.visibility,
      },
    };
  }

  async completeUpload(dto: MediaCompleteDto, userId?: string) {
    if (!this.presignedEnabled || this.getStorageDriver() !== 's3') {
      throw new BadRequestException('Direct uploads are not enabled');
    }

    const ownerId = this.requireRequesterId(userId);
    const details = this.getDirectUploadDetails(dto);
    const storageKey = this.validateDirectStorageKey(dto.storageKey, details.purpose, details.extension);
    const expectedMetadata = this.getDirectUploadMetadata(ownerId, details);
    const existing = await this.mediaModel.findOne({
      storageKey,
      status: { $ne: MediaAssetStatus.DELETED },
    });
    if (existing) throw new BadRequestException('Direct upload has already been completed');

    const object = await this.getStorageAdapter().getObjectMetadata(storageKey);
    if (!this.isDirectObjectValid(object, expectedMetadata, details)) {
      throw new BadRequestException('Direct upload verification failed');
    }

    const baseUrl = this.buildPublicFileUrl(storageKey);
    const asset = await this.mediaModel.create({
      mediaType: details.mediaType,
      purpose: details.purpose,
      visibility: details.visibility,
      status: MediaAssetStatus.UPLOADED,
      filename: details.fileName,
      originalName: details.fileName,
      storageKey,
      url: baseUrl,
      mimeType: details.mimeType,
      size: details.size,
      checksum: details.checksum,
      uploadedBy: this.toObjectId(ownerId),
      entityType: details.entityType,
      entityId: details.entityId,
    });

    if (details.visibility === MediaVisibility.PRIVATE) {
      asset.url = `${this.publicBaseUrl}/api/media/${asset._id}/access`;
      await asset.save();
    }

    return {
      success: true,
      data: this.buildCanonicalData(asset),
    };
  }

  private async assertAssetAccess(asset: MediaAssetDocument, requester?: { userId?: string; isAdmin?: boolean }): Promise<void> {
    const requesterId = requester?.userId || '';
    if (requester?.isAdmin || (asset.uploadedBy && String(asset.uploadedBy) === requesterId)) return;
    if (!requesterId) throw new UnauthorizedException('Authentication is required');
    if (asset.entityType === 'course') return void await this.contentAccessService.assertCourseAccess(requesterId, String(asset.entityId));
    if (asset.entityType === 'challenge') return void await this.contentAccessService.assertChallengeAccess(requesterId, String(asset.entityId));
    if (asset.entityType === 'resource') return void await this.contentAccessService.assertResourceAccess(requesterId, String(asset.entityId));
    if (asset.visibility === MediaVisibility.PRIVATE) throw new ForbiddenException('You do not have access to this media');
  }

  async getStorageAccess(storageKey: string): Promise<MediaVisibility | 'blocked' | undefined> {
    const key = storageKey.replace(/^\/+/, '');
    const privateAsset = await this.mediaModel.exists({
      storageKey: key,
      visibility: MediaVisibility.PRIVATE,
    });
    if (privateAsset) return MediaVisibility.PRIVATE;

    const publicAsset = await this.mediaModel.exists({
      storageKey: key,
      visibility: MediaVisibility.PUBLIC,
      status: {
        $in: [MediaAssetStatus.UPLOADED, MediaAssetStatus.ATTACHED, MediaAssetStatus.ORPHANED],
      },
    });
    if (publicAsset) return MediaVisibility.PUBLIC;

    const registeredAsset = await this.mediaModel.exists({ storageKey: key });
    return registeredAsset ? 'blocked' : undefined;
  }

  async getAsset(assetId: string, requester?: { userId?: string; isAdmin?: boolean }) {
    const asset = await this.mediaModel.findById(assetId);
    if (!asset || asset.status === MediaAssetStatus.DELETED) {
      throw new NotFoundException('Media asset not found');
    }
    await this.assertAssetAccess(asset, requester);
    return {
      success: true,
      data: this.buildCanonicalData(asset),
    };
  }

  async listAssets(
    requester: { userId?: string; isAdmin?: boolean },
    filters: { entityType?: string; entityId?: string; limit?: number } = {},
  ) {
    if (!requester.userId && !requester.isAdmin) {
      throw new UnauthorizedException('Authentication is required to list media');
    }
    const query: Record<string, unknown> = {
      status: { $ne: MediaAssetStatus.DELETED },
    };
    if (!requester.isAdmin) {
      const owner = this.toObjectId(requester.userId);
      if (!owner) throw new UnauthorizedException('Invalid media owner');
      query.uploadedBy = owner;
    }
    if (filters.entityType) query.entityType = filters.entityType;
    if (filters.entityId) query.entityId = filters.entityId;
    const limit = Math.max(1, Math.min(100, Math.floor(filters.limit || 48)));
    const assets = await this.mediaModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    return {
      success: true,
      data: assets.map((asset) => this.buildCanonicalData(asset)),
    };
  }

  async getAccess(assetId: string, requester?: { userId?: string; isAdmin?: boolean }) {
    const asset = await this.mediaModel.findById(assetId);
    if (!asset || asset.status === MediaAssetStatus.DELETED) {
      throw new NotFoundException('Media asset not found');
    }

    if (asset.visibility === MediaVisibility.PRIVATE) {
      await this.assertAssetAccess(asset, requester);
      return {
        success: true,
        data: {
          assetId: String(asset._id),
          url: this.buildPrivateStreamUrl(String(asset._id)),
          expiresInSeconds: 300,
          visibility: asset.visibility,
        },
      };
    }

    return {
      success: true,
      data: {
        assetId: String(asset._id),
        url: asset.url,
        expiresInSeconds: 0,
        visibility: asset.visibility,
      },
    };
  }

  async streamPrivateAsset(assetId: string, token: string, expires: number, res: any) {
    if (!this.isPrivateTokenValid(assetId, token, expires)) {
      throw new UnauthorizedException('Invalid or expired media token');
    }

    const asset = await this.mediaModel.findById(assetId);
    if (!asset || asset.status === MediaAssetStatus.DELETED) {
      throw new NotFoundException('Media asset not found');
    }

    const extension = extname(asset.storageKey).toLowerCase();
    const inlineSafeExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp3', '.wav', '.ogg', '.aac', '.flac', '.mp4', '.mov', '.webm']);
    res.setHeader('Content-Type', asset.mimeType || 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    if (!inlineSafeExtensions.has(extension)) {
      const filename = basename(asset.storageKey).replace(/["\r\n]/g, '_') || 'download';
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }

    if (this.storageReadPreference === 's3') {
      try {
        const object = await this.s3StorageAdapter.getObjectStream(asset.storageKey);
        if (object.contentType) res.setHeader('Content-Type', object.contentType);
        if (object.contentLength) res.setHeader('Content-Length', String(object.contentLength));
        return object.stream.pipe(res);
      } catch {
        // Fall through to disk so rollback and partial migrations keep working.
      }
    }

    const uploadsRoot = resolve(this.uploadsRoot);
    const filePath = resolve(uploadsRoot, asset.storageKey);
    const relativePath = relative(uploadsRoot, filePath);
    if (!relativePath || relativePath.startsWith('..') || isAbsolute(relativePath)) {
      throw new BadRequestException('Invalid media storage path');
    }
    if (!existsSync(filePath)) {
      try {
        const object = await this.s3StorageAdapter.getObjectStream(asset.storageKey);
        if (object.contentType) res.setHeader('Content-Type', object.contentType);
        if (object.contentLength) res.setHeader('Content-Length', String(object.contentLength));
        return object.stream.pipe(res);
      } catch {
        throw new NotFoundException('Media file missing from storage');
      }
    }

    return createReadStream(filePath).pipe(res);
  }

  async deleteAsset(assetId: string, requester?: { userId?: string; isAdmin?: boolean }) {
    const asset = await this.mediaModel.findById(assetId);
    if (!asset || asset.status === MediaAssetStatus.DELETED) {
      throw new NotFoundException('Media asset not found');
    }

    const ownerId = asset.uploadedBy ? String(asset.uploadedBy) : '';
    const requesterId = requester?.userId || '';
    if (!requester?.isAdmin && ownerId && ownerId !== requesterId) {
      throw new ForbiddenException('You are not allowed to delete this media');
    }

    const adapters = this.getStorageDriver() === 's3'
      ? [this.s3StorageAdapter, this.diskStorageAdapter]
      : [this.diskStorageAdapter];
    await Promise.all(adapters.map(async (adapter) => {
      try {
        await adapter.deleteByStorageKey(asset.storageKey);
      } catch {
        // A mirrored copy may already be absent; preserve tombstone semantics.
      }
    }));

    asset.status = MediaAssetStatus.DELETED;
    asset.deletedAt = new Date();
    await asset.save();

    return {
      success: true,
      message: 'Media asset deleted',
      data: { assetId: String(asset._id), status: asset.status },
    };
  }

  async findById(assetId: string): Promise<MediaAssetDocument | null> {
    return this.mediaModel.findById(assetId);
  }
}
