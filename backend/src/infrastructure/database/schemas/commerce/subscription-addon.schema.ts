import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BillingInterval } from '@/infrastructure/database/schemas/commerce/subscription.schema';

export type SubscriptionAddonDocument = SubscriptionAddon & Document;

export enum SubscriptionAddonStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
}

export enum SubscriptionAddonType {
  STORAGE_50GB = 'storage_50gb',
  ADMIN_SEAT = 'admin_seat',
}

@Schema({ timestamps: true, collection: 'subscription_addons' })
export class SubscriptionAddon {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  creatorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Subscription', required: true, index: true })
  subscriptionId: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(SubscriptionAddonType), required: true })
  type: SubscriptionAddonType;

  @Prop({ required: true })
  label: string;

  @Prop({ type: Number, default: 1, min: 1 })
  quantity: number;

  @Prop({ type: Number, required: true })
  unitAmount: number;

  @Prop({ default: 'TND' })
  currency: string;

  @Prop({ type: String, enum: Object.values(BillingInterval), default: BillingInterval.MONTH })
  billingInterval: BillingInterval;

  @Prop({ type: String, enum: Object.values(SubscriptionAddonStatus), default: SubscriptionAddonStatus.ACTIVE, index: true })
  status: SubscriptionAddonStatus;

  @Prop({ type: Number, default: 0 })
  storageGBDelta: number;

  @Prop({ type: Number, default: 0 })
  adminsDelta: number;

  @Prop({ type: Date })
  canceledAt?: Date;
}

export const SubscriptionAddonSchema = SchemaFactory.createForClass(SubscriptionAddon);

SubscriptionAddonSchema.index({ creatorId: 1, status: 1 });
SubscriptionAddonSchema.index({ subscriptionId: 1, type: 1, status: 1 });
