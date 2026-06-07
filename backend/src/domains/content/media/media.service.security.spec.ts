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
});
