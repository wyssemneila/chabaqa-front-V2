import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UsageEventDocument = UsageEvent & Document;

@Schema({ timestamps: true, collection: 'usage_events' })
export class UsageEvent {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  creatorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Subscription', index: true })
  subscriptionId?: Types.ObjectId;

  @Prop({ required: true, index: true })
  metricType: string;

  @Prop({ type: Number, required: true })
  value: number;

  @Prop()
  resourceId?: string;

  @Prop({ type: Date, required: true, index: true })
  timestamp: Date;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;
}

export const UsageEventSchema = SchemaFactory.createForClass(UsageEvent);

UsageEventSchema.index({ creatorId: 1, metricType: 1, timestamp: -1 });
