import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CreatorIntegrationDocument = HydratedDocument<CreatorIntegration>;

export enum CreatorIntegrationProvider {
  GOOGLE_CALENDAR = 'google_calendar',
  ZAPIER = 'zapier',
  MAKE = 'make',
  WEBHOOK = 'webhook',
  GOOGLE_SHEETS = 'google_sheets',
  KIT = 'kit',
  BREVO = 'brevo',
  ZOOM = 'zoom',
  DISCORD = 'discord',
}

@Schema({ timestamps: true, collection: 'creator_integrations' })
export class CreatorIntegration {
  @Prop({ type: Types.ObjectId, required: true, index: true }) creatorId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, index: true }) communityId?: Types.ObjectId;
  @Prop({ required: true, enum: Object.values(CreatorIntegrationProvider), index: true }) provider: CreatorIntegrationProvider;
  @Prop({ default: 'setup_required' }) status: 'setup_required' | 'connected' | 'needs_attention' | 'disconnected';
  @Prop({ type: Object, default: {} }) config: Record<string, unknown>;
  // Credentials are deliberately kept out of config. Mongoose excludes this
  // field by default so connection/list responses can never expose a token.
  @Prop({ type: Object, select: false }) encryptedCredentials?: Record<string, unknown>;
  @Prop({ type: Date }) credentialExpiresAt?: Date;
  @Prop({ type: String, maxlength: 256 }) externalAccountId?: string;
  @Prop({ type: [String], default: [] }) grantedScopes?: string[];
  @Prop({ type: Date }) lastSyncedAt?: Date;
  @Prop({ type: Date }) lastTestedAt?: Date;
  @Prop({ type: String }) lastError?: string;
}
export const CreatorIntegrationSchema = SchemaFactory.createForClass(CreatorIntegration);
CreatorIntegrationSchema.index({ creatorId: 1, communityId: 1, provider: 1 }, { unique: true, sparse: true });

/**
 * One-time OAuth state records.  The browser only receives the random state;
 * the database stores its SHA-256 digest and an encrypted PKCE verifier.
 */
export type CreatorIntegrationOAuthStateDocument = HydratedDocument<CreatorIntegrationOAuthState>;
@Schema({ timestamps: true, collection: 'creator_integration_oauth_states' })
export class CreatorIntegrationOAuthState {
  @Prop({ type: Types.ObjectId, required: true, index: true }) creatorId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, index: true }) communityId?: Types.ObjectId;
  @Prop({ required: true, enum: [CreatorIntegrationProvider.GOOGLE_SHEETS, CreatorIntegrationProvider.ZOOM, CreatorIntegrationProvider.DISCORD] }) provider: CreatorIntegrationProvider;
  @Prop({ required: true, unique: true, index: true, select: false }) stateHash: string;
  @Prop({ type: Object, required: true, select: false }) encryptedVerifier: Record<string, unknown>;
  @Prop({ type: Object, default: {} }) config: Record<string, unknown>;
  @Prop({ type: Date, required: true }) expiresAt: Date;
}
export const CreatorIntegrationOAuthStateSchema = SchemaFactory.createForClass(CreatorIntegrationOAuthState);
CreatorIntegrationOAuthStateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Explicit member consent for a creator's marketing connector.  We never use
 * a creator's account-level acknowledgement as a substitute for this record.
 */
export type CreatorIntegrationContactConsentDocument = HydratedDocument<CreatorIntegrationContactConsent>;
@Schema({ timestamps: true, collection: 'creator_integration_contact_consents' })
export class CreatorIntegrationContactConsent {
  @Prop({ type: Types.ObjectId, required: true, index: true }) userId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, required: true, index: true }) creatorId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, required: true, index: true }) communityId: Types.ObjectId;
  @Prop({ required: true, enum: [CreatorIntegrationProvider.KIT, CreatorIntegrationProvider.BREVO], index: true }) provider: CreatorIntegrationProvider;
  @Prop({ required: true, maxlength: 100 }) policyVersion: string;
  @Prop({ type: Date, required: true, default: Date.now }) consentedAt: Date;
  @Prop({ type: Date }) revokedAt?: Date;
}
export const CreatorIntegrationContactConsentSchema = SchemaFactory.createForClass(CreatorIntegrationContactConsent);
CreatorIntegrationContactConsentSchema.index({ userId: 1, communityId: 1, provider: 1 }, { unique: true });

