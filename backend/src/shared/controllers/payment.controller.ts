import { Controller, Post, Body, Query, Get, BadRequestException, UnauthorizedException, ForbiddenException, InternalServerErrorException, Req, UseGuards, Param, Logger, Optional } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StripePaymentService } from '@/shared/services/stripe-payment.service';
import type { LinkCheckoutSession } from '@/shared/services/stripe-payment.service';
import { PaymentFulfillmentService } from '@/shared/services/payment-fulfillment.service';
import { PaymentAuditService } from '@/shared/services/payment-audit.service';
import { PaymentVerificationService } from '@/shared/services/payment-verification.service';
import { Community, CommunityDocument } from '@/infrastructure/database/schemas/community/community.schema';
import { User, UserDocument } from '@/infrastructure/database/schemas/auth/user.schema';
import { Order, OrderDocument } from '@/infrastructure/database/schemas/commerce/order.schema';
import { PromoService } from '@/shared/services/promo.service';
import { FeeService } from '@/shared/services/fee.service';
import { TrackableContentType } from '@/infrastructure/database/schemas/learning/content-tracking.schema';
import { Cours, CoursDocument } from '@/infrastructure/database/schemas/learning/course.schema';
import { Challenge, ChallengeDocument } from '@/infrastructure/database/schemas/learning/challenge.schema';
import { Event, EventDocument } from '@/infrastructure/database/schemas/commerce/event.schema';
import { Product, ProductDocument } from '@/infrastructure/database/schemas/commerce/product.schema';
import { Session, SessionDocument } from '@/infrastructure/database/schemas/commerce/session.schema';
import { CoursService } from '@/domains/learning/course/cours.service';
import { ChallengeService } from '@/domains/learning/challenge/challenge.service';
import { EventService } from '@/domains/commerce/event/event.service';
import { SubscriptionService } from '@/domains/commerce/subscription/subscription.service';
import { SessionService } from '@/domains/commerce/session/session.service';
import { Plan, PlanDocument, PlanTier } from '@/infrastructure/database/schemas/commerce/plan.schema';
import { BillingInterval, SubscriptionStatus } from '@/infrastructure/database/schemas/commerce/subscription.schema';
import { JwtAuthGuard } from '@/domains/auth/guards/jwt-auth.guard';
import { NotificationService } from '@/domains/communication/notification/notification.service';
import { EmailService } from '@/shared/services/email.service';
import {
  ProcessedWebhookEvent,
  ProcessedWebhookEventDocument,
  ProcessedWebhookEventStatus,
} from '@/infrastructure/database/schemas/commerce/processed-webhook-event.schema';
import { AffiliateAttributionService } from '@/domains/community/affiliate/affiliate-attribution.service';
import { AffiliateCommissionService } from '@/domains/community/affiliate/affiliate-commission.service';
import { isStrictProductionRuntime } from '@/shared/utils/security-config.util';
import { WebhookRetryService } from '@/shared/services/webhook-retry.service';
import { AdminGuard } from '@/domains/auth/guards/admin.guard';
import { EntitlementService } from '@/shared/services/entitlement.service';
import { CreatorIntegrationsService } from '@/domains/communication/integrations/creator-integrations.service';


