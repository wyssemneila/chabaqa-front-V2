import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createHash, createHmac, randomBytes, randomUUID } from 'crypto';
import { lookup } from 'dns/promises';
import { isIP } from 'net';
import { Model, Types } from 'mongoose';
import {
  CreatorApiKey,
  CreatorApiKeyDocument,
  CreatorIntegration,
  CreatorIntegrationContactConsent,
  CreatorIntegrationContactConsentDocument,
  CreatorIntegrationDelivery,
  CreatorIntegrationDeliveryDocument,
  CreatorIntegrationDocument,
  CreatorIntegrationOAuthState,
  CreatorIntegrationOAuthStateDocument,
  CreatorIntegrationProvider,
  CreatorWebhook,
  CreatorWebhookDelivery,
  CreatorWebhookDeliveryDocument,
  CreatorWebhookDocument,
} from '@/infrastructure/database/schemas/communication/creator-integration.schema';
import { Community, CommunityDocument } from '@/infrastructure/database/schemas/community/community.schema';
import { User, UserDocument } from '@/infrastructure/database/schemas/auth/user.schema';
import { PolicyService } from '@/shared/services/policy.service';
import {
  decryptIntegrationCredentials,
  encryptIntegrationCredentials,
} from './integration-credential-encryption.util';

// Every event below has a durable production write-path emitter. Keep this
// contract truthful: a generic form event is intentionally absent until the
// product has a real form/submission model and a defined privacy contract.
const EVENTS = [
  'member.joined',
  'member.left',
  'purchase.paid',
  'purchase.refunded',
  'subscription.started',
  'subscription.canceled',
  'course.enrolled',
  'course.completed',
  'challenge.joined',
  'challenge.completed',
  'challenge.submitted',
  'session.booked',
  'session.canceled',
  'event.registered',
  'post.created',
] as const;
const PROVIDERS = Object.values(CreatorIntegrationProvider);
const API_KEY_SCOPES = ['read'];
const OAUTH_PROVIDERS = [
  CreatorIntegrationProvider.GOOGLE_SHEETS,
  CreatorIntegrationProvider.ZOOM,
  CreatorIntegrationProvider.DISCORD,
] as const;
const CREDENTIAL_PROVIDERS = [
  CreatorIntegrationProvider.KIT,
  CreatorIntegrationProvider.BREVO,
] as const;
const PROVIDER_OUTBOX_PROVIDERS = [
  CreatorIntegrationProvider.GOOGLE_SHEETS,
  CreatorIntegrationProvider.KIT,
  CreatorIntegrationProvider.BREVO,
  CreatorIntegrationProvider.DISCORD,
] as const;

type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];
type CredentialProvider = (typeof CREDENTIAL_PROVIDERS)[number];
type ProviderOutboxProvider = (typeof PROVIDER_OUTBOX_PROVIDERS)[number];
type IntegrationCredentials = {
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  tokenType?: string;
  expiresAt?: number;
  scopes?: string[];
};

interface OAuthSpec {
  provider: OAuthProvider;
  authorizationUrl: string;
  tokenUrl: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string[];
  tokenAuth: 'body' | 'basic';
  usePkce: boolean;
  accountUrl: string;
}

@Injectable()
export class CreatorIntegrationsService {
  private readonly logger = new Logger(CreatorIntegrationsService.name);
  private oauthCallbackFailures = 0;
  private credentialEncryptionFailures = 0;

  constructor(
    @InjectModel(CreatorIntegration.name)
    private readonly integrationModel: Model<CreatorIntegrationDocument>,
    @InjectModel(CreatorWebhook.name)
    private readonly webhookModel: Model<CreatorWebhookDocument>,
    @InjectModel(CreatorWebhookDelivery.name)
    private readonly deliveryModel: Model<CreatorWebhookDeliveryDocument>,
    @InjectModel(CreatorApiKey.name)
    private readonly apiKeyModel: Model<CreatorApiKeyDocument>,
    @InjectModel(Community.name)
    private readonly communityModel: Model<CommunityDocument>,
    @InjectModel(CreatorIntegrationOAuthState.name)
    private readonly oauthStateModel: Model<CreatorIntegrationOAuthStateDocument>,
    @InjectModel(CreatorIntegrationContactConsent.name)
    private readonly contactConsentModel: Model<CreatorIntegrationContactConsentDocument>,
    @InjectModel(CreatorIntegrationDelivery.name)
    private readonly providerDeliveryModel: Model<CreatorIntegrationDeliveryDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly policyService: PolicyService,
  ) {}

