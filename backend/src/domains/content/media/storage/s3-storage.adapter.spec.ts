jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3StorageAdapter } from '@/domains/content/media/storage/s3-storage.adapter';

describe('S3StorageAdapter direct upload signing', () => {
  beforeEach(() => {
    process.env.S3_ACCESS_KEY = 'test-access-key';
    process.env.S3_SECRET_KEY = 'test-secret-key';
    (getSignedUrl as jest.Mock).mockResolvedValue('https://storage.example/presigned-upload');
  });

  afterEach(() => {
    delete process.env.S3_ACCESS_KEY;
    delete process.env.S3_SECRET_KEY;
    jest.clearAllMocks();
  });

  it('requires checksum and media metadata headers to be signed rather than hoisted into the URL', async () => {
    const adapter = new S3StorageAdapter();
    const metadata = {
      'media-owner': 'owner-id',
      'media-checksum': 'a'.repeat(64),
    };

    const result = await adapter.presignUpload({
      fileName: 'asset.mp4',
      storageKey: 'course_video/asset.mp4',
      mimeType: 'video/mp4',
      size: 1024,
      checksumSha256: Buffer.from('a'.repeat(64), 'hex').toString('base64'),
      metadata,
    });

    const [, command, options] = (getSignedUrl as jest.Mock).mock.calls[0];
    expect(command.input).toEqual(expect.objectContaining({
      Bucket: process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || 'chabaqa-media',
      Key: 'course_video/asset.mp4',
      ContentType: 'video/mp4',
      ContentLength: 1024,
      ChecksumSHA256: Buffer.from('a'.repeat(64), 'hex').toString('base64'),
      Metadata: metadata,
    }));
    expect(options.signableHeaders).toEqual(expect.any(Set));
    expect(options.unhoistableHeaders).toEqual(expect.any(Set));
    for (const header of ['content-type', 'content-length', 'x-amz-checksum-sha256', 'x-amz-meta-media-owner', 'x-amz-meta-media-checksum']) {
      expect(options.signableHeaders.has(header)).toBe(true);
      expect(options.unhoistableHeaders.has(header)).toBe(true);
    }
    expect(result.headers).toEqual(expect.objectContaining({
      'Content-Type': 'video/mp4',
      'x-amz-checksum-sha256': Buffer.from('a'.repeat(64), 'hex').toString('base64'),
      'x-amz-meta-media-owner': 'owner-id',
    }));
  });
});
