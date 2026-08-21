
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const steps = [
  { id: 1, title: "Start", description: "Title, description, and cover" },
  { id: 2, title: "Lessons", description: "First lesson and structure" },
  { id: 3, title: "Details", description: "Price, category, and outcomes" },
  { id: 4, title: "Publish checks", description: "Review blockers before going live" },
]

interface CourseCreationProgressProps {
  currentStep?: number
  setCurrentStep?: (step: number) => void
}

export function CourseCreationProgress({ currentStep = 1, setCurrentStep = () => {} }: CourseCreationProgressProps) {
  const progress = (currentStep / steps.length) * 100

  return (
    <EnhancedCard>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Course Setup</h3>
          <span className="text-sm text-muted-foreground">
            {currentStep} of {steps.length}
          </span>
        </div>
        <Progress value={progress} className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                currentStep === step.id
                  ? "border-courses-500 bg-courses-50"
                  : currentStep > step.id
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-gray-50"
              }`}
              onClick={() => setCurrentStep(step.id)}
            >
              <div className="flex items-center space-x-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    currentStep === step.id
                      ? "bg-courses-500 text-white"
                      : currentStep > step.id
                        ? "bg-green-500 text-white"
                        : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {step.id}
                </div>
                <div>
                  <div className="font-medium text-sm">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </EnhancedCard>
  )
}
