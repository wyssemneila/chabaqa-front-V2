import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AiKnowledgeDocumentDocument = AiKnowledgeDocument & Document;

@Schema({ timestamps: true })
export class AiKnowledgeDocument {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Community', required: true, index: true })
  communityId: Types.ObjectId;

  @Prop({
    type: String,
    enum: [
      'community_page',
      'course',
      'chapter',
      'post',
      'resource',
      'faq',
      'policy',
      'product',
      'event',
    ],
    required: true,
  })
  sourceType: string;

  @Prop({ type: String, required: true, index: true })
  sourceId: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 240 })
  title: string;

  @Prop({ type: String, required: true, maxlength: 50000 })
  extractedText: string;

  @Prop({
    type: String,
    enum: ['member', 'public', 'staff'],
    default: 'member',
    index: true,
  })
  visibility: 'member' | 'public' | 'staff';

  @Prop({ type: [Number], default: undefined })
  embedding?: number[];

  @Prop({ type: String, required: true })
  contentHash: string;
}

export const AiKnowledgeDocumentSchema =
  SchemaFactory.createForClass(AiKnowledgeDocument);

AiKnowledgeDocumentSchema.index(
  { communityId: 1, sourceType: 1, sourceId: 1 },
  { unique: true },
);
AiKnowledgeDocumentSchema.index({ communityId: 1, visibility: 1 });
