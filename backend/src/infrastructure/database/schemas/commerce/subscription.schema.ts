import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PlanTier } from '@/infrastructure/database/schemas/commerce/plan.schema';

export type SubscriptionDocument = Subscription & Document;

export enum SubscriptionStatus {
  TRIALING = 'trialing',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
}

export enum BillingInterval {
  MONTH = 'month',
  YEAR = 'year',
}

@Schema({ timestamps: true })
export class Subscription {
  _id: Types.ObjectId;

  // Creator user who owns the subscription
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creatorId: Types.ObjectId;

  // Subscriber/customer paying for creator-community subscriptions.
  // Optional for Chabaqa SaaS creator plans where creatorId is the billing owner.
  @Prop({ type: Types.ObjectId, ref: 'User' })
  subscriberId?: Types.ObjectId;

  // Current plan tier
  @Prop({ type: String, enum: Object.values(PlanTier), required: true })
  plan: PlanTier;

  // Stripe/Provider identifiers
  @Prop()
  provider: string; // e.g., 'stripe'

  @Prop()
  providerCustomerId?: string;

  @Prop()
  providerSubscriptionId?: string;

  // Billing and trial periods
  @Prop({ type: Date })
  trialEndsAt?: Date;

  @Prop({ type: Date, required: true })
  currentPeriodStart: Date;

  @Prop({ type: Date, required: true })
  currentPeriodEnd: Date;

  @Prop({
    type: String,
    enum: Object.values(SubscriptionStatus),
    required: true,
  })
  status: SubscriptionStatus;

  // Cancel at period end
  @Prop({ type: Boolean, default: false })
  cancelAtPeriodEnd: boolean;

  // Soft limits cache (helps fast checks without DB join)
  @Prop({ type: Number, default: 1 })
  communitiesMax: number;

  @Prop({ type: Number, default: 100 })
  membersMax: number;

  @Prop({ type: Number, default: 3 })
  coursesActivationMax: number;

  @Prop({ type: Number, default: 2 })
  storageGB: number;

  @Prop({ type: Number, default: 0 })
  adminsMax: number;

  // Extended limits cache (added for plan enforcement)
  @Prop({ type: Number, default: 0 })
  emailCampaignRecipientsPerMonth: number;

  @Prop({ type: Number, default: 0 })
  whatsappMessagesPerMonth: number;

  @Prop({ type: Number, default: 30 })
  analyticsLookbackDays: number;

  @Prop({ type: Number, default: 0 })
  sessionBookingsPerMonth: number;

  @Prop({ type: Number, default: 1 })
  aiAgentsMax: number;

  @Prop({ type: Number, default: 10 })
  aiCofounderRunsPerMonth: number;

  @Prop({ type: Number, default: 2 })
  aiKnowledgeReindexPerMonth: number;

  @Prop({ type: Number, default: 100 })
  aiStaffChatTurnsPerMonth: number;

  // Optional masked info for display
  @Prop()
  paymentBrand?: string; // e.g., VISA

  @Prop()
  paymentLast4?: string;

  // Billing amount and currency for this subscription (per period)
  @Prop({ type: Number, default: 0 })
  amount: number;

  @Prop({ type: String, default: 'TND' })
  currency: string;

  @Prop({ type: String, enum: Object.values(BillingInterval), default: BillingInterval.MONTH })
  billingInterval: BillingInterval;

  @Prop({ type: String })
  providerCheckoutSessionId?: string;

  @Prop({ type: String })
  providerPriceId?: string;

  // Next billing date if applicable
  @Prop({ type: Date })
  nextBillingAt?: Date;

  // Billing method presence (card/mandate set up with provider)
  @Prop({ type: Boolean, default: false })
  hasPaymentMethod: boolean;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

SubscriptionSchema.index({ creatorId: 1 });
SubscriptionSchema.index({ subscriberId: 1 });
