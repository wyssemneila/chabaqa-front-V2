import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DmDeliveryDocument = DmDelivery & Document;
export type DmDeliveryKind = 'broadcast' | 'automation';
export type DmDeliveryStatus = 'queued' | 'processing' | 'sent' | 'failed' | 'cancelled';

/**
 * Durable, per-recipient delivery record. It makes retries idempotent and gives
 * creators accurate delivery counts without relying on a long HTTP request.
 */
@Schema({ timestamps: true })
export class DmDelivery {
  _id: Types.ObjectId;

  @Prop({ type: String, enum: ['broadcast', 'automation'], required: true, index: true })
  kind: DmDeliveryKind;

  @Prop({ type: Types.ObjectId, ref: 'DmBroadcast', index: true })
  broadcastId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'DmAutomation', index: true })
  automationId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Community', required: true, index: true })
  communityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  recipientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  messageId?: Types.ObjectId;

  @Prop({ type: String, enum: ['queued', 'processing', 'sent', 'failed', 'cancelled'], default: 'queued', index: true })
  status: DmDeliveryStatus;

  @Prop({ type: Number, default: 0, min: 0 })
  attempts: number;

  @Prop({ type: String, maxlength: 1000 })
  failureReason?: string;

  @Prop({ type: Date })
  sentAt?: Date;
}

export const DmDeliverySchema = SchemaFactory.createForClass(DmDelivery);
DmDeliverySchema.index({ broadcastId: 1, recipientId: 1 }, { unique: true, sparse: true });
DmDeliverySchema.index({ automationId: 1, recipientId: 1 }, { unique: true, sparse: true });
DmDeliverySchema.index({ kind: 1, status: 1, createdAt: 1 });
