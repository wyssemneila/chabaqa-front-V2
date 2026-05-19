"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SessionProgress } from "./session-progress"
import { BasicInfoStep } from "./basic-info-step"
import { PricingDurationStep } from "./pricing-duration-step"
import { SessionDetailsStep } from "./session-details-step"
import { AvailabilityStep } from "./availability-step"
import { ReviewPublishStep } from "./review-publish-step"
import { NavigationButtons } from "./navigation-buttons"
import { sessionsApi, type CreateSessionData } from "@/lib/api/sessions.api"
import { useToast } from "@/hooks/use-toast"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import {
  CreatorCreateShell,
  CreatorDraftRestoreBanner,
  CreatorPublishChecklist,
  CreatorValidationSummary,
  useCreatorCreateDraftStorage,
} from "@/components/creator-dashboard/create-flow"
import {
  type SessionCreateValues,
  getCreatorCreateTemplate,
  getSessionPublishChecklist,
  validateSessionDraft,
  validateSessionPublish,
} from "@/lib/creator-content"

export function SessionCreationContainer() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  // Use the selected community from context
  const { selectedCommunity } = useCreatorCommunity()
  const communitySlug = selectedCommunity?.slug || ""

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnail: "",
    duration: "60",
    price: "0",
    currency: "TND",
    maxBookingsPerWeek: "",
    requirements: "",
    whatYoullGet: [""],
    availableDays: [] as string[],
    availableHours: {
      start: "",
      end: "",
    },
    preparationMaterials: "",
    sessionFormat: "",
    // Availability settings
    recurringAvailability: [] as { dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }[],
    autoGenerateSlots: true,
    advanceBookingDays: 30,
    isPublished: false,
  })

  const steps = [
    { id: 1, title: "Start", description: "Title, description, duration, and price" },
    { id: 2, title: "Details", description: "Format, outcomes, and preparation" },
    { id: 3, title: "Availability", description: "Choose a booking preset" },
    { id: 4, title: "Publish checks", description: "Review blockers before going live" },
  ]

  const sessionCreateValues = useMemo<SessionCreateValues>(() => ({
    title: formData.title,
    description: formData.description,
    thumbnail: formData.thumbnail,
    duration: formData.duration || "60",
    price: formData.price || "0",
    currency: (formData.currency || "TND") as SessionCreateValues["currency"],
    communitySlug,
    maxBookingsPerWeek: formData.maxBookingsPerWeek,
    notes: formData.requirements || formData.preparationMaterials || undefined,
    isActive: formData.isPublished,
    resources: [],
    recurringAvailability: formData.recurringAvailability,
  }), [communitySlug, formData])

  const draftValidation = useMemo(() => validateSessionDraft(sessionCreateValues), [sessionCreateValues])
  const publishValidation = useMemo(() => validateSessionPublish(sessionCreateValues), [sessionCreateValues])
  const publishChecklist = useMemo(() => getSessionPublishChecklist(sessionCreateValues), [sessionCreateValues])
  const draftStorage = useCreatorCreateDraftStorage({
    contentType: "session",
    communityId: communitySlug || selectedCommunity?.id || "unknown",
    values: formData,
    enabled: !isSubmitting,
  })
  const appliedTemplateRef = useRef(false)

  useEffect(() => {
    if (appliedTemplateRef.current) return
    const template = getCreatorCreateTemplate("session", searchParams.get("template"))
    if (!template) return
    appliedTemplateRef.current = true
    setFormData((prev) => ({
      ...prev,
      ...template.data,
      duration: template.data.duration || prev.duration,
      price: template.data.price || prev.price,
      currency: template.data.currency || prev.currency,
      whatYoullGet: Array.isArray(template.data.whatYoullGet) ? template.data.whatYoullGet : prev.whatYoullGet,
    }))
  }, [searchParams])

  const handleInputChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".")
      setFormData((prev) => ({
        ...prev,
        [parent]: typeof prev[parent as keyof typeof prev] === 'object' ? { ...prev[parent as keyof typeof prev] as object, [child]: value } : { [child]: value },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleArrayChange = (field: string, index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Array.isArray(prev[field as keyof typeof prev]) 
        ? (prev[field as keyof typeof prev] as string[]).map((item: string, i: number) => 
            i === index ? value : item
          )
        : prev[field as keyof typeof prev],
    }))
  }

  const addArrayItem = (field: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Array.isArray(prev[field as keyof typeof prev]) ? [...(prev[field as keyof typeof prev] as string[]), ""] : [prev[field as keyof typeof prev], ""],
    }))
  }

  const removeArrayItem = (field: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Array.isArray(prev[field as keyof typeof prev]) 
        ? (prev[field as keyof typeof prev] as string[]).filter((_: any, i: number) => i !== index)
        : prev[field as keyof typeof prev],
    }))
  }

  const handleDayToggle = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }))
  }

  const validateCurrentStep = () => {
    const errors: Record<string, string> = {}
    
    // Step 1: Start validation
    if (currentStep === 1) {
      if (!formData.title || formData.title.trim().length < 2) {
        errors.title = 'Session title must be at least 2 characters.'
      }
      if (!formData.description || formData.description.trim().length < 10) {
        errors.description = 'Session description must be at least 10 characters.'
      }
      const duration = Number(formData.duration || 0)
      if (!duration || duration < 15 || duration > 480) {
        errors.duration = 'Session duration must be between 15 and 480 minutes.'
      }
      const price = Number(formData.price || 0)
      if (!Number.isFinite(price) || price < 0) {
        errors.price = 'Session price must be zero or greater.'
      }
      if (!formData.currency) {
        errors.currency = 'Session currency is required.'
      }
      if (formData.maxBookingsPerWeek) {
        const maxBookings = Number(formData.maxBookingsPerWeek)
        if (!Number.isFinite(maxBookings) || maxBookings < 1 || maxBookings > 50) {
          errors.maxBookingsPerWeek = 'Max bookings per week must be between 1 and 50.'
        }
      }
    }
    // Details and availability can be completed later for drafts.
    
    setValidationErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      toast({ 
        title: 'Please complete required fields', 
        description: Object.values(errors)[0], 
        variant: 'destructive' as any 
      })
      return false
    }
    
    return true
  }

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(Math.min(steps.length, currentStep + 1))
      setValidationErrors({}) // Clear errors when moving to next step
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    const trimmedTitle = formData.title.trim()
    if (trimmedTitle.length < 2) {
      errors.title = 'Session title must be at least 2 characters.'
    }
    if (!formData.description.trim()) {
      errors.description = 'Session description is required.'
    }
    const duration = Number(formData.duration || 0)
    if (!Number.isFinite(duration) || duration < 15 || duration > 480) {
      errors.duration = 'Session duration must be between 15 and 480 minutes.'
    }

    const price = Number(formData.price || 0)
    if (!Number.isFinite(price) || price < 0) {
      errors.price = 'Session price must be zero or greater.'
    }
    if (!formData.currency) {
      errors.currency = 'Session currency is required.'
    }
    if (formData.maxBookingsPerWeek) {
      const maxBookings = Number(formData.maxBookingsPerWeek)
      if (!Number.isFinite(maxBookings) || maxBookings < 1 || maxBookings > 50) {
        errors.maxBookingsPerWeek = 'Max bookings per week must be between 1 and 50.'
      }
    }

    if (formData.recurringAvailability?.length) {
      const invalidSlot = formData.recurringAvailability.find((slot) => !slot.startTime || !slot.endTime)
      if (invalidSlot) {
        errors.availability = 'Each availability slot needs a start and end time.'
      }
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0 ? null : Object.values(errors)[0]
  }

  const restoreDraft = () => {
    const stored = draftStorage.storedValues as Partial<typeof formData> | null
    if (!stored) return
    setFormData((prev) => ({
      ...prev,
      ...stored,
      duration: stored.duration || "60",
      price: stored.price || "0",
      currency: stored.currency || "TND",
      recurringAvailability: Array.isArray(stored.recurringAvailability) ? stored.recurringAvailability : [],
    } as typeof formData))
    draftStorage.clearDraft()
  }

  const handleSubmit = async (options?: { publish?: boolean }) => {
    if (isSubmitting) return
    const publishRequested = Boolean(options?.publish ?? formData.isPublished)
    const modelValidation = publishRequested ? publishValidation : draftValidation

    if (!modelValidation.ok) {
      setValidationErrors(modelValidation.fieldErrors)
      toast({
        title: publishRequested ? "Publish checks need attention" : "Draft needs a few fields",
        description:
          modelValidation.publishBlockers[0] ||
          Object.values(modelValidation.fieldErrors)[0] ||
          "Please review the highlighted fields.",
        variant: "destructive" as any,
      })
      return
    }

    try {
      setIsSubmitting(true)
      if (!communitySlug) {
        toast({ title: 'Missing community', description: 'No community found for this creator.', variant: 'destructive' as any })
        return
      }

      const validationError = validateForm()
      if (validationError) {
        toast({ title: 'Please review required fields', description: validationError, variant: 'destructive' as any })
        return
      }
      // Map UI form to CreateSessionDto
      const payload: CreateSessionData = {
        title: formData.title,
        description: formData.description,
        thumbnail: formData.thumbnail?.trim() || undefined,
        duration: Number(formData.duration || 60),
        price: Number(formData.price || 0),
        currency: (formData.currency || 'TND') as CreateSessionData['currency'],
        communitySlug,
        category: undefined,
        maxBookingsPerWeek: formData.maxBookingsPerWeek ? Number(formData.maxBookingsPerWeek) : undefined,
        notes: formData.requirements || formData.preparationMaterials || undefined,
        isActive: publishRequested && publishValidation.ok,
        resources: [],
      }

      const res = await sessionsApi.create(payload)
      const created = (res as any)?.data || res
      const sessionId = created?.id || created?._id || created?.session?.id || created?.session?._id

      // Save availability settings if configured
      if (sessionId && formData.recurringAvailability && formData.recurringAvailability.length > 0) {
        try {
          await sessionsApi.setAvailableHours(sessionId, {
            recurringAvailability: formData.recurringAvailability.map(slot => ({
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
              slotDuration: Number(formData.duration) || 60,
              isActive: slot.isActive,
            })),
            autoGenerateSlots: formData.autoGenerateSlots,
            advanceBookingDays: formData.advanceBookingDays,
          })

          // Auto-generate slots if enabled
          if (formData.autoGenerateSlots) {
            const startDate = new Date()
            const endDate = new Date()
            endDate.setDate(endDate.getDate() + (formData.advanceBookingDays || 30))
            
            await sessionsApi.generateSlots(sessionId, {
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            })
          }
        } catch (availabilityError) {
          console.error('Failed to save availability:', availabilityError)
          // Don't fail the whole creation, just warn
          toast({ 
            title: 'Session created', 
            description: 'Session created but availability settings could not be saved. You can configure them from the edit page.',
          })
        }
      }

      draftStorage.clearDraft()
      toast({
        title: publishRequested ? 'Session created' : 'Session created as draft',
        description: publishRequested
          ? `${payload.title} is ready with booking settings.`
          : `${payload.title} - add availability and publish when ready.`,
      })
      router.push('/creator/sessions')
    } catch (e: any) {
      toast({ title: 'Failed to create session', description: e?.message || 'Please review required fields.', variant: 'destructive' as any })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CreatorCreateShell
      title="Create New Session"
      description="Create a bookable 1:1 offer for your community"
      backHref="/creator/sessions"
      backLabel="Back to sessions"
      communityName={selectedCommunity?.name}
      communityMeta={selectedCommunity?.slug}
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
                variant: "destructive" as any,
              })
              if (publishValidation.publishBlockers.some((blocker) => blocker.toLowerCase().includes("availability"))) {
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
        label="A locally saved session draft was found for this community."
        onRestore={restoreDraft}
        onDismiss={draftStorage.clearDraft}
      />
      <SessionProgress currentStep={currentStep} setCurrentStep={setCurrentStep} steps={steps} />
      
      {currentStep === 1 && (
        <div className="space-y-6">
          <BasicInfoStep formData={formData} handleInputChange={handleInputChange} validationErrors={validationErrors} />
          <PricingDurationStep
            formData={formData}
            handleInputChange={handleInputChange}
            handleDayToggle={handleDayToggle}
            validationErrors={validationErrors}
          />
        </div>
      )}

      {currentStep === 2 && (
        <SessionDetailsStep
          formData={formData}
          handleInputChange={handleInputChange}
          handleArrayChange={handleArrayChange}
          addArrayItem={addArrayItem}
          removeArrayItem={removeArrayItem}
        />
      )}

      {currentStep === 3 && (
        <AvailabilityStep
          formData={formData}
          handleInputChange={handleInputChange}
        />
      )}

      {currentStep === 4 && (
        <ReviewPublishStep
          formData={formData}
          handleInputChange={handleInputChange}
        />
      )}

      <NavigationButtons
        currentStep={currentStep}
        stepsLength={steps.length}
        setCurrentStep={setCurrentStep}
        handleSubmit={() => handleSubmit({ publish: false })}
        onNextStep={handleNextStep}
        isSubmitting={isSubmitting}
        hideSubmitAction
      />
    </CreatorCreateShell>
  )
}
