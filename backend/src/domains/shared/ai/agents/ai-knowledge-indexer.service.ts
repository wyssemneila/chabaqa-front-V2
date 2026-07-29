import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Community,
  CommunityDocument,
} from '@/infrastructure/database/schemas/community/community.schema';
import {
  AiKnowledgeDocument,
  AiKnowledgeDocumentDocument,
} from '@/infrastructure/database/schemas/ai/ai-knowledge-document.schema';
import { Cours, CoursDocument } from '@/infrastructure/database/schemas/learning/course.schema';
import { Post, PostDocument } from '@/infrastructure/database/schemas/content/post.schema';
import { Resource } from '@/infrastructure/database/schemas/content/resource.schema';
import { Product, ProductDocument } from '@/infrastructure/database/schemas/commerce/product.schema';
import { Event, EventDocument } from '@/infrastructure/database/schemas/commerce/event.schema';
import { EmbeddingService } from '@/domains/shared/ai/embeddings/embedding.service';

@Injectable()
export class AiKnowledgeIndexerService {
  private readonly logger = new Logger(AiKnowledgeIndexerService.name);

  constructor(
    @InjectModel(Community.name)
    private readonly communityModel: Model<CommunityDocument>,
    @InjectModel(AiKnowledgeDocument.name)
    private readonly knowledgeModel: Model<AiKnowledgeDocumentDocument>,
    @InjectModel(Cours.name)
    private readonly courseModel: Model<CoursDocument>,
    @InjectModel(Post.name)
    private readonly postModel: Model<PostDocument>,
    @InjectModel(Resource.name)
    private readonly resourceModel: Model<any>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Event.name)
    private readonly eventModel: Model<EventDocument>,
    private readonly embeddings: EmbeddingService,
  ) {}

  private asText(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map((item) => this.asText(item)).filter(Boolean).join('\n');
    if (typeof value === 'object') {
      return Object.values(value).map((item) => this.asText(item)).filter(Boolean).join('\n');
    }
    return String(value);
  }

  private async upsertDocument(params: {
    communityId: string;
    sourceType: string;
    sourceId: string;
    title: string;
    extractedText: string;
    visibility?: 'member' | 'public' | 'staff';
  }): Promise<number> {
    const text = this.asText(params.extractedText).trim();
    if (!text) return 0;
    let embedding: number[] | undefined = undefined;
    if (this.embeddings.isEnabled()) {
      try {
        const vec = await this.embeddings.embedQuery(text);
        if (Array.isArray(vec) && vec.length > 0) embedding = vec;
      } catch (error: any) {
        this.logger.warn(
          `embedding failed for ${params.sourceType}:${params.sourceId} — ${error?.message || error}`,
        );
      }
    }
    await this.knowledgeModel.updateOne(
      {
        communityId: params.communityId,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
      },
      {
        $set: {
          communityId: new Types.ObjectId(params.communityId),
          sourceType: params.sourceType,
          sourceId: params.sourceId,
          title: params.title.slice(0, 240),
          extractedText: text.slice(0, 50000),
          visibility: params.visibility || 'member',
          contentHash: createHash('sha256').update(text).digest('hex'),
          ...(embedding ? { embedding } : {}),
        },
        // Clear the embedding when embeddings are disabled so stale vectors
        // don't stay behind after a reindex.
        ...(this.embeddings.isEnabled()
          ? {}
          : { $unset: { embedding: '' } }),
      },
      { upsert: true },
    );
    return 1;
  }

  async reindexCommunity(communityId: string) {
    const community = await this.communityModel
      .findById(communityId)
      .lean()
      .exec();
    if (!community) return { indexed: 0 };
    const text = [
      community.name,
      community.short_description,
      community.settings?.welcomeMessage,
      ...(community.settings?.features || []),
      ...(community.settings?.benefits || []),
    ]
      .filter(Boolean)
      .join('\n');
    let indexed = await this.upsertDocument({
      communityId,
      sourceType: 'community_page',
      sourceId: String(communityId),
      title: `${community.name || 'Community'} overview`,
      extractedText: text,
      visibility: 'member',
    });

    const communityObjectId = new Types.ObjectId(communityId);
    const communityIdCandidates = [communityId, communityObjectId];

    const [courses, posts, resources, products, events] = await Promise.all([
      this.courseModel.find({ communityId: { $in: communityIdCandidates } }).limit(200).lean(),
      this.postModel.find({ communityId: communityObjectId }).limit(300).lean(),
      this.resourceModel.find({ communityId: communityObjectId, isPublished: true }).limit(200).lean(),
      this.productModel.find({ communityId: { $in: communityIdCandidates } }).limit(200).lean(),
      this.eventModel.find({ communityId: { $in: communityIdCandidates } }).limit(200).lean(),
    ]);

    for (const course of courses as any[]) {
      indexed += await this.upsertDocument({
        communityId,
        sourceType: 'course',
        sourceId: String(course._id || course.id),
        title: course.titre || course.title || 'Course',
        extractedText: [course.titre, course.description, course.category].filter(Boolean).join('\n'),
      });
      for (const section of course.sections || []) {
        for (const chapter of section.chapitres || []) {
          indexed += await this.upsertDocument({
            communityId,
            sourceType: 'chapter',
            sourceId: String(chapter.id || `${course._id}:${section.id}:${chapter.titre}`),
            title: `${course.titre || 'Course'}: ${chapter.titre || 'Chapter'}`,
            extractedText: [section.titre, chapter.titre, chapter.contenu, chapter.notes, this.asText(chapter.ressources)].filter(Boolean).join('\n'),
          });
        }
      }
    }

    for (const post of posts as any[]) {
      indexed += await this.upsertDocument({
        communityId,
        sourceType: 'post',
        sourceId: String(post._id || post.id),
        title: post.title || 'Community post',
        extractedText: [post.title, post.content].filter(Boolean).join('\n'),
      });
    }

    for (const resource of resources as any[]) {
      indexed += await this.upsertDocument({
        communityId,
        sourceType: 'resource',
        sourceId: String(resource._id || resource.id || resource.slug),
        title: resource.titre || resource.title || 'Resource',
        extractedText: [resource.titre, resource.description, this.asText(resource.content)].filter(Boolean).join('\n'),
      });
    }

    for (const product of products as any[]) {
      indexed += await this.upsertDocument({
        communityId,
        sourceType: 'product',
        sourceId: String(product._id || product.id),
        title: product.name || product.title || 'Product',
        extractedText: [product.name, product.description, this.asText(product.features), this.asText(product.files)].filter(Boolean).join('\n'),
      });
    }

    for (const event of events as any[]) {
      indexed += await this.upsertDocument({
        communityId,
        sourceType: 'event',
        sourceId: String(event._id || event.id),
        title: event.title || 'Event',
        extractedText: [event.title, event.description, this.asText(event.sessions), this.asText(event.speakers)].filter(Boolean).join('\n'),
      });
    }

    return { indexed, status: indexed > 0 ? 'ready' : 'empty' };
  }

  async status(communityId: string) {
    const count = await this.knowledgeModel.countDocuments({ communityId });
    const latest = await this.knowledgeModel
      .findOne({ communityId })
      .sort({ updatedAt: -1 })
      .lean()
      .exec();
    return {
      count,
      status: count > 0 ? 'ready' : 'empty',
      updatedAt: (latest as any)?.updatedAt || null,
      sourceTypes: await this.knowledgeModel.aggregate([
        { $match: { communityId: new Types.ObjectId(communityId) } },
        { $group: { _id: '$sourceType', count: { $sum: 1 } } },
        { $project: { _id: 0, sourceType: '$_id', count: 1 } },
        { $sort: { sourceType: 1 } },
      ]),
    };
  }
}
