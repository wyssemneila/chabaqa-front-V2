import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BillingInterval } from '@/infrastructure/database/schemas/commerce/subscription.schema';

export type CommunityMemberSubscriptionDocument = CommunityMemberSubscription & Document;

export enum CommunityMemberSubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
}

@Schema({ timestamps: true, collection: 'community_member_subscriptions' })
export class CommunityMemberSubscription {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Community', required: true, index: true })
  communityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  creatorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  subscriberId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', index: true })
  sourceOrderId?: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(CommunityMemberSubscriptionStatus), default: CommunityMemberSubscriptionStatus.ACTIVE, index: true })
  status: CommunityMemberSubscriptionStatus;

  @Prop({ type: String, enum: Object.values(BillingInterval), default: BillingInterval.MONTH })
  billingInterval: BillingInterval;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ default: 'TND' })
  currency: string;

  @Prop({ type: String, index: true })
  provider?: string;

  @Prop()
  providerCustomerId?: string;

  @Prop({ type: String })
  providerSubscriptionId?: string;

  @Prop()
  providerCheckoutSessionId?: string;

  @Prop({ type: Date, required: true })
  currentPeriodStart: Date;

  @Prop({ type: Date, required: true })
  currentPeriodEnd: Date;

  @Prop({ type: Date })
  nextBillingAt?: Date;

  @Prop({ type: Boolean, default: false })
  cancelAtPeriodEnd: boolean;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;
}

export const CommunityMemberSubscriptionSchema = SchemaFactory.createForClass(CommunityMemberSubscription);

CommunityMemberSubscriptionSchema.index({ communityId: 1, subscriberId: 1, status: 1 });
CommunityMemberSubscriptionSchema.index({ creatorId: 1, status: 1 });
CommunityMemberSubscriptionSchema.index({ providerSubscriptionId: 1 }, { sparse: true });
