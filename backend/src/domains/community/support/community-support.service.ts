import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Conversation,
  ConversationDocument,
} from '@/infrastructure/database/schemas/communication/conversation.schema';
import { Community, CommunityDocument } from '@/infrastructure/database/schemas/community/community.schema';

@Injectable()
export class CommunitySupportService {
  constructor(
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Community.name) private readonly communityModel: Model<CommunityDocument>,
  ) {}

  async getQueue(
    communityId: string,
    options: { page?: number; limit?: number; status?: 'open' | 'closed' } = {},
  ) {
    const page = Math.max(1, Number(options.page || 1));
    const limit = Math.min(100, Math.max(1, Number(options.limit || 20)));
    const community = await this.communityModel.findById(communityId).lean();
    if (!community) throw new NotFoundException('Community not found');

    const filter: Record<string, unknown> = {
      communityId: new Types.ObjectId(communityId),
      type: { $in: ['COMMUNITY_DM', 'LIVE_SUPPORT'] },
    };
    if (options.status === 'open') filter.isOpen = true;
    if (options.status === 'closed') filter.isOpen = false;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.conversationModel
        .find(filter)
        .populate('participantA', 'name firstName lastName email username avatar photo_profil profile_picture')
        .populate('participantB', 'name firstName lastName email username avatar photo_profil profile_picture')
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.conversationModel.countDocuments(filter),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async getMetrics(communityId: string) {
    const communityObjectId = new Types.ObjectId(communityId);
    const [openCount, closedToday, total] = await Promise.all([
      this.conversationModel.countDocuments({
        communityId: communityObjectId,
        type: { $in: ['COMMUNITY_DM', 'LIVE_SUPPORT'] },
        isOpen: true,
      }),
      this.conversationModel.countDocuments({
        communityId: communityObjectId,
        type: { $in: ['COMMUNITY_DM', 'LIVE_SUPPORT'] },
        isOpen: false,
        closedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
      this.conversationModel.countDocuments({
        communityId: communityObjectId,
        type: { $in: ['COMMUNITY_DM', 'LIVE_SUPPORT'] },
      }),
    ]);

    return {
      openCount,
      resolvedToday: closedToday,
      totalConversations: total,
      avgResponseTimeMinutes: null,
    };
  }

  async assignConversation(communityId: string, conversationId: string, assigneeId: string) {
    const conversation = await this.conversationModel.findOne({
      _id: new Types.ObjectId(conversationId),
      communityId: new Types.ObjectId(communityId),
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    conversation.participantB = new Types.ObjectId(assigneeId);
    conversation.supportStatus = 'ASSIGNED';
    conversation.claimedAt = new Date();
    await conversation.save();
    return { conversation };
  }
}
