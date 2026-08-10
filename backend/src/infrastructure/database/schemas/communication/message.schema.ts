import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;
export type MessageActorModel = 'User' | 'Admin';

@Schema({ _id: false })
export class MessageAttachment {
  @Prop({ type: String, required: true })
  url: string;

  @Prop({ type: String, enum: ['image', 'file', 'video'], required: true })
  type: 'image' | 'file' | 'video';

  @Prop({ type: Number, required: true })
  size: number;

  @Prop({ type: String })
  name?: string;

  @Prop({ type: String })
  mimeType?: string;

  @Prop({ type: Number })
  width?: number;

  @Prop({ type: Number })
  height?: number;
}

export const MessageAttachmentSchema = SchemaFactory.createForClass(MessageAttachment);

@Schema({ _id: false })
export class MessageReaction {
  @Prop({ type: String, required: true, maxlength: 16 })
  emoji: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  userIds: Types.ObjectId[];
}

export const MessageReactionSchema = SchemaFactory.createForClass(MessageReaction);

@Schema({ _id: false })
export class MessageEditHistory {
  @Prop({ type: String })
  text?: string;

  @Prop({ type: String, enum: ['User', 'Admin'], default: 'User' })
  editedByModel?: MessageActorModel;

  @Prop({ type: Types.ObjectId, refPath: 'editedByModel', required: true })
  editedBy: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  editedAt: Date;
}

export const MessageEditHistorySchema = SchemaFactory.createForClass(MessageEditHistory);

@Schema({ timestamps: true })
export class Message {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true, index: true })
  conversationId: Types.ObjectId;

  @Prop({ type: String, enum: ['User', 'Admin'], default: 'User' })
  senderModel?: MessageActorModel;

  @Prop({ type: Types.ObjectId, refPath: 'senderModel', required: true, index: true })
  senderId: Types.ObjectId;

  @Prop({ type: String, enum: ['User', 'Admin'], default: 'User' })
  recipientModel?: MessageActorModel;

  @Prop({ type: Types.ObjectId, refPath: 'recipientModel', required: true, index: true })
  recipientId: Types.ObjectId;

  @Prop({ type: String })
  text?: string;

  @Prop({ type: String, index: true })
  clientRequestId?: string;

  @Prop({ type: Types.ObjectId, ref: 'Message', index: true })
  replyToMessageId?: Types.ObjectId;

  @Prop({ type: [MessageAttachmentSchema], default: [] })
  attachments: MessageAttachment[];

  @Prop({ type: [MessageReactionSchema], default: [] })
  reactions: MessageReaction[];

  @Prop({ type: Date })
  readAt?: Date;

  @Prop({ type: Date })
  editedAt?: Date;

  @Prop({ type: String, enum: ['User', 'Admin'], default: 'User' })
  editedByModel?: MessageActorModel;

  @Prop({ type: Types.ObjectId, refPath: 'editedByModel' })
  editedBy?: Types.ObjectId;

  @Prop({ type: [MessageEditHistorySchema], default: [] })
  editHistory: MessageEditHistory[];

  @Prop({ type: Date })
  deletedAt?: Date;

  @Prop({ type: String, enum: ['User', 'Admin'], default: 'User' })
  deletedByModel?: MessageActorModel;

  @Prop({ type: Types.ObjectId, refPath: 'deletedByModel' })
  deletedBy?: Types.ObjectId;

  @Prop({ type: Date })
  pinnedAt?: Date;

  @Prop({ type: String, enum: ['User', 'Admin'], default: 'User' })
  pinnedByModel?: MessageActorModel;

  @Prop({ type: Types.ObjectId, refPath: 'pinnedByModel' })
  pinnedBy?: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  deletedFor: Types.ObjectId[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index(
  { conversationId: 1, senderId: 1, clientRequestId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      clientRequestId: { $exists: true, $type: 'string' },
    },
  },
);
MessageSchema.index({ recipientId: 1, readAt: 1 });
MessageSchema.index({ conversationId: 1, replyToMessageId: 1 });
MessageSchema.index({ conversationId: 1, pinnedAt: -1 });
MessageSchema.index({ conversationId: 1, text: 'text' });