/** Durable, idempotent provider outbox.  Third-party calls never run inside a
 * community/payment/session write transaction. */
export type CreatorIntegrationDeliveryDocument = HydratedDocument<CreatorIntegrationDelivery>;
@Schema({ timestamps: true, collection: 'creator_integration_deliveries' })
export class CreatorIntegrationDelivery {
  @Prop({ type: Types.ObjectId, required: true, index: true }) integrationId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, required: true, index: true }) creatorId: Types.ObjectId;
  @Prop({ required: true, enum: [CreatorIntegrationProvider.GOOGLE_SHEETS, CreatorIntegrationProvider.KIT, CreatorIntegrationProvider.BREVO, CreatorIntegrationProvider.DISCORD] }) provider: CreatorIntegrationProvider;
  @Prop({ required: true, index: true }) event: string;
  @Prop({ required: true, unique: true, index: true }) idempotencyKey: string;
  @Prop({ type: Object, required: true }) payload: Record<string, unknown>;
  @Prop({ default: 'queued', index: true }) status: 'queued' | 'delivered' | 'failed' | 'skipped';
  @Prop({ default: 0 }) attempts: number;
  @Prop({ type: Number }) responseStatus?: number;
  @Prop({ type: String }) error?: string;
  @Prop({ type: Date }) nextAttemptAt?: Date;
  @Prop({ type: Date }) deliveredAt?: Date;
}
export const CreatorIntegrationDeliverySchema = SchemaFactory.createForClass(CreatorIntegrationDelivery);
CreatorIntegrationDeliverySchema.index({ status: 1, nextAttemptAt: 1 });

export type CreatorWebhookDocument = HydratedDocument<CreatorWebhook>;
@Schema({ timestamps: true, collection: 'creator_webhooks' })
export class CreatorWebhook {
  @Prop({ type: Types.ObjectId, required: true, index: true }) creatorId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, index: true }) communityId?: Types.ObjectId;
  @Prop({ required: true, trim: true, maxlength: 100 }) name: string;
  @Prop({ required: true, trim: true, maxlength: 2048 }) url: string;
  @Prop({ required: true, select: false }) secret: string;
  @Prop({ type: [String], default: [] }) events: string[];
  @Prop({ default: true }) active: boolean;
  @Prop({ type: Date }) lastDeliveredAt?: Date;
  @Prop({ type: String }) lastError?: string;
}
export const CreatorWebhookSchema = SchemaFactory.createForClass(CreatorWebhook);
CreatorWebhookSchema.index({ creatorId: 1, active: 1 });

export type CreatorWebhookDeliveryDocument = HydratedDocument<CreatorWebhookDelivery>;
@Schema({ timestamps: true, collection: 'creator_webhook_deliveries' })
export class CreatorWebhookDelivery {
  @Prop({ type: Types.ObjectId, required: true, index: true }) webhookId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, required: true, index: true }) creatorId: Types.ObjectId;
  @Prop({ required: true, index: true }) event: string;
  @Prop({ required: true, unique: true }) eventId: string;
  @Prop({ type: Object, required: true }) payload: Record<string, unknown>;
  @Prop({ default: 'queued', index: true }) status: 'queued' | 'delivered' | 'failed';
  @Prop({ default: 0 }) attempts: number;
  @Prop({ type: Number }) responseStatus?: number;
  @Prop({ type: String }) error?: string;
  @Prop({ type: Date }) nextAttemptAt?: Date;
  @Prop({ type: Date }) deliveredAt?: Date;
}
export const CreatorWebhookDeliverySchema = SchemaFactory.createForClass(CreatorWebhookDelivery);
CreatorWebhookDeliverySchema.index({ status: 1, nextAttemptAt: 1 });

export type CreatorApiKeyDocument = HydratedDocument<CreatorApiKey>;
@Schema({ timestamps: true, collection: 'creator_api_keys' })
export class CreatorApiKey {
  @Prop({ type: Types.ObjectId, required: true, index: true }) creatorId: Types.ObjectId;
  @Prop({ required: true, trim: true }) name: string;
  @Prop({ required: true, unique: true, index: true }) prefix: string;
  @Prop({ required: true, select: false }) keyHash: string;
  @Prop({ type: [String], default: ['read'] }) scopes: string[];
  @Prop({ type: Date }) lastUsedAt?: Date;
  @Prop({ type: Date }) revokedAt?: Date;
}
export const CreatorApiKeySchema = SchemaFactory.createForClass(CreatorApiKey);
