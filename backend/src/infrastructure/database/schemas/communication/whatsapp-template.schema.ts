import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { WhatsappMessageType } from '@/infrastructure/database/schemas/communication/whatsapp-campaign.schema';

export type WhatsappTemplateDocument = WhatsappTemplate & Document;

export enum WhatsappTemplateCategory {
  ANNOUNCEMENT = 'announcement',
  PROMOTION = 'promotion',
  EVENT_REMINDER = 'event_reminder',
  COURSE_UPDATE = 'course_update',
  WELCOME = 'welcome',
  INACTIVE_USER_REACTIVATION = 'inactive_user_reactivation',
  CUSTOM = 'custom',
}

@Schema({ timestamps: true })
export class WhatsappTemplate {
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Community', index: true })
  communityId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  creatorId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 160 })
  name: string;

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

  @Prop({
    type: String,
    enum: Object.values(WhatsappTemplateCategory),
    default: WhatsappTemplateCategory.CUSTOM,
  })
  category: WhatsappTemplateCategory;

  @Prop({ type: [String], default: [] })
  variables: string[];
}

export const WhatsappTemplateSchema = SchemaFactory.createForClass(WhatsappTemplate);

WhatsappTemplateSchema.index({ communityId: 1, name: 1 }, { unique: true });
