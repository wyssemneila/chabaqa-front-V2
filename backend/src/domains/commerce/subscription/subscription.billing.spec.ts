import { Types } from 'mongoose';
import { SubscriptionService } from '@/domains/commerce/subscription/subscription.service';
import { BillingInvoiceOwnerType } from '@/infrastructure/database/schemas/commerce/billing-invoice.schema';
import { BillingInterval, SubscriptionStatus } from '@/infrastructure/database/schemas/commerce/subscription.schema';
import { PlanTier } from '@/infrastructure/database/schemas/commerce/plan.schema';
import { SubscriptionAddonType } from '@/infrastructure/database/schemas/commerce/subscription-addon.schema';

const objectId = () => new Types.ObjectId();

const chain = (value: any) => ({
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(value),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  session: jest.fn().mockReturnThis(),
});

describe('SubscriptionService billing records', () => {
  const buildService = (overrides: Record<string, any> = {}) => {
    const models = {
      subModel: {
        findOne: jest.fn(),
        findById: jest.fn(),
      },
      planModel: {
        findOne: jest.fn(),
      },
      orderModel: {
        findOne: jest.fn(),
      },
      invoiceModel: {
        updateOne: jest.fn().mockResolvedValue({}),
        create: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        countDocuments: jest.fn(),
      },
      usageEventModel: {
        create: jest.fn(),
        aggregate: jest.fn().mockResolvedValue([]),
      },
      addonModel: {
        create: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
      },
      memberSubscriptionModel: {
        findOneAndUpdate: jest.fn(),
        find: jest.fn(),
        countDocuments: jest.fn(),
      },
      communityModel: {
        find: jest.fn().mockReturnValue(chain([])),
      },
      courseModel: {
        countDocuments: jest.fn().mockResolvedValue(0),
      },
      communityStaffModel: {
        countDocuments: jest.fn().mockResolvedValue(0),
      },
      storageUsageModel: {
        findOne: jest.fn().mockReturnValue(chain(null)),
      },
      emailCampaignModel: {
        aggregate: jest.fn().mockResolvedValue([]),
      },
      whatsappCampaignModel: {
        aggregate: jest.fn().mockResolvedValue([]),
      },
      creatorIntegrationsService: {
        emit: jest.fn().mockResolvedValue(undefined),
      },
      ...overrides,
    };

    const service = new SubscriptionService(
      models.subModel as any,
      models.planModel as any,
      models.orderModel as any,
      models.invoiceModel as any,
      models.usageEventModel as any,
      models.addonModel as any,
      models.memberSubscriptionModel as any,
      models.communityModel as any,
      models.courseModel as any,
      models.communityStaffModel as any,
      models.storageUsageModel as any,
      models.emailCampaignModel as any,
      models.whatsappCampaignModel as any,
      (overrides.stripePaymentService || { cancelSubscriptionAtPeriodEnd: jest.fn() }) as any,
      models.creatorIntegrationsService as any,
    );

    return { service, models };
  };

  it('normalizes paid provider orders into local billing invoices', async () => {
    const { service, models } = buildService();
    const order = {
      _id: objectId(),
      buyerId: objectId(),
      creatorId: objectId(),
      contentType: 'subscription',
      contentId: 'growth',
      amountDT: 99,
      paymentMethod: 'stripe',
      paymentId: 'cs_test',
      metadata: { tier: 'growth', billingInterval: 'month', currency: 'TND' },
      createdAt: new Date('2026-06-01T00:00:00Z'),
    };

    await service.recordInvoiceForOrder(order, { provider: 'stripe', providerInvoiceId: 'in_123' });

    expect(models.invoiceModel.updateOne).toHaveBeenCalledWith(
      { orderId: order._id },
      expect.objectContaining({
        $set: expect.objectContaining({
          creatorId: order.creatorId,
          customerId: order.buyerId,
          provider: 'stripe',
          providerInvoiceId: 'in_123',
          ownerType: BillingInvoiceOwnerType.PLATFORM_SUBSCRIPTION,
          invoiceNumber: 'in_123',
          total: 99,
        }),
      }),
      { upsert: true, session: null },
    );
  });

  it('uses a stable order-scoped provider invoice id for checkout-only invoices', async () => {
    const { service, models } = buildService();
    const order = {
      _id: objectId(),
      buyerId: objectId(),
      creatorId: objectId(),
      contentType: 'subscription',
      contentId: 'pro',
      amountDT: 159,
      paymentMethod: 'stripe',
      paymentId: 'cs_test_checkout_only',
      metadata: { tier: 'pro', billingInterval: 'month', currency: 'TND' },
      createdAt: new Date('2026-06-01T00:00:00Z'),
    };

    await service.recordInvoiceForOrder(order, { provider: 'stripe' });

    expect(models.invoiceModel.updateOne).toHaveBeenCalledWith(
      { orderId: order._id },
      expect.objectContaining({
        $set: expect.objectContaining({
          providerInvoiceId: `order_${order._id.toString()}`,
          invoiceNumber: `INV-${order._id.toString().slice(-10).toUpperCase()}`,
          metadata: expect.objectContaining({
            generatedProviderInvoiceId: true,
          }),
        }),
      }),
      { upsert: true, session: null },
    );
  });

  it('creates community member subscription records only for recurring community orders', async () => {
    const { service, models } = buildService();
    const order = {
      _id: objectId(),
      buyerId: objectId(),
      creatorId: objectId(),
      communityId: objectId(),
      contentType: 'community',
      contentId: objectId().toString(),
      amountDT: 49,
      paymentMethod: 'stripe',
      paymentId: 'cs_member',
      metadata: {
        isRecurring: true,
        priceType: 'monthly',
        billingInterval: 'month',
        amount: 49,
        currency: 'TND',
      },
    };
    models.memberSubscriptionModel.findOneAndUpdate.mockResolvedValue({ _id: objectId() });

    await service.recordCommunityMemberSubscriptionFromOrder(order, { providerSubscriptionId: 'sub_member' });

    expect(models.memberSubscriptionModel.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        communityId: order.communityId,
        subscriberId: order.buyerId,
      }),
      expect.objectContaining({
        $set: expect.objectContaining({
          amount: 49,
          billingInterval: BillingInterval.MONTH,
          providerSubscriptionId: 'sub_member',
        }),
      }),
      expect.objectContaining({ upsert: true, new: true }),
    );
    expect(models.invoiceModel.updateOne).toHaveBeenCalled();
  });

  it('rejects paid direct plan activation without provider or admin context', async () => {
    const { service, models } = buildService();
    models.planModel.findOne.mockReturnValue(chain({
      tier: PlanTier.PRO,
      priceDTPerMonth: 159,
      limits: {
        communitiesMax: 10,
        membersMax: 1000,
        coursesActivationMax: 20,
        storageGB: 200,
        adminsMax: 5,
        emailCampaignRecipientsPerMonth: 10000,
        whatsappMessagesPerMonth: 1000,
        analyticsLookbackDays: 365,
        sessionBookingsPerMonth: 100,
      },
    }));

    await expect(service.upgradePlan(objectId(), PlanTier.PRO)).rejects.toThrow(
      'Paid plan activation must come from provider checkout or admin-approved billing context',
    );
  });

  it('allows paid activation from provider checkout context', async () => {
    const { service, models } = buildService({
      subModel: {
        findOne: jest.fn(),
        findById: jest.fn(),
        findOneAndUpdate: jest.fn().mockResolvedValue({ _id: objectId(), plan: PlanTier.PRO }),
      },
    });
    models.planModel.findOne.mockReturnValue(chain({
      tier: PlanTier.PRO,
      priceDTPerMonth: 159,
      limits: {
        communitiesMax: 10,
        membersMax: 1000,
        coursesActivationMax: 20,
        storageGB: 200,
        adminsMax: 5,
        emailCampaignRecipientsPerMonth: 10000,
        whatsappMessagesPerMonth: 1000,
        analyticsLookbackDays: 365,
        sessionBookingsPerMonth: 100,
      },
    }));

    await expect(
      service.upgradePlan(objectId(), PlanTier.PRO, null, { provider: 'stripe' }),
    ).resolves.toEqual(expect.objectContaining({ message: 'Plan mis à jour' }));
  });

  it('schedules paid Stripe cancellations at the provider before persisting locally', async () => {
    const periodEnd = new Date('2026-03-01T00:00:00Z');
    const subscription = {
      _id: objectId(),
      creatorId: objectId(),
      provider: 'stripe',
      providerSubscriptionId: 'sub_real',
      status: SubscriptionStatus.ACTIVE,
      amount: 159,
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date('2026-02-01T00:00:00Z'),
      currentPeriodEnd: periodEnd,
      nextBillingAt: periodEnd,
      save: jest.fn().mockResolvedValue(undefined),
    };
    const stripePaymentService = {
      cancelSubscriptionAtPeriodEnd: jest.fn().mockResolvedValue({
        success: true,
        subscriptionId: 'sub_real',
        status: 'active',
        cancelAtPeriodEnd: true,
        currentPeriodEnd: periodEnd,
      }),
    };
    const { service } = buildService({
      subModel: {
        findOne: jest.fn().mockResolvedValue(subscription),
        findById: jest.fn(),
      },
      stripePaymentService,
    });

    await expect(service.cancelAtPeriodEnd(subscription.creatorId)).resolves.toEqual(
      expect.objectContaining({ subscription }),
    );

    expect(stripePaymentService.cancelSubscriptionAtPeriodEnd).toHaveBeenCalledWith('sub_real');
    expect(subscription.cancelAtPeriodEnd).toBe(true);
    expect(subscription.nextBillingAt).toEqual(periodEnd);
    expect(subscription.save).toHaveBeenCalled();
  });

  it('rejects active paid Stripe cancellation when provider subscription id is missing', async () => {
    const subscription = {
      _id: objectId(),
      creatorId: objectId(),
      provider: 'stripe',
      status: SubscriptionStatus.ACTIVE,
      amount: 159,
      cancelAtPeriodEnd: false,
      save: jest.fn(),
    };
    const stripePaymentService = { cancelSubscriptionAtPeriodEnd: jest.fn() };
    const { service } = buildService({
      subModel: {
        findOne: jest.fn().mockResolvedValue(subscription),
        findById: jest.fn(),
      },
      stripePaymentService,
    });

    await expect(service.cancelAtPeriodEnd(subscription.creatorId)).rejects.toThrow(
      'Stripe subscription ID is required',
    );

    expect(stripePaymentService.cancelSubscriptionAtPeriodEnd).not.toHaveBeenCalled();
    expect(subscription.save).not.toHaveBeenCalled();
  });

  it('keeps trial or local cancellations local', async () => {
    const subscription = {
      _id: objectId(),
      creatorId: objectId(),
      provider: undefined,
      status: SubscriptionStatus.TRIALING,
      amount: 0,
      cancelAtPeriodEnd: false,
      save: jest.fn().mockResolvedValue(undefined),
    };
    const stripePaymentService = { cancelSubscriptionAtPeriodEnd: jest.fn() };
    const { service } = buildService({
      subModel: {
        findOne: jest.fn().mockResolvedValue(subscription),
        findById: jest.fn(),
      },
      stripePaymentService,
    });

    await service.cancelAtPeriodEnd(subscription.creatorId);

    expect(stripePaymentService.cancelSubscriptionAtPeriodEnd).not.toHaveBeenCalled();
    expect(subscription.cancelAtPeriodEnd).toBe(true);
    expect(subscription.save).toHaveBeenCalled();
  });

  it('rejects provider-owned fields in generic admin subscription updates', async () => {
    const subscription = {
      _id: objectId(),
      creatorId: objectId(),
      plan: PlanTier.PRO,
      provider: 'stripe',
      providerCustomerId: 'cus_existing',
      providerSubscriptionId: 'sub_existing',
      billingInterval: BillingInterval.MONTH,
      currentPeriodStart: new Date('2026-01-01T00:00:00Z'),
      currentPeriodEnd: new Date('2026-02-01T00:00:00Z'),
      nextBillingAt: new Date('2026-02-01T00:00:00Z'),
      status: SubscriptionStatus.ACTIVE,
      cancelAtPeriodEnd: false,
      amount: 159,
      currency: 'TND',
      communitiesMax: 10,
      membersMax: 1000,
      coursesActivationMax: 20,
      storageGB: 200,
      adminsMax: 5,
      hasPaymentMethod: true,
      save: jest.fn(),
    };
    const { service } = buildService({
      subModel: {
        findOne: jest.fn(),
        findById: jest.fn().mockReturnValue(chain(subscription)),
      },
    });

    await expect(
      service.updateSubscription(subscription._id.toString(), {
        providerSubscriptionId: 'sub_attacker',
        status: SubscriptionStatus.CANCELED,
      } as any, { adminUserId: objectId().toString() }),
    ).rejects.toThrow('Provider-owned subscription fields cannot be changed here');
    expect(subscription.save).not.toHaveBeenCalled();
  });

  it('applies only allowlisted generic admin subscription fields', async () => {
    const subscription = {
      _id: objectId(),
      creatorId: objectId(),
      plan: PlanTier.STARTER,
      billingInterval: BillingInterval.MONTH,
      currentPeriodStart: new Date('2026-01-01T00:00:00Z'),
      currentPeriodEnd: new Date('2026-02-01T00:00:00Z'),
      nextBillingAt: new Date('2026-02-01T00:00:00Z'),
      status: SubscriptionStatus.ACTIVE,
      cancelAtPeriodEnd: false,
      amount: 0,
      currency: 'TND',
      communitiesMax: 1,
      membersMax: 100,
      coursesActivationMax: 3,
      storageGB: 2,
      adminsMax: 0,
      hasPaymentMethod: false,
      save: jest.fn().mockResolvedValue(undefined),
    };
    const { service } = buildService({
      subModel: {
        findOne: jest.fn(),
        findById: jest.fn().mockReturnValue(chain(subscription)),
      },
    });

    await service.updateSubscription(subscription._id.toString(), {
      plan: PlanTier.PRO,
      storageGB: 250,
      notes: 'ignored because not persisted on schema',
    } as any, { adminUserId: objectId().toString() });

    expect(subscription.plan).toBe(PlanTier.PRO);
    expect(subscription.storageGB).toBe(250);
    expect((subscription as any).notes).toBeUndefined();
    expect(subscription.save).toHaveBeenCalled();
  });

  it('exposes supported add-ons with concrete price and capacity deltas', () => {
    const { service } = buildService();

    expect(service.getAvailableAddons()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: SubscriptionAddonType.STORAGE_50GB, unitAmount: 19, storageGBDelta: 50 }),
        expect.objectContaining({ type: SubscriptionAddonType.ADMIN_SEAT, unitAmount: 29, adminsDelta: 1 }),
      ]),
    );
  });
});
