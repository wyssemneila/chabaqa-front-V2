import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AiAgentDocument = AiAgent & Document;

export enum AiAgentType {
  CONCIERGE = 'concierge',
  TUTOR = 'tutor',
  CHALLENGE_COACH = 'challenge_coach',
  SUPPORT = 'support',
  SALES = 'sales',
}

export enum AiAgentTone {
  FRIENDLY = 'friendly',
  PROFESSIONAL = 'professional',
  DIRECT = 'direct',
  COACH = 'coach',
}

export enum AiAgentSurface {
  COMMUNITY = 'community',
  COURSE = 'course',
  CHALLENGE = 'challenge',
  CHECKOUT = 'checkout',
  SUPPORT = 'support',
}

@Schema({ _id: false })
export class AiAgentEscalation {
  @Prop({ type: Boolean, default: true })
  enabled: boolean;

  @Prop({
    type: String,
    enum: ['support_queue', 'creator_dm', 'staff_role'],
    default: 'support_queue',
  })
  target: 'support_queue' | 'creator_dm' | 'staff_role';

  @Prop({ type: String, enum: ['admin', 'support'] })
  staffRole?: 'admin' | 'support';
}

export const AiAgentEscalationSchema =
  SchemaFactory.createForClass(AiAgentEscalation);

@Schema({ _id: false })
export class AiAgentModelSettings {
  @Prop({ type: Number, min: 0, max: 2, default: 0.35 })
  temperature?: number;

  @Prop({ type: Number, min: 256, max: 4000, default: 1200 })
  maxTokens?: number;
}

export const AiAgentModelSettingsSchema =
  SchemaFactory.createForClass(AiAgentModelSettings);

@Schema({ _id: false })
export class AiAgentStats {
  @Prop({ type: Number, default: 0 })
  conversations: number;

  @Prop({ type: Number, default: 0 })
  escalations: number;

  @Prop({ type: Date })
  lastActiveAt?: Date;
}

export const AiAgentStatsSchema = SchemaFactory.createForClass(AiAgentStats);

@Schema({ timestamps: true })
export class AiAgent {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Community', required: true, index: true })
  communityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  creatorId: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(AiAgentType), required: true })
  type: AiAgentType;

  @Prop({ type: String, required: true, trim: true, maxlength: 80 })
  name: string;

  @Prop({ type: String, trim: true })
  avatarUrl?: string;

  @Prop({ type: String, trim: true, maxlength: 240 })
  bio?: string;

  @Prop({
    type: String,
    enum: Object.values(AiAgentTone),
    default: AiAgentTone.FRIENDLY,
  })
  tone: AiAgentTone;

  @Prop({ type: [String], default: ['en'] })
  languages: string[];

  @Prop({ type: String, maxlength: 2000 })
  systemPromptOverride?: string;

  @Prop({ type: [Types.ObjectId], ref: 'AiKnowledgeDocument', default: [] })
  knowledgeSourceIds: Types.ObjectId[];

  @Prop({
    type: [String],
    enum: Object.values(AiAgentSurface),
    default: [AiAgentSurface.COMMUNITY],
  })
  enabledSurfaces: AiAgentSurface[];

  @Prop({ type: AiAgentEscalationSchema, default: {} })
  escalation: AiAgentEscalation;

  @Prop({ type: AiAgentModelSettingsSchema, default: {} })
  modelSettings?: AiAgentModelSettings;

  @Prop({
    type: String,
    enum: ['active', 'paused'],
    default: 'active',
    index: true,
  })
  status: 'active' | 'paused';

  @Prop({ type: AiAgentStatsSchema, default: {} })
  stats: AiAgentStats;
}

export const AiAgentSchema = SchemaFactory.createForClass(AiAgent);

AiAgentSchema.index({ communityId: 1, type: 1 });
AiAgentSchema.index({ communityId: 1, status: 1 });
