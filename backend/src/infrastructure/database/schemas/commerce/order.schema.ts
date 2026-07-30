import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TrackableContentType } from '@/infrastructure/database/schemas/learning/content-tracking.schema';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  buyerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creatorId: Types.ObjectId;

  // Optional: ties order to a community for community-related purchases
  @Prop({ type: Types.ObjectId, ref: 'Community' })
  communityId?: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(TrackableContentType), required: true })
  contentType: TrackableContentType;

  @Prop({ type: String, required: true })
  contentId: string;

  @Prop({ type: Number, required: true })
  amountDT: number;

  @Prop({ type: String, default: 'TND' })
  businessCurrency?: string;

  @Prop({ type: Number })
  providerAmount?: number;

  @Prop({ type: String })
  providerCurrency?: string;

  @Prop({ type: Number })
  providerExchangeRate?: number;

  @Prop({ type: Number, required: true })
  platformPercent: number;

  @Prop({ type: Number, required: true })
  platformFixedDT: number;

  @Prop({ type: Number, required: true })
  platformFeeDT: number;

  @Prop({ type: Number, required: true })
  creatorNetDT: number;

  @Prop({ type: String, uppercase: true, default: null })
  promoCode?: string | null;

  @Prop({ type: Number, default: 0 })
  discountDT?: number;

  @Prop({ type: String })
  paymentId?: string;

  @Prop({ type: String })
  paymentIntentId?: string;

  @Prop({ type: String })
  idempotencyKey?: string;

  @Prop({ type: String })
  paymentMethod?: string; // e.g. 'stripe'

  @Prop({ type: String, default: 'pending' })
  status: 'paid' | 'refunded' | 'pending' | 'cancelled';

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ creatorId: 1, createdAt: -1 });
OrderSchema.index({ buyerId: 1, createdAt: -1 });
OrderSchema.index({ contentType: 1, contentId: 1 });
OrderSchema.index({ paymentId: 1 }, { unique: true, sparse: true });
OrderSchema.index(
  { buyerId: 1, paymentMethod: 1, idempotencyKey: 1 },
  { unique: true, sparse: true },
);
OrderSchema.index({ communityId: 1 });


