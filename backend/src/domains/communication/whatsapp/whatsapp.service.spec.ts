import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { WhatsappService } from '@/domains/communication/whatsapp/whatsapp.service';
import {
  WhatsappAudienceType,
  WhatsappRecipientStatus,
} from '@/infrastructure/database/schemas/communication/whatsapp-campaign.schema';
import { WhatsappSessionStatus } from '@/infrastructure/database/schemas/communication/whatsapp-session.schema';

describe('WhatsappService', () => {
  const automationModel: any = jest.fn();
  const campaignModel: any = jest.fn();
  const contactModel = {};
  const webhookEventModel: any = jest.fn();
  const openWaClient = {
    normalizePhoneToChatId: jest.fn(
      (phone: string) => `${phone.replace(/\D/g, '')}@c.us`,
    ),
  };
  const audienceService = { buildRecipients: jest.fn(), preview: jest.fn() };
  const sessionService = {};
  const queueService = { queueCampaignSend: jest.fn() };
  const policyService = { getEffectiveLimitsForCreator: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PLAN_ENFORCEMENT_MODE = 'true';
    campaignModel.aggregate = jest.fn().mockResolvedValue([{ total: 10 }]);
  });

  afterEach(() => {
    delete process.env.PLAN_ENFORCEMENT_MODE;
  });

  function service() {
    return new WhatsappService(
      automationModel,
      campaignModel,
      contactModel as any,
      webhookEventModel,
      openWaClient as any,
      audienceService as any,
      sessionService as any,
      queueService as any,
      policyService as any,
    );
  }

  it('blocks campaign creation when monthly WhatsApp quota is exhausted', async () => {
    policyService.getEffectiveLimitsForCreator.mockResolvedValue({
      whatsappMessagesPerMonth: 10,
    });
    audienceService.buildRecipients.mockResolvedValue([
      {
        contactId: new Types.ObjectId(),
        phoneE164: '+21650123456',
        waChatId: '21650123456@c.us',
      },
    ]);

    await expect(
      service().createCampaign(new Types.ObjectId().toString(), {
        title: 'Launch',
        communityId: new Types.ObjectId().toString(),
        body: 'Hello',
        targetAudience: WhatsappAudienceType.ALL_MEMBERS,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('renders merge fields in WhatsApp preview text', async () => {
    await expect(
      service().renderPreview({
        body: 'Hi {{contactName}}, welcome to {{community.name}}',
        mergeData: { contactName: 'Amina', community: { name: 'Motion' } },
      }),
    ).resolves.toEqual({ body: 'Hi Amina, welcome to Motion' });
  });

  it('smoke tests OpenWA webhook auth, idempotency, session status and ack updates', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const webhookModel: any = jest.fn().mockImplementation(() => ({ save }));
    const campaignModelWithUpdates: any = jest.fn();
    campaignModelWithUpdates.updateOne = jest
      .fn()
      .mockResolvedValue({ modifiedCount: 1 });
    campaignModelWithUpdates.aggregate = jest.fn().mockResolvedValue([]);
    const sessionServiceWithWebhook = {
      markFromWebhook: jest.fn().mockResolvedValue(undefined),
    };
    process.env.OPENWA_WEBHOOK_SECRET = 'webhook_secret';

    const serviceWithWebhook = new WhatsappService(
      automationModel,
      campaignModelWithUpdates,
      contactModel as any,
      webhookModel,
      openWaClient as any,
      audienceService as any,
      sessionServiceWithWebhook as any,
      queueService as any,
      policyService as any,
    );

    await expect(
      serviceWithWebhook.handleOpenWaWebhook(
        {
          event: 'session.authenticated',
          sessionId: 'session-1',
          id: 'evt-session-ready',
        },
        'webhook_secret',
      ),
    ).resolves.toEqual({ processed: true });
    expect(sessionServiceWithWebhook.markFromWebhook).toHaveBeenCalledWith(
      'session-1',
      WhatsappSessionStatus.READY,
    );

    await expect(
      serviceWithWebhook.handleOpenWaWebhook(
        {
          event: 'message.ack',
          sessionId: 'session-1',
          messageId: 'msg-1',
          id: 'evt-delivered',
          data: { ack: 2 },
        },
        'webhook_secret',
      ),
    ).resolves.toEqual({ processed: true });
    expect(campaignModelWithUpdates.updateOne).toHaveBeenCalledWith(
      { 'recipients.openwaMessageId': 'msg-1' },
      expect.objectContaining({
        $set: expect.objectContaining({
          'recipients.$.status': WhatsappRecipientStatus.DELIVERED,
          'recipients.$.deliveredAt': expect.any(Date),
        }),
        $inc: { deliveredCount: 1 },
      }),
    );

    save.mockRejectedValueOnce({ code: 11000 });
    await expect(
      serviceWithWebhook.handleOpenWaWebhook(
        {
          event: 'message.ack',
          sessionId: 'session-1',
          messageId: 'msg-1',
          id: 'evt-delivered',
          data: { ack: 2 },
        },
        'webhook_secret',
      ),
    ).resolves.toEqual({ processed: false });

    await expect(
      serviceWithWebhook.handleOpenWaWebhook(
        {
          event: 'message.ack',
          sessionId: 'session-1',
          messageId: 'msg-2',
          id: 'evt-bad-secret',
          data: { ack: 2 },
        },
        'wrong_secret',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    delete process.env.OPENWA_WEBHOOK_SECRET;
  });
});
