import type { CreatorChecklistItem, CreatorCommunityRef, CreatorValidationResult } from "./types"
import { checklistItem, getCommunityId, hasText, isHttpUrl, toDateOnly, toNumber, trim, addDays } from "./utils"
import { validationResult } from "./types"

export interface EventTicketDraft {
  type: "regular" | "vip" | "early-bird" | "student" | "free"
  name: string
  price: number | string
  description?: string
  quantity?: number | string
}

export interface EventCreateValues {
  communityId: string
  title: string
  description: string
  startDate: string
  endDate?: string
  startTime: string
  endTime: string
  timezone: string
  location?: string
  onlineUrl?: string
  category: string
  type: "In-person" | "Online" | "Hybrid"
  image?: string
  tickets: EventTicketDraft[]
  speakers: Array<{ name: string; title: string; bio: string; photo?: string }>
  tags: string[]
  isPublished: boolean
}

export const getInitialEventValues = (community?: CreatorCommunityRef | null, now = new Date()): EventCreateValues => ({
  communityId: getCommunityId(community),
  title: "",
  description: "",
  startDate: toDateOnly(addDays(now, 1)),
  endDate: toDateOnly(addDays(now, 1)),
  startTime: "09:00",
  endTime: "10:00",
  timezone: "UTC",
  location: "",
  onlineUrl: "",
  category: "General",
  type: "Online",
  image: "",
  tickets: [{ type: "free", name: "Free ticket", price: 0, description: "General admission" }],
  speakers: [],
  tags: [],
  isPublished: false,
})

export const validateEventDraft = (values: EventCreateValues): CreatorValidationResult => {
  const fieldErrors: Record<string, string> = {}
  if (!hasText(values.title, 2)) fieldErrors.title = "Event title must be at least 2 characters."
  if (!hasText(values.description, 1)) fieldErrors.description = "Event description is required."
  if (!hasText(values.communityId)) fieldErrors.communityId = "Select a community before creating an event."
  if (!hasText(values.startDate)) fieldErrors.startDate = "Choose an event date."
  return validationResult(fieldErrors)
}

export const validateEventPublish = (values: EventCreateValues): CreatorValidationResult => {
  const draft = validateEventDraft(values)
  const publishBlockers = [...draft.publishBlockers]
  if ((values.type === "Online" || values.type === "Hybrid") && !isHttpUrl(trim(values.onlineUrl || ""))) {
    publishBlockers.push("Add a valid online event link before publishing.")
  }
  if ((values.type === "In-person" || values.type === "Hybrid") && !hasText(values.location)) {
    publishBlockers.push("Add a location before publishing this in-person event.")
  }
  if (!values.tickets.length) publishBlockers.push("Add at least one ticket before publishing.")
  if (values.endTime <= values.startTime) publishBlockers.push("Event end time must be after start time.")
  return validationResult(draft.fieldErrors, draft.globalErrors, publishBlockers)
}

export const buildEventCreatePayload = (values: EventCreateValues) => ({
  communityId: trim(values.communityId),
  title: trim(values.title),
  description: trim(values.description),
  startDate: values.startDate,
  endDate: values.endDate || values.startDate,
  startTime: values.startTime || "09:00",
  endTime: values.endTime || "10:00",
  timezone: values.timezone || "UTC",
  location: values.type === "Online" ? "" : trim(values.location),
  onlineUrl: values.type === "In-person" ? undefined : trim(values.onlineUrl) || undefined,
  category: trim(values.category) || "General",
  type: values.type || "Online",
  image: trim(values.image) || undefined,
  tags: values.tags.map(trim).filter(Boolean),
  isActive: Boolean(values.isPublished),
  isPublished: Boolean(values.isPublished),
  tickets: (values.tickets.length ? values.tickets : getInitialEventValues({ id: values.communityId }).tickets).map((ticket) => ({
    type: ticket.type,
    name: trim(ticket.name) || "Free ticket",
    price: toNumber(ticket.price, 0),
    description: trim(ticket.description) || `${trim(ticket.name) || "Event"} ticket`,
    quantity: ticket.quantity === "" || ticket.quantity === undefined ? undefined : toNumber(ticket.quantity, 0),
  })),
  speakers: values.speakers.map((speaker) => ({
    name: trim(speaker.name),
    title: trim(speaker.title),
    bio: trim(speaker.bio),
    photo: trim(speaker.photo) || undefined,
  })),
  sessions: [],
})

export const getEventPublishChecklist = (values: EventCreateValues): CreatorChecklistItem[] => [
  checklistItem("title", "Event title", hasText(values.title, 2), "Add an event title."),
  checklistItem("description", "Event description", hasText(values.description), "Add an event description."),
  checklistItem("date", "Date and time", hasText(values.startDate) && values.endTime > values.startTime, "Set a valid event date and time."),
  checklistItem("access", "How people attend", values.type === "Online" ? isHttpUrl(trim(values.onlineUrl || "")) : hasText(values.location), "Add the event link or location."),
]

