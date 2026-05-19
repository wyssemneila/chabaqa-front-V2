const STRIPE_ENABLED_VALUES = new Set(['1', 'true', 'yes', 'on']);

function hasAnyEnv(names: string[]): boolean {
  return names.some((name) => Boolean(String(process.env[name] || '').trim()));
}

function requireAny(names: string[], missing: string[]): void {
  if (!hasAnyEnv(names)) {
    missing.push(names.join(' or '));
  }
}

export function validateStartupEnv(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const missing: string[] = [];

  requireAny(['MONGODB_URI', 'MONGO_URI'], missing);
  requireAny(['JWT_SECRET', 'JWT_ACCESS_SECRET'], missing);
  requireAny(['FRONTEND_URL', 'NEXT_PUBLIC_APP_URL'], missing);
  requireAny(['SERVER_URL', 'NEXT_PUBLIC_API_URL', 'API_INTERNAL_URL'], missing);

  const stripeConfigured = hasAnyEnv(['STRIPE_SECRET_KEY', 'STRIPE_API_KEY']);
  const stripeExplicitlyEnabled = STRIPE_ENABLED_VALUES.has(
    String(process.env.STRIPE_ENABLED || process.env.PAYMENTS_STRIPE_ENABLED || '').trim().toLowerCase(),
  );

  if (stripeConfigured || stripeExplicitlyEnabled) {
    requireAny(['STRIPE_SECRET_KEY', 'STRIPE_API_KEY'], missing);
    requireAny(['STRIPE_WEBHOOK_SECRET', 'STRIPE_LINK_WEBHOOK_SECRET'], missing);
  }

  if (missing.length > 0) {
    throw new Error(`[startup-env] Missing required production env: ${missing.join(', ')}`);
  }
}
