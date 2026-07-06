import { validateStartupEnv } from '@/shared/utils/startup-env.validation';

describe('validateStartupEnv', () => {
  const env = process.env;

  const setRequiredProductionEnv = () => {
    process.env.NODE_ENV = 'production';
    process.env.PLAN_ENFORCEMENT_MODE = 'true';
    process.env.ENABLE_SWAGGER = 'false';
    process.env.MONGODB_URI = 'mongodb://localhost/test';
    process.env.JWT_SECRET = 'x'.repeat(32);
    process.env.FRONTEND_URL = 'https://example.com';
    process.env.SERVER_URL = 'https://example.com/api';
    process.env.INTERNAL_SERVICE_TOKEN = 'x'.repeat(32);
    process.env.STRIPE_SECRET_KEY = 'sk_test';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    process.env.STRIPE_PRICE_STARTER_MONTH = 'price_starter_month';
    process.env.STRIPE_PRICE_STARTER_YEAR = 'price_starter_year';
    process.env.STRIPE_PRICE_GROWTH_MONTH = 'price_growth_month';
    process.env.STRIPE_PRICE_GROWTH_YEAR = 'price_growth_year';
    process.env.STRIPE_PRICE_PRO_MONTH = 'price_pro_month';
    process.env.STRIPE_PRICE_PRO_YEAR = 'price_pro_year';
  };

  beforeEach(() => {
    process.env = { ...env };
  });

  afterAll(() => {
    process.env = env;
  });

  it('does not throw in non-production environments', () => {
    process.env.NODE_ENV = 'development';
    expect(() => validateStartupEnv()).not.toThrow();
  });

  it('throws when required production secrets are missing', () => {
    process.env.NODE_ENV = 'production';
    process.env.PLAN_ENFORCEMENT_MODE = 'true';
    process.env.ENABLE_SWAGGER = 'false';
    delete process.env.MONGO_URI;
    delete process.env.MONGODB_URI;
    delete process.env.JWT_SECRET;
    delete process.env.STRIPE_SECRET_KEY;

    expect(() => validateStartupEnv()).toThrow(/Missing required production env/);
  });

  it('passes when required production Stripe env is present', () => {
    setRequiredProductionEnv();

    expect(() => validateStartupEnv()).not.toThrow();
  });

  it('passes when production Stripe aliases are the only configured Stripe env', () => {
    setRequiredProductionEnv();
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    process.env.STRIPE_API_KEY = 'sk_live_alias';
    process.env.STRIPE_LINK_WEBHOOK_SECRET = 'whsec_alias';

    expect(() => validateStartupEnv()).not.toThrow();
  });

  it('requires stable Stripe plan prices in production', () => {
    setRequiredProductionEnv();
    delete process.env.STRIPE_PRICE_PRO_YEAR;

    expect(() => validateStartupEnv()).toThrow(/STRIPE_PRICE_PRO_YEAR/);
  });
});
