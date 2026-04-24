"use client"

import { Button } from "@/components/ui/button"

interface NavigationButtonsProps {
  currentStep: number
  stepsLength: number
  setCurrentStep: (step: number) => void
  handleSubmit: () => void
  formData: {
    isPublished: boolean
  }
  isSubmitting?: boolean
  handleNextStep?: () => void
  handlePrevStep?: () => void
}

export function NavigationButtons({
  currentStep,
  stepsLength,
  setCurrentStep,
  handleSubmit,
  formData,
  isSubmitting = false,
  handleNextStep,
  handlePrevStep,
}: NavigationButtonsProps) {
  return (
    <div className="flex items-center justify-between">
      <Button
        variant="outline"
        onClick={() => {
          if (isSubmitting) return
          if (handlePrevStep) handlePrevStep()
          else setCurrentStep(Math.max(1, currentStep - 1))
        }}
        disabled={currentStep === 1 || isSubmitting}
      >
        Previous
      </Button>

      <div className="flex items-center space-x-2">
        {currentStep < stepsLength ? (
          <Button
            onClick={() => {
              if (isSubmitting) return
              if (handleNextStep) handleNextStep()
              else setCurrentStep(Math.min(stepsLength, currentStep + 1))
            }}
            className="bg-courses-500 hover:bg-courses-600"
            disabled={isSubmitting}
          >
            Next Step
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            className="bg-courses-500 hover:bg-courses-600"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Creating..."
              : formData.isPublished
              ? "Create & Publish Course"
              : "Save as Draft"}
          </Button>
        )}
      </div>
    </div>
  )
}