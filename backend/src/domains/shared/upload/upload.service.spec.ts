import { ForbiddenException } from '@nestjs/common';
import { FileType, UploadService } from './upload.service';

describe('UploadService legacy deletion ownership', () => {
  const mediaAssetModel = { findOne: jest.fn() };
  const service = new UploadService(
    {} as any,
    mediaAssetModel as any,
    {} as any,
    {} as any,
    {} as any,
  );

  beforeEach(() => jest.clearAllMocks());

  it('rejects deletion by a user who did not upload the asset', async () => {
    mediaAssetModel.findOne.mockResolvedValue({
      uploadedBy: { toString: () => 'owner-id' },
      status: 'uploaded',
    });

    await expect(
      service.deleteFile('asset.png', FileType.IMAGE, 'other-user'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not delete unregistered files by filename', async () => {
    mediaAssetModel.findOne.mockResolvedValue(null);

    await expect(
      service.deleteFile('unknown.png', FileType.IMAGE, 'owner-id'),
    ).resolves.toBe(false);
  });
});

describe('UploadService protected S3 downloads', () => {
  const originalMirrorSetting = process.env.MEDIA_STORAGE_MIRROR_S3;

  afterEach(() => {
    if (originalMirrorSetting === undefined) delete process.env.MEDIA_STORAGE_MIRROR_S3;
    else process.env.MEDIA_STORAGE_MIRROR_S3 = originalMirrorSetting;
  });

  it('resolves an existing private media access URL to its S3 storage key', async () => {
    process.env.MEDIA_STORAGE_MIRROR_S3 = 'true';
    const assetId = '507f1f77bcf86cd799439011';
    const mediaAssetModel = {
      findOne: jest.fn().mockResolvedValue({ storageKey: 'document/product.pdf' }),
    };
    const s3StorageAdapter = {
      presignDownload: jest.fn().mockResolvedValue('https://storage.example/download'),
    };
    const service = new UploadService(
      {} as any,
      mediaAssetModel as any,
      {} as any,
      {} as any,
      s3StorageAdapter as any,
    );

    await expect(
      service.createProtectedDownloadUrl(`https://api.example/api/media/${assetId}/access`, 'product.pdf'),
    ).resolves.toBe('https://storage.example/download');
    expect(mediaAssetModel.findOne).toHaveBeenCalledWith({
      _id: assetId,
      status: { $ne: 'deleted' },
    });
    expect(s3StorageAdapter.presignDownload).toHaveBeenCalledWith('document/product.pdf', 'product.pdf', 300);
  });
});
