"use client"

import { useState } from "react"
import { productsApi } from "@/lib/api/products.api"
import { tokenStorage } from "@/lib/token-storage"

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api").replace(/\/$/, "")

interface SubmitManualPaymentInput {
  productId: string
  paymentProof: File
  promoCode?: string
}

export function useProductPurchaseFlow() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isStripeLoading, setIsStripeLoading] = useState(false)
  const [isPendingVerification, setIsPendingVerification] = useState(false)

  const initStripePayment = async (productId: string, promoCode?: string) => {
    setIsStripeLoading(true)
    try {
      const result = await productsApi.initStripePayment(productId, promoCode)
      const checkoutUrl = result?.checkoutUrl || result?.data?.checkoutUrl
      if (!checkoutUrl) {
        throw new Error("No checkout URL returned")
      }
      if (typeof window !== "undefined") {
        window.location.href = checkoutUrl
      }
    } finally {
      setIsStripeLoading(false)
    }
  }

  const submitManualPayment = async ({
    productId,
    paymentProof,
    promoCode,
  }: SubmitManualPaymentInput) => {
    setIsSubmitting(true)
    try {
      const accessToken = tokenStorage.getAccessToken()
      if (!accessToken) {
        throw new Error("Please sign in to purchase this product.")
      }

      const promoQuery = promoCode?.trim()
        ? `?promoCode=${encodeURIComponent(promoCode.trim())}`
        : ""

      const formData = new FormData()
      formData.append("productId", productId)
      formData.append("proof", paymentProof)

      const initResponse = await fetch(`${API_BASE}/payment/manual/init/product${promoQuery}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
        body: formData,
      })

      const initData = await initResponse.json().catch(() => null)
      if (!initResponse.ok) {
        const message =
          initData?.message || initData?.error || "Failed to submit payment proof"
        throw new Error(message)
      }

      setIsPendingVerification(true)
      return initData
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    isSubmitting,
    isStripeLoading,
    isPendingVerification,
    setIsPendingVerification,
    initStripePayment,
    submitManualPayment,
  }
}
