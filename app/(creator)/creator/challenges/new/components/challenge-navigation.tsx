import { Button } from "@/components/ui/button"

interface ChallengeNavigationProps {
  currentStep: number
  steps: Array<{ id: number }>
  onNext: () => void
  onBack: () => void
  onSubmit: () => void
  isPublished: boolean
  isSubmitting?: boolean
}

export function ChallengeNavigation({
  currentStep,
  steps,
  onNext,
  onBack,
  onSubmit,
  isPublished,
  isSubmitting = false,
}: ChallengeNavigationProps) {
  return (
    <div className="flex items-center justify-between">
      <Button
        variant="outline"
        onClick={onBack}
        disabled={currentStep === 1 || isSubmitting}
      >
        Previous
      </Button>

      <div className="flex items-center space-x-2">
        {currentStep < steps.length ? (
          <Button
            onClick={onNext}
            className="bg-challenges-500 hover:bg-challenges-600"
            disabled={isSubmitting}
          >
            Next Step
          </Button>
        ) : (
          <Button
            onClick={onSubmit}
            className="bg-challenges-500 hover:bg-challenges-600"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Creating..."
              : isPublished
              ? "Create & Publish Challenge"
              : "Save as Draft"}
          </Button>
        )}
      </div>
    </div>
  )
}