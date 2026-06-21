import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Community, CommunityDocument } from '@/infrastructure/database/schemas/community/community.schema';
import {
  WhatsappAudienceType,
  WhatsappRecipient,
  WhatsappRecipientStatus,
} from '@/infrastructure/database/schemas/communication/whatsapp-campaign.schema';
import {
  WhatsappConsentStatus,
  WhatsappContact,
  WhatsappContactDocument,
} from '@/infrastructure/database/schemas/communication/whatsapp-contact.schema';

export interface WhatsappAudiencePreview {
  total: number;
  eligible: number;
  skipped: number;
  contacts: Array<{
    id: string;
    name: string;
    phoneE164: string;
    consentStatus: WhatsappConsentStatus;
  }>;
}

@Injectable()
export class WhatsappAudienceService {
  constructor(
    @InjectModel(WhatsappContact.name)
    private readonly contactModel: Model<WhatsappContactDocument>,
    @InjectModel(Community.name)
    private readonly communityModel: Model<CommunityDocument>,
  ) {}

  async preview(
    communityId: string,
    targetAudience: WhatsappAudienceType,
    customAudienceIds: string[] = [],
    limit = 100,
  ): Promise<WhatsappAudiencePreview> {
    const contacts = await this.findAudienceContacts(communityId, targetAudience, customAudienceIds);
    const eligible = contacts.filter((contact) => contact.consentStatus === WhatsappConsentStatus.OPTED_IN);
    return {
      total: contacts.length,
      eligible: eligible.length,
      skipped: contacts.length - eligible.length,
      contacts: eligible.slice(0, limit).map((contact) => ({
        id: String(contact._id),
        name: contact.name,
        phoneE164: contact.phoneE164,
        consentStatus: contact.consentStatus,
      })),
    };
  }

  async buildRecipients(
    communityId: string,
    targetAudience: WhatsappAudienceType,
    customAudienceIds: string[] = [],
  ): Promise<WhatsappRecipient[]> {
    const contacts = await this.findAudienceContacts(communityId, targetAudience, customAudienceIds);
    return contacts
      .filter((contact) => contact.consentStatus === WhatsappConsentStatus.OPTED_IN)
      .map((contact) => ({
        userId: contact.userId,
        contactId: contact._id,
        phoneE164: contact.phoneE164,
        waChatId: contact.waChatId,
        status: WhatsappRecipientStatus.PENDING,
        mergeData: {
          contactName: contact.name,
          phoneE164: contact.phoneE164,
        },
      }) as WhatsappRecipient);
  }

  private async findAudienceContacts(
    communityId: string,
    targetAudience: WhatsappAudienceType,
    customAudienceIds: string[] = [],
  ): Promise<WhatsappContactDocument[]> {
    const communityObjectId = new Types.ObjectId(communityId);
    if (targetAudience === WhatsappAudienceType.CUSTOM) {
      const ids = customAudienceIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
      if (ids.length === 0) return [];
      return this.contactModel.find({ communityId: communityObjectId, _id: { $in: ids } }).exec();
    }

    const baseQuery: Record<string, any> = { communityId: communityObjectId };

    if (targetAudience === WhatsappAudienceType.ALL_MEMBERS) {
      return this.contactModel.find(baseQuery).sort({ createdAt: -1 }).exec();
    }

    // MVP: specific segments fall back to contacts that are linked to community members.
    // Rich course/challenge/event filtering can be added without changing controller contracts.
    const community = await this.communityModel.findById(communityId).select('members').lean();
    const memberIds = (community?.members || []).map((id: any) => new Types.ObjectId(id));
    if (memberIds.length === 0) return [];

    return this.contactModel.find({ ...baseQuery, userId: { $in: memberIds } }).sort({ createdAt: -1 }).exec();
  }
}
