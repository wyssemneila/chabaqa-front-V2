import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
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

@Injectable()
export class AiKnowledgeIndexerService {
  constructor(
    @InjectModel(Community.name)
    private readonly communityModel: Model<CommunityDocument>,
    @InjectModel(AiKnowledgeDocument.name)
    private readonly knowledgeModel: Model<AiKnowledgeDocumentDocument>,
  ) {}

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
    await this.knowledgeModel.updateOne(
      {
        communityId,
        sourceType: 'community_page',
        sourceId: String(communityId),
      },
      {
        $set: {
          communityId: new Types.ObjectId(communityId),
          sourceType: 'community_page',
          sourceId: String(communityId),
          title: `${community.name || 'Community'} overview`,
          extractedText: text.slice(0, 50000),
          visibility: 'member',
          contentHash: createHash('sha256').update(text).digest('hex'),
        },
      },
      { upsert: true },
    );
    return { indexed: 1, status: 'ready' };
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
    };
  }
}
