import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BillingInvoiceDocument = BillingInvoice & Document;

export enum BillingInvoiceOwnerType {
  PLATFORM_SUBSCRIPTION = 'platform_subscription',
  COMMUNITY_MEMBER_SUBSCRIPTION = 'community_member_subscription',
  ADDON = 'addon',
}

export enum BillingInvoiceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAID = 'paid',
  VOID = 'void',
  UNCOLLECTIBLE = 'uncollectible',
}

@Schema({ _id: false })
export class BillingInvoiceLineItem {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ default: 'TND' })
  currency: string;

  @Prop({ type: Number, default: 1 })
  quantity: number;
}

export const BillingInvoiceLineItemSchema = SchemaFactory.createForClass(BillingInvoiceLineItem);

@Schema({ timestamps: true, collection: 'billing_invoices' })
export class BillingInvoice {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  creatorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  customerId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Subscription', index: true })
  subscriptionId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  orderId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Community', index: true })
  communityId?: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(BillingInvoiceOwnerType), default: BillingInvoiceOwnerType.PLATFORM_SUBSCRIPTION, index: true })
  ownerType: BillingInvoiceOwnerType;

  @Prop({ type: String, index: true })
  provider?: string;

  @Prop({ type: String, index: true })
  providerInvoiceId?: string;

  @Prop()
  providerSubscriptionId?: string;

  @Prop({ type: String, enum: Object.values(BillingInvoiceStatus), default: BillingInvoiceStatus.PAID, index: true })
  status: BillingInvoiceStatus;

  @Prop({ required: true })
  invoiceNumber: string;

  @Prop({ type: Number, required: true })
  total: number;

  @Prop({ type: Number, required: true })
  subtotal: number;

  @Prop({ type: Number, default: 0 })
  tax?: number;

  @Prop({ default: 'TND' })
  currency: string;

  @Prop({ type: Date, required: true, index: true })
  invoiceDate: Date;

  @Prop({ type: Date })
  dueDate?: Date;

  @Prop({ type: Date })
  paidAt?: Date;

  @Prop({ type: [BillingInvoiceLineItemSchema], default: [] })
  lineItems: BillingInvoiceLineItem[];

  @Prop()
  invoicePdfUrl?: string;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;
}

export const BillingInvoiceSchema = SchemaFactory.createForClass(BillingInvoice);

BillingInvoiceSchema.index({ creatorId: 1, invoiceDate: -1 });
BillingInvoiceSchema.index({ provider: 1, providerInvoiceId: 1 }, { unique: true, sparse: true });
BillingInvoiceSchema.index({ orderId: 1 }, { unique: true, sparse: true });
