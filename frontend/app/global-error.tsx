"use client"

import { useEffect } from "react"
import Link from "next/link"

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    const payload = {
      message: error.message,
      digest: error.digest,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
      occurredAt: new Date().toISOString(),
    }

    try {
      const body = JSON.stringify(payload)
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/client-error", new Blob([body], { type: "application/json" }))
      } else {
        fetch("/api/client-error", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => undefined)
      }
    } catch {
      // The error boundary must never fail while reporting an error.
    }
  }, [error])

  return (
    <html lang="en">
      <body>
        <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
          <section className="max-w-lg rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Application error</p>
            <h1 className="mt-4 text-3xl font-bold">Something went wrong</h1>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              The issue was logged for review. Try again, or return to the homepage if the page keeps failing.
            </p>
            {error.digest ? <p className="mt-4 text-xs text-slate-400">Error ID: {error.digest}</p> : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={reset}
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100"
              >
                Try again
              </button>
              <Link
                href="/"
                className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Go home
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  )
}