@ApiTags('Payments')
@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);
  private mongoTransactionSupport: boolean | null = null;

  constructor(
    private readonly stripe: StripePaymentService,
    private readonly promoService: PromoService,
    private readonly feeService: FeeService,
    private readonly paymentFulfillmentService: PaymentFulfillmentService,
    private readonly paymentAuditService: PaymentAuditService,
    private readonly paymentVerificationService: PaymentVerificationService,
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService,
    @InjectModel(Community.name) private communityModel: Model<CommunityDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Cours.name) private coursModel: Model<CoursDocument>,
    @InjectModel(Challenge.name) private challengeModel: Model<ChallengeDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    @InjectModel(ProcessedWebhookEvent.name)
    private readonly processedWebhookEventModel: Model<ProcessedWebhookEventDocument>,
    private readonly coursService: CoursService,
    private readonly challengeService: ChallengeService,
    private readonly eventService: EventService,
    private readonly sessionService: SessionService,
    private readonly subscriptionService: SubscriptionService,
    @InjectModel(Plan.name) private planModel: Model<PlanDocument>,
    private readonly affiliateAttributionService: AffiliateAttributionService,
    private readonly affiliateCommissionService: AffiliateCommissionService,
    private readonly entitlementService: EntitlementService,
    private readonly creatorIntegrationsService: CreatorIntegrationsService,
    @Optional() private readonly webhookRetryService?: WebhookRetryService,
  ) { }

  private isEnvFlagEnabled(name: string, defaultValue = false): boolean {
    const raw = process.env[name];
    if (raw === undefined || raw === null || raw === '') return defaultValue;
    return ['1', 'true', 'yes', 'on'].includes(String(raw).trim().toLowerCase());
  }

  private normalizeCatalogCurrency(value: unknown): 'TND' {
    const currency = String(value || 'TND').trim().toUpperCase();
    if (currency === 'DT') return 'TND';
    if (currency !== 'TND') {
      throw new BadRequestException(`Unsupported catalog currency ${currency}. Chabaqa catalog prices must be in TND.`);
    }
    return 'TND';
  }

  private normalizePaymentChannel(raw?: string): 'web' | 'mobile' {
    return String(raw || '').toLowerCase() === 'mobile' ? 'mobile' : 'web';
  }

  private normalizeBillingInterval(raw?: string): BillingInterval {
    return String(raw || '').toLowerCase() === BillingInterval.YEAR
      ? BillingInterval.YEAR
      : BillingInterval.MONTH;
  }

  private stableStripePriceEnvName(tier: string, interval: BillingInterval): string {
    const normalizedTier = String(tier || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
    const normalizedInterval = String(interval || BillingInterval.MONTH).toUpperCase();
    return `STRIPE_PRICE_${normalizedTier}_${normalizedInterval}`;
  }

  private resolvePlanStripePriceId(plan: PlanDocument, tier: string, interval: BillingInterval): string | undefined {
    const schemaPriceId = interval === BillingInterval.YEAR
      ? plan.stripePriceIds?.year
      : plan.stripePriceIds?.month;
    const envPriceId = process.env[this.stableStripePriceEnvName(tier || plan.tier, interval)];
    return String(schemaPriceId || envPriceId || '').trim() || undefined;
  }

  private async resolveSubscriptionStripePrice(params: {
    plan: PlanDocument;
    tier: string;
    interval: BillingInterval;
    amount: number;
  }): Promise<{
    priceId: string;
    providerAmount?: number;
    providerCurrency?: string;
    providerExchangeRate?: number;
    source: 'stable' | 'dynamic';
  }> {
    const stablePriceId = this.resolvePlanStripePriceId(params.plan, params.tier, params.interval);
    if (stablePriceId) {
      const priceDetails = await this.stripe.getPriceDetails(stablePriceId, params.amount);
      if (!priceDetails.success && isStrictProductionRuntime()) {
        throw new BadRequestException(priceDetails.error || 'Unable to verify configured Stripe price');
      }
      return {
        priceId: stablePriceId,
        providerAmount: priceDetails.providerAmount,
        providerCurrency: priceDetails.providerCurrency,
        providerExchangeRate: priceDetails.providerExchangeRate,
        source: 'stable',
      };
    }

    if (isStrictProductionRuntime()) {
      throw new BadRequestException(
        `Missing stable Stripe price ID for ${params.tier}/${params.interval}; configure plan.stripePriceIds or ${this.stableStripePriceEnvName(params.tier, params.interval)}`,
      );
    }

    const priceResult = await this.stripe.createPrice({
      amountDT: params.amount,
      interval: params.interval,
      currency: 'TND',
      productName: `${params.plan.name} Plan`,
      productDescription: `Subscription to ${params.plan.name} plan`,
    });
    if (!priceResult.success || !priceResult.priceId) throw new BadRequestException(priceResult.error);
    return {
      priceId: priceResult.priceId,
      providerAmount: priceResult.providerAmount,
      providerCurrency: priceResult.providerCurrency,
      providerExchangeRate: priceResult.providerExchangeRate,
      source: 'dynamic',
    };
  }

  private buildProviderMoneyMetadata(params: {
    providerAmount?: number;
    providerCurrency?: string;
    providerExchangeRate?: number;
  }): Record<string, any> {
    const metadata: Record<string, any> = {};
    if (params.providerAmount !== undefined) metadata.providerAmount = params.providerAmount;
    if (params.providerCurrency) metadata.providerCurrency = params.providerCurrency;
    if (params.providerExchangeRate !== undefined) metadata.providerExchangeRate = params.providerExchangeRate;
    return metadata;
  }

  private applyProviderMoneyToOrder(order: any, session: LinkCheckoutSession | any): void {
    const providerMoney = this.buildProviderMoneyMetadata({
      providerAmount: session?.providerAmount,
      providerCurrency: session?.providerCurrency,
      providerExchangeRate: session?.providerExchangeRate,
    });
    if (session?.providerAmount !== undefined) order.providerAmount = session.providerAmount;
    if (session?.providerCurrency) order.providerCurrency = session.providerCurrency;
    if (session?.providerExchangeRate !== undefined) order.providerExchangeRate = session.providerExchangeRate;
    order.metadata = {
      ...(order.metadata || {}),
      ...providerMoney,
    };
  }

  private getCommunityPriceType(community: CommunityDocument): string {
    return String(
      (community as any)?.pricing?.priceType ||
      (community as any)?.priceType ||
      'free',
    ).toLowerCase();
  }

  private getCommunityRecurringMetadata(community: CommunityDocument, amount: number): Record<string, any> {
    const priceType = this.getCommunityPriceType(community);
    const recurringInterval = String((community as any)?.pricing?.recurringInterval || (priceType === 'yearly' ? 'year' : 'month')).toLowerCase();
    const isRecurring = priceType === 'monthly' || priceType === 'yearly' || Boolean((community as any)?.pricing?.isRecurring);
    return {
      priceType,
      isRecurring,
      recurringInterval,
      billingInterval: recurringInterval === 'year' ? BillingInterval.YEAR : BillingInterval.MONTH,
      amount,
      currency: (community as any)?.pricing?.currency || (community as any)?.currency || 'TND',
    };
  }

  private normalizeStripeSubscriptionStatus(raw?: string): SubscriptionStatus {
    switch (String(raw || '').toLowerCase()) {
      case SubscriptionStatus.TRIALING:
        return SubscriptionStatus.TRIALING;
      case SubscriptionStatus.PAST_DUE:
      case 'unpaid':
        return SubscriptionStatus.PAST_DUE;
      case SubscriptionStatus.CANCELED:
      case 'cancelled':
        return SubscriptionStatus.CANCELED;
      case SubscriptionStatus.INCOMPLETE:
      case 'incomplete_expired':
        return SubscriptionStatus.INCOMPLETE;
      case SubscriptionStatus.ACTIVE:
      default:
        return SubscriptionStatus.ACTIVE;
    }
  }

  private isSuccessfulStripePayment(verify: { status?: string; subscriptionStatus?: string }): boolean {
    const status = String(verify.status || '').toLowerCase();
    const subscriptionStatus = String(verify.subscriptionStatus || '').toLowerCase();

    return ['paid', 'succeeded', 'complete'].includes(status)
      || [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING].includes(subscriptionStatus as SubscriptionStatus);
  }

  private getRedirectAllowlistPrefixes(): string[] {
    const envValue = String(process.env.PAYMENTS_REDIRECT_ALLOWLIST || '').trim();
    const parsed = envValue
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (parsed.length > 0) {
      return parsed;
    }

    const fallback = String(process.env.FRONTEND_URL || 'https://chabaqa.io').trim();
    return [fallback];
  }

  private resolveCheckoutRedirectUrl(defaultUrl: string, overrideUrl?: string): string {
    const normalizedOverride = typeof overrideUrl === 'string' ? overrideUrl.trim() : '';
    if (!normalizedOverride) {
      return defaultUrl;
    }

    try {
      const parsed = new URL(normalizedOverride);
      const absolute = parsed.toString();
      const allowedPrefixes = this.getRedirectAllowlistPrefixes();
      const isAllowed = allowedPrefixes.some((allowed) => {
        try {
          return parsed.origin === new URL(allowed).origin;
        } catch {
          return false;
        }
      });
      if (!isAllowed) {
        throw new BadRequestException(
          `Redirect URL is not allowed. Allowed prefixes: ${allowedPrefixes.join(', ')}`,
        );
      }
      return absolute;
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid redirect URL');
    }
  }

  private isStripeSessionPlaceholder(value: string): boolean {
    return value.toUpperCase().includes('CHECKOUT_SESSION_ID');
  }

  private normalizeClientContext(raw: any): Record<string, string> {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return {};
    }

    const entries = Object.entries(raw as Record<string, any>)
      .filter(([key]) => typeof key === 'string' && key.trim().length > 0)
      .slice(0, 20)
      .map(([key, value]) => [key, String(value ?? '')]);

    return Object.fromEntries(entries);
  }

  private normalizeIdempotencyKey(raw: any): string | undefined {
    const value = String(raw || '').trim();
    if (!value) return undefined;
    return value.slice(0, 128);
  }

  private getRequestIdempotencyKey(req: any): string | undefined {
    return this.normalizeIdempotencyKey(req?.headers?.['idempotency-key'] || req?.body?.idempotencyKey);
  }

  private async findReusablePendingContentOrder(params: {
    userId: string;
    contentType: TrackableContentType;
    contentId: string;
    idempotencyKey?: string;
  }): Promise<any | null> {
    if (!params.idempotencyKey) return null;
    return this.orderModel.findOne({
      buyerId: new Types.ObjectId(params.userId),
      contentType: params.contentType,
      contentId: params.contentId,
      paymentMethod: 'stripe',
      status: 'pending',
      idempotencyKey: params.idempotencyKey,
      'metadata.checkoutUrl': { $exists: true, $ne: '' },
    }).sort({ createdAt: -1 });
  }

  private buildReusableStripeInitResponse(order: any, scope: string, targetId: string, extra?: Record<string, any>) {
    return this.buildStripeInitResponse({
      scope,
      targetId,
      orderId: order._id.toString(),
      sessionId: order.paymentId,
      checkoutUrl: order.metadata.checkoutUrl,
      extra: { ...(extra || {}), idempotent: true },
    });
  }

  private async persistStripeCheckout(order: any, session: any): Promise<void> {
    order.paymentId = session.sessionId;
    if (session.paymentIntentId) order.paymentIntentId = session.paymentIntentId;
    order.paymentMethod = 'stripe';
    this.applyProviderMoneyToOrder(order, session);
    order.metadata = {
      ...(order.metadata || {}),
      providerCheckoutSessionId: session.sessionId,
      checkoutUrl: session.url,
    };
    await order.save();
  }

  private async findReusablePendingSubscriptionOrder(params: {
    userId: string;
    tier: string;
    billingInterval: BillingInterval;
    provider: 'stripe';
    idempotencyKey?: string;
  }): Promise<any | null> {
    const baseQuery: Record<string, any> = {
      buyerId: new Types.ObjectId(params.userId),
      creatorId: new Types.ObjectId(params.userId),
      contentType: TrackableContentType.SUBSCRIPTION,
      contentId: params.tier,
      status: 'pending',
      paymentMethod: params.provider,
      'metadata.provider': params.provider,
      'metadata.billingInterval': params.billingInterval,
    };

    if (params.idempotencyKey) {
      const keyedOrder = await this.orderModel.findOne({
        ...baseQuery,
        'metadata.idempotencyKey': params.idempotencyKey,
      }).sort({ createdAt: -1 });
      if (keyedOrder) return keyedOrder;
    }

    return this.orderModel.findOne({
      ...baseQuery,
      paymentId: { $exists: true, $ne: null },
      createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) },
    }).sort({ createdAt: -1 });
  }

  private buildStripeInitResponse(params: {
    scope: string;
    targetId: string;
    orderId: string;
    sessionId?: string;
    checkoutUrl?: string;
    extra?: Record<string, any>;
  }) {
    return {
      checkoutUrl: params.checkoutUrl,
      sessionId: params.sessionId,
      orderId: params.orderId,
      provider: 'stripe',
      scope: params.scope,
      targetId: params.targetId,
      ...(params.extra || {}),
    };
  }

  private buildPendingFulfillmentMetadata(base?: Record<string, any>): Record<string, any> {
    return {
      ...(base || {}),
      fulfillmentStatus: 'pending',
      fulfillmentUpdatedAt: new Date().toISOString(),
    };
  }

  private resolveAffiliateAttribution(req: any): Record<string, any> {
    const { clickId } = this.affiliateAttributionService.resolveAttributionFromRequest(req);
    return clickId ? { affiliateClickId: clickId } : {};
  }

  private async claimWebhookEvent(
    provider: string,
    eventId: string,
    eventType: string,
  ): Promise<'claimed' | 'duplicate'> {
    if (!eventId) {
      return 'claimed';
    }

    const now = new Date();
    try {
      const result: any = await this.processedWebhookEventModel.updateOne(
        {
          provider,
          eventId,
          $or: [
            { status: { $exists: false }, processedAt: { $exists: false } },
            { status: ProcessedWebhookEventStatus.FAILED },
          ],
        },
        {
          $set: {
            eventType,
            status: ProcessedWebhookEventStatus.PROCESSING,
            claimedAt: now,
            error: undefined,
            metadata: { retriedAt: now },
          },
          $unset: { failedAt: '' },
          $setOnInsert: {
            provider,
            eventId,
          },
        },
        { upsert: true },
      );

      if (result?.upsertedCount === 1 || result?.modifiedCount === 1) {
        return 'claimed';
      }

      const existing = await this.processedWebhookEventModel.findOne({ provider, eventId }).lean();
      return existing ? 'duplicate' : 'claimed';
    } catch (error: any) {
      if (error?.code === 11000) {
        return 'duplicate';
      }
      throw error;
    }
  }

  private async markWebhookEventProcessed(
    provider: string,
    eventId: string,
    eventType: string,
  ): Promise<void> {
    if (!eventId) {
      return;
    }

    try {
      await this.processedWebhookEventModel.updateOne(
        { provider, eventId },
        {
          $set: {
            provider,
            eventId,
            eventType,
            status: ProcessedWebhookEventStatus.PROCESSED,
            processedAt: new Date(),
          },
        },
        { upsert: true },
      );
    } catch (error: any) {
      // Concurrent webhook deliveries can race between the duplicate check and insert.
      // Treat duplicate-key as already processed so payment providers do not retry forever.
      if (error?.code !== 11000) {
        throw error;
      }
    }
  }

  private async markWebhookEventFailed(
    provider: string,
    eventId: string,
    eventType: string,
    error: any,
  ): Promise<void> {
    if (!eventId) return;

    await this.processedWebhookEventModel.updateOne(
      { provider, eventId },
      {
        $set: {
          provider,
          eventId,
          eventType,
          status: ProcessedWebhookEventStatus.FAILED,
          failedAt: new Date(),
          error: error?.message || String(error || 'Webhook processing failed'),
        },
      },
      { upsert: true },
    );
  }

  private async auditPaymentEvent(
    entry: {
      orderId?: string;
      eventType: string;
      provider?: string;
      eventId?: string;
      paymentMethod?: string;
      previousStatus?: string;
      nextStatus?: string;
      reason?: string;
      error?: string;
      metadata?: Record<string, any>;
    },
    session: any = null,
  ): Promise<void> {
    await this.paymentAuditService.log(entry, session);
  }

  private async enrichOrderDetails(order: any) {
    const contentType = order.contentType;
    const contentId = order.contentId;
    let contentTitle = '';
    let communitySlug = '';
    let creatorSlug = '';
    let contentIdRaw = contentId;

    try {
      let communityId = order.communityId;
      let creatorId = order.creatorId;

      // 1. Resolve Content & Links
      if (contentType === TrackableContentType.COURSE) {
        const course = await this.coursModel.findById(contentId).select('titre communityId creatorId id').lean();
        if (course) {
          contentTitle = (course as any).titre;
          communityId = (course as any).communityId;
          creatorId = (course as any).creatorId;
          // Use string ID if available for URL consistency
          contentIdRaw = (course as any).id || (course as any)._id.toString();
        }
      } else if (contentType === 'chapter') { // ADDED: Chapter Support
        // Find course containing this chapter
        // Note: contentId here is chapterId
        const course = await this.coursModel.findOne({ 'sections.chapitres.id': contentId }).select('titre communityId creatorId id sections').lean();
        if (course) {
           // Find chapter details
           let chapterTitle = 'Paid Chapter';
           (course as any).sections.forEach(s => {
             const c = s.chapitres.find(ch => ch.id === contentId);
             if (c) chapterTitle = c.titre;
           });
           
           contentTitle = `${(course as any).titre} - ${chapterTitle}`;
           communityId = (course as any).communityId;
           creatorId = (course as any).creatorId;
           // We might want to link back to the course page
           contentIdRaw = (course as any).id || (course as any)._id.toString();
        }
      } else if (contentType === TrackableContentType.COMMUNITY) {
        communityId = contentId;
        const comm = await this.communityModel.findById(contentId).select('name createur').lean();
        if (comm) {
          contentTitle = (comm as any).name;
          creatorId = (comm as any).createur;
        }
      } else if (contentType === TrackableContentType.CHALLENGE) {
        const challenge = await this.challengeModel.findById(contentId).select('title communityId creatorId').lean();
        if (challenge) {
          contentTitle = (challenge as any).title;
          communityId = (challenge as any).communityId;
          creatorId = (challenge as any).creatorId;
        }
      } else if (contentType === TrackableContentType.EVENT) {
        const event = await this.eventModel.findById(contentId).select('title communityId creatorId').lean();
        if (event) {
          contentTitle = (event as any).title;
          communityId = (event as any).communityId;
          creatorId = (event as any).creatorId;
        }
      } else if (contentType === TrackableContentType.PRODUCT) {
        const product = await this.productModel.findById(contentId).select('title name communityId creatorId').lean();
        if (product) {
          contentTitle = (product as any).title || (product as any).name;
          communityId = (product as any).communityId;
          creatorId = (product as any).creatorId;
        }
      } else if (contentType === TrackableContentType.SESSION) {
        const session = await this.sessionModel.findById(contentId).select('title communityId creatorId').lean();
        if (session) {
          contentTitle = (session as any).title;
          communityId = (session as any).communityId;
          creatorId = (session as any).creatorId;
        }
      }

      // 2. Fetch Community Slug
      if (communityId) {
        const comm = await this.communityModel.findById(communityId).select('slug').lean();
        if (comm) communitySlug = (comm as any).slug;
      }

      // 3. Fetch Creator Slug
      if (creatorId) {
        const user = await this.userModel.findById(creatorId).select('name').lean();
        if (user && (user as any).name) {
          // Simple slugify: lowercase, replace spaces with dash, remove non-alphanumeric
          creatorSlug = (user as any).name.toString().toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '');
        }
      }

    } catch (e) {
      this.logger.warn(`Error enriching order details: ${e.message}`);
    }

    return {
      contentTitle,
      communitySlug,
      creatorSlug,
      targetId: contentIdRaw
    };
  }

  private async enrichManualOrdersForDashboard(orders: any[]) {
    const inputOrders = orders || [];
    const idsByType = new Map<string, Set<string>>();
    const addId = (type: string, id: any) => {
      const value = id ? String(id) : '';
      if (!value || !Types.ObjectId.isValid(value)) return;
      if (!idsByType.has(type)) idsByType.set(type, new Set());
      idsByType.get(type)!.add(value);
    };

    for (const order of inputOrders) {
      addId(String((order as any)?.contentType || ''), (order as any)?.contentId);
    }

    const toObjectIds = (values: Set<string> | undefined) => Array.from(values || []).map((id) => new Types.ObjectId(id));
    const [courses, challenges, sessions, products, events, communitiesByContent] = await Promise.all([
      this.coursModel.find({ _id: { $in: toObjectIds(idsByType.get(TrackableContentType.COURSE)) } }).select('titre communityId').lean(),
      this.challengeModel.find({ _id: { $in: toObjectIds(idsByType.get(TrackableContentType.CHALLENGE)) } }).select('title titre name communityId').lean(),
      this.sessionModel.find({ _id: { $in: toObjectIds(idsByType.get(TrackableContentType.SESSION)) } }).select('title name communityId').lean(),
      this.productModel.find({ _id: { $in: toObjectIds(idsByType.get(TrackableContentType.PRODUCT)) } }).select('title name communityId').lean(),
      this.eventModel.find({ _id: { $in: toObjectIds(idsByType.get(TrackableContentType.EVENT)) } }).select('title name communityId').lean(),
      this.communityModel.find({ _id: { $in: toObjectIds(idsByType.get(TrackableContentType.COMMUNITY)) } }).select('name slug').lean(),
    ]);

    const byId = (items: any[]) => new Map(items.map((item) => [String(item._id), item]));
    const lookupByType: Record<string, Map<string, any>> = {
      [TrackableContentType.COURSE]: byId(courses),
      [TrackableContentType.CHALLENGE]: byId(challenges),
      [TrackableContentType.SESSION]: byId(sessions),
      [TrackableContentType.PRODUCT]: byId(products),
      [TrackableContentType.EVENT]: byId(events),
      [TrackableContentType.COMMUNITY]: byId(communitiesByContent),
    };

    const communityIds = new Set<string>();
    for (const order of inputOrders) {
      const explicit = (order as any)?.communityId ? String((order as any).communityId) : '';
      if (Types.ObjectId.isValid(explicit)) communityIds.add(explicit);

      const content = lookupByType[String((order as any)?.contentType || '')]?.get(String((order as any)?.contentId || ''));
      const contentCommunityId = content?.communityId ? String(content.communityId) : '';
      if (Types.ObjectId.isValid(contentCommunityId)) communityIds.add(contentCommunityId);
    }
    const communities = await this.communityModel
      .find({ _id: { $in: Array.from(communityIds).map((id) => new Types.ObjectId(id)) } })
      .select('name slug')
      .lean();
    const communityById = byId(communities);

    const items = inputOrders.map((order) => {
        const contentType = (order as any)?.contentType;
        const contentId = (order as any)?.contentId;

        let contentTitle: string | null = null;
        let contentCommunityId: string | null = null;

        const content = lookupByType[String(contentType || '')]?.get(String(contentId || ''));
        if (contentType === TrackableContentType.COURSE) {
          contentTitle = content?.titre || null;
        } else if (contentType === TrackableContentType.CHALLENGE) {
          contentTitle = content?.title || content?.titre || content?.name || null;
        } else if (
          contentType === TrackableContentType.SESSION ||
          contentType === TrackableContentType.PRODUCT ||
          contentType === TrackableContentType.EVENT
        ) {
          contentTitle = content?.title || content?.name || null;
        } else if (contentType === TrackableContentType.COMMUNITY) {
          contentTitle = content?.name || null;
        }
        contentCommunityId = contentType === TrackableContentType.COMMUNITY
          ? (contentId ? String(contentId) : null)
          : (content?.communityId ? String(content.communityId) : null);

        let communityInfo: any = null;
        const communityId = contentCommunityId || (order as any)?.communityId?.toString?.() || (order as any)?.communityId;
        if (communityId) {
          const comm = communityById.get(String(communityId));
          if (comm) {
            communityInfo = {
              _id: String((comm as any)._id),
              name: (comm as any).name,
              slug: (comm as any).slug,
            };
          }
        }

        return {
          ...(order?.toObject ? order.toObject() : order),
          contentTitle,
          community: communityInfo,
        };
      });

    return items;
  }

  private getFrontendBaseUrl(): string {
    const base = (process.env.FRONTEND_URL || 'https://chabaqa.com').trim();
    return base.replace(/\/+$/, '');
  }

  private buildInviteLink(inviteCode: string): string {
    return `${this.getFrontendBaseUrl()}/invite/${encodeURIComponent(inviteCode)}`;
  }

  private normalizeInviteCode(value?: string): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private async generateUniqueInviteCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let attempt = 0; attempt < 12; attempt++) {
      let code = '';
      for (let i = 0; i < 12; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const exists = await this.communityModel.exists({ inviteCode: code });
      if (!exists) {
        return code;
      }
    }
    throw new InternalServerErrorException('Unable to generate unique invite code');
  }

  private async ensurePrivateInviteData(community: CommunityDocument): Promise<void> {
    if (!community.isPrivate) {
      return;
    }

    let changed = false;
    if (!community.inviteCode) {
      community.inviteCode = await this.generateUniqueInviteCode();
      changed = true;
    }

    const canonicalInviteLink = this.buildInviteLink(community.inviteCode);
    if (community.inviteLink !== canonicalInviteLink) {
      community.inviteLink = canonicalInviteLink;
      changed = true;
    }

    if (changed) {
      await community.save();
    }
  }

  private async assertPrivateInviteAccess(
    community: CommunityDocument,
    inviteCode?: string,
  ): Promise<string | undefined> {
    if (!community.isPrivate) {
      return undefined;
    }

    await this.ensurePrivateInviteData(community);
    const normalizedInviteCode = this.normalizeInviteCode(inviteCode);
    if (!normalizedInviteCode || normalizedInviteCode !== community.inviteCode) {
      throw new ForbiddenException(
        'Cette communauté est privée. Vous devez utiliser un lien d\'invitation valide.',
      );
    }

    return normalizedInviteCode;
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get order state (including fulfillment status)' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getOrderState(@Param('orderId') orderId: string, @Req() req: any) {
    const userId = (req.user?._id || req.user?.sub || '').toString();
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid orderId');
    }

    const order = await this.orderModel.findById(orderId).lean();
    if (!order) {
      throw new BadRequestException('Order not found');
    }

    const isBuyer = String((order as any)?.buyerId || '') === userId;
    const isCreator = String((order as any)?.creatorId || '') === userId;
    if (!isBuyer && !isCreator) {
      throw new ForbiddenException('You are not allowed to view this order');
    }

    const enriched = await this.enrichOrderDetails(order);
    return {
      success: true,
      data: {
        orderId: String((order as any)._id),
        status: (order as any).status,
        paymentMethod: (order as any).paymentMethod,
        paymentId: (order as any).paymentId,
        contentType: (order as any).contentType,
        contentId: (order as any).contentId,
        amountDT: (order as any).amountDT,
        businessAmount: (order as any).amountDT,
        businessCurrency: (order as any).businessCurrency || 'TND',
        providerAmount: (order as any).providerAmount,
        providerCurrency: (order as any).providerCurrency,
        providerExchangeRate: (order as any).providerExchangeRate,
        metadata: (order as any).metadata || {},
        ...enriched,
      },
    };
  }

  @Post('order/:orderId/refund')
  @ApiOperation({ summary: 'Request/process a full refund for a paid Stripe order' })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  async refundOrder(
    @Param('orderId') orderId: string,
    @Body() body: { reason?: string } = {},
    @Req() req: any,
  ) {
    const userId = (req.user?._id || req.user?.sub || '').toString();
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid orderId');
    }

    const order = await this.orderModel.findById(orderId).exec();
    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if ((order as any).status !== 'paid') {
      throw new BadRequestException('Only paid orders can be refunded');
    }

    const paymentId = String((order as any).paymentIntentId || '');
    if (!paymentId) {
      throw new BadRequestException('Order has no Stripe payment intent to refund');
    }

    const provider = String((order as any).paymentMethod || 'stripe').toLowerCase();
    if (provider && provider !== 'stripe' && provider !== 'stripe-link') {
      throw new BadRequestException('Automatic refunds are currently supported for Stripe orders only');
    }

    const reason = String(body?.reason || 'refund_requested').slice(0, 300);
    const previousStatus = (order as any).status;
    const refund = await this.stripe.refundPayment(paymentId);
    if (!refund.success) {
      await this.auditPaymentEvent({
        orderId,
        eventType: 'refund_failed',
        provider: 'stripe',
        paymentMethod: (order as any).paymentMethod,
        previousStatus,
        nextStatus: previousStatus,
        reason,
        error: refund.error,
      });
      throw new BadRequestException(refund.error || 'Refund failed');
    }

    (order as any).status = 'refunded';
    (order as any).metadata = {
      ...((order as any).metadata || {}),
      refund: {
        reason,
        requestedBy: userId,
        refundedAt: new Date().toISOString(),
      },
    };
    await order.save();
    await this.entitlementService.revokeForOrder(orderId, reason);

    await this.affiliateCommissionService.onOrderRefunded(orderId).catch((error) => {
      this.logger.warn(`Affiliate refund reversal failed for order ${orderId}: ${error?.message || error}`);
    });
    await this.auditPaymentEvent({
      orderId,
      eventType: 'refund_completed',
      provider: 'stripe',
      paymentMethod: (order as any).paymentMethod,
      previousStatus,
      nextStatus: 'refunded',
      reason,
    });

    const creatorId = (order as any).creatorId?.toString?.();
    if (creatorId) {
      void this.creatorIntegrationsService.emit(creatorId, 'purchase.refunded', {
        orderId: String((order as any)._id),
        contentId: String((order as any).contentId || (order as any).metadata?.contentId || ''),
        contentType: String((order as any).contentType || ''),
        amount: Number((order as any).amountDT || 0),
        currency: String((order as any).currency || 'TND'),
        buyerId: String((order as any).buyerId || ''),
        refundedAt: new Date().toISOString(),
        source: 'admin_refund',
      }).catch((error) => this.logger.warn(`Refund integration event failed: ${error?.message || error}`));
    }

    return {
      success: true,
      data: { orderId, status: 'refunded' },
    };
  }

  /** Reconcile a full refund completed directly in Stripe.  This is separate
   * from the admin refund route so Stripe Dashboard actions cannot leave local
   * entitlements, affiliate commissions, or creator automations stale. */
  private async reconcileStripeChargeRefund(charge: any): Promise<void> {
    if (!charge?.refunded) return;
    const paymentIntentId = String(charge.payment_intent || charge.paymentIntentId || '');
    if (!paymentIntentId) return;
    const order: any = await this.orderModel.findOne({ paymentIntentId }).exec();
    if (!order || order.status === 'refunded') return;
    if (order.status !== 'paid') {
      this.logger.warn(`Ignoring Stripe refund for non-paid order ${String(order._id)}`);
      return;
    }

    order.status = 'refunded';
    order.metadata = {
      ...(order.metadata || {}),
      refund: {
        source: 'stripe_charge_refunded_webhook',
        refundedAt: new Date().toISOString(),
        providerChargeId: String(charge.id || ''),
      },
    };
    await order.save();
    await this.entitlementService.revokeForOrder(String(order._id), 'stripe_charge_refunded_webhook');
    await this.affiliateCommissionService.onOrderRefunded(String(order._id)).catch((error) => {
      this.logger.warn(`Affiliate refund reversal failed for Stripe webhook order ${String(order._id)}: ${error?.message || error}`);
    });
    await this.auditPaymentEvent({
      orderId: String(order._id),
      eventType: 'refund_completed',
      provider: 'stripe',
      paymentMethod: order.paymentMethod,
      previousStatus: 'paid',
      nextStatus: 'refunded',
      reason: 'stripe_charge_refunded_webhook',
    });
    const creatorId = order.creatorId?.toString?.();
    if (creatorId) {
      void this.creatorIntegrationsService.emit(creatorId, 'purchase.refunded', {
        orderId: String(order._id),
        contentId: String(order.contentId || order.metadata?.contentId || ''),
        contentType: String(order.contentType || ''),
        amount: Number(order.amountDT || 0),
        currency: String(order.currency || 'TND'),
        buyerId: String(order.buyerId || ''),
        refundedAt: new Date().toISOString(),
        source: 'stripe_charge_refunded_webhook',
      }).catch((error) => this.logger.warn(`Stripe refund integration event failed: ${error?.message || error}`));
    }
  }

  // ==================== STRIPE LINK ENDPOINTS ====================

  @Post('stripe-link/init/community')
  @ApiOperation({ summary: 'Initiate Stripe Link payment for community membership' })
  @ApiQuery({ name: 'promoCode', required: false })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async initStripeLinkCommunityPayment(
    @Body('communityId') communityId: string,
    @Body('inviteCode') inviteCode: string | undefined,
    @Req() req: any,
    @Body('channel') channelRaw?: string,
    @Body('successRedirectUrl') successRedirectUrl?: string,
    @Body('cancelRedirectUrl') cancelRedirectUrl?: string,
    @Body('clientContext') clientContextRaw?: Record<string, any>,
    @Query('promoCode') promoCode?: string,
  ) {
    const userId = (req.user?._id || req.user?.sub || '').toString();
    const channel = this.normalizePaymentChannel(channelRaw);
    const clientContext = this.normalizeClientContext(clientContextRaw);
    const community = await this.communityModel.findById(communityId);
    if (!community) throw new BadRequestException('Community not found');
    const validatedInviteCode = await this.assertPrivateInviteAccess(community, inviteCode);

    const price = Number((community as any).pricing?.price ?? community.fees_of_join ?? (community as any).price ?? 0);
    const businessCurrency = this.normalizeCatalogCurrency((community as any).pricing?.currency || (community as any).currency);
    if (price <= 0) throw new BadRequestException('Free community');

    let amount = price;
    let discountDT = 0;
    let appliedCode: string | undefined;
    if (promoCode) {
      const buyer = await this.userModel.findById(userId).select('email');
      const promo = await this.promoService.validateAndApply(promoCode, price, TrackableContentType.COMMUNITY, community._id.toString(), (buyer as any)?.email);
      if (promo.valid) {
        amount = promo.finalAmountDT;
        discountDT = promo.discountDT;
        appliedCode = promo.appliedCode;
      }
    }

    const breakdown = await this.feeService.calculateForAmount(amount, community.createur.toString());
    const idempotencyKey = this.getRequestIdempotencyKey(req);
    const reusableOrder = await this.findReusablePendingContentOrder({
      userId, contentType: TrackableContentType.COMMUNITY, contentId: community._id.toString(), idempotencyKey,
    });
    if (reusableOrder) return this.buildReusableStripeInitResponse(reusableOrder, 'community', communityId, { channel });
    const recurringMetadata = this.getCommunityRecurringMetadata(community, amount);
    const metadata: Record<string, any> = {
      channel,
      ...recurringMetadata,
      provider: 'stripe',
      ...(Object.keys(clientContext).length > 0 ? { clientContext } : {}),
      ...this.resolveAffiliateAttribution(req),
    };
    if (validatedInviteCode) {
      metadata.inviteCode = validatedInviteCode;
    }
    const pendingOrder = await this.orderModel.create({
      buyerId: new Types.ObjectId(userId),
      creatorId: community.createur,
      communityId: community._id,
      contentType: TrackableContentType.COMMUNITY,
      contentId: community._id.toString(),
      amountDT: breakdown.amountDT,
      businessCurrency,
      platformPercent: breakdown.platformPercent,
      platformFixedDT: breakdown.platformFixedDT,
      platformFeeDT: breakdown.platformFeeDT,
      creatorNetDT: breakdown.creatorNetDT,
      promoCode: appliedCode,
      discountDT,
      status: 'pending',
      paymentMethod: 'stripe',
      idempotencyKey,
      metadata: this.buildPendingFulfillmentMetadata(metadata),
    });

    const defaultSuccessUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?scope=community&id=${communityId}&provider=stripe&sessionId={CHECKOUT_SESSION_ID}`;
    const defaultFailUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-failed?scope=community&id=${communityId}&provider=stripe`;
    const successUrl = this.resolveCheckoutRedirectUrl(defaultSuccessUrl, successRedirectUrl);
    const failUrl = this.resolveCheckoutRedirectUrl(defaultFailUrl, cancelRedirectUrl);

    console.log('[Stripe Init] Generated Success URL:', successUrl);

    const user = await this.userModel.findById(userId).select('email name');
    const stripeMetadata = {
      userId,
      contentType: 'community',
      contentId: communityId,
      orderId: pendingOrder._id.toString(),
      channel,
      ...recurringMetadata,
      provider: 'stripe',
      ...(Object.keys(clientContext).length > 0 ? { clientContext: JSON.stringify(clientContext) } : {}),
      ...(validatedInviteCode ? { inviteCode: validatedInviteCode } : {}),
    };
    let session: any;
    if (recurringMetadata.isRecurring) {
      const priceResult = await this.stripe.createPrice({
        amountDT: amount,
        currency: businessCurrency,
        interval: recurringMetadata.billingInterval,
        productName: `${community.name} membership`,
        productDescription: `Recurring community membership for ${community.name}`,
      });
      if (!priceResult.success) throw new BadRequestException(priceResult.error);
      session = await this.stripe.createLinkSubscriptionSession({
        priceId: priceResult.priceId!,
        successUrl,
        cancelUrl: failUrl,
        customerEmail: user?.email,
        metadata: {
          ...stripeMetadata,
          providerPriceId: priceResult.priceId!,
        },
        trialPeriodDays: Number((community as any)?.pricing?.freeTrialDays || 0) || undefined,
      });
      pendingOrder.metadata = {
        ...(pendingOrder.metadata || {}),
        providerPriceId: priceResult.priceId!,
      };
    } else {
      session = await this.stripe.createLinkCheckoutSession({
        amountDT: amount,
        successUrl,
        cancelUrl: failUrl,
        customerEmail: user?.email,
        metadata: stripeMetadata,
        lineItems: [{
          name: `Join ${community.name}`,
          description: `Community membership for ${community.name}`,
         amount: amount,
          quantity: 1
        }]
      });
    }

    if (!session.success) throw new BadRequestException(session.error);

    await this.persistStripeCheckout(pendingOrder, session);

    return this.buildStripeInitResponse({
      scope: 'community',
      targetId: communityId,
      orderId: pendingOrder._id.toString(),
      sessionId: session.sessionId,
      checkoutUrl: session.url,
      extra: {
        channel,
      },
    });
  }

  @Post('stripe-link/init/course')
  @ApiOperation({ summary: 'Initiate Stripe Link payment for course enrollment' })
  @ApiQuery({ name: 'promoCode', required: false })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async initStripeLinkCoursePayment(
    @Body('courseId') courseId: string,
    @Req() req: any,
    @Body('channel') channelRaw?: string,
    @Body('successRedirectUrl') successRedirectUrl?: string,
    @Body('cancelRedirectUrl') cancelRedirectUrl?: string,
    @Body('clientContext') clientContextRaw?: Record<string, any>,
    @Query('promoCode') promoCode?: string,
  ) {
    const userId = (req.user?._id || req.user?.sub || '').toString();
    const channel = this.normalizePaymentChannel(channelRaw);
    const clientContext = this.normalizeClientContext(clientContextRaw);
    let cours: CoursDocument | null = null;
    if (Types.ObjectId.isValid(courseId)) {
      cours = await this.coursModel.findById(courseId);
    }
    if (!cours) {
      cours = await this.coursModel.findOne({ id: courseId });
    }
    if (!cours) throw new BadRequestException('Course not found');
    const courseObjectId = cours._id;
    const coursePublicId = cours.id || courseObjectId.toString();

    const price = cours.prix || 0;
    if (price <= 0) throw new BadRequestException('Free course');

    const courseCurrency = ((cours as any)?.devise || (cours as any)?.pricing?.currency || 'TND').toString();

    let amount = price;
    let discountDT = 0;
    let appliedCode: string | undefined;
    if (promoCode) {
      const buyer = await this.userModel.findById(userId).select('email');
      const promo = await this.promoService.validateAndApply(promoCode, price, TrackableContentType.COURSE, cours._id.toString(), (buyer as any)?.email);
      if (promo.valid) {
        amount = promo.finalAmountDT;
        discountDT = promo.discountDT;
        appliedCode = promo.appliedCode;
      }
    }

    const breakdown = await this.feeService.calculateForAmount(amount, cours.creatorId.toString());
    const idempotencyKey = this.getRequestIdempotencyKey(req);
    const reusableOrder = await this.findReusablePendingContentOrder({
      userId, contentType: TrackableContentType.COURSE, contentId: cours._id.toString(), idempotencyKey,
    });
    if (reusableOrder) return this.buildReusableStripeInitResponse(reusableOrder, 'course', coursePublicId, { channel });
    const pendingOrder = await this.orderModel.create({
      buyerId: new Types.ObjectId(userId),
      creatorId: cours.creatorId,
      contentType: TrackableContentType.COURSE,
      contentId: cours._id.toString(),
      amountDT: breakdown.amountDT,
      platformPercent: breakdown.platformPercent,
      platformFixedDT: breakdown.platformFixedDT,
      platformFeeDT: breakdown.platformFeeDT,
      creatorNetDT: breakdown.creatorNetDT,
      promoCode: appliedCode,
      discountDT,
      status: 'pending',
      paymentMethod: 'stripe',
      idempotencyKey,
      metadata: this.buildPendingFulfillmentMetadata({
        channel,
        ...(Object.keys(clientContext).length > 0 ? { clientContext } : {}),
        ...this.resolveAffiliateAttribution(req),
      }),
    });

    const defaultSuccessUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?scope=course&id=${coursePublicId}&provider=stripe&sessionId={CHECKOUT_SESSION_ID}`;
    const defaultFailUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-failed?scope=course&id=${courseId}&provider=stripe`;
    const successUrl = this.resolveCheckoutRedirectUrl(defaultSuccessUrl, successRedirectUrl);
    const failUrl = this.resolveCheckoutRedirectUrl(defaultFailUrl, cancelRedirectUrl);

    const user = await this.userModel.findById(userId).select('email name');
    const session = await this.stripe.createLinkCheckoutSession({
      amountDT: amount,
      currency: courseCurrency.toLowerCase(),
      successUrl,
      cancelUrl: failUrl,
      customerEmail: user?.email,
      metadata: {
        userId,
        contentType: 'course',
        contentId: courseId,
        orderId: pendingOrder._id.toString(),
        channel,
        ...(Object.keys(clientContext).length > 0 ? { clientContext: JSON.stringify(clientContext) } : {}),
      },
      lineItems: [{
        name: cours.titre,
        description: cours.description,
        amount: amount,
        quantity: 1
      }]
    });

    if (!session.success) throw new BadRequestException(session.error);

    await this.persistStripeCheckout(pendingOrder, session);

    return this.buildStripeInitResponse({
      scope: 'course',
      targetId: coursePublicId,
      orderId: pendingOrder._id.toString(),
      sessionId: session.sessionId,
      checkoutUrl: session.url,
      extra: {
        channel,
      },
    });
  }

  @Post('stripe-link/init/challenge')
  @ApiOperation({ summary: 'Initiate Stripe Link payment for challenge participation' })
  @ApiQuery({ name: 'promoCode', required: false })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async initStripeLinkChallengePayment(
    @Body('challengeId') challengeId: string,
    @Req() req: any,
    @Body('channel') channelRaw?: string,
    @Body('successRedirectUrl') successRedirectUrl?: string,
    @Body('cancelRedirectUrl') cancelRedirectUrl?: string,
    @Body('clientContext') clientContextRaw?: Record<string, any>,
    @Query('promoCode') promoCode?: string,
  ) {
    const userId = (req.user?._id || req.user?.sub || '').toString();
    const channel = this.normalizePaymentChannel(channelRaw);
    const clientContext = this.normalizeClientContext(clientContextRaw);
    const challenge = await this.challengeModel.findOne({ id: challengeId }) || await this.challengeModel.findById(challengeId);
    if (!challenge) throw new BadRequestException('Challenge not found');

    const pricing = (challenge as any)?.pricing || {};
    const depositAmount = pricing.depositAmount ?? (challenge as any)?.depositAmount ?? 0;
    const participationFee = pricing.participationFee ?? pricing.price ?? (challenge as any)?.participationFee ?? 0;
    const shouldUseDeposit = Boolean(pricing.depositRequired || depositAmount > 0);
    const baseAmount = shouldUseDeposit ? depositAmount : participationFee;
    if (!baseAmount || baseAmount <= 0) throw new BadRequestException('Free challenge');
    const challengeCurrency = (pricing.currency || (challenge as any)?.currency || 'TND').toString();

    let amount = baseAmount;
    let discountDT = 0;
    let appliedCode: string | undefined;
    if (promoCode) {
      const buyer = await this.userModel.findById(userId).select('email');
      const promo = await this.promoService.validateAndApply(promoCode, baseAmount, TrackableContentType.CHALLENGE, challenge._id.toString(), (buyer as any)?.email);
      if (promo.valid) {
        amount = promo.finalAmountDT;
        discountDT = promo.discountDT;
        appliedCode = promo.appliedCode;
      }
    }

    const breakdown = await this.feeService.calculateForAmount(amount, challenge.creatorId.toString());
    const idempotencyKey = this.getRequestIdempotencyKey(req);
    const reusableOrder = await this.findReusablePendingContentOrder({
      userId, contentType: TrackableContentType.CHALLENGE, contentId: challenge._id.toString(), idempotencyKey,
    });
    if (reusableOrder) return this.buildReusableStripeInitResponse(reusableOrder, 'challenge', challengeId, { channel });
    const pendingOrder = await this.orderModel.create({
      buyerId: new Types.ObjectId(userId),
      creatorId: challenge.creatorId,
      contentType: TrackableContentType.CHALLENGE,
      contentId: challenge._id.toString(),
      amountDT: breakdown.amountDT,
      platformPercent: breakdown.platformPercent,
      platformFixedDT: breakdown.platformFixedDT,
      platformFeeDT: breakdown.platformFeeDT,
      creatorNetDT: breakdown.creatorNetDT,
      promoCode: appliedCode,
      discountDT,
      status: 'pending',
      paymentMethod: 'stripe',
      idempotencyKey,
      metadata: this.buildPendingFulfillmentMetadata({
        channel,
        ...(Object.keys(clientContext).length > 0 ? { clientContext } : {}),
        ...this.resolveAffiliateAttribution(req),
      }),
    });

    const defaultSuccessUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?scope=challenge&id=${challengeId}&provider=stripe&sessionId={CHECKOUT_SESSION_ID}`;
    const defaultFailUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-failed?scope=challenge&id=${challengeId}&provider=stripe`;
    const successUrl = this.resolveCheckoutRedirectUrl(defaultSuccessUrl, successRedirectUrl);
    const failUrl = this.resolveCheckoutRedirectUrl(defaultFailUrl, cancelRedirectUrl);

    const user = await this.userModel.findById(userId).select('email name');
    const session = await this.stripe.createLinkCheckoutSession({
      amountDT: amount,
      currency: challengeCurrency.toLowerCase(),
      successUrl,
      cancelUrl: failUrl,
      customerEmail: user?.email,
      metadata: {
        userId,
        contentType: 'challenge',
        contentId: challengeId,
        orderId: pendingOrder._id.toString(),
        channel,
        ...(Object.keys(clientContext).length > 0 ? { clientContext: JSON.stringify(clientContext) } : {}),
      },
      lineItems: [{
        name: challenge.title || 'Challenge',
        description: challenge.description,
        amount: amount,
        quantity: 1
      }]
    });

    if (!session.success) throw new BadRequestException(session.error);

    await this.persistStripeCheckout(pendingOrder, session);

    return this.buildStripeInitResponse({
      scope: 'challenge',
      targetId: challengeId,
      orderId: pendingOrder._id.toString(),
      sessionId: session.sessionId,
      checkoutUrl: session.url,
      extra: {
        channel,
      },
    });
  }

  @Post('stripe-link/init/event')
  @ApiOperation({ summary: 'Initiate Stripe Link payment for event ticket' })
  @ApiQuery({ name: 'promoCode', required: false })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async initStripeLinkEventPayment(
    @Body('eventId') eventId: string,
    @Body('ticketType') ticketType: string,
    @Req() req: any,
    @Body('specialRequests') specialRequests?: string,
    @Body('channel') channelRaw?: string,
    @Body('successRedirectUrl') successRedirectUrl?: string,
    @Body('cancelRedirectUrl') cancelRedirectUrl?: string,
    @Body('clientContext') clientContextRaw?: Record<string, any>,
    @Query('promoCode') promoCode?: string,
  ) {
    const userId = (req.user?._id || req.user?.sub || '').toString();
    const channel = this.normalizePaymentChannel(channelRaw);
    const clientContext = this.normalizeClientContext(clientContextRaw);
    const normalizedSpecialRequests = String(specialRequests || '').trim().slice(0, 1000);
    const event = await this.eventModel.findOne({ id: eventId }) || await this.eventModel.findById(eventId);
    if (!event) throw new BadRequestException('Event not found');
    const alreadyRegistered = (event.attendees || []).some((attendee: any) => attendee?.userId?.toString() === userId);
    if (alreadyRegistered) {
      throw new BadRequestException('Vous êtes déjà inscrit à cet événement');
    }

    const ticket = event.tickets.find(t => t.type === ticketType || t.id === ticketType);
    if (!ticket) throw new BadRequestException('Ticket type not found');

    const price = ticket.price || 0;
    if (price <= 0) throw new BadRequestException('Free ticket');
    const eventCurrency = ((event as any)?.pricing?.currency || (event as any)?.currency || 'TND').toString();

    let amount = price;
    let discountDT = 0;
    let appliedCode: string | undefined;
    if (promoCode) {
      const buyer = await this.userModel.findById(userId).select('email');
      const promo = await this.promoService.validateAndApply(promoCode, price, TrackableContentType.EVENT, event._id.toString(), (buyer as any)?.email);
      if (promo.valid) {
        amount = promo.finalAmountDT;
        discountDT = promo.discountDT;
        appliedCode = promo.appliedCode;
      }
    }

    const breakdown = await this.feeService.calculateForAmount(amount, event.creatorId.toString());
    const idempotencyKey = this.getRequestIdempotencyKey(req);
    const reusableOrder = await this.findReusablePendingContentOrder({
      userId, contentType: TrackableContentType.EVENT, contentId: event._id.toString(), idempotencyKey,
    });
    if (reusableOrder) return this.buildReusableStripeInitResponse(reusableOrder, 'event', eventId, { channel });
    const pendingOrder = await this.orderModel.create({
      buyerId: new Types.ObjectId(userId),
      creatorId: event.creatorId,
      contentType: TrackableContentType.EVENT,
      contentId: event._id.toString(),
      amountDT: breakdown.amountDT,
      platformPercent: breakdown.platformPercent,
      platformFixedDT: breakdown.platformFixedDT,
      platformFeeDT: breakdown.platformFeeDT,
      creatorNetDT: breakdown.creatorNetDT,
      promoCode: appliedCode,
      discountDT,
      status: 'pending',
      paymentMethod: 'stripe',
      idempotencyKey,
      metadata: this.buildPendingFulfillmentMetadata({
        ticketType,
        channel,
        ...(normalizedSpecialRequests ? { specialRequests: normalizedSpecialRequests } : {}),
        ...(Object.keys(clientContext).length > 0 ? { clientContext } : {}),
        ...this.resolveAffiliateAttribution(req),
      })
    });

    const defaultSuccessUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?scope=event&id=${eventId}&provider=stripe&sessionId={CHECKOUT_SESSION_ID}`;
    const defaultFailUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-failed?scope=event&id=${eventId}&provider=stripe`;
    const successUrl = this.resolveCheckoutRedirectUrl(defaultSuccessUrl, successRedirectUrl);
    const failUrl = this.resolveCheckoutRedirectUrl(defaultFailUrl, cancelRedirectUrl);

    const user = await this.userModel.findById(userId).select('email name');
    const session = await this.stripe.createLinkCheckoutSession({
      amountDT: amount,
      currency: eventCurrency.toLowerCase(),
      successUrl,
      cancelUrl: failUrl,
      customerEmail: user?.email,
      metadata: {
        userId,
        contentType: 'event',
        contentId: eventId,
        orderId: pendingOrder._id.toString(),
        ticketType,
        channel,
        ...(normalizedSpecialRequests ? { specialRequests: normalizedSpecialRequests } : {}),
        ...(Object.keys(clientContext).length > 0 ? { clientContext: JSON.stringify(clientContext) } : {}),
      },
      lineItems: [{
        name: event.title || 'Event Ticket',
        description: `${ticket.name} for ${event.title}`,
        amount: amount,
        quantity: 1
      }]
    });

    if (!session.success) throw new BadRequestException(session.error);

    await this.persistStripeCheckout(pendingOrder, session);

    return this.buildStripeInitResponse({
      scope: 'event',
      targetId: eventId,
      orderId: pendingOrder._id.toString(),
      sessionId: session.sessionId,
      checkoutUrl: session.url,
      extra: {
        channel,
      },
    });
  }

  @Post('stripe-link/init/product')
  @ApiOperation({ summary: 'Initiate Stripe Link payment for product' })
  @ApiQuery({ name: 'promoCode', required: false })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async initStripeLinkProductPayment(
    @Body('productId') productId: string,
    @Req() req: any,
    @Body('channel') channelRaw?: string,
    @Body('successRedirectUrl') successRedirectUrl?: string,
    @Body('cancelRedirectUrl') cancelRedirectUrl?: string,
    @Body('clientContext') clientContextRaw?: Record<string, any>,
    @Query('promoCode') promoCode?: string,
  ) {
    const userId = (req.user?._id || req.user?.sub || '').toString();
    const channel = this.normalizePaymentChannel(channelRaw);
    const clientContext = this.normalizeClientContext(clientContextRaw);
    const product = await this.productModel.findOne({ id: productId }) || await this.productModel.findById(productId);
    if (!product) throw new BadRequestException('Product not found');
    const existingPaidOrder = await this.findExistingPaidProductOrder(userId, product);
    if (existingPaidOrder) {
      throw new BadRequestException('Product already purchased. You already have lifetime access.');
    }

    const price = product.price || 0;
    const businessCurrency = this.normalizeCatalogCurrency((product as any).currency);
    if (price <= 0) throw new BadRequestException('Free product');

    let amount = price;
    let discountDT = 0;
    let appliedCode: string | undefined;
    if (promoCode) {
      const buyer = await this.userModel.findById(userId).select('email');
      const promo = await this.promoService.validateAndApply(promoCode, price, TrackableContentType.PRODUCT, product._id.toString(), (buyer as any)?.email);
      if (promo.valid) {
        amount = promo.finalAmountDT;
        discountDT = promo.discountDT;
        appliedCode = promo.appliedCode;
      }
    }

    const breakdown = await this.feeService.calculateForAmount(amount, product.creatorId.toString());
    const idempotencyKey = this.getRequestIdempotencyKey(req);
    const reusableOrder = await this.findReusablePendingContentOrder({
      userId, contentType: TrackableContentType.PRODUCT, contentId: product._id.toString(), idempotencyKey,
    });
    if (reusableOrder) return this.buildReusableStripeInitResponse(reusableOrder, 'product', productId, { channel });
    const pendingOrder = await this.orderModel.create({
      buyerId: new Types.ObjectId(userId),
      creatorId: product.creatorId,
      contentType: TrackableContentType.PRODUCT,
      contentId: product._id.toString(),
      amountDT: breakdown.amountDT,
      businessCurrency,
      platformPercent: breakdown.platformPercent,
      platformFixedDT: breakdown.platformFixedDT,
      platformFeeDT: breakdown.platformFeeDT,
      creatorNetDT: breakdown.creatorNetDT,
      promoCode: appliedCode,
      discountDT,
      status: 'pending',
      paymentMethod: 'stripe',
      idempotencyKey,
      metadata: this.buildPendingFulfillmentMetadata({
        channel,
        ...(Object.keys(clientContext).length > 0 ? { clientContext } : {}),
        ...this.resolveAffiliateAttribution(req),
      }),
    });

    const defaultSuccessUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?scope=product&id=${productId}&provider=stripe&sessionId={CHECKOUT_SESSION_ID}`;
    const defaultFailUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-failed?scope=product&id=${productId}&provider=stripe`;
    const successUrl = this.resolveCheckoutRedirectUrl(defaultSuccessUrl, successRedirectUrl);
    const failUrl = this.resolveCheckoutRedirectUrl(defaultFailUrl, cancelRedirectUrl);

    const user = await this.userModel.findById(userId).select('email name');
    const session = await this.stripe.createLinkCheckoutSession({
      amountDT: amount,
      currency: businessCurrency,
      successUrl,
      cancelUrl: failUrl,
      customerEmail: user?.email,
      metadata: {
        userId,
        contentType: 'product',
        contentId: productId,
        orderId: pendingOrder._id.toString(),
        channel,
        ...(Object.keys(clientContext).length > 0 ? { clientContext: JSON.stringify(clientContext) } : {}),
      },
      lineItems: [{
        name: product.title || 'Product',
        description: product.description,
        amount: amount,
        quantity: 1
      }]
    });

    if (!session.success) throw new BadRequestException(session.error);

    await this.persistStripeCheckout(pendingOrder, session);

    return this.buildStripeInitResponse({
      scope: 'product',
      targetId: productId,
      orderId: pendingOrder._id.toString(),
      sessionId: session.sessionId,
      checkoutUrl: session.url,
      extra: {
        channel,
      },
    });
  }

  @Post('stripe-link/init/session')
  @ApiOperation({ summary: 'Initiate Stripe Link payment for 1-to-1 session' })
  @ApiQuery({ name: 'promoCode', required: false })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async initStripeLinkSessionPayment(
    @Body('sessionId') sessionId: string,
    @Body('bookingDto') bookingDto: any,
    @Req() req: any,
    @Body('channel') channelRaw?: string,
    @Body('successRedirectUrl') successRedirectUrl?: string,
    @Body('cancelRedirectUrl') cancelRedirectUrl?: string,
    @Body('clientContext') clientContextRaw?: Record<string, any>,
    @Query('promoCode') promoCode?: string,
  ) {
    const userId = (req.user?._id || req.user?.sub || '').toString();
    const channel = this.normalizePaymentChannel(channelRaw);
    const clientContext = this.normalizeClientContext(clientContextRaw);
    const sessionDoc = await this.sessionModel.findOne({ id: sessionId }) || await this.sessionModel.findById(sessionId);
    if (!sessionDoc) throw new BadRequestException('Session not found');
    if (sessionDoc.creatorId?.toString() === userId) {
      throw new BadRequestException('Vous ne pouvez pas réserver votre propre session');
    }

    const price = sessionDoc.price || 0;
    const businessCurrency = this.normalizeCatalogCurrency((sessionDoc as any).currency);
    if (price <= 0) throw new BadRequestException('Free session');

    let amount = price;
    let discountDT = 0;
    let appliedCode: string | undefined;
    if (promoCode) {
      const buyer = await this.userModel.findById(userId).select('email');
      const promo = await this.promoService.validateAndApply(promoCode, price, TrackableContentType.SESSION, sessionDoc._id.toString(), (buyer as any)?.email);
      if (promo.valid) {
        amount = promo.finalAmountDT;
        discountDT = promo.discountDT;
        appliedCode = promo.appliedCode;
      }
    }

    const breakdown = await this.feeService.calculateForAmount(amount, sessionDoc.creatorId.toString());
    const idempotencyKey = this.getRequestIdempotencyKey(req);
    const reusableOrder = await this.findReusablePendingContentOrder({
      userId, contentType: TrackableContentType.SESSION, contentId: sessionDoc._id.toString(), idempotencyKey,
    });
    if (reusableOrder) return this.buildReusableStripeInitResponse(reusableOrder, 'session', sessionId, { channel });
    const pendingOrder = await this.orderModel.create({
      buyerId: new Types.ObjectId(userId),
      creatorId: sessionDoc.creatorId,
      contentType: TrackableContentType.SESSION,
      contentId: sessionDoc._id.toString(),
      amountDT: breakdown.amountDT,
      businessCurrency,
      platformPercent: breakdown.platformPercent,
      platformFixedDT: breakdown.platformFixedDT,
      platformFeeDT: breakdown.platformFeeDT,
      creatorNetDT: breakdown.creatorNetDT,
      promoCode: appliedCode,
      discountDT,
      status: 'pending',
      paymentMethod: 'stripe',
      idempotencyKey,
      metadata: this.buildPendingFulfillmentMetadata({
        bookingDto,
        contentId: sessionId,
        slotId: bookingDto?.slotId,
        channel,
        ...(Object.keys(clientContext).length > 0 ? { clientContext } : {}),
        ...this.resolveAffiliateAttribution(req),
      })
    });

    const defaultSuccessUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?scope=session&id=${sessionId}&provider=stripe&sessionId={CHECKOUT_SESSION_ID}`;
    const defaultFailUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-failed?scope=session&id=${sessionId}&provider=stripe`;
    const successUrl = this.resolveCheckoutRedirectUrl(defaultSuccessUrl, successRedirectUrl);
    const failUrl = this.resolveCheckoutRedirectUrl(defaultFailUrl, cancelRedirectUrl);

    const user = await this.userModel.findById(userId).select('email name');
    const session = await this.stripe.createLinkCheckoutSession({
      amountDT: amount,
      currency: businessCurrency,
      successUrl,
      cancelUrl: failUrl,
      customerEmail: user?.email,
      metadata: {
        userId,
        contentType: 'session',
        contentId: sessionId,
        orderId: pendingOrder._id.toString(),
        bookingDto: JSON.stringify(bookingDto), // Serialize object to string
        channel,
        ...(Object.keys(clientContext).length > 0 ? { clientContext: JSON.stringify(clientContext) } : {}),
      },
      lineItems: [{
        name: sessionDoc.title || 'Session',
        description: sessionDoc.description,
        amount: amount,
        quantity: 1
      }]
    });

    if (!session.success) throw new BadRequestException(session.error);

    await this.persistStripeCheckout(pendingOrder, session);

    return this.buildStripeInitResponse({
      scope: 'session',
      targetId: sessionId,
      orderId: pendingOrder._id.toString(),
      sessionId: session.sessionId,
      checkoutUrl: session.url,
      extra: {
        channel,
      },
    });
  }

  @Post('stripe-link/init/subscription')
  @ApiOperation({ summary: 'Initiate Stripe Link subscription payment' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async initStripeLinkSubscription(
    @Req() req: any,
    @Body('tier') tier: string,
    @Body('interval') interval: 'month' | 'year' = 'month',
    @Body('channel') channelRaw?: string,
    @Body('successRedirectUrl') successRedirectUrl?: string,
    @Body('cancelRedirectUrl') cancelRedirectUrl?: string,
    @Body('clientContext') clientContextRaw?: Record<string, any>,
    @Body('idempotencyKey') idempotencyKeyRaw?: string,
  ) {
    const userId = (req.user?._id || req.user?.sub || '').toString();
    const channel = this.normalizePaymentChannel(channelRaw);
    const clientContext = this.normalizeClientContext(clientContextRaw);
    const plan = await this.subscriptionService.getActivePlanOrBootstrap(tier);
    if (!plan) throw new BadRequestException('Plan not found');

    const billingInterval = this.normalizeBillingInterval(interval);
    const amount = this.subscriptionService.getPlanAmount(plan, billingInterval);

    if (amount <= 0) throw new BadRequestException('Invalid amount');
    const idempotencyKey = this.normalizeIdempotencyKey(idempotencyKeyRaw || req.headers?.['idempotency-key']);
    const reusableOrder = await this.findReusablePendingSubscriptionOrder({
      userId,
      tier,
      billingInterval,
      provider: 'stripe',
      idempotencyKey,
    });
    if (reusableOrder?.paymentId && reusableOrder?.metadata?.checkoutUrl) {
      return this.buildStripeInitResponse({
        scope: 'subscription',
        targetId: tier,
        orderId: reusableOrder._id.toString(),
        sessionId: reusableOrder.paymentId,
        checkoutUrl: reusableOrder.metadata.checkoutUrl,
        extra: {
          channel,
          interval: billingInterval,
          idempotent: true,
        },
      });
    }

    const priceSelection = await this.resolveSubscriptionStripePrice({
      plan,
      tier,
      interval: billingInterval,
      amount,
    });
    const providerMoneyMetadata = this.buildProviderMoneyMetadata(priceSelection);
    const breakdown = await this.feeService.calculateForAmount(amount, userId);
    const pendingOrder = await this.orderModel.create({
      buyerId: new Types.ObjectId(userId),
      creatorId: new Types.ObjectId(userId),
      contentType: TrackableContentType.SUBSCRIPTION,
      contentId: tier,
      amountDT: breakdown.amountDT,
      businessCurrency: 'TND',
      providerAmount: priceSelection.providerAmount,
      providerCurrency: priceSelection.providerCurrency,
      providerExchangeRate: priceSelection.providerExchangeRate,
      platformPercent: breakdown.platformPercent,
      platformFixedDT: breakdown.platformFixedDT,
      platformFeeDT: breakdown.platformFeeDT,
      creatorNetDT: breakdown.creatorNetDT,
      status: 'pending',
      paymentMethod: 'stripe',
      idempotencyKey,
      metadata: this.buildPendingFulfillmentMetadata({
        channel,
        tier,
        billingInterval,
        provider: 'stripe',
        providerPriceId: priceSelection.priceId,
        providerPriceSource: priceSelection.source,
        ...providerMoneyMetadata,
        amount,
        currency: 'TND',
        ...(idempotencyKey ? { idempotencyKey } : {}),
        ...(Object.keys(clientContext).length > 0 ? { clientContext } : {}),
        ...this.resolveAffiliateAttribution(req),
      }),
    });

    const defaultSuccessUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?scope=subscription&tier=${tier}&provider=stripe&sessionId={CHECKOUT_SESSION_ID}`;
    const defaultFailUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-failed?scope=subscription&tier=${tier}&provider=stripe`;
    const successUrl = this.resolveCheckoutRedirectUrl(defaultSuccessUrl, successRedirectUrl);
    const failUrl = this.resolveCheckoutRedirectUrl(defaultFailUrl, cancelRedirectUrl);

    const user = await this.userModel.findById(userId).select('email name');
    const session = await this.stripe.createLinkSubscriptionSession({
      priceId: priceSelection.priceId,
      successUrl,
      cancelUrl: failUrl,
      customerEmail: user?.email,
      metadata: {
        userId,
        contentType: 'subscription',
        tier,
        billingInterval,
        provider: 'stripe',
        providerPriceId: priceSelection.priceId,
        providerPriceSource: priceSelection.source,
        amount: String(amount),
        currency: 'TND',
        ...Object.fromEntries(Object.entries(providerMoneyMetadata).map(([key, value]) => [key, String(value)])),
        orderId: pendingOrder._id.toString(),
        channel,
        ...(Object.keys(clientContext).length > 0 ? { clientContext: JSON.stringify(clientContext) } : {}),
      },
      trialPeriodDays: plan.trialDays,
      providerAmount: priceSelection.providerAmount,
      providerCurrency: priceSelection.providerCurrency,
      providerExchangeRate: priceSelection.providerExchangeRate,
    });

    if (!session.success) throw new BadRequestException(session.error);

    pendingOrder.paymentId = session.sessionId;
    if (session.paymentIntentId) pendingOrder.paymentIntentId = session.paymentIntentId;
    pendingOrder.metadata = {
      ...(pendingOrder.metadata || {}),
      providerCheckoutSessionId: session.sessionId,
      providerPriceId: priceSelection.priceId,
      providerPriceSource: priceSelection.source,
      ...providerMoneyMetadata,
      checkoutUrl: session.url,
    };
    await pendingOrder.save();

    return this.buildStripeInitResponse({
      scope: 'subscription',
      targetId: tier,
      orderId: pendingOrder._id.toString(),
      sessionId: session.sessionId,
      checkoutUrl: session.url,
      extra: {
        channel,
        interval: billingInterval,
      },
    });
  }



  private parseBookingDto(raw: any): any {
    if (!raw) return {};
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
      } catch {
        return {};
      }
    }
    return typeof raw === 'object' ? raw : {};
  }

  private getErrorMessage(error: any): string {
    const response = error?.getResponse?.();
    if (typeof response === 'string') return response;
    if (Array.isArray(response?.message)) return response.message.join(', ');
    if (typeof response?.message === 'string') return response.message;
    if (typeof error?.message === 'string') return error.message;
    return 'Unknown error';
  }

  private isTransactionNotSupportedError(error: any): boolean {
    const response = error?.getResponse?.();
    const responseMessage = Array.isArray(response?.message)
      ? response.message.join(', ')
      : (typeof response?.message === 'string' ? response.message : (typeof response === 'string' ? response : ''));
    const message = String(
      error?.errorResponse?.errmsg ||
      error?.cause?.errorResponse?.errmsg ||
      responseMessage ||
      error?.message ||
      error?.cause?.message ||
      '',
    ).toLowerCase();
    const code = error?.code ?? error?.errorResponse?.code ?? error?.cause?.code ?? error?.cause?.errorResponse?.code;
    const codeName = String(
      error?.codeName ||
      error?.errorResponse?.codeName ||
      error?.cause?.codeName ||
      error?.cause?.errorResponse?.codeName ||
      '',
    ).toLowerCase();

    return (
      code === 20 ||
      codeName === 'illegaloperation' ||
      message.includes('transaction numbers are only allowed on a replica set member or mongos')
    );
  }

  private async detectMongoTransactionSupport(): Promise<boolean> {
    if (this.mongoTransactionSupport !== null) {
      return this.mongoTransactionSupport;
    }

    try {
      const adminDb = this.orderModel.db?.db?.admin?.();
      if (!adminDb) {
        this.logger.warn(
          '[PAYMENT] Mongo admin database is unavailable. Falling back to non-transactional execution.',
        );
        this.mongoTransactionSupport = false;
        return false;
      }

      const hello = await adminDb.command({ hello: 1 });
      const isReplicaSet = Boolean(hello?.setName);
      const isMongos = hello?.msg === 'isdbgrid';
      const supportsTransactions = isReplicaSet || isMongos;

      this.mongoTransactionSupport = supportsTransactions;
      if (supportsTransactions) {
        this.logger.log('[PAYMENT] MongoDB transactions enabled (replica set/mongos detected).');
      } else {
        this.logger.warn(
          '[PAYMENT] MongoDB standalone detected. Payment fulfillment will run without transactions.',
        );
      }

      return supportsTransactions;
    } catch (error: any) {
      this.mongoTransactionSupport = false;
      this.logger.warn(
        `[PAYMENT] Unable to detect MongoDB transaction support. Using non-transactional mode. reason=${error?.message || error}`,
      );
      return false;
    }
  }

  private async runWithOptionalTransaction<T>(work: (session: any | null) => Promise<T>): Promise<T> {
    const supportsTransactions = await this.detectMongoTransactionSupport();
    if (!supportsTransactions) {
      return await work(null);
    }

    try {
      return await this.orderModel.db.transaction(async (session) => {
        return await work(session);
      });
    } catch (error: any) {
      if (!this.isTransactionNotSupportedError(error)) {
        throw error;
      }

      this.mongoTransactionSupport = false;
      this.logger.warn(
        '[PAYMENT] MongoDB transactions are unavailable. Falling back to non-transactional execution.',
      );
      return await work(null);
    }
  }

  private buildBuyerIdFilter(userId: string): any {
    if (Types.ObjectId.isValid(userId)) {
      return { $in: [new Types.ObjectId(userId), userId] };
    }
    return userId;
  }

  private buildProductContentIdCandidates(product: ProductDocument): string[] {
    return Array.from(
      new Set([String(product?._id || ''), String((product as any)?.id || '')].filter(Boolean)),
    );
  }

  private async findExistingPaidProductOrder(
    userId: string,
    product: ProductDocument,
  ): Promise<OrderDocument | null> {
    const buyerFilter = this.buildBuyerIdFilter(userId);
    const productIds = this.buildProductContentIdCandidates(product);
    if (!productIds.length) return null;

    return this.orderModel
      .findOne({
        buyerId: buyerFilter,
        contentType: TrackableContentType.PRODUCT,
        contentId: { $in: productIds },
        status: 'paid',
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  private async incrementProductSalesFromOrder(order: any): Promise<void> {
    if (!order || order.contentType !== TrackableContentType.PRODUCT) return;
    if (!order?._id) return;

    const salesMark = await this.orderModel
      .updateOne(
        {
          _id: order._id,
          'metadata.productSaleCounted': { $ne: true },
        },
        {
          $set: { 'metadata.productSaleCounted': true },
        },
      )
      .exec();

    if (Number(salesMark?.modifiedCount || 0) === 0) return;

    const contentId = String(order.contentId || '').trim();
    if (!contentId) return;

    const query = Types.ObjectId.isValid(contentId)
      ? { _id: new Types.ObjectId(contentId) }
      : { id: contentId };

    await this.productModel.updateOne(query, { $inc: { sales: 1 } }).exec();
  }

  private isMissingScheduledAtError(error: any): boolean {
    const message = this.getErrorMessage(error).toLowerCase();
    return message.includes('la date de la session est obligatoire');
  }

  private isAlreadyRegisteredEventError(error: any): boolean {
    const message = this.getErrorMessage(error).toLowerCase();
    return message.includes('déjà inscrit') || message.includes('already registered');
  }

  private async findSessionByAnyId(sessionId: string, dbSession: any = null): Promise<SessionDocument | null> {
    let sessionDoc = await this.sessionModel.findOne({ id: sessionId }).session(dbSession);
    if (!sessionDoc && Types.ObjectId.isValid(sessionId)) {
      sessionDoc = await this.sessionModel.findById(sessionId).session(dbSession);
    }
    return sessionDoc;
  }

  private async resolveScheduledAtFromSlot(sessionId: string, slotId: string, dbSession: any = null): Promise<string | undefined> {
    if (!slotId) return undefined;
    const sessionDoc = await this.findSessionByAnyId(sessionId, dbSession);
    if (!sessionDoc) return undefined;
    const slot = (sessionDoc.availableSlots || []).find((s: any) => String(s?.id) === String(slotId));
    if (!slot?.startTime) return undefined;
    return new Date(slot.startTime).toISOString();
  }

  private resolveMemberDisplayName(user: any): string {
    const explicitName = String(user?.name || '').trim();
    if (explicitName) return explicitName;

    const firstName = String(user?.firstName || '').trim();
    const lastName = String(user?.lastName || '').trim();
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) return fullName;

    const username = String(user?.username || '').trim();
    if (username) return username;

    return 'A new member';
  }

  private async notifyCommunityCreatorMemberJoined(
    community: CommunityDocument,
    buyerId: Types.ObjectId | string,
  ): Promise<void> {
    const buyerIdString = String(buyerId || '');
    const creatorIdString = String(community?.createur || '');
    if (!buyerIdString || !creatorIdString || buyerIdString === creatorIdString) {
      return;
    }

    try {
      const buyer = await this.userModel
        .findById(buyerIdString)
        .select('name username firstName lastName')
        .lean();
      const buyerName = this.resolveMemberDisplayName(buyer);

      await this.notificationService.createNotification({
        recipient: creatorIdString,
        sender: buyerIdString,
        type: 'new_community_member',
        title: 'New Member',
        body: `${buyerName} has joined your community ${community.name}`,
        data: {
          communityId: community._id.toString(),
          userId: buyerIdString,
          memberName: buyerName,
        },
      });
    } catch (error: any) {
      this.logger.warn(
        `Failed to create creator notification for community join (communityId=${community?._id?.toString?.()}, buyerId=${buyerIdString}): ${error?.message || error}`,
      );
    }
  }

  private async grantAccess(
    order: any,
    session: any = null,
    stripeSessionMetadata?: Record<string, string>,
    stripePaymentDetails?: {
      sessionId?: string;
      customerId?: string;
      subscriptionId?: string;
      subscriptionStatus?: string;
      currentPeriodStart?: Date;
      currentPeriodEnd?: Date;
      trialEndsAt?: Date;
      cancelAtPeriodEnd?: boolean;
      paymentMethod?: { card?: { brand?: string; last4?: string } };
      providerPriceId?: string;
      amountDT?: number;
      providerAmount?: number;
      providerCurrency?: string;
      providerExchangeRate?: number;
    },
  ) {
    this.logger.log(`Granting access for order ${order._id} (Type: ${order.contentType})`);

    switch (order.contentType) {
      case TrackableContentType.COMMUNITY:
        const community = await this.communityModel.findById(order.contentId).session(session);
        if (community) {
          community.addMember(order.buyerId);
          await community.save({ session });

          const userUpdateQuery = this.userModel.findByIdAndUpdate(order.buyerId, {
            $addToSet: { joinedCommunities: community._id },
          });
          if (session) {
            userUpdateQuery.session(session);
          }
          await userUpdateQuery.exec();

          await this.notifyCommunityCreatorMemberJoined(community, order.buyerId);
          await this.subscriptionService.recordCommunityMemberSubscriptionFromOrder(order, {
            provider: stripeSessionMetadata?.provider || order.metadata?.provider || order.paymentMethod,
            providerCustomerId: stripePaymentDetails?.customerId,
            providerSubscriptionId: stripePaymentDetails?.subscriptionId,
            providerCheckoutSessionId: stripePaymentDetails?.sessionId || order.metadata?.providerCheckoutSessionId || order.paymentId,
            currentPeriodStart: stripePaymentDetails?.currentPeriodStart,
            currentPeriodEnd: stripePaymentDetails?.currentPeriodEnd,
            cancelAtPeriodEnd: stripePaymentDetails?.cancelAtPeriodEnd,
          }, session);
        }
        break;

      case TrackableContentType.SUBSCRIPTION:
        const tier = (stripeSessionMetadata?.tier || order.metadata?.tier || order.contentId || 'STARTER') as PlanTier;
        const billingInterval = this.normalizeBillingInterval(
          stripeSessionMetadata?.billingInterval || order.metadata?.billingInterval,
        );
        await this.subscriptionService.upgradePlan(order.buyerId.toString(), tier, session, {
          billingInterval,
          provider: stripeSessionMetadata?.provider || order.metadata?.provider || 'stripe',
          providerCustomerId: stripePaymentDetails?.customerId,
          providerSubscriptionId: stripePaymentDetails?.subscriptionId,
          providerCheckoutSessionId: stripePaymentDetails?.sessionId || order.metadata?.providerCheckoutSessionId || order.paymentId,
          providerPriceId: stripePaymentDetails?.providerPriceId || stripeSessionMetadata?.providerPriceId || order.metadata?.providerPriceId,
          currentPeriodStart: stripePaymentDetails?.currentPeriodStart,
          currentPeriodEnd: stripePaymentDetails?.currentPeriodEnd,
          trialEndsAt: stripePaymentDetails?.trialEndsAt,
          status: this.normalizeStripeSubscriptionStatus(stripePaymentDetails?.subscriptionStatus),
          amount: Number(order.metadata?.amount || order.amountDT || stripePaymentDetails?.amountDT || 0),
          currency: order.metadata?.currency || stripeSessionMetadata?.currency || 'TND',
          providerAmount: stripePaymentDetails?.providerAmount ?? order.providerAmount ?? order.metadata?.providerAmount,
          providerCurrency: stripePaymentDetails?.providerCurrency ?? order.providerCurrency ?? order.metadata?.providerCurrency,
          providerExchangeRate: stripePaymentDetails?.providerExchangeRate ?? order.providerExchangeRate ?? order.metadata?.providerExchangeRate,
          paymentBrand: stripePaymentDetails?.paymentMethod?.card?.brand,
          paymentLast4: stripePaymentDetails?.paymentMethod?.card?.last4,
          hasPaymentMethod: true,
          cancelAtPeriodEnd: stripePaymentDetails?.cancelAtPeriodEnd,
        });
        await this.subscriptionService.recordInvoiceForOrder(order, {
          provider: stripeSessionMetadata?.provider || order.metadata?.provider || order.paymentMethod || 'stripe',
          providerSubscriptionId: stripePaymentDetails?.subscriptionId || order.metadata?.providerSubscriptionId,
          providerInvoiceId: order.metadata?.providerInvoiceId,
          providerAmount: stripePaymentDetails?.providerAmount ?? order.providerAmount ?? order.metadata?.providerAmount,
          providerCurrency: stripePaymentDetails?.providerCurrency ?? order.providerCurrency ?? order.metadata?.providerCurrency,
          providerExchangeRate: stripePaymentDetails?.providerExchangeRate ?? order.providerExchangeRate ?? order.metadata?.providerExchangeRate,
        }, session);
        break;

      case TrackableContentType.COURSE:
        await this.coursService.inscrireAuCours(order.contentId, order.buyerId.toString(), order.promoCode, session, true);
        break;

      case TrackableContentType.CHALLENGE:
        await this.challengeService.joinChallenge({ challengeId: order.contentId } as any, order.buyerId.toString(), session);
        break;

      case TrackableContentType.EVENT:
        // Use metadata ticketType if available
        const ticketType = order.metadata?.ticketType || 'standard';
        try {
          await this.eventService.registerAttendee(
            order.contentId,
            ticketType,
            order.buyerId.toString(),
            order.promoCode,
            {
              session,
              paymentConfirmed: true,
              specialRequests: order.metadata?.specialRequests || stripeSessionMetadata?.specialRequests,
            },
          );
        } catch (error: any) {
          if (this.isAlreadyRegisteredEventError(error)) {
            this.logger.warn(`Skipping duplicate event registration for order ${order._id}: buyer already registered`);
            break;
          }
          throw error;
        }
        break;

      case TrackableContentType.SESSION:
        if (order.creatorId?.toString() === order.buyerId?.toString()) {
          this.logger.warn(`Skipping self-booking for session order ${order._id}`);
          break;
        }
        const bookingSessionId = order.metadata?.contentId || stripeSessionMetadata?.contentId || order.contentId;
        const orderBookingDto = this.parseBookingDto(order.metadata?.bookingDto);
        const stripeBookingDto = this.parseBookingDto(stripeSessionMetadata?.bookingDto);
        const bookingDto: any = {
          ...stripeBookingDto,
          ...orderBookingDto,
        };

        const slotId =
          bookingDto.slotId ||
          order.metadata?.slotId ||
          stripeSessionMetadata?.slotId;

        if (!bookingDto.scheduledAt && slotId) {
          const scheduledAtFromSlot = await this.resolveScheduledAtFromSlot(bookingSessionId, slotId, session);
          if (scheduledAtFromSlot) {
            bookingDto.scheduledAt = scheduledAtFromSlot;
            bookingDto.slotId = slotId;
          }
        }

        await this.sessionService.bookSession(bookingSessionId, bookingDto, order.buyerId.toString(), order.promoCode, session, 'confirmed');
        break;

      case TrackableContentType.PRODUCT:
        // Mark as purchased in tracking or similar
        // ProductService doesn't have a clear "purchase" yet, so we mark order as paid (already done)
        this.logger.log(`Product ${order.contentId} marked as purchased for user ${order.buyerId}`);
        break;

      case TrackableContentType.CHAPTER:
      case 'chapter':
        // Grant access to specific chapter by persisting entitlement on enrollment (idempotent).
        {
          let courseIdMeta = order.metadata?.courseId;
          if (!courseIdMeta) {
            const course = await this.coursModel
              .findOne({ 'sections.chapitres.id': order.contentId })
              .select('id _id')
              .lean();
            courseIdMeta = (course as any)?.id || (course as any)?._id?.toString?.();
          }
          if (!courseIdMeta) {
            this.logger.warn(
              `Chapter order ${order._id} has no resolvable course for chapter ${order.contentId}`,
            );
            break;
          }

          const entitlement = await this.coursService.ensureChapterPurchasedEntitlement(
            order.buyerId.toString(),
            String(courseIdMeta),
            String(order.contentId),
            session,
          );
          this.logger.log(
            `chapter_entitlement_granted orderId=${order._id} userId=${order.buyerId} courseId=${courseIdMeta} chapterId=${order.contentId} granted=${entitlement.granted}`,
          );
        }
        break;

      default:
        this.logger.warn(`Access granting not implemented for content type: ${order.contentType}`);
    }
  }

  @Get('stripe-link/verify')
  @ApiOperation({ summary: 'Verify Stripe Link payment' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async verifyStripeLink(@Query('sessionId') sessionId: string, @Req() req: any) {
    const normalizedSessionId = String(sessionId || '').trim();
    if (!normalizedSessionId) {
      throw new BadRequestException('Missing Stripe session id');
    }
    if (this.isStripeSessionPlaceholder(normalizedSessionId)) {
      throw new BadRequestException('Invalid Stripe session id placeholder');
    }

    const verify = await this.stripe.verifyLinkPayment(normalizedSessionId);
    if (!verify.success) throw new BadRequestException(verify.error);

    const metadataOrderId = verify.sessionMetadata?.orderId;
    let order: any = await this.orderModel.findOne({ paymentId: normalizedSessionId });
    if (!order && metadataOrderId && Types.ObjectId.isValid(metadataOrderId)) {
      order = await this.orderModel.findById(metadataOrderId);
      if (order && !order.paymentId) {
        order.paymentId = normalizedSessionId;
        await order.save();
      }
    }
    if (!order) {
      this.logger.warn(
        `Stripe verify could not resolve order for sessionId=${normalizedSessionId} metadataOrderId=${metadataOrderId || 'none'}`,
      );
      throw new BadRequestException('Order not found');
    }
    const userId = String(req.user?._id || req.user?.sub || '');
    if (String(order.buyerId || '') !== userId) {
      throw new ForbiddenException('You are not allowed to verify this order');
    }
    if (verify.paymentIntentId && order.paymentIntentId !== verify.paymentIntentId) {
      order.paymentIntentId = verify.paymentIntentId;
      await order.save();
    }

    if (this.isSuccessfulStripePayment(verify)) {
      let requiresBookingAction = false;
      let didCompleteFulfillment = false;
      let sessionContentId = order.metadata?.contentId || verify.sessionMetadata?.contentId || order.contentId;
      const isChapterOrder =
        order.contentType === TrackableContentType.CHAPTER ||
        (order.contentType as any) === 'chapter';
      const chapterId = isChapterOrder ? String(order.contentId) : undefined;
      const chapterCourseId = isChapterOrder
        ? String(order.metadata?.courseId || verify.sessionMetadata?.courseId || '')
        : undefined;

      await this.runWithOptionalTransaction(async (session) => {
        const claim = await this.paymentFulfillmentService.claimForProcessing(
          order._id.toString(),
          verify.paymentMethod?.type || 'stripe-link',
          session,
        );
        if (!claim.order) {
          throw new BadRequestException('Order not found');
        }

        order = claim.order;
        sessionContentId = order.metadata?.contentId || verify.sessionMetadata?.contentId || order.contentId;

        if (claim.state === 'requires_booking') {
          requiresBookingAction = true;
          return;
        }

        if (claim.state !== 'claimed') {
          return;
        }

        try {
          await this.grantAccess(order, session, verify.sessionMetadata, {
            sessionId: normalizedSessionId,
            customerId: verify.customerId,
            subscriptionId: verify.subscriptionId,
            subscriptionStatus: verify.subscriptionStatus,
            currentPeriodStart: verify.currentPeriodStart,
            currentPeriodEnd: verify.currentPeriodEnd,
            trialEndsAt: verify.trialEndsAt,
            cancelAtPeriodEnd: verify.cancelAtPeriodEnd,
            paymentMethod: verify.paymentMethod,
            amountDT: verify.amountDT,
            providerAmount: verify.providerAmount,
            providerCurrency: verify.providerCurrency,
            providerExchangeRate: verify.providerExchangeRate,
          });
          order = await this.paymentFulfillmentService.markCompleted(order, session);
          didCompleteFulfillment = true;
        } catch (error: any) {
          if (order.contentType === TrackableContentType.SESSION && this.isMissingScheduledAtError(error)) {
            requiresBookingAction = true;
            order = await this.paymentFulfillmentService.markRequiresBooking(order, session, {
              contentId: sessionContentId,
            });
            return;
          }

          await this.paymentFulfillmentService.markFailed(order, error, session);
          throw error;
        }
      });

      if (didCompleteFulfillment) {
        await this.incrementProductSalesFromOrder(order);
        await this.affiliateCommissionService.onOrderPaid(order).catch((e) => this.logger.error(`Affiliate onOrderPaid failed: ${e?.message}`));
      }

      const refreshedOrder = await this.orderModel.findById(order._id);
      if (refreshedOrder) {
        order = refreshedOrder;
      }

      // Repair entitlement drift on verify path (idempotent).
      if (isChapterOrder && chapterId) {
        try {
          const resolvedCourseId = chapterCourseId && chapterCourseId.length > 0
            ? chapterCourseId
            : String(order.metadata?.courseId || '');

          if (resolvedCourseId) {
            const entitlement = await this.coursService.ensureChapterPurchasedEntitlement(
              order.buyerId.toString(),
              resolvedCourseId,
              chapterId,
            );
            this.logger.log(
              `chapter_verify_repair orderId=${order._id} userId=${order.buyerId} courseId=${resolvedCourseId} chapterId=${chapterId} granted=${entitlement.granted}`,
            );
          }
        } catch (repairError: any) {
          this.logger.warn(
            `chapter_verify_repair_failed orderId=${order._id} chapterId=${chapterId} error=${repairError?.message || repairError}`,
          );
        }
      }

      if (order.contentType === TrackableContentType.SESSION) {
        const metadataBookingDto = this.parseBookingDto(order.metadata?.bookingDto);
        const hasBookingDate = Boolean(metadataBookingDto?.scheduledAt);
        const hasPendingFlag = order.metadata?.fulfillmentStatus === 'requires_booking';

        let hasExistingBooking = false;
        const sessionDoc = await this.findSessionByAnyId(sessionContentId);
        if (sessionDoc) {
          hasExistingBooking = (sessionDoc.bookings || []).some(
            (b: any) => b?.userId?.toString() === order.buyerId?.toString() && b?.status !== 'cancelled',
          );
        }

        if (hasPendingFlag || (!hasExistingBooking && !hasBookingDate)) {
          requiresBookingAction = true;
          order = await this.paymentFulfillmentService.markRequiresBooking(order, null, {
            contentId: sessionContentId,
          });
        }
      }

      if (requiresBookingAction) {
        return this.paymentVerificationService.fromPayload('stripe', {
          status: 'paid_action_required',
          action: 'choose_session_slot',
          message: 'Payment received. Please choose a session slot to finalize your booking.',
          orderId: order._id,
          sessionContentId,
          paymentMethod: verify.paymentMethod,
          customerId: verify.customerId,
          ...(isChapterOrder ? { chapterId, courseId: chapterCourseId || order.metadata?.courseId } : {}),
          ...(await this.enrichOrderDetails(order)),
        });
      }

      return this.paymentVerificationService.fromPayload('stripe', {
        status: 'paid',
        paymentMethod: verify.paymentMethod,
        customerId: verify.customerId,
        orderId: order._id,
        businessAmount: order.amountDT,
        businessCurrency: order.businessCurrency || 'TND',
        providerAmount: verify.providerAmount ?? order.providerAmount,
        providerCurrency: verify.providerCurrency ?? order.providerCurrency,
        providerExchangeRate: verify.providerExchangeRate ?? order.providerExchangeRate,
        ...(isChapterOrder ? { chapterId, courseId: chapterCourseId || order.metadata?.courseId } : {}),
        ...(await this.enrichOrderDetails(order))
      });
    }

    order.status = 'pending';
    await order.save();
    return this.paymentVerificationService.fromPayload('stripe', { status: verify.status, orderId: order._id });
  }

  @Post('session/finalize-booking')
  @ApiOperation({ summary: 'Finalize booking for a paid session order' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async finalizeSessionBooking(
    @Req() req: any,
    @Body('orderId') orderId: string,
    @Body('scheduledAt') scheduledAt?: string,
    @Body('notes') notes?: string,
    @Body('slotId') slotId?: string,
  ) {
    const userId = (req.user?._id || req.user?.sub || '').toString();
    if (!orderId) throw new BadRequestException('orderId is required');

    let order: any = await this.orderModel.findById(orderId);
    if (!order) throw new BadRequestException('Order not found');
    if (order.buyerId?.toString() !== userId) {
      throw new ForbiddenException('You are not allowed to finalize this booking');
    }
    if (order.contentType !== TrackableContentType.SESSION) {
      throw new BadRequestException('Order is not a session payment');
    }
    if (order.status !== 'paid') {
      throw new BadRequestException('Order must be paid before finalizing booking');
    }
    if (order.creatorId?.toString() === userId) {
      throw new BadRequestException('Vous ne pouvez pas réserver votre propre session');
    }

    const bookingSessionId = order.metadata?.contentId || order.contentId;
    const resolvedFromSlot = !scheduledAt && slotId
      ? await this.resolveScheduledAtFromSlot(bookingSessionId, slotId)
      : undefined;
    const finalScheduledAt = scheduledAt || resolvedFromSlot;

    if (!finalScheduledAt) {
      throw new BadRequestException('La date de la session est obligatoire');
    }

    const scheduledDate = new Date(finalScheduledAt);
    if (Number.isNaN(scheduledDate.getTime())) {
      throw new BadRequestException('Date de session invalide');
    }

    const sessionDoc = await this.findSessionByAnyId(bookingSessionId);
    if (!sessionDoc) throw new BadRequestException('Session non trouvée');

    const existingBooking = (sessionDoc.bookings || []).find((booking: any) =>
      booking?.userId?.toString() === userId &&
      booking?.status !== 'cancelled' &&
      booking?.scheduledAt &&
      new Date(booking.scheduledAt).getTime() === scheduledDate.getTime(),
    );

    if (!existingBooking) {
      await this.sessionService.bookSession(
        bookingSessionId,
        { scheduledAt: finalScheduledAt, notes } as any,
        userId,
        order.promoCode || undefined,
        null,
        'confirmed',
      );
    }

    const nextMetadata: Record<string, any> = { ...(order.metadata || {}) };
    nextMetadata.contentId = bookingSessionId;
    nextMetadata.slotId = slotId || nextMetadata.slotId;
    nextMetadata.bookingDto = {
      ...(this.parseBookingDto(nextMetadata.bookingDto)),
      scheduledAt: finalScheduledAt,
      notes: notes || this.parseBookingDto(nextMetadata.bookingDto)?.notes,
      slotId: slotId || this.parseBookingDto(nextMetadata.bookingDto)?.slotId,
    };
    nextMetadata.finalizedAt = new Date().toISOString();
    order = await this.paymentFulfillmentService.markCompleted(order, null, nextMetadata);

    return {
      status: 'paid',
      bookingFinalized: true,
      existingBooking: Boolean(existingBooking),
      orderId: order._id,
      sessionContentId: bookingSessionId,
      scheduledAt: finalScheduledAt,
    };
  }

  @Post('stripe-link/webhook')
  @ApiOperation({ summary: 'Stripe Link webhook handler' })
  async stripeLinkWebhook(@Req() req: any) {
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      await this.auditPaymentEvent({
        eventType: 'webhook_rejected',
        provider: 'stripe',
        reason: 'missing_signature',
      });
      throw new UnauthorizedException('Missing Stripe signature');
    }

    const event = await this.stripe.createWebhookEvent(req.body, signature);
    if (!event.success) {
      await this.auditPaymentEvent({
        eventType: 'webhook_rejected',
        provider: 'stripe',
        reason: 'invalid_signature',
        error: event.error,
      });
      throw new UnauthorizedException(event.error);
    }

    const stripeEvent = event.event!;
    this.logger.log(`Received Stripe webhook event: ${stripeEvent.type}`);
    await this.auditPaymentEvent({
      eventType: 'webhook_received',
      provider: 'stripe',
      eventId: stripeEvent.id,
      metadata: {
        webhookType: stripeEvent.type,
      },
    });

    const claimStatus = await this.claimWebhookEvent('stripe', stripeEvent.id, stripeEvent.type);
    if (claimStatus === 'duplicate') {
      this.logger.log(`Ignoring duplicate Stripe webhook event ${stripeEvent.id}`);
      await this.auditPaymentEvent({
        eventType: 'duplicate_event_ignored',
        provider: 'stripe',
        eventId: stripeEvent.id,
        reason: 'already_processed',
        metadata: {
          webhookType: stripeEvent.type,
        },
      });
      return { received: true, duplicate: true };
    }

    try {
      // Handle different event types
      switch (stripeEvent.type) {
        case 'checkout.session.completed':
        case 'checkout.session.async_payment_succeeded':
          const stripeSession = stripeEvent.data.object as any;
          const isSubscriptionCheckout = stripeSession.mode === 'subscription' || stripeSession.metadata?.contentType === 'subscription';
          if (stripeSession.payment_status === 'paid' || (isSubscriptionCheckout && stripeSession.status === 'complete')) {
            // Process successful payment or completed subscription checkout
            let order: any = await this.orderModel.findOne({ paymentId: stripeSession.id });
            if (order) {
              const paymentIntentId = typeof stripeSession.payment_intent === 'string'
                ? stripeSession.payment_intent
                : stripeSession.payment_intent?.id;
              if (paymentIntentId && order.paymentIntentId !== paymentIntentId) {
                order.paymentIntentId = paymentIntentId;
                await order.save();
              }
              let didCompleteFulfillment = false;
              await this.runWithOptionalTransaction(async (dbSession) => {
                const claim = await this.paymentFulfillmentService.claimForProcessing(
                  order._id.toString(),
                  'stripe',
                  dbSession,
                );
                if (!claim.order) {
                  return;
                }

                order = claim.order;
                if (claim.state !== 'claimed') {
                  return;
                }

                try {
                  const stripeSubscription = typeof stripeSession.subscription === 'object' ? stripeSession.subscription : null;
                  const stripeSubscriptionId =
                    typeof stripeSession.subscription === 'string'
                      ? stripeSession.subscription
                      : stripeSession.subscription?.id;
                  let stripeSubscriptionDetails: any = null;
                  if (stripeSubscriptionId) {
                    const details = await this.stripe.getSubscriptionDetails(stripeSubscriptionId);
                    if (!details.success) {
                      throw new BadRequestException(details.error || 'Unable to verify Stripe subscription state');
                    }
                    stripeSubscriptionDetails = details;
                  }
                  await this.grantAccess(order, dbSession, stripeSession.metadata, {
                    sessionId: stripeSession.id,
                    customerId: stripeSubscriptionDetails?.customerId || (typeof stripeSession.customer === 'string' ? stripeSession.customer : stripeSession.customer?.id),
                    subscriptionId: stripeSubscriptionDetails?.subscriptionId || stripeSubscriptionId,
                    subscriptionStatus: stripeSubscriptionDetails?.status || stripeSubscription?.status,
                    currentPeriodStart: stripeSubscriptionDetails?.currentPeriodStart || (stripeSubscription?.current_period_start ? new Date(stripeSubscription.current_period_start * 1000) : undefined),
                    currentPeriodEnd: stripeSubscriptionDetails?.currentPeriodEnd || (stripeSubscription?.current_period_end ? new Date(stripeSubscription.current_period_end * 1000) : undefined),
                    trialEndsAt: stripeSubscriptionDetails?.trialEndsAt || (stripeSubscription?.trial_end ? new Date(stripeSubscription.trial_end * 1000) : undefined),
                    cancelAtPeriodEnd: stripeSubscriptionDetails?.cancelAtPeriodEnd ?? stripeSubscription?.cancel_at_period_end,
                    paymentMethod: stripeSubscriptionDetails?.paymentMethod,
                    providerPriceId: stripeSubscriptionDetails?.providerPriceId,
                    providerAmount: order.providerAmount ?? order.metadata?.providerAmount,
                    providerCurrency: order.providerCurrency ?? order.metadata?.providerCurrency,
                    providerExchangeRate: order.providerExchangeRate ?? order.metadata?.providerExchangeRate,
                  });
                  order = await this.paymentFulfillmentService.markCompleted(order, dbSession);
                  didCompleteFulfillment = true;
                } catch (error: any) {
                  if (order.contentType === TrackableContentType.SESSION && this.isMissingScheduledAtError(error)) {
                    order = await this.paymentFulfillmentService.markRequiresBooking(order, dbSession, {
                      contentId: order.metadata?.contentId || stripeSession?.metadata?.contentId || order.contentId,
                    });
                    return;
                  }

                  await this.paymentFulfillmentService.markFailed(order, error, dbSession);
                  throw error;
                }
              });

              if (didCompleteFulfillment) {
                await this.incrementProductSalesFromOrder(order);
                await this.affiliateCommissionService.onOrderPaid(order).catch((e) => this.logger.error(`Affiliate onOrderPaid failed: ${e?.message}`));
                const creatorId = order.creatorId?.toString?.();
                if (creatorId) {
                  void this.creatorIntegrationsService.emit(creatorId, 'purchase.paid', {
                    orderId: String(order._id), contentId: String(order.contentId || order.metadata?.contentId || ''),
                    contentType: order.contentType, amount: Number(order.amountDT || 0), currency: order.currency || 'TND', buyerId: String(order.buyerId || ''),
                  });
                }
                if (order.contentType === TrackableContentType.SUBSCRIPTION) {
                  const subscriberId = String(order.buyerId || '');
                  if (subscriberId) {
                    void this.creatorIntegrationsService.emit(subscriberId, 'subscription.started', {
                      orderId: String(order._id), plan: String(order.metadata?.tier || order.contentId || ''),
                      billingInterval: String(order.metadata?.billingInterval || ''), amount: Number(order.amountDT || 0),
                      currency: order.currency || 'TND', provider: String(order.metadata?.provider || order.paymentMethod || 'stripe'),
                    }).catch((e) => this.logger.warn(`Subscription integration event failed: ${e?.message || e}`));
                  }
                }
              }
            }
          }
          break;

        case 'charge.refunded':
          await this.reconcileStripeChargeRefund(stripeEvent.data.object as any);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
        case 'customer.subscription.trial_will_end':
        case 'invoice.payment_succeeded':
        case 'invoice.payment_failed':
        case 'payment_method.attached':
        case 'payment_method.detached':
          await this.subscriptionService.handleWebhook({
            id: stripeEvent.id,
            object: stripeEvent.object,
            type: stripeEvent.type,
            data: stripeEvent.data,
            created: stripeEvent.created ? new Date(stripeEvent.created * 1000).toISOString() : undefined,
            livemode: stripeEvent.livemode,
          });
          break;
      }
    } catch (error) {
      await this.markWebhookEventFailed('stripe', stripeEvent.id, stripeEvent.type, error);
      await this.webhookRetryService?.enqueue('stripe', {
        eventId: stripeEvent.id,
        eventType: stripeEvent.type,
      }, error);
      throw error;
    }

    await this.markWebhookEventProcessed('stripe', stripeEvent.id, stripeEvent.type);

    return { received: true };
  }

  @Post('stripe-link/customer-portal')
  @ApiOperation({ summary: 'Create Stripe customer portal session' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createCustomerPortalSession(@Req() req: any) {
    const userId = (req.user?._id || req.user?.sub || '').toString();

    // Get user's Stripe customer ID from their subscription
    const subscription = await this.subscriptionService.getMySubscription(userId);
    if (!subscription?.providerCustomerId) {
      throw new BadRequestException('No Stripe customer found');
    }

    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/creator/billing`;
    const portal = await this.stripe.createCustomerPortalSession(
      subscription.providerCustomerId,
      returnUrl
    );

    if (!portal.success) throw new BadRequestException(portal.error);

    return { portalUrl: portal.url };
  }

  @Post('stripe-link/init/chapter')
  @ApiOperation({ summary: 'Initiate Stripe Link payment for a single chapter' })
  @ApiQuery({ name: 'promoCode', required: false })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async initStripeLinkChapterPayment(
    @Body('courseId') courseId: string,
    @Body('chapterId') chapterId: string,
    @Req() req: any,
    @Body('channel') channelRaw?: string,
    @Body('successRedirectUrl') successRedirectUrl?: string,
    @Body('cancelRedirectUrl') cancelRedirectUrl?: string,
    @Body('clientContext') clientContextRaw?: Record<string, any>,
    @Query('promoCode') promoCode?: string,
  ) {
    const userId = (req.user?._id || req.user?.sub || '').toString();
    const channel = this.normalizePaymentChannel(channelRaw);
    const clientContext = this.normalizeClientContext(clientContextRaw);
    
    // 1. Find Course
    let cours: CoursDocument | null = null;
    if (Types.ObjectId.isValid(courseId)) {
      cours = await this.coursModel.findById(courseId);
    }
    if (!cours) {
      cours = await this.coursModel.findOne({ id: courseId });
    }
    if (!cours) throw new BadRequestException('Course not found');
    
    // 2. Find Chapter & Price
    let targetChapter: any = null;
    cours.sections.forEach(section => {
      const found = section.chapitres.find(c => c.id === chapterId);
      if (found) targetChapter = found;
    });

    if (!targetChapter) throw new BadRequestException('Chapter not found in this course');
    
    // Check if it's actually a paid chapter
    if (!targetChapter.isPaidChapter) {
        throw new BadRequestException('This chapter is not marked as a paid chapter');
    }

    const price = targetChapter.prix || 0;
    if (price <= 0) throw new BadRequestException('Free chapter (invalid price)');

    const currency = ((cours as any)?.devise || 'TND').toString();

    // 3. Calculate Amount & Discounts
    let amount = price;
    let discountDT = 0;
    let appliedCode: string | undefined;
    
    if (promoCode) {
      const buyer = await this.userModel.findById(userId).select('email');
      // Using 'chapter' as content type for promo validation might require updating PromoService, 
      // or we can treat it as a product/course. For now, assuming 'chapter' logic or fallback.
      // We'll pass 'chapter' as string which might need TrackableContentType enum update.
      // Casting to any to bypass enum strictness if needed for now.
      const promo = await this.promoService.validateAndApply(
        promoCode,
        price,
        TrackableContentType.CHAPTER,
        chapterId,
        (buyer as any)?.email,
      );
      if (promo.valid) {
        amount = promo.finalAmountDT;
        discountDT = promo.discountDT;
        appliedCode = promo.appliedCode;
      }
    }

    // 4. Create Pending Order
    const breakdown = await this.feeService.calculateForAmount(amount, cours.creatorId.toString());
    const idempotencyKey = this.getRequestIdempotencyKey(req);
    const reusableOrder = await this.findReusablePendingContentOrder({
      userId, contentType: TrackableContentType.CHAPTER, contentId: chapterId, idempotencyKey,
    });
    if (reusableOrder) return this.buildReusableStripeInitResponse(reusableOrder, 'chapter', chapterId, {
      amount, currency, chapterId, courseId: cours.id || cours._id.toString(), channel,
    });
    const pendingOrder = await this.orderModel.create({
      buyerId: new Types.ObjectId(userId),
      creatorId: cours.creatorId,
      contentType: TrackableContentType.CHAPTER,
      contentId: chapterId,   // Storing chapter ID as the main content ID
      amountDT: breakdown.amountDT,
      platformPercent: breakdown.platformPercent,
      platformFixedDT: breakdown.platformFixedDT,
      platformFeeDT: breakdown.platformFeeDT,
      creatorNetDT: breakdown.creatorNetDT,
      promoCode: appliedCode,
      discountDT,
      status: 'pending',
      paymentMethod: 'stripe',
      idempotencyKey,
      metadata: this.buildPendingFulfillmentMetadata({
        courseId: cours.id || cours._id.toString(), // Store course ID in metadata for access granting
        chapterTitle: targetChapter.titre,
        channel,
        ...(Object.keys(clientContext).length > 0 ? { clientContext } : {}),
        ...this.resolveAffiliateAttribution(req),
      })
    });

    // 5. Create Stripe Session
    const coursePublicId = cours.id || cours._id.toString();
    const defaultSuccessUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?scope=chapter&id=${chapterId}&courseId=${coursePublicId}&provider=stripe&sessionId={CHECKOUT_SESSION_ID}`;
    const defaultFailUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-failed?scope=chapter&id=${chapterId}&courseId=${coursePublicId}&provider=stripe`;
    const successUrl = this.resolveCheckoutRedirectUrl(defaultSuccessUrl, successRedirectUrl);
    const failUrl = this.resolveCheckoutRedirectUrl(defaultFailUrl, cancelRedirectUrl);

    const user = await this.userModel.findById(userId).select('email name');
    const session = await this.stripe.createLinkCheckoutSession({
      amountDT: amount,
      currency: currency.toLowerCase(),
      successUrl,
      cancelUrl: failUrl,
      customerEmail: user?.email,
      metadata: {
        userId,
        contentType: TrackableContentType.CHAPTER,
        contentId: chapterId,
        courseId: coursePublicId,
        orderId: pendingOrder._id.toString(),
        channel,
        ...(Object.keys(clientContext).length > 0 ? { clientContext: JSON.stringify(clientContext) } : {}),
      },
      lineItems: [{
        name: `${targetChapter.titre} (Chapter)`,
        description: `Access to single chapter in ${cours.titre}`,
        amount: amount,
        quantity: 1
      }]
    });

    if (!session.success) throw new BadRequestException(session.error);

    await this.persistStripeCheckout(pendingOrder, session);

    return this.buildStripeInitResponse({
      scope: 'chapter',
      targetId: chapterId,
      orderId: pendingOrder._id.toString(),
      sessionId: session.sessionId,
      checkoutUrl: session.url,
      extra: {
        amount,
        currency,
        chapterId,
        courseId: coursePublicId,
        channel,
      },
    });
  }


}
