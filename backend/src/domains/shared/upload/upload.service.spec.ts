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
