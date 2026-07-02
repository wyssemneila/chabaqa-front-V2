import * as Sentry from '@sentry/node';
import { sanitizeLogValue, writeStructuredLog } from '@/shared/utils/log-sanitizer.util';

let initialized = false;

function scrubSentryEvent<T extends { request?: { headers?: Record<string, unknown>; data?: unknown }; extra?: unknown; breadcrumbs?: Array<{ data?: unknown }> }>(
  event: T,
): T {
  if (event.request?.headers) {
    event.request.headers = sanitizeLogValue(event.request.headers) as Record<string, unknown>;
  }
  if (event.request?.data) {
    event.request.data = sanitizeLogValue(event.request.data);
  }
  if (event.extra) {
    event.extra = sanitizeLogValue(event.extra) as Record<string, unknown>;
  }
  if (Array.isArray(event.breadcrumbs)) {
    event.breadcrumbs = event.breadcrumbs.map((crumb) => ({
      ...crumb,
      data: crumb.data ? sanitizeLogValue(crumb.data) : crumb.data,
    }));
  }
  return event;
}

/** No-op unless SENTRY_DSN is configured — safe to call unconditionally at startup. */
export function initSentry(): void {
  const dsn = String(process.env.SENTRY_DSN || '').trim();
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    beforeSend(event) {
      return scrubSentryEvent(event);
    },
  });
  initialized = true;
  writeStructuredLog('info', 'sentry_initialized', {
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
  });
}

export function isSentryEnabled(): boolean {
  return initialized;
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!initialized) return;
  Sentry.captureException(error, context ? { extra: sanitizeLogValue(context) as Record<string, unknown> } : undefined);
}
