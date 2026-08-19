import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createHash, timingSafeEqual } from 'crypto';
import { Model, Types } from 'mongoose';
import {
  CreateWhatsappCampaignDto,
  CreateWhatsappAutomationDto,
  ImportWhatsappContactsDto,
  RenderWhatsappPreviewDto,
  UpdateWhatsappAutomationDto,
  UpdateWhatsappCampaignDto,
  WhatsappCampaignQueryDto,
} from '@/domains/communication/whatsapp/dto/whatsapp-campaign.dto';
import { OpenWaWebhookDto } from '@/domains/communication/whatsapp/dto/openwa-webhook.dto';
import { OpenWaClientService } from '@/domains/communication/whatsapp/openwa-client.service';
import { WhatsappAudienceService } from '@/domains/communication/whatsapp/whatsapp-audience.service';
import { WhatsappSessionService } from '@/domains/communication/whatsapp/whatsapp-session.service';
import { WhatsappQueueService } from '@/domains/communication/whatsapp/whatsapp.queue';
import { WhatsappCampaignSendJobPayload } from '@/domains/communication/whatsapp/whatsapp.jobs';
import {
  WhatsappAutomation,
  WhatsappAutomationDocument,
} from '@/infrastructure/database/schemas/communication/whatsapp-automation.schema';
import {
  WhatsappAudienceType,
  WhatsappCampaign,
  WhatsappCampaignDocument,
  WhatsappCampaignStatus,
  WhatsappMessageType,
  WhatsappRecipientStatus,
} from '@/infrastructure/database/schemas/communication/whatsapp-campaign.schema';
import {
  WhatsappConsentStatus,
  WhatsappContact,
  WhatsappContactDocument,
  WhatsappContactSource,
} from '@/infrastructure/database/schemas/communication/whatsapp-contact.schema';
import { WhatsappSessionStatus } from '@/infrastructure/database/schemas/communication/whatsapp-session.schema';
import {
  WhatsappWebhookEvent,
  WhatsappWebhookEventDocument,
} from '@/infrastructure/database/schemas/communication/whatsapp-webhook-event.schema';
import { PolicyService } from '@/shared/services/policy.service';
import { WhatsappAiService } from '@/domains/communication/whatsapp/whatsapp-ai.service';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    @InjectModel(WhatsappAutomation.name)
    private readonly automationModel: Model<WhatsappAutomationDocument>,
    @InjectModel(WhatsappCampaign.name)
    private readonly campaignModel: Model<WhatsappCampaignDocument>,
    @InjectModel(WhatsappContact.name)
    private readonly contactModel: Model<WhatsappContactDocument>,
    @InjectModel(WhatsappWebhookEvent.name)
    private readonly webhookEventModel: Model<WhatsappWebhookEventDocument>,
    private readonly openWaClient: OpenWaClientService,
    private readonly audienceService: WhatsappAudienceService,
    private readonly sessionService: WhatsappSessionService,
    private readonly queueService: WhatsappQueueService,
    private readonly policyService: PolicyService,
    private readonly whatsappAiService: WhatsappAiService,
  ) {}

  async importContacts(
    communityId: string,
    dto: ImportWhatsappContactsDto,
  ): Promise<{ contacts: WhatsappContactDocument[] }> {
    const contacts: WhatsappContactDocument[] = [];
    for (const input of dto.contacts) {
      const phoneE164 = this.normalizeE164(input.phoneE164);
      const waChatId = this.openWaClient.normalizePhoneToChatId(phoneE164);
      const consentStatus =
        input.optIn === true
          ? WhatsappConsentStatus.OPTED_IN
          : WhatsappConsentStatus.UNKNOWN;
      if (
        consentStatus === WhatsappConsentStatus.OPTED_IN &&
        !String(input.consentProof || '').trim()
      ) {
        throw new BadRequestException(
          'Consent proof is required for opted-in WhatsApp imports',
        );
      }
      const update: Record<string, any> = {
        communityId: new Types.ObjectId(communityId),
        name: input.name,
        phoneE164,
        waChatId,
        source: WhatsappContactSource.IMPORT,
        consentStatus,
        consentSource: input.consentSource || 'manual_import',
        consentProof: input.consentProof,
        consentMethod: input.consentMethod || 'admin_attestation',
        tags: input.tags || [],
      };
      if (input.userId) update.userId = new Types.ObjectId(input.userId);
      if (consentStatus === WhatsappConsentStatus.OPTED_IN) {
        update.consentCapturedAt = new Date();
        update.optOutAt = undefined;
        update.optOutReason = undefined;
      }

      const contact = await this.contactModel
        .findOneAndUpdate(
          { communityId: new Types.ObjectId(communityId), phoneE164 },
          { $set: update },
          { new: true, upsert: true, setDefaultsOnInsert: true },
        )
        .exec();
      contacts.push(contact);
    }
    return { contacts };
  }

  async listContacts(
    communityId: string,
  ): Promise<{ contacts: WhatsappContactDocument[] }> {
    const contacts = await this.contactModel
      .find({ communityId: new Types.ObjectId(communityId) })
      .sort({ createdAt: -1 })
      .limit(500)
      .exec();
    return { contacts };
  }

  async optOutContact(
    communityId: string,
    contactId: string,
  ): Promise<WhatsappContactDocument> {
    const contact = await this.contactModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(contactId),
          communityId: new Types.ObjectId(communityId),
        },
        {
          $set: {
            consentStatus: WhatsappConsentStatus.OPTED_OUT,
            optOutAt: new Date(),
            optOutReason: 'manual_admin',
          },
        },
        { new: true },
      )
      .exec();
    if (!contact) throw new NotFoundException('WhatsApp contact not found');
    return contact;
  }

  async previewAudience(
    creatorId: string,
    communityId: string,
    targetAudience: WhatsappAudienceType,
    customAudienceIds: string[] = [],
    limit = 100,
  ) {
    const preview = await this.audienceService.preview(
      communityId,
      targetAudience,
      customAudienceIds,
      limit,
    );
    const remainingQuota =
      await this.getRemainingWhatsappQuotaForCreator(creatorId);
    return {
      ...preview,
      remainingQuota,
      canSend: remainingQuota >= preview.eligible,
    };
  }

  async createCampaign(
    creatorId: string,
    dto: CreateWhatsappCampaignDto,
  ): Promise<WhatsappCampaignDocument> {
    const targetAudience =
      dto.targetAudience || WhatsappAudienceType.ALL_MEMBERS;
    this.assertCampaignContent(dto.messageType || WhatsappMessageType.TEXT, dto.body, dto.mediaUrl);
    const recipients = await this.audienceService.buildRecipients(
      dto.communityId,
      targetAudience,
      dto.customAudienceIds || [],
    );
    await this.validateWhatsappQuota(creatorId, recipients.length);

    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : undefined;
    const campaign = new this.campaignModel({
      title: dto.title,
      communityId: new Types.ObjectId(dto.communityId),
      creatorId: new Types.ObjectId(creatorId),
      messageType: dto.messageType || WhatsappMessageType.TEXT,
      body: dto.body,
      caption: dto.caption,
      mediaAssetId: dto.mediaAssetId,
      mediaUrl: dto.mediaUrl,
      targetAudience,
      customAudienceIds: (dto.customAudienceIds || []).map(
        (id) => new Types.ObjectId(id),
      ),
      status: scheduledAt
        ? WhatsappCampaignStatus.SCHEDULED
        : WhatsappCampaignStatus.DRAFT,
      scheduledAt,
      recipients,
      totalRecipients: recipients.length,
      templateData: dto.templateData || {},
    });

    const saved = await campaign.save();
    if (scheduledAt) {
      await this.queueService.queueCampaignSend(
        {
          campaignId: String(saved._id),
          requestedBy: creatorId,
          trigger: 'scheduled',
          attempt: 0,
        },
        scheduledAt,
      );
    }
    return saved;
  }

  async listCampaigns(
    creatorId: string,
    communityId: string,
    query: WhatsappCampaignQueryDto,
  ): Promise<{
    campaigns: WhatsappCampaignDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 20);
    const filter: Record<string, any> = {
      creatorId: new Types.ObjectId(creatorId),
      communityId: new Types.ObjectId(communityId),
    };
    if (query.status) filter.status = query.status;
    const [campaigns, total] = await Promise.all([
      this.campaignModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.campaignModel.countDocuments(filter),
    ]);
    return { campaigns, total, page, limit };
  }

  async getCampaign(
    campaignId: string,
    creatorId: string,
  ): Promise<WhatsappCampaignDocument> {
    const campaign = await this.campaignModel
      .findOne({
        _id: new Types.ObjectId(campaignId),
        creatorId: new Types.ObjectId(creatorId),
      })
      .exec();
    if (!campaign) throw new NotFoundException('WhatsApp campaign not found');
    return campaign;
  }

  async updateCampaign(
    campaignId: string,
    creatorId: string,
    dto: UpdateWhatsappCampaignDto,
  ): Promise<WhatsappCampaignDocument> {
    const campaign = await this.getCampaign(campaignId, creatorId);
    if (
      ![
        WhatsappCampaignStatus.DRAFT,
        WhatsappCampaignStatus.SCHEDULED,
      ].includes(campaign.status)
    ) {
      throw new BadRequestException(
        'Only draft or scheduled campaigns can be updated',
      );
    }

    Object.assign(campaign, {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.messageType !== undefined
        ? { messageType: dto.messageType }
        : {}),
      ...(dto.body !== undefined ? { body: dto.body } : {}),
      ...(dto.caption !== undefined ? { caption: dto.caption } : {}),
      ...(dto.mediaAssetId !== undefined
        ? { mediaAssetId: dto.mediaAssetId }
        : {}),
      ...(dto.mediaUrl !== undefined ? { mediaUrl: dto.mediaUrl } : {}),
      ...(dto.targetAudience !== undefined
        ? { targetAudience: dto.targetAudience }
        : {}),
      ...(dto.templateData !== undefined
        ? { templateData: dto.templateData }
        : {}),
    });

    this.assertCampaignContent(campaign.messageType, campaign.body, campaign.mediaUrl);

    if (dto.customAudienceIds) {
      campaign.customAudienceIds = dto.customAudienceIds.map(
        (id) => new Types.ObjectId(id),
      );
    }
    if (dto.scheduledAt !== undefined) {
      campaign.scheduledAt = dto.scheduledAt
        ? new Date(dto.scheduledAt)
        : undefined;
      campaign.status = campaign.scheduledAt
        ? WhatsappCampaignStatus.SCHEDULED
        : WhatsappCampaignStatus.DRAFT;
    }

    campaign.recipients = await this.audienceService.buildRecipients(
      String(campaign.communityId),
      campaign.targetAudience,
      (campaign.customAudienceIds || []).map((id) => String(id)),
    );
    campaign.totalRecipients = campaign.recipients.length;
    await this.validateWhatsappQuota(creatorId, campaign.totalRecipients);

    const saved = await campaign.save();
    await this.queueService
      .removeScheduledCampaignSend(campaignId)
      .catch(() => undefined);
    if (saved.status === WhatsappCampaignStatus.SCHEDULED && saved.scheduledAt) {
      await this.queueService.queueCampaignSend(
        {
          campaignId,
          requestedBy: creatorId,
          trigger: 'scheduled',
          attempt: 0,
        },
        saved.scheduledAt,
      );
    }
    return saved;
  }

  async deleteCampaign(
    campaignId: string,
    creatorId: string,
  ): Promise<{ deleted: true }> {
    const campaign = await this.getCampaign(campaignId, creatorId);
    if (campaign.status === WhatsappCampaignStatus.SENDING) {
      throw new BadRequestException(
        'Cannot delete a campaign while it is sending',
      );
    }
    await this.queueService
      .removeScheduledCampaignSend(campaignId)
      .catch(() => undefined);
    await campaign.deleteOne();
    return { deleted: true };
  }

  async sendCampaign(
    campaignId: string,
    requestedBy: string,
  ): Promise<{ message: string; campaignId: string; queued: true }> {
    const campaign = await this.getCampaign(campaignId, requestedBy);
    if (
      ![
        WhatsappCampaignStatus.DRAFT,
        WhatsappCampaignStatus.SCHEDULED,
        WhatsappCampaignStatus.FAILED,
      ].includes(campaign.status)
    ) {
      throw new BadRequestException(
        `Campaign cannot be sent while its status is ${campaign.status}`,
      );
    }
    await this.sessionService.requireReadySession(String(campaign.communityId));
    await this.validateWhatsappQuota(
      String(campaign.creatorId),
      campaign.totalRecipients,
    );
    const remainingDailySends = await this.getRemainingDailySessionSends(
      String(campaign.communityId),
    );
    if (remainingDailySends <= 0) {
      throw new ForbiddenException(
        'Daily WhatsApp session send limit reached. Try again tomorrow.',
      );
    }
    const previousStatus = campaign.status;
    if (previousStatus === WhatsappCampaignStatus.FAILED) {
      for (const recipient of campaign.recipients as any[]) {
        if (recipient.status === WhatsappRecipientStatus.FAILED) {
          recipient.status = WhatsappRecipientStatus.PENDING;
          recipient.errorMessage = undefined;
        }
      }
      campaign.failedCount = 0;
      campaign.errorMessages = [];
    }
    campaign.status = WhatsappCampaignStatus.SENDING;
    campaign.startedAt = campaign.startedAt || new Date();
    await campaign.save();
    try {
      await this.queueService.queueCampaignSend({
        campaignId,
        requestedBy,
        trigger: 'manual',
        attempt: 0,
      });
    } catch (error) {
      campaign.status = previousStatus;
      await campaign.save();
      throw error;
    }
    return {
      message: 'WhatsApp campaign queued for sending',
      campaignId,
      queued: true,
    };
  }

  async cancelCampaign(campaignId: string, creatorId: string): Promise<void> {
    const campaign = await this.getCampaign(campaignId, creatorId);
    if (
      ![
        WhatsappCampaignStatus.SCHEDULED,
        WhatsappCampaignStatus.SENDING,
      ].includes(campaign.status)
    ) {
      throw new BadRequestException(
        'Only scheduled or sending campaigns can be cancelled',
      );
    }
    await this.queueService
      .removeScheduledCampaignSend(campaignId)
      .catch(() => undefined);
    campaign.status = WhatsappCampaignStatus.CANCELLED;
    campaign.cancelledAt = new Date();
    await campaign.save();
  }

  async duplicateCampaign(
    campaignId: string,
    creatorId: string,
    title?: string,
  ): Promise<WhatsappCampaignDocument> {
    const campaign = await this.getCampaign(campaignId, creatorId);
    return new this.campaignModel({
      title: title || `${campaign.title} Copy`,
      communityId: campaign.communityId,
      creatorId: campaign.creatorId,
      messageType: campaign.messageType,
      body: campaign.body,
      caption: campaign.caption,
      mediaAssetId: campaign.mediaAssetId,
      mediaUrl: campaign.mediaUrl,
      targetAudience: campaign.targetAudience,
      customAudienceIds: campaign.customAudienceIds,
      status: WhatsappCampaignStatus.DRAFT,
      recipients: campaign.recipients.map((recipient: any) => ({
        userId: recipient.userId,
        contactId: recipient.contactId,
        phoneE164: recipient.phoneE164,
        waChatId: recipient.waChatId,
        status: WhatsappRecipientStatus.PENDING,
        mergeData: recipient.mergeData || {},
        personalizedBody: recipient.personalizedBody,
      })),
      totalRecipients: campaign.totalRecipients,
      templateData: campaign.templateData || {},
    }).save();
  }

  async getCampaignRecipients(
    campaignId: string,
    creatorId: string,
    query: { page?: number; limit?: number; status?: string },
  ) {
    const campaign = await this.getCampaign(campaignId, creatorId);
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 50);
    const filtered = query.status
      ? campaign.recipients.filter(
          (recipient) => recipient.status === query.status,
        )
      : campaign.recipients;
    return {
      recipients: filtered.slice((page - 1) * limit, page * limit),
      total: filtered.length,
      page,
      limit,
    };
  }

  async getCampaignStats(creatorId: string, communityId: string) {
    const rows = await this.campaignModel.aggregate([
      {
        $match: {
          creatorId: new Types.ObjectId(creatorId),
          communityId: new Types.ObjectId(communityId),
        },
      },
      {
        $group: {
          _id: null,
          campaigns: { $sum: 1 },
          recipients: { $sum: '$totalRecipients' },
          sent: { $sum: '$sentCount' },
          delivered: { $sum: '$deliveredCount' },
          read: { $sum: '$readCount' },
          replied: { $sum: '$repliedCount' },
          failed: { $sum: '$failedCount' },
        },
      },
    ]);
    const stats = rows[0] || {};
    const quota = await this.getRemainingWhatsappQuotaForCreator(creatorId);
    return {
      campaigns: stats.campaigns || 0,
      recipients: stats.recipients || 0,
      sent: stats.sent || 0,
      delivered: stats.delivered || 0,
      read: stats.read || 0,
      replied: stats.replied || 0,
      failed: stats.failed || 0,
      remainingQuota: quota,
    };
  }

  async renderPreview(
    dto: RenderWhatsappPreviewDto,
  ): Promise<{ body: string }> {
    return { body: this.renderTemplate(dto.body, dto.mergeData || {}) };
  }

  async sendTestMessage(
    communityId: string,
    phoneE164: string,
    body: string,
  ): Promise<any> {
    const session = await this.sessionService.requireReadySession(communityId);
    const normalizedPhone = this.normalizeE164(phoneE164);
    const messageBody = String(body || '').trim();
    if (!messageBody) {
      throw new BadRequestException('WhatsApp test message body is required');
    }
    const chatId = this.openWaClient.normalizePhoneToChatId(normalizedPhone);
    return this.openWaClient.sendText(
      session.openwaSessionId!,
      chatId,
      messageBody,
    );
  }

  async listAutomations(
    creatorId: string,
    communityId: string,
  ): Promise<{ automations: WhatsappAutomationDocument[] }> {
    const automations = await this.automationModel
      .find({
        creatorId: new Types.ObjectId(creatorId),
        communityId: new Types.ObjectId(communityId),
      })
      .sort({ createdAt: -1 })
      .exec();
    return { automations };
  }

  async createAutomation(
    creatorId: string,
    communityId: string,
    dto: CreateWhatsappAutomationDto,
  ): Promise<WhatsappAutomationDocument> {
    return new this.automationModel({
      communityId: new Types.ObjectId(communityId),
      creatorId: new Types.ObjectId(creatorId),
      name: dto.name,
      trigger: dto.trigger,
      delayHours: dto.delayHours || 0,
      messageType: dto.messageType || WhatsappMessageType.TEXT,
      body: dto.body,
      caption: dto.caption,
      mediaAssetId: dto.mediaAssetId,
      isActive: dto.isActive !== false,
    }).save();
  }

  async updateAutomation(
    creatorId: string,
    communityId: string,
    automationId: string,
    dto: UpdateWhatsappAutomationDto,
  ): Promise<WhatsappAutomationDocument> {
    const automation = await this.automationModel
      .findOne({
        _id: new Types.ObjectId(automationId),
        creatorId: new Types.ObjectId(creatorId),
        communityId: new Types.ObjectId(communityId),
      })
      .exec();
    if (!automation)
      throw new NotFoundException('WhatsApp automation not found');

    Object.assign(automation, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.trigger !== undefined ? { trigger: dto.trigger } : {}),
      ...(dto.delayHours !== undefined ? { delayHours: dto.delayHours } : {}),
      ...(dto.messageType !== undefined
        ? { messageType: dto.messageType }
        : {}),
      ...(dto.body !== undefined ? { body: dto.body } : {}),
      ...(dto.caption !== undefined ? { caption: dto.caption } : {}),
      ...(dto.mediaAssetId !== undefined
        ? { mediaAssetId: dto.mediaAssetId }
        : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });
    return automation.save();
  }

  async deleteAutomation(
    creatorId: string,
    communityId: string,
    automationId: string,
  ): Promise<{ deleted: true }> {
    const result = await this.automationModel
      .deleteOne({
        _id: new Types.ObjectId(automationId),
        creatorId: new Types.ObjectId(creatorId),
        communityId: new Types.ObjectId(communityId),
      })
      .exec();
    if (result.deletedCount === 0)
      throw new NotFoundException('WhatsApp automation not found');
    return { deleted: true };
  }

  async executeSendCampaignJob(
    job: WhatsappCampaignSendJobPayload,
  ): Promise<void> {
    const campaign = await this.campaignModel.findById(job.campaignId).exec();
    if (!campaign) throw new NotFoundException('WhatsApp campaign not found');
    if (campaign.status === WhatsappCampaignStatus.CANCELLED) return;

    const session = await this.sessionService.requireReadySession(
      String(campaign.communityId),
    );
    const intervalMs = Math.max(
      250,
      Number(process.env.WHATSAPP_SEND_INTERVAL_MS || 1500),
    );
    const remainingDailySends = await this.getRemainingDailySessionSends(
      String(campaign.communityId),
    );
    let sent = 0;
    let failed = 0;
    let skipped = 0;
    let processed = 0;

    await this.campaignModel.updateOne(
      { _id: campaign._id, status: { $ne: WhatsappCampaignStatus.CANCELLED } },
      {
        $set: {
          status: WhatsappCampaignStatus.SENDING,
          startedAt: campaign.startedAt || new Date(),
        },
      },
    );

    for (const recipient of campaign.recipients as any[]) {
      if (
        ![
          WhatsappRecipientStatus.PENDING,
          WhatsappRecipientStatus.QUEUED,
        ].includes(recipient.status)
      ) {
        continue;
      }

      if (processed % 5 === 0) {
        const latest = await this.campaignModel
          .findById(campaign._id)
          .select('status')
          .lean();
        if (latest?.status === WhatsappCampaignStatus.CANCELLED) return;
      }
      processed += 1;

      const contactId = new Types.ObjectId(String(recipient.contactId));
      const contact = await this.contactModel
        .findOne({
          _id: contactId,
          communityId: campaign.communityId,
        })
        .select('consentStatus')
        .lean();
      if (
        !contact ||
        contact.consentStatus !== WhatsappConsentStatus.OPTED_IN
      ) {
        await this.updateRecipientStatus(campaign._id, contactId, {
          status: WhatsappRecipientStatus.SKIPPED,
          errorMessage: 'Contact is not opted in',
        });
        recipient.status = WhatsappRecipientStatus.SKIPPED;
        skipped += 1;
        continue;
      }

      if (sent >= remainingDailySends) break;

      const mergeData = {
        ...(campaign.templateData || {}),
        ...(recipient.mergeData || {}),
      };
      const renderedBody = this.renderTemplate(campaign.body, mergeData);
      const text = this.appendOptOutFooter(renderedBody);
      const renderedCaption = campaign.caption
        ? this.renderTemplate(campaign.caption, mergeData)
        : '';
      const mediaCaption = this.appendOptOutFooter(
        [renderedCaption, renderedBody].filter(Boolean).join('\n\n'),
      );
      recipient.personalizedBody =
        campaign.messageType === WhatsappMessageType.TEXT ? text : mediaCaption;

      await this.updateRecipientStatus(campaign._id, contactId, {
        status: WhatsappRecipientStatus.QUEUED,
        personalizedBody: recipient.personalizedBody,
        errorMessage: undefined,
      });

      try {
        const response =
          campaign.messageType === WhatsappMessageType.TEXT
            ? await this.openWaClient.sendText(
                session.openwaSessionId!,
                recipient.waChatId,
                text,
              )
            : await this.openWaClient.sendMedia(
                session.openwaSessionId!,
                campaign.messageType as any,
                {
                  chatId: recipient.waChatId,
                  mediaUrl: campaign.mediaUrl || '',
                  caption: mediaCaption,
                },
              );
        const openwaMessageId = response.messageId || response.id;
        await this.updateRecipientStatus(
          campaign._id,
          contactId,
          {
            status: WhatsappRecipientStatus.SENT,
            openwaMessageId,
            sentAt: new Date(),
            errorMessage: undefined,
          },
          { sentCount: 1 },
        );
        await this.contactModel.updateOne(
          { _id: contactId },
          {
            $set: {
              lastMessageAt: new Date(),
              lastOutboundMessageAt: new Date(),
            },
          },
        );
        recipient.status = WhatsappRecipientStatus.SENT;
        sent += 1;
        await this.sleep(intervalMs);
      } catch (error: any) {
        await this.updateRecipientStatus(
          campaign._id,
          contactId,
          {
            status: WhatsappRecipientStatus.FAILED,
            errorMessage: error?.message || 'Failed to send WhatsApp message',
          },
          { failedCount: 1 },
        );
        recipient.status = WhatsappRecipientStatus.FAILED;
        failed += 1;
      }
    }

    const pendingRecipients = campaign.recipients.filter((recipient: any) =>
      [WhatsappRecipientStatus.PENDING, WhatsappRecipientStatus.QUEUED].includes(recipient.status),
    ).length;
    if (pendingRecipients > 0 && sent >= remainingDailySends) {
      const resumeAt = this.nextUtcDay();
      await this.campaignModel.updateOne(
        { _id: campaign._id, status: { $ne: WhatsappCampaignStatus.CANCELLED } },
        { $set: { status: WhatsappCampaignStatus.SCHEDULED, scheduledAt: resumeAt, lastProcessedAt: new Date() } },
      );
      await this.queueService.queueCampaignSend({
        campaignId: String(campaign._id),
        requestedBy: String(campaign.creatorId),
        trigger: 'scheduled',
        attempt: 0,
      }, resumeAt);
      return;
    }

    const terminalStatus =
      failed > 0 && sent === 0 && skipped === 0
        ? WhatsappCampaignStatus.FAILED
        : WhatsappCampaignStatus.SENT;
    await this.campaignModel.updateOne(
      { _id: campaign._id, status: { $ne: WhatsappCampaignStatus.CANCELLED } },
      {
        $set: {
          status: terminalStatus,
          sentAt: new Date(),
          completedAt: new Date(),
          lastProcessedAt: new Date(),
        },
      },
    );
  }

  async markCampaignSendFailed(
    campaignId: string,
    errorMessage: string,
  ): Promise<void> {
    await this.campaignModel.updateOne(
      { _id: new Types.ObjectId(campaignId) },
      {
        $set: { status: WhatsappCampaignStatus.FAILED },
        $inc: { failedCount: 1 },
        $push: { errorMessages: errorMessage },
      },
    );
  }

  async handleOpenWaWebhook(
    payload: OpenWaWebhookDto,
    secretHeader?: string,
  ): Promise<{ processed: boolean }> {
    this.verifyWebhookSecret(secretHeader);
    const eventType =
      payload.event ||
      payload.type ||
      payload.data?.event ||
      payload.data?.type ||
      'unknown';
    const sessionId = payload.sessionId || payload.data?.sessionId;
    const messageId =
      payload.messageId ||
      payload.id ||
      payload.data?.messageId ||
      payload.data?.id;
    const idempotencyKey =
      payload.idempotencyKey ||
      payload.id ||
      this.buildWebhookIdempotencyKey(eventType, sessionId, messageId, payload);

    try {
      await new this.webhookEventModel({
        idempotencyKey,
        eventType,
        sessionId,
        messageId,
        payload,
      }).save();
    } catch (error: any) {
      if (String(error?.code) === '11000') return { processed: false };
      throw error;
    }

    await this.applyWebhookEvent(eventType, sessionId, messageId, payload);
    return { processed: true };
  }

  private async applyWebhookEvent(
    eventType: string,
    sessionId?: string,
    messageId?: string,
    payload?: any,
  ): Promise<void> {
    const normalized = eventType.toLowerCase();
    if (normalized === 'session.status') {
      const status = String(payload?.data?.status || payload?.status || '');
      await this.sessionService.markOpenWaStatusFromWebhook(
        sessionId,
        status,
        payload?.data?.reason || payload?.data?.error,
      );
      return;
    }
    if (
      [
        'session.ready',
        'session.authenticated',
        'ready',
        'authenticated',
      ].includes(normalized)
    ) {
      await this.sessionService.markFromWebhook(
        sessionId,
        WhatsappSessionStatus.READY,
      );
      return;
    }
    if (['session.disconnected', 'disconnected'].includes(normalized)) {
      await this.sessionService.markFromWebhook(
        sessionId,
        WhatsappSessionStatus.DISCONNECTED,
        payload?.data?.reason,
      );
      return;
    }

    if (this.isInboundMessageEvent(normalized, payload)) {
      await this.handleInboundMessage(sessionId, messageId, payload);
      return;
    }

    if (!messageId) return;

    const ackStatus = this.mapOpenWaAckToRecipientStatus(payload);
    const status =
      ackStatus ||
      (normalized.includes('read')
        ? WhatsappRecipientStatus.READ
        : normalized.includes('delivered')
          ? WhatsappRecipientStatus.DELIVERED
          : normalized.includes('failed')
            ? WhatsappRecipientStatus.FAILED
            : normalized.includes('reply')
              ? WhatsappRecipientStatus.REPLIED
              : null);
    if (!status) return;

    const set: Record<string, any> = { 'recipients.$.status': status };
    const inc: Record<string, number> = {};
    if (status === WhatsappRecipientStatus.DELIVERED) {
      set['recipients.$.deliveredAt'] = new Date();
      inc.deliveredCount = 1;
    } else if (status === WhatsappRecipientStatus.READ) {
      set['recipients.$.readAt'] = new Date();
      inc.readCount = 1;
    } else if (status === WhatsappRecipientStatus.REPLIED) {
      set['recipients.$.repliedAt'] = new Date();
      inc.repliedCount = 1;
    } else if (status === WhatsappRecipientStatus.FAILED) {
      set['recipients.$.errorMessage'] =
        payload?.error ||
        payload?.message ||
        payload?.data?.error ||
        payload?.data?.message ||
        'OpenWA reported message failure';
      inc.failedCount = 1;
    }

    await this.campaignModel.updateOne(
      { 'recipients.openwaMessageId': messageId },
      { $set: set, ...(Object.keys(inc).length ? { $inc: inc } : {}) },
    );
  }

  private async updateRecipientStatus(
    campaignId: Types.ObjectId,
    contactId: Types.ObjectId,
    set: Record<string, any>,
    inc: Record<string, number> = {},
  ): Promise<void> {
    const $set: Record<string, any> = { lastProcessedAt: new Date() };
    const $unset: Record<string, ''> = {};
    for (const [key, value] of Object.entries(set)) {
      const path = key.includes('.') ? key : `recipients.$.${key}`;
      if (value === undefined) {
        $unset[path] = '';
      } else {
        $set[path] = value;
      }
    }
    await this.campaignModel.updateOne(
      { _id: campaignId, 'recipients.contactId': contactId },
      {
        $set,
        ...(Object.keys($unset).length ? { $unset } : {}),
        ...(Object.keys(inc).length ? { $inc: inc } : {}),
      },
    );
  }

  private mapOpenWaAckToRecipientStatus(
    payload?: any,
  ): WhatsappRecipientStatus | null {
    const rawAck =
      payload?.ack ??
      payload?.status ??
      payload?.data?.ack ??
      payload?.data?.status ??
      payload?.data?.message?.ack;
    const ackNumber =
      typeof rawAck === 'number'
        ? rawAck
        : /^-?\d+$/.test(String(rawAck || ''))
          ? Number(rawAck)
          : null;
    if (ackNumber !== null) {
      if (ackNumber >= 3) return WhatsappRecipientStatus.READ;
      if (ackNumber >= 2) return WhatsappRecipientStatus.DELIVERED;
      if (ackNumber < 0) return WhatsappRecipientStatus.FAILED;
      return null;
    }

    const ackText = String(rawAck || '').toLowerCase();
    if (ackText.includes('read')) return WhatsappRecipientStatus.READ;
    if (ackText.includes('delivered')) return WhatsappRecipientStatus.DELIVERED;
    if (ackText.includes('failed') || ackText.includes('error')) {
      return WhatsappRecipientStatus.FAILED;
    }
    return null;
  }

  private appendOptOutFooter(body: string): string {
    const maxLength = 4096;
    if (
      String(
        process.env.WHATSAPP_APPEND_OPT_OUT_FOOTER || 'true',
      ).toLowerCase() === 'false'
    ) {
      return body.slice(0, maxLength);
    }
    const footer = 'Reply STOP to unsubscribe.';
    if (body.toLowerCase().includes('reply stop')) {
      return body.slice(0, maxLength);
    }
    const separator = body.trim() ? '\n\n' : '';
    const availableBodyLength = maxLength - separator.length - footer.length;
    return `${body.trim().slice(0, availableBodyLength)}${separator}${footer}`;
  }

  private assertCampaignContent(
    messageType: WhatsappMessageType,
    body: string,
    mediaUrl?: string,
  ): void {
    if (!String(body || '').trim()) throw new BadRequestException('WhatsApp campaign message is required');
    if (messageType !== WhatsappMessageType.TEXT && !String(mediaUrl || '').trim()) {
      throw new BadRequestException('Image, video, and document campaigns require a public media URL');
    }
  }

  private nextUtcDay(): Date {
    const next = new Date();
    next.setUTCHours(24, 0, 0, 0);
    return next;
  }

  private isInboundMessageEvent(eventType: string, payload?: any): boolean {
    const direction = String(
      payload?.direction ||
        payload?.data?.direction ||
        payload?.fromMe ||
        payload?.data?.fromMe ||
        '',
    ).toLowerCase();
    if (
      direction === 'true' ||
      direction === 'outbound' ||
      direction === 'from_me'
    )
      return false;
    return (
      eventType.includes('received') ||
      eventType.includes('incoming') ||
      eventType.includes('reply') ||
      eventType === 'message' ||
      eventType === 'message.received'
    );
  }

  private async handleInboundMessage(
    sessionId?: string,
    messageId?: string,
    payload?: any,
  ): Promise<void> {
    const chatId = this.extractWebhookChatId(payload);
    if (!chatId) return;
    const text = this.extractWebhookText(payload);
    const session = sessionId
      ? await this.sessionService.getSessionByOpenWaId(sessionId)
      : null;
    const communityFilter = session?.communityId
      ? { communityId: session.communityId }
      : {};
    const contact = await this.contactModel
      .findOne({ ...communityFilter, waChatId: chatId })
      .exec();
    if (!contact) return;

    const now = new Date();
    await this.contactModel.updateOne(
      { _id: contact._id },
      { $set: { lastMessageAt: now, lastInboundMessageAt: now } },
    );

    if (this.isOptOutText(text)) {
      await this.contactModel.updateOne(
        { _id: contact._id },
        {
          $set: {
            consentStatus: WhatsappConsentStatus.OPTED_OUT,
            optOutAt: now,
            optOutReason: `inbound_keyword:${text.slice(0, 40)}`,
          },
        },
      );
      await this.campaignModel.updateMany(
        {
          communityId: contact.communityId,
          'recipients.contactId': contact._id,
          'recipients.status': {
            $in: [
              WhatsappRecipientStatus.PENDING,
              WhatsappRecipientStatus.QUEUED,
            ],
          },
        },
        {
          $set: {
            'recipients.$[recipient].status': WhatsappRecipientStatus.SKIPPED,
            'recipients.$[recipient].errorMessage':
              'Contact opted out by inbound message',
          },
        },
        {
          arrayFilters: [
            {
              'recipient.contactId': contact._id,
              'recipient.status': {
                $in: [
                  WhatsappRecipientStatus.PENDING,
                  WhatsappRecipientStatus.QUEUED,
                ],
              },
            },
          ],
        },
      );
      return;
    }

    await this.campaignModel.updateOne(
      {
        communityId: contact.communityId,
        'recipients.contactId': contact._id,
        'recipients.status': {
          $in: [
            WhatsappRecipientStatus.SENT,
            WhatsappRecipientStatus.DELIVERED,
            WhatsappRecipientStatus.READ,
          ],
        },
      },
      {
        $set: {
          'recipients.$.status': WhatsappRecipientStatus.REPLIED,
          'recipients.$.repliedAt': now,
          ...(messageId ? { 'recipients.$.replyMessageId': messageId } : {}),
        },
        $inc: { repliedCount: 1 },
      },
    );

    await this.maybeSendAiAutoReply({
      sessionId,
      chatId,
      text,
      contact,
      session,
    });
  }

  /**
   * Best-effort AI auto-reply to an inbound WhatsApp message. Non-throwing:
   * any failure is logged and the inbound flow continues unaffected.
   */
  private async maybeSendAiAutoReply(args: {
    sessionId?: string;
    chatId: string;
    text: string;
    contact: WhatsappContactDocument;
    session: any;
  }): Promise<void> {
    try {
      if (!this.whatsappAiService.isAutoReplyEnabled()) return;
      if (!args.text || args.text.length < 2) return;

      const result = await this.whatsappAiService.generateAutoReply({
        communityId: String(args.contact.communityId),
        contactName: args.contact.name,
        inboundMessage: args.text,
      });
      if (result.skipped || !result.reply) return;

      const openwaSessionId =
        args.session?.openwaSessionId || args.sessionId;
      if (!openwaSessionId) return;

      await this.openWaClient.sendText(
        openwaSessionId,
        args.chatId,
        result.reply,
      );
      this.logger.log(
        `AI auto-reply sent to ${args.chatId} (${result.model})`,
      );
    } catch (error: any) {
      this.logger.warn(
        `AI auto-reply failed: ${error?.message || error}`,
      );
    }
  }

  private extractWebhookChatId(payload?: any): string | undefined {
    const candidate =
      payload?.chatId ||
      payload?.from ||
      payload?.author ||
      payload?.data?.chatId ||
      payload?.data?.from ||
      payload?.data?.author ||
      payload?.data?.message?.from;
    if (!candidate) return undefined;
    const raw = String(candidate);
    if (raw.includes('@')) return raw;
    const digits = raw.replace(/\D/g, '');
    return digits ? `${digits}@c.us` : undefined;
  }

  private extractWebhookText(payload?: any): string {
    return String(
      payload?.text ||
        payload?.body ||
        payload?.message ||
        payload?.data?.text ||
        payload?.data?.body ||
        payload?.data?.message ||
        payload?.data?.message?.body ||
        '',
    ).trim();
  }

  private isOptOutText(text: string): boolean {
    const normalized = text.trim().toLowerCase();
    return [
      'stop',
      'stop all',
      'unsubscribe',
      'cancel',
      'remove',
      'لا',
      'توقف',
    ].includes(normalized);
  }

  private async validateWhatsappQuota(
    creatorId: string,
    recipientCount: number,
  ): Promise<void> {
    const enforcementOn = process.env.PLAN_ENFORCEMENT_MODE === 'true';
    if (!enforcementOn) return;

    const limits =
      await this.policyService.getEffectiveLimitsForCreator(creatorId);
    const used = await this.getUsedThisMonth(creatorId);
    if (
      limits.whatsappMessagesPerMonth <= 0 ||
      used + recipientCount > limits.whatsappMessagesPerMonth
    ) {
      throw new ForbiddenException(
        `WhatsApp quota exceeded. Used ${used}/${limits.whatsappMessagesPerMonth} messages this month.`,
      );
    }
  }

  private async validateDailySessionLimit(
    communityId: string,
    recipientCount: number,
  ): Promise<void> {
    const remaining = await this.getRemainingDailySessionSends(communityId);
    if (recipientCount > remaining) {
      throw new ForbiddenException(
        `Daily WhatsApp session send limit exceeded. Remaining today: ${remaining}.`,
      );
    }
  }

  private async getRemainingWhatsappQuotaForCreator(
    creatorId: string,
  ): Promise<number> {
    const limits =
      await this.policyService.getEffectiveLimitsForCreator(creatorId);
    const used = await this.getUsedThisMonth(creatorId);
    return Math.max(0, limits.whatsappMessagesPerMonth - used);
  }

  private async getRemainingDailySessionSends(
    communityId: string,
  ): Promise<number> {
    const limit = Number(process.env.WHATSAPP_DAILY_SESSION_SEND_LIMIT || 200);
    if (!Number.isFinite(limit) || limit <= 0) return Number.MAX_SAFE_INTEGER;

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const rows = await this.campaignModel.aggregate([
      {
        $match: {
          communityId: new Types.ObjectId(communityId),
          sentAt: { $gte: dayStart },
          status: {
            $in: [WhatsappCampaignStatus.SENT, WhatsappCampaignStatus.SENDING],
          },
        },
      },
      { $group: { _id: null, total: { $sum: '$sentCount' } } },
    ]);
    return Math.max(0, limit - (rows[0]?.total || 0));
  }

  private async getUsedThisMonth(creatorId: string): Promise<number> {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const rows = await this.campaignModel.aggregate([
      {
        $match: {
          creatorId: new Types.ObjectId(creatorId),
          createdAt: { $gte: monthStart },
          status: {
            $in: [
              WhatsappCampaignStatus.SENDING,
              WhatsappCampaignStatus.SENT,
              WhatsappCampaignStatus.SCHEDULED,
            ],
          },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalRecipients' } } },
    ]);
    return rows[0]?.total || 0;
  }

  private renderTemplate(template: string, data: Record<string, any>): string {
    return String(template || '').replace(
      /\{\{\s*([\w.]+)\s*\}\}/g,
      (_match, key) => {
        const value = key
          .split('.')
          .reduce((acc: any, part: string) => acc?.[part], data);
        return value === undefined || value === null ? '' : String(value);
      },
    );
  }

  private normalizeE164(phone: string): string {
    const trimmed = String(phone || '').trim();
    if (!trimmed.startsWith('+')) {
      throw new BadRequestException(
        'Phone number must be in E.164 format, e.g. +21650123456',
      );
    }
    return `+${trimmed.replace(/\D/g, '')}`;
  }

  private verifyWebhookSecret(secretHeader?: string): void {
    const expected = String(process.env.OPENWA_WEBHOOK_SECRET || '').trim();
    if (!expected) {
      throw new ForbiddenException('OpenWA webhook secret is not configured');
    }
    const provided = String(secretHeader || '').trim();
    const left = Buffer.from(provided);
    const right = Buffer.from(expected);
    if (left.length !== right.length || !timingSafeEqual(left, right)) {
      throw new ForbiddenException('Invalid OpenWA webhook secret');
    }
  }

  private buildWebhookIdempotencyKey(
    eventType: string,
    sessionId?: string,
    messageId?: string,
    payload?: any,
  ): string {
    return createHash('sha256')
      .update(JSON.stringify({ eventType, sessionId, messageId, payload }))
      .digest('hex');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
