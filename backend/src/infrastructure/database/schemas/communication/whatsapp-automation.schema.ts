import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  WhatsappAudienceType,
  WhatsappMessageType,
} from '@/infrastructure/database/schemas/communication/whatsapp-campaign.schema';

export type WhatsappAutomationDocument = WhatsappAutomation & Document;

export enum WhatsappAutomationTrigger {
  COMMUNITY_JOIN = 'COMMUNITY_JOIN',
  PURCHASE_COMPLETED = 'PURCHASE_COMPLETED',
  COURSE_ENROLLED = 'COURSE_ENROLLED',
  COURSE_COMPLETED = 'COURSE_COMPLETED',
  CHALLENGE_JOINED = 'CHALLENGE_JOINED',
  EVENT_REGISTERED = 'EVENT_REGISTERED',
  INACTIVE_7_DAYS = 'INACTIVE_7_DAYS',
  INACTIVE_30_DAYS = 'INACTIVE_30_DAYS',
}

@Schema({ timestamps: true })
export class WhatsappAutomation {
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Community', index: true })
  communityId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  creatorId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 160 })
  name: string;

  @Prop({ type: String, enum: Object.values(WhatsappAutomationTrigger), required: true })
  trigger: WhatsappAutomationTrigger;

  @Prop({ type: Number, default: 0, min: 0 })
  delayHours: number;

  @Prop({
    type: String,
    enum: Object.values(WhatsappMessageType),
    default: WhatsappMessageType.TEXT,
  })
  messageType: WhatsappMessageType;

  @Prop({ required: true, maxlength: 4096 })
  body: string;

  @Prop({ maxlength: 1024 })
  caption?: string;

  @Prop()
  mediaAssetId?: string;

  @Prop({ type: String, enum: Object.values(WhatsappAudienceType), default: WhatsappAudienceType.CUSTOM })
  targetAudience: WhatsappAudienceType;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Number, default: 0, min: 0 })
  triggeredCount: number;
}

export const WhatsappAutomationSchema = SchemaFactory.createForClass(WhatsappAutomation);

WhatsappAutomationSchema.index({ communityId: 1, trigger: 1 });
