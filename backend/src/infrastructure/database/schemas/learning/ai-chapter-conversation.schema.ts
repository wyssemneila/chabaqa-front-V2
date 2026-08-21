import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AiChapterMessageRole = 'user' | 'assistant';

@Schema({ _id: false, timestamps: false })
export class AiTutorSourceSnippet {
  @Prop({ required: true, trim: true })
  id: string;

  @Prop({ required: true, trim: true })
  label: string;

  @Prop({ required: true, trim: true, maxlength: 800 })
  excerpt: string;
}

export const AiTutorSourceSnippetSchema =
  SchemaFactory.createForClass(AiTutorSourceSnippet);

@Schema({ _id: false, timestamps: false })
export class AiTutorQuizSnapshot {
  @Prop({ required: true, trim: true })
  question: string;

  @Prop({ type: [String], default: [] })
  options: string[];

  @Prop({ type: Number, required: true })
  correctIndex: number;

  @Prop({ trim: true, default: '' })
  explanation: string;

  @Prop({ trim: true })
  sourceId?: string;
}

export const AiTutorQuizSnapshotSchema =
  SchemaFactory.createForClass(AiTutorQuizSnapshot);

@Schema({ _id: false, timestamps: false })
export class AiChapterMessageMetadata {
  @Prop({ trim: true })
  quizId?: string;

  @Prop({ type: Number })
  questionCount?: number;

  @Prop({ type: [AiTutorQuizSnapshotSchema], default: undefined })
  questions?: AiTutorQuizSnapshot[];
}

export const AiChapterMessageMetadataSchema =
  SchemaFactory.createForClass(AiChapterMessageMetadata);

@Schema({ _id: false, timestamps: false })
export class AiChapterMessage {
  @Prop({
    required: true,
    type: String, enum: ['user', 'assistant'],
  })
  role: AiChapterMessageRole;

  @Prop({
    required: true,
    trim: true,
    maxlength: 8000,
  })
  content: string;

  @Prop({
    type: Date,
    default: Date.now,
  })
  createdAt: Date;

  @Prop({
    required: false,
    trim: true,
  })
  model?: string;

  @Prop({
    trim: true,
    enum: ['chat', 'summary', 'quiz', 'simplify'],
  })
  mode?: string;

  @Prop({
    trim: true,
    enum: ['question', 'summary', 'quiz', 'simplify', 'clarification', 'other'],
  })
  intent?: string;

  @Prop({ type: [AiTutorSourceSnippetSchema], default: [] })
  sources?: AiTutorSourceSnippet[];

  @Prop({ type: AiChapterMessageMetadataSchema })
  metadata?: AiChapterMessageMetadata;
}

export const AiChapterMessageSchema =
  SchemaFactory.createForClass(AiChapterMessage);

export interface AiChapterConversationDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  courseId: string;
  chapterId: string;
  messages: AiChapterMessage[];
  createdAt: Date;
  updatedAt: Date;
}

@Schema({
  timestamps: true,
  collection: 'ai_chapter_conversations',
})
export class AiChapterConversation {
  _id: Types.ObjectId;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'User',
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    index: true,
  })
  courseId: string;

  @Prop({
    required: true,
    trim: true,
    index: true,
  })
  chapterId: string;

  @Prop({
    type: [AiChapterMessageSchema],
    default: [],
  })
  messages: AiChapterMessage[];

  createdAt: Date;
  updatedAt: Date;
}

export const AiChapterConversationSchema =
  SchemaFactory.createForClass(AiChapterConversation);

AiChapterConversationSchema.index(
  { userId: 1, courseId: 1, chapterId: 1 },
  { unique: true },
);
AiChapterConversationSchema.index({ updatedAt: -1 });
