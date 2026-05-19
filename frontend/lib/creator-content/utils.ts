import type { CreatorChecklistItem, CreatorCommunityRef } from "./types"

export const DEFAULT_CURRENCY = "TND" as const

export const trim = (value: unknown): string => (typeof value === "string" ? value.trim() : "")

export const hasText = (value: unknown, minLength = 1): boolean => trim(value).length >= minLength

export const toNumber = (value: unknown, fallback = 0): number => {
  if (value === "" || value === null || value === undefined) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const nonNegativeNumber = (value: unknown): boolean => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0
}

export const addDays = (date: Date, days: number): Date => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export const toDateOnly = (date: Date): string => date.toISOString().slice(0, 10)

export const toIso = (date: Date): string => date.toISOString()

export const getCommunityId = (community?: CreatorCommunityRef | null): string =>
  trim(community?.id) || trim(community?._id)

export const getCommunitySlug = (community?: CreatorCommunityRef | null): string => trim(community?.slug)

export const isHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

export const isUploadOrHttpUrl = (value: string): boolean => {
  const normalized = trim(value)
  return isHttpUrl(normalized) || /^\/?uploads\/.+/i.test(normalized)
}

export const checklistItem = (
  id: string,
  label: string,
  ready: boolean,
  message: string,
): CreatorChecklistItem => ({
  id,
  label,
  status: ready ? "ready" : "missing",
  message: ready ? undefined : message,
})

