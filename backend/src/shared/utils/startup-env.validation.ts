import { isStrictProductionRuntime } from '@/shared/utils/security-config.util';

const PLACEHOLDER_VALUES = new Set([
  'your-stripe-secret',
  'your-stripe-webhook-secret',
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

function requireStripePlanPrices(missing: string[]): void {
  const required = [
    'STRIPE_PRICE_STARTER_MONTH',
    'STRIPE_PRICE_STARTER_YEAR',
    'STRIPE_PRICE_GROWTH_MONTH',
    'STRIPE_PRICE_GROWTH_YEAR',
    'STRIPE_PRICE_PRO_MONTH',
    'STRIPE_PRICE_PRO_YEAR',
  ];
  for (const name of required) {
    if (!getConfiguredEnv(name)) missing.push(name);
  }
}

export function validateStartupEnv(): void {
  if (!isStrictProductionRuntime()) {
    return;
  }

  const planEnforcementMode = String(process.env.PLAN_ENFORCEMENT_MODE || '').trim().toLowerCase();
  if (!['1', 'true', 'yes', 'on'].includes(planEnforcementMode)) {
    throw new Error('[startup-env] PLAN_ENFORCEMENT_MODE must be true in production');
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

  requireAny(['INTERNAL_SERVICE_TOKEN'], missing);

  requireAny(['STRIPE_SECRET_KEY', 'STRIPE_API_KEY'], missing);
  requireAny(['STRIPE_WEBHOOK_SECRET', 'STRIPE_LINK_WEBHOOK_SECRET'], missing);
  requireStripePlanPrices(missing);

  if (missing.length > 0) {
    throw new Error(`[startup-env] Missing required production env: ${missing.join(', ')}`);
  }
}
