import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Community, CommunityDocument } from '@/infrastructure/database/schemas/community/community.schema';
import { User, UserDocument } from '@/infrastructure/database/schemas/auth/user.schema';
import { Post, PostDocument } from '@/infrastructure/database/schemas/content/post.schema';
import { UploadService } from '@/domains/shared/upload/upload.service';
import { MediaResolverService } from '@/shared/services/media-resolver.service';

export interface CommunityFilters {
  search?: string;
  category?: string;
  type?: string;
  priceType?: string;
  minMembers?: number;
  sortBy?: string;
  page: number;
  limit: number;
  featured?: boolean;
  creatorId?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

@Injectable()
export class CommunitiesService {
  constructor(
    @InjectModel(Community.name) private communityModel: Model<CommunityDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    private readonly uploadService: UploadService,
    private readonly mediaResolver: MediaResolverService,
  ) { }

  private async withResolvedCommunityMedia<T extends Record<string, any>>(
    community: any,
    payload: T,
  ): Promise<T & { logoUrl: string; coverUrl: string; thumbnailUrl: string }> {
    const media = await this.mediaResolver.resolveCommunityMedia(community);
    return {
      ...payload,
      ...media,
    };
  }

  async searchCommunityMembers(
    communityId: string,
    query: string,
    limit: number = 8,
  ): Promise<Array<{ id: string; username: string; firstName: string; lastName?: string; avatar?: string }>> {
    const community = await this.communityModel
      .findById(communityId)
      .select('members createur')
      .exec();

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const allMemberIds = [
      ...(Array.isArray(community.members) ? community.members : []),
      community.createur,
    ]
      .filter(Boolean)
      .map((id) => new Types.ObjectId(id));

    if (allMemberIds.length === 0) return [];

    const cleanQuery = String(query || '').trim();
    const escapedQuery = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = escapedQuery ? new RegExp(escapedQuery, 'i') : null;

    const userQuery: any = {
      _id: { $in: allMemberIds },
    };

    if (regex) {
      userQuery.$or = [
        { username: regex },
        { name: regex },
        { email: regex },
      ];
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 20);

    const users = await this.userModel
      .find(userQuery)
      .select('username name profile_picture photo_profil')
      .sort({ username: 1, name: 1 })
      .limit(safeLimit)
      .exec();

    return users.map((user) => {
      const displayName = user.name || user.username || '';
      const [firstName, ...rest] = displayName.trim().split(' ');
      return {
        id: user._id.toString(),
        username: user.username || displayName,
        firstName: firstName || user.username || 'User',
        lastName: rest.length > 0 ? rest.join(' ') : undefined,
        avatar: this.uploadService.ensureAbsoluteUrl(user.photo_profil || user.profile_picture),
      };
    });
  }

  /**
   * Get communities for a specific user (joined + created)
   */
  async getCommunitiesByUser(
    userId: string,
    options: {
      page: number;
      limit: number;
      type: 'joined' | 'created' | 'all';
    },
    visibilityScope: 'owner' | 'public' = 'owner',
  ) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(Math.max(Number(options.limit) || 12, 1), 100);
    const skip = (page - 1) * limit;
    const isOwnerView = visibilityScope === 'owner';
    const userObjectId = new Types.ObjectId(userId);
    const visibilityFilter = isOwnerView ? {} : { isActive: true, isPrivate: false };
    const query: any = { ...visibilityFilter };

    if (options.type === 'created') {
      query.createur = userObjectId;
    } else if (options.type === 'joined') {
      if (!isOwnerView) {
        query._id = { $exists: false };
      } else {
        query.members = userObjectId;
        query.createur = { $ne: userObjectId };
      }
    } else {
      query.$or = isOwnerView
        ? [{ createur: userObjectId }, { members: userObjectId }]
        : [{ createur: userObjectId }];
    }

