import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { existsSync } from 'fs';
import { join } from 'path';
import { Model } from 'mongoose';
import { MediaAsset, MediaAssetDocument } from '@/infrastructure/database/schemas/content/media-asset.schema';
import { MediaAssetStatus, MediaPurpose } from '@/domains/content/media/media.types';
import { UploadService } from '@/domains/shared/upload/upload.service';
import { resolveUploadsRoot } from '@/domains/shared/upload/upload-paths';

export interface ResolvedMediaUrls {
  logoUrl: string;
  coverUrl: string;
  thumbnailUrl: string;
}

type CommunityLike = Record<string, any>;

@Injectable()
export class MediaResolverService {
  private readonly uploadsRoot = resolveUploadsRoot();

  constructor(
    @InjectModel(MediaAsset.name) private readonly mediaAssetModel: Model<MediaAssetDocument>,
    private readonly uploadService: UploadService,
  ) {}

  private fallbackAvatar(name: string, size = 256): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Community')}&size=${size}&background=8e78fb&color=ffffff&format=png`;
  }

  private fallbackCover(community: CommunityLike): string {
    const category = String(community.category || community.settings?.template || '').toLowerCase();
    if (category.includes('fitness') || String(community.name || '').toLowerCase().includes('fitness')) {
      return 'https://chabaqa.io/banners-community/community-3-fitness.png';
    }
    if (category.includes('design') || category.includes('brand')) {
      return 'https://chabaqa.io/banners-community/community-2-branding.png';
    }
    if (category.includes('dev') || category.includes('tech')) {
      return 'https://chabaqa.io/banners-community/community-4-dev.png';
    }
    return 'https://chabaqa.io/banners-community/community-1-email-marketing.png';
  }

  private localUploadExists(url: string): boolean {
    try {
      const parsed = /^https?:\/\//i.test(url) ? new URL(url).pathname : url;
      const path = parsed.startsWith('/') ? parsed : `/${parsed}`;
      if (!path.startsWith('/uploads/')) return true;
      const relativePath = path.replace(/^\/uploads\//, '');
      return existsSync(join(this.uploadsRoot, relativePath));
    } catch {
      return false;
    }
  }

  resolveCandidate(value?: unknown): string | undefined {
    if (!value || typeof value !== 'string') return undefined;
    const normalized = this.uploadService.ensureAbsoluteUrl(value.trim());
    if (!normalized || typeof normalized !== 'string') return undefined;
    if (normalized.includes('placeholder.com') || normalized.includes('placehold.co')) return undefined;
    if (!this.localUploadExists(normalized)) return undefined;
    return normalized;
  }

  private firstValid(candidates: unknown[], fallback: string): string {
    for (const candidate of candidates) {
      const resolved = this.resolveCandidate(candidate);
      if (resolved) return resolved;
    }
    return fallback;
  }

  async resolveCommunityMedia(community: CommunityLike): Promise<ResolvedMediaUrls> {
    const communityId = String(community?._id || community?.id || '');
    const mediaAssets = communityId
      ? await this.mediaAssetModel
          .find({
            entityType: 'community',
            entityId: communityId,
            purpose: { $in: [MediaPurpose.COMMUNITY_LOGO, MediaPurpose.COMMUNITY_COVER] },
            status: { $ne: MediaAssetStatus.DELETED },
            deletedAt: null,
          })
          .sort({ createdAt: -1 })
          .lean()
          .exec()
      : [];

    const logoAsset = mediaAssets.find((asset) => asset.purpose === MediaPurpose.COMMUNITY_LOGO)?.url;
    const coverAsset = mediaAssets.find((asset) => asset.purpose === MediaPurpose.COMMUNITY_COVER)?.url;
    const logoFallback = this.fallbackAvatar(community.name, 256);
    const coverFallback = this.fallbackCover(community);

    const logoUrl = this.firstValid(
      [community.logo, community.settings?.logo, logoAsset],
      logoFallback,
    );
    const coverUrl = this.firstValid(
      [community.coverImage, community.photo_de_couverture, community.settings?.heroBackground, coverAsset],
      coverFallback,
    );

    return {
      logoUrl,
      coverUrl,
      thumbnailUrl: logoUrl || coverUrl || logoFallback,
    };
  }
}
