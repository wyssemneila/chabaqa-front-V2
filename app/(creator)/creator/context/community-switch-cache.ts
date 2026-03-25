"use client"

import { api, apiClient } from "@/lib/api"
import { sessionsApi, type CreatorBookingViewModel } from "@/lib/api/sessions.api"

const CACHE_TTL_MS = 30_000
const MAX_COMMUNITIES_PER_KEY = 6

export interface DashboardCorePayload {
  courses: any[]
  challenges: any[]
  sessions: any[]
  posts: any[]
  overview: any | null
}

export interface DashboardGrowthPayload {
  courses: number
  challenges: number
  sessions: number
  revenue: number
  engagement: number
}

export interface SessionsPayload {
  sessions: any[]
  bookings: CreatorBookingViewModel[]
  revenue: number
}

type CachePayloadByKey = {
  dashboardCore: DashboardCorePayload
  dashboardGrowth: DashboardGrowthPayload
  sessions: SessionsPayload
}

type CacheKey = keyof CachePayloadByKey

export interface CacheEntry<T> {
  timestamp: number
  data?: T
  inFlightPromise?: Promise<T>
}

const cacheStore: { [K in CacheKey]: Map<string, CacheEntry<CachePayloadByKey[K]>> } = {
  dashboardCore: new Map(),
  dashboardGrowth: new Map(),
  sessions: new Map(),
}

let creatorIdCache: { value: string | null; timestamp: number; inFlightPromise?: Promise<string | null> } = {
  value: null,
  timestamp: 0,
}

function nowMs(): number {
  return Date.now()
}

function isFresh(timestamp: number): boolean {
  return nowMs() - timestamp <= CACHE_TTL_MS
}

function touchEntry<K extends CacheKey>(key: K, communityId: string, entry: CacheEntry<CachePayloadByKey[K]>) {
  const map = cacheStore[key]
  map.delete(communityId)
  map.set(communityId, entry)
}

function enforceLruLimit<K extends CacheKey>(key: K) {
  const map = cacheStore[key]
  while (map.size > MAX_COMMUNITIES_PER_KEY) {
    const oldestKey = map.keys().next().value
    if (!oldestKey) return
    map.delete(oldestKey)
  }
}

async function getCreatorId(): Promise<string | null> {
  if (creatorIdCache.value && isFresh(creatorIdCache.timestamp)) {
    return creatorIdCache.value
  }

  if (creatorIdCache.inFlightPromise) {
    return creatorIdCache.inFlightPromise
  }

  const promise = (async () => {
    try {
      const me = await api.auth.me().catch(() => null as any)
      const user = me?.data || (me as any)?.user || null
      const userId = (user?._id || user?.id || "").toString() || null
      creatorIdCache = { value: userId, timestamp: nowMs() }
      return userId
    } finally {
      creatorIdCache.inFlightPromise = undefined
    }
  })()

  creatorIdCache.inFlightPromise = promise
  return promise
}

function parseCoursesResponse(response: any): any[] {
  const courses = response?.data?.courses || response?.courses || response?.data || []
  return Array.isArray(courses) ? courses : []
}

function parseChallengesResponse(response: any): any[] {
  const challenges = response?.challenges || response?.data?.challenges || response?.data?.items || response?.items || []
  return Array.isArray(challenges) ? challenges : []
}

function parseSessionsResponse(response: any): any[] {
  const sessions = response?.sessions || response?.data?.sessions || response?.data?.items || response?.items || []
  return Array.isArray(sessions) ? sessions : []
}

function parsePostsResponse(response: any): any[] {
  const posts = response?.data?.posts || response?.posts || response?.data?.items || response?.items || []
  return Array.isArray(posts) ? posts : []
}

function normalizeSessions(rawSessions: any[]): any[] {
  return rawSessions.map((s: any) => ({
    id: s.id || s._id,
    title: s.title,
    description: s.description,
    thumbnail: s.thumbnail || s.image || undefined,
    duration: Number(s.duration ?? 0),
    price: Number(s.price ?? 0),
    isActive: Boolean(s.isActive ?? true),
    category: s.category,
    createdAt: s.createdAt,
  }))
}