    const [communities, totalCount] = await Promise.all([
      this.communityModel
        .find(query)
        .populate('createur', 'name email profile_picture photo_profil')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.communityModel.countDocuments(query).exec(),
    ]);

    const paginatedCommunities = await Promise.all(communities.map(async (community) => {
      const communityData = community as any;
      const creatorId = String(communityData.createur?._id || communityData.createur || '');
      const isCreator = creatorId === userId;
      const admins = (communityData.admins || []).map((id: any) => String(id));
      const moderators = (communityData.moderators || communityData.moderateurs || []).map((id: any) => String(id));
      const role = isCreator
        ? 'owner'
        : admins.includes(userId)
          ? 'admin'
          : moderators.includes(userId)
            ? 'moderator'
            : 'member';

      return this.withResolvedCommunityMedia(communityData, {
        id: community._id.toString(),
        slug: communityData.slug,
        name: communityData.name || communityData.nom,
        logo: this.uploadService.ensureAbsoluteUrl(communityData.logo || communityData.image),
        coverImage: this.uploadService.ensureAbsoluteUrl(communityData.coverImage || communityData.cover || communityData.image),
        shortDescription: communityData.shortDescription || communityData.description,
        membersCount: communityData.members?.length || 0,
        role,
        type: isCreator ? 'created' : 'joined',
        createdAt: communityData.createdAt,
        joinedAt: isCreator ? undefined : communityData.createdAt,
        creator: {
          name: communityData.createur?.name || 'Unknown',
          avatar: this.uploadService.ensureAbsoluteUrl(communityData.createur?.profile_picture || communityData.createur?.photo_profil || 'https://placehold.co/64x64?text=MM')
        }
      });
    }));

