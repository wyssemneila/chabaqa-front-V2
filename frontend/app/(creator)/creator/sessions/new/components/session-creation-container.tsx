"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SessionHeader } from "./session-header"
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

export function SessionCreationContainer() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  // Use the selected community from context
  const { selectedCommunity } = useCreatorCommunity()
  const communitySlug = selectedCommunity?.slug || ""

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnail: "",
    duration: "",
    price: "",
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
    { id: 1, title: "Basic Info", description: "Session title, description, and category" },
    { id: 2, title: "Pricing & Duration", description: "Set price, duration, and availability" },
    { id: 3, title: "Session Details", description: "Format, requirements, and what participants get" },
    { id: 4, title: "Availability", description: "Set your weekly availability for bookings" },
    { id: 5, title: "Review & Publish", description: "Review and publish your session" },
  ]

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
    
    // Step 1: Basic Info validation
    if (currentStep === 1) {
      if (!formData.title || formData.title.trim().length < 2) {
        errors.title = 'Session title must be at least 2 characters.'
      }
      if (!formData.description || formData.description.trim().length < 10) {
        errors.description = 'Session description must be at least 10 characters.'
      }
    }
    
    // Step 2: Pricing & Duration validation
    if (currentStep === 2) {
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
    
    // Step 3 and 4: No validation required (Session Details and Weekly Availability are optional)
    
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

  const handleSubmit = async () => {
    try {
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
        duration: Number(formData.duration || 0),
        price: Number(formData.price || 0),
        currency: (formData.currency || 'TND') as CreateSessionData['currency'],
        communitySlug,
        category: undefined,
        maxBookingsPerWeek: formData.maxBookingsPerWeek ? Number(formData.maxBookingsPerWeek) : undefined,
        notes: formData.requirements || formData.preparationMaterials || undefined,
        // Use isPublished to determine if session should be active
        isActive: formData.isPublished || false,
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

      toast({ title: 'Session created as draft', description: `${payload.title} - Publish it from the sessions page once you have an active subscription.` })
      router.push('/creator/sessions')
    } catch (e: any) {
      toast({ title: 'Failed to create session', description: e?.message || 'Please review required fields.', variant: 'destructive' as any })
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-5">
      <SessionHeader />
      <SessionProgress currentStep={currentStep} setCurrentStep={setCurrentStep} steps={steps} />
      
      {currentStep === 1 && (
        <BasicInfoStep formData={formData} handleInputChange={handleInputChange} validationErrors={validationErrors} />
      )}

      {currentStep === 2 && (
        <PricingDurationStep
          formData={formData}
          handleInputChange={handleInputChange}
          handleDayToggle={handleDayToggle}
          validationErrors={validationErrors}
        />
      )}

      {currentStep === 3 && (
        <SessionDetailsStep
          formData={formData}
          handleInputChange={handleInputChange}
          handleArrayChange={handleArrayChange}
          addArrayItem={addArrayItem}
          removeArrayItem={removeArrayItem}
        />
      )}

      {currentStep === 4 && (
        <AvailabilityStep
          formData={formData}
          handleInputChange={handleInputChange}
        />
      )}

      {currentStep === 5 && (
        <ReviewPublishStep
          formData={formData}
          handleInputChange={handleInputChange}
        />
      )}

      <NavigationButtons
        currentStep={currentStep}
        stepsLength={steps.length}
        setCurrentStep={setCurrentStep}
        handleSubmit={handleSubmit}
        onNextStep={handleNextStep}
      />
    </div>
  )
}
