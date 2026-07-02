import { validateStartupEnv } from '@/shared/utils/startup-env.validation';

describe('validateStartupEnv', () => {
  const env = process.env;

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
    process.env.KONNECT_MOCK_MODE = 'false';
    process.env.ENABLE_SWAGGER = 'false';
    delete process.env.MONGO_URI;
    delete process.env.MONGODB_URI;
    delete process.env.JWT_SECRET;
    delete process.env.STRIPE_SECRET_KEY;

    expect(() => validateStartupEnv()).toThrow(/Missing required production env/);
  });

  it('rejects KONNECT_MOCK_MODE in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.KONNECT_MOCK_MODE = 'true';
    process.env.MONGODB_URI = 'mongodb://localhost/test';
    process.env.JWT_SECRET = 'x'.repeat(32);
    process.env.FRONTEND_URL = 'https://example.com';
    process.env.SERVER_URL = 'https://example.com/api';
    process.env.STRIPE_SECRET_KEY = 'sk_test';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

    expect(() => validateStartupEnv()).toThrow(/KONNECT_MOCK_MODE/);
  });
});
