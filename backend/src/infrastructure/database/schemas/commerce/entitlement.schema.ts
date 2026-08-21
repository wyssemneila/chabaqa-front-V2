import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TrackableContentType } from '@/infrastructure/database/schemas/learning/content-tracking.schema';

export type EntitlementDocument = Entitlement & Document;

@Schema({ timestamps: true })
export class Entitlement {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(TrackableContentType), required: true, index: true })
  contentType: TrackableContentType;

  @Prop({ type: String, required: true, index: true })
  contentId: string;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, unique: true })
  orderId: Types.ObjectId;

  @Prop({ type: String, enum: ['active', 'suspended', 'revoked', 'expired'], default: 'active', index: true })
  status: 'active' | 'suspended' | 'revoked' | 'expired';

  @Prop({ type: Date, required: true, default: Date.now })
  activatedAt: Date;

  @Prop({ type: Date, default: null })
  revokedAt?: Date | null;

  @Prop({ type: String, default: null })
  revocationReason?: string | null;
}

export const EntitlementSchema = SchemaFactory.createForClass(Entitlement);
EntitlementSchema.index({ userId: 1, contentType: 1, contentId: 1, status: 1 });
