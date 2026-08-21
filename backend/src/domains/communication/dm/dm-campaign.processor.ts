import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Community, CommunityDocument } from '@/infrastructure/database/schemas/community/community.schema';
import { User } from '@/infrastructure/database/schemas/auth/user.schema';
import { DmBroadcast, DmBroadcastDocument } from '@/infrastructure/database/schemas/communication/dm-broadcast.schema';
import { DmAutomation, DmAutomationDocument } from '@/infrastructure/database/schemas/communication/dm-automation.schema';
import { DmDelivery, DmDeliveryDocument } from '@/infrastructure/database/schemas/communication/dm-delivery.schema';
import { DmService } from '@/domains/communication/dm/dm.service';

/** Processes durable direct-message campaign deliveries in small batches. */
@Injectable()
export class DmCampaignProcessor {
  private readonly logger = new Logger(DmCampaignProcessor.name);
  private running = false;

  constructor(
    @InjectModel(DmBroadcast.name) private readonly broadcastModel: Model<DmBroadcastDocument>,
    @InjectModel(DmAutomation.name) private readonly automationModel: Model<DmAutomationDocument>,
    @InjectModel(DmDelivery.name) private readonly deliveryModel: Model<DmDeliveryDocument>,
    @InjectModel(Community.name) private readonly communityModel: Model<CommunityDocument>,
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly dmService: DmService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processPendingBroadcasts(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const broadcasts = await this.broadcastModel.find({ status: { $in: ['queued', 'sending'] } }).sort({ createdAt: 1 }).limit(5);
      for (const broadcast of broadcasts) await this.processBroadcast(broadcast);
    } catch (error: any) {
      this.logger.error(`DM broadcast worker failed: ${error?.message || error}`);
    } finally {
      this.running = false;
    }
  }

  /** Daily execution keeps inactivity messages away from request/response paths. */
  @Cron('15 8 * * *', { name: 'daily-dm-automations' })
  async processAutomations(): Promise<void> {
    const automations = await this.automationModel.find({ isActive: true, trigger: { $in: ['inactive_7', 'inactive_30'] } });
    for (const automation of automations) {
      try {
        const thresholdDays = automation.trigger === 'inactive_30' ? 30 : 7;
        const cutoff = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000);
        const recipients = await this.userModel.find({
          joinedCommunities: automation.communityId,
          lastActive: { $lte: cutoff },
          _id: { $ne: automation.creatorId },
        }).select('_id').limit(1000).lean();
        await this.queueAutomationRecipients(automation, recipients.map((user: any) => user._id));
        automation.lastTriggeredAt = new Date();
        await automation.save();
      } catch (error: any) {
        this.logger.error(`Automation ${automation._id} failed to queue: ${error?.message || error}`);
      }
    }
    await this.processQueuedAutomationDeliveries();
  }

  /** Invoked by membership lifecycle code when a member joins. */
  async queueNewMemberAutomations(communityId: string, userId: string): Promise<void> {
    const automations = await this.automationModel.find({ communityId: new Types.ObjectId(communityId), trigger: 'new_member', isActive: true });
    for (const automation of automations) await this.queueAutomationRecipients(automation, [new Types.ObjectId(userId)]);
  }

  private async processBroadcast(broadcast: DmBroadcastDocument): Promise<void> {
    if (broadcast.status === 'cancelled') return;
    broadcast.status = 'sending';
    await broadcast.save();
    const community = await this.communityModel.findById(broadcast.communityId).select('members createur');
    if (!community) {
      broadcast.status = 'failed';
      await broadcast.save();
      return;
    }
    const recipientIds = (community.members || []).filter((member: any) => String(member) !== String(broadcast.creatorId));
    if (recipientIds.length) {
      await this.deliveryModel.bulkWrite(recipientIds.map((recipientId: any) => ({
        updateOne: {
          filter: { broadcastId: broadcast._id, recipientId },
          update: { $setOnInsert: { kind: 'broadcast', broadcastId: broadcast._id, communityId: broadcast.communityId, recipientId, status: 'queued', attempts: 0 } },
          upsert: true,
        },
      })));
    }
    const deliveries = await this.deliveryModel.find({ broadcastId: broadcast._id, status: { $in: ['queued', 'failed'] } }).sort({ createdAt: 1 }).limit(25);
    for (const delivery of deliveries) await this.sendDelivery(delivery, String(broadcast.creatorId), broadcast.body);
    const [sentCount, failedCount, pendingCount] = await Promise.all([
      this.deliveryModel.countDocuments({ broadcastId: broadcast._id, status: 'sent' }),
      this.deliveryModel.countDocuments({ broadcastId: broadcast._id, status: 'failed' }),
      this.deliveryModel.countDocuments({ broadcastId: broadcast._id, status: { $in: ['queued', 'processing'] } }),
    ]);
    broadcast.recipientCount = recipientIds.length;
    broadcast.sentCount = sentCount;
    broadcast.failedCount = failedCount;
    if (pendingCount === 0) {
      broadcast.status = failedCount === recipientIds.length && recipientIds.length > 0 ? 'failed' : 'sent';
      broadcast.sentAt = new Date();
    }
    await broadcast.save();
  }

  private async queueAutomationRecipients(automation: DmAutomationDocument, recipientIds: Types.ObjectId[]): Promise<void> {
    if (!recipientIds.length) return;
    await this.deliveryModel.bulkWrite(recipientIds.map((recipientId) => ({
      updateOne: {
        filter: { automationId: automation._id, recipientId },
        update: { $setOnInsert: { kind: 'automation', automationId: automation._id, communityId: automation.communityId, recipientId, status: 'queued', attempts: 0 } },
        upsert: true,
      },
    })));
    automation.triggeredCount = await this.deliveryModel.countDocuments({ automationId: automation._id, status: 'sent' });
    await automation.save();
  }

  private async processQueuedAutomationDeliveries(): Promise<void> {
    const deliveries = await this.deliveryModel.find({ kind: 'automation', status: { $in: ['queued', 'failed'] }, attempts: { $lt: 3 } }).sort({ createdAt: 1 }).limit(100);
    for (const delivery of deliveries) {
      const automation = await this.automationModel.findById(delivery.automationId);
      if (!automation || !automation.isActive) continue;
      await this.sendDelivery(delivery, String(automation.creatorId), automation.body);
      automation.triggeredCount = await this.deliveryModel.countDocuments({ automationId: automation._id, status: 'sent' });
      automation.lastTriggeredAt = new Date();
      await automation.save();
    }
  }

  private async sendDelivery(delivery: DmDeliveryDocument, senderId: string, body: string): Promise<void> {
    delivery.status = 'processing';
    delivery.attempts = (delivery.attempts || 0) + 1;
    await delivery.save();
    try {
      const conversation = await this.dmService.startCommunityConversation(String(delivery.recipientId), String(delivery.communityId));
      const message: any = await this.dmService.sendMessageRich(String(conversation._id), senderId, {
        text: body,
        clientRequestId: `dm-delivery:${delivery._id}`,
      });
      delivery.status = 'sent';
      delivery.sentAt = new Date();
      delivery.messageId = message?._id || message?.id;
      delivery.failureReason = undefined;
    } catch (error: any) {
      delivery.status = 'failed';
      delivery.failureReason = String(error?.message || 'Delivery failed').slice(0, 1000);
    }
    await delivery.save();
  }
}
