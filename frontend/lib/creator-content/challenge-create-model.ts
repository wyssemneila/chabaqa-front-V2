import type { CreatorChecklistItem, CreatorCommunityRef, CreatorValidationResult } from "./types"
import { checklistItem, DEFAULT_CURRENCY, getCommunitySlug, hasText, toIso, toNumber, trim, addDays } from "./utils"
import { validationResult } from "./types"

export interface ChallengeTaskDraft {
  day: number
  title: string
  description?: string
  deliverable?: string
  points?: number
  instructions?: string
  resources?: Array<{ title: string; type: "video" | "article" | "code" | "tool"; url: string }>
}

export interface ChallengeCreateValues {
  title: string
  description: string
  communitySlug: string
  startDate: string
  endDate: string
  participationFee: number | string
  currency: "USD" | "EUR" | "TND"
  category: string
  difficulty: "beginner" | "intermediate" | "advanced"
  duration: string
  thumbnail?: string
  sequentialProgression: boolean
  unlockMessage?: string
  tasks: ChallengeTaskDraft[]
  isActive: boolean
}

export interface ChallengeCreatePayload {
  title: string
  description: string
  communitySlug: string
  startDate: string
  endDate: string
  participationFee: number
  currency: "USD" | "EUR" | "TND"
  category?: string
  difficulty?: "beginner" | "intermediate" | "advanced"
  duration?: string
  thumbnail?: string
  sequentialProgression?: boolean
  unlockMessage?: string
  resources: []
  tasks: Array<{
    day: number
    title: string
    description: string
    deliverable: string
    points: number
    instructions?: string
    resources: Array<{ title: string; type: "video" | "article" | "code" | "tool"; url: string }>
  }>
  isActive: boolean
}

export const getInitialChallengeValues = (
  community?: CreatorCommunityRef | null,
  now = new Date(),
): ChallengeCreateValues => ({
  title: "",
  description: "",
  communitySlug: getCommunitySlug(community),
  startDate: toIso(now),
  endDate: toIso(addDays(now, 7)),
  participationFee: 0,
  currency: DEFAULT_CURRENCY,
  category: "General",
  difficulty: "beginner",
  duration: "7 days",
  thumbnail: "",
  sequentialProgression: false,
  unlockMessage: "",
  tasks: [{ day: 1, title: "Day 1", description: "", deliverable: "Complete the task", points: 100, instructions: "" }],
  isActive: false,
})

export const validateChallengeDraft = (values: ChallengeCreateValues): CreatorValidationResult => {
  const fieldErrors: Record<string, string> = {}
  if (!hasText(values.title, 2)) fieldErrors.title = "Challenge title must be at least 2 characters."
  if (!hasText(values.description, 1)) fieldErrors.description = "Challenge description is required."
  if (!hasText(values.communitySlug)) fieldErrors.communitySlug = "Select a community before creating a challenge."
  if (!hasText(values.tasks[0]?.title, 2)) fieldErrors.firstTask = "Add a title for the first task."
  return validationResult(fieldErrors)
}

export const validateChallengePublish = (values: ChallengeCreateValues): CreatorValidationResult => {
  const draft = validateChallengeDraft(values)
  const publishBlockers = [...draft.publishBlockers]
  const seenDays = new Set<number>()
  values.tasks.forEach((task, index) => {
    if (!hasText(task.description, 10)) publishBlockers.push(`Task ${index + 1} needs a description of at least 10 characters.`)
    if (!hasText(task.deliverable, 5)) publishBlockers.push(`Task ${index + 1} needs a deliverable.`)
    if (seenDays.has(task.day)) publishBlockers.push(`Task day ${task.day} is duplicated.`)
    seenDays.add(task.day)
  })
  if (new Date(values.endDate).getTime() < new Date(values.startDate).getTime()) {
    publishBlockers.push("Challenge end date must be after the start date.")
  }
  return validationResult(draft.fieldErrors, draft.globalErrors, publishBlockers)
}

export const buildChallengeCreatePayload = (values: ChallengeCreateValues): ChallengeCreatePayload => ({
  title: trim(values.title),
  description: trim(values.description),
  communitySlug: trim(values.communitySlug),
  startDate: values.startDate,
  endDate: values.endDate,
  participationFee: toNumber(values.participationFee, 0),
  currency: values.currency || DEFAULT_CURRENCY,
  category: trim(values.category) || "General",
  difficulty: values.difficulty || "beginner",
  duration: trim(values.duration) || "7 days",
  thumbnail: trim(values.thumbnail) || undefined,
  sequentialProgression: Boolean(values.sequentialProgression),
  unlockMessage: trim(values.unlockMessage) || undefined,
  resources: [],
  tasks: (values.tasks.length ? values.tasks : getInitialChallengeValues({ slug: values.communitySlug }).tasks).map((task, index) => ({
    day: Number(task.day || index + 1),
    title: trim(task.title) || `Task ${index + 1}`,
    description: trim(task.description) || trim(values.description),
    deliverable: trim(task.deliverable) || "Complete the task",
    points: toNumber(task.points, 100),
    instructions: trim(task.instructions) || undefined,
    resources: task.resources || [],
  })),
  isActive: Boolean(values.isActive),
})

export const getChallengePublishChecklist = (values: ChallengeCreateValues): CreatorChecklistItem[] => [
  checklistItem("title", "Challenge title", hasText(values.title, 2), "Add a challenge title."),
  checklistItem("description", "Challenge description", hasText(values.description), "Add a challenge description."),
  checklistItem("task", "First task", hasText(values.tasks[0]?.title, 2), "Add a first task."),
  checklistItem("dates", "Schedule", new Date(values.endDate).getTime() >= new Date(values.startDate).getTime(), "Fix the date range."),
]

