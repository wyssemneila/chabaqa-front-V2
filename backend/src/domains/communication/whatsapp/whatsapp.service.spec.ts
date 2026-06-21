import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { WhatsappService } from '@/domains/communication/whatsapp/whatsapp.service';
import { WhatsappAudienceType } from '@/infrastructure/database/schemas/communication/whatsapp-campaign.schema';

describe('WhatsappService', () => {
  const automationModel: any = jest.fn();
  const campaignModel: any = jest.fn();
  const contactModel = {};
  const webhookEventModel: any = jest.fn();
  const openWaClient = { normalizePhoneToChatId: jest.fn((phone: string) => `${phone.replace(/\D/g, '')}@c.us`) };
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
    policyService.getEffectiveLimitsForCreator.mockResolvedValue({ whatsappMessagesPerMonth: 10 });
    audienceService.buildRecipients.mockResolvedValue([
      { contactId: new Types.ObjectId(), phoneE164: '+21650123456', waChatId: '21650123456@c.us' },
    ]);

    await expect(service().createCampaign(new Types.ObjectId().toString(), {
      title: 'Launch',
      communityId: new Types.ObjectId().toString(),
      body: 'Hello',
      targetAudience: WhatsappAudienceType.ALL_MEMBERS,
    })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('renders merge fields in WhatsApp preview text', async () => {
    await expect(service().renderPreview({
      body: 'Hi {{contactName}}, welcome to {{community.name}}',
      mergeData: { contactName: 'Amina', community: { name: 'Motion' } },
    })).resolves.toEqual({ body: 'Hi Amina, welcome to Motion' });
  });
});
