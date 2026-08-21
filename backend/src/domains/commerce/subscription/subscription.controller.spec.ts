import { SubscriptionController } from '@/domains/commerce/subscription/subscription.controller';
import { GoneException, UnauthorizedException } from '@nestjs/common';
import { InternalServiceTokenGuard } from '@/shared/guards/internal-service-token.guard';

describe('SubscriptionController webhook hardening', () => {
  it('rejects the deprecated unsigned webhook endpoint', async () => {
    const controller = new SubscriptionController({} as any);

    await expect(
      controller.handleWebhook({
        id: 'evt_legacy',
        type: 'subscription.created',
        data: { object: {} },
      } as any),
    ).resolves.toEqual({
      message: 'Unsigned webhook payloads are no longer accepted. Use a provider-specific signed webhook endpoint.',
      eventId: 'evt_legacy',
      status: 'skipped',
    });
  });
});

describe('SubscriptionController billing abuse hardening', () => {
  const service = {
    setupBillingMethod: jest.fn(),
    upgradePlan: jest.fn(),
    purchaseAddon: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('rejects direct creator paid upgrades', async () => {
    const controller = new SubscriptionController(service as any);

    await expect(
      controller.upgrade({ user: { _id: 'creator-1' } } as any, 'pro'),
    ).rejects.toBeInstanceOf(GoneException);
    expect(service.upgradePlan).not.toHaveBeenCalled();
  });

  it('rejects direct creator billing setup', async () => {
    const controller = new SubscriptionController(service as any);

    await expect(
      controller.setupBilling({ user: { _id: 'creator-1' } } as any, { providerCustomerId: 'cus_123' }),
    ).rejects.toBeInstanceOf(GoneException);
    expect(service.setupBillingMethod).not.toHaveBeenCalled();
  });

  it('rejects unpaid self-serve add-on activation', async () => {
    const controller = new SubscriptionController(service as any);

    await expect(
      controller.purchaseAddon({ user: { _id: 'creator-1' } } as any, 'storage_50gb' as any, 1, 'month' as any),
    ).rejects.toBeInstanceOf(GoneException);
    expect(service.purchaseAddon).not.toHaveBeenCalled();
  });
});

describe('InternalServiceTokenGuard', () => {
  const originalToken = process.env.INTERNAL_SERVICE_TOKEN;

  afterEach(() => {
    if (originalToken === undefined) {
      delete process.env.INTERNAL_SERVICE_TOKEN;
    } else {
      process.env.INTERNAL_SERVICE_TOKEN = originalToken;
    }
  });

  it('rejects ordinary requests without the internal service token', () => {
    process.env.INTERNAL_SERVICE_TOKEN = 'secret-token';
    const guard = new InternalServiceTokenGuard();

    expect(() =>
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({ headers: { authorization: 'Bearer user-jwt' } }),
        }),
      } as any),
    ).toThrow(UnauthorizedException);
  });

  it('accepts the configured internal service token header', () => {
    process.env.INTERNAL_SERVICE_TOKEN = 'secret-token';
    const guard = new InternalServiceTokenGuard();

    expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({ headers: { 'x-internal-service-token': 'secret-token' } }),
        }),
      } as any),
    ).toBe(true);
  });
});