  private id(value: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) throw new BadRequestException('Invalid identifier');
    return new Types.ObjectId(value);
  }

  private provider(value: string): CreatorIntegrationProvider {
    if (!PROVIDERS.includes(value as CreatorIntegrationProvider)) {
      throw new BadRequestException('Unsupported integration provider');
    }
    return value as CreatorIntegrationProvider;
  }

  private oauthProvider(value: string): OAuthProvider {
    const provider = this.provider(value) as OAuthProvider;
    if (!OAUTH_PROVIDERS.includes(provider)) {
      throw new BadRequestException('This provider does not use OAuth connection flow');
    }
    return provider;
  }

  private credentialProvider(value: string): CredentialProvider {
    const provider = this.provider(value) as CredentialProvider;
    if (!CREDENTIAL_PROVIDERS.includes(provider)) {
      throw new BadRequestException('This provider does not accept a creator API credential');
    }
    return provider;
  }

  private isPrivateAddress(address: string): boolean {
    const ip = address.toLowerCase();
    if (ip.startsWith('::ffff:')) return this.isPrivateAddress(ip.slice(7));
    if (
      ip === '::1' ||
      ip === '::' ||
      ip.startsWith('fc') ||
      ip.startsWith('fd') ||
      ip.startsWith('fe80:')
    ) return true;
    const parts = ip.split('.').map(Number);
    return parts.length === 4 && (
      parts[0] === 10 ||
      parts[0] === 127 ||
      parts[0] === 0 ||
      (parts[0] === 169 && parts[1] === 254) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168)
    );
  }

  private async assertSafeWebhookUrl(value: unknown): Promise<string> {
    let url: URL;
    try {
      url = new URL(String(value || ''));
    } catch {
      throw new BadRequestException('Webhook URL must be a valid HTTPS URL');
    }
    if (url.protocol !== 'https:' || url.username || url.password) {
      throw new BadRequestException('Webhook URL must use HTTPS without embedded credentials');
    }
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.localhost')) {
      throw new BadRequestException('Webhook URL cannot target localhost or private networks');
    }
    try {
      const addresses = isIP(host)
        ? [{ address: host }]
        : await lookup(host, { all: true, verbatim: true });
      if (!addresses.length || addresses.some(({ address }) => this.isPrivateAddress(address))) {
        throw new BadRequestException('Webhook URL cannot target private networks');
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Webhook hostname could not be resolved');
    }
    return url.toString();
  }

  private cleanString(value: unknown, max = 256): string | undefined {
    if (typeof value !== 'string') return undefined;
    const clean = value.trim();
    if (!clean) return undefined;
    if (clean.length > max || /[\u0000-\u001f]/.test(clean)) {
      throw new BadRequestException('Invalid integration configuration value');
    }
    return clean;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  private selectedEvents(value: unknown, fallback = [...EVENTS]): string[] {
    if (value === undefined) return fallback;
    if (!Array.isArray(value)) throw new BadRequestException('Events must be an array');
    const selected = Array.from(new Set(value.map(String).filter((event) => EVENTS.includes(event as (typeof EVENTS)[number]))));
    if (!selected.length) throw new BadRequestException('Select at least one supported event');
    return selected;
  }

  private identifier(value: unknown, name: string, required = false): string | undefined {
    const clean = this.cleanString(value, 128);
    if (!clean && required) throw new BadRequestException(`${name} is required`);
    if (clean && !/^[A-Za-z0-9_-]+$/.test(clean)) throw new BadRequestException(`Invalid ${name}`);
    return clean;
  }

  private numericIds(value: unknown, name: string): string[] {
    if (value === undefined) return [];
    if (!Array.isArray(value)) throw new BadRequestException(`${name} must be an array`);
    const ids = Array.from(new Set(value.map((item) => String(item).trim()).filter(Boolean)));
    if (ids.length > 30 || ids.some((id) => !/^\d+$/.test(id))) {
      throw new BadRequestException(`Invalid ${name}`);
    }
    return ids;
  }

  private sanitizeProviderConfig(provider: CreatorIntegrationProvider, raw: unknown): Record<string, unknown> {
    const input = this.isRecord(raw) ? raw : {};
    switch (provider) {
      case CreatorIntegrationProvider.GOOGLE_SHEETS: {
        const spreadsheetId = this.identifier(input.spreadsheetId, 'spreadsheet ID');
        return {
          spreadsheetId,
          sheetName: this.cleanString(input.sheetName, 100) || 'Chabaqa events',
          events: this.selectedEvents(input.events),
        };
      }
      case CreatorIntegrationProvider.KIT: {
        const contactSyncEnabled = input.contactSyncEnabled === true;
        const policyVersion = this.cleanString(input.policyVersion, 100);
        const tagIds = this.numericIds(input.tagIds, 'Kit tag IDs');
        const formId = this.identifier(input.formId, 'Kit form ID');
        if (contactSyncEnabled) {
          if (input.dataProcessingAgreement !== true || !policyVersion) {
            throw new BadRequestException('Enable contact sync only after recording a policy version and data-processing acknowledgement');
          }
          if (!tagIds.length && !formId) {
            throw new BadRequestException('Choose at least one Kit tag or form before enabling contact sync');
          }
        }
        return { contactSyncEnabled, policyVersion, tagIds, formId, events: this.selectedEvents(input.events) };
      }
      case CreatorIntegrationProvider.BREVO: {
        const contactSyncEnabled = input.contactSyncEnabled === true;
        const policyVersion = this.cleanString(input.policyVersion, 100);
        const listIds = this.numericIds(input.listIds, 'Brevo list IDs');
        if (contactSyncEnabled) {
          if (input.dataProcessingAgreement !== true || !policyVersion) {
            throw new BadRequestException('Enable contact sync only after recording a policy version and data-processing acknowledgement');
          }
          if (!listIds.length) throw new BadRequestException('Choose at least one Brevo list before enabling contact sync');
        }
        return { contactSyncEnabled, policyVersion, listIds, events: this.selectedEvents(input.events) };
      }
      case CreatorIntegrationProvider.ZOOM:
        if (input.autoCreateMeetings === true || input.attendanceSync === true) {
          throw new BadRequestException('Zoom meeting creation and attendance sync are not enabled in the current integration release');
        }
        return { events: this.selectedEvents(input.events) };
      case CreatorIntegrationProvider.DISCORD:
        if (input.roleSyncEnabled === true) {
          throw new BadRequestException('Discord role sync is not enabled until member identity linking and role hierarchy checks are available');
        }
        return {
          guildId: this.identifier(input.guildId, 'Discord guild ID'),
          channelId: this.identifier(input.channelId, 'Discord channel ID'),
          announcePosts: input.announcePosts === true,
          events: this.selectedEvents(input.events),
        };
      default:
        return {};
    }
  }

  private redact(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.redact(item));
    if (!this.isRecord(value)) return value;
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !/(secret|token|password|api.?key|authorization|credential)/i.test(key))
      .map(([key, item]) => [key, this.redact(item)]));
  }

  private publicIntegration(doc: any): any {
    const item = doc?.toObject ? doc.toObject() : { ...(doc || {}) };
    delete item.encryptedCredentials;
    return {
      ...item,
      id: item?._id ? String(item._id) : item?.id,
      config: this.redact(item?.config || {}),
    };
  }

  private publicWebhook(doc: any): any {
    const item = doc.toObject ? doc.toObject() : { ...doc };
    delete item.secret;
    return { ...item, id: String(item._id) };
  }

  private publicKey(doc: any): any {
    const item = doc.toObject ? doc.toObject() : { ...doc };
    delete item.keyHash;
    return { ...item, id: String(item._id) };
  }

  private callbackBaseUrl(): string {
    const configured = String(process.env.INTEGRATIONS_OAUTH_CALLBACK_BASE_URL || '').trim();
    if (configured) return configured.replace(/\/+$/, '');
    const frontend = String(process.env.FRONTEND_URL || 'https://chabaqa.io').trim().replace(/\/+$/, '');
    return `${frontend}/api/creator/integrations/oauth`;
  }

  private frontendOrigin(): string {
    try {
      return new URL(String(process.env.FRONTEND_URL || 'https://chabaqa.io')).origin;
    } catch {
      return 'https://chabaqa.io';
    }
  }

  private oauthSpec(provider: OAuthProvider): OAuthSpec {
    const callback = (name: string) => String(process.env[name] || `${this.callbackBaseUrl()}/${provider}/callback`).trim();
    if (provider === CreatorIntegrationProvider.GOOGLE_SHEETS) {
      return {
        provider,
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        clientId: process.env.GOOGLE_SHEETS_CLIENT_ID,
        clientSecret: process.env.GOOGLE_SHEETS_CLIENT_SECRET,
        redirectUri: callback('GOOGLE_SHEETS_REDIRECT_URI'),
        scopes: ['openid', 'email', 'https://www.googleapis.com/auth/spreadsheets'],
        tokenAuth: 'body',
        usePkce: true,
        accountUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
      };
    }
    if (provider === CreatorIntegrationProvider.ZOOM) {
      return {
        provider,
        authorizationUrl: 'https://zoom.us/oauth/authorize',
        tokenUrl: 'https://zoom.us/oauth/token',
        clientId: process.env.ZOOM_CLIENT_ID,
        clientSecret: process.env.ZOOM_CLIENT_SECRET,
        redirectUri: callback('ZOOM_REDIRECT_URI'),
        scopes: ['user:read:user', 'meeting:read:meeting', 'meeting:write:meeting'],
        tokenAuth: 'basic',
        usePkce: false,
        accountUrl: 'https://api.zoom.us/v2/users/me',
      };
    }
    return {
      provider,
      authorizationUrl: 'https://discord.com/api/oauth2/authorize',
      tokenUrl: 'https://discord.com/api/oauth2/token',
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      redirectUri: callback('DISCORD_REDIRECT_URI'),
      scopes: ['identify', 'guilds'],
      tokenAuth: 'body',
      usePkce: true,
      accountUrl: 'https://discord.com/api/v10/users/@me',
    };
  }

  private assertOAuthServerConfigured(spec: OAuthSpec): void {
    if (!spec.clientId || !spec.clientSecret || !spec.redirectUri.startsWith('https://')) {
      throw new ServiceUnavailableException('This connector needs its approved OAuth client, secret, and HTTPS redirect URI configured by the platform owner');
    }
  }

  private encryptCredentials(value: IntegrationCredentials | { verifier: string }): Record<string, unknown> {
    try {
      return encryptIntegrationCredentials(value) as unknown as Record<string, unknown>;
    } catch (error) {
      this.credentialEncryptionFailures += 1;
      this.logger.error('Integration credential encryption is unavailable');
      throw new ServiceUnavailableException('Secure integration credential storage is not configured');
    }
  }

  private decryptCredentials(value: unknown): IntegrationCredentials | null {
    try {
      return decryptIntegrationCredentials<IntegrationCredentials>(value);
    } catch {
      this.credentialEncryptionFailures += 1;
      this.logger.error('Stored integration credential could not be decrypted');
      return null;
    }
  }

  private async assertAutomationAllowed(creatorId: string): Promise<void> {
    const remaining = await this.policyService.getRemainingQuota(creatorId, 'automation', 0);
    if (remaining <= 0) {
      throw new ForbiddenException('Your current plan does not include creator automations. Upgrade your plan to connect integrations.');
    }
  }

  private async assertOwnedCommunity(creatorId: string, communityId?: string): Promise<Types.ObjectId | undefined> {
    if (!communityId) return undefined;
    const communityObjectId = this.id(communityId);
    const exists = await this.communityModel.exists({ _id: communityObjectId, createur: this.id(creatorId) });
    if (!exists) throw new NotFoundException('Community not found');
    return communityObjectId;
  }

  private integrationFilter(creatorId: string, provider: CreatorIntegrationProvider, communityId?: Types.ObjectId): any {
    return { creatorId: this.id(creatorId), provider, ...(communityId ? { communityId } : { communityId: { $exists: false } }) };
  }

  catalog(): Array<Record<string, unknown>> {
    return PROVIDERS.map((provider) => {
      const core = [
        CreatorIntegrationProvider.GOOGLE_CALENDAR,
        CreatorIntegrationProvider.ZAPIER,
        CreatorIntegrationProvider.MAKE,
        CreatorIntegrationProvider.WEBHOOK,
      ].includes(provider);
      return {
        provider,
        status: core ? 'available' : 'setup_required',
        capabilities: this.capabilities(provider),
        setup: core ? undefined : this.setupRequirements(provider),
      };
    });
  }

  private capabilities(provider: string): string[] {
    const map: Record<string, string[]> = {
      google_calendar: ['two_way_session_calendar_sync'],
      zapier: ['outbound_events', 'member_actions'],
      make: ['outbound_events', 'member_actions'],
      webhook: ['signed_events', 'delivery_history'],
      google_sheets: ['event_rows', 'spreadsheet_append'],
      kit: ['consented_contact_sync', 'tag_automations'],
      brevo: ['consented_contact_sync', 'list_sync'],
      zoom: ['creator_oauth', 'meeting_readiness'],
      discord: ['creator_oauth', 'bot_announcements', 'role_mapping_readiness'],
    };
    return map[provider] || [];
  }

  private setupRequirements(provider: CreatorIntegrationProvider): Record<string, unknown> {
    const requirements: Record<string, Record<string, unknown>> = {
      [CreatorIntegrationProvider.GOOGLE_SHEETS]: {
        type: 'oauth_pkce',
        requires: ['approved Google OAuth client and redirect URI', 'Google Sheets API enabled', 'target spreadsheet ID'],
      },
      [CreatorIntegrationProvider.KIT]: {
        type: 'api_key',
        requires: ['Kit API key', 'tag or form mapping for contact sync', 'member-level marketing consent and policy version'],
      },
      [CreatorIntegrationProvider.BREVO]: {
        type: 'api_key',
        requires: ['Brevo API key', 'list mapping for contact sync', 'member-level marketing consent and policy version'],
      },
      [CreatorIntegrationProvider.ZOOM]: {
        type: 'oauth',
        requires: ['Zoom Marketplace OAuth app', 'approved redirect URI and requested scopes', 'explicit meeting and attendance behavior'],
      },
      [CreatorIntegrationProvider.DISCORD]: {
        type: 'oauth_plus_bot',
        requires: ['Discord OAuth app', 'server-held bot token and guild installation', 'selected guild/channel/role mapping'],
      },
    };
    return requirements[provider] || {};
  }

  async list(creatorId: string): Promise<any[]> {
    const connected = await this.integrationModel.find({ creatorId: this.id(creatorId) }).lean();
    const byProvider = new Map(connected.map((item: any) => [item.provider, item]));
    return this.catalog().map((item: any) => ({
      ...item,
      connection: byProvider.has(item.provider) ? this.publicIntegration(byProvider.get(item.provider)) : null,
    }));
  }

  async setup(creatorId: string, providerValue: string): Promise<Record<string, unknown>> {
    const provider = this.provider(providerValue);
    const connection = await this.integrationModel.findOne({ creatorId: this.id(creatorId), provider }).lean();
    const isOAuth = OAUTH_PROVIDERS.includes(provider as OAuthProvider);
    let oauthConfigured = false;
    let redirectUri: string | undefined;
    if (isOAuth) {
      const spec = this.oauthSpec(provider as OAuthProvider);
      oauthConfigured = Boolean(spec.clientId && spec.clientSecret && spec.redirectUri.startsWith('https://'));
      redirectUri = spec.redirectUri;
    }
    return {
      provider,
      status: connection?.status || 'setup_required',
      connection: connection ? this.publicIntegration(connection) : null,
      setup: this.setupRequirements(provider),
      oauthConfigured,
      redirectUri,
      consent: [CreatorIntegrationProvider.KIT, CreatorIntegrationProvider.BREVO].includes(provider)
        ? 'Contact sync remains off until each member records consent for this community and provider.'
        : undefined,
    };
  }

  async connect(creatorId: string, body: any): Promise<any> {
    const provider = this.provider(String(body?.provider || ''));
    if (provider === CreatorIntegrationProvider.GOOGLE_CALENDAR) {
      throw new BadRequestException('Use the Google Calendar OAuth connection flow');
    }
    if (OAUTH_PROVIDERS.includes(provider as OAuthProvider) || CREDENTIAL_PROVIDERS.includes(provider as CredentialProvider)) {
      throw new BadRequestException('Use this provider’s secure setup flow');
    }
    await this.assertAutomationAllowed(creatorId);
    const communityId = await this.assertOwnedCommunity(creatorId, body?.communityId);
    const config = this.isRecord(body?.config) ? body.config : {};

    if ([CreatorIntegrationProvider.ZAPIER, CreatorIntegrationProvider.MAKE].includes(provider)) {
      const webhookUrl = await this.assertSafeWebhookUrl(config.webhookUrl);
      const events = this.selectedEvents(config.events);
      const existing = await this.integrationModel.findOne(this.integrationFilter(creatorId, provider, communityId));
      let webhookId = (existing?.config as any)?.webhookId;
      if (webhookId && Types.ObjectId.isValid(String(webhookId))) {
        await this.webhookModel.updateOne(
          { _id: this.id(String(webhookId)), creatorId: this.id(creatorId) },
          { $set: { url: webhookUrl, events, active: true, name: `${provider === CreatorIntegrationProvider.ZAPIER ? 'Zapier' : 'Make'} automation` } },
        );
      } else {
        const hook = await this.webhookModel.create({
          creatorId: this.id(creatorId),
          communityId,
          name: `${provider === CreatorIntegrationProvider.ZAPIER ? 'Zapier' : 'Make'} automation`,
          url: webhookUrl,
          events,
          secret: randomBytes(32).toString('base64url'),
        });
        webhookId = String(hook._id);
      }
      const integration = await this.integrationModel.findOneAndUpdate(
        this.integrationFilter(creatorId, provider, communityId),
        { $set: { status: 'connected', config: { webhookId, webhookUrl, events }, lastError: null, lastSyncedAt: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      return this.publicIntegration(integration);
    }

    if (provider !== CreatorIntegrationProvider.WEBHOOK) {
      throw new BadRequestException('Unsupported connection flow');
    }
    const integration = await this.integrationModel.findOneAndUpdate(
      this.integrationFilter(creatorId, provider, communityId),
      { $set: { status: 'connected', config: {}, lastError: null, lastSyncedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return this.publicIntegration(integration);
  }

  async startOAuth(creatorId: string, providerValue: string, body: any): Promise<{ authorizationUrl: string; expiresAt: string }> {
    const provider = this.oauthProvider(providerValue);
    await this.assertAutomationAllowed(creatorId);
    const spec = this.oauthSpec(provider);
    this.assertOAuthServerConfigured(spec);
    const communityId = await this.assertOwnedCommunity(creatorId, body?.communityId);
    const config = this.sanitizeProviderConfig(provider, body?.config);
    const state = randomBytes(32).toString('base64url');
    const verifier = randomBytes(64).toString('base64url');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.oauthStateModel.create({
      creatorId: this.id(creatorId),
      communityId,
      provider,
      stateHash: createHash('sha256').update(state).digest('hex'),
      encryptedVerifier: this.encryptCredentials({ verifier }),
      config,
      expiresAt,
    });

    const url = new URL(spec.authorizationUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', spec.clientId!);
    url.searchParams.set('redirect_uri', spec.redirectUri);
    url.searchParams.set('scope', spec.scopes.join(' '));
    url.searchParams.set('state', state);
    if (spec.usePkce) {
      url.searchParams.set('code_challenge_method', 'S256');
      url.searchParams.set('code_challenge', createHash('sha256').update(verifier).digest('base64url'));
    }
    if (provider === CreatorIntegrationProvider.GOOGLE_SHEETS) {
      url.searchParams.set('access_type', 'offline');
      url.searchParams.set('prompt', 'consent');
      url.searchParams.set('include_granted_scopes', 'true');
    }
    return { authorizationUrl: url.toString(), expiresAt: expiresAt.toISOString() };
  }

  async completeOAuth(providerValue: string, state: string, code?: string, providerError?: string): Promise<any> {
    const provider = this.oauthProvider(providerValue);
    if (!state || state.length > 512) throw new BadRequestException('Invalid OAuth state');
    const record = await this.oauthStateModel
      .findOneAndDelete({
        provider,
        stateHash: createHash('sha256').update(state).digest('hex'),
        expiresAt: { $gt: new Date() },
      })
      .select('+encryptedVerifier');
    if (!record) throw new BadRequestException('OAuth state is expired, invalid, or already used');
    if (providerError || !code) {
      throw new BadRequestException('OAuth authorization was not completed');
    }

    const spec = this.oauthSpec(provider);
    this.assertOAuthServerConfigured(spec);
    const verifier = this.decryptCredentials(record.encryptedVerifier) as { verifier?: string } | null;
    if (!verifier?.verifier) throw new BadRequestException('OAuth state could not be verified');

    try {
      const tokenParams = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: spec.redirectUri,
      });
      if (spec.tokenAuth === 'body') {
        tokenParams.set('client_id', spec.clientId!);
        tokenParams.set('client_secret', spec.clientSecret!);
      }
      if (spec.usePkce) tokenParams.set('code_verifier', verifier.verifier);
      const tokenResponse = await this.providerFetch(spec.tokenUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          ...(spec.tokenAuth === 'basic'
            ? { authorization: `Basic ${Buffer.from(`${spec.clientId!}:${spec.clientSecret!}`).toString('base64')}` }
            : {}),
        },
        body: tokenParams.toString(),
      });
      const token = tokenResponse.body as any;
      if (!token?.access_token || typeof token.access_token !== 'string') {
        throw new Error('provider_token_missing');
      }
      const account = await this.providerFetch(spec.accountUrl, {
        headers: { authorization: `Bearer ${token.access_token}` },
      });
      const accountBody = this.isRecord(account.body) ? account.body : {};
      const externalAccountId = this.cleanString(accountBody.id || accountBody.sub || accountBody.user_id, 256);
      const current = await this.integrationModel.findOne({
        creatorId: record.creatorId,
        provider,
        ...(record.communityId ? { communityId: record.communityId } : { communityId: { $exists: false } }),
      }).select('+encryptedCredentials');
      const mergedConfig = { ...(this.isRecord(current?.config) ? current!.config : {}), ...(record.config || {}) };
      const expiresAt = typeof token.expires_in === 'number' ? Date.now() + token.expires_in * 1000 : undefined;
      const integration = await this.integrationModel.findOneAndUpdate(
        {
          creatorId: record.creatorId,
          provider,
          ...(record.communityId ? { communityId: record.communityId } : { communityId: { $exists: false } }),
        },
        {
          $set: {
            status: 'connected',
            config: mergedConfig,
            encryptedCredentials: this.encryptCredentials({
              accessToken: token.access_token,
              refreshToken: token.refresh_token,
              tokenType: token.token_type,
              expiresAt,
              scopes: typeof token.scope === 'string' ? token.scope.split(/\s+/).filter(Boolean) : spec.scopes,
            }),
            credentialExpiresAt: expiresAt ? new Date(expiresAt) : undefined,
            externalAccountId,
            grantedScopes: typeof token.scope === 'string' ? token.scope.split(/\s+/).filter(Boolean) : spec.scopes,
            lastSyncedAt: new Date(),
            lastTestedAt: new Date(),
            lastError: null,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      return this.publicIntegration(integration);
    } catch (error) {
      this.oauthCallbackFailures += 1;
      this.logger.warn(`OAuth callback failed for ${provider}`);
      throw new BadRequestException('Could not complete this OAuth connection');
    }
  }

  oauthResultPage(providerValue: string, success: boolean): string {
    const provider = this.provider(providerValue);
    const origin = this.frontendOrigin();
    const returnUrl = `${origin}/en/creator/integrations`;
    const message = JSON.stringify({ type: 'CHABAQA_INTEGRATION_OAUTH_RESULT', provider, success });
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>Chabaqa integration</title></head><body><main style="font-family:system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:1.5rem;text-align:center"><h1>${success ? 'Integration connected' : 'Integration not connected'}</h1><p>${success ? 'You can return to Chabaqa.' : 'No credentials were saved. Return to Chabaqa and try again.'}</p></main><script>(function(){var result=${message};try{if(window.opener){window.opener.postMessage(result,${JSON.stringify(origin)});}}catch(e){}setTimeout(function(){try{window.close();}catch(e){}},700);setTimeout(function(){window.location.replace(${JSON.stringify(returnUrl)});},900);})();</script></body></html>`;
  }

  async saveCredentials(creatorId: string, providerValue: string, body: any): Promise<any> {
    const provider = this.credentialProvider(providerValue);
    await this.assertAutomationAllowed(creatorId);
    const apiKey = this.cleanString(body?.apiKey, 1024);
    if (!apiKey || apiKey.length < 8) throw new BadRequestException('A valid API credential is required');
    const communityId = await this.assertOwnedCommunity(creatorId, body?.communityId);
    const config = this.sanitizeProviderConfig(provider, body?.config);
    const integration = await this.integrationModel.findOneAndUpdate(
      this.integrationFilter(creatorId, provider, communityId),
      {
        $set: {
          status: 'needs_attention',
          config,
          encryptedCredentials: this.encryptCredentials({ apiKey }),
          credentialExpiresAt: undefined,
          grantedScopes: [],
          lastError: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return this.publicIntegration(integration);
  }

  async updateConfiguration(creatorId: string, providerValue: string, body: any): Promise<any> {
    const provider = this.provider(providerValue);
    if (![...OAUTH_PROVIDERS, ...CREDENTIAL_PROVIDERS, CreatorIntegrationProvider.DISCORD].includes(provider as any)) {
      throw new BadRequestException('This provider does not have native configuration');
    }
    await this.assertAutomationAllowed(creatorId);
    const communityId = await this.assertOwnedCommunity(creatorId, body?.communityId);
    const config = this.sanitizeProviderConfig(provider, body?.config);
    const existing = await this.integrationModel.findOne(this.integrationFilter(creatorId, provider, communityId));
    const integration = await this.integrationModel.findOneAndUpdate(
      this.integrationFilter(creatorId, provider, communityId),
      {
        $set: {
          config: { ...(this.isRecord(existing?.config) ? existing!.config : {}), ...config },
          ...(existing ? {} : { status: 'setup_required' }),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return this.publicIntegration(integration);
  }

  private async providerFetch(url: string, init: RequestInit = {}): Promise<{ status: number; body: unknown }> {
    const response = await fetch(url, {
      ...init,
      redirect: 'error',
      signal: AbortSignal.timeout(12_000),
      headers: { accept: 'application/json', ...(init.headers || {}) },
    });
    const text = await response.text();
    let body: unknown = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = null; }
    if (!response.ok) throw new Error(`provider_http_${response.status}`);
    return { status: response.status, body };
  }

  private async currentAccessToken(integration: CreatorIntegrationDocument, provider: OAuthProvider): Promise<string> {
    const credentials = this.decryptCredentials(integration.encryptedCredentials);
    if (!credentials?.accessToken) throw new Error('provider_credentials_missing');
    if (!credentials.expiresAt || credentials.expiresAt > Date.now() + 60_000) return credentials.accessToken;
    if (!credentials.refreshToken) throw new Error('provider_credentials_expired');
    const spec = this.oauthSpec(provider);
    this.assertOAuthServerConfigured(spec);
    const params = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: credentials.refreshToken });
    if (spec.tokenAuth === 'body') {
      params.set('client_id', spec.clientId!);
      params.set('client_secret', spec.clientSecret!);
    }
    const response = await this.providerFetch(spec.tokenUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        ...(spec.tokenAuth === 'basic'
          ? { authorization: `Basic ${Buffer.from(`${spec.clientId!}:${spec.clientSecret!}`).toString('base64')}` }
          : {}),
      },
      body: params.toString(),
    });
    const token = response.body as any;
    if (!token?.access_token) throw new Error('provider_refresh_failed');
    const expiresAt = typeof token.expires_in === 'number' ? Date.now() + token.expires_in * 1000 : undefined;
    integration.encryptedCredentials = this.encryptCredentials({
      accessToken: token.access_token,
      refreshToken: token.refresh_token || credentials.refreshToken,
      tokenType: token.token_type || credentials.tokenType,
      expiresAt,
      scopes: credentials.scopes,
    });
    integration.credentialExpiresAt = expiresAt ? new Date(expiresAt) : undefined;
    await integration.save();
    return token.access_token;
  }

  async testConnection(creatorId: string, providerValue: string): Promise<Record<string, unknown>> {
    const provider = this.provider(providerValue);
    const integration = await this.integrationModel.findOne({ creatorId: this.id(creatorId), provider }).select('+encryptedCredentials');
    if (!integration) throw new NotFoundException('Connect this provider before testing it');
    try {
      let response: { status: number; body: unknown };
      if (provider === CreatorIntegrationProvider.KIT) {
        const credentials = this.decryptCredentials(integration.encryptedCredentials);
        if (!credentials?.apiKey) throw new Error('provider_credentials_missing');
        response = await this.providerFetch('https://api.kit.com/v4/account', { headers: { 'x-kit-api-key': credentials.apiKey } });
      } else if (provider === CreatorIntegrationProvider.BREVO) {
        const credentials = this.decryptCredentials(integration.encryptedCredentials);
        if (!credentials?.apiKey) throw new Error('provider_credentials_missing');
        response = await this.providerFetch('https://api.brevo.com/v3/account', { headers: { 'api-key': credentials.apiKey } });
      } else if (provider === CreatorIntegrationProvider.GOOGLE_SHEETS) {
        const spreadsheetId = this.identifier((integration.config as any)?.spreadsheetId, 'spreadsheet ID', true)!;
        const accessToken = await this.currentAccessToken(integration, provider);
        response = await this.providerFetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=spreadsheetId,properties.title`, { headers: { authorization: `Bearer ${accessToken}` } });
      } else if (provider === CreatorIntegrationProvider.ZOOM || provider === CreatorIntegrationProvider.DISCORD) {
        const accessToken = await this.currentAccessToken(integration, provider as OAuthProvider);
        response = await this.providerFetch(this.oauthSpec(provider as OAuthProvider).accountUrl, { headers: { authorization: `Bearer ${accessToken}` } });
        if (provider === CreatorIntegrationProvider.DISCORD && (integration.config as any)?.announcePosts) {
          const botToken = String(process.env.DISCORD_BOT_TOKEN || '').trim();
          if (!botToken) throw new Error('discord_bot_not_configured');
        }
      } else {
        throw new BadRequestException('This connector has no native connection test');
      }
      integration.status = 'connected';
      integration.lastTestedAt = new Date();
      integration.lastSyncedAt = new Date();
      integration.lastError = undefined;
      await integration.save();
      return { ok: true, provider, testedAt: integration.lastTestedAt.toISOString(), status: response.status };
    } catch (error) {
      integration.status = 'needs_attention';
      integration.lastTestedAt = new Date();
      integration.lastError = 'Connection test failed. Check credentials, approved scopes, and provider mapping.';
      await integration.save();
      throw new BadRequestException('Could not verify this connection. Check its approved credentials, scopes, and mapping.');
    }
  }

  async disconnect(creatorId: string, integrationId: string): Promise<any> {
    const item = await this.integrationModel.findOneAndUpdate(
      { _id: this.id(integrationId), creatorId: this.id(creatorId) },
      { $set: { status: 'disconnected', lastError: null }, $unset: { encryptedCredentials: 1, credentialExpiresAt: 1, externalAccountId: 1, grantedScopes: 1 } },
      { new: true },
    );
    if (!item) throw new NotFoundException('Integration not found');
    const webhookId = (item.config as any)?.webhookId;
    if (webhookId && Types.ObjectId.isValid(String(webhookId))) {
      await this.webhookModel.updateOne({ _id: this.id(String(webhookId)), creatorId: this.id(creatorId) }, { $set: { active: false } });
    }
    return this.publicIntegration(item);
  }

  async setContactConsent(userId: string, body: any): Promise<Record<string, unknown>> {
    const provider = this.credentialProvider(String(body?.provider || ''));
    const communityId = this.id(String(body?.communityId || ''));
    const policyVersion = this.cleanString(body?.policyVersion, 100);
    if (!policyVersion) throw new BadRequestException('A policy version is required to record consent');
    const community = await this.communityModel.findById(communityId).select('_id createur members isPrivate').lean();
    if (!community) throw new NotFoundException('Community not found');
    const isMember = Array.isArray((community as any).members) && (community as any).members.some((member: any) => String(member) === String(this.id(userId)));
    if (!isMember && (community as any).isPrivate) throw new NotFoundException('Community not found');
    const activeMapping = await this.integrationModel.exists({
      creatorId: (community as any).createur,
      provider,
      status: 'connected',
      'config.contactSyncEnabled': true,
      $or: [{ communityId: { $exists: false } }, { communityId }],
    });
    if (!activeMapping) throw new BadRequestException('This community does not have an active contact-sync mapping for that provider');
    const granted = body?.granted === true;
    const consent = await this.contactConsentModel.findOneAndUpdate(
      { userId: this.id(userId), communityId, provider },
      granted
        ? { $set: { creatorId: (community as any).createur, policyVersion, consentedAt: new Date() }, $unset: { revokedAt: 1 } }
        : { $set: { creatorId: (community as any).createur, policyVersion, revokedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return { provider, communityId: String(communityId), granted: !consent.revokedAt, recordedAt: new Date().toISOString() };
  }

  async listContactConsentOptionsForCommunity(userId: string, communityIdValue: string): Promise<Array<Record<string, unknown>>> {
    const communityId = this.id(communityIdValue);
    const community = await this.communityModel.findById(communityId).select('_id name slug createur members isPrivate').lean();
    if (!community) throw new NotFoundException('Community not found');
    const memberId = this.id(userId);
    const isMember = Array.isArray((community as any).members) && (community as any).members.some((member: any) => String(member) === String(memberId));
    if (!isMember && (community as any).isPrivate) throw new NotFoundException('Community not found');
    const integrations = await this.integrationModel.find({
      creatorId: (community as any).createur,
      provider: { $in: CREDENTIAL_PROVIDERS },
      status: 'connected',
      'config.contactSyncEnabled': true,
      $or: [{ communityId: { $exists: false } }, { communityId }],
    }).select('provider config').lean();
    const consents = await this.contactConsentModel.find({
      userId: memberId,
      communityId,
      provider: { $in: CREDENTIAL_PROVIDERS },
    }).select('provider consentedAt revokedAt').lean();
    const consentByProvider = new Map(consents.map((consent: any) => [consent.provider, consent]));
    return integrations.map((integration: any) => {
      const consent = consentByProvider.get(integration.provider) as any;
      return {
        communityId: String(communityId),
        communityName: (community as any).name,
        communitySlug: (community as any).slug,
        provider: integration.provider,
        policyVersion: this.cleanString((integration.config as any)?.policyVersion, 100),
        granted: Boolean(consent && !consent.revokedAt),
        consentedAt: consent?.consentedAt,
        revokedAt: consent?.revokedAt,
      };
    });
  }

  /**
   * Returns only marketing connectors that are active for communities where the
   * authenticated user is a member. This keeps consent choices community- and
   * provider-scoped without exposing connector credentials or other members.
   */
  async listContactConsentOptions(userId: string): Promise<Array<Record<string, unknown>>> {
    const memberId = this.id(userId);
    const communities = await this.communityModel
      .find({ members: memberId })
      .select('_id name slug createur')
      .lean();
    if (!communities.length) return [];

    const communityIds = communities.map((community: any) => community._id);
    const creatorIds = Array.from(new Map(communities.map((community: any) => [String(community.createur), community.createur])).values());
    const integrations = await this.integrationModel.find({
      creatorId: { $in: creatorIds },
      provider: { $in: CREDENTIAL_PROVIDERS },
      status: 'connected',
      'config.contactSyncEnabled': true,
      $or: [
        { communityId: { $exists: false } },
        { communityId: { $in: communityIds } },
      ],
    }).select('creatorId communityId provider config').lean();
    if (!integrations.length) return [];

    const consents = await this.contactConsentModel.find({
      userId: memberId,
      communityId: { $in: communityIds },
      provider: { $in: CREDENTIAL_PROVIDERS },
    }).select('communityId provider consentedAt revokedAt').lean();
    const consentByScope = new Map(consents.map((consent: any) => [
      `${String(consent.communityId)}:${consent.provider}`,
      consent,
    ]));

    return communities.flatMap((community: any) => integrations
      .filter((integration: any) =>
        String(integration.creatorId) === String(community.createur) &&
        (!integration.communityId || String(integration.communityId) === String(community._id)),
      )
      .map((integration: any) => {
        const consent = consentByScope.get(`${String(community._id)}:${integration.provider}`) as any;
        const policyVersion = this.cleanString((integration.config as any)?.policyVersion, 100);
        return {
          communityId: String(community._id),
          communityName: community.name,
          communitySlug: community.slug,
          provider: integration.provider,
          policyVersion,
          granted: Boolean(consent && !consent.revokedAt),
          consentedAt: consent?.consentedAt,
          revokedAt: consent?.revokedAt,
        };
      }));
  }

  async createWebhook(creatorId: string, body: any): Promise<any> {
    await this.assertAutomationAllowed(creatorId);
    const webhookUrl = await this.assertSafeWebhookUrl(body?.url);
    const events = this.selectedEvents(body?.events, []);
    const communityId = await this.assertOwnedCommunity(creatorId, body?.communityId);
    const name = this.cleanString(body?.name, 100);
    if (!name) throw new BadRequestException('Webhook name is required');
    const secret = randomBytes(32).toString('base64url');
    const doc = await this.webhookModel.create({ creatorId: this.id(creatorId), communityId, name, url: webhookUrl, events, secret });
    return { webhook: this.publicWebhook(doc), signingSecret: secret };
  }

  async listWebhooks(creatorId: string): Promise<any[]> {
    return (await this.webhookModel.find({ creatorId: this.id(creatorId) }).sort({ createdAt: -1 })).map((item) => this.publicWebhook(item));
  }

  async deleteWebhook(creatorId: string, id: string): Promise<{ success: true }> {
    const result = await this.webhookModel.deleteOne({ _id: this.id(id), creatorId: this.id(creatorId) });
    if (!result.deletedCount) throw new NotFoundException('Webhook not found');
    return { success: true };
  }

  async testWebhook(creatorId: string, id: string): Promise<any> {
    const hook = await this.webhookModel.findOne({ _id: this.id(id), creatorId: this.id(creatorId) }).select('+secret');
    if (!hook) throw new NotFoundException('Webhook not found');
    const delivery = await this.queueWebhook(hook, 'integration.test', { message: 'Chabaqa webhook test' });
    await this.deliverWebhook(String(delivery._id));
    return this.deliveryModel.findById(delivery._id).lean();
  }

  async listDeliveries(creatorId: string, webhookId?: string): Promise<any[]> {
    const filter: any = { creatorId: this.id(creatorId) };
    if (webhookId) filter.webhookId = this.id(webhookId);
    return this.deliveryModel.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  }

  async listProviderDeliveries(creatorId: string): Promise<any[]> {
    return this.providerDeliveryModel.find({ creatorId: this.id(creatorId) }).sort({ createdAt: -1 }).limit(100).lean();
  }

  async getDeliveryStats(): Promise<Record<string, number>> {
    const now = new Date();
    const retrying = { status: 'failed', nextAttemptAt: { $lte: now }, attempts: { $lt: 5 } };
    const exhausted = { status: 'failed', attempts: { $gte: 5 }, nextAttemptAt: { $exists: false } };
    const [webhookRetrying, webhookExhausted, providerRetrying, providerExhausted, expiredOAuthStates] = await Promise.all([
      this.deliveryModel.countDocuments(retrying),
      this.deliveryModel.countDocuments(exhausted),
      this.providerDeliveryModel.countDocuments(retrying),
      this.providerDeliveryModel.countDocuments(exhausted),
      this.oauthStateModel.countDocuments({ expiresAt: { $lte: now } }),
    ]);
    return {
      retrying: webhookRetrying + providerRetrying,
      exhausted: webhookExhausted + providerExhausted,
      webhookRetrying,
      providerRetrying,
      oauthCallbackFailures: this.oauthCallbackFailures,
      credentialEncryptionFailures: this.credentialEncryptionFailures,
      expiredOAuthStates,
    };
  }

  async replayDelivery(creatorId: string, id: string): Promise<any> {
    const original = await this.deliveryModel.findOne({ _id: this.id(id), creatorId: this.id(creatorId) });
    if (!original) throw new NotFoundException('Delivery not found');
    const hook = await this.webhookModel.findById(original.webhookId).select('+secret');
    if (!hook || !hook.active) throw new BadRequestException('Webhook is no longer active');
    const delivery = await this.queueWebhook(hook, original.event, ((original.payload as any)?.data || {}) as Record<string, unknown>);
    await this.deliverWebhook(String(delivery._id));
    return this.deliveryModel.findById(delivery._id).lean();
  }

  async createApiKey(creatorId: string, body: any): Promise<any> {
    const raw = `chq_${randomBytes(30).toString('base64url')}`;
    const requestedScopes = Array.isArray(body?.scopes) ? body.scopes : ['read'];
    const scopes: string[] = Array.from(new Set(requestedScopes.map(String)));
    if (!scopes.length || scopes.some((scope) => !API_KEY_SCOPES.includes(scope))) {
      throw new BadRequestException(`Supported API key scopes: ${API_KEY_SCOPES.join(', ')}`);
    }
    const name = this.cleanString(body?.name, 100);
    if (!name) throw new BadRequestException('API key name must be between 1 and 100 characters');
    const doc = await this.apiKeyModel.create({
      creatorId: this.id(creatorId),
      name,
      prefix: raw.slice(0, 12),
      keyHash: createHash('sha256').update(raw).digest('hex'),
      scopes,
    });
    return { apiKey: this.publicKey(doc), token: raw };
  }

  async listApiKeys(creatorId: string): Promise<any[]> {
    return (await this.apiKeyModel.find({ creatorId: this.id(creatorId) }).sort({ createdAt: -1 })).map((item) => this.publicKey(item));
  }

  async revokeApiKey(creatorId: string, id: string): Promise<any> {
    const key = await this.apiKeyModel.findOneAndUpdate(
      { _id: this.id(id), creatorId: this.id(creatorId), revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
      { new: true },
    );
    if (!key) throw new NotFoundException('API key not found');
    return this.publicKey(key);
  }

  async authenticateApiKey(raw: string): Promise<{ creatorId: string; scopes: string[]; keyId: string; name: string }> {
    if (!raw || !raw.startsWith('chq_')) throw new UnauthorizedException('Invalid API key');
    const key = await this.apiKeyModel.findOne({ keyHash: createHash('sha256').update(raw).digest('hex'), revokedAt: { $exists: false } }).select('+keyHash');
    if (!key) throw new UnauthorizedException('Invalid API key');
    key.lastUsedAt = new Date();
    await key.save();
    return { creatorId: String(key.creatorId), scopes: key.scopes || [], keyId: String(key._id), name: key.name };
  }

  async publicCommunities(raw: string): Promise<any> {
    const auth = await this.authenticateApiKey(raw);
    if (!auth.scopes.includes('read')) throw new UnauthorizedException('This API key does not include read access');
    const communities = await this.communityModel.find({ createur: this.id(auth.creatorId) }).select('_id name slug members').lean();
    return {
      creatorId: auth.creatorId,
      communities: communities.map((community: any) => ({ id: String(community._id), name: community.name, slug: community.slug, membersCount: Array.isArray(community.members) ? community.members.length : 0 })),
    };
  }

  async publicCommunity(raw: string, communityId: string): Promise<any> {
    const auth = await this.authenticateApiKey(raw);
    if (!auth.scopes.includes('read')) throw new UnauthorizedException('This API key does not include read access');
    const community = await this.communityModel.findOne({ _id: this.id(communityId), createur: this.id(auth.creatorId) }).select('_id name slug short_description category country currency priceType price members isActive isPrivate createdAt updatedAt').lean();
    if (!community) throw new NotFoundException('Community not found');
    return {
      creatorId: auth.creatorId,
      community: {
        id: String((community as any)._id), name: (community as any).name, slug: (community as any).slug,
        description: (community as any).short_description, category: (community as any).category, country: (community as any).country,
        currency: (community as any).currency, priceType: (community as any).priceType, price: (community as any).price,
        membersCount: Array.isArray((community as any).members) ? (community as any).members.length : 0,
        isActive: (community as any).isActive, isPrivate: (community as any).isPrivate,
        createdAt: (community as any).createdAt, updatedAt: (community as any).updatedAt,
      },
    };
  }

  apiContract(): Record<string, unknown> {
    return {
      version: 'v1',
      authentication: 'Send X-Chabaqa-Api-Key: chq_…',
      rateLimits: { perSecond: 10, perMinute: 60, perHour: 500, tracker: 'Each API key has an independent quota; unauthenticated requests fall back to IP.' },
      responseEnvelope: { success: 'boolean', data: 'endpoint payload', timestamp: 'ISO-8601 timestamp' },
      retention: { deliveredDays: 90, failedDays: 30 },
      providers: {
        available: ['google_calendar', 'zapier', 'make', 'webhook'],
        setupRequired: [
          { provider: 'google_sheets', requires: 'Google OAuth client/secret, approved HTTPS redirect URI, Sheets API, and a spreadsheet mapping' },
          { provider: 'kit', requires: 'Creator Kit API credential, tag/form mapping, and member-level marketing consent' },
          { provider: 'brevo', requires: 'Creator Brevo API credential, list mapping, and member-level marketing consent' },
          { provider: 'zoom', requires: 'Zoom Marketplace OAuth app, approved redirect URI/scopes, and explicit meeting/attendance behavior' },
          { provider: 'discord', requires: 'Discord OAuth app plus a server-held bot installation, guild/channel/role mapping' },
        ],
      },
      webhook: {
        method: 'POST', contentType: 'application/json', redirectPolicy: 'Redirects are not followed; configure the final HTTPS endpoint directly.',
        signature: 'sha256=HMAC_SHA256(raw UTF-8 request body, signingSecret)',
        headers: {
          'x-chabaqa-event': 'event type',
          'x-chabaqa-event-id': 'stable UUID; use for idempotency',
          'x-chabaqa-timestamp': 'Unix milliseconds',
          'x-chabaqa-signature': 'sha256=<hex HMAC>',
        },
        payload: { event: 'event type', eventId: 'stable UUID', occurredAt: 'ISO-8601 timestamp', data: 'event-specific payload' },
        successResponse: 'Any HTTP 2xx acknowledges delivery; all other responses (including 3xx) retry up to 5 times',
      },
      events: [...EVENTS],
      eventPrivacy: {
        formSubmitted: 'Not exposed: Chabaqa has no generic durable forms subsystem yet. Challenge project submissions use challenge.submitted and exclude content, links, files, and email.',
        marketing: 'Kit and Brevo contact synchronization requires a current member-level consent record; creator acknowledgement alone is insufficient.',
      },
      endpoints: [
        { method: 'GET', path: '/api/creator/integrations/public/v1/me', scope: 'read', description: 'Verify key and retrieve its creator context' },
        { method: 'GET', path: '/api/creator/integrations/public/v1/communities', scope: 'read', description: 'List the authenticated creator’s communities' },
        { method: 'GET', path: '/api/creator/integrations/public/v1/communities/:communityId', scope: 'read', description: 'Read one owned community; never exposes member identities' },
      ],
    };
  }

  async emit(creatorId: string, event: string, data: Record<string, unknown>, communityId?: string): Promise<void> {
    if (!EVENTS.includes(event as (typeof EVENTS)[number])) return;
    const creatorObjectId = this.id(creatorId);
    const hooks = await this.webhookModel.find({ creatorId: creatorObjectId, active: true, events: event }).select('+secret');
    await Promise.all(hooks.map(async (hook) => {
      if (communityId && hook.communityId && String(hook.communityId) !== communityId) return;
      const queued = await this.queueWebhook(hook, event, data);
      void this.deliverWebhook(String(queued._id));
    }));
    await this.queueProviderDeliveries(creatorId, event, data, communityId);
  }

  private async queueWebhook(hook: CreatorWebhookDocument, event: string, data: Record<string, unknown>): Promise<CreatorWebhookDeliveryDocument> {
    const eventId = randomUUID();
    return this.deliveryModel.create({
      webhookId: hook._id,
      creatorId: hook.creatorId,
      event,
      eventId,
      payload: { event, eventId, occurredAt: new Date().toISOString(), data },
      status: 'queued',
      nextAttemptAt: new Date(),
    });
  }

  private async deliverWebhook(id: string): Promise<void> {
    const delivery = await this.deliveryModel.findById(id);
    if (!delivery || delivery.status === 'delivered') return;
    const hook = await this.webhookModel.findById(delivery.webhookId).select('+secret');
    if (!hook || !hook.active) return;
    const raw = JSON.stringify(delivery.payload);
    try {
      const response = await fetch(hook.url, {
        method: 'POST',
        redirect: 'error',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'Chabaqa-Webhooks/1.0',
          'x-chabaqa-event': delivery.event,
          'x-chabaqa-event-id': delivery.eventId,
          'x-chabaqa-timestamp': String(Date.now()),
          'x-chabaqa-signature': `sha256=${createHmac('sha256', hook.secret).update(raw).digest('hex')}`,
        },
        body: raw,
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`webhook_http_${response.status}`);
      delivery.status = 'delivered';
      delivery.responseStatus = response.status;
      delivery.deliveredAt = new Date();
      delivery.nextAttemptAt = undefined;
      hook.lastDeliveredAt = new Date();
      hook.lastError = undefined;
      await Promise.all([delivery.save(), hook.save()]);
    } catch {
      delivery.attempts += 1;
      delivery.status = 'failed';
      delivery.error = 'Webhook delivery failed';
      delivery.nextAttemptAt = delivery.attempts >= 5 ? undefined : new Date(Date.now() + Math.min(900_000, 30_000 * 2 ** (delivery.attempts - 1)));
      hook.lastError = delivery.error;
      await Promise.all([delivery.save(), hook.save()]);
      if (delivery.attempts >= 5) this.logger.error(`Webhook delivery exhausted retries: ${String(delivery._id)}`);
    }
  }

  private providerShouldReceive(item: any, event: string): boolean {
    const config = this.isRecord(item.config) ? item.config : {};
    const events = Array.isArray(config.events) ? config.events.map(String) : [...EVENTS];
    if (!events.includes(event)) return false;
    if (item.provider === CreatorIntegrationProvider.GOOGLE_SHEETS) return Boolean(config.spreadsheetId);
    if ([CreatorIntegrationProvider.KIT, CreatorIntegrationProvider.BREVO].includes(item.provider)) return config.contactSyncEnabled === true;
    if (item.provider === CreatorIntegrationProvider.DISCORD) return config.announcePosts === true && event === 'post.created' && Boolean(config.channelId) && Boolean(process.env.DISCORD_BOT_TOKEN);
    return false;
  }

  private eventIdentity(event: string, data: Record<string, unknown>): string {
    const keys = ['orderId', 'subscriptionId', 'bookingId', 'sessionId', 'memberId', 'participantId', 'enrollmentId', 'eventRegistrationId', 'postId', 'submissionId', 'challengeId'];
    const value = keys.map((key) => data[key]).find((candidate) => typeof candidate === 'string' && candidate.length > 0);
    return `${event}:${String(value || JSON.stringify(data, Object.keys(data).sort()))}`;
  }

  private async queueProviderDeliveries(creatorId: string, event: string, data: Record<string, unknown>, communityId?: string): Promise<void> {
    const integrations = await this.integrationModel.find({
      creatorId: this.id(creatorId),
      provider: { $in: PROVIDER_OUTBOX_PROVIDERS },
      status: 'connected',
    }).lean();
    await Promise.all(integrations.map(async (integration: any) => {
      if (communityId && integration.communityId && String(integration.communityId) !== communityId) return;
      if (!this.providerShouldReceive(integration, event)) return;
      const idempotencyKey = createHash('sha256').update(`${integration._id}:${this.eventIdentity(event, data)}`).digest('hex');
      const delivery = await this.providerDeliveryModel.findOneAndUpdate(
        { idempotencyKey },
        {
          $setOnInsert: {
            integrationId: integration._id,
            creatorId: integration.creatorId,
            provider: integration.provider,
            event,
            idempotencyKey,
            payload: { event, occurredAt: new Date().toISOString(), data, communityId },
            status: 'queued',
            attempts: 0,
            nextAttemptAt: new Date(),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      if (delivery.status === 'queued') void this.deliverProvider(String(delivery._id));
    }));
  }

  private async contactForDelivery(integration: CreatorIntegrationDocument, delivery: CreatorIntegrationDeliveryDocument): Promise<{ email: string; firstName?: string } | null> {
    const data = ((delivery.payload as any)?.data || {}) as Record<string, unknown>;
    const userId = [data.memberId, data.buyerId, data.participantId, data.learnerId].find((value) => typeof value === 'string' && Types.ObjectId.isValid(value as string)) as string | undefined;
    const scopedCommunityId = (delivery.payload as any)?.communityId || integration.communityId;
    if (!userId || !scopedCommunityId || !Types.ObjectId.isValid(String(scopedCommunityId))) return null;
    const consent = await this.contactConsentModel.exists({
      userId: this.id(userId),
      creatorId: integration.creatorId,
      communityId: this.id(String(scopedCommunityId)),
      provider: integration.provider,
      revokedAt: { $exists: false },
    });
    if (!consent) return null;
    const user = await this.userModel.findById(userId).select('email name').lean();
    if (!user?.email) return null;
    return { email: String(user.email), firstName: this.cleanString((user as any).name, 100) };
  }

  private async dispatchGoogleSheets(integration: CreatorIntegrationDocument, delivery: CreatorIntegrationDeliveryDocument): Promise<number> {
    const config = integration.config as any;
    const spreadsheetId = this.identifier(config?.spreadsheetId, 'spreadsheet ID', true)!;
    const sheetName = this.cleanString(config?.sheetName, 100) || 'Chabaqa events';
    const token = await this.currentAccessToken(integration, CreatorIntegrationProvider.GOOGLE_SHEETS);
    const data = ((delivery.payload as any)?.data || {}) as Record<string, unknown>;
    const row = [delivery.event, (delivery.payload as any)?.occurredAt || new Date().toISOString(), JSON.stringify(this.redact(data))];
    const range = `${sheetName}!A:C`;
    const response = await this.providerFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ values: [row] }),
      },
    );
    return response.status;
  }

  private async dispatchKit(integration: CreatorIntegrationDocument, delivery: CreatorIntegrationDeliveryDocument): Promise<number | null> {
    const contact = await this.contactForDelivery(integration, delivery);
    if (!contact) return null;
    const credentials = this.decryptCredentials(integration.encryptedCredentials);
    if (!credentials?.apiKey) throw new Error('provider_credentials_missing');
    const config = integration.config as any;
    let response = await this.providerFetch('https://api.kit.com/v4/subscribers', {
      method: 'POST',
      headers: { 'x-kit-api-key': credentials.apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({ email_address: contact.email, first_name: contact.firstName || undefined, state: 'active' }),
    });
    for (const tagId of Array.isArray(config.tagIds) ? config.tagIds : []) {
      response = await this.providerFetch(`https://api.kit.com/v4/tags/${encodeURIComponent(String(tagId))}/subscribers`, {
        method: 'POST',
        headers: { 'x-kit-api-key': credentials.apiKey, 'content-type': 'application/json' },
        body: JSON.stringify({ email_address: contact.email }),
      });
    }
    if (config.formId) {
      response = await this.providerFetch(`https://api.kit.com/v4/forms/${encodeURIComponent(String(config.formId))}/subscribers`, {
        method: 'POST',
        headers: { 'x-kit-api-key': credentials.apiKey, 'content-type': 'application/json' },
        body: JSON.stringify({ email_address: contact.email }),
      });
    }
    return response.status;
  }

  private async dispatchBrevo(integration: CreatorIntegrationDocument, delivery: CreatorIntegrationDeliveryDocument): Promise<number | null> {
    const contact = await this.contactForDelivery(integration, delivery);
    if (!contact) return null;
    const credentials = this.decryptCredentials(integration.encryptedCredentials);
    if (!credentials?.apiKey) throw new Error('provider_credentials_missing');
    const config = integration.config as any;
    const response = await this.providerFetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'api-key': credentials.apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        email: contact.email,
        attributes: contact.firstName ? { FIRSTNAME: contact.firstName } : {},
        listIds: (Array.isArray(config.listIds) ? config.listIds : []).map(Number),
        updateEnabled: true,
      }),
    });
    return response.status;
  }

  private async dispatchDiscord(integration: CreatorIntegrationDocument, delivery: CreatorIntegrationDeliveryDocument): Promise<number | null> {
    const config = integration.config as any;
    const token = String(process.env.DISCORD_BOT_TOKEN || '').trim();
    const channelId = this.identifier(config?.channelId, 'Discord channel ID');
    if (!token || !channelId) return null;
    const data = ((delivery.payload as any)?.data || {}) as Record<string, unknown>;
    const title = this.cleanString(data.title, 500) || 'New community post';
    const response = await this.providerFetch(`https://discord.com/api/v10/channels/${encodeURIComponent(channelId)}/messages`, {
      method: 'POST',
      headers: { authorization: `Bot ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ content: `📣 ${title}` }),
    });
    return response.status;
  }

  private async deliverProvider(id: string): Promise<void> {
    const delivery = await this.providerDeliveryModel.findById(id);
    if (!delivery || ['delivered', 'skipped'].includes(delivery.status)) return;
    const integration = await this.integrationModel.findById(delivery.integrationId).select('+encryptedCredentials');
    if (!integration || integration.status !== 'connected') {
      delivery.status = 'skipped';
      delivery.error = 'Integration is disconnected';
      delivery.nextAttemptAt = undefined;
      await delivery.save();
      return;
    }
    try {
      let status: number | null = null;
      if (delivery.provider === CreatorIntegrationProvider.GOOGLE_SHEETS) status = await this.dispatchGoogleSheets(integration, delivery);
      if (delivery.provider === CreatorIntegrationProvider.KIT) status = await this.dispatchKit(integration, delivery);
      if (delivery.provider === CreatorIntegrationProvider.BREVO) status = await this.dispatchBrevo(integration, delivery);
      if (delivery.provider === CreatorIntegrationProvider.DISCORD) status = await this.dispatchDiscord(integration, delivery);
      if (status === null) {
        delivery.status = 'skipped';
        delivery.error = 'No eligible consent or provider mapping for this delivery';
      } else {
        delivery.status = 'delivered';
        delivery.responseStatus = status;
        delivery.deliveredAt = new Date();
        integration.lastSyncedAt = new Date();
        integration.lastError = undefined;
      }
      delivery.nextAttemptAt = undefined;
      await Promise.all([delivery.save(), integration.save()]);
    } catch {
      delivery.attempts += 1;
      delivery.status = 'failed';
      delivery.error = 'Provider delivery failed. Check credentials, consent, mapping, and provider access.';
      delivery.nextAttemptAt = delivery.attempts >= 5 ? undefined : new Date(Date.now() + Math.min(900_000, 30_000 * 2 ** (delivery.attempts - 1)));
      integration.status = 'needs_attention';
      integration.lastError = delivery.error;
      await Promise.all([delivery.save(), integration.save()]);
      if (delivery.attempts >= 5) this.logger.error(`Provider delivery exhausted retries: ${String(delivery._id)} (${delivery.provider})`);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async retryDue(): Promise<void> {
    const [webhooks, providers] = await Promise.all([
      this.deliveryModel.find({ status: 'failed', nextAttemptAt: { $lte: new Date() }, attempts: { $lt: 5 } }).limit(50).lean(),
      this.providerDeliveryModel.find({ status: 'failed', nextAttemptAt: { $lte: new Date() }, attempts: { $lt: 5 } }).limit(50).lean(),
    ]);
    for (const delivery of webhooks) void this.deliverWebhook(String(delivery._id));
    for (const delivery of providers) void this.deliverProvider(String(delivery._id));
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async reconcileDeliveryFailures(): Promise<void> {
    const stats = await this.getDeliveryStats();
    if (stats.exhausted > 0 || stats.retrying > 0) {
      this.logger.warn(`Integration delivery reconciliation: retrying=${stats.retrying} exhausted=${stats.exhausted}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async pruneDeliveryHistory(): Promise<void> {
    const now = Date.now();
    const deliveredBefore = new Date(now - 90 * 24 * 60 * 60 * 1000);
    const failedBefore = new Date(now - 30 * 24 * 60 * 60 * 1000);
    await Promise.all([
      this.deliveryModel.deleteMany({ status: 'delivered', createdAt: { $lt: deliveredBefore } }),
      this.deliveryModel.deleteMany({ status: 'failed', attempts: { $gte: 5 }, createdAt: { $lt: failedBefore } }),
      this.providerDeliveryModel.deleteMany({ status: { $in: ['delivered', 'skipped'] }, createdAt: { $lt: deliveredBefore } }),
      this.providerDeliveryModel.deleteMany({ status: 'failed', attempts: { $gte: 5 }, createdAt: { $lt: failedBefore } }),
    ]);
  }
}