function filterByDateRange(items: any[], startDate: Date, endDate: Date, dateField: string = "createdAt"): any[] {
  return (Array.isArray(items) ? items : []).filter((item) => {
    const raw = item?.[dateField]
    if (!raw) return false
    const itemDate = new Date(raw)
    if (Number.isNaN(itemDate.getTime())) return false
    return itemDate >= startDate && itemDate <= endDate
  })
}

async function loadDashboardCoreFromApi(communityId: string): Promise<DashboardCorePayload> {
  const creatorId = await getCreatorId()
  if (!creatorId) {
    return { courses: [], challenges: [], sessions: [], posts: [], overview: null }
  }

  const toDate = new Date()
  const fromDate = new Date(toDate.getTime() - 30 * 24 * 3600 * 1000)

  const [coursesRes, challengesRes, sessionsRes, postsRes, overviewRes] = await Promise.all([
    apiClient.get<any>("/cours/user/created", { limit: 100, communityId }).catch(() => null as any),
    apiClient.get<any>(`/challenges/by-user/${creatorId}`, { type: "created", limit: 50, communityId }).catch(() => null as any),
    apiClient.get<any>("/sessions", { creatorId, limit: 50, communityId }).catch(() => null as any),
    apiClient.get<any>(`/posts/community/${communityId}`, { limit: 50 }).catch(() => null as any),
    api.creatorAnalytics.getOverview({ from: fromDate.toISOString(), to: toDate.toISOString(), communityId }).catch(() => null as any),
  ])

  return {
    courses: parseCoursesResponse(coursesRes),
    challenges: parseChallengesResponse(challengesRes),
    sessions: parseSessionsResponse(sessionsRes),
    posts: parsePostsResponse(postsRes),
    overview: overviewRes?.data || overviewRes || null,
  }
}

async function loadDashboardGrowthFromApi(communityId: string): Promise<DashboardGrowthPayload> {
  const creatorId = await getCreatorId()
  if (!creatorId) {
    return { courses: 0, challenges: 0, sessions: 0, revenue: 0, engagement: 0 }
  }

  const now = new Date()
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  const [prevCoursesRes, prevChallengesRes, prevSessionsRes, prevOverviewRes] = await Promise.all([
    apiClient.get<any>("/cours/user/created", { limit: 1000, communityId }).catch(() => ({ data: { courses: [] } })),
    apiClient.get<any>(`/challenges/by-user/${creatorId}`, { type: "created", limit: 1000, communityId }).catch(() => ({ data: { challenges: [] } })),
    apiClient.get<any>("/sessions", { creatorId, limit: 1000, communityId }).catch(() => ({ data: { sessions: [] } })),
    api.creatorAnalytics.getOverview({ from: prevMonthStart.toISOString(), to: prevMonthEnd.toISOString(), communityId }).catch(() => null as any),
  ])

  const prevCourses = filterByDateRange(parseCoursesResponse(prevCoursesRes), prevMonthStart, prevMonthEnd)
  const prevChallenges = filterByDateRange(parseChallengesResponse(prevChallengesRes), prevMonthStart, prevMonthEnd, "startDate")
  const prevSessions = filterByDateRange(parseSessionsResponse(prevSessionsRes), prevMonthStart, prevMonthEnd)
  const prevOverview = prevOverviewRes?.data || prevOverviewRes || null

  const prevRevenue = Number(prevOverview?.revenue?.total ?? prevOverview?.totalRevenue ?? prevOverview?.salesTotal ?? 0)
  const prevEngagement = Number(prevOverview?.engagementRate ?? prevOverview?.avgEngagement ?? 0)

  return {
    courses: prevCourses.length,
    challenges: prevChallenges.length,
    sessions: prevSessions.length,
    revenue: Number.isFinite(prevRevenue) ? prevRevenue : 0,
    engagement: Number.isFinite(prevEngagement) ? prevEngagement : 0,
  }
}

