"use client"
import { CreateEventHeader } from "./components/create-event-header"
import { CreateEventProgress } from "./components/create-event-progress"
import { BasicInfoStep } from "./components/basic-info-step"
import { DateLocationStep } from "./components/date-location-step"
import { SpeakersTicketsStep } from "./components/speakers-tickets-step"
import { ReviewPublishStep } from "./components/review-publish-step"
import { CreateEventNavigation } from "./components/create-event-navigation"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { eventsApi, type CreateEventData } from "@/lib/api/events.api"
import { subscriptionApi } from "@/lib/api/subscription.api"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { formatErrorForToast } from "@/lib/utils/error-messages"

interface Step {
  id: number
  title: string
  description: string
}

interface EventFormData {
  title: string
  description: string
  image: string
  location: string
  onlineUrl: string
  category: string
  type: string
  isPublished: boolean
  tags: string[]
  schedule: {
    startTime: string
    endTime: string
    timezone: string
  }
  speakers: Array<{
    id: string
    name: string
    title: string
    bio: string
    photo: string
  }>
  tickets: Array<{
    id: string
    type: 'regular' | 'vip' | 'early-bird' | 'student' | 'free'
    name: string
    price: string
    description: string
    quantity: string
  }>
}

export default function CreateEventPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [errors, setErrors] = useState<Record<string, any>>({})
  
  // Use the selected community from context
  const { selectedCommunity, selectedCommunityId } = useCreatorCommunity()
  const communityId = selectedCommunityId || ""

  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    image: "",
    location: "",
    onlineUrl: "",
    category: "",
    type: "",
    isPublished: false,
    tags: [],
    schedule: {
      startTime: "",
      endTime: "",
      timezone: "UTC",
    },
    speakers: [],
    tickets: [],
  })

  const steps: Step[] = [
    { id: 1, title: "Basic Info", description: "Event title, description, and settings" },
    { id: 2, title: "Date & Location", description: "Set dates, location, and event type" },
    { id: 3, title: "Speakers & Tickets", description: "Add speakers and ticket options" },
    { id: 4, title: "Review & Publish", description: "Review and publish your event" },
  ]

  const handleInputChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".")
      setFormData((prev: EventFormData) => ({
        ...prev,
        [parent]: { ...(prev[parent as keyof typeof prev] as Record<string, any>), [child]: value },
      }))
    } else {
      setFormData((prev: EventFormData) => ({ ...prev, [field]: value }))
    }
  }

  const addEventSpeaker = () => {
    const newSpeaker = {
      id: `speaker-${Date.now()}`,
      name: "",
      title: "",
      bio: "",
      photo: "",
    }
    setFormData((prev: EventFormData) => ({
      ...prev,
      speakers: [...prev.speakers, newSpeaker],
    }))
  }

  const updateEventSpeaker = (index: number, field: string, value: any) => {
    setFormData((prev: EventFormData) => ({
      ...prev,
      speakers: prev.speakers.map((speaker: any, i: number) => (i === index ? { ...speaker, [field]: value } : speaker)),
    }))
  }

  const removeEventSpeaker = (index: number) => {
    setFormData((prev: EventFormData) => ({
      ...prev,
      speakers: prev.speakers.filter((_: any, i: number) => i !== index),
    }))
  }

  const addEventTicket = () => {
    const newTicket = {
      id: `ticket-${Date.now()}`,
      type: "regular" as "regular" | "vip" | "early-bird" | "student" | "free",
      name: "",
      price: "",
      description: "",
      quantity: "",
    }
    setFormData((prev: EventFormData) => ({
      ...prev,
      tickets: [...prev.tickets, newTicket],
    }))
  }

  const updateEventTicket = (index: number, field: string, value: any) => {
    setFormData((prev: EventFormData) => ({
      ...prev,
      tickets: prev.tickets.map((ticket: any, i: number) => (i === index ? { ...ticket, [field]: value } : ticket)),
    }))
  }

  const removeEventTicket = (index: number) => {
    setFormData((prev: EventFormData) => ({
      ...prev,
      tickets: prev.tickets.filter((_: any, i: number) => i !== index),
    }))
    // Clear errors for removed ticket
    setErrors((prev) => {
      const newErrors = { ...prev }
      const ticketErrors = (newErrors.tickets as Record<number, Record<string, string>>) || {}
      delete ticketErrors[index]
      // Reindex remaining tickets
      const reindexed: Record<number, Record<string, string>> = {}
      Object.keys(ticketErrors).forEach((key) => {
        const idx = parseInt(key)
        if (idx > index) {
          reindexed[idx - 1] = ticketErrors[idx]
        } else if (idx < index) {
          reindexed[idx] = ticketErrors[idx]
        }
      })
      newErrors.tickets = reindexed
      return newErrors
    })
  }

  // Validation functions
  const validateBasicInfo = (): Record<string, string> => {
    const stepErrors: Record<string, string> = {}
    
    if (!formData.title || formData.title.trim().length === 0) {
      stepErrors.title = 'Event title is required'
    } else if (formData.title.length > 200) {
      stepErrors.title = 'Event title must be 200 characters or less'
    }
    
    if (!formData.description || formData.description.trim().length === 0) {
      stepErrors.description = 'Event description is required'
    } else if (formData.description.length > 2000) {
      stepErrors.description = 'Event description must be 2000 characters or less'
    }
    
    if (!formData.category || formData.category.trim().length === 0) {
      stepErrors.category = 'Category is required'
    }
    
    if (!formData.type || formData.type.trim().length === 0) {
      stepErrors.type = 'Event type is required'
    }
    
    if (formData.image && formData.image.trim().length > 0) {
      try {
        new URL(formData.image)
      } catch {
        stepErrors.image = 'Image URL must be a valid URL'
      }
    }
    
    return stepErrors
  }

  const validateDateLocation = (): Record<string, string> => {
    const stepErrors: Record<string, string> = {}
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    
    if (!startDate) {
      stepErrors.startDate = 'Start date is required'
    } else {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      if (start.getTime() < now.getTime()) {
        stepErrors.startDate = 'Start date must be in the future'
      }
    }
    
    if (!endDate) {
      stepErrors.endDate = 'End date is required'
    } else if (startDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      start.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)
      if (end.getTime() < start.getTime()) {
        stepErrors.endDate = 'End date must be the same or after start date'
      }
    }
    
    if (!formData.schedule.startTime || formData.schedule.startTime.trim().length === 0) {
      stepErrors.startTime = 'Start time is required'
    }
    
    if (!formData.schedule.endTime || formData.schedule.endTime.trim().length === 0) {
      stepErrors.endTime = 'End time is required'
    } else if (formData.schedule.startTime && formData.schedule.endTime) {
      const [startHours, startMinutes] = formData.schedule.startTime.split(':').map(Number)
      const [endHours, endMinutes] = formData.schedule.endTime.split(':').map(Number)
      const startMinutesTotal = startHours * 60 + startMinutes
      const endMinutesTotal = endHours * 60 + endMinutes
      if (endMinutesTotal <= startMinutesTotal) {
        stepErrors.endTime = 'End time must be after start time'
      }
    }
    
    if (formData.type !== 'Online' && (!formData.location || formData.location.trim().length === 0)) {
      stepErrors.location = 'Location is required for In-person and Hybrid events'
    }
    
    if (formData.type !== 'In-person' && (!formData.onlineUrl || formData.onlineUrl.trim().length === 0)) {
      stepErrors.onlineUrl = 'Online URL is required for Online and Hybrid events'
    } else if (formData.onlineUrl && formData.onlineUrl.trim().length > 0) {
      try {
        new URL(formData.onlineUrl)
      } catch {
        stepErrors.onlineUrl = 'Online URL must be a valid URL'
      }
    }
    
    return stepErrors
  }

  const validateSpeakersTickets = (): Record<string, any> => {
    const stepErrors: Record<string, any> = {}
    
    if (!formData.tickets || formData.tickets.length === 0) {
      stepErrors.tickets = 'At least one ticket is required'
    } else {
      const ticketErrors: Record<number, Record<string, string>> = {}
      formData.tickets.forEach((ticket: any, index: number) => {
        const ticketErr: Record<string, string> = {}
        
        if (!ticket.name || ticket.name.trim().length === 0) {
          ticketErr.name = 'Ticket name is required'
        } else if (ticket.name.trim().length > 100) {
          ticketErr.name = 'Ticket name must be 100 characters or less'
        }
        
        const price = Number(ticket.price)
        if (isNaN(price) || price < 0) {
          ticketErr.price = 'Price must be a non-negative number'
        }

        if (ticket.description && ticket.description.trim().length > 500) {
          ticketErr.description = 'Description must be 500 characters or less'
        }
        
        if (ticket.quantity && ticket.quantity.trim().length > 0) {
          const quantity = Number(ticket.quantity)
          if (isNaN(quantity) || quantity < 0 || !Number.isInteger(quantity)) {
            ticketErr.quantity = 'Quantity must be a non-negative integer'
          }
        }
        
        if (Object.keys(ticketErr).length > 0) {
          ticketErrors[index] = ticketErr
        }
      })
      if (Object.keys(ticketErrors).length > 0) {
        stepErrors.tickets = ticketErrors
      }
    }
    
    // Validate speakers if any are added
    if (formData.speakers && formData.speakers.length > 0) {
      const speakerErrors: Record<number, Record<string, string>> = {}
      formData.speakers.forEach((speaker: any, index: number) => {
        const speakerErr: Record<string, string> = {}
        
        if (!speaker.name || speaker.name.trim().length === 0) {
          speakerErr.name = 'Speaker name is required'
        }
        
        if (!speaker.title || speaker.title.trim().length === 0) {
          speakerErr.title = 'Speaker title is required'
        }
        
        if (!speaker.bio || speaker.bio.trim().length === 0) {
          speakerErr.bio = 'Speaker bio is required'
        }
        
        if (Object.keys(speakerErr).length > 0) {
          speakerErrors[index] = speakerErr
        }
      })
      if (Object.keys(speakerErrors).length > 0) {
        stepErrors.speakers = speakerErrors
      }
    }
    
    return stepErrors
  }

  const validateStep = (step: number): boolean => {
    let stepErrors: Record<string, any> = {}
    
    if (step === 1) {
      stepErrors = validateBasicInfo()
    } else if (step === 2) {
      stepErrors = validateDateLocation()
    } else if (step === 3) {
      stepErrors = validateSpeakersTickets()
    }
    
    setErrors(stepErrors)
    
    if (Object.keys(stepErrors).length > 0) {
      const firstError = Object.values(stepErrors)[0]
      const errorMessage = typeof firstError === 'string' ? firstError : 'Please fix the errors before proceeding'
      toast({
        title: 'Validation Error',
        description: errorMessage,
        variant: 'destructive' as any
      })
      return false
    }
    
    setErrors({})
    return true
  }

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(steps.length, currentStep + 1))
    }
  }

  const handleSubmit = async () => {
    // Validate all steps before submission
    const basicErrors = validateBasicInfo()
    const dateErrors = validateDateLocation()
    const speakersTicketsErrors = validateSpeakersTickets()
    
    const allErrors = { ...basicErrors, ...dateErrors, ...speakersTicketsErrors }
    
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      const firstError = Object.values(allErrors)[0]
      const errorMessage = typeof firstError === 'string' ? firstError : 'Please fix all errors before submitting'
      toast({
        title: 'Validation Error',
        description: errorMessage,
        variant: 'destructive' as any
      })
      return
    }
    
    try {
      if (!startDate || !endDate) {
        toast({ title: 'Missing dates', description: 'Please select start and end dates.', variant: 'destructive' as any })
        return
      }
      if (!communityId) {
        toast({ title: 'Missing community', description: 'No community found for this creator.', variant: 'destructive' as any })
        return
      }
      
      if (!formData.tickets || formData.tickets.length === 0) {
        toast({ title: 'Missing tickets', description: 'At least one ticket is required.', variant: 'destructive' as any })
        return
      }
      // Map UI form to CreateEventDto / CreateEventData
      const eventType = formData.type as 'In-person' | 'Online' | 'Hybrid'
      const wantsPublishNow = Boolean(formData.isPublished)
      const hasActiveSubscription = wantsPublishNow
        ? await subscriptionApi.hasActiveSubscription()
        : false
      const shouldPublishNow = wantsPublishNow && hasActiveSubscription
      
      const payload: CreateEventData = {
        communityId,
        title: formData.title,
        description: formData.description,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate ? endDate.toISOString().split('T')[0] : undefined,
        startTime: formData.schedule.startTime || '09:00',
        endTime: formData.schedule.endTime || '18:00',
        timezone: formData.schedule.timezone || 'UTC',
        // Include location for In-person and Hybrid events
        location: (eventType === 'In-person' || eventType === 'Hybrid') 
          ? (formData.location?.trim() || '')
          : '',
        // Include onlineUrl for Online and Hybrid events
        onlineUrl: (eventType === 'Online' || eventType === 'Hybrid')
          ? (formData.onlineUrl?.trim() || undefined)
          : undefined,
        category: formData.category,
        type: eventType,
        notes: undefined,
        image: formData.image?.trim() || undefined,
        tags: formData.tags || [],
        isActive: shouldPublishNow,
        isPublished: shouldPublishNow,
        speakers: (formData.speakers || []).map((s: any) => ({
          name: s.name,
          title: s.title,
          bio: s.bio,
          photo: s.photo || undefined,
        })),
        tickets: (formData.tickets || []).map((t: any) => {
          const normalizedName = String(t.name || "").trim()
          const normalizedDescription = String(t.description || "").trim()
          const rawQuantity = typeof t.quantity === "string" ? t.quantity.trim() : t.quantity
          const parsedQuantity =
            rawQuantity === "" || rawQuantity === undefined || rawQuantity === null
              ? undefined
              : Number(rawQuantity)

          return {
            type: t.type,
            name: normalizedName,
            price: Number(t.price || 0),
            description: normalizedDescription || `${normalizedName || "Event"} ticket`,
            quantity: Number.isFinite(parsedQuantity) ? parsedQuantity : undefined,
          }
        }),
        sessions: [],
      }

      const res = await eventsApi.create(payload)
      const created = (res as any)?.data || res
      if (shouldPublishNow) {
        toast({
          title: 'Event created and published',
          description: `${payload.title} is now live for your community.`,
        })
      } else if (wantsPublishNow && !hasActiveSubscription) {
        toast({
          title: 'Event created as draft',
          description: `${payload.title} was saved as draft. Active subscription required to publish.`,
        })
      } else {
        toast({
          title: 'Event created as draft',
          description: `${payload.title} - publish it from the event page when ready.`,
        })
      }
      const id = created?.id || created?._id || created?.event?.id || created?.event?._id
      if (id) router.push(`/creator/events`)
      else router.push('/creator/events')
    } catch (e: any) {
      const errorToast = formatErrorForToast(e)
      toast({ 
        title: errorToast.title, 
        description: errorToast.description || 'Please review required fields.', 
        variant: 'destructive' as any 
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-5">
      <CreateEventHeader />
      <CreateEventProgress 
        steps={steps} 
        currentStep={currentStep} 
        setCurrentStep={setCurrentStep} 
      />
      
      {/* Step Content */}
      {currentStep === 1 && (
        <BasicInfoStep 
          formData={formData} 
          handleInputChange={handleInputChange}
          errors={errors}
        />
      )}
      {currentStep === 2 && (
        <DateLocationStep 
          formData={formData} 
          handleInputChange={handleInputChange}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          errors={errors}
        />
      )}
      {currentStep === 3 && (
        <SpeakersTicketsStep 
          formData={formData} 
          addEventSpeaker={addEventSpeaker}
          updateEventSpeaker={updateEventSpeaker}
          removeEventSpeaker={removeEventSpeaker}
          addEventTicket={addEventTicket}
          updateEventTicket={updateEventTicket}
          removeEventTicket={removeEventTicket}
          errors={errors}
        />
      )}
      {currentStep === 4 && (
        <ReviewPublishStep 
          formData={formData} 
          handleInputChange={handleInputChange}
          startDate={startDate}
          endDate={endDate}
        />
      )}

      <CreateEventNavigation 
        currentStep={currentStep} 
        steps={steps}
        setCurrentStep={setCurrentStep}
        handleSubmit={handleSubmit}
        onNextStep={handleNextStep}
      />
    </div>
  )
}
