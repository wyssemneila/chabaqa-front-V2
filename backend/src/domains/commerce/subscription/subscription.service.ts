import { Injectable, BadRequestException, NotFoundException, Logger, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BillingInterval, Subscription, SubscriptionDocument, SubscriptionStatus } from '@/infrastructure/database/schemas/commerce/subscription.schema';
import { Plan, PlanDocument, PlanTier } from '@/infrastructure/database/schemas/commerce/plan.schema';
import { Order, OrderDocument } from '@/infrastructure/database/schemas/commerce/order.schema';
import {
  BillingInvoice,
  BillingInvoiceDocument,
  BillingInvoiceOwnerType,
  BillingInvoiceStatus,
} from '@/infrastructure/database/schemas/commerce/billing-invoice.schema';
import {
  CommunityMemberSubscription,
  CommunityMemberSubscriptionDocument,
  CommunityMemberSubscriptionStatus,
} from '@/infrastructure/database/schemas/commerce/community-member-subscription.schema';
import {
  SubscriptionAddon,
  SubscriptionAddonDocument,
  SubscriptionAddonStatus,
  SubscriptionAddonType,
} from '@/infrastructure/database/schemas/commerce/subscription-addon.schema';
import { UsageEvent, UsageEventDocument } from '@/infrastructure/database/schemas/commerce/usage-event.schema';
import { Community, CommunityDocument } from '@/infrastructure/database/schemas/community/community.schema';
import { Cours, CoursDocument } from '@/infrastructure/database/schemas/learning/course.schema';
import { CommunityStaff, CommunityStaffDocument } from '@/infrastructure/database/schemas/community/community-staff.schema';
import { StorageUsage, StorageUsageDocument } from '@/infrastructure/database/schemas/shared/storage-usage.schema';
import { EmailCampaign } from '@/infrastructure/database/schemas/communication/email-campaign.schema';
import { WhatsappCampaign } from '@/infrastructure/database/schemas/communication/whatsapp-campaign.schema';
import { 
  CreateSubscriptionDto, 
  UpdateSubscriptionDto, 
  GetSubscriptionsQueryDto, 
  SubscriptionResponseDto, 
  SubscriptionStatsDto, 
  SubscriptionPlanDto,
  WebhookEventDto,
  WebhookResponseDto,
  InvoiceDto,
  InvoiceListDto,
  CreateInvoiceDto,
  UsageTrackingDto,
  UsageSummaryDto,
  RecordUsageDto,
  UsageMetricType
} from '@/domains/commerce/subscription/dto';
import { PaginatedResponseDto } from '@/shared/dto/paginated-response.dto';
import {
  DEFAULT_CREATOR_PLAN_DOCS,
  getDefaultCreatorPlanDoc,
  normalizeCreatorPlanTier,
} from '@/domains/commerce/subscription/default-creator-plans';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private readonly addonCatalog = {
    [SubscriptionAddonType.STORAGE_50GB]: {
      type: SubscriptionAddonType.STORAGE_50GB,
      label: 'Extra storage 50 GB',
      unitAmount: 19,
      storageGBDelta: 50,
      adminsDelta: 0,
    },
    [SubscriptionAddonType.ADMIN_SEAT]: {
      type: SubscriptionAddonType.ADMIN_SEAT,
      label: 'Extra admin seat',
      unitAmount: 29,
      storageGBDelta: 0,
      adminsDelta: 1,
    },
  };

  constructor(
    @InjectModel(Subscription.name) private readonly subModel: Model<SubscriptionDocument>,
    @InjectModel(Plan.name) private readonly planModel: Model<PlanDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(BillingInvoice.name) private readonly invoiceModel: Model<BillingInvoiceDocument>,
    @InjectModel(UsageEvent.name) private readonly usageEventModel: Model<UsageEventDocument>,
    @InjectModel(SubscriptionAddon.name) private readonly addonModel: Model<SubscriptionAddonDocument>,
    @InjectModel(CommunityMemberSubscription.name)
    private readonly memberSubscriptionModel: Model<CommunityMemberSubscriptionDocument>,
    @InjectModel(Community.name) private readonly communityModel: Model<CommunityDocument>,
    @InjectModel(Cours.name) private readonly courseModel: Model<CoursDocument>,
    @InjectModel(CommunityStaff.name) private readonly communityStaffModel: Model<CommunityStaffDocument>,
    @InjectModel(StorageUsage.name) private readonly storageUsageModel: Model<StorageUsageDocument>,
    @InjectModel(EmailCampaign.name) private readonly emailCampaignModel: Model<any>,
    @InjectModel(WhatsappCampaign.name) private readonly whatsappCampaignModel: Model<any>,
  ) {}

  getPlanAmount(plan: PlanDocument, interval: BillingInterval | 'month' | 'year' = BillingInterval.MONTH): number {
    if (String(interval) === BillingInterval.YEAR) {
      return Number(
        plan.yearlyTotalDT ||
        ((plan.yearlyPriceDTPerMonth || 0) * 12) ||
        ((plan.priceDTPerMonth || 0) * 12),
      );
    }

    return Number(plan.priceDTPerMonth || 0);
  }

  private buildFallbackPeriod(interval: BillingInterval | 'month' | 'year', now = new Date()) {
    const days = String(interval) === BillingInterval.YEAR ? 365 : 30;
    return {
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + days * 24 * 60 * 60 * 1000),
    };
  }

  private buildPlanLimitSnapshot(plan: PlanDocument) {
    return {
      communitiesMax: plan.limits.communitiesMax,
      membersMax: plan.limits.membersMax,
      coursesActivationMax: plan.limits.coursesActivationMax,
      storageGB: plan.limits.storageGB,
      adminsMax: plan.limits.adminsMax,
      emailCampaignRecipientsPerMonth: plan.limits.emailCampaignRecipientsPerMonth,
      whatsappMessagesPerMonth: plan.limits.whatsappMessagesPerMonth,
      analyticsLookbackDays: plan.limits.analyticsLookbackDays,
      sessionBookingsPerMonth: plan.limits.sessionBookingsPerMonth,
      aiAgentsMax: plan.limits.aiAgentsMax,
      aiCofounderRunsPerMonth: plan.limits.aiCofounderRunsPerMonth,
      aiKnowledgeReindexPerMonth: plan.limits.aiKnowledgeReindexPerMonth,
      aiStaffChatTurnsPerMonth: plan.limits.aiStaffChatTurnsPerMonth,
    };
  }

  private normalizeProviderStatus(status?: string): SubscriptionStatus {
    switch (String(status || '').toLowerCase()) {
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

  private normalizeBillingInterval(interval?: BillingInterval | 'month' | 'year' | string): BillingInterval {
    return String(interval || '').toLowerCase() === BillingInterval.YEAR
      ? BillingInterval.YEAR
      : BillingInterval.MONTH;
  }

  private async upsertDefaultCreatorPlan(tier: PlanTier, session: any = null): Promise<PlanDocument | null> {
    const defaultPlan = getDefaultCreatorPlanDoc(tier);
    if (!defaultPlan) return null;

    const query = this.planModel.findOneAndUpdate(
      { tier: defaultPlan.tier },
      { $set: defaultPlan },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    if (session) query.session(session);
    return query.exec();
  }

  private async ensureDefaultCreatorPlans(): Promise<void> {
    await Promise.all(
      DEFAULT_CREATOR_PLAN_DOCS.map((plan) => this.upsertDefaultCreatorPlan(plan.tier)),
    );
  }

  async getActivePlanOrBootstrap(tier: string | PlanTier, session: any = null): Promise<PlanDocument | null> {
    const normalizedTier = normalizeCreatorPlanTier(String(tier));
    if (!normalizedTier) return null;

    const query = this.planModel.findOne({ tier: normalizedTier, isActive: true });
    if (session) query.session(session);
    const existing = await query.exec();
    if (existing) return existing;

    return this.upsertDefaultCreatorPlan(normalizedTier, session);
  }

  private toPlanDto(plan: PlanDocument): SubscriptionPlanDto {
    return {
      tier: plan.tier,
      name: plan.name,
      priceDTPerMonth: plan.priceDTPerMonth,
      yearlyPriceDTPerMonth: plan.yearlyPriceDTPerMonth,
      yearlyTotalDT: plan.yearlyTotalDT,
      trialDays: plan.trialDays,
      limits: plan.limits,
      features: plan.features,
      transactionFeePercent: plan.transactionFeePercent,
      transactionFixedFeeDT: plan.transactionFixedFeeDT,
      isActive: plan.isActive,
    };
  }

  private normalizeObjectId(value: string | Types.ObjectId): Types.ObjectId {
    if (value instanceof Types.ObjectId) return value;
    if (!Types.ObjectId.isValid(String(value))) {
      throw new BadRequestException('Invalid ObjectId');
    }
    return new Types.ObjectId(String(value));
  }

  private toInvoiceDto(invoice: any): InvoiceDto {
    const id = invoice?._id?.toString?.() || invoice?.id || '';
    return {
      id,
      customerId: invoice.customerId?.toString?.() || invoice.creatorId?.toString?.() || '',
      subscriptionId: invoice.subscriptionId?.toString?.() || invoice.providerSubscriptionId || '',
      status: invoice.status || BillingInvoiceStatus.PAID,
      invoiceNumber: invoice.invoiceNumber || id,
      total: Number(invoice.total || 0),
      subtotal: Number(invoice.subtotal || invoice.total || 0),
      tax: Number(invoice.tax || 0),
      currency: invoice.currency || 'TND',
      invoiceDate: new Date(invoice.invoiceDate || invoice.createdAt || Date.now()).toISOString(),
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString() : undefined,
      paidAt: invoice.paidAt ? new Date(invoice.paidAt).toISOString() : undefined,
      lineItems: Array.isArray(invoice.lineItems) ? invoice.lineItems.map((item: any) => ({
        id: String(item.id || ''),
        description: String(item.description || 'Billing item'),
        amount: Number(item.amount || 0),
        currency: item.currency || invoice.currency || 'TND',
        quantity: Number(item.quantity || 1),
      })) : [],
      invoicePdfUrl: invoice.invoicePdfUrl,
      createdAt: new Date(invoice.createdAt || invoice.invoiceDate || Date.now()).toISOString(),
      updatedAt: new Date(invoice.updatedAt || invoice.createdAt || Date.now()).toISOString(),
    };
  }

  private periodForInterval(interval: BillingInterval | 'month' | 'year', start = new Date()) {
    const end = new Date(start);
    if (String(interval) === BillingInterval.YEAR) {
      end.setFullYear(end.getFullYear() + 1);
    } else {
      end.setMonth(end.getMonth() + 1);
    }
    return { currentPeriodStart: start, currentPeriodEnd: end };
  }

  private percent(current: number, limit: number): number {
    if (!Number.isFinite(current) || !Number.isFinite(limit) || limit <= 0 || limit >= 999999) {
      return 0;
    }
    return Math.round(Math.min(100, (current / limit) * 10000)) / 100;
  }

  async startTrialForCreator(creatorId: string | Types.ObjectId) {
    try {
      const existing = await this.subModel.findOne({ creatorId: new Types.ObjectId(creatorId as any) });
      
      // Check for existing active or trial subscription
      if (existing && (existing.status === SubscriptionStatus.ACTIVE || existing.status === SubscriptionStatus.TRIALING)) {
        throw new ConflictException('Une souscription active existe déjà');
      }

      // Get the starter plan
      const plan = await this.planModel.findOne({ tier: PlanTier.STARTER, isActive: true });
      if (!plan) {
        throw new NotFoundException('Plan STARTER introuvable');
      }

      const now = new Date();
      const trialDays = plan.trialDays || 7;
      const trialEnds = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

      const sub = await this.subModel.findOneAndUpdate(
        { creatorId: new Types.ObjectId(creatorId as any) },
        {
          $set: {
            plan: plan.tier,
            status: SubscriptionStatus.TRIALING,
            trialEndsAt: trialEnds,
            currentPeriodStart: now,
            currentPeriodEnd: trialEnds,
            cancelAtPeriodEnd: false,
            communitiesMax: plan.limits.communitiesMax,
            membersMax: plan.limits.membersMax,
            coursesActivationMax: plan.limits.coursesActivationMax,
            storageGB: plan.limits.storageGB,
            adminsMax: plan.limits.adminsMax,
          },
        },
        { upsert: true, new: true },
      );

      this.logger.log(`Trial started for creator ${creatorId}, trial ends at ${trialEnds}`);

      return {
        message: 'Essai gratuit démarré avec succès',
        subscription: sub,
        trialEndsAt: trialEnds,
        trialDays,
      };
    } catch (error) {
      this.logger.error(`Failed to start trial for creator ${creatorId}:`, error.message);
      throw error;
    }
  }

  async setupBillingMethod(
    creatorId: string | Types.ObjectId, 
    body: { 
      providerCustomerId: string; 
      paymentBrand?: string; 
      paymentLast4?: string; 
      provider?: string;
    }
  ) {
    try {
      if (!body?.providerCustomerId) {
        throw new BadRequestException('providerCustomerId requis');
      }

      // Validate provider
      const validProviders = ['stripe', 'paypal', 'custom'];
      const provider = body.provider || 'custom';
      if (!validProviders.includes(provider)) {
        throw new BadRequestException(`Provider non supporté. Providers valides: ${validProviders.join(', ')}`);
      }

      // Validate payment brand if provided
      if (body.paymentBrand) {
        const validBrands = ['visa', 'mastercard', 'amex', 'discover', 'diners', 'jcb', 'unionpay'];
        if (!validBrands.includes(body.paymentBrand.toLowerCase())) {
          throw new BadRequestException(`Type de carte non supporté: ${body.paymentBrand}`);
        }
      }

      // Validate last 4 digits
      if (body.paymentLast4 && !/^\d{4}$/.test(body.paymentLast4)) {
        throw new BadRequestException('Les 4 derniers chiffres doivent être exactement 4 chiffres');
      }

      const sub = await this.subModel.findOneAndUpdate(
        { creatorId: new Types.ObjectId(creatorId as any) },
        {
          $set: {
            provider,
            providerCustomerId: body.providerCustomerId,
            hasPaymentMethod: true,
            paymentBrand: body.paymentBrand?.toLowerCase(),
            paymentLast4: body.paymentLast4,
          },
        },
        { upsert: true, new: true },
      );

      this.logger.log(`Billing method setup for creator ${creatorId} with provider ${provider}`);

      return { 
        message: 'Moyen de paiement enregistré avec succès', 
        subscription: sub,
        provider,
        maskedCard: body.paymentBrand && body.paymentLast4 ? `**** **** **** ${body.paymentLast4}` : undefined
      };
    } catch (error) {
      this.logger.error(`Failed to setup billing for creator ${creatorId}:`, error.message);
      throw error;
    }
  }

  // Called by cron or before guarded actions to auto-activate expired trials
  async ensureActiveOrTrial(creatorId: string | Types.ObjectId) {
    const sub = await this.subModel.findOne({ creatorId: new Types.ObjectId(creatorId as any) });
    if (!sub) return null;
    const now = new Date();
    if (sub.status === SubscriptionStatus.TRIALING && sub.trialEndsAt && sub.trialEndsAt.getTime() <= now.getTime()) {
      if (sub.hasPaymentMethod) {
        // Auto-activate to STARTER (stub billing capture; in real flow, create provider sub)
        sub.status = SubscriptionStatus.ACTIVE;
        sub.currentPeriodStart = now;
        sub.currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        await sub.save();
      } else {
        // Trial ended without billing: remain not active; policy will block activation
        return sub;
      }
    }
    return sub;
  }

  async upgradePlan(
    creatorId: string | Types.ObjectId,
    tier: PlanTier,
    session: any = null,
    options: {
      billingInterval?: BillingInterval | 'month' | 'year';
      provider?: string;
      providerCustomerId?: string;
      providerSubscriptionId?: string;
      providerCheckoutSessionId?: string;
      providerPriceId?: string;
      currentPeriodStart?: Date;
      currentPeriodEnd?: Date;
      trialEndsAt?: Date;
      status?: SubscriptionStatus;
      amount?: number;
      currency?: string;
      paymentBrand?: string;
      paymentLast4?: string;
      hasPaymentMethod?: boolean;
      cancelAtPeriodEnd?: boolean;
    } = {},
  ) {
    const plan = await this.getActivePlanOrBootstrap(tier, session);
    if (!plan) {
      throw new BadRequestException('Plan introuvable ou inactif');
    }

    const interval = options.billingInterval || BillingInterval.MONTH;
    const fallbackPeriod = this.buildFallbackPeriod(interval);
    const currentPeriodStart = options.currentPeriodStart || fallbackPeriod.currentPeriodStart;
    const currentPeriodEnd = options.currentPeriodEnd || fallbackPeriod.currentPeriodEnd;
    const amount = options.amount ?? this.getPlanAmount(plan, interval);

    const setPayload: Record<string, any> = {
      plan: plan.tier,
      status: options.status || SubscriptionStatus.ACTIVE,
      currentPeriodStart,
      currentPeriodEnd,
      nextBillingAt: currentPeriodEnd,
      cancelAtPeriodEnd: options.cancelAtPeriodEnd ?? false,
      billingInterval: interval,
      amount,
      currency: options.currency || 'TND',
      hasPaymentMethod: options.hasPaymentMethod ?? true,
      ...this.buildPlanLimitSnapshot(plan),
    };

    if (options.provider) setPayload.provider = options.provider;
    if (options.providerCustomerId) setPayload.providerCustomerId = options.providerCustomerId;
    if (options.providerSubscriptionId) setPayload.providerSubscriptionId = options.providerSubscriptionId;
    if (options.providerCheckoutSessionId) setPayload.providerCheckoutSessionId = options.providerCheckoutSessionId;
    if (options.providerPriceId) setPayload.providerPriceId = options.providerPriceId;
    if (options.trialEndsAt) setPayload.trialEndsAt = options.trialEndsAt;
    if (options.paymentBrand) setPayload.paymentBrand = options.paymentBrand.toLowerCase();
    if (options.paymentLast4) setPayload.paymentLast4 = options.paymentLast4;

    const sub = await this.subModel.findOneAndUpdate(
      { creatorId: new Types.ObjectId(creatorId as any) },
      { $set: setPayload },
      { upsert: true, new: true, session, setDefaultsOnInsert: true },
    );

    return { message: 'Plan mis à jour', subscription: sub };
  }

  async cancelAtPeriodEnd(creatorId: string | Types.ObjectId) {
    const sub = await this.subModel.findOne({ creatorId: new Types.ObjectId(creatorId as any) });
    if (!sub) {
      throw new BadRequestException('Aucune souscription trouvée');
    }
    sub.cancelAtPeriodEnd = true;
    await sub.save();
    return { message: 'La souscription sera annulée à la fin de la période', subscription: sub };
  }

  async getMySubscription(creatorId: string | Types.ObjectId) {
    const sub = await this.subModel.findOne({ creatorId: new Types.ObjectId(creatorId as any) });
    return sub || null;
  }

  async getTrialRemaining(creatorId: string | Types.ObjectId) {
    const sub = await this.subModel.findOne({ creatorId: new Types.ObjectId(creatorId as any) });
    if (!sub) {
      return {
        isTrialing: false,
        expiresAt: null,
        remaining: { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 },
        message: 'No subscription found',
      };
    }

    const now = new Date();
    const expiresAt = sub.trialEndsAt || null;
    const isTrialing = sub.status === SubscriptionStatus.TRIALING && !!expiresAt && expiresAt.getTime() > now.getTime();

    if (!isTrialing) {
      return {
        isTrialing: false,
        expiresAt,
        remaining: { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 },
        message: 'Not in trial',
      };
    }

    const diffMs = expiresAt!.getTime() - now.getTime();
    const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      isTrialing: true,
      expiresAt,
      remaining: { days, hours, minutes, seconds, totalMs: diffMs },
      message: 'Trial active',
    };
  }

  // New methods for comprehensive subscription management

  async getSubscriptionStats(creatorId: string | Types.ObjectId): Promise<SubscriptionStatsDto> {
    const stats = await this.subModel.aggregate([
      {
        $match: {
          creatorId: new Types.ObjectId(creatorId as any)
        }
      },
      {
        $group: {
          _id: null,
          totalSubscribers: { $sum: 1 },
          activeSubscribers: {
            $sum: {
              $cond: [{ $eq: ['$status', SubscriptionStatus.ACTIVE] }, 1, 0]
            }
          },
          trialSubscribers: {
            $sum: {
              $cond: [{ $eq: ['$status', SubscriptionStatus.TRIALING] }, 1, 0]
            }
          },
          canceledSubscribers: {
            $sum: {
              $cond: [{ $eq: ['$status', SubscriptionStatus.CANCELED] }, 1, 0]
            }
          },
          pastDueSubscribers: {
            $sum: {
              $cond: [{ $eq: ['$status', SubscriptionStatus.PAST_DUE] }, 1, 0]
            }
          },
          revenueActiveTrial: {
            $sum: {
              $cond: [
                { $in: ['$status', [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING, SubscriptionStatus.PAST_DUE]] },
                '$amount',
                0
              ]
            }
          },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const result = stats[0] || {
      totalSubscribers: 0,
      activeSubscribers: 0,
      trialSubscribers: 0,
      canceledSubscribers: 0,
      pastDueSubscribers: 0,
      revenueActiveTrial: 0,
      totalAmount: 0
    };

    const activeOrTrialCount = result.activeSubscribers + result.trialSubscribers;
    const averageSubscriptionValue = activeOrTrialCount > 0
      ? result.revenueActiveTrial / activeOrTrialCount
      : 0;
    const monthlyRevenue = result.revenueActiveTrial;

    return {
      totalSubscribers: result.totalSubscribers,
      activeSubscribers: result.activeSubscribers,
      monthlyRevenue,
      averageSubscriptionValue,
      trialSubscribers: result.trialSubscribers,
      canceledSubscribers: result.canceledSubscribers,
      pastDueSubscribers: result.pastDueSubscribers
    };
  }

  async getAllSubscriptions(
    creatorId: string | Types.ObjectId,
    query: GetSubscriptionsQueryDto
  ): Promise<PaginatedResponseDto<SubscriptionResponseDto>> {
    const {
      status,
      plan,
      startDate,
      endDate,
      page = '1',
      limit = '20'
    } = query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;

    // Build filter
    const filter: any = {};
    if (creatorId) filter.creatorId = new Types.ObjectId(creatorId as any);
    if (status) filter.status = status;
    if (plan) filter.plan = plan;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (pageNum - 1) * limitNum;

    // Execute queries
    const [subscriptions, total] = await Promise.all([
      this.subModel
        .find(filter)
        .populate('creatorId', 'name email')
        .populate('subscriberId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .exec(),
      this.subModel.countDocuments(filter)
    ]);

    // Transform to response DTOs
    const subscriptionDtos: SubscriptionResponseDto[] = subscriptions.map(sub => {
      const subscriberPopulated = (sub as any).subscriberId;
      const subscriberEmail = subscriberPopulated?.email;
      return {
        id: sub._id.toString(),
        creatorId: sub.creatorId.toString(),
        subscriberId: sub.subscriberId?.toString?.() || '',
        subscriberEmail,
        plan: sub.plan,
        provider: sub.provider || '',
        providerCustomerId: sub.providerCustomerId || undefined,
        providerSubscriptionId: sub.providerSubscriptionId || undefined,
        billingInterval: sub.billingInterval,
        providerCheckoutSessionId: sub.providerCheckoutSessionId || undefined,
        providerPriceId: sub.providerPriceId || undefined,
        trialEndsAt: sub.trialEndsAt || undefined,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        nextBillingAt: sub.nextBillingAt,
        status: sub.status,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        amount: sub.amount ?? 0,
        currency: sub.currency || 'TND',
        communitiesMax: sub.communitiesMax,
        membersMax: sub.membersMax,
        coursesActivationMax: sub.coursesActivationMax,
        storageGB: sub.storageGB,
        adminsMax: sub.adminsMax,
        hasPaymentMethod: sub.hasPaymentMethod,
        paymentBrand: sub.paymentBrand || undefined,
        paymentLast4: sub.paymentLast4 || undefined,
        createdAt: (sub as any).createdAt,
        updatedAt: (sub as any).updatedAt
      };
    });

    return new PaginatedResponseDto(subscriptionDtos, total, pageNum, limitNum);
  }

  async createPlan(createPlanDto: CreateSubscriptionDto): Promise<SubscriptionPlanDto> {
    const plan = await this.planModel.create({
      tier: createPlanDto.plan,
      name: `${createPlanDto.plan.charAt(0).toUpperCase() + createPlanDto.plan.slice(1)} Plan`,
      priceDTPerMonth: createPlanDto.amount,
      trialDays: 7, // Default trial days
      limits: {
        communitiesMax: 1,
        membersMax: 100,
        coursesActivationMax: 3,
        storageGB: 2,
        adminsMax: 0
      },
      features: {
        courses: true,
        challenges: false,
        sessions: false,
        products: true,
        events: false,
        automationQuota: 0,
        branding: false,
        gamification: false,
        verifiedBadge: false,
        featuredBadge: false
      },
      transactionFeePercent: 2.9,
      transactionFixedFeeDT: 0.3,
      isActive: true
    });

    return this.toPlanDto(plan);
  }

  async getPlans(): Promise<SubscriptionPlanDto[]> {
    await this.ensureDefaultCreatorPlans();
    const planOrder: PlanTier[] = DEFAULT_CREATOR_PLAN_DOCS.map((plan) => plan.tier);
    const plans = await this.planModel.find({ isActive: true }).exec();

    return plans
      .sort((a, b) => {
        const aIndex = planOrder.indexOf(a.tier);
        const bIndex = planOrder.indexOf(b.tier);
        return (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex)
          - (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex);
      })
      .map(plan => this.toPlanDto(plan));
  }

  async getPlanByTier(tier: PlanTier): Promise<SubscriptionPlanDto> {
    const plan = await this.getActivePlanOrBootstrap(tier);
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return this.toPlanDto(plan);
  }

  async updatePlan(tier: PlanTier, updatePlanDto: UpdateSubscriptionDto): Promise<SubscriptionPlanDto> {
    const plan = await this.planModel.findOne({ tier }).exec();
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // Update fields
    if (updatePlanDto.amount) plan.priceDTPerMonth = updatePlanDto.amount;
    if (updatePlanDto.communitiesMax !== undefined) plan.limits.communitiesMax = updatePlanDto.communitiesMax;
    if (updatePlanDto.membersMax !== undefined) plan.limits.membersMax = updatePlanDto.membersMax;
    if (updatePlanDto.coursesActivationMax !== undefined) plan.limits.coursesActivationMax = updatePlanDto.coursesActivationMax;
    if (updatePlanDto.storageGB !== undefined) plan.limits.storageGB = updatePlanDto.storageGB;
    if (updatePlanDto.adminsMax !== undefined) plan.limits.adminsMax = updatePlanDto.adminsMax;

    await plan.save();

    return this.toPlanDto(plan);
  }

  async deletePlan(tier: PlanTier): Promise<{ message: string }> {
    const plan = await this.planModel.findOne({ tier }).exec();
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    plan.isActive = false;
    await plan.save();

    return { message: 'Plan deactivated successfully' };
  }

  async exportSubscriptions(
    creatorId: string | Types.ObjectId,
    filters?: { status?: string; plan?: PlanTier; startDate?: string; endDate?: string }
  ): Promise<{ message: string; downloadUrl: string }> {
    // In a real implementation, this would generate a CSV file and return a download URL
    // For now, we'll just return a mock response
    return {
      message: 'Subscriptions exported successfully',
      downloadUrl: `/exports/subscriptions-${creatorId}-${Date.now()}.csv`
    };
  }

  async updateSubscription(subscriptionId: string, updateDto: UpdateSubscriptionDto): Promise<SubscriptionResponseDto> {
    const subscription = await this.subModel.findById(subscriptionId).exec();
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Update fields
    Object.assign(subscription, updateDto);
    await subscription.save();

    return {
      id: subscription._id.toString(),
      creatorId: subscription.creatorId.toString(),
      subscriberId: subscription.subscriberId?.toString?.() || '',
      // subscriberEmail populated only when query populates subscriberId; here we return undefined
      subscriberEmail: undefined,
      plan: subscription.plan,
      provider: subscription.provider || '',
      providerCustomerId: subscription.providerCustomerId || undefined,
      providerSubscriptionId: subscription.providerSubscriptionId || undefined,
      billingInterval: subscription.billingInterval,
      providerCheckoutSessionId: subscription.providerCheckoutSessionId || undefined,
      providerPriceId: subscription.providerPriceId || undefined,
      trialEndsAt: subscription.trialEndsAt || undefined,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      nextBillingAt: subscription.nextBillingAt,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      amount: subscription.amount ?? 0,
      currency: subscription.currency || 'TND',
      communitiesMax: subscription.communitiesMax,
      membersMax: subscription.membersMax,
      coursesActivationMax: subscription.coursesActivationMax,
      storageGB: subscription.storageGB,
      adminsMax: subscription.adminsMax,
      hasPaymentMethod: subscription.hasPaymentMethod,
      paymentBrand: subscription.paymentBrand || undefined,
      paymentLast4: subscription.paymentLast4 || undefined,
      createdAt: (subscription as any).createdAt,
      updatedAt: (subscription as any).updatedAt
    };
  }

  async deleteSubscription(subscriptionId: string): Promise<{ message: string }> {
    try {
      const subscription = await this.subModel.findById(subscriptionId).exec();
      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      // Only allow deletion of canceled subscriptions
      if (subscription.status !== SubscriptionStatus.CANCELED) {
        throw new BadRequestException('Only canceled subscriptions can be deleted. Cancel the subscription first.');
      }

      await this.subModel.deleteOne({ _id: subscriptionId }).exec();
      
      this.logger.log(`Subscription ${subscriptionId} deleted successfully`);
      return { message: 'Subscription deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete subscription ${subscriptionId}:`, error.message);
      throw error;
    }
  }

  // ============ NEW WEBHOOK FUNCTIONALITY ============

  async handleWebhook(webhookEvent: WebhookEventDto): Promise<WebhookResponseDto> {
    try {
      this.logger.log(`Processing webhook event: ${webhookEvent.type} - ${webhookEvent.id}`);

      switch (webhookEvent.type) {
        case 'subscription.created':
        case 'customer.subscription.created':
          return await this.handleSubscriptionCreated(webhookEvent);
        case 'subscription.updated':
        case 'customer.subscription.updated':
          return await this.handleSubscriptionUpdated(webhookEvent);
        case 'subscription.deleted':
        case 'customer.subscription.deleted':
          return await this.handleSubscriptionDeleted(webhookEvent);
        case 'invoice.payment_succeeded':
          return await this.handleInvoicePaymentSucceeded(webhookEvent);
        case 'invoice.payment_failed':
          return await this.handleInvoicePaymentFailed(webhookEvent);
        case 'customer.subscription.trial_will_end':
          return await this.handleTrialWillEnd(webhookEvent);
        case 'payment_method.attached':
          return await this.handlePaymentMethodAttached(webhookEvent);
        case 'payment_method.detached':
          return await this.handlePaymentMethodDetached(webhookEvent);
        default:
          this.logger.warn(`Unhandled webhook event type: ${webhookEvent.type}`);
          return {
            message: 'Event type not handled',
            eventId: webhookEvent.id,
            status: 'skipped'
          };
      }
    } catch (error) {
      this.logger.error(`Webhook processing failed for event ${webhookEvent.id}:`, error.message);
      return {
        message: 'Webhook processing failed',
        eventId: webhookEvent.id,
        status: 'error'
      };
    }
  }

  private async handleSubscriptionCreated(webhookEvent: WebhookEventDto): Promise<WebhookResponseDto> {
    const data = webhookEvent.data.object;
    
    // Find subscription by provider subscription ID
    const subscription = await this.subModel.findOne({ 
      providerSubscriptionId: data.id 
    });

    if (subscription) {
      subscription.status = this.normalizeProviderStatus(data.status);
      if (data.current_period_start) {
        subscription.currentPeriodStart = new Date(data.current_period_start * 1000);
      }
      if (data.current_period_end) {
        subscription.currentPeriodEnd = new Date(data.current_period_end * 1000);
        subscription.nextBillingAt = subscription.currentPeriodEnd;
      }
      if (typeof data.cancel_at_period_end === 'boolean') {
        subscription.cancelAtPeriodEnd = data.cancel_at_period_end;
      }
      await subscription.save();
    }

    return {
      message: 'Subscription created event processed',
      eventId: webhookEvent.id,
      status: 'success'
    };
  }

  private async handleSubscriptionUpdated(webhookEvent: WebhookEventDto): Promise<WebhookResponseDto> {
    const data = webhookEvent.data.object;
    
    const subscription = await this.subModel.findOne({ 
      providerSubscriptionId: data.id 
    });

    if (subscription) {
      subscription.status = this.normalizeProviderStatus(data.status);
      if (data.current_period_start) {
        subscription.currentPeriodStart = new Date(data.current_period_start * 1000);
      }
      if (data.current_period_end) {
        subscription.currentPeriodEnd = new Date(data.current_period_end * 1000);
        subscription.nextBillingAt = subscription.currentPeriodEnd;
      }
      subscription.cancelAtPeriodEnd = data.cancel_at_period_end || false;
      await subscription.save();
    }

    return {
      message: 'Subscription updated event processed',
      eventId: webhookEvent.id,
      status: 'success'
    };
  }

  private async handleSubscriptionDeleted(webhookEvent: WebhookEventDto): Promise<WebhookResponseDto> {
    const data = webhookEvent.data.object;
    
    const subscription = await this.subModel.findOne({ 
      providerSubscriptionId: data.id 
    });

    if (subscription) {
      subscription.status = SubscriptionStatus.CANCELED;
      await subscription.save();
    }

    return {
      message: 'Subscription deleted event processed',
      eventId: webhookEvent.id,
      status: 'success'
    };
  }

  private async handleInvoicePaymentSucceeded(webhookEvent: WebhookEventDto): Promise<WebhookResponseDto> {
    const data = webhookEvent.data.object;
    
    const subscription = await this.subModel.findOne({ 
      providerSubscriptionId: data.subscription 
    });

    if (subscription) {
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.hasPaymentMethod = true;
      // Update billing period from invoice data
      if (data.period_start) {
        subscription.currentPeriodStart = new Date(data.period_start * 1000);
      }
      if (data.period_end) {
        subscription.currentPeriodEnd = new Date(data.period_end * 1000);
        subscription.nextBillingAt = subscription.currentPeriodEnd;
      }
      if (data.amount_paid) {
        subscription.amount = data.amount_paid / 100;
      }
      await subscription.save();

      await this.invoiceModel.updateOne(
        { provider: 'stripe', providerInvoiceId: data.id },
        {
          $set: {
            creatorId: subscription.creatorId,
            customerId: subscription.creatorId,
            subscriptionId: subscription._id,
            ownerType: BillingInvoiceOwnerType.PLATFORM_SUBSCRIPTION,
            provider: 'stripe',
            providerInvoiceId: data.id,
            providerSubscriptionId: data.subscription,
            status: BillingInvoiceStatus.PAID,
            invoiceNumber: data.number || data.id,
            total: Number(data.amount_paid || data.total || 0) / 100,
            subtotal: Number(data.subtotal || data.amount_paid || 0) / 100,
            tax: Number(data.tax || 0) / 100,
            currency: String(data.currency || subscription.currency || 'TND').toUpperCase(),
            invoiceDate: data.created ? new Date(data.created * 1000) : new Date(),
            paidAt: data.status_transitions?.paid_at ? new Date(data.status_transitions.paid_at * 1000) : new Date(),
            invoicePdfUrl: data.invoice_pdf || data.hosted_invoice_url,
            lineItems: [{
              id: data.lines?.data?.[0]?.id || `li-${data.id}`,
              description: data.lines?.data?.[0]?.description || `${subscription.plan} plan billing`,
              amount: Number(data.amount_paid || data.total || 0) / 100,
              currency: String(data.currency || subscription.currency || 'TND').toUpperCase(),
              quantity: 1,
            }],
            metadata: { webhookEvent: webhookEvent.id },
          },
        },
        { upsert: true },
      );
      
      this.logger.log(`Payment succeeded for subscription ${subscription._id}, amount: ${data.amount_paid / 100}`);
    }

    return {
      message: 'Invoice payment succeeded event processed',
      eventId: webhookEvent.id,
      status: 'success'
    };
  }

  private async handleInvoicePaymentFailed(webhookEvent: WebhookEventDto): Promise<WebhookResponseDto> {
    const data = webhookEvent.data.object;
    
    const subscription = await this.subModel.findOne({ 
      providerSubscriptionId: data.subscription 
    });

    if (subscription) {
      subscription.status = SubscriptionStatus.PAST_DUE;
      await subscription.save();
      
      // Log failed payment
      this.logger.warn(`Payment failed for subscription ${subscription._id}, amount: ${data.amount_due / 100}`);
    }

    return {
      message: 'Invoice payment failed event processed',
      eventId: webhookEvent.id,
      status: 'success'
    };
  }

  private async handleTrialWillEnd(webhookEvent: WebhookEventDto): Promise<WebhookResponseDto> {
    const data = webhookEvent.data.object;
    
    const subscription = await this.subModel.findOne({ 
      providerSubscriptionId: data.id 
    });

    if (subscription) {
      // Send notification about trial ending (implement notification service)
      this.logger.log(`Trial will end soon for subscription ${subscription._id}`);
    }

    return {
      message: 'Trial will end event processed',
      eventId: webhookEvent.id,
      status: 'success'
    };
  }

  private async handlePaymentMethodAttached(webhookEvent: WebhookEventDto): Promise<WebhookResponseDto> {
    const data = webhookEvent.data.object;
    
    // Find subscription by customer ID
    const subscription = await this.subModel.findOne({ 
      providerCustomerId: data.customer 
    });

    if (subscription) {
      subscription.hasPaymentMethod = true;
      subscription.paymentBrand = data.card?.brand;
      subscription.paymentLast4 = data.card?.last4;
      await subscription.save();
    }

    return {
      message: 'Payment method attached event processed',
      eventId: webhookEvent.id,
      status: 'success'
    };
  }

  private async handlePaymentMethodDetached(webhookEvent: WebhookEventDto): Promise<WebhookResponseDto> {
    const data = webhookEvent.data.object;
    
    const subscription = await this.subModel.findOne({ 
      providerCustomerId: data.customer 
    });

    if (subscription) {
      // Check if this was the last payment method
      subscription.hasPaymentMethod = false;
      subscription.paymentBrand = undefined;
      subscription.paymentLast4 = undefined;
      await subscription.save();
    }

    return {
      message: 'Payment method detached event processed',
      eventId: webhookEvent.id,
      status: 'success'
    };
  }

  // ============ INVOICE MANAGEMENT ============

  async recordInvoiceForOrder(
    order: any,
    options: {
      ownerType?: BillingInvoiceOwnerType;
      provider?: string;
      providerInvoiceId?: string;
      providerSubscriptionId?: string;
      subscriptionId?: string | Types.ObjectId;
      communityId?: string | Types.ObjectId;
      invoicePdfUrl?: string;
      status?: BillingInvoiceStatus;
    } = {},
    session: any = null,
  ): Promise<void> {
    if (!order?._id) return;

    const orderId = order._id instanceof Types.ObjectId ? order._id : new Types.ObjectId(String(order._id));
    const creatorId = order.creatorId instanceof Types.ObjectId ? order.creatorId : new Types.ObjectId(String(order.creatorId));
    const customerId = order.buyerId instanceof Types.ObjectId ? order.buyerId : new Types.ObjectId(String(order.buyerId));
    const invoiceDate = order.updatedAt || order.createdAt || new Date();
    const provider = options.provider || order.metadata?.provider || order.paymentMethod || 'manual';
    const externalProviderInvoiceId = String(options.providerInvoiceId || '').trim() || undefined;
    const providerInvoiceId = externalProviderInvoiceId || `order_${orderId.toString()}`;
    const invoiceNumber = externalProviderInvoiceId || `INV-${orderId.toString().slice(-10).toUpperCase()}`;

    const payload: Record<string, any> = {
      creatorId,
      customerId,
      orderId,
      ownerType: options.ownerType || BillingInvoiceOwnerType.PLATFORM_SUBSCRIPTION,
      provider,
      providerInvoiceId,
      providerSubscriptionId: options.providerSubscriptionId || order.metadata?.providerSubscriptionId,
      status: options.status || BillingInvoiceStatus.PAID,
      invoiceNumber,
      total: Number(order.amountDT || order.metadata?.amount || 0),
      subtotal: Number(order.amountDT || order.metadata?.amount || 0),
      tax: 0,
      currency: order.metadata?.currency || 'TND',
      invoiceDate,
      paidAt: invoiceDate,
      invoicePdfUrl: options.invoicePdfUrl,
      lineItems: [{
        id: `li-${orderId.toString()}`,
        description: this.describeOrderForInvoice(order),
        amount: Number(order.amountDT || order.metadata?.amount || 0),
        currency: order.metadata?.currency || 'TND',
        quantity: 1,
      }],
      metadata: {
        contentType: order.contentType,
        contentId: order.contentId,
        paymentMethod: order.paymentMethod,
        providerCheckoutSessionId: order.metadata?.providerCheckoutSessionId || order.paymentId,
        generatedProviderInvoiceId: !externalProviderInvoiceId,
      },
    };

    if (options.subscriptionId) {
      payload.subscriptionId = options.subscriptionId instanceof Types.ObjectId
        ? options.subscriptionId
        : new Types.ObjectId(String(options.subscriptionId));
    }
    const communityId = options.communityId || order.communityId;
    if (communityId && Types.ObjectId.isValid(String(communityId))) {
      payload.communityId = communityId instanceof Types.ObjectId ? communityId : new Types.ObjectId(String(communityId));
    }

    await this.invoiceModel.updateOne(
      { orderId },
      { $set: payload },
      { upsert: true, session },
    );
  }

  private describeOrderForInvoice(order: any): string {
    const tier = order.metadata?.tier || order.contentId;
    if (order.contentType === 'subscription') {
      return `${String(tier || 'Creator plan')} ${order.metadata?.billingInterval || 'month'} billing`;
    }
    if (order.contentType === 'community') {
      return 'Community membership';
    }
    return `${String(order.contentType || 'Payment')} purchase`;
  }

  async getInvoices(
    creatorId: string | Types.ObjectId,
    page: number = 1,
    limit: number = 20
  ): Promise<InvoiceListDto> {
    try {
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
      const filter = {
        creatorId: this.normalizeObjectId(creatorId),
        ownerType: BillingInvoiceOwnerType.PLATFORM_SUBSCRIPTION,
      };
      const [invoices, total] = await Promise.all([
        this.invoiceModel
          .find(filter)
          .sort({ invoiceDate: -1, createdAt: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .lean()
          .exec(),
        this.invoiceModel.countDocuments(filter),
      ]);

      return {
        invoices: invoices.map((invoice) => this.toInvoiceDto(invoice)),
        total,
        page: pageNum,
        limit: limitNum
      };
    } catch (error) {
      this.logger.error(`Failed to get invoices for creator ${creatorId}:`, error.message);
      throw error;
    }
  }

  async getInvoiceById(invoiceId: string, creatorId?: string | Types.ObjectId): Promise<InvoiceDto> {
    try {
      const query: any = Types.ObjectId.isValid(invoiceId)
        ? { _id: new Types.ObjectId(invoiceId) }
        : { providerInvoiceId: invoiceId };
      if (creatorId) {
        query.creatorId = this.normalizeObjectId(creatorId);
      }
      const invoice = await this.invoiceModel.findOne(query).lean().exec();
      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }
      return this.toInvoiceDto(invoice);
    } catch (error) {
      this.logger.error(`Failed to get invoice ${invoiceId}:`, error.message);
      throw error;
    }
  }

  async createInvoice(createInvoiceDto: CreateInvoiceDto): Promise<InvoiceDto> {
    try {
      const customerId = this.normalizeObjectId(createInvoiceDto.customerId);
      const subscription = Types.ObjectId.isValid(createInvoiceDto.subscriptionId)
        ? await this.subModel.findById(createInvoiceDto.subscriptionId).lean().exec()
        : null;
      const subscriptionId = subscription?._id;
      const total = (createInvoiceDto.lineItems || []).reduce(
        (sum, item) => sum + (Number(item.amount || 0) * Number(item.quantity || 1)),
        0,
      );
      const now = new Date();
      const invoice = await this.invoiceModel.create({
        creatorId: subscription?.creatorId || customerId,
        customerId,
        subscriptionId,
        ownerType: BillingInvoiceOwnerType.PLATFORM_SUBSCRIPTION,
        provider: 'manual',
        status: BillingInvoiceStatus.OPEN,
        invoiceNumber: `INV-${now.getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        total,
        subtotal: total,
        tax: 0,
        currency: createInvoiceDto.lineItems?.[0]?.currency || 'TND',
        invoiceDate: now,
        dueDate: createInvoiceDto.dueDate ? new Date(createInvoiceDto.dueDate) : undefined,
        lineItems: createInvoiceDto.lineItems,
        metadata: { description: createInvoiceDto.description },
      });

      return this.toInvoiceDto(invoice);
    } catch (error) {
      this.logger.error('Failed to create invoice:', error.message);
      throw error;
    }
  }

  // ============ USAGE TRACKING ============

  async recordUsage(
    creatorId: string | Types.ObjectId,
    recordUsageDto: RecordUsageDto
  ): Promise<{ message: string }> {
    try {
      const subscription = await this.subModel.findOne({ 
        creatorId: new Types.ObjectId(creatorId as any) 
      });

      if (!subscription) {
        throw new NotFoundException('No active subscription found');
      }

      // Record the usage event
      const usageEvent: UsageTrackingDto = {
        metricType: recordUsageDto.metricType,
        value: recordUsageDto.value,
        customerId: creatorId.toString(),
        subscriptionId: subscription._id.toString(),
        resourceId: recordUsageDto.resourceId,
        timestamp: new Date().toISOString()
      };

      await this.usageEventModel.create({
        creatorId: new Types.ObjectId(creatorId as any),
        subscriptionId: subscription._id,
        metricType: recordUsageDto.metricType,
        value: recordUsageDto.value,
        resourceId: recordUsageDto.resourceId,
        timestamp: new Date(usageEvent.timestamp),
        metadata: recordUsageDto.metadata || {},
      });

      // Check if usage exceeds plan limits
      await this.checkUsageLimits(subscription, recordUsageDto.metricType as UsageMetricType, recordUsageDto.value);

      return { message: 'Usage recorded successfully' };
    } catch (error) {
      this.logger.error(`Failed to record usage for creator ${creatorId}:`, error.message);
      throw error;
    }
  }

  async getUsageSummary(
    creatorId: string | Types.ObjectId,
    startDate?: Date,
    endDate?: Date
  ): Promise<UsageSummaryDto> {
    try {
      const subscription = await this.subModel.findOne({ 
        creatorId: new Types.ObjectId(creatorId as any) 
      });

      if (!subscription) {
        throw new NotFoundException('No subscription found');
      }

      const periodStart = startDate || subscription.currentPeriodStart;
      const periodEnd = endDate || subscription.currentPeriodEnd;

      const creatorObjectId = new Types.ObjectId(creatorId as any);
      const [communities, publishedCourses, storage, staffAdminCount, explicitUsage, emailUsage, whatsappUsage] = await Promise.all([
        this.communityModel.find({ createur: creatorObjectId }).select('_id members membersCount admins createdAt').lean().exec(),
        this.courseModel.countDocuments({ creatorId: creatorObjectId, isPublished: true }),
        this.storageUsageModel.findOne({ userId: creatorObjectId }).lean().exec(),
        this.countActiveStaffAdminsForCreator(creatorObjectId),
        this.aggregateExplicitUsage(creatorObjectId, periodStart, periodEnd),
        this.aggregateEmailUsage(creatorObjectId, periodStart, periodEnd),
        this.aggregateWhatsappUsage(creatorObjectId, periodStart, periodEnd),
      ]);

      const communitiesCreated = communities.filter((community: any) => {
        const createdAt = community.createdAt ? new Date(community.createdAt) : null;
        return createdAt && createdAt >= periodStart && createdAt <= periodEnd;
      }).length;
      const membersAdded = communities.reduce((sum: number, community: any) => {
        const membersCount = Number(community.membersCount ?? community.members?.length ?? 0);
        return sum + (Number.isFinite(membersCount) ? membersCount : 0);
      }, 0);
      const adminsFromCommunityArrays = communities.reduce((sum: number, community: any) => {
        const adminsCount = Number(community.admins?.length || 0);
        return sum + (Number.isFinite(adminsCount) ? adminsCount : 0);
      }, 0);
      const storageUsedGB = Number(storage?.usedBytes || 0) / (1024 * 1024 * 1024);
      const apiRequests = Number(explicitUsage[UsageMetricType.API_REQUESTS] || 0);
      const automationsTriggered = Number(explicitUsage[UsageMetricType.AUTOMATION_TRIGGERED] || 0);
      const emailsSent = emailUsage + Number(explicitUsage[UsageMetricType.EMAIL_SENT] || 0);
      const whatsappSent = whatsappUsage + Number((explicitUsage as any).whatsapp_sent || 0);

      const usageSummary: UsageSummaryDto = {
        customerId: creatorId.toString(),
        subscriptionId: subscription._id.toString(),
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        communitiesCreated,
        membersAdded,
        coursesActivated: publishedCourses,
        storageUsedGB: Math.round(storageUsedGB * 100) / 100,
        adminsAdded: Math.max(adminsFromCommunityArrays, staffAdminCount),
        apiRequests,
        emailsSent,
        automationsTriggered,
        whatsappMessagesSent: whatsappSent,
        planLimits: {
          communitiesMax: subscription.communitiesMax,
          membersMax: subscription.membersMax,
          coursesActivationMax: subscription.coursesActivationMax,
          storageGB: subscription.storageGB,
          adminsMax: subscription.adminsMax,
          emailCampaignRecipientsPerMonth: subscription.emailCampaignRecipientsPerMonth,
          whatsappMessagesPerMonth: subscription.whatsappMessagesPerMonth,
          analyticsLookbackDays: subscription.analyticsLookbackDays,
          sessionBookingsPerMonth: subscription.sessionBookingsPerMonth,
        },
        usagePercentages: {
          communities: this.percent(communities.length, subscription.communitiesMax),
          members: this.percent(membersAdded, subscription.membersMax),
          courses: this.percent(publishedCourses, subscription.coursesActivationMax),
          storage: this.percent(storageUsedGB, subscription.storageGB),
          admins: this.percent(Math.max(adminsFromCommunityArrays, staffAdminCount), subscription.adminsMax)
        }
      };

      return usageSummary;
    } catch (error) {
      this.logger.error(`Failed to get usage summary for creator ${creatorId}:`, error.message);
      throw error;
    }
  }

  // ============ ADD-ONS ============

  getAvailableAddons() {
    return Object.values(this.addonCatalog).map((addon) => ({
      ...addon,
      currency: 'TND',
      billingInterval: BillingInterval.MONTH,
    }));
  }

  async getMyAddons(creatorId: string | Types.ObjectId) {
    return this.addonModel
      .find({
        creatorId: this.normalizeObjectId(creatorId),
        status: SubscriptionAddonStatus.ACTIVE,
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async purchaseAddon(
    creatorId: string | Types.ObjectId,
    type: SubscriptionAddonType,
    quantity = 1,
    billingInterval: BillingInterval | 'month' | 'year' = BillingInterval.MONTH,
  ) {
    const catalogItem = this.addonCatalog[type];
    if (!catalogItem) {
      throw new BadRequestException('Unsupported add-on type');
    }

    const normalizedQuantity = Math.min(100, Math.max(1, Number(quantity) || 1));
    const creatorObjectId = this.normalizeObjectId(creatorId);
    const subscription = await this.subModel.findOne({
      creatorId: creatorObjectId,
      status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING, SubscriptionStatus.PAST_DUE] },
    });
    if (!subscription) {
      throw new BadRequestException('Active creator subscription required before adding add-ons');
    }

    const interval = this.normalizeBillingInterval(billingInterval);
    const addon = await this.addonModel.create({
      creatorId: creatorObjectId,
      subscriptionId: subscription._id,
      type,
      label: catalogItem.label,
      quantity: normalizedQuantity,
      unitAmount: catalogItem.unitAmount,
      currency: 'TND',
      billingInterval: interval,
      status: SubscriptionAddonStatus.ACTIVE,
      storageGBDelta: catalogItem.storageGBDelta * normalizedQuantity,
      adminsDelta: catalogItem.adminsDelta * normalizedQuantity,
    });

    await this.recalculateAddonLimits(subscription._id);
    return addon;
  }

  async cancelAddon(creatorId: string | Types.ObjectId, addonId: string) {
    const addon = await this.addonModel.findOne({
      _id: this.normalizeObjectId(addonId),
      creatorId: this.normalizeObjectId(creatorId),
      status: SubscriptionAddonStatus.ACTIVE,
    });
    if (!addon) {
      throw new NotFoundException('Active add-on not found');
    }

    addon.status = SubscriptionAddonStatus.CANCELED;
    addon.canceledAt = new Date();
    await addon.save();
    await this.recalculateAddonLimits(addon.subscriptionId);
    return addon;
  }

  private async recalculateAddonLimits(subscriptionId: Types.ObjectId) {
    const subscription = await this.subModel.findById(subscriptionId);
    if (!subscription) return;
    const plan = await this.planModel.findOne({ tier: subscription.plan, isActive: true }).lean();
    const addons = await this.addonModel.find({
      subscriptionId,
      status: SubscriptionAddonStatus.ACTIVE,
    }).lean();

    const baseStorageGB = Number(plan?.limits?.storageGB ?? subscription.storageGB ?? 0);
    const baseAdminsMax = Number(plan?.limits?.adminsMax ?? subscription.adminsMax ?? 0);
    const extraStorageGB = addons.reduce((sum, addon: any) => sum + Number(addon.storageGBDelta || 0), 0);
    const extraAdmins = addons.reduce((sum, addon: any) => sum + Number(addon.adminsDelta || 0), 0);
    const extraAmount = addons.reduce(
      (sum, addon: any) => sum + Number(addon.unitAmount || 0) * Number(addon.quantity || 1),
      0,
    );

    subscription.storageGB = baseStorageGB + extraStorageGB;
    subscription.adminsMax = baseAdminsMax + extraAdmins;
    const baseAmount = plan ? this.getPlanAmount(plan as any, subscription.billingInterval) : Number(subscription.amount || 0);
    subscription.amount = baseAmount + extraAmount;
    await subscription.save();
  }

  // ============ COMMUNITY MEMBER SUBSCRIPTIONS ============

  async recordCommunityMemberSubscriptionFromOrder(
    order: any,
    options: {
      provider?: string;
      providerCustomerId?: string;
      providerSubscriptionId?: string;
      providerCheckoutSessionId?: string;
      currentPeriodStart?: Date;
      currentPeriodEnd?: Date;
      status?: CommunityMemberSubscriptionStatus;
      cancelAtPeriodEnd?: boolean;
    } = {},
    session: any = null,
  ) {
    const communityId = order.communityId || order.contentId;
    if (!communityId || !Types.ObjectId.isValid(String(communityId))) {
      return null;
    }

    const metadata = order.metadata || {};
    const isRecurring = metadata.isRecurring === true || ['monthly', 'yearly'].includes(String(metadata.priceType || '').toLowerCase());
    if (!isRecurring) {
      return null;
    }

    const interval = this.normalizeBillingInterval(metadata.billingInterval || metadata.recurringInterval);
    const fallback = this.periodForInterval(interval);
    const payload = {
      communityId: new Types.ObjectId(String(communityId)),
      creatorId: order.creatorId,
      subscriberId: order.buyerId,
      sourceOrderId: order._id,
      status: options.status || CommunityMemberSubscriptionStatus.ACTIVE,
      billingInterval: interval,
      amount: Number(metadata.amount || order.amountDT || 0),
      currency: metadata.currency || 'TND',
      provider: options.provider || metadata.provider || order.paymentMethod || 'manual',
      providerCustomerId: options.providerCustomerId,
      providerSubscriptionId: options.providerSubscriptionId || metadata.providerSubscriptionId,
      providerCheckoutSessionId: options.providerCheckoutSessionId || metadata.providerCheckoutSessionId || order.paymentId,
      currentPeriodStart: options.currentPeriodStart || fallback.currentPeriodStart,
      currentPeriodEnd: options.currentPeriodEnd || fallback.currentPeriodEnd,
      nextBillingAt: options.currentPeriodEnd || fallback.currentPeriodEnd,
      cancelAtPeriodEnd: options.cancelAtPeriodEnd ?? false,
      metadata: {
        priceType: metadata.priceType,
        source: 'community_checkout',
      },
    };

    const memberSubscription = await this.memberSubscriptionModel.findOneAndUpdate(
      {
        communityId: payload.communityId,
        subscriberId: payload.subscriberId,
        status: { $ne: CommunityMemberSubscriptionStatus.CANCELED },
      },
      { $set: payload },
      { upsert: true, new: true, session, setDefaultsOnInsert: true },
    );

    await this.recordInvoiceForOrder(order, {
      ownerType: BillingInvoiceOwnerType.COMMUNITY_MEMBER_SUBSCRIPTION,
      provider: payload.provider,
      providerSubscriptionId: payload.providerSubscriptionId,
      communityId: payload.communityId,
      status: BillingInvoiceStatus.PAID,
    }, session);

    return memberSubscription;
  }

  async getCreatorMemberSubscriptions(
    creatorId: string | Types.ObjectId,
    query: GetSubscriptionsQueryDto,
  ): Promise<PaginatedResponseDto<any>> {
    const pageNum = Math.max(1, parseInt(String(query.page || '1'), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(query.limit || '20'), 10) || 20));
    const filter: any = { creatorId: this.normalizeObjectId(creatorId) };
    if (query.status) filter.status = query.status;
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
    }

    const [items, total] = await Promise.all([
      this.memberSubscriptionModel
        .find(filter)
        .populate('subscriberId', 'name email username')
        .populate('communityId', 'name slug')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean()
        .exec(),
      this.memberSubscriptionModel.countDocuments(filter),
    ]);

    return new PaginatedResponseDto(items.map((item: any) => ({
      id: String(item._id),
      creatorId: String(item.creatorId),
      subscriberId: item.subscriberId?._id?.toString?.() || String(item.subscriberId || ''),
      subscriberEmail: item.subscriberId?.email,
      subscriberName: item.subscriberId?.username || item.subscriberId?.name,
      community: item.communityId ? {
        id: item.communityId._id?.toString?.() || String(item.communityId),
        name: item.communityId.name,
        slug: item.communityId.slug,
      } : null,
      plan: 'community_member',
      planTier: 'community_member',
      status: item.status,
      billingInterval: item.billingInterval,
      amount: item.amount,
      currency: item.currency,
      provider: item.provider,
      providerSubscriptionId: item.providerSubscriptionId,
      providerCheckoutSessionId: item.providerCheckoutSessionId,
      currentPeriodStart: item.currentPeriodStart,
      currentPeriodEnd: item.currentPeriodEnd,
      nextBillingAt: item.nextBillingAt,
      cancelAtPeriodEnd: item.cancelAtPeriodEnd,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })), total, pageNum, limitNum);
  }

  async reviewManualPlatformSubscriptionOrder(
    orderId: string,
    adminId: string | Types.ObjectId,
    action: 'approve' | 'reject',
  ) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order id');
    }
    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(orderId),
      paymentMethod: 'manual',
      contentType: 'subscription',
      status: 'pending_verification',
    });
    if (!order) {
      throw new NotFoundException('Pending manual platform subscription proof not found');
    }

    if (action === 'reject') {
      order.status = 'cancelled';
      order.metadata = {
        ...(order.metadata || {}),
        reviewedBy: String(adminId),
        reviewedAt: new Date().toISOString(),
        reviewAction: 'reject',
      };
      await order.save();
      return { order, subscription: null };
    }

    const tier = String(order.metadata?.tier || order.contentId || '').toLowerCase() as PlanTier;
    const billingInterval = this.normalizeBillingInterval(order.metadata?.billingInterval);
    const result = await this.upgradePlan(order.buyerId.toString(), tier, null, {
      billingInterval,
      provider: 'manual',
      providerCheckoutSessionId: order._id.toString(),
      status: SubscriptionStatus.ACTIVE,
      amount: Number(order.metadata?.amount || order.amountDT || 0),
      currency: order.metadata?.currency || 'TND',
      hasPaymentMethod: true,
    });

    order.status = 'paid';
    order.metadata = {
      ...(order.metadata || {}),
      reviewedBy: String(adminId),
      reviewedAt: new Date().toISOString(),
      reviewAction: 'approve',
      fulfillmentStatus: 'completed',
      fulfillmentUpdatedAt: new Date().toISOString(),
    };
    await order.save();
    await this.recordInvoiceForOrder(order, {
      provider: 'manual',
      subscriptionId: (result.subscription as any)?._id,
      status: BillingInvoiceStatus.PAID,
    });

    return { order, subscription: result.subscription };
  }

  private async checkUsageLimits(
    subscription: SubscriptionDocument,
    metricType: UsageMetricType,
    newUsage: number
  ): Promise<void> {
    // This would check current usage + new usage against limits
    // For now, just log warnings when approaching limits
    
    const warningThreshold = 0.8; // 80%
    
    switch (metricType) {
      case UsageMetricType.COMMUNITIES_CREATED:
        if (newUsage >= subscription.communitiesMax * warningThreshold) {
          this.logger.warn(`Community usage approaching limit for subscription ${subscription._id}`);
        }
        break;
      case UsageMetricType.MEMBERS_ADDED:
        if (newUsage >= subscription.membersMax * warningThreshold) {
          this.logger.warn(`Member usage approaching limit for subscription ${subscription._id}`);
        }
        break;
      case UsageMetricType.STORAGE_USED:
        if (newUsage >= subscription.storageGB * warningThreshold) {
          this.logger.warn(`Storage usage approaching limit for subscription ${subscription._id}`);
        }
        break;
      default:
        break;
    }
  }

  private async aggregateExplicitUsage(creatorId: Types.ObjectId, start: Date, end: Date): Promise<Record<string, number>> {
    const rows = await this.usageEventModel.aggregate([
      {
        $match: {
          creatorId,
          timestamp: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$metricType',
          total: { $sum: '$value' },
        },
      },
    ]);

    return rows.reduce((acc: Record<string, number>, row: any) => {
      acc[String(row._id)] = Number(row.total || 0);
      return acc;
    }, {});
  }

  private async aggregateEmailUsage(creatorId: Types.ObjectId, start: Date, end: Date): Promise<number> {
    const rows = await this.emailCampaignModel.aggregate([
      {
        $match: {
          creatorId,
          sentAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          sent: { $sum: '$sentCount' },
        },
      },
    ]);

    return Number(rows?.[0]?.sent || 0);
  }

  private async aggregateWhatsappUsage(creatorId: Types.ObjectId, start: Date, end: Date): Promise<number> {
    const rows = await this.whatsappCampaignModel.aggregate([
      {
        $match: {
          creatorId,
          sentAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          sent: { $sum: '$sentCount' },
        },
      },
    ]);

    return Number(rows?.[0]?.sent || 0);
  }

  private async countActiveStaffAdminsForCreator(creatorId: Types.ObjectId): Promise<number> {
    const communities = await this.communityModel.find({ createur: creatorId }).select('_id').lean().exec();
    const communityIds = communities.map((community: any) => community._id);
    if (communityIds.length === 0) return 0;
    return this.communityStaffModel.countDocuments({
      communityId: { $in: communityIds },
      role: 'admin',
      status: 'active',
    });
  }
}
