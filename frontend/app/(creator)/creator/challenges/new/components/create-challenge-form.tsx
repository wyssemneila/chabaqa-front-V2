"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  validateTasks,
} from "../../_validation/challenge-validation"
import {
  CreatorCreateShell,
  CreatorDraftRestoreBanner,
  CreatorPublishChecklist,
  CreatorValidationSummary,
  useCreatorCreateDraftStorage,
} from "@/components/creator-dashboard/create-flow"
import {
  type ChallengeCreateValues,
  getChallengePublishChecklist,
  getCreatorCreateTemplate,
  validateChallengeDraft,
  validateChallengePublish,
} from "@/lib/creator-content"

const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const getDurationDays = (duration: string) => {
  const match = duration.match(/(\d+)\s*days?/i)
  return match ? Number(match[1]) : 7
}

export function CreateChallengeForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [startDate, setStartDate] = useState<Date | undefined>(() => new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(() => addDays(new Date(), 6))
  const [formData, setFormData] = useState(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  // Use the selected community from context
  const { selectedCommunity } = useCreatorCommunity()
  const communitySlug = selectedCommunity?.slug || ""

  const challengeCreateValues = useMemo<ChallengeCreateValues>(() => ({
    title: formData.title,
    description: formData.description,
    communitySlug,
    startDate: (startDate || new Date()).toISOString(),
    endDate: (endDate || startDate || new Date()).toISOString(),
    participationFee: formData.participationFee || 0,
    currency: (formData.currency || "TND") as ChallengeCreateValues["currency"],
    category: formData.category || "General",
    difficulty: (formData.difficulty || "beginner") as ChallengeCreateValues["difficulty"],
    duration: formData.duration || "7 days",
    thumbnail: formData.thumbnail,
    sequentialProgression: Boolean(formData.sequentialProgression),
    unlockMessage: formData.unlockMessage,
    isActive: Boolean(formData.isPublished),
    tasks: (formData.steps || []).map((step) => ({
      day: step.day,
      title: step.title,
      description: step.description,
      deliverable: step.deliverable,
      points: step.points,
      instructions: step.instructions,
      resources: step.resources,
    })),
  }), [communitySlug, endDate, formData, startDate])

  const draftValidation = useMemo(() => validateChallengeDraft(challengeCreateValues), [challengeCreateValues])
  const publishValidation = useMemo(() => validateChallengePublish(challengeCreateValues), [challengeCreateValues])
  const publishChecklist = useMemo(() => getChallengePublishChecklist(challengeCreateValues), [challengeCreateValues])
  const draftStorage = useCreatorCreateDraftStorage({
    contentType: "challenge",
    communityId: communitySlug || "unknown",
    values: {
      formData,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    },
    enabled: !isSubmitting,
  })
  const appliedTemplateRef = useRef(false)

  useEffect(() => {
    if (appliedTemplateRef.current) return
    const template = getCreatorCreateTemplate("challenge", searchParams.get("template"))
    if (!template) return
    appliedTemplateRef.current = true
    const nextStartDate = new Date()
    const durationDays = getDurationDays(template.data.duration || "7 days")
    setStartDate(nextStartDate)
    setEndDate(addDays(nextStartDate, Math.max(1, durationDays) - 1))
    setFormData((prev) => ({
      ...prev,
      ...template.data,
      category: template.data.category || prev.category,
      difficulty: template.data.difficulty || prev.difficulty,
      currency: template.data.currency || prev.currency,
      steps: Array.isArray(template.data.steps) && template.data.steps.length ? template.data.steps : prev.steps,
    }))
  }, [searchParams])

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
    const fieldErrors: Record<string, string> = {}

    if (currentStep === 1) {
      if (!formData.title.trim() || formData.title.trim().length < 2) fieldErrors.title = "Title must be at least 2 characters."
      if (!formData.description.trim()) fieldErrors.description = "Description is required."
      if (formData.sequentialProgression && (formData.unlockMessage || "").length > 500) {
        fieldErrors.unlockMessage = "Unlock message must be 500 characters or less."
      }
    }

    if (currentStep === 2) {
      if (!startDate) fieldErrors.startDate = "Please select a start date."
      if (!endDate) fieldErrors.endDate = "End date is required."
      if (startDate && endDate && endDate < startDate) {
        fieldErrors.startDate = "Start date must be before end date."
        fieldErrors.endDate = "End date must be after start date."
      }
      const numericFields = [
        ["participationFee", formData.participationFee],
        ["depositAmount", formData.depositAmount],
        ["maxParticipants", formData.maxParticipants],
        ["completionReward", formData.rewards?.completionReward],
        ["topPerformerBonus", formData.rewards?.topPerformerBonus],
        ["streakBonus", formData.rewards?.streakBonus],
      ] as const
      numericFields.forEach(([key, value]) => {
        if (value !== "" && value !== undefined && value !== null && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
          fieldErrors[key] = "Must be 0 or greater."
        }
      })
    }

    if (currentStep === 3) {
      if (!formData.steps?.length) {
        fieldErrors.tasks = "Please add at least one challenge task."
      } else if (!formData.steps[0]?.title?.trim()) {
        fieldErrors["steps.0.title"] = "Add a title for the first task."
      }
    }

    const result = {
      isValid: Object.keys(fieldErrors).length === 0,
      fieldErrors,
      globalErrors: [] as string[],
    }
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
    { id: 1, title: "Start", description: "Title, description, and duration" },
    { id: 2, title: "Schedule", description: "Dates and optional pricing" },
    { id: 3, title: "Tasks", description: "Daily work and deliverables" },
    { id: 4, title: "Publish checks", description: "Review blockers before going live" },
  ]

  const restoreDraft = () => {
    const stored = draftStorage.storedValues as any
    if (!stored?.formData) return
    setFormData({
      ...initialFormData,
      ...stored.formData,
      steps: Array.isArray(stored.formData.steps) && stored.formData.steps.length ? stored.formData.steps : initialFormData.steps,
    })
    if (stored.startDate) setStartDate(new Date(stored.startDate))
    if (stored.endDate) setEndDate(new Date(stored.endDate))
    draftStorage.clearDraft()
  }

  const handleSubmit = async (options?: { publish?: boolean }) => {
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
      const stepOneValidation = {
        isValid: draftValidation.ok,
        fieldErrors: draftValidation.fieldErrors,
      }
      const stepTwoValidation = { isValid: true, fieldErrors: {} as Record<string, string> }
      const stepThreeValidation = options?.publish
        ? validateTasks(formData.steps || [])
        : {
            isValid: Boolean(formData.steps?.length && formData.steps[0]?.title?.trim()),
            fieldErrors: formData.steps?.[0]?.title?.trim() ? {} : { "steps.0.title": "Add a title for the first task." },
            globalErrors: formData.steps?.length ? [] : ["Please add at least one challenge task."],
          }
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
        description: sanitizeText(s.description) || sanitizeText(formData.description),
        deliverable: sanitizeText(s.deliverable) || "Complete the task",
        points: Number(s.points || 100),
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
        category: sanitizeText(formData.category) || "General",
        difficulty: formData.difficulty ? normalizeDifficultyToBackend(formData.difficulty) : "beginner",
        duration: sanitizeText(formData.duration) || "7 days",
        thumbnail: sanitizeText(formData.thumbnail) || undefined,
        sequentialProgression: Boolean(formData.sequentialProgression),
        unlockMessage: sanitizeText(formData.unlockMessage) || undefined,
        // Use isPublished to determine if challenge should be published immediately
        isActive: Boolean(options?.publish ?? formData.isPublished),
        resources: [],
        tasks: tasks || [],
      }

      setIsSubmitting(true)

      const res = await challengesApi.create(payload)
      const created = (res as any)?.data || res
      const shouldPublish = Boolean(options?.publish ?? formData.isPublished)
      const statusMessage = shouldPublish
        ? 'Challenge published successfully!' 
        : 'Challenge created as draft - Publish it from the management page once you have an active subscription.'
      toast({ 
        title: shouldPublish ? 'Challenge published' : 'Challenge created as draft',
        description: statusMessage 
      })
      draftStorage.clearDraft()
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
    <CreatorCreateShell
      title="Create New Challenge"
      description="Build a focused challenge your members can join and complete"
      backHref="/creator/challenges"
      backLabel="Back to challenges"
      communityName={selectedCommunity?.name}
      communityMeta={communitySlug}
      autosaveStatus={draftStorage.status}
      publishBlocked={!publishValidation.ok}
      previewAction={{ label: "Preview", onClick: () => setCurrentStep(4), disabled: isSubmitting }}
      mobileMode="limited"
      actions={[
        {
          label: "Save Draft",
          icon: "save",
          variant: "outline",
          onClick: () => handleSubmit({ publish: false }),
          disabled: isSubmitting || !draftValidation.ok,
          loading: isSubmitting,
        },
        {
          label: "Publish",
          icon: "publish",
          onClick: () => {
            if (!publishValidation.ok) {
              toast({
                title: "Publish checks need attention",
                description: publishValidation.publishBlockers[0] || Object.values(publishValidation.fieldErrors)[0],
                variant: "destructive",
              })
              if (publishValidation.publishBlockers.some((blocker) => blocker.toLowerCase().includes("task"))) {
                setCurrentStep(3)
              }
              return
            }
            void handleSubmit({ publish: true })
          },
          disabled: isSubmitting,
          loading: isSubmitting,
        },
      ]}
      sidebar={
        <>
          <CreatorValidationSummary result={currentStep === 4 ? publishValidation : draftValidation} />
          <CreatorPublishChecklist items={publishChecklist} />
        </>
      }
    >
      <CreatorDraftRestoreBanner
        visible={draftStorage.hasStoredDraft}
        label="A locally saved challenge draft was found for this community."
        onRestore={restoreDraft}
        onDismiss={draftStorage.clearDraft}
      />
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
        onSubmit={() => handleSubmit()}
        isPublished={formData.isPublished}
        isSubmitting={isSubmitting}
        hideSubmitAction
      />
    </CreatorCreateShell>
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
  category: "General",
  difficulty: "beginner",
  duration: "7 days",
  sequentialProgression: false,
  unlockMessage: "",
  isPublished: false,
  tags: [] as string[],
  rewards: {
    completionReward: "",
    topPerformerBonus: "",
    streakBonus: "",
  },
  steps: [{
    day: 1,
    title: "",
    description: "",
    deliverable: "Complete the task",
    points: 100,
    resources: [],
    instructions: "",
  }] as Array<{
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
