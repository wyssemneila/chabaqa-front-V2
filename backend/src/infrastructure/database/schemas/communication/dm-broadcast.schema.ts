import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DmBroadcastDocument = DmBroadcast & Document;

export type DmBroadcastStatus = 'draft' | 'sending' | 'sent' | 'failed';

@Schema({ timestamps: true })
export class DmBroadcast {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Community', required: true, index: true })
  communityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  creatorId: Types.ObjectId;

  @Prop({ trim: true, maxlength: 160 })
  title?: string;

  @Prop({ required: true, maxlength: 4096 })
  body: string;

  @Prop({
    type: String,
    enum: ['draft', 'sending', 'sent', 'failed'],
    default: 'draft',
    index: true,
  })
  status: DmBroadcastStatus;

  @Prop({ type: Number, default: 0, min: 0 })
  recipientCount: number;

  @Prop({ type: Number, default: 0, min: 0 })
  sentCount: number;

  @Prop({ type: Number, default: 0, min: 0 })
  failedCount: number;

  @Prop({ type: Date })
  sentAt?: Date;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, unknown>;
}

export const DmBroadcastSchema = SchemaFactory.createForClass(DmBroadcast);
DmBroadcastSchema.index({ communityId: 1, createdAt: -1 });
