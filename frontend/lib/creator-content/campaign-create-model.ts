import type { CreatorChecklistItem, CreatorCommunityRef, CreatorValidationResult } from "./types"
import { checklistItem, getCommunityId, hasText, trim } from "./utils"
import { validationResult } from "./types"

export type CampaignKind = "announcement" | "content-reminder" | "inactive-users"
export type CampaignSendingTime = "now" | "scheduled"
export type CampaignContentType = "event" | "challenge" | "cours" | "product" | "session" | "all"

export interface CampaignCreateValues {
  title: string
  type: CampaignKind
  subject: string
  content: string
  communityId: string
  sendingTime: CampaignSendingTime
  scheduledDate?: string
  scheduledTime?: string
  inactivityPeriod?: "last_7_days" | "last_15_days" | "last_30_days" | "last_60_days" | "more_than_60_days"
  contentType?: CampaignContentType
  contentId?: string
  isHtml: boolean
  trackOpens: boolean
  trackClicks: boolean
}

export const getInitialCampaignValues = (community?: CreatorCommunityRef | null): CampaignCreateValues => ({
  title: "",
  type: "announcement",
  subject: "",
  content: "",
  communityId: getCommunityId(community),
  sendingTime: "now",
  scheduledDate: "",
  scheduledTime: "",
  inactivityPeriod: undefined,
  contentType: "all",
  contentId: "",
  isHtml: true,
  trackOpens: true,
  trackClicks: true,
})

const scheduledAt = (values: CampaignCreateValues): string | undefined => {
  if (values.sendingTime !== "scheduled") return undefined
  if (!values.scheduledDate || !values.scheduledTime) return undefined
  return new Date(`${values.scheduledDate}T${values.scheduledTime}`).toISOString()
}

export const validateCampaignDraft = (values: CampaignCreateValues): CreatorValidationResult => {
  const fieldErrors: Record<string, string> = {}
  if (!hasText(values.subject, 2)) fieldErrors.subject = "Campaign subject must be at least 2 characters."
  if (!hasText(values.content)) fieldErrors.content = "Campaign content is required."
  if (!hasText(values.communityId)) fieldErrors.communityId = "Select a community before creating a campaign."
  return validationResult(fieldErrors)
}

export const validateCampaignPublish = (values: CampaignCreateValues, now = new Date()): CreatorValidationResult => {
  const draft = validateCampaignDraft(values)
  const publishBlockers = [...draft.publishBlockers]
  if (values.type === "inactive-users" && !values.inactivityPeriod) publishBlockers.push("Pick an inactivity period.")
  if (values.type === "content-reminder" && !values.contentType) publishBlockers.push("Pick a content type.")
  if (values.sendingTime === "scheduled") {
    const iso = scheduledAt(values)
    if (!iso) publishBlockers.push("Choose a scheduled date and time.")
    else if (new Date(iso).getTime() <= now.getTime()) publishBlockers.push("Scheduled time must be in the future.")
  }
  return validationResult(draft.fieldErrors, draft.globalErrors, publishBlockers)
}

export const buildCampaignCreatePayload = (values: CampaignCreateValues) => {
  const base = {
    title: trim(values.title) || trim(values.subject),
    subject: trim(values.subject),
    content: values.content,
    communityId: trim(values.communityId),
    scheduledAt: scheduledAt(values),
    isHtml: values.isHtml,
    trackOpens: values.trackOpens,
    trackClicks: values.trackClicks,
  }

  if (values.type === "inactive-users") {
    return { request: "createInactiveUserCampaign" as const, data: { ...base, inactivityPeriod: values.inactivityPeriod || "last_30_days" } }
  }

  if (values.type === "content-reminder") {
    return { request: "createContentReminder" as const, data: { ...base, contentType: values.contentType || "all", contentId: trim(values.contentId) || undefined } }
  }

  return { request: "createCampaign" as const, data: { ...base, type: "announcement" } }
}

export const getCampaignPublishChecklist = (values: CampaignCreateValues): CreatorChecklistItem[] => [
  checklistItem("subject", "Subject", hasText(values.subject, 2), "Add a subject."),
  checklistItem("content", "Message", hasText(values.content), "Write the message."),
  checklistItem("audience", "Audience", values.type !== "inactive-users" || Boolean(values.inactivityPeriod), "Pick an inactivity period."),
]

