"use client"

import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Target, X, Award, Trash2 } from "lucide-react"
import { ChallengeStepCard } from "./challenge-step-card"
import { useEffect } from "react"

interface ChallengeStepsStepProps {
  formData: any
  setFormData: (data: any) => void
  validationErrors?: Record<string, string>
}

export function ChallengeStepsStep({ formData, setFormData, validationErrors = {} }: ChallengeStepsStepProps) {
  // Générer automatiquement les cartes en fonction de la durée du challenge
  useEffect(() => {
    if (formData.duration && formData.steps.length === 0) {
      // Extraire le nombre de jours de la durée (par exemple "7 days" -> 7)
      const durationMatch = formData.duration.match(/(\d+)\s*days?/)
      if (durationMatch) {
        const numberOfDays = parseInt(durationMatch[1], 10)
        // Créer automatiquement les steps pour chaque jour
        const generatedSteps = Array.from({ length: numberOfDays }, (_, index) => ({
          day: index + 1,
          title: "",
          description: "",
          deliverable: "",
          points: 100,
          resources: [],
          instructions: "",
        }))
        setFormData((prev: any) => ({
          ...prev,
          steps: generatedSteps,
        }))
      }
    }
  }, [formData.duration, formData.steps.length, setFormData])

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
          <Target className="h-5 w-5 mr-2 text-challenges-500" />
          Challenge Steps
        </CardTitle>
        <CardDescription>Define daily tasks and deliverables for your challenge</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {validationErrors.tasks && (
          <p className="text-sm text-red-500">{validationErrors.tasks}</p>
        )}
        {formData.steps.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No steps generated yet</h3>
            <p className="text-muted-foreground">Steps will be automatically generated based on the challenge duration</p>
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
