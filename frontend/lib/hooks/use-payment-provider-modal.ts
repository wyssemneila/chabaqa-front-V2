"use client"

import { useRef, useState } from "react"
import type { PaymentProvider } from "@/components/payment-provider-modal"

interface UsePaymentProviderModalOptions {
  initStripe: (idempotencyKey: string) => Promise<any>
  onError?: (error: unknown) => void
  navigate?: (url: string) => void
}

function resolveCheckoutUrl(result: any): string | null {
  return result?.checkoutUrl || result?.data?.checkoutUrl || null
}

export function isSafeStripeCheckoutUrl(value: string): boolean {
  try {
    const url = new URL(value)
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]"
    if (local && process.env.NODE_ENV !== "production") return url.protocol === "http:" || url.protocol === "https:"
    return url.protocol === "https:" && (url.hostname === "checkout.stripe.com" || url.hostname.endsWith(".stripe.com"))
  } catch {
    return false
  }
}

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) return String(error.message)
  return "Unable to start Stripe checkout. Please try again."
}

export function usePaymentProviderModal({ initStripe, onError, navigate }: UsePaymentProviderModalOptions) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef(false)
  const attemptKey = useRef<string | null>(null)

  const open = () => {
    attemptKey.current = crypto.randomUUID()
    setError(null)
    setIsOpen(true)
  }
  const close = () => {
    if (!inFlight.current) setIsOpen(false)
  }

  const handleSelect = async (provider: PaymentProvider) => {
    if (inFlight.current || provider !== "stripe") return
    inFlight.current = true
    setIsLoading(true)
    setError(null)
    try {
      const key = attemptKey.current || crypto.randomUUID()
      attemptKey.current = key
      const result = await initStripe(key)
      const url = resolveCheckoutUrl(result)
      if (!url) throw new Error("No checkout URL returned")
      if (!isSafeStripeCheckoutUrl(url)) throw new Error("Stripe returned an unsafe checkout URL")
      if (navigate) navigate(url)
      else window.location.href = url
    } catch (err) {
      const status = Number((err as any)?.statusCode || (err as any)?.status)
      if (status === 401 && typeof window !== "undefined") {
        const redirect = `${window.location.pathname}${window.location.search}`
        window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`
        return
      }
      setError(errorMessage(err))
      onError?.(err)
    } finally {
      inFlight.current = false
      setIsLoading(false)
    }
  }

  return { isOpen, isLoading, error, open, close, handleSelect }
}
