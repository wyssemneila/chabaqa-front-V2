"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { BasicInfoStep } from "./basic-info-step"
import { DateLocationStep } from "./date-location-step"
import { SpeakersTicketsStep } from "./speakers-tickets-step"
import { ReviewPublishStep } from "./review-publish-step"
import { CreateEventProgress } from "./create-event-progress"
import { CreateEventNavigation } from "./create-event-navigation"
import { eventsApi, normalizeEventResponse, type CreateEventData } from "@/lib/api/events.api"
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
  type EventCreateValues,
  buildEventCreatePayload,
  getCreatorCreateTemplate,
  getEventPublishChecklist,
  getInitialEventValues,
  validateEventDraft,
  validateEventPublish,
} from "@/lib/creator-content"

const toDateOnly = (date?: Date) => {
  if (!date) return ""
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const parseDateOnly = (value?: string) => {
  if (!value) return undefined
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day)
}

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export function EventCreationContainer() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { selectedCommunity, selectedCommunityId, isLoading: communityLoading } = useCreatorCommunity()
  const communityId = useMemo(
    () => String(selectedCommunity?._id || selectedCommunityId || selectedCommunity?.id || ""),
    [selectedCommunity, selectedCommunityId],
  )
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, any>>({})
  const initialValues = useMemo(() => getInitialEventValues({ id: communityId }), [communityId])
  const [startDate, setStartDate] = useState<Date | undefined>(() => parseDateOnly(initialValues.startDate))
  const [endDate, setEndDate] = useState<Date | undefined>(() => parseDateOnly(initialValues.endDate))
  const [formData, setFormData] = useState({
    title: initialValues.title,
    description: initialValues.description,
    category: initialValues.category,
    type: initialValues.type,
    image: initialValues.image || "",
    location: initialValues.location || "",
    onlineUrl: initialValues.onlineUrl || "",
    schedule: {
      startTime: initialValues.startTime,
      endTime: initialValues.endTime,
      timezone: initialValues.timezone,
    },
    tickets: initialValues.tickets.map((ticket, index) => ({ id: `ticket-${index}`, ...ticket })),
    speakers: initialValues.speakers.map((speaker, index) => ({ id: `speaker-${index}`, ...speaker })),
    tags: initialValues.tags,
    isPublished: initialValues.isPublished,
  })

  const steps = [
    { id: 1, title: "Start", description: "Title, description, cover, and format" },
    { id: 2, title: "Schedule", description: "Date, time, link, and location" },
    { id: 3, title: "Tickets", description: "Ticket options and speakers" },
    { id: 4, title: "Review", description: "Publish checks and final review" },
  ]

  const eventCreateValues = useMemo<EventCreateValues>(() => ({
    communityId,
    title: formData.title,
    description: formData.description,
    startDate: toDateOnly(startDate),
    endDate: toDateOnly(endDate) || toDateOnly(startDate),
    startTime: formData.schedule.startTime,
    endTime: formData.schedule.endTime,
    timezone: formData.schedule.timezone,
    location: formData.location,
    onlineUrl: formData.onlineUrl,
    category: formData.category,
    type: formData.type as EventCreateValues["type"],
    image: formData.image,
    tickets: formData.tickets,
    speakers: formData.speakers,
    tags: formData.tags,
    isPublished: formData.isPublished,
  }), [communityId, endDate, formData, startDate])

  const draftValidation = useMemo(() => validateEventDraft(eventCreateValues), [eventCreateValues])
  const publishValidation = useMemo(() => validateEventPublish(eventCreateValues), [eventCreateValues])
  const publishChecklist = useMemo(() => getEventPublishChecklist(eventCreateValues), [eventCreateValues])
  const draftStorage = useCreatorCreateDraftStorage({
    contentType: "event",
    communityId: communityId || selectedCommunity?.slug || "unknown",
    values: eventCreateValues,
    enabled: !isSubmitting,
  })
  const appliedTemplateRef = useRef(false)

  useEffect(() => {
    if (appliedTemplateRef.current) return
    const template = getCreatorCreateTemplate("event", searchParams.get("template"))
    if (!template) return
    appliedTemplateRef.current = true
    setFormData((prev) => ({
      ...prev,
      ...template.data,
      tickets: Array.isArray(template.data.tickets) && template.data.tickets.length
        ? template.data.tickets.map((ticket: any, index: number) => ({ id: ticket.id || makeId("ticket"), ...ticket }))
        : prev.tickets,
      speakers: Array.isArray(template.data.speakers)
        ? template.data.speakers.map((speaker: any, index: number) => ({ id: speaker.id || makeId("speaker"), ...speaker }))
        : prev.speakers,
      schedule: {
        ...prev.schedule,
        ...(template.data.schedule || {}),
      },
      isPublished: Boolean(template.data.isPublished ?? prev.isPublished),
    }))
  }, [searchParams])

  const restoreDraft = () => {
    const values = draftStorage.storedValues
    if (!values) return
    setStartDate(parseDateOnly(values.startDate))
    setEndDate(parseDateOnly(values.endDate || values.startDate))
    setFormData({
      title: values.title || "",
      description: values.description || "",
      category: values.category || "General",
      type: values.type || "Online",
      image: values.image || "",
      location: values.location || "",
      onlineUrl: values.onlineUrl || "",
      schedule: {
        startTime: values.startTime || "09:00",
        endTime: values.endTime || "10:00",
        timezone: values.timezone || "UTC",
      },
      tickets: (values.tickets?.length ? values.tickets : initialValues.tickets).map((ticket, index) => ({
        id: (ticket as any).id || `restored-ticket-${index}`,
        ...ticket,
      })),
      speakers: (values.speakers || []).map((speaker, index) => ({
        id: (speaker as any).id || `restored-speaker-${index}`,
        ...speaker,
      })),
      tags: values.tags || [],
      isPublished: Boolean(values.isPublished),
    })
    draftStorage.clearDraft()
  }

  const handleInputChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".")
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...(prev as any)[parent], [child]: value },
      }))
      return
    }
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addEventSpeaker = () => {
    setFormData((prev) => ({
      ...prev,
      speakers: [...prev.speakers, { id: makeId("speaker"), name: "", title: "", bio: "", photo: "" }],
    }))
  }

  const updateEventSpeaker = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      speakers: prev.speakers.map((speaker, i) => (i === index ? { ...speaker, [field]: value } : speaker)),
    }))
  }

  const removeEventSpeaker = (index: number) => {
    setFormData((prev) => ({ ...prev, speakers: prev.speakers.filter((_, i) => i !== index) }))
  }

  const addEventTicket = () => {
    setFormData((prev) => ({
      ...prev,
      tickets: [...prev.tickets, { id: makeId("ticket"), type: "regular", name: "", price: "", description: "", quantity: "" }],
    }))
  }

  const updateEventTicket = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      tickets: prev.tickets.map((ticket, i) => (i === index ? { ...ticket, [field]: value } : ticket)),
    }))
  }

  const removeEventTicket = (index: number) => {
    setFormData((prev) => ({ ...prev, tickets: prev.tickets.filter((_, i) => i !== index) }))
  }

  const validateCurrentStep = () => {
    const errors: Record<string, any> = {}
    if (currentStep === 1) {
      if (!formData.title.trim() || formData.title.trim().length < 2) errors.title = "Event title must be at least 2 characters."
      if (!formData.description.trim()) errors.description = "Event description is required."
      if (!formData.category.trim()) errors.category = "Category is required."
      if (!formData.type) errors.type = "Event type is required."
    }
    if (currentStep === 2) {
      if (!startDate) errors.startDate = "Choose an event date."
      if (!formData.schedule.startTime) errors.startTime = "Start time is required."
      if (!formData.schedule.endTime) errors.endTime = "End time is required."
      if (formData.schedule.endTime <= formData.schedule.startTime) errors.endTime = "Event end time must be after start time."
    }
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNextStep = () => {
    if (!validateCurrentStep()) return
    setCurrentStep((step) => Math.min(steps.length, step + 1))
  }

  const handleSubmit = async ({ publish }: { publish: boolean }) => {
    const nextValues = { ...eventCreateValues, isPublished: publish || formData.isPublished }
    const validation = publish ? validateEventPublish(nextValues) : validateEventDraft(nextValues)
    if (!validation.ok) {
      setValidationErrors(validation.fieldErrors)
      toast({
        title: publish ? "Publish checks need attention" : "Event details need attention",
        description: validation.publishBlockers[0] || Object.values(validation.fieldErrors)[0],
        variant: "destructive" as any,
      })
      return
    }

    setIsSubmitting(true)
    try {
      const payload = buildEventCreatePayload(nextValues)
      const response = await eventsApi.create(payload as CreateEventData)
      const createdEvent = normalizeEventResponse(response)
      const createdId = createdEvent?.mongoId || createdEvent?._id || createdEvent?.id
      draftStorage.clearDraft()
      toast({
        title: publish ? "Event published" : "Event draft saved",
        description: "Your event has been created successfully.",
      })
      router.push(createdId ? `/creator/events/${createdId}` : "/creator/events")
    } catch (error: any) {
      toast({
        title: "Failed to create event",
        description: error?.message || "Please review the event details and try again.",
        variant: "destructive" as any,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CreatorCreateShell
      title="Create New Event"
      description="Create a live event for your community"
      backHref="/creator/events"
      backLabel="Back to events"
      communityName={selectedCommunity?.name}
      communityMeta={selectedCommunity?.slug}
      autosaveStatus={draftStorage.status}
      lastSavedAt={draftStorage.lastSavedAt}
      publishBlocked={!publishValidation.ok}
      previewAction={{ label: "Preview", onClick: () => setCurrentStep(4), disabled: isSubmitting }}
      mobileMode="limited"
      actions={[
        {
          label: "Save Draft",
          icon: "save",
          variant: "outline",
          onClick: () => handleSubmit({ publish: false }),
          disabled: isSubmitting || communityLoading || !draftValidation.ok,
          loading: isSubmitting,
        },
        {
          label: "Publish",
          icon: "publish",
          onClick: () => handleSubmit({ publish: true }),
          disabled: isSubmitting || communityLoading,
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
        label="A locally saved event draft was found for this community."
        onRestore={restoreDraft}
        onDismiss={draftStorage.clearDraft}
      />
      <CreateEventProgress currentStep={currentStep} setCurrentStep={setCurrentStep} steps={steps} />

      {currentStep === 1 && (
        <BasicInfoStep formData={formData} handleInputChange={handleInputChange} errors={validationErrors} />
      )}

      {currentStep === 2 && (
        <DateLocationStep
          formData={formData}
          handleInputChange={handleInputChange}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          errors={validationErrors}
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
          errors={validationErrors}
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
        handleSubmit={() => handleSubmit({ publish: false })}
        onNextStep={handleNextStep}
        isSubmitting={isSubmitting}
        hideSubmitAction
      />
    </CreatorCreateShell>
  )
}
