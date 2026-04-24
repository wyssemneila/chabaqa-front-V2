"use client"

import { Button } from "@/components/ui/button"
import { useProductForm } from "./product-form-context"

export function CreateProductNavigation() {
  const { currentStep, setCurrentStep, validateStep, handleSubmit, formData } = useProductForm()
  const steps = [
    { id: 1, title: "Basic Info" },
    { id: 2, title: "Pricing & Variants" },
    { id: 3, title: "Digital Delivery" },
    { id: 4, title: "Review & Publish" },
  ]

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(steps.length, currentStep + 1))
    }
  }

  return (
    <div className="flex items-center justify-between">
      <Button
        variant="outline"
        onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
        disabled={currentStep === 1}
      >
        Previous
      </Button>

      <div className="flex items-center space-x-2">
        {currentStep < steps.length ? (
          <Button
            onClick={handleNext}
            className="bg-products-500 hover:bg-products-600"
          >
            Next Step
          </Button>
        ) : (
          <Button onClick={handleSubmit} className="bg-products-500 hover:bg-products-600">
            {formData.isPublished ? "Create & Publish Product" : "Save as Draft"}
          </Button>
        )}
      </div>
    </div>
  )
}