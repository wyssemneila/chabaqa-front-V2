import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AiConversationDocument = AiConversation & Document;

@Schema({ _id: false, timestamps: false })
export class AiConversationCitation {
  @Prop({ type: String, required: true })
  sourceType: string;

  @Prop({ type: String, required: true })
  sourceId: string;

  @Prop({ type: String, required: true, maxlength: 500 })
  excerpt: string;
}

export const AiConversationCitationSchema = SchemaFactory.createForClass(
  AiConversationCitation,
);

@Schema({ _id: false })
export class AiConversationMessage {
  @Prop({ type: String, enum: ['user', 'assistant', 'system'], required: true })
  role: 'user' | 'assistant' | 'system';

  @Prop({ type: String, required: true, maxlength: 6000 })
  content: string;

  @Prop({ type: [AiConversationCitationSchema], default: [] })
  citations?: AiConversationCitation[];

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const AiConversationMessageSchema = SchemaFactory.createForClass(
  AiConversationMessage,
);

@Schema({ timestamps: true })
export class AiConversation {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AiAgent', required: true, index: true })
  agentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Community', required: true, index: true })
  communityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: [AiConversationMessageSchema], default: [] })
  messages: AiConversationMessage[];

  @Prop({
    type: String,
    enum: ['open', 'escalated', 'closed'],
    default: 'open',
    index: true,
  })
  status: 'open' | 'escalated' | 'closed';

  @Prop({ type: Types.ObjectId })
  escalatedTicketId?: Types.ObjectId;
}

export const AiConversationSchema =
  SchemaFactory.createForClass(AiConversation);

AiConversationSchema.index({ communityId: 1, agentId: 1, updatedAt: -1 });
