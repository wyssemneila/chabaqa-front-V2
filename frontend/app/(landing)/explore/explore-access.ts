import type { Explore } from "@/lib/data-communities"

type ExploreItemType = Explore["type"]
type AnyRecord = Record<string, unknown>

export interface ExploreAccessSnapshot {
  joinedCommunityIds: Set<string>
  joinedCommunitySlugs: Set<string>
  accessibleCourseIds: Set<string>
  accessibleChallengeIds: Set<string>
  accessibleProductIds: Set<string>
  accessibleSessionIds: Set<string>
  accessibleEventIds: Set<string>
}

export interface ExploreAccessResponses {
  joinedCommunities?: unknown
  courseEnrollments?: unknown
  challengeParticipations?: unknown
  productPurchases?: unknown
  sessionBookings?: unknown
  eventRegistrations?: unknown
}

const MAX_ID_PARSE_DEPTH = 2

function createEmptyIdSet(): Set<string> {
  return new Set<string>()
}

function asRecord(value: unknown): AnyRecord | null {
  if (!value || typeof value !== "object") return null
  return value as AnyRecord
}

function getPath(source: unknown, path: string[]): unknown {
  let current: unknown = source
  for (const key of path) {
    const record = asRecord(current)
    if (!record) return undefined
    current = record[key]
  }
  return current
}

function extractArrayByPaths(source: unknown, paths: string[][]): unknown[] {
  for (const path of paths) {
    const value = path.length === 0 ? source : getPath(source, path)
    if (Array.isArray(value)) {
      return value
    }
  }
  return []
}

function normalizeString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed || null
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value)
  }
  return null
}

function normalizeSlug(value: unknown): string | null {
  const normalized = normalizeString(value)
  if (!normalized) return null
  try {
    return decodeURIComponent(normalized).trim().toLowerCase() || null
  } catch {
    return normalized.toLowerCase()
  }
}

function addId(target: Set<string>, value: unknown, depth: number = 0): void {
  if (depth > MAX_ID_PARSE_DEPTH) return

  const normalized = normalizeString(value)
  if (normalized) {
    target.add(normalized)
    return
  }

  const record = asRecord(value)
  if (!record) return

  addId(target, record.id, depth + 1)
  addId(target, record._id, depth + 1)
  addId(target, record.mongoId, depth + 1)
  addId(target, record.value, depth + 1)
}

function addSlug(target: Set<string>, value: unknown): void {
  const normalized = normalizeSlug(value)
  if (normalized) {
    target.add(normalized)
  }
}

function hasAnyId(target: Set<string>, candidates: unknown[]): boolean {
  const candidateIds = new Set<string>()
  for (const candidate of candidates) {
    addId(candidateIds, candidate)
  }

  for (const id of candidateIds) {
    if (target.has(id)) return true
  }
  return false
}

function hasSlug(target: Set<string>, candidate: unknown): boolean {
  const normalized = normalizeSlug(candidate)
  return Boolean(normalized && target.has(normalized))
}

function extractJoinedCommunityEntries(source: unknown): unknown[] {
  return extractArrayByPaths(source, [
    [],
    ["data"],
    ["data", "data"],
    ["communities"],
    ["data", "communities"],
    ["joinedCommunities"],
    ["data", "joinedCommunities"],
  ])
}

function extractCourseEnrollmentEntries(source: unknown): unknown[] {
  return extractArrayByPaths(source, [
    ["enrollments"],
    ["data", "enrollments"],
    ["data", "data", "enrollments"],
    ["data"],
    [],
  ])
}

function extractChallengeParticipationEntries(source: unknown): unknown[] {
  return extractArrayByPaths(source, [
    ["participations"],
    ["data", "participations"],
    ["data", "data", "participations"],
    ["data"],
    [],
  ])
}

function extractProductPurchaseEntries(source: unknown): unknown[] {
  return extractArrayByPaths(source, [
    ["products"],
    ["data", "products"],
    ["data", "data", "products"],
    ["data"],
    [],
  ])
}

function extractSessionBookingEntries(source: unknown): unknown[] {
  return extractArrayByPaths(source, [
    ["bookings"],
    ["data", "bookings"],
    ["data", "data", "bookings"],
    ["data"],
    [],
  ])
}

function extractEventRegistrationEntries(source: unknown): unknown[] {
  return extractArrayByPaths(source, [
    ["events"],
    ["data", "events"],
    ["data", "data", "events"],
    ["data"],
    [],
  ])
}

function toAccessTargetIds(item: Explore): unknown[] {
  return [item.id, item.mongoId]
}

function hasExplicitAccessByType(
  type: ExploreItemType,
  item: Explore,
  snapshot: ExploreAccessSnapshot,
): boolean {
  const candidates = toAccessTargetIds(item)

  switch (type) {
    case "course":
      return hasAnyId(snapshot.accessibleCourseIds, candidates)
    case "challenge":
      return hasAnyId(snapshot.accessibleChallengeIds, candidates)
    case "product":
      return hasAnyId(snapshot.accessibleProductIds, candidates)
    case "oneToOne":
      return hasAnyId(snapshot.accessibleSessionIds, candidates)
    case "event":
      return hasAnyId(snapshot.accessibleEventIds, candidates)
    default:
      return false
  }
}

