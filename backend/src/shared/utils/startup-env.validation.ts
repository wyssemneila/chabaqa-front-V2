import { isStrictProductionRuntime } from '@/shared/utils/security-config.util';

const ENABLED_VALUES = new Set(['1', 'true', 'yes', 'on']);
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

function isEnabled(...names: string[]): boolean {
  return names.some((name) => ENABLED_VALUES.has(String(process.env[name] || '').trim().toLowerCase()));
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

  const missing: string[] = [];

  requireAny(['MONGODB_URI', 'MONGO_URI'], missing);
  requireAny(['JWT_SECRET', 'JWT_ACCESS_SECRET'], missing);
  requireAny(['FRONTEND_URL', 'NEXT_PUBLIC_APP_URL'], missing);
  requireAny(['SERVER_URL', 'NEXT_PUBLIC_API_URL', 'API_INTERNAL_URL'], missing);

  const stripeConfigured = hasAnyEnv(['STRIPE_SECRET_KEY', 'STRIPE_API_KEY']);
  const stripeExplicitlyEnabled = isEnabled('STRIPE_ENABLED', 'PAYMENTS_STRIPE_ENABLED');

  if (stripeConfigured || stripeExplicitlyEnabled) {
    requireAny(['STRIPE_SECRET_KEY', 'STRIPE_API_KEY'], missing);
    requireAny(['STRIPE_WEBHOOK_SECRET', 'STRIPE_LINK_WEBHOOK_SECRET'], missing);
  }

  const konnectConfigured = hasAnyEnv(['KONNECT_API_KEY', 'KONNECT_WALLET_ID']);
  const konnectExplicitlyEnabled = isEnabled('KONNECT_ENABLED', 'PAYMENTS_KONNECT_ENABLED');
  const konnectMockEnabled = isEnabled('KONNECT_MOCK_MODE');
  if (konnectMockEnabled) {
    missing.push('KONNECT_MOCK_MODE must be disabled in production');
  }
  if (konnectConfigured || konnectExplicitlyEnabled) {
    requireAny(['KONNECT_API_KEY'], missing);
    requireAny(['KONNECT_WALLET_ID'], missing);
  }

  const flouciConfigured = hasAnyEnv(['FLOUCI_APP_TOKEN', 'FLOUCI_APP_SECRET']);
  const flouciExplicitlyEnabled = isEnabled('FLOUCI_ENABLED', 'PAYMENTS_FLOUCI_ENABLED');
  if (flouciConfigured || flouciExplicitlyEnabled) {
    requireAny(['FLOUCI_APP_TOKEN'], missing);
    requireAny(['FLOUCI_APP_SECRET'], missing);
    requireAny(['FLOUCI_WEBHOOK_SECRET'], missing);
  }

  if (missing.length > 0) {
    throw new Error(`[startup-env] Missing required production env: ${missing.join(', ')}`);
  }
}
