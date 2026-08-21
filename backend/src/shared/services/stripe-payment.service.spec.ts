import { ConfigService } from '@nestjs/config';
import { StripePaymentService } from '@/shared/services/stripe-payment.service';

describe('StripePaymentService env aliases', () => {
  const buildConfig = (values: Record<string, string | undefined>) => ({
    get: jest.fn((key: string) => values[key]),
  }) as unknown as ConfigService;

  it('uses STRIPE_API_KEY when STRIPE_SECRET_KEY is absent', () => {
    const service = new StripePaymentService(buildConfig({
      STRIPE_API_KEY: 'sk_test_alias',
      STRIPE_MOCK_MODE: 'false',
    }));

    expect(service.isMockMode).toBe(false);
  });

  it('uses STRIPE_LINK_WEBHOOK_SECRET when STRIPE_WEBHOOK_SECRET is absent', async () => {
    const service = new StripePaymentService(buildConfig({
      STRIPE_API_KEY: 'sk_test_alias',
      STRIPE_LINK_WEBHOOK_SECRET: 'whsec_alias',
      STRIPE_MOCK_MODE: 'false',
    }));

    const result = await service.createWebhookEvent(Buffer.from('{}'), 'bad_signature');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).not.toBe('Stripe webhook secret is not configured');
  });
});