export function createEmptyExploreAccessSnapshot(): ExploreAccessSnapshot {
  return {
    joinedCommunityIds: createEmptyIdSet(),
    joinedCommunitySlugs: createEmptyIdSet(),
    accessibleCourseIds: createEmptyIdSet(),
    accessibleChallengeIds: createEmptyIdSet(),
    accessibleProductIds: createEmptyIdSet(),
    accessibleSessionIds: createEmptyIdSet(),
    accessibleEventIds: createEmptyIdSet(),
  }
}

export function buildExploreAccessSnapshot(
  responses: ExploreAccessResponses,
): ExploreAccessSnapshot {
  const snapshot = createEmptyExploreAccessSnapshot()

  const joinedEntries = extractJoinedCommunityEntries(responses.joinedCommunities)
  for (const entry of joinedEntries) {
    addId(snapshot.joinedCommunityIds, entry)
    addId(snapshot.joinedCommunityIds, getPath(entry, ["community"]))
    addId(snapshot.joinedCommunityIds, getPath(entry, ["communityId"]))

    addSlug(snapshot.joinedCommunitySlugs, getPath(entry, ["slug"]))
    addSlug(snapshot.joinedCommunitySlugs, getPath(entry, ["community", "slug"]))
    addSlug(snapshot.joinedCommunitySlugs, getPath(entry, ["communitySlug"]))
  }

  const courseEnrollments = extractCourseEnrollmentEntries(responses.courseEnrollments)
  for (const enrollment of courseEnrollments) {
    addId(snapshot.accessibleCourseIds, getPath(enrollment, ["courseId"]))
    addId(snapshot.accessibleCourseIds, getPath(enrollment, ["course"]))
    addId(snapshot.accessibleCourseIds, getPath(enrollment, ["course", "id"]))
    addId(snapshot.accessibleCourseIds, getPath(enrollment, ["course", "_id"]))
    addId(snapshot.accessibleCourseIds, getPath(enrollment, ["course", "mongoId"]))
  }

  const challengeParticipations = extractChallengeParticipationEntries(
    responses.challengeParticipations,
  )
  for (const participation of challengeParticipations) {
    addId(snapshot.accessibleChallengeIds, getPath(participation, ["challengeId"]))
    addId(snapshot.accessibleChallengeIds, getPath(participation, ["challenge"]))
    addId(snapshot.accessibleChallengeIds, getPath(participation, ["challenge", "id"]))
    addId(snapshot.accessibleChallengeIds, getPath(participation, ["challenge", "_id"]))
  }

  const productPurchases = extractProductPurchaseEntries(responses.productPurchases)
  for (const purchase of productPurchases) {
    addId(snapshot.accessibleProductIds, getPath(purchase, ["productId"]))
    addId(snapshot.accessibleProductIds, getPath(purchase, ["contentId"]))
    addId(snapshot.accessibleProductIds, getPath(purchase, ["product"]))
    addId(snapshot.accessibleProductIds, getPath(purchase, ["product", "id"]))
    addId(snapshot.accessibleProductIds, getPath(purchase, ["product", "_id"]))
    addId(snapshot.accessibleProductIds, getPath(purchase, ["id"]))
    addId(snapshot.accessibleProductIds, getPath(purchase, ["_id"]))
  }

  const sessionBookings = extractSessionBookingEntries(responses.sessionBookings)
  for (const booking of sessionBookings) {
    addId(snapshot.accessibleSessionIds, getPath(booking, ["sessionId"]))
    addId(snapshot.accessibleSessionIds, getPath(booking, ["session"]))
    addId(snapshot.accessibleSessionIds, getPath(booking, ["session", "id"]))
    addId(snapshot.accessibleSessionIds, getPath(booking, ["session", "_id"]))
  }

  const eventRegistrations = extractEventRegistrationEntries(responses.eventRegistrations)
  for (const registration of eventRegistrations) {
    addId(snapshot.accessibleEventIds, getPath(registration, ["eventId"]))
    addId(snapshot.accessibleEventIds, getPath(registration, ["event"]))
    addId(snapshot.accessibleEventIds, getPath(registration, ["event", "id"]))
    addId(snapshot.accessibleEventIds, getPath(registration, ["event", "_id"]))
    addId(snapshot.accessibleEventIds, getPath(registration, ["id"]))
    addId(snapshot.accessibleEventIds, getPath(registration, ["_id"]))
  }

  return snapshot
}

export function enrichExploreItemsWithAccess(
  items: Explore[],
  snapshot: ExploreAccessSnapshot,
): Explore[] {
  return items.map((item) => {
    const type = item.type
    const isMember =
      type === "community"
        ? hasAnyId(snapshot.joinedCommunityIds, [item.id, item.mongoId]) ||
          hasSlug(snapshot.joinedCommunitySlugs, item.slug)
        : hasAnyId(snapshot.joinedCommunityIds, [(item as any).communityId]) ||
          hasSlug(snapshot.joinedCommunitySlugs, item.communitySlug)

    if (type === "community") {
      return {
        ...item,
        isMember,
      }
    }

    const hasContentAccess = isMember && hasExplicitAccessByType(type, item, snapshot)

    return {
      ...item,
      isMember,
      hasContentAccess,
    }
  })
}
