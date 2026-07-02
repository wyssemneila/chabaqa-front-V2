// Next.js server instrumentation hook — runs once when the server starts.
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
export async function register() {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const Sentry = await import('@sentry/nextjs');
    Sentry.init({
      dsn,
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
      tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
      beforeSend(event) {
        if (event.request?.headers) {
          for (const key of Object.keys(event.request.headers)) {
            if (/authorization|password|secret|token|cookie/i.test(key)) {
              event.request.headers[key] = '[REDACTED]';
            }
          }
        }
        return event;
      },
    });
  }
}

export async function onRequestError(...args: Parameters<typeof import('@sentry/nextjs').captureRequestError>) {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  const Sentry = await import('@sentry/nextjs');
  Sentry.captureRequestError(...args);
}
