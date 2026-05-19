import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AiActionLogDocument = AiActionLog & Document;

@Schema({ timestamps: true })
export class AiActionLog {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  actorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Community', index: true })
  communityId?: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  actionType: string;

  @Prop({ type: String })
  targetType?: string;

  @Prop({ type: String })
  targetId?: string;

  @Prop({ type: String })
  model?: string;

  @Prop({ type: String })
  promptVersion?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;
}

export const AiActionLogSchema = SchemaFactory.createForClass(AiActionLog);

AiActionLogSchema.index({ actorId: 1, actionType: 1, createdAt: -1 });
