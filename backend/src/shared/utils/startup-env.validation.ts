import { isStrictProductionRuntime } from '@/shared/utils/security-config.util';

const ENABLED_VALUES = new Set(['1', 'true', 'yes', 'on']);

function hasAnyEnv(names: string[]): boolean {
  return names.some((name) => Boolean(String(process.env[name] || '').trim()));
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
  const stripeExplicitlyEnabled = ENABLED_VALUES.has(
    String(process.env.STRIPE_ENABLED || process.env.PAYMENTS_STRIPE_ENABLED || '').trim().toLowerCase(),
  );

  if (stripeConfigured || stripeExplicitlyEnabled) {
    requireAny(['STRIPE_SECRET_KEY', 'STRIPE_API_KEY'], missing);
    requireAny(['STRIPE_WEBHOOK_SECRET', 'STRIPE_LINK_WEBHOOK_SECRET'], missing);
  }

  const konnectConfigured = hasAnyEnv(['KONNECT_API_KEY', 'KONNECT_WALLET_ID']);
  const konnectExplicitlyEnabled = ENABLED_VALUES.has(
    String(process.env.KONNECT_ENABLED || process.env.PAYMENTS_KONNECT_ENABLED || '').trim().toLowerCase(),
  );
  const konnectMockEnabled = ENABLED_VALUES.has(
    String(process.env.KONNECT_MOCK_MODE || '').trim().toLowerCase(),
  );
  if (konnectMockEnabled) {
    missing.push('KONNECT_MOCK_MODE must be disabled in production');
  }
  if (konnectConfigured || konnectExplicitlyEnabled) {
    requireAny(['KONNECT_API_KEY'], missing);
    requireAny(['KONNECT_WALLET_ID'], missing);
  }

  const flouciConfigured = hasAnyEnv(['FLOUCI_APP_TOKEN', 'FLOUCI_APP_SECRET']);
  const flouciExplicitlyEnabled = ENABLED_VALUES.has(
    String(process.env.FLOUCI_ENABLED || process.env.PAYMENTS_FLOUCI_ENABLED || '').trim().toLowerCase(),
  );
  if (flouciConfigured || flouciExplicitlyEnabled) {
    requireAny(['FLOUCI_APP_TOKEN'], missing);
    requireAny(['FLOUCI_APP_SECRET'], missing);
    requireAny(['FLOUCI_WEBHOOK_SECRET'], missing);
  }

  if (missing.length > 0) {
    throw new Error(`[startup-env] Missing required production env: ${missing.join(', ')}`);
  }
}
