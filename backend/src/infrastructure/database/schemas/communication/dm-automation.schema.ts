import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DmAutomationDocument = DmAutomation & Document;

export enum DmAutomationTrigger {
  NEW_MEMBER = 'new_member',
  INACTIVE_7 = 'inactive_7',
  INACTIVE_30 = 'inactive_30',
}

@Schema({ timestamps: true })
export class DmAutomation {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Community', required: true, index: true })
  communityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  creatorId: Types.ObjectId;

  @Prop({ trim: true, maxlength: 160, required: true })
  name: string;

  @Prop({ type: String, enum: Object.values(DmAutomationTrigger), required: true })
  trigger: DmAutomationTrigger;

  @Prop({ type: Number, default: 0, min: 0 })
  delayHours: number;

  @Prop({ required: true, maxlength: 4096 })
  body: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Number, default: 0, min: 0 })
  triggeredCount: number;

  @Prop({ type: Date })
  lastTriggeredAt?: Date;
}

export const DmAutomationSchema = SchemaFactory.createForClass(DmAutomation);
DmAutomationSchema.index({ communityId: 1, trigger: 1 });
