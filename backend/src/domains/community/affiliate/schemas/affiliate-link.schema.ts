import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TrackableContentType } from '@/infrastructure/database/schemas/learning/content-tracking.schema';

export type AffiliateLinkDocument = AffiliateLink & Document;

@Schema({ timestamps: true })
export class AffiliateLink {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AffiliateProgram', required: true })
  programId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  partnerUserId: Types.ObjectId;

  @Prop({ type: String, required: true })
  code: string;

  @Prop({ type: String, trim: true, maxlength: 120 })
  label?: string;

  @Prop({ type: String, required: true })
  targetPath: string;

  @Prop({ type: String, enum: Object.values(TrackableContentType) })
  targetContentType?: TrackableContentType;

  @Prop({ type: String })
  targetContentId?: string;

  @Prop({ type: Types.ObjectId, ref: 'Community' })
  communityId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  creatorId?: Types.ObjectId;

  @Prop({ type: String, trim: true, maxlength: 120 })
  campaignName?: string;

  @Prop({ type: String, trim: true, maxlength: 120 })
  utmSource?: string;

  @Prop({ type: String, trim: true, maxlength: 120 })
  utmMedium?: string;

  @Prop({ type: String, trim: true, maxlength: 160 })
  utmCampaign?: string;

  @Prop({ type: String, trim: true, maxlength: 160 })
  utmTerm?: string;

  @Prop({ type: String, trim: true, maxlength: 160 })
  utmContent?: string;

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ type: Boolean, default: false })
  isArchived?: boolean;

  @Prop({ type: Number, default: 0 })
  clickCount?: number;

  @Prop({ type: Date })
  lastClickedAt?: Date;
}

export const AffiliateLinkSchema = SchemaFactory.createForClass(AffiliateLink);
AffiliateLinkSchema.index({ code: 1 }, { unique: true });
AffiliateLinkSchema.index({ programId: 1, partnerUserId: 1 });
AffiliateLinkSchema.index({ creatorId: 1, communityId: 1, createdAt: -1 });
AffiliateLinkSchema.index({ targetContentType: 1, targetContentId: 1 });