    return {
      communities: paginatedCommunities,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  /**
   * Get communities with filters and pagination
   */
  async getCommunities(filters: CommunityFilters) {
    try {
      const {
        search,
        category,
        type,
        priceType,
        minMembers,
        sortBy,
        page,
        limit,
        featured,
        creatorId
      } = filters;

      // Build query
      const query: any = { isActive: true };

      // Search filter
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { short_description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      // Category filter
      if (category) {
        query.category = category;
      }

      // Type filter (map frontend types to backend fields)
      if (type) {
        switch (type) {
          case 'community':
            query.priceType = { $in: ['free', 'one-time', 'monthly', 'yearly'] };
            break;
          case 'course':
            // This would need to be implemented based on your course schema
            break;
          case 'challenge':
            // This would need to be implemented based on your challenge schema
            break;
          case 'product':
            // This would need to be implemented based on your product schema
            break;
          case 'oneToOne':
            // This would need to be implemented based on your session schema
            break;
        }
      }

      // Price type filter
      if (priceType) {
        if (priceType === 'free') {
          query.priceType = 'free';
        } else if (priceType === 'paid') {
          query.priceType = { $in: ['one-time', 'monthly', 'yearly'] };
        } else {
          query.priceType = priceType;
        }
      }

      // Minimum members filter
      if (minMembers) {
        query.membersCount = { $gte: minMembers };
      }

      // Featured filter
      if (featured !== undefined) {
        query.featured = featured;
      }

      // Creator filter
      if (creatorId) {
        query.createur = new Types.ObjectId(creatorId);
      }

      // Build sort
      let sort: any = { createdAt: -1 };
      if (sortBy) {
        switch (sortBy) {
          case 'popular':
            sort = { membersCount: -1, averageRating: -1 };
            break;
          case 'newest':
            sort = { createdAt: -1 };
            break;
          case 'members':
            sort = { membersCount: -1 };
            break;
          case 'rating':
            sort = { averageRating: -1, ratingCount: -1 };
            break;
          case 'price-low':
            sort = { 'pricing.price': 1 };
            break;
          case 'price-high':
            sort = { 'pricing.price': -1 };
            break;
        }
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Debug logging
      console.log('🔍 [COMMUNITIES SERVICE] Query:', JSON.stringify(query, null, 2));
      console.log('🔍 [COMMUNITIES SERVICE] Sort:', sort);
      console.log('🔍 [COMMUNITIES SERVICE] Page:', page, 'Limit:', limit, 'Skip:', skip);

      // Execute query
      const [communities, total] = await Promise.all([
        this.communityModel
          .find(query)
          .populate('createur', 'name email profile_picture photo_profil')
          .select('-members -admins -moderateurs -long_description')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .exec(),
        this.communityModel.countDocuments(query)
      ]);

      console.log('✅ [COMMUNITIES SERVICE] Found', communities.length, 'communities out of', total, 'total');

      // Helper to check if URL is a placeholder
      const isPlaceholderUrl = (url: string): boolean => {
        if (!url) return true;
        return url.includes('placeholder.com') ||
          url.includes('placehold.co') ||
          url.includes('via.placeholder');
      };

      // Transform communities to match frontend format
      const transformedCommunities = await Promise.all(communities.map(async (community, index) => {
        // Get the best available image (prioritize non-placeholder URLs)
        let imageUrl = community.photo_de_couverture;

        console.log(`🖼️ [BACKEND IMAGE] ${community.name}:`, {
          photo_de_couverture: community.photo_de_couverture,
          logo: community.logo,
          isPlaceholder: isPlaceholderUrl(imageUrl)
        });

        // If cover image is a placeholder, try other sources
        if (isPlaceholderUrl(imageUrl)) {
          // Try settings heroBackground first
          if (community.settings?.heroBackground && !isPlaceholderUrl(community.settings.heroBackground)) {
            imageUrl = community.settings.heroBackground;
            console.log(`  → Using heroBackground: ${imageUrl}`);
          }
          // Then try logo
          else if (community.logo && !isPlaceholderUrl(community.logo)) {
            imageUrl = community.logo;
            console.log(`  → Using logo: ${imageUrl}`);
          }
          // Return empty string instead of placeholder (mobile will use local category images)
          else {
            imageUrl = '';
            console.log(`  → No real image, returning empty string`);
          }
        } else {
          console.log(`  → Using photo_de_couverture: ${imageUrl}`);
        }

        return this.withResolvedCommunityMedia(community, {
          id: community._id.toString(), // Use actual MongoDB ID as string
          slug: community.slug,
          name: community.name,
          creator: (community.createur as any)?.name || 'Unknown',
          creatorAvatar: this.uploadService.ensureAbsoluteUrl((community.createur as any)?.profile_picture || (community.createur as any)?.photo_profil || 'https://placehold.co/64x64?text=MM'),
          description: community.short_description,
          category: community.category,
          type: 'community',
          members: community.membersCount,
          rating: (community as any).averageRating || 0,
          averageRating: (community as any).averageRating || 0,
          ratingCount: (community as any).ratingCount || 0,
          price: community.pricing?.price || community.fees_of_join || 0,
          priceType: community.priceType,
          image: this.uploadService.ensureAbsoluteUrl(imageUrl), // Will be empty string if no real image available
          logo: this.uploadService.ensureAbsoluteUrl(community.logo), // Also include logo field
          tags: community.tags,
          featured: community.featured,
          verified: community.isVerified,
          createdDate: community.createdAt,
          link: `/${community.slug}` // Add link field as expected by frontend
        });
      }));

      return {
        communities: transformedCommunities,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        filters: {
          categories: await this.getAvailableCategories(),
          sortOptions: [
            { value: 'popular', label: 'Most Popular' },
            { value: 'newest', label: 'Newest' },
            { value: 'members', label: 'Most Members' },
            { value: 'rating', label: 'Highest Rated' },
            { value: 'price-low', label: 'Price: Low to High' },
            { value: 'price-high', label: 'Price: High to Low' }
          ]
        }
      };
    } catch (error) {
      console.error('❌ [COMMUNITIES SERVICE] Error:', error);
      throw error;
    }
  }

  /**
   * Get global statistics
   */
  async getGlobalStats() {
    const [
      totalCommunities,
      totalMembers,
      averageRating,
      freeCommunities
    ] = await Promise.all([
      this.communityModel.countDocuments({ isActive: true }),
      this.communityModel.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: '$membersCount' } } }
      ]).then(result => result[0]?.total || 0),
      this.communityModel.aggregate([
        { $match: { isActive: true, ratingCount: { $gt: 0 } } },
        { $group: { _id: null, averageRating: { $avg: '$averageRating' } } }
      ]).then(result => Math.round((result[0]?.averageRating || 0) * 10) / 10),
      this.communityModel.countDocuments({ isActive: true, priceType: 'free' })
    ]);

