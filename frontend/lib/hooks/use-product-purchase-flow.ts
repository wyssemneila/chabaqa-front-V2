"use client"

import { useState } from "react"
import { productsApi } from "@/lib/api/products.api"
import { usePaymentProviderModal } from "@/lib/hooks/use-payment-provider-modal"

export function useProductPurchaseFlow() {
  const [isStripeLoading, setIsStripeLoading] = useState(false)
  const [pendingProductId, setPendingProductId] = useState<string | null>(null)
  const [pendingPromoCode, setPendingPromoCode] = useState<string | undefined>(undefined)

  const paymentModal = usePaymentProviderModal({
    initStripe: () => productsApi.initStripePayment(pendingProductId!, pendingPromoCode),
  })

  const initStripePayment = (productId: string, promoCode?: string) => {
    setPendingProductId(productId)
    setPendingPromoCode(promoCode)
    paymentModal.open()
  }

  return {
    isSubmitting: isStripeLoading,
    isStripeLoading,
    isPendingVerification: false,
    setIsPendingVerification: () => undefined,
    initStripePayment,
    paymentModal,
  }
}
