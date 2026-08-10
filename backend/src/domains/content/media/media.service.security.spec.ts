import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';
import { MediaService } from '@/domains/content/media/media.service';
import { MediaAssetStatus, MediaType, MediaVisibility } from '@/domains/content/media/media.types';

describe('MediaService security regression', () => {
  const buildService = (asset: any) => {
    delete process.env.MEDIA_PRIVATE_ENFORCEMENT;
    const mediaModel = {
      findById: jest.fn().mockResolvedValue(asset),
    };
    return {
      service: new MediaService(
        mediaModel as any,
        { deleteByStorageKey: jest.fn() } as any,
        {} as any,
        {} as any,
      ),
      mediaModel,
    };
  };

  afterEach(() => {
    delete process.env.MEDIA_PRIVATE_ENFORCEMENT;
  });

  it('blocks private media access for users who do not own the asset', async () => {
    const asset = {
      _id: new Types.ObjectId(),
      visibility: MediaVisibility.PRIVATE,
      status: MediaAssetStatus.UPLOADED,
      mediaType: MediaType.DOCUMENT,
      uploadedBy: new Types.ObjectId(),
      url: 'https://api.chabaqa.io/uploads/document/private.pdf',
      storageKey: 'document/private.pdf',
    };
    const { service } = buildService(asset);

    await expect(
      service.getAccess(String(asset._id), { userId: new Types.ObjectId().toString() }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows private media access for the owner and returns a short-lived signed URL', async () => {
    const ownerId = new Types.ObjectId();
    const asset = {
      _id: new Types.ObjectId(),
      visibility: MediaVisibility.PRIVATE,
      status: MediaAssetStatus.UPLOADED,
      mediaType: MediaType.DOCUMENT,
      uploadedBy: ownerId,
      url: 'https://api.chabaqa.io/uploads/document/private.pdf',
      storageKey: 'document/private.pdf',
    };
    const { service } = buildService(asset);

    const result = await service.getAccess(String(asset._id), { userId: ownerId.toString() });

    expect(result.data).toEqual(expect.objectContaining({
      assetId: String(asset._id),
      expiresInSeconds: 300,
      visibility: MediaVisibility.PRIVATE,
    }));
    expect(result.data.url).toContain(`/api/media/private/${asset._id}/file?`);
  });

  it('rejects invalid private media stream tokens', async () => {
    const assetId = new Types.ObjectId().toString();
    const { service } = buildService(null);

    await expect(
      service.streamPrivateAsset(assetId, 'bad-token', Math.floor(Date.now() / 1000) + 300, {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('lists only the requester-owned assets when building a community brand library', async () => {
    const ownerId = new Types.ObjectId();
    const asset = {
      _id: new Types.ObjectId(),
      visibility: MediaVisibility.PUBLIC,
      status: MediaAssetStatus.UPLOADED,
      mediaType: MediaType.IMAGE,
      uploadedBy: ownerId,
      url: 'https://api.chabaqa.io/uploads/image/logo.png',
      storageKey: 'image/logo.png',
      purpose: 'community_logo',
      mimeType: 'image/png',
      size: 42,
      createdAt: new Date(),
    };
    const exec = jest.fn().mockResolvedValue([asset]);
    const limit = jest.fn().mockReturnValue({ exec });
    const sort = jest.fn().mockReturnValue({ limit });
    const find = jest.fn().mockReturnValue({ sort });
    const mediaModel = { find };
    const service = new MediaService(mediaModel as any, {} as any, {} as any, {} as any);

    const result = await service.listAssets(
      { userId: ownerId.toString() },
      { entityType: 'community', entityId: 'community-1', limit: 999 },
    );

    expect(find).toHaveBeenCalledWith(expect.objectContaining({
      uploadedBy: ownerId,
      entityType: 'community',
      entityId: 'community-1',
      status: { $ne: MediaAssetStatus.DELETED },
    }));
    expect(limit).toHaveBeenCalledWith(100);
    expect(result.data).toHaveLength(1);
  });

  it('does not classify private or tombstoned media as publicly servable storage', async () => {
    const privateModel = {
      exists: jest.fn().mockResolvedValueOnce({ _id: new Types.ObjectId() }),
    };
    const privateService = new MediaService(privateModel as any, {} as any, {} as any, {} as any);
    await expect(privateService.getStorageAccess('document/private.pdf')).resolves.toBe(MediaVisibility.PRIVATE);

    const deletedModel = {
      exists: jest.fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ _id: new Types.ObjectId() }),
    };
    const deletedService = new MediaService(deletedModel as any, {} as any, {} as any, {} as any);
    await expect(deletedService.getStorageAccess('document/deleted.pdf')).resolves.toBe('blocked');
  });

  describe('direct S3 upload verification', () => {
    const ownerId = new Types.ObjectId().toString();
    const checksum = 'a'.repeat(64);
    const payload = {
      fileName: 'lesson.mp4',
      mimeType: 'video/mp4',
      size: 1024,
      checksum,
      purpose: 'course_video',
      entityType: 'course',
      entityId: 'course-1',
    } as any;

    const buildDirectService = () => {
      process.env.MEDIA_PRESIGNED_ENABLED = 'true';
      process.env.MEDIA_STORAGE_DRIVER = 's3';
      const mediaModel = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      };
      const s3StorageAdapter = {
        presignUpload: jest.fn().mockResolvedValue({
          uploadMode: 'direct',
          uploadUrl: 'https://storage.example/upload',
          method: 'PUT',
          expiresInSeconds: 900,
        }),
        getObjectMetadata: jest.fn(),
      };
      return {
        service: new MediaService(mediaModel as any, {} as any, s3StorageAdapter as any, {} as any),
        mediaModel,
        s3StorageAdapter,
      };
    };

    afterEach(() => {
      delete process.env.MEDIA_PRESIGNED_ENABLED;
      delete process.env.MEDIA_STORAGE_DRIVER;
    });

    it('signs the owner, media context, checksum, MIME type, and size into S3 metadata', async () => {
      const { service, s3StorageAdapter } = buildDirectService();

      const result = await service.createPresign(payload, ownerId);

      const request = s3StorageAdapter.presignUpload.mock.calls[0][0];
      expect(request).toEqual(expect.objectContaining({
        fileName: payload.fileName,
        mimeType: payload.mimeType,
        size: payload.size,
        checksumSha256: Buffer.from(checksum, 'hex').toString('base64'),
      }));
      expect(request.storageKey).toMatch(/^course_video\/[0-9a-f-]+\.mp4$/);
      expect(request.metadata).toEqual(expect.objectContaining({
        'media-owner': ownerId,
        'media-purpose': 'course_video',
        'media-entity-type': `v_${Buffer.from('course').toString('base64url')}`,
        'media-entity-id': `v_${Buffer.from('course-1').toString('base64url')}`,
        'media-size': '1024',
        'media-mime-type': 'video/mp4',
        'media-checksum': checksum,
      }));
      expect(result.data).toEqual(expect.objectContaining({
        uploadMode: 'direct',
        purpose: 'course_video',
        visibility: MediaVisibility.PRIVATE,
      }));
    });

    it('rejects completion when the object was signed for another owner', async () => {
      const { service, s3StorageAdapter, mediaModel } = buildDirectService();
      await service.createPresign(payload, ownerId);
      const request = s3StorageAdapter.presignUpload.mock.calls[0][0];
      s3StorageAdapter.getObjectMetadata.mockResolvedValue({
        contentType: request.mimeType,
        contentLength: request.size,
        checksumSha256: request.checksumSha256,
        metadata: { ...request.metadata, 'media-owner': new Types.ObjectId().toString() },
      });

      await expect(service.completeUpload({ ...payload, storageKey: request.storageKey }, ownerId))
        .rejects.toBeInstanceOf(BadRequestException);
      expect(mediaModel.create).not.toHaveBeenCalled();
    });

    it('rejects completion when S3 reports a different checksum', async () => {
      const { service, s3StorageAdapter, mediaModel } = buildDirectService();
      await service.createPresign(payload, ownerId);
      const request = s3StorageAdapter.presignUpload.mock.calls[0][0];
      s3StorageAdapter.getObjectMetadata.mockResolvedValue({
        contentType: request.mimeType,
        contentLength: request.size,
        checksumSha256: Buffer.from('b'.repeat(64), 'hex').toString('base64'),
        metadata: request.metadata,
      });

      await expect(service.completeUpload({ ...payload, storageKey: request.storageKey }, ownerId))
        .rejects.toBeInstanceOf(BadRequestException);
      expect(mediaModel.create).not.toHaveBeenCalled();
    });

    it('registers only an object whose signed metadata and checksum match the completion request', async () => {
      const { service, s3StorageAdapter, mediaModel } = buildDirectService();
      await service.createPresign(payload, ownerId);
      const request = s3StorageAdapter.presignUpload.mock.calls[0][0];
      s3StorageAdapter.getObjectMetadata.mockResolvedValue({
        contentType: request.mimeType,
        contentLength: request.size,
        checksumSha256: request.checksumSha256,
        metadata: request.metadata,
      });
      const asset = {
        _id: new Types.ObjectId(),
        ...payload,
        storageKey: request.storageKey,
        mediaType: MediaType.VIDEO,
        visibility: MediaVisibility.PRIVATE,
        status: MediaAssetStatus.UPLOADED,
        save: jest.fn(),
      };
      mediaModel.create.mockResolvedValue(asset);

      const result = await service.completeUpload({ ...payload, storageKey: request.storageKey }, ownerId);

      expect(mediaModel.create).toHaveBeenCalledWith(expect.objectContaining({
        uploadedBy: new Types.ObjectId(ownerId),
        checksum,
        storageKey: request.storageKey,
      }));
      expect(asset.save).toHaveBeenCalled();
      expect(result.data.checksum).toBe(checksum);
    });
  });
});
