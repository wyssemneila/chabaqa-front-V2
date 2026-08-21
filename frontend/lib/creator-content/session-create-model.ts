import type { CreatorChecklistItem, CreatorCommunityRef, CreatorValidationResult } from "./types"
import { checklistItem, DEFAULT_CURRENCY, getCommunitySlug, hasText, nonNegativeNumber, toNumber, trim } from "./utils"
import { validationResult } from "./types"

export interface SessionCreateValues {
  title: string
  description: string
  thumbnail?: string
  duration: number | string
  price: number | string
  currency: "USD" | "EUR" | "TND"
  communitySlug: string
  category?: string
  maxBookingsPerWeek?: number | string
  notes?: string
  isActive: boolean
  resources: []
  recurringAvailability?: Array<{ dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }>
}

export const getInitialSessionValues = (community?: CreatorCommunityRef | null): SessionCreateValues => ({
  title: "",
  description: "",
  thumbnail: "",
  duration: 60,
  price: 0,
  currency: DEFAULT_CURRENCY,
  communitySlug: getCommunitySlug(community),
  category: "",
  maxBookingsPerWeek: "",
  notes: "",
  isActive: false,
  resources: [],
  recurringAvailability: [],
})

export const validateSessionDraft = (values: SessionCreateValues): CreatorValidationResult => {
  const fieldErrors: Record<string, string> = {}
  const duration = toNumber(values.duration, 0)
  if (!hasText(values.title, 2)) fieldErrors.title = "Session title must be at least 2 characters."
  if (!hasText(values.description, 1)) fieldErrors.description = "Session description is required."
  if (duration < 15 || duration > 480) fieldErrors.duration = "Session duration must be between 15 and 480 minutes."
  if (!nonNegativeNumber(values.price)) fieldErrors.price = "Session price must be zero or greater."
  if (!hasText(values.communitySlug)) fieldErrors.communitySlug = "Select a community before creating a session."
  return validationResult(fieldErrors)
}

export const validateSessionPublish = (values: SessionCreateValues): CreatorValidationResult => {
  const draft = validateSessionDraft(values)
  const hasAvailability = (values.recurringAvailability || []).some(
    (slot) => slot.isActive && hasText(slot.startTime) && hasText(slot.endTime) && slot.endTime > slot.startTime
  )
  const publishBlockers = [...draft.publishBlockers]
  if (!hasAvailability) {
    publishBlockers.push("Add availability before publishing so members can book this session.")
  }
  return validationResult(draft.fieldErrors, draft.globalErrors, publishBlockers)
}

export const buildSessionCreatePayload = (values: SessionCreateValues) => ({
  title: trim(values.title),
  description: trim(values.description),
  thumbnail: trim(values.thumbnail) || undefined,
  duration: toNumber(values.duration, 60),
  price: toNumber(values.price, 0),
  currency: values.currency || DEFAULT_CURRENCY,
  communitySlug: trim(values.communitySlug),
  category: trim(values.category) || undefined,
  maxBookingsPerWeek: values.maxBookingsPerWeek === "" || values.maxBookingsPerWeek === undefined ? undefined : toNumber(values.maxBookingsPerWeek),
  notes: trim(values.notes) || undefined,
  isActive: Boolean(values.isActive),
  resources: [],
})

export const getSessionPublishChecklist = (values: SessionCreateValues): CreatorChecklistItem[] => [
  checklistItem("title", "Session title", hasText(values.title, 2), "Add a session title."),
  checklistItem("description", "Session description", hasText(values.description), "Add a session description."),
  checklistItem("duration", "Duration", toNumber(values.duration, 0) >= 15 && toNumber(values.duration, 0) <= 480, "Choose a duration between 15 and 480 minutes."),
  checklistItem("price", "Price", nonNegativeNumber(values.price), "Set a valid session price."),
  checklistItem(
    "availability",
    "Booking availability",
    (values.recurringAvailability || []).some((slot) => slot.isActive && hasText(slot.startTime) && hasText(slot.endTime) && slot.endTime > slot.startTime),
    "Add availability before publishing so members can book."
  ),
]
