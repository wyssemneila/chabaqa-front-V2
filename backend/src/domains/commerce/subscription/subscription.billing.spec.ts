import { Types } from 'mongoose';
import { SubscriptionService } from '@/domains/commerce/subscription/subscription.service';
import { BillingInvoiceOwnerType } from '@/infrastructure/database/schemas/commerce/billing-invoice.schema';
import { BillingInterval, SubscriptionStatus } from '@/infrastructure/database/schemas/commerce/subscription.schema';
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

  it('admin approval activates manual platform subscription proofs', async () => {
    const buyerId = objectId();
    const order = {
      _id: objectId(),
      buyerId,
      creatorId: buyerId,
      contentType: 'subscription',
      contentId: 'pro',
      amountDT: 159,
      paymentMethod: 'manual',
      status: 'pending_verification',
      metadata: { tier: 'pro', billingInterval: 'month', amount: 159, currency: 'TND' },
      save: jest.fn().mockResolvedValue(undefined),
    };
    const { service, models } = buildService({
      orderModel: { findOne: jest.fn().mockResolvedValue(order) },
    });
    jest.spyOn(service, 'upgradePlan').mockResolvedValue({ subscription: { _id: objectId() } } as any);
    jest.spyOn(service, 'recordInvoiceForOrder').mockResolvedValue(undefined);

    await service.reviewManualPlatformSubscriptionOrder(order._id.toString(), objectId(), 'approve');

    expect(service.upgradePlan).toHaveBeenCalledWith(
      buyerId.toString(),
      'pro',
      null,
      expect.objectContaining({
        provider: 'manual',
        status: SubscriptionStatus.ACTIVE,
        amount: 159,
      }),
    );
    expect(order.status).toBe('paid');
    expect(order.save).toHaveBeenCalled();
    expect(models.orderModel.findOne).toHaveBeenCalled();
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
