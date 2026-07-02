// Client-side Sentry init. Loaded automatically by Next.js before hydration
// when this file exists at the project root.
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    beforeSend(event) {
      if (event.request?.headers) {
        for (const key of Object.keys(event.request.headers)) {
          if (/authorization|password|secret|token|cookie/i.test(key)) {
            event.request.headers[key] = '[REDACTED]'
          }
        }
      }
      return event
    },
  })
}
