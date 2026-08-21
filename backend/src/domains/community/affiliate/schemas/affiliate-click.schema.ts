import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TrackableContentType } from '@/infrastructure/database/schemas/learning/content-tracking.schema';

export type AffiliateClickDocument = AffiliateClick & Document;

@Schema({ timestamps: true })
export class AffiliateClick {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true })
  clickId: string;

  @Prop({ type: Types.ObjectId, ref: 'AffiliateProgram', required: true })
  programId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  creatorId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Community' })
  communityId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  partnerUserId: Types.ObjectId;

  @Prop({ type: String, required: true })
  linkCode: string;

  @Prop({ type: String, enum: Object.values(TrackableContentType) })
  targetContentType?: TrackableContentType;

  @Prop({ type: String })
  targetContentId?: string;

  @Prop({ type: String })
  landingPath?: string;

  @Prop({ type: String })
  referrer?: string;

  @Prop({ type: String })
  utmSource?: string;

  @Prop({ type: String })
  utmMedium?: string;

  @Prop({ type: String })
  utmCampaign?: string;

  @Prop({ type: String })
  utmTerm?: string;

  @Prop({ type: String })
  utmContent?: string;

  @Prop({ type: String })
  sourceChannel?: string;

  @Prop({ type: String })
  deviceType?: string;

  @Prop({ type: String })
  browser?: string;

  @Prop({ type: String })
  os?: string;

  @Prop({ type: Boolean, default: false })
  isBot?: boolean;

  @Prop({ type: String })
  ipHash?: string;

  @Prop({ type: String })
  userAgentHash?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  viewerUserId?: Types.ObjectId;
}

export const AffiliateClickSchema = SchemaFactory.createForClass(AffiliateClick);
AffiliateClickSchema.index({ clickId: 1 }, { unique: true });
AffiliateClickSchema.index({ programId: 1, partnerUserId: 1, createdAt: -1 });
AffiliateClickSchema.index({ creatorId: 1, communityId: 1, createdAt: -1 });
AffiliateClickSchema.index({ linkCode: 1, createdAt: -1 });
AffiliateClickSchema.index({ sourceChannel: 1, createdAt: -1 });
