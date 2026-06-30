import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Community, CommunityDocument } from '@/infrastructure/database/schemas/community/community.schema';
import { Cours, CoursDocument } from '@/infrastructure/database/schemas/learning/course.schema';
import { Event, EventDocument } from '@/infrastructure/database/schemas/commerce/event.schema';
import { Product, ProductDocument } from '@/infrastructure/database/schemas/commerce/product.schema';
import { Post, PostDocument } from '@/infrastructure/database/schemas/content/post.schema';

type SearchType = 'all' | 'community' | 'course' | 'product' | 'event' | 'post';

type SearchParams = {
  q: string;
  type: string;
  page: number;
  limit: number;
};

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectModel(Community.name) private readonly communityModel: Model<CommunityDocument>,
    @InjectModel(Cours.name) private readonly courseModel: Model<CoursDocument>,
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
  ) {}

  async search(params: SearchParams) {
    const q = String(params.q || '').trim();
    if (q.length < 2) throw new BadRequestException('Search query must be at least 2 characters');

    const type = this.normalizeType(params.type);
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 12));

    const external = await this.searchExternal(q, type, page, limit).catch((error) => {
      this.logger.warn(`External search failed, falling back to MongoDB: ${error?.message || error}`);
      return null;
    });
    if (external) return external;

    return this.searchMongo(q, type, page, limit);
  }

  async health() {
    return {
      engine: this.getEngineName(),
      configured: Boolean(process.env.MEILI_HOST || process.env.TYPESENSE_HOST),
      fallback: 'mongodb',
    };
  }

  private normalizeType(type: string): SearchType {
    const allowed = new Set(['all', 'community', 'course', 'product', 'event', 'post']);
    return allowed.has(type) ? type as SearchType : 'all';
  }

  private getEngineName(): 'meilisearch' | 'typesense' | 'mongodb' {
    if (process.env.MEILI_HOST) return 'meilisearch';
    if (process.env.TYPESENSE_HOST) return 'typesense';
    return 'mongodb';
  }

  private async searchExternal(q: string, type: SearchType, page: number, limit: number) {
    if (process.env.MEILI_HOST) return this.searchMeili(q, type, page, limit);
    if (process.env.TYPESENSE_HOST) return this.searchTypesense(q, type, page, limit);
    return null;
  }

  private async searchMeili(q: string, type: SearchType, page: number, limit: number) {
    const host = process.env.MEILI_HOST!.replace(/\/$/, '');
    const index = process.env.MEILI_GLOBAL_INDEX || 'chabaqa_content';
    const filters = type === 'all' ? undefined : `type = "${type}"`;
    const response = await fetch(`${host}/indexes/${index}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.MEILI_API_KEY ? { Authorization: `Bearer ${process.env.MEILI_API_KEY}` } : {}),
      },
      body: JSON.stringify({ q, filter: filters, offset: (page - 1) * limit, limit }),
    });
    if (!response.ok) throw new Error(`Meilisearch returned ${response.status}`);
    const data = await response.json() as { hits?: unknown[]; estimatedTotalHits?: number };
    return { engine: 'meilisearch', data: data.hits || [], total: data.estimatedTotalHits || 0, page, limit };
  }

  private async searchTypesense(q: string, type: SearchType, page: number, limit: number) {
    const host = process.env.TYPESENSE_HOST!.replace(/\/$/, '');
    const collection = process.env.TYPESENSE_GLOBAL_COLLECTION || 'chabaqa_content';
    const filterBy = type === 'all' ? '' : `&filter_by=type:=${encodeURIComponent(type)}`;
    const url = `${host}/collections/${collection}/documents/search?q=${encodeURIComponent(q)}&query_by=title,description,body,tags&page=${page}&per_page=${limit}${filterBy}`;
    const response = await fetch(url, {
      headers: process.env.TYPESENSE_API_KEY ? { 'X-TYPESENSE-API-KEY': process.env.TYPESENSE_API_KEY } : {},
    });
    if (!response.ok) throw new Error(`Typesense returned ${response.status}`);
    const data = await response.json() as { hits?: Array<{ document: unknown }>; found?: number };
    return { engine: 'typesense', data: (data.hits || []).map((hit) => hit.document), total: data.found || 0, page, limit };
  }

  private async searchMongo(q: string, type: SearchType, page: number, limit: number) {
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const skip = (page - 1) * limit;
    const perTypeLimit = type === 'all' ? Math.ceil(limit / 5) : limit;

    const queries = [] as Array<Promise<unknown[]>>;
    if (type === 'all' || type === 'community') queries.push(this.findCommunities(regex, skip, perTypeLimit));
    if (type === 'all' || type === 'course') queries.push(this.findCourses(regex, skip, perTypeLimit));
    if (type === 'all' || type === 'product') queries.push(this.findProducts(regex, skip, perTypeLimit));
    if (type === 'all' || type === 'event') queries.push(this.findEvents(regex, skip, perTypeLimit));
    if (type === 'all' || type === 'post') queries.push(this.findPosts(regex, skip, perTypeLimit));

    const groups = await Promise.all(queries);
    const data = groups.flat().slice(0, limit);
    return { engine: 'mongodb', data, total: data.length, page, limit };
  }

  private async findCommunities(regex: RegExp, skip: number, limit: number) {
    return this.communityModel.find({
      isActive: true,
      $or: [{ name: regex }, { short_description: regex }, { category: regex }, { tags: { $in: [regex] } }],
    } as FilterQuery<CommunityDocument>)
      .select('name slug short_description category tags avatar cover members createdAt')
      .skip(skip).limit(limit).lean().exec()
      .then((items) => items.map((item) => ({ ...item, type: 'community' })));
  }

  private async findCourses(regex: RegExp, skip: number, limit: number) {
    return this.courseModel.find({
      isPublished: true,
      moderationStatus: { $ne: 'rejected' },
      $or: [{ titre: regex }, { description: regex }, { categorie: regex }, { tags: { $in: [regex] } }],
    } as FilterQuery<CoursDocument>)
      .select('id titre description categorie tags prix thumbnail creatorId communityId createdAt')
      .skip(skip).limit(limit).lean().exec()
      .then((items) => items.map((item) => ({ ...item, type: 'course' })));
  }

  private async findProducts(regex: RegExp, skip: number, limit: number) {
    return this.productModel.find({
      isPublished: true,
      moderationStatus: { $ne: 'rejected' },
      $or: [{ title: regex }, { description: regex }, { category: regex }, { tags: { $in: [regex] } }],
    } as FilterQuery<ProductDocument>)
      .select('id title description category tags price thumbnail communityId creatorId createdAt')
      .skip(skip).limit(limit).lean().exec()
      .then((items) => items.map((item) => ({ ...item, type: 'product' })));
  }

  private async findEvents(regex: RegExp, skip: number, limit: number) {
    return this.eventModel.find({
      isPublished: true,
      isActive: true,
      moderationStatus: { $ne: 'rejected' },
      $or: [{ title: regex }, { description: regex }, { category: regex }, { tags: { $in: [regex] } }],
    } as FilterQuery<EventDocument>)
      .select('id title description category tags startDate image communityId creatorId createdAt')
      .skip(skip).limit(limit).lean().exec()
      .then((items) => items.map((item) => ({ ...item, type: 'event' })));
  }

  private async findPosts(regex: RegExp, skip: number, limit: number) {
    return this.postModel.find({
      moderationStatus: { $ne: 'rejected' },
      $or: [{ title: regex }, { content: regex }, { excerpt: regex }, { tags: { $in: [regex] } }],
    } as FilterQuery<PostDocument>)
      .select('id title excerpt content thumbnail communityId authorId createdAt')
      .skip(skip).limit(limit).lean().exec()
      .then((items) => items.map((item) => ({ ...item, type: 'post', content: undefined })));
  }
}
