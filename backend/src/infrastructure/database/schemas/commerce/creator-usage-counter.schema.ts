import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CreatorUsageCounterDocument = CreatorUsageCounter & Document;

@Schema({ timestamps: true })
export class CreatorUsageCounter {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true }) creatorId: Types.ObjectId;
  @Prop({ type: String, required: true, index: true }) metricType: string;
  @Prop({ type: String, required: true, index: true }) periodKey: string;
  @Prop({ type: Date, required: true }) periodStart: Date;
  @Prop({ type: Date, required: true }) periodEnd: Date;
  @Prop({ type: Number, default: 0, min: 0 }) used: number;
}

export const CreatorUsageCounterSchema = SchemaFactory.createForClass(CreatorUsageCounter);
CreatorUsageCounterSchema.index({ creatorId: 1, metricType: 1, periodKey: 1 }, { unique: true });
