import { isStrictProductionRuntime } from '@/shared/utils/security-config.util';

const PLACEHOLDER_VALUES = new Set([
  'your-flouci-token',
  'your-flouci-secret',
  'your-konnect-api-key',
  'your-konnect-wallet-id',
  'your-stripe-secret',
  'your-stripe-webhook-secret',
  'your-flouci-webhook-secret',
]);

function getConfiguredEnv(name: string): string {
  const value = String(process.env[name] || '').trim();
  if (!value || PLACEHOLDER_VALUES.has(value.toLowerCase())) {
    return '';
  }
  return value;
}

function hasAnyEnv(names: string[]): boolean {
  return names.some((name) => Boolean(getConfiguredEnv(name)));
}

function requireAny(names: string[], missing: string[]): void {
  if (!hasAnyEnv(names)) {
    missing.push(names.join(' or '));
  }
}

export function validateStartupEnv(): void {
  if (!isStrictProductionRuntime()) {
    return;
  }

  const konnectMockMode = String(process.env.KONNECT_MOCK_MODE || '').trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(konnectMockMode)) {
    throw new Error('[startup-env] KONNECT_MOCK_MODE cannot be enabled in production');
  }

  const swaggerEnabled = String(process.env.ENABLE_SWAGGER || '').trim().toLowerCase();
  if (['1', 'yes', 'on'].includes(swaggerEnabled)) {
    throw new Error('[startup-env] ENABLE_SWAGGER must be exactly "true" when intentionally enabled');
  }

  const missing: string[] = [];

  requireAny(['MONGODB_URI', 'MONGO_URI'], missing);
  requireAny(['JWT_SECRET', 'JWT_ACCESS_SECRET'], missing);
  requireAny(['FRONTEND_URL', 'NEXT_PUBLIC_APP_URL'], missing);
  requireAny(['SERVER_URL', 'NEXT_PUBLIC_API_URL', 'API_INTERNAL_URL'], missing);

  requireAny(['STRIPE_SECRET_KEY', 'STRIPE_API_KEY'], missing);
  requireAny(['STRIPE_WEBHOOK_SECRET', 'STRIPE_LINK_WEBHOOK_SECRET'], missing);

  if (missing.length > 0) {
    throw new Error(`[startup-env] Missing required production env: ${missing.join(', ')}`);
  }
}
