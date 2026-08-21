"use client"

import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Target } from "lucide-react"
import { ChallengeStepCard } from "./challenge-step-card"

interface ChallengeStepsStepProps {
  formData: any
  setFormData: (data: any) => void
  validationErrors?: Record<string, string>
}

export function ChallengeStepsStep({ formData, setFormData, validationErrors = {} }: ChallengeStepsStepProps) {
  const addChallengeStep = () => {
    const newStep = {
      day: formData.steps.length + 1,
      title: "",
      description: "",
      deliverable: "",
      points: 100,
      resources: [],
      instructions: "",
    }
    setFormData((prev: any) => ({
      ...prev,
      steps: [...prev.steps, newStep],
    }))
  }

  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center">
          <div className="flex flex-1 items-center">
            <Target className="h-5 w-5 mr-2 text-challenges-500" />
            Challenge Tasks
          </div>
          <Button type="button" size="sm" onClick={addChallengeStep}>
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        </CardTitle>
        <CardDescription>Start with one task. Add more days only when the challenge needs them.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {validationErrors.tasks && (
          <p className="text-sm text-red-500">{validationErrors.tasks}</p>
        )}
        {formData.steps.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
            <p className="text-muted-foreground mb-4">Add the first task participants should complete.</p>
            <Button type="button" onClick={addChallengeStep}>
              <Plus className="h-4 w-4 mr-1" />
              Add First Task
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.steps.map((step: any, index: number) => (
              <ChallengeStepCard
                key={index}
                step={step}
                index={index}
                formData={formData}
                setFormData={setFormData}
                validationErrors={validationErrors}
              />
            ))}
          </div>
        )}
      </CardContent>
    </EnhancedCard>
  )
}
