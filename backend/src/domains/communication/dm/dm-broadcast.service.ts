import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DmBroadcast,
  DmBroadcastDocument,
} from '@/infrastructure/database/schemas/communication/dm-broadcast.schema';
import {
  DmAutomation,
  DmAutomationDocument,
  DmAutomationTrigger,
} from '@/infrastructure/database/schemas/communication/dm-automation.schema';
import { Community, CommunityDocument } from '@/infrastructure/database/schemas/community/community.schema';
import {
  Conversation,
  ConversationDocument,
} from '@/infrastructure/database/schemas/communication/conversation.schema';
import { DmService } from '@/domains/communication/dm/dm.service';
import { DmDelivery, DmDeliveryDocument } from '@/infrastructure/database/schemas/communication/dm-delivery.schema';

@Injectable()
export class DmBroadcastService {
  constructor(
    @InjectModel(DmBroadcast.name) private readonly broadcastModel: Model<DmBroadcastDocument>,
    @InjectModel(DmAutomation.name) private readonly automationModel: Model<DmAutomationDocument>,
    @InjectModel(Community.name) private readonly communityModel: Model<CommunityDocument>,
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(DmDelivery.name) private readonly deliveryModel: Model<DmDeliveryDocument>,
    private readonly dmService: DmService,
  ) {}

  private async assertCommunityCreator(userId: string, communityId: string) {
    const community = await this.communityModel.findById(communityId);
    if (!community) throw new NotFoundException('Community not found');
    if (String(community.createur) !== String(userId)) {
      throw new ForbiddenException('Only the community creator can manage DM broadcasts');
    }
    return community;
  }

  async listBroadcasts(communityId: string, userId: string) {
    await this.assertCommunityCreator(userId, communityId);
    const broadcasts = await this.broadcastModel
      .find({ communityId: new Types.ObjectId(communityId) })
      .sort({ createdAt: -1 })
      .lean();
    return { broadcasts };
  }

  async createBroadcast(
    userId: string,
    payload: { communityId: string; title?: string; body: string },
  ) {
    await this.assertCommunityCreator(userId, payload.communityId);
    const broadcast = await this.broadcastModel.create({
      communityId: new Types.ObjectId(payload.communityId),
      creatorId: new Types.ObjectId(userId),
      title: payload.title,
      body: payload.body,
      status: 'draft',
    });
    return { broadcast };
  }

  async getBroadcast(id: string, userId: string) {
    const broadcast = await this.broadcastModel.findById(id);
    if (!broadcast) throw new NotFoundException('Broadcast not found');
    await this.assertCommunityCreator(userId, String(broadcast.communityId));
    return { broadcast };
  }

  async deleteBroadcast(id: string, userId: string) {
    const broadcast = await this.broadcastModel.findById(id);
    if (!broadcast) throw new NotFoundException('Broadcast not found');
    await this.assertCommunityCreator(userId, String(broadcast.communityId));
    await broadcast.deleteOne();
    return { success: true };
  }

  async cancelBroadcast(id: string, userId: string) {
    const broadcast = await this.broadcastModel.findById(id);
    if (!broadcast) throw new NotFoundException('Broadcast not found');
    await this.assertCommunityCreator(userId, String(broadcast.communityId));
    if (!['queued', 'sending'].includes(broadcast.status)) {
      throw new BadRequestException('Only queued or active broadcasts can be cancelled');
    }
    broadcast.status = 'cancelled';
    broadcast.cancelledAt = new Date();
    await broadcast.save();
    await this.deliveryModel.updateMany({ broadcastId: broadcast._id, status: 'queued' }, { $set: { status: 'cancelled' } });
    return { broadcast };
  }

  async sendBroadcast(id: string, userId: string) {
    const broadcast = await this.broadcastModel.findById(id);
    if (!broadcast) throw new NotFoundException('Broadcast not found');
    const community = await this.assertCommunityCreator(userId, String(broadcast.communityId));
    if (!['draft', 'failed'].includes(broadcast.status)) throw new BadRequestException('Broadcast has already been queued or sent');

    const memberIds = (community.members || []).map((m) => String(m)).filter((id) => id !== String(userId));
    broadcast.status = 'queued';
    broadcast.recipientCount = memberIds.length;
    await broadcast.save();

    await this.deliveryModel.bulkWrite(memberIds.map((memberId) => ({
      updateOne: {
        filter: { broadcastId: broadcast._id, recipientId: new Types.ObjectId(memberId) },
        update: { $setOnInsert: { kind: 'broadcast', broadcastId: broadcast._id, communityId: community._id, recipientId: new Types.ObjectId(memberId), status: 'queued', attempts: 0 } },
        upsert: true,
      },
    })));

    return { broadcast };
  }

  async listAutomations(communityId: string, userId: string) {
    await this.assertCommunityCreator(userId, communityId);
    const automations = await this.automationModel
      .find({ communityId: new Types.ObjectId(communityId) })
      .sort({ createdAt: -1 })
      .lean();
    return { automations };
  }

  async createAutomation(
    userId: string,
    payload: {
      communityId: string;
      name: string;
      trigger: DmAutomationTrigger;
      delayHours?: number;
      body: string;
    },
  ) {
    await this.assertCommunityCreator(userId, payload.communityId);
    const automation = await this.automationModel.create({
      communityId: new Types.ObjectId(payload.communityId),
      creatorId: new Types.ObjectId(userId),
      name: payload.name,
      trigger: payload.trigger,
      delayHours: payload.delayHours ?? 0,
      body: payload.body,
      isActive: true,
    });
    return { automation };
  }

  async updateAutomation(
    id: string,
    userId: string,
    payload: Partial<{ name: string; trigger: DmAutomationTrigger; delayHours: number; body: string; isActive: boolean }>,
  ) {
    const automation = await this.automationModel.findById(id);
    if (!automation) throw new NotFoundException('Automation not found');
    await this.assertCommunityCreator(userId, String(automation.communityId));
    Object.assign(automation, payload);
    await automation.save();
    return { automation };
  }

  async toggleAutomation(id: string, userId: string) {
    const automation = await this.automationModel.findById(id);
    if (!automation) throw new NotFoundException('Automation not found');
    await this.assertCommunityCreator(userId, String(automation.communityId));
    automation.isActive = !automation.isActive;
    await automation.save();
    return { automation };
  }

  async deleteAutomation(id: string, userId: string) {
    const automation = await this.automationModel.findById(id);
    if (!automation) throw new NotFoundException('Automation not found');
    await this.assertCommunityCreator(userId, String(automation.communityId));
    await automation.deleteOne();
    return { success: true };
  }
}
