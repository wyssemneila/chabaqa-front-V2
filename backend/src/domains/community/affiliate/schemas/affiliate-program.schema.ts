import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TrackableContentType } from '@/infrastructure/database/schemas/learning/content-tracking.schema';

export type AffiliateProgramDocument = AffiliateProgram & Document;

export type AffiliateProgramScopeType = 'community' | 'creator' | 'content';
export type AffiliateProgramStatus = 'active' | 'paused';
export type AffiliateAttributionModel = 'last_click' | 'first_click';

@Schema({ timestamps: true })
export class AffiliateProgram {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creatorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Community' })
  communityId?: Types.ObjectId;

  @Prop({ type: String, trim: true, maxlength: 120 })
  name?: string;

  @Prop({ type: String, trim: true, maxlength: 1000 })
  description?: string;

  @Prop({ type: String, enum: ['community', 'creator', 'content'], required: true })
  scopeType: AffiliateProgramScopeType;

  @Prop({ type: String, enum: Object.values(TrackableContentType) })
  scopeContentType?: TrackableContentType;

  @Prop({ type: String })
  scopeContentId?: string;

  @Prop({ type: Number, required: true, min: 0, max: 100 })
  commissionPercent: number;

  @Prop({ type: Number, default: 30 })
  cookieWindowDays: number;

  @Prop({ type: Number, default: 14 })
  holdDays: number;

  @Prop({ type: String, enum: ['last_click', 'first_click'], default: 'last_click' })
  attributionModel?: AffiliateAttributionModel;

  @Prop({ type: Boolean, default: false })
  autoApprovePartners?: boolean;

  @Prop({ type: String, trim: true, maxlength: 2000 })
  terms?: string;

  @Prop({ type: String, enum: ['active', 'paused'], default: 'active' })
  status: AffiliateProgramStatus;
}

export const AffiliateProgramSchema = SchemaFactory.createForClass(AffiliateProgram);
AffiliateProgramSchema.index({ creatorId: 1, communityId: 1, status: 1 });
AffiliateProgramSchema.index({ creatorId: 1, scopeType: 1, createdAt: -1 });
