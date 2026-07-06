"use client"

import { useState } from "react"
import type { PaymentProvider } from "@/components/payment-provider-modal"

interface UsePaymentProviderModalOptions {
  initStripe: () => Promise<any>
  onError?: (error: unknown) => void
}

function resolveCheckoutUrl(result: any): string | null {
  return result?.checkoutUrl || result?.data?.checkoutUrl || null
}

export function usePaymentProviderModal({ initStripe, onError }: UsePaymentProviderModalOptions) {
  const [isOpen, setIsOpen] = useState(false)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  const handleSelect = async (provider: PaymentProvider) => {
    try {
      const result = await initStripe()
      const url = resolveCheckoutUrl(result)
      if (!url) throw new Error("No checkout URL returned")
      window.location.href = url
    } catch (err) {
      setIsOpen(false)
      onError?.(err)
      throw err
    }
  }

  return { isOpen, open, close, handleSelect }
}
