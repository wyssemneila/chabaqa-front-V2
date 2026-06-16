import { Types } from 'mongoose';
import { WhatsappAudienceService } from '@/domains/communication/whatsapp/whatsapp-audience.service';
import {
  WhatsappAudienceType,
  WhatsappRecipientStatus,
} from '@/infrastructure/database/schemas/communication/whatsapp-campaign.schema';
import { WhatsappConsentStatus } from '@/infrastructure/database/schemas/communication/whatsapp-contact.schema';

function makeQuery(result: any[]) {
  return {
    sort: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(result),
  };
}

describe('WhatsappAudienceService', () => {
  const contactModel = { find: jest.fn() };
  const communityModel = { findById: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('only builds recipients for opted-in contacts', async () => {
    const optedInId = new Types.ObjectId();
    contactModel.find.mockReturnValue(makeQuery([
      {
        _id: optedInId,
        userId: new Types.ObjectId(),
        name: 'Amina',
        phoneE164: '+21650123456',
        waChatId: '21650123456@c.us',
        consentStatus: WhatsappConsentStatus.OPTED_IN,
      },
      {
        _id: new Types.ObjectId(),
        name: 'No consent',
        phoneE164: '+21650123457',
        waChatId: '21650123457@c.us',
        consentStatus: WhatsappConsentStatus.UNKNOWN,
      },
    ]));

    const service = new WhatsappAudienceService(contactModel as any, communityModel as any);
    const recipients = await service.buildRecipients(
      new Types.ObjectId().toString(),
      WhatsappAudienceType.ALL_MEMBERS,
    );

    expect(recipients).toHaveLength(1);
    expect(String(recipients[0].contactId)).toBe(String(optedInId));
    expect(recipients[0].status).toBe(WhatsappRecipientStatus.PENDING);
  });
});
