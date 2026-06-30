import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WhatsappCampaignDocument = WhatsappCampaign & Document;

export enum WhatsappMessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
}

export enum WhatsappCampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum WhatsappAudienceType {
  ALL_MEMBERS = 'all_members',
  PAID_MEMBERS = 'paid_members',
  FREE_MEMBERS = 'free_members',
  COURSE_ENROLLED = 'course_enrolled',
  CHALLENGE_PARTICIPANTS = 'challenge_participants',
  EVENT_REGISTRANTS = 'event_registrants',
  INACTIVE_USERS = 'inactive_users',
  CUSTOM = 'custom',
}

export enum WhatsappRecipientStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  REPLIED = 'replied',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

@Schema({ _id: false })
export class WhatsappRecipient {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'WhatsappContact' })
  contactId: Types.ObjectId;

  @Prop({ required: true })
  phoneE164: string;

  @Prop({ required: true })
  waChatId: string;

  @Prop({
    type: String,
    enum: Object.values(WhatsappRecipientStatus),
    default: WhatsappRecipientStatus.PENDING,
  })
  status: WhatsappRecipientStatus;

  @Prop()
  openwaMessageId?: string;

  @Prop()
  errorMessage?: string;

  @Prop()
  sentAt?: Date;

  @Prop()
  deliveredAt?: Date;

  @Prop()
  readAt?: Date;

  @Prop()
  repliedAt?: Date;

  @Prop()
  replyMessageId?: string;

  @Prop({ type: Object, default: {} })
  mergeData?: Record<string, any>;

  @Prop()
  personalizedBody?: string;
}

export const WhatsappRecipientSchema =
  SchemaFactory.createForClass(WhatsappRecipient);

@Schema({ timestamps: true })
export class WhatsappCampaign {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 200 })
  title: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Community', index: true })
  communityId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  creatorId: Types.ObjectId;

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

  @Prop()
  mediaUrl?: string;

  @Prop({
    type: String,
    enum: Object.values(WhatsappAudienceType),
    default: WhatsappAudienceType.ALL_MEMBERS,
  })
  targetAudience: WhatsappAudienceType;

  @Prop({ type: [Types.ObjectId], default: [] })
  customAudienceIds: Types.ObjectId[];

  @Prop({
    type: String,
    enum: Object.values(WhatsappCampaignStatus),
    default: WhatsappCampaignStatus.DRAFT,
    index: true,
  })
  status: WhatsappCampaignStatus;

  @Prop()
  scheduledAt?: Date;

  @Prop()
  sentAt?: Date;

  @Prop()
  startedAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  lastProcessedAt?: Date;

  @Prop({ type: [WhatsappRecipientSchema], default: [] })
  recipients: WhatsappRecipient[];

  @Prop({ default: 0, min: 0 })
  totalRecipients: number;

  @Prop({ default: 0, min: 0 })
  sentCount: number;

  @Prop({ default: 0, min: 0 })
  deliveredCount: number;

  @Prop({ default: 0, min: 0 })
  readCount: number;

  @Prop({ default: 0, min: 0 })
  repliedCount: number;

  @Prop({ default: 0, min: 0 })
  failedCount: number;

  @Prop({ type: [String], default: [] })
  errorMessages: string[];

  @Prop({ type: Object, default: {} })
  templateData?: Record<string, any>;
}

export const WhatsappCampaignSchema =
  SchemaFactory.createForClass(WhatsappCampaign);

WhatsappCampaignSchema.index({ communityId: 1, status: 1 });
WhatsappCampaignSchema.index({ creatorId: 1, createdAt: -1 });
WhatsappCampaignSchema.index(
  { 'recipients.openwaMessageId': 1 },
  { sparse: true },
);
