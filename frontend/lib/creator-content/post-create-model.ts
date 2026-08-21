import type { CreatorChecklistItem, CreatorCommunityRef, CreatorValidationResult } from "./types"
import { checklistItem, getCommunityId, hasText, isHttpUrl, trim } from "./utils"
import { validationResult } from "./types"

export interface PostCreateValues {
  title?: string
  content: string
  communityId: string
  tags: string[]
  images: string[]
  videos: string[]
  links: Array<{ url: string; title?: string }>
}

export const getInitialPostValues = (community?: CreatorCommunityRef | null): PostCreateValues => ({
  title: "",
  content: "",
  communityId: getCommunityId(community),
  tags: [],
  images: [],
  videos: [],
  links: [],
})

export const validatePostDraft = (values: PostCreateValues): CreatorValidationResult => {
  const fieldErrors: Record<string, string> = {}
  if (!hasText(values.content)) fieldErrors.content = "Post content cannot be empty."
  if (!hasText(values.communityId)) fieldErrors.communityId = "Select a community before creating a post."
  return validationResult(fieldErrors)
}

export const validatePostPublish = (values: PostCreateValues): CreatorValidationResult => {
  const draft = validatePostDraft(values)
  const publishBlockers = [...draft.publishBlockers]
  if (values.tags.length > 10) publishBlockers.push("Posts can have at most 10 tags.")
  if (values.images.length > 10) publishBlockers.push("Posts can have at most 10 images.")
  if (values.videos.length > 5) publishBlockers.push("Posts can have at most 5 videos.")
  if (values.links.length > 5) publishBlockers.push("Posts can have at most 5 links.")
  values.links.forEach((link, index) => {
    if (!isHttpUrl(trim(link.url))) publishBlockers.push(`Link ${index + 1} must be a valid URL.`)
  })
  return validationResult(draft.fieldErrors, draft.globalErrors, publishBlockers)
}

export const buildPostCreatePayload = (values: PostCreateValues) => ({
  title: trim(values.title) || undefined,
  content: trim(values.content),
  communityId: trim(values.communityId),
  tags: values.tags.map(trim).filter(Boolean),
  thumbnail: values.images[0],
  images: values.images.length ? values.images : undefined,
  videos: values.videos.length ? values.videos : undefined,
  links: values.links.length ? values.links.map((link) => ({ url: trim(link.url), title: trim(link.title) || undefined })) : undefined,
})

export const getPostPublishChecklist = (values: PostCreateValues): CreatorChecklistItem[] => [
  checklistItem("content", "Post content", hasText(values.content), "Write the post content."),
  checklistItem("community", "Community", hasText(values.communityId), "Select a community."),
]

