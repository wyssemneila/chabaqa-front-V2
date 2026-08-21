import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TrackableContentType } from '@/infrastructure/database/schemas/learning/content-tracking.schema';

export type AffiliateConversionDocument = AffiliateConversion & Document;

export type AffiliateConversionStatus = 'pending' | 'approved' | 'paid' | 'reversed';

@Schema({ timestamps: true })
export class AffiliateConversion {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AffiliateProgram', required: true })
  programId: Types.ObjectId;

  @Prop({ type: String })
  clickId?: string;

  @Prop({ type: String })
  linkCode?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  partnerUserId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  buyerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creatorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Community' })
  communityId?: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(TrackableContentType) })
  contentType?: TrackableContentType;

  @Prop({ type: String })
  contentId?: string;

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

  @Prop({ type: Date })
  clickCreatedAt?: Date;

  @Prop({ type: Number })
  conversionLagHours?: number;

  @Prop({ type: Number, required: true })
  amountDT: number;

  @Prop({ type: Number, required: true })
  creatorNetDT: number;

  @Prop({ type: Number })
  commissionBasisDT?: number;

  @Prop({ type: Number })
  commissionPercentSnapshot?: number;

  @Prop({ type: Number, required: true })
  commissionDT: number;

  @Prop({ type: String, enum: ['pending', 'approved', 'paid', 'reversed'], default: 'pending' })
  status: AffiliateConversionStatus;

  @Prop({ type: Date, required: true })
  holdUntil: Date;

  @Prop({ type: String })
  reason?: string;
}

export const AffiliateConversionSchema = SchemaFactory.createForClass(AffiliateConversion);
AffiliateConversionSchema.index({ orderId: 1 }, { unique: true });
AffiliateConversionSchema.index({ partnerUserId: 1, status: 1 });
AffiliateConversionSchema.index({ status: 1, holdUntil: 1 });
AffiliateConversionSchema.index({ creatorId: 1, communityId: 1, createdAt: -1 });
AffiliateConversionSchema.index({ programId: 1, status: 1, createdAt: -1 });
AffiliateConversionSchema.index({ linkCode: 1, createdAt: -1 });
