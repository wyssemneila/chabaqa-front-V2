"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { Event } from "@/lib/models"
import EventHeader from "./EventHeader"
import EventTabs from "./EventTabs"
import { eventsApi } from "@/lib/api/events.api"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

type ServerVersionToken = string

interface ManageEventClientProps {
  initialEvent: Event
  serverVersion: ServerVersionToken
}

interface NormalizedEventForCompare {
  id: string
  title: string
  description: string
  image?: string
  startDate?: string
  endDate?: string
  startTime: string
  endTime: string
  timezone: string
  location?: string
  onlineUrl?: string
  category: string
  type: string
  isActive: boolean
  isPublished: boolean
  notes?: string
  tags: string[]
  tickets: Array<{
    id: string
    type: string
    name: string
    price: number
    description: string
    quantity?: number
    sold: number
  }>
  sessions: Array<{
    id: string
    title: string
    description: string
    startTime: string
    endTime: string
    speaker: string
    notes?: string
    isActive: boolean
    attendance: number
  }>
  speakers: Array<{
    id: string
    name: string
    title: string
    bio: string
    photo?: string
  }>
}

const isValidUrl = (value?: string) => {
  if (!value) return false
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

const isValidOptionalUrl = (value?: string) => {
  if (!value) return true
  return isValidUrl(value)
}

const isValidTimeRange = (start: string, end: string) => Boolean(start && end && start < end)

const normalizeText = (value?: string) => {
  const v = (value || "").trim()
  return v.length > 0 ? v : undefined
}

const normalizeRequiredText = (value?: string) => (value || "").trim()

const toIsoString = (value?: Date | string) => {
  if (!value) return undefined
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}

const toDateOnlyString = (value?: Date | string) => {
  if (!value) return undefined
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return undefined

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const toDate = (value?: string | Date, fallback?: Date) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value === "string") {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  return fallback || new Date()
}

const mapApiEventToDraft = (apiEvent: any, fallback?: Event): Event => {
  const source = apiEvent || {}
  const fallbackAny = (fallback || {}) as any

  return {
    ...(fallback || {}),
    id: source.id || fallbackAny.id || "",
    title: source.title ?? fallbackAny.title ?? "",
    description: source.description ?? fallbackAny.description ?? "",
    image: source.image ?? source.thumbnail ?? fallbackAny.image ?? "",
    startDate: toDate(source.startDate, fallbackAny.startDate),
    endDate: source.endDate ? toDate(source.endDate) : undefined,
    startTime: source.startTime ?? fallbackAny.startTime ?? "",
    endTime: source.endTime ?? fallbackAny.endTime ?? "",
    timezone: source.timezone ?? fallbackAny.timezone ?? "UTC",
    location: source.location ?? fallbackAny.location ?? "",
    onlineUrl: source.onlineUrl ?? fallbackAny.onlineUrl ?? "",
    category: source.category ?? fallbackAny.category ?? "",
    type: source.type ?? fallbackAny.type ?? "Online",
    isActive: Boolean(source.isActive ?? fallbackAny.isActive),
    attendees: Array.isArray(source.attendees) ? source.attendees : Array.isArray(fallbackAny.attendees) ? fallbackAny.attendees : [],
    tickets: (Array.isArray(source.tickets) ? source.tickets : Array.isArray(fallbackAny.tickets) ? fallbackAny.tickets : []).map((t: any) => ({
      id: t.id,
      type: t.type || "regular",
      name: t.name || "",
      price: Number(t.price ?? 0),
      description: t.description || "",
      quantity: typeof t.quantity === "number" ? t.quantity : undefined,
      sold: Number(t.sold ?? 0),
    })),
    sessions: (Array.isArray(source.sessions) ? source.sessions : Array.isArray(fallbackAny.sessions) ? fallbackAny.sessions : []).map((s: any) => ({
      id: s.id,
      title: s.title || "",
      description: s.description || "",
      startTime: s.startTime || "",
      endTime: s.endTime || "",
      speaker: s.speaker || "",
      notes: s.notes || "",
      isActive: s.isActive !== false,
      attendance: Number(s.attendance ?? 0),
    })),
    speakers: (Array.isArray(source.speakers) ? source.speakers : Array.isArray(fallbackAny.speakers) ? fallbackAny.speakers : []).map((s: any) => ({
      id: s.id,
      name: s.name || "",
      title: s.title || "",
      bio: s.bio || "",
      photo: s.photo || "",
    })),
    price: Number(source.price ?? fallbackAny.price ?? 0),
    notes: source.notes ?? fallbackAny.notes ?? "",
    ...(source.tags || fallbackAny.tags ? { tags: Array.isArray(source.tags) ? source.tags : Array.isArray(fallbackAny.tags) ? fallbackAny.tags : [] } : {}),
    ...(source.isPublished !== undefined || fallbackAny.isPublished !== undefined
      ? { isPublished: Boolean(source.isPublished ?? fallbackAny.isPublished) }
      : {}),
  } as any as Event
}

const normalizeEventForCompare = (event: Event): NormalizedEventForCompare => {
  const eventAny = event as any

  return {
    id: event.id,
    title: normalizeRequiredText(event.title),
    description: normalizeRequiredText(event.description),
    image: normalizeText(event.image),
    startDate: toIsoString(event.startDate),
    endDate: toIsoString(event.endDate),
    startTime: event.startTime || "",
    endTime: event.endTime || "",
    timezone: event.timezone || "UTC",
    location: normalizeText(event.location),
    onlineUrl: normalizeText(event.onlineUrl),
    category: event.category || "",
    type: event.type || "Online",
    isActive: Boolean(event.isActive),
    isPublished: Boolean(eventAny.isPublished),
    notes: normalizeText(eventAny.notes),
    tags: Array.isArray(eventAny.tags) ? eventAny.tags.map((tag: string) => tag.trim()).filter(Boolean) : [],
    sessions: (event.sessions || []).map((session) => ({
      id: session.id,
      title: normalizeRequiredText(session.title),
      description: normalizeRequiredText(session.description),
      startTime: session.startTime || "",
      endTime: session.endTime || "",
      speaker: normalizeRequiredText(session.speaker),
      notes: normalizeText(session.notes),
      isActive: session.isActive !== false,
      attendance: Number(session.attendance ?? 0),
    })),
    tickets: (event.tickets || []).map((ticket) => ({
      id: ticket.id,
      type: ticket.type || "regular",
      name: normalizeRequiredText(ticket.name),
      price: Number(ticket.price ?? 0),
      description: normalizeRequiredText(ticket.description),
      quantity: typeof ticket.quantity === "number" ? ticket.quantity : undefined,
      sold: Number(ticket.sold ?? 0),
    })),
    speakers: (event.speakers || []).map((speaker) => ({
      id: speaker.id,
      name: normalizeRequiredText(speaker.name),
      title: normalizeRequiredText(speaker.title),
      bio: normalizeRequiredText(speaker.bio),
      photo: normalizeText(speaker.photo),
    })),
  }
}

const serializeNormalizedEvent = (event: Event) => JSON.stringify(normalizeEventForCompare(event))

const buildUpdatePayload = (event: Event) => {
  const normalized = normalizeEventForCompare(event)
  return {
    title: normalized.title,
    description: normalized.description,
    startDate: toDateOnlyString(event.startDate),
    endDate: toDateOnlyString(event.endDate),
    startTime: normalized.startTime,
    endTime: normalized.endTime,
    timezone: normalized.timezone,
    location: normalized.location,
    onlineUrl: normalized.onlineUrl,
    category: normalized.category,
    type: normalized.type,
    isActive: normalized.isActive,
    isPublished: normalized.isPublished,
    notes: normalized.notes,
    image: normalized.image,
    tags: normalized.tags,
    sessions: normalized.sessions,
    tickets: normalized.tickets,
    speakers: normalized.speakers,
  }
}

const formatApiError = (error: any) => {
  const errorPayload = error?.response?.data || error
  const details = errorPayload?.details

  if (Array.isArray(details) && details.length > 0) {
    const first = details[0]
    const messages = Array.isArray(first?.messages) ? first.messages.join(", ") : ""
    if (messages) return `${first?.field || "Field"}: ${messages}`
  }

  if (Array.isArray(errorPayload?.message)) return errorPayload.message.join(", ")
  if (typeof errorPayload?.message === "string") return errorPayload.message
  return "Failed to save changes"
}

const validateEventBeforeSave = (event: Event): string | null => {
  const eventAny = event as any

  if (!normalizeRequiredText(event.title)) return "Event title is required"
  if (!normalizeRequiredText(event.description)) return "Event description is required"
  if (!toIsoString(event.startDate)) return "Start date is invalid"
  if (event.endDate && !toIsoString(event.endDate)) return "End date is invalid"

  if (!event.startTime || !event.endTime) return "Start time and end time are required"
  if (!isValidTimeRange(event.startTime, event.endTime)) return "End time must be after start time"

  if ((event.type === "In-person" || event.type === "Hybrid") && !normalizeText(event.location)) {
    return "Location is required for In-person and Hybrid events"
  }

  if ((event.type === "Online" || event.type === "Hybrid") && !isValidUrl(event.onlineUrl)) {
    return "A valid Online URL is required for Online and Hybrid events"
  }

  if (!isValidOptionalUrl(event.image)) return "Event image must be a valid URL"

  for (const [index, session] of (event.sessions || []).entries()) {
    if (!normalizeRequiredText(session.title)) return `Session #${index + 1}: title is required`
    if (!normalizeRequiredText(session.description)) return `Session #${index + 1}: description is required`
    if (!normalizeRequiredText(session.speaker)) return `Session #${index + 1}: speaker is required`
    if (!isValidTimeRange(session.startTime, session.endTime)) return `Session #${index + 1}: end time must be after start time`
  }

  for (const [index, ticket] of (event.tickets || []).entries()) {
    if (!ticket.type) return `Ticket #${index + 1}: type is required`
    if (!normalizeRequiredText(ticket.name)) return `Ticket #${index + 1}: name is required`
    if (Number(ticket.price ?? 0) < 0) return `Ticket #${index + 1}: price must be 0 or greater`
    if (!normalizeRequiredText(ticket.description)) return `Ticket #${index + 1}: description is required`

    const sold = Number(ticket.sold ?? 0)
    if (typeof ticket.quantity === "number" && ticket.quantity < sold) {
      return `Ticket #${index + 1}: quantity cannot be lower than sold (${sold})`
    }
  }

  for (const [index, speaker] of (event.speakers || []).entries()) {
    if (!normalizeRequiredText(speaker.name)) return `Speaker #${index + 1}: name is required`
    if (!normalizeRequiredText(speaker.title)) return `Speaker #${index + 1}: title is required`
    if (!normalizeRequiredText(speaker.bio)) return `Speaker #${index + 1}: bio is required`
    if (!isValidOptionalUrl(speaker.photo)) return `Speaker #${index + 1}: photo URL is invalid`
  }

  if ((eventAny.tags || []).some((tag: any) => typeof tag !== "string" || !tag.trim())) {
    return "Tags must be non-empty strings"
  }

  return null
}

export default function ManageEventClient({ initialEvent, serverVersion }: ManageEventClientProps) {
  const { toast } = useToast()
  const router = useRouter()

  const [serverSnapshot, setServerSnapshot] = useState<Event>(() => mapApiEventToDraft(initialEvent))
  const [draftEvent, setDraftEvent] = useState<Event>(() => mapApiEventToDraft(initialEvent))
  const [isSaving, setIsSaving] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  useEffect(() => {
    const mapped = mapApiEventToDraft(initialEvent)
    setServerSnapshot(mapped)
    setDraftEvent(mapped)
  }, [initialEvent, serverVersion])

  const hasChanges = useMemo(
    () => serializeNormalizedEvent(draftEvent) !== serializeNormalizedEvent(serverSnapshot),
    [draftEvent, serverSnapshot],
  )

  useEffect(() => {
    if (!hasChanges) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasChanges])

  const updateEvent = useCallback((updates: Partial<Event>) => {
    setDraftEvent((prev) => ({ ...prev, ...updates }))
  }, [])

  const handleSave = useCallback(async () => {
    const validationError = validateEventBeforeSave(draftEvent)
    if (validationError) {
      toast({
        title: "Validation error",
        description: validationError,
        variant: "destructive" as any,
      })
      return
    }

    setIsSaving(true)
    try {
      const updateData = buildUpdatePayload(draftEvent)
      const response = await eventsApi.update(draftEvent.id, updateData as any)

      const updatedEvent = mapApiEventToDraft((response as any)?.data, draftEvent)
      setServerSnapshot(updatedEvent)
      setDraftEvent(updatedEvent)

      toast({
        title: "Event saved",
        description: "Your changes have been saved successfully.",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Failed to save",
        description: formatApiError(error),
        variant: "destructive" as any,
      })
    } finally {
      setIsSaving(false)
    }
  }, [draftEvent, router, toast])

  const setActiveStatus = useCallback(
    async (isActive: boolean) => {
      setIsUpdatingStatus(true)
      try {
        await eventsApi.update(draftEvent.id, { isActive })
        setServerSnapshot((prev) => ({ ...prev, isActive }))
        setDraftEvent((prev) => ({ ...prev, isActive }))
        router.refresh()
      } catch (error: any) {
        throw new Error(formatApiError(error))
      } finally {
        setIsUpdatingStatus(false)
      }
    },
    [draftEvent.id, router],
  )

  const togglePublishedStatus = useCallback(async () => {
    setIsUpdatingStatus(true)
    try {
      const response = await eventsApi.togglePublished(draftEvent.id)
      const nextIsPublished = Boolean((response as any)?.data?.isPublished ?? (response as any)?.isPublished)

      setServerSnapshot((prev) => ({ ...prev, isPublished: nextIsPublished } as Event))
      setDraftEvent((prev) => ({ ...prev, isPublished: nextIsPublished } as Event))
      router.refresh()

      return nextIsPublished
    } catch (error: any) {
      throw new Error(formatApiError(error))
    } finally {
      setIsUpdatingStatus(false)
    }
  }, [draftEvent.id, router])

  return (
    <div className="space-y-8 p-5">
      <EventHeader event={draftEvent} onSave={handleSave} isSaving={isSaving} hasChanges={hasChanges} />
      <EventTabs
        event={draftEvent}
        onUpdateEvent={updateEvent}
        onSetActive={setActiveStatus}
        onTogglePublished={togglePublishedStatus}
        isUpdatingStatus={isUpdatingStatus}
      />
    </div>
  )
}
