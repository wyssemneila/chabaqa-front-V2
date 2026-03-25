"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChallengeHeader } from "./challenge-header"
import { ChallengeProgress } from "./challenge-progress"
import { BasicInfoStep } from "./basic-info-step"
import { TimelinePricingStep } from "./timeline-pricing-step"
import { ChallengeStepsStep } from "./challenge-steps-step"
import { ReviewPublishStep } from "./review-publish-step"
import { ChallengeNavigation } from "./challenge-navigation"
import { challengesApi, type CreateChallengeData } from "@/lib/api/challenges.api"
import { useToast } from "@/hooks/use-toast"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { extractApiError } from "@/lib/api/error-parser"
import {
  mapBackendErrorsToCreatorFields,
  normalizeDifficultyToBackend,
  validateCreateStep,
  validateTasks,
} from "../../_validation/challenge-validation"

export function CreateChallengeForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [formData, setFormData] = useState(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  // Use the selected community from context
  const { selectedCommunity } = useCreatorCommunity()
  const communitySlug = selectedCommunity?.slug || ""

  const scrollToFirstError = (errors: Record<string, string>) => {
    const first = Object.keys(errors)[0]
    if (!first) return

    const mappedId =
      first === "title" || first === "description" || first === "duration" || first === "unlockMessage"
        ? first
        : first === "startDate" || first === "endDate"
          ? first
          : first === "participationFee" || first === "currency" ? "participationFee"
            : first === "depositAmount" ? "depositAmount"
              : first === "completionReward" ? "completionReward"
                : first === "topPerformerBonus" ? "topPerformerBonus"
                  : first === "streakBonus" ? "streakBonus"
                    : first === "maxParticipants" ? "maxParticipants"
                      : first.match(/^steps\.(\d+)\.title$/)
                        ? `step-${first.match(/^steps\.(\d+)\.title$/)?.[1]}-title`
                        : first.match(/^steps\.(\d+)\.description$/)
                          ? `step-${first.match(/^steps\.(\d+)\.description$/)?.[1]}-description`
                          : first.match(/^steps\.(\d+)\.deliverable$/)
                            ? `step-${first.match(/^steps\.(\d+)\.deliverable$/)?.[1]}-deliverable`
                            : first.match(/^steps\.(\d+)\.instructions$/)
                              ? `step-${first.match(/^steps\.(\d+)\.instructions$/)?.[1]}-instructions`
                              : first.match(/^steps\.(\d+)\.day$/)
                                ? `step-${first.match(/^steps\.(\d+)\.day$/)?.[1]}-day`
                              : undefined

    if (!mappedId) return
    const el = document.getElementById(mappedId)
    el?.scrollIntoView({ behavior: "smooth", block: "center" })
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.focus()
  }

  const validateCurrentStep = () => {
    const result = validateCreateStep(currentStep, formData, { startDate, endDate })
    setValidationErrors(result.fieldErrors)

    if (!result.isValid) {
      toast({
        title: "Validation Error",
        description: result.globalErrors[0] || "Please fix the highlighted fields.",
        variant: "destructive",
      })
      scrollToFirstError(result.fieldErrors)
    }

    return result.isValid
  }

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setValidationErrors({})
      setCurrentStep(Math.min(steps.length, currentStep + 1))
    }
  }

  const handlePrevStep = () => {
    setCurrentStep(Math.max(1, currentStep - 1))
  }

  const steps = [
    { id: 1, title: "Basic Info", description: "Challenge title, description, and settings" },
    { id: 2, title: "Timeline & Pricing", description: "Set dates, deposit, and rewards" },
    { id: 3, title: "Challenge Steps", description: "Define daily tasks and deliverables" },
    { id: 4, title: "Review & Publish", description: "Review and publish your challenge" },
  ]

  const handleSubmit = async () => {
    if (isSubmitting) return

    try {
      if (!startDate || !endDate) {
        setValidationErrors({ startDate: "Please select a start date.", endDate: "End date is required." })
        toast({ title: "Validation Error", description: "Please fix the highlighted fields.", variant: "destructive" })
        setCurrentStep(2)
        return
      }
      if (!communitySlug) {
        toast({ title: "Missing community", description: "No community found for this creator.", variant: "destructive" })
        return
      }
      if (!formData.steps || formData.steps.length === 0) {
        setValidationErrors({ tasks: "Please add at least one challenge step." })
        toast({ title: "Validation Error", description: "Please add at least one challenge step.", variant: "destructive" })
        return
      }
      const stepOneValidation = validateCreateStep(1, formData, { startDate, endDate })
      const stepTwoValidation = validateCreateStep(2, formData, { startDate, endDate })
      const stepThreeValidation = validateTasks(formData.steps || [])
      const allErrors = {
        ...stepOneValidation.fieldErrors,
        ...stepTwoValidation.fieldErrors,
        ...stepThreeValidation.fieldErrors,
      }
      const hasErrors = Object.keys(allErrors).length > 0 || stepThreeValidation.globalErrors.length > 0
      if (hasErrors) {
        const targetStep = !stepOneValidation.isValid ? 1 : !stepTwoValidation.isValid ? 2 : 3
        setValidationErrors({
          ...allErrors,
          ...(stepThreeValidation.globalErrors[0] ? { tasks: stepThreeValidation.globalErrors[0] } : {}),
        })
        toast({
          title: "Validation Error",
          description: stepThreeValidation.globalErrors[0] || "Please fix the highlighted fields before submitting.",
          variant: "destructive",
        })
        setCurrentStep(targetStep)
        scrollToFirstError(allErrors)
        return
      }

      const sanitizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "")

      // Map UI form to CreateChallengeDto
      const tasks = (formData.steps || []).map((s) => {
        const rawResources = Array.isArray(s.resources) ? s.resources : []

        return {
        day: Number(s.day),
        title: sanitizeText(s.title),
        description: sanitizeText(s.description),
        deliverable: sanitizeText(s.deliverable),
        points: Number(s.points || 0),
        instructions: sanitizeText(s.instructions) || undefined,
        notes: undefined,
        resources: rawResources.map((r) => ({
          title: sanitizeText(r.title),
          type: sanitizeText(r.type) as "video" | "article" | "code" | "tool",
          url: sanitizeText(r.url),
          description: sanitizeText(r.description) || undefined,
        })),
      }})

      const payload: CreateChallengeData = {
        title: sanitizeText(formData.title),
        description: sanitizeText(formData.description),
        communitySlug,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        participationFee: formData.participationFee ? Number(formData.participationFee) : 0,
        currency: (formData.currency || 'TND') as 'TND' | 'USD' | 'EUR',
        depositAmount: formData.depositAmount ? Number(formData.depositAmount) : undefined,
        maxParticipants: formData.maxParticipants ? Number(formData.maxParticipants) : undefined,
        completionReward: formData.rewards?.completionReward ? Number(formData.rewards.completionReward) : undefined,
        topPerformerBonus: formData.rewards?.topPerformerBonus ? Number(formData.rewards.topPerformerBonus) : undefined,
        streakBonus: formData.rewards?.streakBonus ? Number(formData.rewards.streakBonus) : undefined,
        category: sanitizeText(formData.category) || undefined,
        difficulty: formData.difficulty ? normalizeDifficultyToBackend(formData.difficulty) : undefined,
        duration: sanitizeText(formData.duration) || undefined,
        thumbnail: sanitizeText(formData.thumbnail) || undefined,
        sequentialProgression: Boolean(formData.sequentialProgression),
        unlockMessage: sanitizeText(formData.unlockMessage) || undefined,
        // Use isPublished to determine if challenge should be published immediately
        isActive: formData.isPublished || false,
        resources: [],
        tasks: tasks || [],
      }

      setIsSubmitting(true)

      const res = await challengesApi.create(payload)
      const created = (res as any)?.data || res
      const statusMessage = formData.isPublished 
        ? 'Challenge published successfully!' 
        : 'Challenge created as draft - Publish it from the management page once you have an active subscription.'
      toast({ 
        title: formData.isPublished ? 'Challenge published' : 'Challenge created as draft', 
        description: statusMessage 
      })
      const id = created?.id || created?._id || created?.challenge?.id || created?.challenge?._id
      if (id) router.push(`/creator/challenges/${id}/manage`)
      else router.push('/creator/challenges')
    } catch (e: any) {
      const parsed = extractApiError(e)
      const mappedFieldErrors = mapBackendErrorsToCreatorFields(parsed)
      if (Object.keys(mappedFieldErrors).length) {
        setValidationErrors(mappedFieldErrors)
        if (mappedFieldErrors.startDate || mappedFieldErrors.endDate) {
          setCurrentStep(2)
        } else if (Object.keys(mappedFieldErrors).some((key) => key.startsWith("steps.") || key === "tasks")) {
          setCurrentStep(3)
        } else {
          setCurrentStep(1)
        }
        scrollToFirstError(mappedFieldErrors)
      }
      toast({
        title: "Failed to create challenge",
        description: parsed.globalMessage || "Please review required fields.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-5">
      <ChallengeHeader />
      
      <ChallengeProgress 
        currentStep={currentStep} 
        steps={steps} 
        setCurrentStep={setCurrentStep}
      />

      {currentStep === 1 && (
        <BasicInfoStep 
          formData={formData} 
          setFormData={setFormData}
          validationErrors={validationErrors}
        />
      )}

      {currentStep === 2 && (
        <TimelinePricingStep 
          formData={formData} 
          setFormData={setFormData} 
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          validationErrors={validationErrors}
        />
      )}

      {currentStep === 3 && (
        <ChallengeStepsStep 
          formData={formData} 
          setFormData={setFormData}
          validationErrors={validationErrors}
        />
      )}

      {currentStep === 4 && (
        <ReviewPublishStep 
          formData={formData} 
          setFormData={setFormData} 
          startDate={startDate}
          endDate={endDate}
        />
      )}

      <ChallengeNavigation
        currentStep={currentStep}
        steps={steps}
        onNext={handleNextStep}
        onBack={handlePrevStep}
        onSubmit={handleSubmit}
        isPublished={formData.isPublished}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}

const initialFormData = {
  title: "",
  description: "",
  thumbnail: "",
  currency: "TND",
  depositAmount: "",
  participationFee: "",
  maxParticipants: "",
  category: "",
  difficulty: "",
  duration: "",
  sequentialProgression: false,
  unlockMessage: "",
  isPublished: false,
  tags: [] as string[],
  rewards: {
    completionReward: "",
    topPerformerBonus: "",
    streakBonus: "",
  },
  steps: [] as Array<{
    id?: string
    day: number
    title: string
    description: string
    deliverable: string
    points: number
    resources: Array<{
      id: string
      title: string
      type: "video" | "article" | "code" | "tool"
      url: string
      description: string
    }>
    instructions: string
  }>,
}
