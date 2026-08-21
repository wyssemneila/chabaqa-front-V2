import type {
  CreateContentReminderDto,
  CreateEmailCampaignDto,
  CreateInactiveUserCampaignDto,
  EmailCampaignType,
  InactivityPeriod,
} from "@/lib/api/email-campaigns.api"

export type MarketingCampaignKind = "announcement" | "content-reminder" | "inactive-users"
export type CampaignSendingMode = "now" | "scheduled"
export type ContentType = "event" | "challenge" | "cours" | "product" | "session" | "all"

export interface CampaignFormValues {
  title: string
  type: MarketingCampaignKind
  subject: string
  content: string
  sendingTime: CampaignSendingMode
  scheduledDate?: string
  scheduledTime?: string
  inactivityPeriod?: InactivityPeriod
  contentType?: ContentType
  contentId?: string
  isHtml?: boolean
  trackOpens?: boolean
  trackClicks?: boolean
}

export type CampaignPayload =
  | { request: "createCampaign"; data: CreateEmailCampaignDto }
  | { request: "createInactiveUserCampaign"; data: CreateInactiveUserCampaignDto }
  | { request: "createContentReminder"; data: CreateContentReminderDto }

export const toUtcIsoFromLocalDateTime = (date: string, time: string): string => {
  const localDate = new Date(`${date}T${time}`)
  if (Number.isNaN(localDate.getTime())) {
    throw new Error("Invalid schedule date/time")
  }
  return localDate.toISOString()
}

export const resolveScheduledAt = (values: CampaignFormValues): string | undefined => {
  if (values.sendingTime !== "scheduled") return undefined
  if (!values.scheduledDate || !values.scheduledTime) {
    throw new Error("Scheduled date and time are required")
  }
  const scheduledAt = toUtcIsoFromLocalDateTime(values.scheduledDate, values.scheduledTime)
  if (new Date(scheduledAt).getTime() <= Date.now()) {
    throw new Error("Scheduled time must be in the future")
  }
  return scheduledAt
}

export const buildCampaignPayload = (
  values: CampaignFormValues,
  communityId: string,
): CampaignPayload => {
  const scheduledAt = resolveScheduledAt(values)
  const base = {
    title: values.title,
    subject: values.subject,
    content: values.content,
    communityId,
    isHtml: values.isHtml ?? true,
    trackOpens: values.trackOpens ?? true,
    trackClicks: values.trackClicks ?? true,
  }

  if (values.type === "inactive-users") {
    if (!values.inactivityPeriod) {
      throw new Error("Inactivity period is required for inactive user campaigns")
    }
    return {
      request: "createInactiveUserCampaign",
      data: {
        ...base,
        inactivityPeriod: values.inactivityPeriod,
        scheduledAt,
      },
    }
  }

  if (values.type === "content-reminder") {
    if (!values.contentType) {
      throw new Error("Content type is required for content reminder campaigns")
    }
    return {
      request: "createContentReminder",
      data: {
        ...base,
        contentType: values.contentType,
        contentId: values.contentId || undefined,
        scheduledAt,
      },
    }
  }

  return {
    request: "createCampaign",
    data: {
      ...base,
      type: "announcement" as EmailCampaignType,
      scheduledAt,
    },
  }
}

export const toLocalDateTimeFields = (iso?: string): { date: string; time: string } => {
  if (!iso) return { date: "", time: "" }
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return { date: "", time: "" }
  const offsetMillis = parsed.getTimezoneOffset() * 60_000
  const local = new Date(parsed.getTime() - offsetMillis)
  const localIso = local.toISOString()
  return {
    date: localIso.slice(0, 10),
    time: localIso.slice(11, 16),
  }
}
