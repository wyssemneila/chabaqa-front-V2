export type CreatorValidationMode = "draft" | "publish"

export type CreatorContentType =
  | "course"
  | "challenge"
  | "product"
  | "event"
  | "session"
  | "post"
  | "campaign"
  | "community"

export interface CreatorCommunityRef {
  id?: string
  _id?: string
  slug?: string
  name?: string
}

export interface CreatorValidationResult {
  ok: boolean
  fieldErrors: Record<string, string>
  globalErrors: string[]
  publishBlockers: string[]
}

export interface CreatorChecklistItem {
  id: string
  label: string
  status: "ready" | "missing" | "recommended" | "optional"
  message?: string
}

export const emptyValidationResult = (): CreatorValidationResult => ({
  ok: true,
  fieldErrors: {},
  globalErrors: [],
  publishBlockers: [],
})

export const validationResult = (
  fieldErrors: Record<string, string> = {},
  globalErrors: string[] = [],
  publishBlockers: string[] = [],
): CreatorValidationResult => ({
  ok: Object.keys(fieldErrors).length === 0 && globalErrors.length === 0 && publishBlockers.length === 0,
  fieldErrors,
  globalErrors,
  publishBlockers,
})