    return {
      total: totalCommunities,
      totalMembers,
      avgRating: averageRating,
      freeCount: freeCommunities
    };
  }

  /**
   * Get categories with counts
   */
  async getCategories() {
    const categories = await this.communityModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Return simple string array as expected by frontend
    return ["All", ...categories.map(cat => cat._id)];
  }

  /**
   * Get community by slug
   */
  async getCommunityBySlug(slug: string) {
    const community = await this.communityModel
      .findOne({ slug, isActive: true })
      .populate('createur', 'name email profile_picture photo_profil bio')
      .exec();

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const media = await this.mediaResolver.resolveCommunityMedia(community as any);

    return {
      id: community._id.toString(), // String ID as per frontend spec
      slug: community.slug,
      name: community.name,
      creator: (community.createur as any).name || 'Unknown',
      creatorId: (community.createur as any)._id?.toString() || '1', // Add creatorId field
      creatorAvatar: this.uploadService.ensureAbsoluteUrl((community.createur as any).profile_picture || (community.createur as any).photo_profil || 'https://placehold.co/64x64?text=MM'),
      description: community.short_description,
      longDescription: community.long_description,
      category: community.category,
      type: 'community',
      members: community.membersCount,
      rating: (community as any).averageRating || 0,
      averageRating: (community as any).averageRating || 0,
      ratingCount: (community as any).ratingCount || 0,
      price: community.pricing?.price || community.fees_of_join || 0,
      priceType: community.priceType,
      image: media.coverUrl ||
             this.uploadService.ensureAbsoluteUrl(community.photo_de_couverture) || 
             this.uploadService.ensureAbsoluteUrl(community.creatorAvatar) || 
             `https://ui-avatars.com/api/?name=${encodeURIComponent(community.name)}&size=600&background=8e78fb&color=ffffff&format=png`,
      coverImage: media.coverUrl ||
                  this.uploadService.ensureAbsoluteUrl(community.photo_de_couverture) || 
                  this.uploadService.ensureAbsoluteUrl(community.creatorAvatar) || 
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(community.name)}&size=600&background=8e78fb&color=ffffff&format=png`,
      logoUrl: media.logoUrl,
      coverUrl: media.coverUrl,
      thumbnailUrl: media.thumbnailUrl,
      tags: community.tags,
      featured: community.featured,
      verified: community.isVerified,
      createdDate: community.createdAt,
      settings: {
        primaryColor: community.settings?.primaryColor || '#0066cc',
        secondaryColor: community.settings?.secondaryColor || '#f5f5f5',
        welcomeMessage: community.settings?.welcomeMessage || 'Welcome to our community!',
        features: community.settings?.features || [],
        benefits: community.settings?.benefits || [],
        template: community.settings?.template || 'default',
        fontFamily: community.settings?.fontFamily || 'Inter',
        borderRadius: community.settings?.borderRadius || 8,
        backgroundStyle: community.settings?.backgroundStyle || 'solid',
        heroLayout: community.settings?.heroLayout || 'centered',
        showStats: community.settings?.showStats || true,
        showFeatures: community.settings?.showFeatures || true,
        showTestimonials: community.settings?.showTestimonials || true,
        showPosts: community.settings?.showPosts || true,
        showFAQ: community.settings?.showFAQ || true,
        enableAnimations: community.settings?.enableAnimations || true,
        enableParallax: community.settings?.enableParallax || false,
        logo: media.logoUrl,
        heroBackground: media.coverUrl,
        gallery: community.settings?.gallery || [],
        videoUrl: community.settings?.videoUrl,
        socialLinks: community.settings?.socialLinks || {},
        customSections: community.settings?.customSections || [],
        metaTitle: community.settings?.metaTitle || community.name,
        metaDescription: community.settings?.metaDescription || community.short_description
      },
      stats: {
        totalRevenue: community.stats?.totalRevenue || 0,
        monthlyGrowth: community.stats?.monthlyGrowth || 0,
        engagementRate: community.stats?.engagementRate || 0,
        retentionRate: community.stats?.retentionRate || 0
      }
    };
  }

  /**
   * Get community posts
   */
  async getCommunityPosts(slug: string, pagination: PaginationOptions) {
    // First get the community to get its ID
    const community = await this.communityModel.findOne({ slug, isActive: true });
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Get posts for this community
    const [posts, total] = await Promise.all([
      this.postModel
        .find({ communityId: community._id.toString() })
        .populate('authorId', 'name email profile_picture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.postModel.countDocuments({ communityId: community._id.toString() })
    ]);

    const transformedPosts = posts.map((post, index) => ({
      id: index + 1, // Numeric ID as per API spec
      communityId: 1, // Default community ID
      author: (post.authorId as any).name || 'Unknown',
      authorAvatar: this.uploadService.ensureAbsoluteUrl((post.authorId as any).profile_picture || (post.authorId as any).photo_profil || '/placeholder.svg?height=40&width=40'),
      content: post.content,
      timestamp: this.formatTimestamp(post.createdAt),
      likes: post.likes || 0,
      comments: post.comments?.length || 0,
      views: Math.floor(Math.random() * 500) + 50, // Random views for demo
      type: 'announcement' // Default type
    }));

    return {
      posts: transformedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get search suggestions
   */
  async getSearchSuggestions(query: string, limit: number) {
    const suggestions: string[] = [];
    const categories: string[] = [];
    const tags: string[] = [];

    // Get community suggestions
    const communities = await this.communityModel
      .find({
        isActive: true,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      })
      .select('name slug tags')
      .limit(Math.ceil(limit / 3))
      .exec();

    suggestions.push(...communities.map(community => community.name));

    // Get category suggestions
    const categoryResults = await this.communityModel.aggregate([
      {
        $match: {
          isActive: true,
          category: { $regex: query, $options: 'i' }
        }
      },
      { $group: { _id: '$category' } },
      { $limit: Math.ceil(limit / 3) }
    ]);

    categories.push(...categoryResults.map((cat: any) => cat._id));

    // Get tag suggestions
    const tagResults = await this.communityModel.aggregate([
      {
        $match: {
          isActive: true,
          tags: { $in: [new RegExp(query, 'i')] }
        }
      },
      { $unwind: '$tags' },
      { $match: { tags: { $regex: query, $options: 'i' } } },
      { $group: { _id: '$tags' } },
      { $limit: Math.ceil(limit / 3) }
    ]);

    tags.push(...tagResults.map((tag: any) => tag._id));

    return {
      suggestions: suggestions.slice(0, limit),
      categories: categories.slice(0, limit),
      tags: tags.slice(0, limit)
    };
  }

  /**
   * Format timestamp to relative time
   */
  private formatTimestamp(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return date.toLocaleDateString();
  }

  /**
   * Get available categories for filters
   */
  private async getAvailableCategories(): Promise<string[]> {
    const categories = await this.communityModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category' } },
      { $sort: { _id: 1 } }
    ]);

    return categories.map(cat => cat._id);
  }
}
