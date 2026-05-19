import type { CreatorChecklistItem, CreatorValidationResult } from "./types"
import { checklistItem, DEFAULT_CURRENCY, hasText, trim } from "./utils"
import { validationResult } from "./types"

export interface CommunityCreateValues {
  name: string
  bio?: string
  country: string
  status: "public" | "private"
  joinFee: "free" | "paid"
  feeAmount: string
  currency: "USD" | "EUR" | "TND"
  socialLinks: Record<string, string>
  logo?: string
  coverImage?: string
}

export const getInitialCommunityValues = (): CommunityCreateValues => ({
  name: "",
  bio: "",
  country: "",
  status: "public",
  joinFee: "free",
  feeAmount: "0",
  currency: DEFAULT_CURRENCY,
  socialLinks: { website: "" },
  logo: "",
  coverImage: "",
})

const hasSocialLink = (values: CommunityCreateValues): boolean =>
  Object.values(values.socialLinks || {}).some((link) => hasText(link))

export const validateCommunityDraft = (values: CommunityCreateValues): CreatorValidationResult => {
  const fieldErrors: Record<string, string> = {}
  if (!hasText(values.name, 2)) fieldErrors.name = "Community name must be at least 2 characters."
  if (!hasText(values.country)) fieldErrors.country = "Community country is required."
  if (values.joinFee === "paid" && Number(values.feeAmount) <= 0) fieldErrors.feeAmount = "Paid communities need a fee amount greater than zero."
  if (!hasSocialLink(values)) fieldErrors.socialLinks = "Add at least one link while the backend requires social links."
  return validationResult(fieldErrors)
}

export const validateCommunityPublish = (values: CommunityCreateValues): CreatorValidationResult => validateCommunityDraft(values)

export const buildCommunityCreatePayload = (values: CommunityCreateValues) => ({
  name: trim(values.name),
  bio: trim(values.bio) || undefined,
  country: trim(values.country),
  status: values.status,
  joinFee: values.joinFee,
  feeAmount: values.joinFee === "free" ? "0" : String(values.feeAmount),
  currency: values.currency || DEFAULT_CURRENCY,
  socialLinks: values.socialLinks,
  logo: trim(values.logo) || undefined,
  coverImage: trim(values.coverImage) || undefined,
  category: "General",
  tags: [],
})

export const getCommunityPublishChecklist = (values: CommunityCreateValues): CreatorChecklistItem[] => [
  checklistItem("name", "Community name", hasText(values.name, 2), "Add a community name."),
  checklistItem("country", "Country", hasText(values.country), "Choose a country."),
  checklistItem("link", "Main link", hasSocialLink(values), "Add at least one social or website link."),
]

