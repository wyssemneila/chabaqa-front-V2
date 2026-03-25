"use client"

import { useState } from "react"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Step } from "@/lib/models"

interface CreateEventProgressProps {
  steps: Step[]
  currentStep: number
  setCurrentStep: (step: number) => void
}

export function CreateEventProgress({ steps, currentStep, setCurrentStep }: CreateEventProgressProps) {
  const progress = (currentStep / steps.length) * 100

  return (
    <EnhancedCard>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Event Creation Progress</h3>
          <span className="text-sm text-muted-foreground">
            {currentStep} of {steps.length}
          </span>
        </div>
        <Progress value={progress} className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {steps.map((step) => {
            const stepNum = typeof step.id === 'number' ? step.id : parseInt(step.id as string, 10);
            return (
              <div
                key={step.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${currentStep === stepNum
                    ? "border-events-500 bg-events-50"
                    : currentStep > stepNum
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                onClick={() => setCurrentStep(stepNum)}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${currentStep === stepNum
                        ? "bg-events-500 text-white"
                        : currentStep > stepNum
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
            )
          })}
        </div>
      </CardContent>
    </EnhancedCard>
  )
}