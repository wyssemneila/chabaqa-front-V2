import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WhatsappWebhookEventDocument = WhatsappWebhookEvent & Document;

@Schema({ timestamps: true })
export class WhatsappWebhookEvent {
  @Prop({ required: true, unique: true, index: true })
  idempotencyKey: string;

  @Prop({ required: true })
  eventType: string;

  @Prop()
  sessionId?: string;

  @Prop()
  messageId?: string;

  @Prop({ type: Object, default: {} })
  payload: Record<string, any>;
}

export const WhatsappWebhookEventSchema = SchemaFactory.createForClass(WhatsappWebhookEvent);
