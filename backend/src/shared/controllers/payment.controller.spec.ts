import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PaymentController } from '@/shared/controllers/payment.controller';

describe('PaymentController webhook hardening', () => {
  const buildController = (overrides: {
    countDocuments?: jest.Mock;
    updateOne?: jest.Mock;
    createWebhookEvent?: jest.Mock;
    getSubscriptionDetails?: jest.Mock;
    orderFindOne?: jest.Mock;
    orderCreate?: jest.Mock;
    auditLog?: jest.Mock;
    orderFindById?: jest.Mock;
    userFindById?: jest.Mock;
    feeService?: Record<string, any>;
    subscriptionService?: Record<string, any>;
    sessionService?: Record<string, any>;
    paymentFulfillmentService?: Record<string, any>;
    webhookRetryService?: Record<string, any>;
    processedFindOne?: jest.Mock;
  } = {}) => {
    const stripe = {
      createWebhookEvent: overrides.createWebhookEvent || jest.fn(),
      getSubscriptionDetails: overrides.getSubscriptionDetails || jest.fn(),
      verifyLinkPayment: jest.fn(),
      refundPayment: jest.fn(),
      getPriceDetails: jest.fn().mockResolvedValue({
        success: true,
        priceId: 'price_stable',
        providerAmount: 50.88,
        providerCurrency: 'USD',
        providerExchangeRate: 0.32,
      }),
    };
    const orderModel = {
      findOne: overrides.orderFindOne || jest.fn(),
      create: overrides.orderCreate || jest.fn(),
      findById: overrides.orderFindById || jest.fn(),
    };
    const userModel = {
      findById: overrides.userFindById || jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(null) }),
    };
    const processedWebhookEventModel = {
      countDocuments: overrides.countDocuments || jest.fn().mockResolvedValue(0),
      updateOne: overrides.updateOne || jest.fn().mockResolvedValue({}),
      findOne: overrides.processedFindOne || jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    };
    const paymentAuditService = {
      log: overrides.auditLog || jest.fn().mockResolvedValue(undefined),
    };

    const controller = new PaymentController(
      stripe as any,
       {} as any,
      (overrides.feeService || {}) as any,
      (overrides.paymentFulfillmentService || {}) as any,
      paymentAuditService as any,
      { fromPayload: jest.fn((_provider: string, payload: any) => payload) } as any,
       {} as any,
      {} as any,
      {} as any,
      userModel as any,
      orderModel as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      processedWebhookEventModel as any,
      {} as any,
      {} as any,
      {} as any,
       (overrides.sessionService || {}) as any,
       (overrides.subscriptionService || { handleWebhook: jest.fn().mockResolvedValue(undefined) }) as any,
       {} as any,
       { resolveAttributionFromRequest: jest.fn().mockReturnValue({}) } as any,
       { onOrderPaid: jest.fn().mockResolvedValue(null) } as any,
       { revokeForOrder: jest.fn().mockResolvedValue(undefined) } as any,
       { emit: jest.fn().mockResolvedValue(undefined) } as any,
       { revokeForOrder: jest.fn().mockResolvedValue(undefined) } as any,
       overrides.webhookRetryService as any,
    );
    (controller as any).processedWebhookEventModel = processedWebhookEventModel;

    return { controller, stripe, orderModel, processedWebhookEventModel, paymentAuditService };
  };

  it('rejects a missing stripe signature', async () => {
    const { controller, paymentAuditService } = buildController();

    await expect(controller.stripeLinkWebhook({ headers: {}, body: Buffer.from('') })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(paymentAuditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'webhook_rejected',
        provider: 'stripe',
        reason: 'missing_signature',
      }),
      null,
    );
  });

  it('ignores duplicate stripe events after they were claimed or processed', async () => {
    const createWebhookEvent = jest.fn().mockResolvedValue({
      success: true,
      event: {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_test', payment_status: 'paid', metadata: {} } },
      },
    });
    const updateOne = jest.fn().mockResolvedValue({ matchedCount: 0, modifiedCount: 0, upsertedCount: 0 });

    const { controller, orderModel, processedWebhookEventModel, paymentAuditService } = buildController({
      createWebhookEvent,
      updateOne,
      processedFindOne: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ eventId: 'evt_123', status: 'processing' }) }),
    });

    await expect(
      controller.stripeLinkWebhook({
        headers: { 'stripe-signature': 'sig_test' },
        body: Buffer.from('{}'),
      }),
    ).resolves.toEqual({ received: true, duplicate: true });

    expect(orderModel.findOne).not.toHaveBeenCalled();
    expect(processedWebhookEventModel.updateOne).toHaveBeenCalledTimes(1);
    expect(paymentAuditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'duplicate_event_ignored',
        provider: 'stripe',
        eventId: 'evt_123',
      }),
      null,
    );
  });

  it('atomically claims new verified stripe events before side effects then marks processed', async () => {
    const createWebhookEvent = jest.fn().mockResolvedValue({
      success: true,
      event: {
        id: 'evt_new',
        type: 'customer.subscription.updated',
        data: { object: {} },
      },
    });
    const updateOne = jest.fn()
      .mockResolvedValueOnce({ upsertedCount: 1, modifiedCount: 0 })
      .mockResolvedValueOnce({ modifiedCount: 1 });

    const { controller, processedWebhookEventModel } = buildController({
      createWebhookEvent,
      countDocuments: jest.fn().mockResolvedValue(0),
      updateOne,
    });

    await expect(
      controller.stripeLinkWebhook({
        headers: { 'stripe-signature': 'sig_test' },
        body: Buffer.from('{}'),
      }),
    ).resolves.toEqual({ received: true });

    expect(updateOne).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ provider: 'stripe', eventId: 'evt_new' }),
      expect.objectContaining({
        $set: expect.objectContaining({
          eventType: 'customer.subscription.updated',
          status: 'processing',
        }),
        $setOnInsert: expect.objectContaining({ provider: 'stripe', eventId: 'evt_new' }),
      }),
      { upsert: true },
    );
    expect(updateOne).toHaveBeenNthCalledWith(
      2,
      { provider: 'stripe', eventId: 'evt_new' },
      expect.objectContaining({
        $set: expect.objectContaining({
          status: 'processed',
          eventType: 'customer.subscription.updated',
        }),
      }),
      { upsert: true },
    );
  });

  it('marks claimed webhook failed and rethrows when subscription handler fails', async () => {
    const createWebhookEvent = jest.fn().mockResolvedValue({
      success: true,
      event: {
        id: 'evt_fail',
        type: 'customer.subscription.updated',
        data: { object: { id: 'sub_123' } },
      },
    });
    const handlerError = new Error('handler failed');
    const updateOne = jest.fn()
      .mockResolvedValueOnce({ upsertedCount: 1, modifiedCount: 0 })
      .mockResolvedValueOnce({ modifiedCount: 1 });
    const enqueue = jest.fn();

    const { controller } = buildController({
      createWebhookEvent,
      updateOne,
      subscriptionService: { handleWebhook: jest.fn().mockRejectedValue(handlerError) },
      webhookRetryService: { enqueue },
    });

    await expect(
      controller.stripeLinkWebhook({
        headers: { 'stripe-signature': 'sig_test' },
        body: Buffer.from('{}'),
      }),
    ).rejects.toThrow('handler failed');

    expect(updateOne).toHaveBeenNthCalledWith(
      2,
      { provider: 'stripe', eventId: 'evt_fail' },
      expect.objectContaining({
        $set: expect.objectContaining({
          status: 'failed',
          error: 'handler failed',
        }),
      }),
      { upsert: true },
    );
    expect(enqueue).toHaveBeenCalledWith(
      'stripe',
      { eventId: 'evt_fail', eventType: 'customer.subscription.updated' },
      handlerError,
    );
  });

  it('retrieves Stripe subscription details before subscription checkout fulfillment', async () => {
    const order = {
      _id: { toString: () => 'order_sub' },
      contentType: 'subscription',
      contentId: 'pro',
      buyerId: { toString: () => '64a1b2c3d4e5f6789abcdef0' },
      metadata: { tier: 'pro', provider: 'stripe', amount: 159 },
      amountDT: 159,
    };
    const createWebhookEvent = jest.fn().mockResolvedValue({
      success: true,
      event: {
        id: 'evt_sub',
        type: 'checkout.session.completed',
        object: 'event',
        data: {
          object: {
            id: 'cs_sub',
            mode: 'subscription',
            status: 'complete',
            payment_status: 'paid',
            customer: 'cus_123',
            subscription: 'sub_123',
            metadata: { tier: 'pro', provider: 'stripe' },
          },
        },
      },
    });
    const getSubscriptionDetails = jest.fn().mockResolvedValue({
      success: true,
      subscriptionId: 'sub_123',
      customerId: 'cus_real',
      status: 'active',
      currentPeriodStart: new Date('2026-01-01T00:00:00Z'),
      currentPeriodEnd: new Date('2026-02-01T00:00:00Z'),
      providerPriceId: 'price_real',
      paymentMethod: { card: { brand: 'visa', last4: '4242' } },
    });
    const upgradePlan = jest.fn().mockResolvedValue({ message: 'ok' });
    const { controller, processedWebhookEventModel } = buildController({
      createWebhookEvent,
      getSubscriptionDetails,
      orderFindOne: jest.fn().mockResolvedValue(order),
      paymentFulfillmentService: {
        claimForProcessing: jest.fn().mockResolvedValue({ order, state: 'claimed' }),
        markCompleted: jest.fn().mockResolvedValue(order),
        markFailed: jest.fn(),
      },
      subscriptionService: {
        upgradePlan,
        recordInvoiceForOrder: jest.fn().mockResolvedValue(undefined),
      },
    });

    await expect(
      controller.stripeLinkWebhook({
        headers: { 'stripe-signature': 'sig_test' },
        body: Buffer.from('{}'),
      }),
    ).resolves.toEqual({ received: true });

    expect(getSubscriptionDetails).toHaveBeenCalledWith('sub_123');
    expect(upgradePlan).toHaveBeenCalledTimes(1);
    const upgradeArgs = upgradePlan.mock.calls[0];
    expect(upgradeArgs[0]).toBe('64a1b2c3d4e5f6789abcdef0');
    expect(upgradeArgs[1]).toBe('pro');
    expect(upgradeArgs[3]).toEqual(
      expect.objectContaining({
        providerCustomerId: 'cus_real',
        providerSubscriptionId: 'sub_123',
        providerPriceId: 'price_real',
        currentPeriodStart: new Date('2026-01-01T00:00:00Z'),
        paymentBrand: 'visa',
        paymentLast4: '4242',
      }),
    );
    expect(processedWebhookEventModel.updateOne).toHaveBeenCalled();
  });

  it('blocks order-state BOLA access for non-buyer and non-creator users', async () => {
    const orderId = '64a1b2c3d4e5f6789abcdef0';
    const attackerId = '64a1b2c3d4e5f6789abcdef1';
    const { controller } = buildController({
      orderFindById: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: orderId,
          buyerId: '64a1b2c3d4e5f6789abcdef2',
          creatorId: '64a1b2c3d4e5f6789abcdef3',
          status: 'paid',
        }),
      }),
    });

    await expect(
      controller.getOrderState(orderId, { user: { _id: attackerId } }),
    ).rejects.toThrow('You are not allowed to view this order');
  });

  it('uses exact origins for checkout redirect allowlisting', () => {
    const { controller } = buildController();
    const previous = process.env.PAYMENTS_REDIRECT_ALLOWLIST;
    process.env.PAYMENTS_REDIRECT_ALLOWLIST = 'https://app.example.com';
    expect((controller as any).resolveCheckoutRedirectUrl('', 'https://app.example.com/paid')).toBe('https://app.example.com/paid');
    expect(() => (controller as any).resolveCheckoutRedirectUrl('', 'https://app.example.com.evil.test/paid'))
      .toThrow(BadRequestException);
    if (previous === undefined) delete process.env.PAYMENTS_REDIRECT_ALLOWLIST;
    else process.env.PAYMENTS_REDIRECT_ALLOWLIST = previous;
  });

  it('binds Stripe verification to the authenticated order buyer', async () => {
    const order = { buyerId: '64a1b2c3d4e5f6789abcdef0' };
    const { controller, stripe } = buildController({
      orderFindOne: jest.fn().mockResolvedValue(order),
    });
    (stripe as any).verifyLinkPayment.mockResolvedValue({ success: true, status: 'pending' });
    await expect(controller.verifyStripeLink('cs_test', {
      user: { _id: '64a1b2c3d4e5f6789abcdef1' },
    })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('confirms the order-linked booking instead of creating a generic session booking', async () => {
    const confirmPaidBookingForOrder = jest.fn().mockResolvedValue({ bookingId: 'booking_1', sessionId: 'session_1' });
    const { controller } = buildController({ sessionService: { confirmPaidBookingForOrder } });
    const order = {
      _id: { toString: () => '64a1b2c3d4e5f6789abcdef0' },
      contentType: 'session',
      buyerId: { toString: () => 'buyer_1' },
      creatorId: { toString: () => 'creator_1' },
    };

    await (controller as any).grantAccess(order, null, {});

    expect(confirmPaidBookingForOrder).toHaveBeenCalledWith(order, null);
  });

  it('refunds the Stripe payment intent rather than checkout session id', async () => {
    const order = {
      buyerId: 'buyer', creatorId: 'creator', status: 'paid', paymentMethod: 'stripe',
      paymentId: 'cs_test', paymentIntentId: 'pi_test', metadata: {},
      save: jest.fn().mockResolvedValue(undefined),
    };
    const { controller, stripe } = buildController({
      orderFindById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(order) }),
    });
    (stripe as any).refundPayment.mockResolvedValue({ success: true });
    (controller as any).affiliateCommissionService = { onOrderRefunded: jest.fn().mockResolvedValue(undefined) };
    await controller.refundOrder('64a1b2c3d4e5f6789abcdef0', {}, { user: { _id: 'admin' } });
    expect((stripe as any).refundPayment).toHaveBeenCalledWith('pi_test');
  });




  it('reuses an idempotent pending Stripe subscription checkout', async () => {
    const existingOrder = {
      _id: { toString: () => 'order_1' },
      paymentId: 'cs_existing',
      metadata: { checkoutUrl: 'https://checkout.stripe.test/existing' },
    };
    const orderFindOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue(existingOrder),
    });
    const createPrice = jest.fn();
    const { controller, orderModel, stripe } = buildController({
      orderFindOne,
      subscriptionService: {
        getActivePlanOrBootstrap: jest.fn().mockResolvedValue({ name: 'Pro', trialDays: 0 }),
        getPlanAmount: jest.fn().mockReturnValue(159),
      },
      feeService: { calculateForAmount: jest.fn() },
    });
    (stripe as any).createPrice = createPrice;

    await expect(
      controller.initStripeLinkSubscription(
        { user: { _id: '64a1b2c3d4e5f6789abcdef0' }, headers: {} },
        'pro',
        'month',
        undefined,
        undefined,
        undefined,
        undefined,
        'idem-1',
      ),
    ).resolves.toEqual(expect.objectContaining({
      checkoutUrl: 'https://checkout.stripe.test/existing',
      sessionId: 'cs_existing',
      idempotent: true,
    }));

    expect(orderModel.create).not.toHaveBeenCalled();
    expect(createPrice).not.toHaveBeenCalled();
  });

  it('uses stable configured Stripe price IDs for subscription checkout', async () => {
    const createdOrder = {
      _id: { toString: () => 'order_new' },
      metadata: {},
      save: jest.fn().mockResolvedValue(undefined),
    };
    const orderFindOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue(null),
    });
    const createPrice = jest.fn();
    const createLinkSubscriptionSession = jest.fn().mockResolvedValue({
      success: true,
      sessionId: 'cs_stable',
      url: 'https://checkout.stripe.test/stable',
      providerAmount: 50.88,
      providerCurrency: 'USD',
      providerExchangeRate: 0.32,
    });
    const { controller, orderModel, stripe } = buildController({
      orderFindOne,
      orderCreate: jest.fn().mockResolvedValue(createdOrder),
      subscriptionService: {
        getActivePlanOrBootstrap: jest.fn().mockResolvedValue({
          tier: 'pro',
          name: 'Pro',
          trialDays: 0,
          stripePriceIds: { month: 'price_stable_month' },
        }),
        getPlanAmount: jest.fn().mockReturnValue(159),
      },
      feeService: {
        calculateForAmount: jest.fn().mockResolvedValue({
          amountDT: 159,
          platformPercent: 0,
          platformFixedDT: 0,
          platformFeeDT: 0,
          creatorNetDT: 159,
        }),
      },
    });
    (stripe as any).createPrice = createPrice;
    (stripe as any).createLinkSubscriptionSession = createLinkSubscriptionSession;

    await expect(
      controller.initStripeLinkSubscription(
        { user: { _id: '64a1b2c3d4e5f6789abcdef0' }, headers: {} },
        'pro',
        'month',
      ),
    ).resolves.toEqual(expect.objectContaining({ sessionId: 'cs_stable' }));

    expect(createPrice).not.toHaveBeenCalled();
    expect(createLinkSubscriptionSession).toHaveBeenCalledWith(
      expect.objectContaining({ priceId: 'price_stable_month' }),
    );
    expect(orderModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        providerAmount: 50.88,
        providerCurrency: 'USD',
        providerExchangeRate: 0.32,
      }),
    );
    expect(createdOrder.metadata).toEqual(expect.objectContaining({
      providerPriceId: 'price_stable_month',
      providerPriceSource: 'stable',
      providerAmount: 50.88,
      providerCurrency: 'USD',
      providerExchangeRate: 0.32,
    }));
  });



});
