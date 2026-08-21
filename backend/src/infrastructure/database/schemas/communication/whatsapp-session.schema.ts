import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WhatsappSessionDocument = WhatsappSession & Document;

export enum WhatsappSessionStatus {
  NOT_CREATED = 'not_created',
  STARTING = 'starting',
  QR_PENDING = 'qr_pending',
  PAIRING_PENDING = 'pairing_pending',
  READY = 'ready',
  DISCONNECTED = 'disconnected',
  FAILED = 'failed',
  REVOKED = 'revoked',
}

@Schema({ timestamps: true })
export class WhatsappSession {
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Community' })
  communityId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  creatorId: Types.ObjectId;

  @Prop({ trim: true })
  openwaSessionId?: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  pushName?: string;

  @Prop({
    type: String,
    enum: Object.values(WhatsappSessionStatus),
    default: WhatsappSessionStatus.NOT_CREATED,
    index: true,
  })
  status: WhatsappSessionStatus;

  @Prop()
  qrCodeData?: string;

  @Prop()
  pairingCode?: string;

  @Prop()
  lastSyncedAt?: Date;

  @Prop()
  connectedAt?: Date;

  @Prop()
  lastWebhookRegisteredAt?: Date;

  @Prop()
  lastHealthCheckAt?: Date;

  @Prop()
  lastError?: string;
}

export const WhatsappSessionSchema =
  SchemaFactory.createForClass(WhatsappSession);

WhatsappSessionSchema.index({ communityId: 1 }, { unique: true });
WhatsappSessionSchema.index({ creatorId: 1 });
WhatsappSessionSchema.index({ openwaSessionId: 1 }, { sparse: true });
