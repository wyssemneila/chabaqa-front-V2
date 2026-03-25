import ManageEventClient from "./components/ManageEventClient"
import { api } from "@/lib/api"
import { notFound } from "next/navigation"
import { Event } from "@/lib/models"
import { Event as ApiEvent } from "@/lib/api/types"

interface PageProps {
  params: { eventId: string }
}

const toDate = (value?: string): Date => {
  if (!value) return new Date()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

const toOptionalDate = (value?: string): Date | undefined => {
  if (!value) return undefined
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

export default async function ManageEventPage({ params }: PageProps) {
  try {
    const eventResponse = await api.events.getById(params.eventId)
    const apiEvent = eventResponse.data as ApiEvent | undefined

    if (!apiEvent) {
      notFound()
    }

    const eventData = apiEvent as any
    const serverVersion = String(eventData.updatedAt || eventData.startDate || eventData.id)

    const event = {
      id: eventData.id,
      title: eventData.title || "",
      description: eventData.description || "",
      image: eventData.image || eventData.thumbnail || "",
      startDate: toDate(eventData.startDate),
      endDate: toOptionalDate(eventData.endDate),
      startTime: eventData.startTime || "",
      endTime: eventData.endTime || "",
      location: eventData.location || "",
      onlineUrl: eventData.onlineUrl || "",
      timezone: eventData.timezone || "UTC",
      category: eventData.category || "",
      type: eventData.type || "Online",
      isActive: Boolean(eventData.isActive),
      isPublished: Boolean(eventData.isPublished),
      notes: eventData.notes || "",
      tags: Array.isArray(eventData.tags) ? eventData.tags : [],
      attendees: Array.isArray(eventData.attendees) ? eventData.attendees : [],
      tickets: (Array.isArray(eventData.tickets) ? eventData.tickets : []).map((t: any) => ({
        id: t.id,
        type: t.type || "regular",
        name: t.name || "",
        price: Number(t.price ?? 0),
        description: t.description || "",
        quantity: typeof t.quantity === "number" ? t.quantity : undefined,
        sold: Number(t.sold ?? 0),
      })),
      sessions: (Array.isArray(eventData.sessions) ? eventData.sessions : []).map((s: any) => ({
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
      speakers: (Array.isArray(eventData.speakers) ? eventData.speakers : []).map((s: any) => ({
        id: s.id,
        name: s.name || "",
        title: s.title || "",
        bio: s.bio || "",
        photo: s.photo || "",
      })),
      price: Number(eventData.price ?? 0),
    } as any as Event

    return <ManageEventClient initialEvent={event} serverVersion={serverVersion} />
  } catch (error) {
    console.error("Failed to fetch event:", error)
    notFound()
  }
}
