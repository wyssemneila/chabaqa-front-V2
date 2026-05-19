"use client"

import { Button } from "@/components/ui/button"

interface CreateEventNavigationProps {
  currentStep: number
  steps: any[]
  setCurrentStep: (step: number) => void
  handleSubmit: () => void
  onNextStep?: () => void
  isSubmitting?: boolean
  hideSubmitAction?: boolean
}

export function CreateEventNavigation({
  currentStep,
  steps,
  setCurrentStep,
  handleSubmit,
  onNextStep,
  isSubmitting = false,
  hideSubmitAction = false,
}: CreateEventNavigationProps) {
  const handleNext = () => {
    if (onNextStep) {
      onNextStep()
    } else {
      setCurrentStep(Math.min(steps.length, currentStep + 1))
    }
  }

  const isLastStep = currentStep >= steps.length

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
        {!isLastStep ? (
          <Button
            onClick={handleNext}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isSubmitting}
          >
            Next Step
          </Button>
        ) : hideSubmitAction ? null : (
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
            Save Event Draft
          </Button>
        )}
      </div>
    </div>
  )
}