async function loadSessionsFromApi(communityId: string): Promise<SessionsPayload> {
  const creatorId = await getCreatorId()
  if (!creatorId) {
    return { sessions: [], bookings: [], revenue: 0 }
  }

  const now = new Date()
  const to = now.toISOString()
  const from = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString()

  const [sessionsRes, bookingsResponse, sessAgg] = await Promise.all([
    apiClient.get<any>("/sessions", { communityId, creatorId, limit: 50 }).catch(() => null as any),
    sessionsApi.getCreatorBookings({ page: 1, limit: 200 }).catch(() => null as any),
    api.creatorAnalytics.getSessions({ from, to, communityId }).catch(() => null as any),
  ])

  const rawSessions = parseSessionsResponse(sessionsRes)
  const bySession = sessAgg?.data?.bySession || sessAgg?.bySession || sessAgg?.data?.items || sessAgg?.items || []
  const totalRevenue = (Array.isArray(bySession) ? bySession : []).reduce((sum: number, item: any) => {
    return sum + Number(item?.revenue ?? 0)
  }, 0)

  return {
    sessions: normalizeSessions(rawSessions),
    bookings: Array.isArray(bookingsResponse?.bookings) ? bookingsResponse.bookings : [],
    revenue: Number.isNaN(totalRevenue) ? 0 : totalRevenue,
  }
}

export function getCached<K extends CacheKey>(key: K, communityId: string): CachePayloadByKey[K] | null {
  const entry = cacheStore[key].get(communityId)
  if (!entry?.data) return null
  if (!isFresh(entry.timestamp)) {
    cacheStore[key].delete(communityId)
    return null
  }
  touchEntry(key, communityId, entry)
  return entry.data
}

export function setCached<K extends CacheKey>(key: K, communityId: string, data: CachePayloadByKey[K]): void {
  const entry: CacheEntry<CachePayloadByKey[K]> = {
    timestamp: nowMs(),
    data,
  }
  touchEntry(key, communityId, entry)
  enforceLruLimit(key)
}

export async function getOrLoad<K extends CacheKey>(
  key: K,
  communityId: string,
  loader: () => Promise<CachePayloadByKey[K]>,
  options?: { force?: boolean },
): Promise<CachePayloadByKey[K]> {
  if (!options?.force) {
    const cached = getCached(key, communityId)
    if (cached) return cached
  }

  const existing = cacheStore[key].get(communityId)
  if (existing?.inFlightPromise) {
    return existing.inFlightPromise
  }

  const inFlightPromise = (async () => {
    const data = await loader()
    setCached(key, communityId, data)
    return data
  })()

  touchEntry(key, communityId, {
    timestamp: existing?.timestamp || 0,
    data: existing?.data,
    inFlightPromise,
  })

  try {
    return await inFlightPromise
  } finally {
    const latest = cacheStore[key].get(communityId)
    if (latest?.inFlightPromise === inFlightPromise) {
      cacheStore[key].set(communityId, {
        timestamp: latest.timestamp,
        data: latest.data,
      })
    }
  }
}

export async function loadDashboardCoreCached(communityId: string, options?: { force?: boolean }): Promise<DashboardCorePayload> {
  return getOrLoad("dashboardCore", communityId, () => loadDashboardCoreFromApi(communityId), options)
}

export async function loadDashboardGrowthCached(communityId: string, options?: { force?: boolean }): Promise<DashboardGrowthPayload> {
  return getOrLoad("dashboardGrowth", communityId, () => loadDashboardGrowthFromApi(communityId), options)
}

export async function loadSessionsCached(communityId: string, options?: { force?: boolean }): Promise<SessionsPayload> {
  return getOrLoad("sessions", communityId, () => loadSessionsFromApi(communityId), options)
}

export function invalidateCache<K extends CacheKey>(key: K, communityId?: string) {
  if (!communityId) {
    cacheStore[key].clear()
    return
  }
  cacheStore[key].delete(communityId)
}

export function invalidateCommunityCache(communityId: string) {
  cacheStore.dashboardCore.delete(communityId)
  cacheStore.dashboardGrowth.delete(communityId)
  cacheStore.sessions.delete(communityId)
}

export async function prefetchCommunity(communityId: string): Promise<void> {
  await Promise.allSettled([
    loadDashboardCoreCached(communityId),
    loadSessionsCached(communityId),
  ])
}

export function __resetCommunitySwitchCacheForTests() {
  cacheStore.dashboardCore.clear()
  cacheStore.dashboardGrowth.clear()
  cacheStore.sessions.clear()
  creatorIdCache = { value: null, timestamp: 0 }
}
