import type { CreatorChecklistItem, CreatorCommunityRef, CreatorValidationResult } from "./types"
import { checklistItem, DEFAULT_CURRENCY, getCommunityId, hasText, isUploadOrHttpUrl, nonNegativeNumber, toNumber, trim } from "./utils"
import { validationResult } from "./types"

export interface ProductFileDraft {
  name: string
  url: string
  type: string
  size?: string
  description?: string
}

export interface ProductVariantDraft {
  name: string
  price: number | string
  description?: string
  inventory?: number
}

export interface ProductCreateValues {
  title: string
  description: string
  price: number | string
  currency: "USD" | "EUR" | "TND"
  communityId: string
  category: string
  type: "digital" | "physical"
  isPublished: boolean
  thumbnail?: string
  features: string[]
  files: ProductFileDraft[]
  variants: ProductVariantDraft[]
  licenseTerms?: string
}

export interface ProductCreatePayload {
  title: string
  description: string
  price: number
  currency: "USD" | "EUR" | "TND"
  communityId: string
  category: string
  type: "digital" | "physical"
  isPublished: boolean
  images?: string[]
  features?: string[]
  files?: Array<ProductFileDraft & { order: number; isActive: boolean }>
  variants?: ProductVariantDraft[]
  licenseTerms?: string
}

export const getInitialProductValues = (community?: CreatorCommunityRef | null): ProductCreateValues => ({
  title: "",
  description: "",
  price: 0,
  currency: DEFAULT_CURRENCY,
  communityId: getCommunityId(community),
  category: "Digital Product",
  type: "digital",
  isPublished: false,
  thumbnail: "",
  features: [],
  files: [],
  variants: [],
  licenseTerms: "",
})

export const validateProductDraft = (values: ProductCreateValues): CreatorValidationResult => {
  const fieldErrors: Record<string, string> = {}
  if (!hasText(values.title, 2)) fieldErrors.title = "Product title must be at least 2 characters."
  if (!hasText(values.description, 1)) fieldErrors.description = "Product description is required."
  if (!nonNegativeNumber(values.price)) fieldErrors.price = "Product price must be zero or greater."
  if (!hasText(values.communityId)) fieldErrors.communityId = "Select a community before creating a product."
  return validationResult(fieldErrors)
}

export const validateProductPublish = (values: ProductCreateValues): CreatorValidationResult => {
  const draft = validateProductDraft(values)
  const publishBlockers = [...draft.publishBlockers]
  if (values.type === "digital" && toNumber(values.price, 0) > 0 && values.files.length === 0) {
    publishBlockers.push("Paid digital products need at least one delivery file before publishing.")
  }
  values.files.forEach((file, index) => {
    if (!hasText(file.name)) publishBlockers.push(`File ${index + 1} needs a name.`)
    if (!isUploadOrHttpUrl(file.url)) publishBlockers.push(`File ${index + 1} needs a valid upload or http URL.`)
  })
  return validationResult(draft.fieldErrors, draft.globalErrors, publishBlockers)
}

export const buildProductCreatePayload = (values: ProductCreateValues): ProductCreatePayload => ({
  title: trim(values.title),
  description: trim(values.description),
  price: toNumber(values.price, 0),
  currency: values.currency || DEFAULT_CURRENCY,
  communityId: trim(values.communityId),
  category: trim(values.category) || "Digital Product",
  type: values.type || "digital",
  isPublished: Boolean(values.isPublished),
  images: trim(values.thumbnail) ? [trim(values.thumbnail)] : undefined,
  features: values.features.map(trim).filter(Boolean).length ? values.features.map(trim).filter(Boolean) : undefined,
  files: values.files.length
    ? values.files.map((file, index) => ({ ...file, name: trim(file.name), url: trim(file.url), type: trim(file.type) || "OTHER", order: index, isActive: true }))
    : undefined,
  variants: values.variants.length ? values.variants.map((variant) => ({ ...variant, name: trim(variant.name), price: toNumber(variant.price, 0) })) : undefined,
  licenseTerms: trim(values.licenseTerms) || undefined,
})

export const getProductPublishChecklist = (values: ProductCreateValues): CreatorChecklistItem[] => [
  checklistItem("title", "Product title", hasText(values.title, 2), "Add a product title."),
  checklistItem("description", "Product description", hasText(values.description), "Add a product description."),
  checklistItem("price", "Price", nonNegativeNumber(values.price), "Set a valid price."),
  checklistItem("delivery", "Delivery", values.type !== "digital" || toNumber(values.price, 0) === 0 || values.files.length > 0, "Add a delivery file for paid digital products."),
]

