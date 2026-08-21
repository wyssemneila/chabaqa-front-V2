import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum ProcessedWebhookEventStatus {
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

@Schema({ timestamps: true, collection: 'processed_webhook_events' })
export class ProcessedWebhookEvent {
  @Prop({ required: true, unique: true })
  eventId: string;

  @Prop({ required: true, index: true })
  provider: string;

  @Prop({ required: true })
  eventType: string;

  @Prop({
    type: String,
    enum: Object.values(ProcessedWebhookEventStatus),
    default: ProcessedWebhookEventStatus.PROCESSING,
    index: true,
  })
  status: ProcessedWebhookEventStatus;

  @Prop({ type: Date })
  claimedAt?: Date;

  @Prop({ type: Date })
  processedAt?: Date;

  @Prop({ type: Date })
  failedAt?: Date;

  @Prop({ type: Number, default: 0 })
  attempts?: number;

  @Prop({ type: Date, index: true })
  nextAttemptAt?: Date;

  @Prop({ type: Date })
  lastAttemptAt?: Date;

  @Prop({ type: Date })
  deadLetteredAt?: Date;

  @Prop({ type: String })
  error?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export type ProcessedWebhookEventDocument = HydratedDocument<ProcessedWebhookEvent>;

export const ProcessedWebhookEventSchema =
  SchemaFactory.createForClass(ProcessedWebhookEvent);

ProcessedWebhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });
ProcessedWebhookEventSchema.index({ status: 1, nextAttemptAt: 1 });
