import { existsSync } from 'fs';
import { MediaResolverService } from '@/shared/services/media-resolver.service';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));

describe('MediaResolverService', () => {
  const mediaAssetModel = {
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };
  const uploadService = {
    ensureAbsoluteUrl: jest.fn((value: string) => {
      if (!value) return value;
      if (value.startsWith('http')) return value;
      if (value.startsWith('/uploads/')) return `https://chabaqa.io${value}`;
      return value;
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mediaAssetModel.find.mockReturnThis();
    mediaAssetModel.sort.mockReturnThis();
    mediaAssetModel.lean.mockReturnThis();
    mediaAssetModel.exec.mockResolvedValue([]);
  });

  it('skips broken local upload URLs and returns fallback media', async () => {
    (existsSync as jest.Mock).mockReturnValue(false);
    const service = new MediaResolverService(mediaAssetModel as any, uploadService as any);

    const media = await service.resolveCommunityMedia({
      _id: 'community-1',
      name: 'Fitness Crew',
      logo: '/uploads/image/missing-logo.png',
      coverImage: '/uploads/image/missing-cover.png',
    });

    expect(media.logoUrl).toContain('ui-avatars.com');
    expect(media.coverUrl).toBe('https://chabaqa.io/banners-community/community-3-fitness.png');
    expect(media.thumbnailUrl).toBe(media.logoUrl);
  });

  it('uses valid local upload URLs when files exist', async () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    const service = new MediaResolverService(mediaAssetModel as any, uploadService as any);

    const media = await service.resolveCommunityMedia({
      _id: 'community-2',
      name: 'Design Crew',
      logo: '/uploads/image/logo.png',
      coverImage: '/uploads/image/cover.png',
    });

    expect(media).toEqual({
      logoUrl: 'https://chabaqa.io/uploads/image/logo.png',
      coverUrl: 'https://chabaqa.io/uploads/image/cover.png',
      thumbnailUrl: 'https://chabaqa.io/uploads/image/logo.png',
    });
  });
});
