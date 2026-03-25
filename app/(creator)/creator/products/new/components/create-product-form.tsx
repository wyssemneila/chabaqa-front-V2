"use client"

import { BasicInfoStep } from "./basic-info-step"
import { PricingStep } from "./pricing-step"
import { DeliveryStep } from "./delivery-step"
import { ReviewStep } from "./review-step"
import { useProductForm } from "./product-form-context"

export function CreateProductForm() {
  const { currentStep } = useProductForm()

  switch (currentStep) {
    case 1:
      return <BasicInfoStep />
    case 2:
      return <PricingStep />
    case 3:
      return <DeliveryStep />
    case 4:
      return <ReviewStep />
    default:
      return <BasicInfoStep />
  }
}