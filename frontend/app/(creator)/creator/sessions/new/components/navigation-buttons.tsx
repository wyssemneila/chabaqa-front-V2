
import { Button } from "@/components/ui/button"

interface NavigationButtonsProps {
  currentStep: number
  stepsLength: number
  setCurrentStep: (step: number) => void
  handleSubmit: () => void
  onNextStep: () => void
}

export function NavigationButtons({
  currentStep,
  stepsLength,
  setCurrentStep,
  handleSubmit,
  onNextStep,
}: NavigationButtonsProps) {
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
        {currentStep < stepsLength ? (
          <Button
            onClick={onNextStep}
            className="bg-sessions-500 hover:bg-sessions-600"
          >
            Next Step
          </Button>
        ) : (
          <Button onClick={handleSubmit} className="bg-sessions-500 hover:bg-sessions-600">
            Save Session Draft
          </Button>
        )}
      </div>
    </div>
  )
}