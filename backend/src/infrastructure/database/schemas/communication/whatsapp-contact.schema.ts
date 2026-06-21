import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WhatsappContactDocument = WhatsappContact & Document;

export enum WhatsappContactSource {
  MEMBER_PROFILE = 'member_profile',
  IMPORT = 'import',
  CHECKOUT = 'checkout',
  MANUAL = 'manual',
}

export enum WhatsappConsentStatus {
  OPTED_IN = 'opted_in',
  OPTED_OUT = 'opted_out',
  UNKNOWN = 'unknown',
}

@Schema({ timestamps: true })
export class WhatsappContact {
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Community', index: true })
  communityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId?: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 140 })
  name: string;

  @Prop({ required: true, trim: true })
  phoneE164: string;

  @Prop({ required: true, trim: true })
  waChatId: string;

  @Prop({
    type: String,
    enum: Object.values(WhatsappContactSource),
    default: WhatsappContactSource.MANUAL,
  })
  source: WhatsappContactSource;

  @Prop({
    type: String,
    enum: Object.values(WhatsappConsentStatus),
    default: WhatsappConsentStatus.UNKNOWN,
    index: true,
  })
  consentStatus: WhatsappConsentStatus;

  @Prop()
  consentCapturedAt?: Date;

  @Prop()
  lastMessageAt?: Date;

  @Prop({ type: [String], default: [] })
  tags: string[];
}

export const WhatsappContactSchema = SchemaFactory.createForClass(WhatsappContact);

WhatsappContactSchema.index({ communityId: 1, phoneE164: 1 }, { unique: true });
WhatsappContactSchema.index({ communityId: 1, consentStatus: 1 });
