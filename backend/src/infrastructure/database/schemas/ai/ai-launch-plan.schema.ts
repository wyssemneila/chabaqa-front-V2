import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AiLaunchPlanDocument = AiLaunchPlan & Document;

@Schema({ _id: false })
export class AiLaunchPlanTask {
  @Prop({ type: Number, required: true, min: 1 })
  day: number;

  @Prop({ type: String, required: true, maxlength: 120 })
  title: string;

  @Prop({ type: String, required: true, maxlength: 1000 })
  description: string;

  @Prop({ type: String, required: true })
  actionType: string;

  @Prop({ type: Types.ObjectId })
  linkedDraftId?: Types.ObjectId;
}

export const AiLaunchPlanTaskSchema =
  SchemaFactory.createForClass(AiLaunchPlanTask);

@Schema({ timestamps: true })
export class AiLaunchPlan {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Community', required: true, index: true })
  communityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  creatorId: Types.ObjectId;

  @Prop({ type: Number, enum: [7, 14, 30], required: true })
  durationDays: 7 | 14 | 30;

  @Prop({ type: [AiLaunchPlanTaskSchema], default: [] })
  tasks: AiLaunchPlanTask[];

  @Prop({ type: [Types.ObjectId], default: [] })
  emailDraftIds?: Types.ObjectId[];

  @Prop({
    type: String,
    enum: ['draft', 'active', 'completed'],
    default: 'draft',
    index: true,
  })
  status: 'draft' | 'active' | 'completed';
}

export const AiLaunchPlanSchema = SchemaFactory.createForClass(AiLaunchPlan);
