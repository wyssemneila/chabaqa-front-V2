"use client"

import { useState } from "react"
import { productsApi } from "@/lib/api/products.api"
import { usePaymentProviderModal } from "@/lib/hooks/use-payment-provider-modal"

export function useProductPurchaseFlow() {
  const [pendingProductId, setPendingProductId] = useState<string | null>(null)
  const [pendingPromoCode, setPendingPromoCode] = useState<string | undefined>(undefined)

  const paymentModal = usePaymentProviderModal({
    initStripe: (idempotencyKey) => productsApi.initStripePayment(pendingProductId!, pendingPromoCode, idempotencyKey),
  })

  const initStripePayment = (productId: string, promoCode?: string) => {
    setPendingProductId(productId)
    setPendingPromoCode(promoCode)
    paymentModal.open()
  }

  return {
    isSubmitting: paymentModal.isLoading,
    isStripeLoading: paymentModal.isLoading,
    isPendingVerification: false,
    setIsPendingVerification: () => undefined,
    initStripePayment,
    paymentModal,
  }
}
