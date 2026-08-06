import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';
import { MediaService } from '@/domains/content/media/media.service';
import { MediaAssetStatus, MediaType, MediaVisibility } from '@/domains/content/media/media.types';

describe('MediaService security regression', () => {
  const buildService = (asset: any) => {
    process.env.MEDIA_PRIVATE_ENFORCEMENT = 'true';
    const mediaModel = {
      findById: jest.fn().mockResolvedValue(asset),
    };
    return {
      service: new MediaService(mediaModel as any, { deleteByStorageKey: jest.fn() } as any, {} as any),
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
    const service = new MediaService(mediaModel as any, {} as any, {} as any);

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
});
