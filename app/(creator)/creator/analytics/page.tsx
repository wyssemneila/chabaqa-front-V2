"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import {
  Users,
  MessageSquare,
  TrendingUp,
  Calendar,
  Coins,
  BookOpen,
  Download,
  Crown,
  ArrowUpRight,
  Clock,
  Smartphone,
  Globe,
  RefreshCw,
  Monitor,
  Link2,
  Search,
  Mail,
  Share2,
} from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { useCommunityGuard } from "@/hooks/use-community-guard"
import { PageShell } from "@/components/creator-dashboard"
import { useAuthContext } from "@/app/providers/auth-provider"
import { useRouter } from "next/navigation"
import type {
  CreatorAnalyticsParams,
  CreatorAnalyticsExportScope,
  CreatorFunnelContentType,
  CreatorFunnelResponse,
  CreatorCourseChaptersFunnelResponse,
  CreatorChallengeTasksFunnelResponse,
  CreatorInsightsResponse,
} from "@/lib/api/creator/creator-analytics.api"

type AnalyticsFeature = Exclude<CreatorAnalyticsExportScope, "overview">
type AnalyticsTimeRange = "7d" | "28d" | "90d" | "1y"
type AnalyticsLoadReason = "initial" | "filters" | "interval" | "focus" | "sync"

interface TrendPoint {
  date: string
  views: number
  starts: number
  completes: number
  watchTime: number
}

interface NormalizedOverview {
  views: number
  viewsTotal: number
  starts: number
  completes: number
  chapterCompletes: number
  completions: number
  completionRate: number
  engagementRate: number
  likes: number
  shares: number
  downloads: number
  bookmarks: number
  ratingsCount: number
  watchTime: number
  avgDuration: number
  averageDuration: number
  revenue: { total: number; count: number }
  totalRevenue: number
  salesCount: number
  trend: TrendPoint[]
  [key: string]: any
}

interface FeatureSummary {
  views?: number
  starts?: number
  completes?: number
  chapterCompletes?: number
  likes?: number
  shares?: number
  downloads?: number
  bookmarks?: number
  ratingsCount?: number
  sales?: number
  revenue?: number
  participants?: number
  submissions?: number
  winners?: number
  registrations?: number
  completionRate?: number
  challengeCompletionRate?: number
  attendanceRate?: number
}

interface TopItemRow {
  id?: string
  contentId?: string
  title?: string
  name?: string
  views?: number
  starts?: number
  completes?: number
  chapterCompletes?: number
  completions?: number
  likes?: number
  shares?: number
  downloads?: number
  bookmarks?: number
  ratingsCount?: number
  sales?: number
  revenue?: number
  participants?: number
  submissions?: number
  winners?: number
  completionRate?: number
  [key: string]: any
}

interface DeviceDetailRow {
  userId?: string
  userName?: string
  userEmail?: string
  device?: string
  deviceModel?: string
  os?: string
  browser?: string
  ipAddress?: string
  lastSeenAt?: string
  eventsCount: number
}

interface ReferrerRow {
  source: string
  channel?: string
  domain?: string
  referrer?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  count: number
  share: number
  uniqueUsers?: number
  lastSeenAt?: string
}

interface ReferrersSummary {
  provider?: string
  totalEvents: number
  sources: number
  topChannel?: string
  topSource?: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

const EMPTY_OVERVIEW: NormalizedOverview = {
  views: 0,
  viewsTotal: 0,
  starts: 0,
  completes: 0,
  chapterCompletes: 0,
  completions: 0,
  completionRate: 0,
  engagementRate: 0,
  likes: 0,
  shares: 0,
  downloads: 0,
  bookmarks: 0,
  ratingsCount: 0,
  watchTime: 0,
  avgDuration: 0,
  averageDuration: 0,
  revenue: { total: 0, count: 0 },
  totalRevenue: 0,
  salesCount: 0,
  trend: [],
}

const toNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

const toOptionalNumber = (value: unknown): number | undefined => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const toChangeLabel = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim().length > 0) return value.trim()
  if (typeof value === "number" && Number.isFinite(value)) {
    const sign = value > 0 ? "+" : value < 0 ? "-" : ""
    return `${sign}${Math.abs(value).toFixed(1)}%`
  }
  return undefined
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== "object") return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

const tryParseJsonObject = (input: unknown): Record<string, unknown> | null => {
  if (typeof input !== "string") return null
  const trimmed = input.trim()
  if (!trimmed.startsWith("{")) return null

  const withoutTruncated = trimmed.replace(/\n?\[truncated\]\s*$/i, "").trim()
  const lastBrace = withoutTruncated.lastIndexOf("}")
  if (lastBrace <= 0) return null

  const candidate = withoutTruncated.slice(0, lastBrace + 1)
  try {
    const parsed = JSON.parse(candidate)
    return isPlainObject(parsed) ? parsed : null
  } catch {
    return null
  }
}

const extractJsonStringField = (input: string, fieldName: string): string | null => {
  const needle = `"${fieldName}"`
  const idx = input.indexOf(needle)
  if (idx < 0) return null
  let i = idx + needle.length
  while (i < input.length && /\s/.test(input[i])) i++
  if (input[i] !== ":") return null
  i++
  while (i < input.length && /\s/.test(input[i])) i++
  if (input[i] !== "\"") return null

  const start = i
  i++
  let escaped = false
  while (i < input.length) {
    const ch = input[i]
    if (escaped) {
      escaped = false
      i++
      continue
    }
    if (ch === "\\") {
      escaped = true
      i++
      continue
    }
    if (ch === "\"") {
      const jsonStringLiteral = input.slice(start, i + 1)
      try {
        const decoded = JSON.parse(jsonStringLiteral)
        return typeof decoded === "string" ? decoded : null
      } catch {
        return null
      }
    }
    i++
  }
  return null
}

const toHumanParagraph = (input: unknown): string => {
  if (typeof input !== "string") return ""
  const trimmed = input.trim()
  if (!trimmed) return ""

  const extracted = extractJsonStringField(trimmed, "summary")
  if (extracted && extracted.trim().length > 0) return extracted.trim()

  const withoutTruncated = trimmed.replace(/\n?\[truncated\]\s*$/i, "").trim()
  const stopAt = (() => {
    const markers = ["\"topIssues\"", "\"fixes\"", "\"rewriteSuggestions\"", "\"experiments\""]
    const indices = markers.map((m) => withoutTruncated.indexOf(m)).filter((n) => n > 0)
    return indices.length ? Math.min(...indices) : -1
  })()

  const candidate = (stopAt > 0 ? withoutTruncated.slice(0, stopAt) : withoutTruncated)
    .replace(/^\{+/, "")
    .replace(/,+\s*$/, "")
    .replace(/"summary"\s*:\s*/i, "")
    .trim()

  if (!candidate) return ""

  return candidate
    .replace(/^"+|"+$/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim()
}

const getRangeFromTimeRange = (timeRange: AnalyticsTimeRange): { from: string; to: string } => {
  const now = new Date()
  const to = now.toISOString()
  const fromDate = (() => {
    if (timeRange === "28d") return new Date(now.getTime() - 28 * 24 * 3600 * 1000)
    if (timeRange === "90d") return new Date(now.getTime() - 90 * 24 * 3600 * 1000)
    if (timeRange === "1y") return new Date(now.getTime() - 365 * 24 * 3600 * 1000)
    return new Date(now.getTime() - 7 * 24 * 3600 * 1000)
  })()
  return { from: fromDate.toISOString(), to }
}

const getTopLoader = (feature: AnalyticsFeature) => {
  if (feature === "courses") return api.creatorAnalytics.getCourses
  if (feature === "challenges") return api.creatorAnalytics.getChallenges
  if (feature === "sessions") return api.creatorAnalytics.getSessions
  if (feature === "events") return api.creatorAnalytics.getEvents
  if (feature === "posts") return api.creatorAnalytics.getPosts
  return api.creatorAnalytics.getProducts
}

const featureToContentType = (feature: AnalyticsFeature): CreatorFunnelContentType => {
  if (feature === "courses") return "course"
  if (feature === "challenges") return "challenge"
  if (feature === "sessions") return "session"
  if (feature === "events") return "event"
  if (feature === "products") return "product"
  return "post"
}

const normalizeOverview = (rawOverview: any, timeRange: AnalyticsTimeRange): NormalizedOverview => {
  const totals = rawOverview?.totals || rawOverview || {}
  const revenue = rawOverview?.revenue || { total: 0, count: 0 }
  const trendSource = (() => {
    if (timeRange === "7d") return rawOverview?.trend7d || rawOverview?.trendAll || rawOverview?.trend28d || rawOverview?.trend || []
    if (timeRange === "28d") return rawOverview?.trend28d || rawOverview?.trendAll || rawOverview?.trend7d || rawOverview?.trend || []
    return rawOverview?.trendAll || rawOverview?.trend28d || rawOverview?.trend7d || rawOverview?.trend || []
  })()

  const views = toNumber(totals?.viewsTotal ?? totals?.views ?? totals?.total_views ?? rawOverview?.views)
  const starts = toNumber(totals?.starts ?? totals?.starts_count ?? rawOverview?.starts)
  const completes = toNumber(
    totals?.completes ?? totals?.completions ?? totals?.completions_count ?? rawOverview?.completes ?? rawOverview?.completions
  )
  const chapterCompletes = toNumber(totals?.chapterCompletes ?? rawOverview?.chapterCompletes)
  const likes = toNumber(totals?.likes ?? totals?.likes_count ?? rawOverview?.likes)
  const shares = toNumber(totals?.shares ?? totals?.shares_count ?? rawOverview?.shares)
  const downloads = toNumber(totals?.downloads ?? totals?.downloads_count ?? rawOverview?.downloads)
  const bookmarks = toNumber(totals?.bookmarks ?? totals?.bookmarks_count ?? rawOverview?.bookmarks)
  const ratingsCount = toNumber(totals?.ratingsCount ?? totals?.ratings_count ?? rawOverview?.ratingsCount)
  const watchTime = toNumber(totals?.watchTime ?? rawOverview?.watchTime)
  const interactions = starts + completes + likes + shares + downloads + bookmarks
  const completionRate = toNumber(rawOverview?.completionRate) || (starts > 0 ? (completes / starts) * 100 : 0)
  const engagementRate = toNumber(rawOverview?.engagementRate ?? rawOverview?.avgEngagement) || (views > 0 ? (interactions / views) * 100 : 0)
  const avgDuration = toNumber(rawOverview?.avgDuration ?? rawOverview?.averageDuration) || (starts > 0 ? Math.round((watchTime / starts) / 60) : 0)

  const trend = (Array.isArray(trendSource) ? trendSource : []).map((point: any) => {
    const parsedDate = point?.date ? new Date(point.date) : new Date()
    return {
      date: Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString(),
      views: toNumber(point?.views ?? point?.viewsTotal),
      starts: toNumber(point?.starts),
      completes: toNumber(point?.completes ?? point?.completions),
      watchTime: toNumber(point?.watchTime),
    }
  })

  return {
    ...rawOverview,
    revenue: {
      total: toNumber(revenue?.total ?? rawOverview?.totalRevenue ?? rawOverview?.salesTotal),
      count: toNumber(revenue?.count ?? rawOverview?.salesCount),
    },
    viewsTotal: views,
    views,
    starts,
    completions: completes,
    completes,
    chapterCompletes,
    completionRate,
    engagementRate,
    likes,
    shares,
    downloads,
    bookmarks,
    ratingsCount,
    watchTime,
    avgDuration,
    averageDuration: avgDuration,
    totalRevenue: toNumber(revenue?.total ?? rawOverview?.totalRevenue ?? rawOverview?.salesTotal),
    salesCount: toNumber(revenue?.count ?? rawOverview?.salesCount),
    trend,
  }
}

const isOverviewEffectivelyEmpty = (overview: NormalizedOverview | null): boolean => {
  if (!overview) return true
  return overview.views === 0 && overview.starts === 0 && overview.completes === 0 && overview.trend.length === 0
}

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const formatDeviceLastSeen = (value?: string): string => {
  if (!value) return "N/A"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "N/A"
  return parsed.toLocaleString()
}

const formatDeviceUserLabel = (row: DeviceDetailRow): string => {
  if (row.userName) return row.userName
  if (row.userEmail) return row.userEmail
  if (row.userId) return `User ${row.userId.slice(-6)}`
  return "Unknown user"
}

const deriveReferrerChannel = (value: unknown): string => {
  const channel = toOptionalString(value)?.toLowerCase()
  if (channel) return channel
  return "referral"
}

const formatReferrerLastSeen = (value?: string): string => {
  if (!value) return "N/A"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "N/A"
  return parsed.toLocaleString()
}

const getReferrerChannelMeta = (channel?: string) => {
  const normalized = deriveReferrerChannel(channel)
  if (normalized === "search") return { label: "Search", Icon: Search, classes: "bg-emerald-50 text-emerald-700" }
  if (normalized === "social") return { label: "Social", Icon: Share2, classes: "bg-fuchsia-50 text-fuchsia-700" }
  if (normalized === "email") return { label: "Email", Icon: Mail, classes: "bg-amber-50 text-amber-700" }
  if (normalized === "paid") return { label: "Paid", Icon: Coins, classes: "bg-rose-50 text-rose-700" }
  if (normalized === "direct") return { label: "Direct", Icon: Globe, classes: "bg-sky-50 text-sky-700" }
  return { label: "Referral", Icon: Link2, classes: "bg-slate-100 text-slate-700" }
}

const resolveTopItems = (response: any): any[] => {
  const list =
    response?.data?.items
    || response?.data?.byCourse
    || response?.data?.byChallenge
    || response?.data?.bySession
    || response?.data?.byEvent
    || response?.data?.byPost
    || response?.data?.byProduct
    || response?.items
    || response?.byCourse
    || response?.byChallenge
    || response?.bySession
    || response?.byEvent
    || response?.byPost
    || response?.byProduct
    || []

  return Array.isArray(list) ? list : []
}

const normalizeTopItems = (items: any[]): TopItemRow[] => {
  return items.map((item: any) => ({
    ...item,
    views: toNumber(item?.views),
    starts: item?.starts == null ? undefined : toNumber(item?.starts),
    completes: item?.completes == null && item?.completions == null ? undefined : toNumber(item?.completes ?? item?.completions),
    chapterCompletes: item?.chapterCompletes == null ? undefined : toNumber(item?.chapterCompletes),
    likes: toNumber(item?.likes),
    shares: toNumber(item?.shares),
    downloads: toNumber(item?.downloads),
    bookmarks: toNumber(item?.bookmarks),
    ratingsCount: toNumber(item?.ratingsCount),
    sales: toNumber(item?.sales),
    revenue: toNumber(item?.revenue),
    participants: item?.participants == null ? undefined : toNumber(item?.participants),
    submissions: item?.submissions == null ? undefined : toNumber(item?.submissions),
    winners: item?.winners == null ? undefined : toNumber(item?.winners),
    completionRate: item?.completionRate == null ? undefined : toNumber(item?.completionRate),
  }))
}

const summarizeFeature = (items: TopItemRow[], baseOverview: NormalizedOverview | null): FeatureSummary | null => {
  if (!items.length) return null

  const totals = items.reduce<{
    views: number
    starts: number
    completes: number
    chapterCompletes: number
    likes: number
    shares: number
    downloads: number
    bookmarks: number
    ratingsCount: number
    sales: number
    revenue: number
    participants: number
    submissions: number
    winners: number
    registrations: number
  }>(
    (acc, item) => {
      acc.views += toNumber(item.views)
      acc.starts += toNumber(item.starts)
      acc.completes += toNumber(item.completes)
      acc.chapterCompletes += toNumber(item.chapterCompletes)
      acc.likes += toNumber(item.likes)
      acc.shares += toNumber(item.shares)
      acc.downloads += toNumber(item.downloads)
      acc.bookmarks += toNumber(item.bookmarks)
      acc.ratingsCount += toNumber(item.ratingsCount)
      acc.sales += toNumber(item.sales)
      acc.revenue += toNumber(item.revenue)
      acc.participants += toNumber(item.participants ?? item.starts)
      acc.submissions += toNumber(item.submissions ?? item.completes)
      acc.winners += toNumber(item.winners)
      acc.registrations += toNumber(item.starts)
      return acc
    },
    {
      views: 0,
      starts: 0,
      completes: 0,
      chapterCompletes: 0,
      likes: 0,
      shares: 0,
      downloads: 0,
      bookmarks: 0,
      ratingsCount: 0,
      sales: 0,
      revenue: 0,
      participants: 0,
      submissions: 0,
      winners: 0,
      registrations: 0,
    },
  )

  const hasStarts = items.some((item) => item.starts != null)
  const hasCompletes = items.some((item) => item.completes != null)
  const starts = hasStarts ? totals.starts : undefined
  const completes = hasCompletes ? totals.completes : undefined
  const completionRate = starts != null && completes != null && starts > 0
    ? (completes / starts) * 100
    : baseOverview?.completionRate

  const totalViews = toNumber(totals.views)
  return {
    views: totalViews,
    starts,
    completes,
    chapterCompletes: totals.chapterCompletes,
    likes: totals.likes,
    shares: totals.shares,
    downloads: totals.downloads,
    bookmarks: totals.bookmarks,
    ratingsCount: totals.ratingsCount,
    sales: totals.sales,
    revenue: totals.revenue,
    participants: totals.participants,
    submissions: totals.submissions,
    winners: totals.winners,
    registrations: totals.registrations,
    completionRate,
    challengeCompletionRate: completionRate,
    attendanceRate: starts != null && totalViews > 0 ? (starts / totalViews) * 100 : undefined,
  }
}

export default function CommunityAnalyticsPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuthContext()
  const { toast } = useToast()
  const { guard, selectedCommunityId, selectedCommunity, setSelectedCommunityId, communities, isLoading: communityLoading } = useCommunityGuard()
  const [selectedFeature, setSelectedFeature] = useState<AnalyticsFeature>("courses")
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>("7d")
  const [baseOverview, setBaseOverview] = useState<NormalizedOverview | null>(null)
  const [featureSummary, setFeatureSummary] = useState<FeatureSummary | null>(null)
  const [membershipData, setMembershipData] = useState<any[]>([])
  const [engagementData, setEngagementData] = useState<any[]>([])
  const [devicesData, setDevicesData] = useState<Array<{ name: string; value: number }>>([])
  const [deviceDetails, setDeviceDetails] = useState<DeviceDetailRow[]>([])
  const [referrersData, setReferrersData] = useState<ReferrerRow[]>([])
  const [referrersSummary, setReferrersSummary] = useState<ReferrersSummary | null>(null)
  const [topItems, setTopItems] = useState<TopItemRow[]>([])
  const [detailsTab, setDetailsTab] = useState<"overview" | "details">("overview")
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [selectedItemTitle, setSelectedItemTitle] = useState<string | null>(null)
  const [funnelData, setFunnelData] = useState<CreatorFunnelResponse | null>(null)
  const [stepFunnelData, setStepFunnelData] = useState<
    CreatorCourseChaptersFunnelResponse | CreatorChallengeTasksFunnelResponse | null
  >(null)
  const [focusStepId, setFocusStepId] = useState<string | null>(null)
  const [aiInsights, setAiInsights] = useState<CreatorInsightsResponse | null>(null)
  const [aiInsightsMeta, setAiInsightsMeta] = useState<{ cached?: boolean; model?: string } | null>(null)
  const [aiTab, setAiTab] = useState<"summary" | "issues" | "fixes" | "rewrites" | "experiments" | "raw">("summary")
  const [isFunnelLoading, setIsFunnelLoading] = useState(false)
  const [isInsightsLoading, setIsInsightsLoading] = useState(false)
  const [funnelError, setFunnelError] = useState<string | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSupplementalLoading, setIsSupplementalLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  const requestIdRef = useRef(0)
  const hasLoadedOnceRef = useRef(false)
  const autoBackfillAttemptedRef = useRef<string | null>(null)
  const lastErrorToastRef = useRef<{ message: string; at: number } | null>(null)

  const resetAnalyticsState = useCallback(() => {
    setBaseOverview(null)
    setFeatureSummary(null)
    setMembershipData([])
    setEngagementData([])
    setDevicesData([])
    setDeviceDetails([])
    setReferrersData([])
    setReferrersSummary(null)
    setTopItems([])
    setDetailsTab("overview")
    setSelectedItemId(null)
    setSelectedItemTitle(null)
    setFunnelData(null)
    setStepFunnelData(null)
    setFocusStepId(null)
    setAiInsights(null)
    setAiInsightsMeta(null)
    setAiTab("summary")
    setFunnelError(null)
    setLastUpdatedAt(null)
    setIsSupplementalLoading(false)
  }, [])

  const focusStepTitle = useMemo(() => {
    if (!focusStepId) return null
    const items = (stepFunnelData as any)?.items
    if (!Array.isArray(items)) return null
    const found = items.find((it: any) => String(it?.stepId) === String(focusStepId))
    const title = found?.stepTitle
    return typeof title === "string" && title.trim().length > 0 ? title.trim() : null
  }, [focusStepId, stepFunnelData])

  const copyToClipboard = useCallback(
    async (text: string, successMessage: string = "Copied to clipboard") => {
      try {
        await navigator.clipboard.writeText(text)
        toast({ title: successMessage })
      } catch (error) {
        console.error("[Analytics] clipboard copy failed:", error)
        toast({ variant: "destructive", title: "Copy failed", description: "Your browser blocked clipboard access." })
      }
    },
    [toast],
  )

  useEffect(() => {
    if (!topItems || topItems.length === 0) {
      setSelectedItemId(null)
      setSelectedItemTitle(null)
      setFunnelData(null)
      setStepFunnelData(null)
      setFocusStepId(null)
      setAiInsights(null)
      setAiInsightsMeta(null)
      setAiTab("summary")
      setFunnelError(null)
      return
    }

    const resolveRowId = (row: TopItemRow) => String(row.contentId || row.id || "").trim()
    const resolveRowTitle = (row: TopItemRow) => String(row.title || row.name || "").trim()
    const ids = topItems.map(resolveRowId).filter(Boolean)
    const isValidSelection = selectedItemId ? ids.includes(selectedItemId) : false

    if (!isValidSelection) {
      const firstRow = topItems.find((row) => Boolean(resolveRowId(row)))
      if (!firstRow) return
      setSelectedItemId(resolveRowId(firstRow))
      setSelectedItemTitle(resolveRowTitle(firstRow) || null)
      setFunnelData(null)
      setStepFunnelData(null)
      setFocusStepId(null)
      setAiInsights(null)
      setFunnelError(null)
    }
  }, [selectedFeature, selectedItemId, topItems])

  const showLoadErrorToast = useCallback((message: string) => {
    const now = Date.now()
    const lastToast = lastErrorToastRef.current
    if (lastToast && lastToast.message === message && now - lastToast.at < 45_000) {
      return
    }
    lastErrorToastRef.current = { message, at: now }
    toast({
      variant: "destructive",
      title: "Analytics refresh failed",
      description: message,
    })
  }, [toast])

  const runAnalyticsLoad = useCallback(async (options?: {
    reason?: AnalyticsLoadReason
    allowAutoBackfill?: boolean
    silentErrorToast?: boolean
  }) => {
    const reason = options?.reason || "filters"
    const allowAutoBackfill = options?.allowAutoBackfill ?? true
    const silentErrorToast = options?.silentErrorToast ?? false

    if (!selectedCommunityId || !isAuthenticated || authLoading || communityLoading) return

    const selectedCommunityExists = communities.some((community: any) => {
      const id = (community?.id || community?._id || "").toString()
      return id === selectedCommunityId
    })

    if (!selectedCommunityExists) {
      requestIdRef.current += 1
      hasLoadedOnceRef.current = false
      setHasLoadedOnce(false)
      setIsInitialLoading(false)
      setIsRefreshing(false)
      resetAnalyticsState()
      setLoadError("Please reselect a community to load analytics.")
      if (!silentErrorToast) {
        toast({
          variant: "destructive",
          title: "Invalid community selection",
          description: "Please reselect a community to load analytics.",
        })
      }
      return
    }

    const requestId = ++requestIdRef.current
    const isBlockingLoad = !hasLoadedOnceRef.current && reason === "initial"

    if (isBlockingLoad) {
      setIsInitialLoading(true)
    } else {
      setIsRefreshing(true)
    }

    const { from, to } = getRangeFromTimeRange(timeRange)
    const analyticsParams: CreatorAnalyticsParams = {
      from,
      to,
      communityId: selectedCommunityId,
      communitySlug: selectedCommunity?.slug,
    }

    const fetchCore = async () => {
      const topLoader = getTopLoader(selectedFeature)
      const [overviewRes, topRes] = await Promise.all([
        api.creatorAnalytics.getOverview(analyticsParams),
        topLoader(analyticsParams).catch(() => null as any),
      ])

      return { overviewRes, topRes }
    }

    const fetchSupplemental = async () => {
      const [devicesRes, referrersRes] = await Promise.all([
        api.creatorAnalytics.getDevices(analyticsParams).catch(() => null as any),
        api.creatorAnalytics.getReferrers(analyticsParams).catch(() => null as any),
      ])

      return { devicesRes, referrersRes }
    }

    try {
      setIsSupplementalLoading(true)
      const supplementalPromise = fetchSupplemental()
      const payload = await fetchCore()
      if (requestId !== requestIdRef.current) return

      const rawOverview = (payload.overviewRes as any)?.data || payload.overviewRes || null
      const normalizedOverview = rawOverview ? normalizeOverview(rawOverview, timeRange) : null

      const normalizedTopItems = normalizeTopItems(resolveTopItems(payload.topRes))
      const nextFeatureSummary = summarizeFeature(normalizedTopItems, normalizedOverview)
      const trend = normalizedOverview?.trend || []

      if (requestId !== requestIdRef.current) return

      setBaseOverview(normalizedOverview)
      setFeatureSummary(nextFeatureSummary)
      setTopItems(normalizedTopItems.slice(0, 10))
      setMembershipData(
        trend.map((point: TrendPoint) => ({
          month: new Date(point.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          views: point.views,
          completes: point.completes,
        })),
      )
      setEngagementData(
        trend.map((point: TrendPoint) => ({
          day: new Date(point.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          starts: point.starts,
          completes: point.completes,
        })),
      )
      setLoadError(null)
      setLastUpdatedAt(new Date().toISOString())
      if (!hasLoadedOnceRef.current) {
        hasLoadedOnceRef.current = true
        setHasLoadedOnce(true)
      }

      void supplementalPromise
        .then((supplementalPayload) => {
          if (requestId !== requestIdRef.current) return

          const devicesRows = (supplementalPayload.devicesRes as any)?.data?.rows || (supplementalPayload.devicesRes as any)?.rows || []
          const deviceDetailsRows = (supplementalPayload.devicesRes as any)?.data?.details || (supplementalPayload.devicesRes as any)?.details || []
          const referrersPayload = (supplementalPayload.referrersRes as any)?.data || supplementalPayload.referrersRes || {}
          const referrersRows = Array.isArray(referrersPayload) ? referrersPayload : (referrersPayload as any)?.rows || []
          const referrersSummaryRaw = Array.isArray(referrersPayload) ? null : (referrersPayload as any)?.summary || null
          const hasTrackingSignals = (Array.isArray(devicesRows) && devicesRows.length > 0)
            || (Array.isArray(referrersRows) && referrersRows.length > 0)

          setDevicesData(
            (Array.isArray(devicesRows) ? devicesRows : []).map((device: any) => ({
              name: device?.device || "Unknown",
              value: toNumber(device?.count),
            })),
          )
          setDeviceDetails(
            (Array.isArray(deviceDetailsRows) ? deviceDetailsRows : []).map((entry: any) => ({
              userId: toOptionalString(
                typeof entry?.userId === "string" ? entry.userId : entry?.userId?.toString?.(),
              ),
              userName: toOptionalString(entry?.userName),
              userEmail: toOptionalString(entry?.userEmail),
              device: toOptionalString(entry?.device),
              deviceModel: toOptionalString(entry?.deviceModel),
              os: toOptionalString(entry?.os),
              browser: toOptionalString(entry?.browser),
              ipAddress: toOptionalString(entry?.ipAddress),
              lastSeenAt: toOptionalString(entry?.lastSeenAt),
              eventsCount: toNumber(entry?.eventsCount),
            })),
          )
          const normalizedReferrerRows = (Array.isArray(referrersRows) ? referrersRows : [])
            .map((referrer: any) => ({
              source: toOptionalString(referrer?.source) || toOptionalString(referrer?.referrer) || "Direct",
              channel: deriveReferrerChannel(referrer?.channel),
              domain: toOptionalString(referrer?.domain),
              referrer: toOptionalString(referrer?.referrer),
              utm_source: toOptionalString(referrer?.utm_source),
              utm_medium: toOptionalString(referrer?.utm_medium),
              utm_campaign: toOptionalString(referrer?.utm_campaign),
              count: toNumber(referrer?.count),
              uniqueUsers: toOptionalNumber(referrer?.uniqueUsers),
              lastSeenAt: toOptionalString(referrer?.lastSeenAt),
              share: 0,
            }))
            .filter((row) => row.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 50)

          const rowsTotalEvents = normalizedReferrerRows.reduce((acc, row) => acc + row.count, 0)
          const summaryTotalEvents = toNumber(referrersSummaryRaw?.totalEvents) || rowsTotalEvents
          const denominator = summaryTotalEvents > 0 ? summaryTotalEvents : rowsTotalEvents

          const referrerRowsWithShare = normalizedReferrerRows.map((row) => ({
            ...row,
            share: denominator > 0 ? (row.count / denominator) * 100 : 0,
          }))

          const resolvedTopChannel = toOptionalString(referrersSummaryRaw?.topChannel)
            || (() => {
              const channelTotals = referrerRowsWithShare.reduce<Record<string, number>>((acc, row) => {
                acc[row.channel] = (acc[row.channel] || 0) + row.count
                return acc
              }, {})
              return Object.entries(channelTotals).sort((a, b) => b[1] - a[1])[0]?.[0]
            })()

          const referrerSummary: ReferrersSummary = {
            provider: toOptionalString(referrersSummaryRaw?.provider) || undefined,
            totalEvents: summaryTotalEvents,
            sources: toNumber(referrersSummaryRaw?.sources) || referrerRowsWithShare.length,
            topChannel: resolvedTopChannel || undefined,
            topSource: toOptionalString(referrersSummaryRaw?.topSource) || referrerRowsWithShare[0]?.source,
          }

          setReferrersData(referrerRowsWithShare)
          setReferrersSummary(referrerSummary)

          if (allowAutoBackfill && normalizedOverview && hasTrackingSignals && isOverviewEffectivelyEmpty(normalizedOverview)) {
            const backfillKey = `${selectedCommunityId}:${selectedFeature}:${timeRange}`
            if (autoBackfillAttemptedRef.current !== backfillKey) {
              autoBackfillAttemptedRef.current = backfillKey
              void api.creatorAnalytics
                .backfill(90)
                .then(() => {
                  if (requestId !== requestIdRef.current) return
                  void runAnalyticsLoad({ reason: "sync", allowAutoBackfill: false, silentErrorToast: true })
                })
                .catch(() => null as any)
            }
          }
        })
        .catch(() => null as any)
        .finally(() => {
          if (requestId === requestIdRef.current) {
            setIsSupplementalLoading(false)
          }
        })
    } catch (error: any) {
      if (requestId !== requestIdRef.current) return
      const message = typeof error?.message === "string" ? error.message : "Failed to load analytics data."
      setLoadError(message)
      setIsSupplementalLoading(false)
      if (!hasLoadedOnceRef.current) {
        resetAnalyticsState()
      }
      if (!silentErrorToast) {
        showLoadErrorToast(message)
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsInitialLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [
    selectedCommunityId,
    selectedCommunity?.slug,
    selectedFeature,
    timeRange,
    communities,
    isAuthenticated,
    authLoading,
    communityLoading,
    resetAnalyticsState,
    showLoadErrorToast,
    toast,
  ])

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin?redirect=/creator/analytics")
    }
  }, [authLoading, isAuthenticated, router])

  // Reset state if no selected community is available
  useEffect(() => {
    if (communityLoading || authLoading) return
    if (selectedCommunityId) return

    requestIdRef.current += 1
    hasLoadedOnceRef.current = false
    setHasLoadedOnce(false)
    setIsInitialLoading(false)
    setIsRefreshing(false)
    setLoadError(null)
    resetAnalyticsState()
  }, [selectedCommunityId, communityLoading, authLoading, resetAnalyticsState])

  // Load analytics on filter/community changes with request guards
  useEffect(() => {
    if (communityLoading || authLoading || !isAuthenticated || !selectedCommunityId) return
    const reason: AnalyticsLoadReason = hasLoadedOnceRef.current ? "filters" : "initial"
    void runAnalyticsLoad({ reason })
  }, [
    selectedCommunityId,
    selectedCommunity?.slug,
    selectedFeature,
    timeRange,
    isAuthenticated,
    authLoading,
    communityLoading,
    runAnalyticsLoad,
  ])

  // Background auto-refresh every 60s
  useEffect(() => {
    if (!hasLoadedOnce || !selectedCommunityId || communityLoading || authLoading || !isAuthenticated) return
    const intervalId = window.setInterval(() => {
      void runAnalyticsLoad({ reason: "interval" })
    }, 60_000)
    return () => window.clearInterval(intervalId)
  }, [hasLoadedOnce, selectedCommunityId, communityLoading, authLoading, isAuthenticated, runAnalyticsLoad])

  // Refresh when tab/window regains focus
  useEffect(() => {
    if (!hasLoadedOnce || !selectedCommunityId || communityLoading || authLoading || !isAuthenticated) return

    const onFocus = () => {
      if (document.visibilityState === "visible") {
        void runAnalyticsLoad({ reason: "focus" })
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void runAnalyticsLoad({ reason: "focus" })
      }
    }

    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [hasLoadedOnce, selectedCommunityId, communityLoading, authLoading, isAuthenticated, runAnalyticsLoad])

  const handleSyncAnalytics = useCallback(async (days = 90) => {
    if (!selectedCommunityId) return

    try {
      setIsSyncing(true)
      toast({
        title: "Syncing analytics",
        description: "We're updating your community statistics. This may take a moment.",
      })
      await api.creatorAnalytics.backfill(days)
      await runAnalyticsLoad({ reason: "sync", allowAutoBackfill: false, silentErrorToast: true })
      toast({
        title: "Analytics synced",
        description: "Community analytics have been refreshed.",
      })
    } catch (error) {
      console.error("[Analytics] Sync failed:", error)
      toast({
        variant: "destructive",
        title: "Sync failed",
        description: "Could not synchronize analytics data. Please try again later.",
      })
    } finally {
      setIsSyncing(false)
    }
  }, [selectedCommunityId, toast, runAnalyticsLoad])

  const handleExportCsv = useCallback(async () => {
    if (!selectedCommunityId) return

    try {
      setIsExporting(true)
      const { from, to } = getRangeFromTimeRange(timeRange)
      const response = await api.creatorAnalytics.exportCsv({
        scope: selectedFeature,
        from,
        to,
        communityId: selectedCommunityId,
        communitySlug: selectedCommunity?.slug,
      })

      const payload = (response as any)?.data || response || {}
      const csv = typeof payload?.csv === "string" ? payload.csv : ""
      if (!csv) {
        throw new Error("Export returned an empty CSV payload.")
      }

      const filename = typeof payload?.filename === "string" && payload.filename.length > 0
        ? payload.filename
        : `${selectedFeature}-${timeRange}-${new Date().toISOString().slice(0, 10)}.csv`

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)

      toast({
        title: "Export complete",
        description: "Your CSV download has started.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: typeof error?.message === "string" ? error.message : "Could not export analytics CSV.",
      })
    } finally {
      setIsExporting(false)
    }
  }, [selectedFeature, selectedCommunityId, selectedCommunity?.slug, timeRange, toast])

  const overview = useMemo(() => {
    const base = baseOverview || EMPTY_OVERVIEW
    if (!featureSummary) return base

    const merged = {
      ...base,
      views: featureSummary.views ?? base.views,
      viewsTotal: featureSummary.views ?? base.viewsTotal,
      starts: featureSummary.starts ?? base.starts,
      completes: featureSummary.completes ?? base.completes,
      chapterCompletes: featureSummary.chapterCompletes ?? base.chapterCompletes,
      completions: featureSummary.completes ?? base.completions,
      likes: featureSummary.likes ?? base.likes,
      shares: featureSummary.shares ?? base.shares,
      downloads: featureSummary.downloads ?? base.downloads,
      bookmarks: featureSummary.bookmarks ?? base.bookmarks,
      ratingsCount: featureSummary.ratingsCount ?? base.ratingsCount,
      participants: featureSummary.participants ?? base.participants ?? base.starts,
      submissions: featureSummary.submissions ?? base.submissions ?? base.completes,
      winners: featureSummary.winners ?? base.winners ?? 0,
      registrations: featureSummary.registrations ?? base.registrations ?? base.starts,
      completionRate: featureSummary.completionRate ?? base.completionRate,
      challengeCompletionRate: featureSummary.challengeCompletionRate ?? featureSummary.completionRate ?? base.challengeCompletionRate ?? base.completionRate,
      attendanceRate: featureSummary.attendanceRate ?? base.attendanceRate ?? 0,
      sales: featureSummary.sales ?? base.sales ?? 0,
      salesTotal: featureSummary.revenue ?? base.salesTotal ?? base.totalRevenue,
      totalRevenue: featureSummary.revenue ?? base.totalRevenue,
    } as any

    return merged
  }, [baseOverview, featureSummary])

  const metrics = useMemo(() => {
    const o = overview || EMPTY_OVERVIEW
    const change = (value: unknown) => toChangeLabel(value)

    if (selectedFeature === "courses") {
      return [
        { title: "Views", value: toNumber(o.viewsTotal ?? o.views).toLocaleString(), change: change(o.viewsChange), icon: Users },
        { title: "Starts", value: toNumber(o.starts).toLocaleString(), change: change(o.startsChange), icon: ArrowUpRight },
        { title: "Course Completes", value: toNumber(o.completions ?? o.completes).toLocaleString(), change: change(o.completionsChange), icon: BookOpen },
        { title: "Completion Rate", value: `${Math.round(toNumber(o.completionRate))}%`, change: change(o.completionRateChange), icon: TrendingUp },
      ]
    }
    if (selectedFeature === "challenges") {
      return [
        { title: "Active Participants", value: toNumber(o.participants ?? o.starts).toLocaleString(), change: change(o.participantsChange), icon: Users },
        { title: "Completion Rate", value: `${Math.round(toNumber(o.challengeCompletionRate ?? o.completionRate))}%`, change: change(o.challengeCompletionChange), icon: TrendingUp },
        { title: "Submissions", value: toNumber(o.submissions ?? o.completes).toLocaleString(), change: change(o.submissionsChange), icon: MessageSquare },
        { title: "Winners", value: toNumber(o.winners).toLocaleString(), change: change(o.winnersChange), icon: Crown },
      ]
    }
    if (selectedFeature === "events") {
      const eventEngagementScore = toOptionalNumber(o.eventEngagementScore)
      return [
        { title: "Total Registrations", value: toNumber(o.registrations).toLocaleString(), change: change(o.registrationsChange), icon: Calendar },
        { title: "Attendance Rate", value: `${Math.round(toNumber(o.attendanceRate))}%`, change: change(o.attendanceChange), icon: Users },
        { title: "Engagement Score", value: eventEngagementScore == null ? "N/A" : eventEngagementScore.toFixed(1), change: change(o.eventEngagementChange), icon: TrendingUp },
        { title: "Avg Duration", value: `${toNumber(o.avgDurationHours ?? o.averageDuration)}h`, change: change(o.durationChange), icon: Clock },
      ]
    }
    if (selectedFeature === "sessions") {
      return [
        { title: "Views", value: toNumber(o.views).toLocaleString(), change: change(o.viewsChange), icon: Users },
        { title: "Starts", value: toNumber(o.starts).toLocaleString(), change: change(o.startsChange), icon: ArrowUpRight },
        { title: "Completes", value: toNumber(o.completes).toLocaleString(), change: change(o.completionsChange), icon: BookOpen },
        { title: "Completion Rate", value: `${Math.round(toNumber(o.completionRate))}%`, change: change(o.completionRateChange), icon: TrendingUp },
      ]
    }
    if (selectedFeature === "posts") {
      return [
        { title: "Views", value: toNumber(o.views).toLocaleString(), change: change(o.viewsChange), icon: Users },
        { title: "Likes", value: toNumber(o.likes).toLocaleString(), change: change(o.likesChange), icon: MessageSquare },
        { title: "Shares", value: toNumber(o.shares).toLocaleString(), change: change(o.sharesChange), icon: TrendingUp },
        { title: "Bookmarks", value: toNumber(o.bookmarks).toLocaleString(), change: change(o.bookmarksChange), icon: BookOpen },
      ]
    }
    const customerRating = toOptionalNumber(o.customerRating)
    return [
      { title: "Total Sales", value: `${toNumber(o.salesTotal ?? o.totalRevenue).toLocaleString()} TND`, change: change(o.salesChange), icon: Coins },
      { title: "Orders", value: toNumber(o.orders ?? o.sales).toLocaleString(), change: change(o.ordersChange), icon: TrendingUp },
      { title: "Customer Rating", value: customerRating == null ? "N/A" : customerRating.toFixed(1), change: change(o.customerRatingChange), icon: MessageSquare },
      { title: "Revenue", value: `${toNumber(o.totalRevenue ?? o.revenue?.total).toLocaleString()} TND`, change: change(o.revenueChange), icon: Coins },
    ]
  }, [overview, selectedFeature])

  const selectedContentType = useMemo(() => featureToContentType(selectedFeature), [selectedFeature])

  const loadSelectedFunnel = useCallback(async () => {
    if (!selectedItemId || !selectedCommunityId || !isAuthenticated) {
      setFunnelData(null)
      setStepFunnelData(null)
      setFunnelError(null)
      return
    }

    const { from, to } = getRangeFromTimeRange(timeRange)
    setIsFunnelLoading(true)
    setFunnelError(null)
    setAiInsights(null)

    try {
      const funnelResponse = await api.creatorAnalytics.getFunnel({
        contentType: selectedContentType,
        contentId: selectedItemId,
        from,
        to,
        communityId: selectedCommunityId,
        communitySlug: selectedCommunity?.slug,
      } as any)

      const funnelPayload = (funnelResponse as any)?.data || funnelResponse
      setFunnelData(funnelPayload)

      if (selectedContentType === "course") {
        const chaptersResponse = await api.creatorAnalytics.getCourseChaptersFunnel(selectedItemId, {
          from,
          to,
          communityId: selectedCommunityId,
          communitySlug: selectedCommunity?.slug,
        })
        const chaptersPayload = (chaptersResponse as any)?.data || chaptersResponse
        setStepFunnelData(chaptersPayload)
        const worst = chaptersPayload?.dropOff?.worstStep?.stepId
        setFocusStepId((prev) => prev || (worst ? String(worst) : null))
      } else if (selectedContentType === "challenge") {
        const tasksResponse = await api.creatorAnalytics.getChallengeTasksFunnel(selectedItemId, {
          from,
          to,
          communityId: selectedCommunityId,
          communitySlug: selectedCommunity?.slug,
        })
        const tasksPayload = (tasksResponse as any)?.data || tasksResponse
        setStepFunnelData(tasksPayload)
        const worst = tasksPayload?.dropOff?.worstStep?.stepId
        setFocusStepId((prev) => prev || (worst ? String(worst) : null))
      } else {
        setStepFunnelData(null)
        setFocusStepId(null)
      }
    } catch (error: any) {
      console.error("[Analytics] funnel load failed:", error)
      setFunnelError(typeof error?.message === "string" ? error.message : "Failed to load funnel.")
      setFunnelData(null)
      setStepFunnelData(null)
    } finally {
      setIsFunnelLoading(false)
    }
  }, [isAuthenticated, selectedCommunityId, selectedCommunity?.slug, selectedContentType, selectedItemId, timeRange])

  useEffect(() => {
    void loadSelectedFunnel()
  }, [loadSelectedFunnel])

  const handleGenerateInsights = useCallback(async () => {
    if (!selectedItemId || !selectedCommunityId) return
    const { from, to } = getRangeFromTimeRange(timeRange)

    setIsInsightsLoading(true)
    try {
      const response = await api.creatorAnalytics.generateInsights({
        contentType: selectedContentType,
        contentId: selectedItemId,
        from,
        to,
        communityId: selectedCommunityId,
        communitySlug: selectedCommunity?.slug,
        focusStepId: focusStepId || undefined,
      })
      const payload = (response as any)?.data || response
      const data = payload?.data || payload
      setAiInsights(data)
      setAiInsightsMeta({ cached: Boolean(payload?.cached), model: typeof payload?.model === "string" ? payload.model : undefined })
      setAiTab("summary")
      toast({
        title: "AI insights ready",
        description: payload?.cached ? "Loaded from cache." : "Generated from your latest metrics.",
      })
    } catch (error: any) {
      console.error("[Analytics] insights failed:", error)
      toast({
        variant: "destructive",
        title: "AI insights failed",
        description: typeof error?.message === "string" ? error.message : "Could not generate insights.",
      })
    } finally {
      setIsInsightsLoading(false)
    }
  }, [focusStepId, selectedCommunityId, selectedCommunity?.slug, selectedContentType, selectedItemId, timeRange, toast])

  if (communityLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <p className="text-gray-600">Loading communities...</p>
      </div>
    )
  }

  if (!selectedCommunityId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Select a community</h2>
          <p className="text-gray-600">Choose a community to view its analytics.</p>
        </div>
      </div>
    )
  }

  if (isInitialLoading && !hasLoadedOnce) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Community Analytics</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Loading analytics...</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[0, 1, 2, 3].map((card) => (
              <div key={card} className="h-32 rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
            {[0, 1].map((chart) => (
              <div key={chart} className="h-[360px] rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (guard) return guard

  return (
    <PageShell className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Community Analytics</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
                Track and analyze your community performance
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
              <Select value={selectedCommunityId || ""} onValueChange={setSelectedCommunityId}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select Community" />
                </SelectTrigger>
                <SelectContent>
                  {communities.map((community: any) => {
                    const id = (community.id || community._id || "").toString()
                    const name = community.name || community.slug || id
                    return (
                      <SelectItem key={id} value={id}>
                        {name}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>

              <Select value={selectedFeature} onValueChange={(value) => setSelectedFeature(value as AnalyticsFeature)}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Select Feature" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="courses">Courses</SelectItem>
                  <SelectItem value="challenges">Challenges</SelectItem>
                  <SelectItem value="sessions">Sessions</SelectItem>
                  <SelectItem value="events">Events</SelectItem>
                  <SelectItem value="posts">Posts</SelectItem>
                  <SelectItem value="products">Products</SelectItem>
                </SelectContent>
              </Select>

              <Select value={timeRange} onValueChange={(value) => setTimeRange(value as AnalyticsTimeRange)}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="28d">Last 28 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleExportCsv}
                disabled={isExporting || isInitialLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{isExporting ? "Exporting..." : "Export CSV"}</span>
                <span className="sm:hidden">{isExporting ? "Exporting..." : "Export"}</span>
              </Button>

              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => handleSyncAnalytics()}
                disabled={isSyncing || isInitialLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Data'}
              </Button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {isRefreshing && (
              <span className="inline-flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Refreshing...
              </span>
            )}
            {lastUpdatedAt && (
              <span>Last updated at {new Date(lastUpdatedAt).toLocaleTimeString()}</span>
            )}
            {loadError && (
              <span className="text-red-600">{loadError}</span>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon
            const isPositive = typeof metric.change === "string" && metric.change.startsWith("+")
            return (
              <Card key={metric.title} className="hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-indigo-500">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{metric.title}</p>
                      <h3 className="text-2xl font-bold text-gray-900 mt-2">{metric.value}</h3>
                    </div>
                    <div className={`p-2 rounded-lg ${idx % 2 === 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    {metric.change ? (
                      <>
                        <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                          {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1 rotate-180" />}
                          {metric.change}
                        </span>
                        <span className="text-gray-400 ml-2">vs last period</span>
                      </>
                    ) : (
                      <span className="text-gray-400">No period comparison</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card className="shadow-sm">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Performance Trend</CardTitle>
                  <CardDescription className="text-sm text-gray-500 mt-1">Views and completions over time</CardDescription>
                </div>
                {membershipData.length > 0 && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                      <span className="text-gray-600">Views</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="text-gray-600">Completions</span>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {membershipData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={membershipData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ fontSize: '13px' }}
                      cursor={{ stroke: '#9ca3af', strokeDasharray: '4 4' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="views"
                      name="Views"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorViews)"
                    />
                    <Area
                      type="monotone"
                      dataKey="completes"
                      name="Completions"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCompletions)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[320px] flex flex-col items-center justify-center text-gray-500 space-y-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <div className="p-3 bg-white rounded-full shadow-sm">
                    <TrendingUp className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium">No trend data available</p>
                  <Button variant="outline" size="sm" onClick={() => handleSyncAnalytics()} className="text-xs">
                    Try syncing data
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Engagement Activity</CardTitle>
                  <CardDescription className="text-sm text-gray-500 mt-1">Starts vs Completions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {engagementData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={engagementData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <Tooltip
                      cursor={{ fill: '#f9fafb' }}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      iconType="circle"
                      formatter={(value) => <span className="text-sm text-gray-600 ml-1">{value}</span>}
                    />
                    <Bar
                      dataKey="starts"
                      name="Starts"
                      fill="#818cf8"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar
                      dataKey="completes"
                      name="Completions"
                      fill="#34d399"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[320px] flex flex-col items-center justify-center text-gray-500 space-y-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <div className="p-3 bg-white rounded-full shadow-sm">
                    <MessageSquare className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium">No activity data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Devices and Referrers */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card className="shadow-sm flex flex-col">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900">Audience Devices</CardTitle>
              <CardDescription className="text-sm text-gray-500 mt-1">Device mix and tracked user sessions in one view</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-2 flex-1 flex flex-col">
              {isSupplementalLoading && devicesData.length === 0 && deviceDetails.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3 bg-gray-50 rounded-lg border border-dashed border-gray-200 min-h-[300px]">
                  <div className="p-3 bg-white rounded-full shadow-sm">
                    <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                  </div>
                  <p className="text-sm font-medium">Loading device data...</p>
                </div>
              ) : devicesData.length > 0 || deviceDetails.length > 0 ? (
                <div className="flex flex-col h-full">
                  {devicesData.length > 0 ? (
                    <>
                      {/* Chart Section */}
                      <div className="h-[220px] w-full flex items-center justify-center relative mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={devicesData}
                              cx="50%"
                              cy="50%"
                              innerRadius={65}
                              outerRadius={90}
                              paddingAngle={2}
                              dataKey="value"
                              stroke="none"
                            >
                              {devicesData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px' }}
                              formatter={(value: number) => [value.toLocaleString(), 'Users']}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-2xl font-bold text-gray-900">
                            {devicesData.reduce((acc, curr) => acc + (curr.value || 0), 0).toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Users</span>
                        </div>
                      </div>

                      {/* List Section */}
                      <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                        {[...devicesData].sort((a, b) => b.value - a.value).map((device, index) => {
                          const total = devicesData.reduce((acc, curr) => acc + (curr.value || 0), 0);
                          const percentage = total > 0 ? (device.value / total) * 100 : 0;
                          const color = COLORS[index % COLORS.length];

                          let Icon = Smartphone;
                          if (device.name.toLowerCase().includes('desktop') || device.name.toLowerCase().includes('laptop')) Icon = Monitor;
                          if (device.name.toLowerCase().includes('tablet')) Icon = Smartphone; // Tablet often shares icon or similar

                          return (
                            <div key={index} className="flex flex-col space-y-1.5">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                                  <Icon className="w-4 h-4 text-gray-500" />
                                  <span className="font-medium text-gray-700 capitalize">{device.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold text-gray-900">{device.value.toLocaleString()}</span>
                                  <span className="text-gray-500 w-10 text-right">{Math.round(percentage)}%</span>
                                </div>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%`, backgroundColor: color }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 mb-4 text-xs text-gray-500">
                      No aggregate device category data was returned for the selected period.
                    </div>
                  )}

                  <div className="mt-5 pt-1">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-900">Tracked Users & Devices</h4>
                      <span className="text-xs text-gray-500">{deviceDetails.length} records</span>
                    </div>

                    {deviceDetails.length > 0 ? (
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <div className="max-h-[260px] overflow-y-auto">
                          {deviceDetails.map((entry, index) => {
                            const userLabel = formatDeviceUserLabel(entry)
                            const secondaryIdentity =
                              (entry.userEmail && entry.userEmail !== userLabel)
                              ? entry.userEmail
                              : (entry.userId || "No identifier")
                            const deviceLabel = entry.deviceModel || entry.device || "N/A"
                            const secondaryDevice =
                              (entry.deviceModel && entry.device && entry.deviceModel !== entry.device)
                              ? entry.device
                              : null
                            const environment = [entry.os || "N/A", entry.browser || "N/A"].join(" / ")
                            const ipLabel = entry.ipAddress || "No IP captured"
                            const lastSeenLabel = formatDeviceLastSeen(entry.lastSeenAt)

                            return (
                              <div key={`${entry.userId || "unknown"}-${entry.ipAddress || "no-ip"}-${index}`} className="border-b border-gray-100 last:border-b-0 p-3 space-y-2.5">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{userLabel}</p>
                                    <p className="text-xs text-gray-500 truncate">{secondaryIdentity}</p>
                                  </div>
                                  <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 text-xs font-semibold px-2 py-1 whitespace-nowrap">
                                    {entry.eventsCount.toLocaleString()} events
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                  <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 px-2 py-1">
                                    Device: {deviceLabel}
                                  </span>
                                  {secondaryDevice && (
                                    <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 px-2 py-1">
                                      Type: {secondaryDevice}
                                    </span>
                                  )}
                                  <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-2 py-1">
                                    {environment}
                                  </span>
                                  <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2 py-1">
                                    IP: {ipLabel}
                                  </span>
                                  <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-2 py-1">
                                    Last seen: {lastSeenLabel}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-xs text-gray-500">
                        No per-user device records found for the selected period.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3 bg-gray-50 rounded-lg border border-dashed border-gray-200 min-h-[300px]">
                  <div className="p-3 bg-white rounded-full shadow-sm">
                    <Smartphone className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium">No device data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-semibold text-gray-900">Traffic Sources</CardTitle>
              <CardDescription className="text-sm text-gray-500 mt-1">
                Top referrers driving traffic from tracked backend events
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {isSupplementalLoading && referrersData.length === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-gray-500 space-y-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <div className="p-3 bg-white rounded-full shadow-sm">
                    <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                  </div>
                  <p className="text-sm font-medium">Loading traffic sources...</p>
                </div>
              ) : referrersData.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Events</p>
                      <p className="text-sm font-semibold text-slate-900">{(referrersSummary?.totalEvents || 0).toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Sources</p>
                      <p className="text-sm font-semibold text-slate-900">{(referrersSummary?.sources || referrersData.length).toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Top Channel</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {getReferrerChannelMeta(referrersSummary?.topChannel).label}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Provider</p>
                      <p className="text-sm font-semibold text-slate-900 uppercase">
                        {referrersSummary?.provider || "tracking"}
                      </p>
                    </div>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto pr-1 space-y-3">
                    {referrersData.map((ref, idx) => {
                      const channelMeta = getReferrerChannelMeta(ref.channel)
                      const SourceIcon = channelMeta.Icon
                      const sourceLabel = ref.source || ref.referrer || "Direct"
                      const safeShare = Number.isFinite(ref.share) ? Math.max(0, Math.min(100, ref.share)) : 0
                      const barWidth = safeShare > 0 ? Math.max(safeShare, 3) : 0

                      return (
                        <div key={`${sourceLabel}-${idx}`} className="rounded-xl border border-gray-200 bg-white p-3 hover:border-gray-300 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex items-start gap-2.5">
                              <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${channelMeta.classes}`}>
                                <SourceIcon className="h-4 w-4" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{sourceLabel}</p>
                                <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 ${channelMeta.classes}`}>
                                    {channelMeta.label}
                                  </span>
                                  {ref.utm_source && (
                                    <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5">
                                      Source: {ref.utm_source}
                                    </span>
                                  )}
                                  {ref.utm_medium && (
                                    <span className="inline-flex items-center rounded-full bg-cyan-50 text-cyan-700 px-2 py-0.5">
                                      Medium: {ref.utm_medium}
                                    </span>
                                  )}
                                  {ref.utm_campaign && (
                                    <span className="inline-flex items-center rounded-full bg-violet-50 text-violet-700 px-2 py-0.5">
                                      Campaign: {ref.utm_campaign}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              <p className="text-sm font-semibold text-gray-900">{ref.count.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">{safeShare.toFixed(safeShare >= 10 ? 0 : 1)}%</p>
                            </div>
                          </div>

                          <div className="mt-2.5 w-full rounded-full bg-gray-100 h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-500 transition-all duration-500"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>

                          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                            {ref.domain && (
                              <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2 py-0.5">
                                Domain: {ref.domain}
                              </span>
                            )}
                            {typeof ref.uniqueUsers === "number" && (
                              <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5">
                                Users: {ref.uniqueUsers.toLocaleString()}
                              </span>
                            )}
                            <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-2 py-0.5">
                              Last seen: {formatReferrerLastSeen(ref.lastSeenAt)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-gray-500 space-y-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <div className="p-3 bg-white rounded-full shadow-sm">
                    <Globe className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium">No traffic source data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Card>
          <Tabs value={detailsTab} onValueChange={(value) => setDetailsTab(value as "overview" | "details")} className="w-full">
            <CardHeader className="p-4 sm:p-6 pb-0">
              <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-grid">
                <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
                <TabsTrigger value="details" className="text-xs sm:text-sm">Details</TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="overview" className="p-4 sm:p-6 pt-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-4">
                  Top {selectedFeature.charAt(0).toUpperCase() + selectedFeature.slice(1)}
                </h3>
                <div className="space-y-0 border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 border-b p-3 flex text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex-1">Title</div>
                    <div className="w-24 text-right">Views</div>
                    <div className="w-24 text-right">Starts</div>
                    <div className="w-24 text-right">Completes</div>
                    {selectedFeature === "courses" && (
                      <div className="w-32 text-right">Chapter Completes</div>
                    )}
                    <div className="w-20 text-right">Conv. Rate</div>
                  </div>
                  {topItems.length > 0 ? (
                    topItems.map((item, index) => {
                      const rowId = String(item.contentId || item.id || "").trim()
                      const rowTitle = String(item.title || item.name || `Item ${index + 1}`)
                      const isSelected = Boolean(rowId && selectedItemId && rowId === selectedItemId)

                      return (
                      <div
                        key={rowId || item.id || index}
                        className={`flex items-center p-4 border-b last:border-0 transition-colors cursor-pointer ${
                          isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          if (!rowId) return
                          setSelectedItemId(rowId)
                          setSelectedItemTitle(rowTitle)
                          setFunnelData(null)
                          setStepFunnelData(null)
                          setFocusStepId(null)
                          setAiInsights(null)
                          setFunnelError(null)
                          setDetailsTab("details")
                        }}
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{rowTitle}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            ID: {item.contentId || item.id || 'N/A'}
                          </p>
                        </div>
                        <div className="w-24 text-right text-sm text-gray-600">{item.views?.toLocaleString() || 0}</div>
                        <div className="w-24 text-right text-sm text-gray-600">{item.starts?.toLocaleString() || 0}</div>
                        <div className="w-24 text-right text-sm text-gray-600">{item.completes?.toLocaleString() || 0}</div>
                        {selectedFeature === "courses" && (
                          <div className="w-32 text-right text-sm text-gray-600">{item.chapterCompletes?.toLocaleString() || 0}</div>
                        )}
                        <div className="w-20 text-right text-sm font-medium text-gray-900">
                          {item.completionRate ? `${Math.round(item.completionRate)}%` : '0%'}
                        </div>
                      </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      No top {selectedFeature} found for this time period.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="p-4 sm:p-6 pt-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-4">Detailed Analytics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {selectedFeature === 'courses' && (
                    <>
                      <div className="p-3 sm:p-4 border rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Course Completion Rate</h4>
                        <p className="text-xl sm:text-2xl font-bold">
                          {overview?.completionRate || overview?.courseCompletionRate || '0'}%
                        </p>
                      </div>
                      <div className="p-3 sm:p-4 border rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Chapter Completes</h4>
                        <p className="text-xl sm:text-2xl font-bold">
                          {toNumber(overview?.chapterCompletes).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 sm:p-4 border rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Average Duration</h4>
                        <p className="text-xl sm:text-2xl font-bold">
                          {overview?.avgDuration || overview?.averageDuration || '0'} mins
                        </p>
                      </div>
                    </>
                  )}
                  {selectedFeature === 'challenges' && (
                    <>
                      <div className="p-3 sm:p-4 border rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Completion Rate</h4>
                        <p className="text-xl sm:text-2xl font-bold">
                          {overview?.challengeCompletionRate || overview?.completionRate || '0'}%
                        </p>
                      </div>
                      <div className="p-3 sm:p-4 border rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Average Submissions</h4>
                        <p className="text-xl sm:text-2xl font-bold">
                          {overview?.avgSubmissions || (overview?.submissions && topItems.length > 0 ? Math.round(overview.submissions / topItems.length) : 0) || '0'}
                        </p>
                      </div>
                    </>
                  )}
                  {selectedFeature === 'events' && (
                    <>
                      <div className="p-3 sm:p-4 border rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Attendance Rate</h4>
                        <p className="text-xl sm:text-2xl font-bold">
                          {overview?.attendanceRate || '0'}%
                        </p>
                      </div>
                      <div className="p-3 sm:p-4 border rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Average Duration</h4>
                        <p className="text-xl sm:text-2xl font-bold">
                          {overview?.avgDurationHours || overview?.averageDuration || '0'}h
                        </p>
                      </div>
                    </>
                  )}
                  {selectedFeature === 'products' && (
                    <>
                      <div className="p-3 sm:p-4 border rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Average Rating</h4>
                        <p className="text-xl sm:text-2xl font-bold">
                          {overview?.avgRating || overview?.averageRating || '0'}{' '}
                          <span className="text-yellow-400">⭐</span>
                        </p>
                      </div>
                      <div className="p-3 sm:p-4 border rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Customer Satisfaction</h4>
                        <p className="text-xl sm:text-2xl font-bold">
                          {overview?.customerSatisfaction || '0'}%
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Drop-off & Conversion Insights</h4>
                      <p className="text-xs text-gray-500">Explainable funnels + step drop-off + on-demand AI explainer.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                      <Select
                        value={selectedItemId || ""}
                        onValueChange={(value) => {
                          const nextId = String(value || "").trim()
                          if (!nextId) return
                          const row = topItems.find((it) => String(it.contentId || it.id || "").trim() === nextId)
                          setSelectedItemId(nextId)
                          setSelectedItemTitle(row ? String(row.title || row.name || "").trim() : null)
                          setFunnelData(null)
                          setStepFunnelData(null)
                          setFocusStepId(null)
                          setAiInsights(null)
                          setFunnelError(null)
                        }}
                      >
                        <SelectTrigger className="w-full sm:w-[280px]">
                          <SelectValue placeholder="Select item" />
                        </SelectTrigger>
                        <SelectContent>
                          {topItems
                            .map((item, idx) => ({
                              id: String(item.contentId || item.id || "").trim(),
                              label: String(item.title || item.name || `Item ${idx + 1}`),
                            }))
                            .filter((row) => Boolean(row.id))
                            .map((row) => (
                              <SelectItem key={row.id} value={row.id}>
                                {row.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>

                      <Button onClick={handleGenerateInsights} disabled={!selectedItemId || isInsightsLoading} className="gap-2">
                        <RefreshCw className={`h-4 w-4 ${isInsightsLoading ? "animate-spin" : ""}`} />
                        {isInsightsLoading ? "Generating" : "Generate AI Insights"}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="border rounded-lg bg-white p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-900">
                          Funnel{selectedItemTitle ? `: ${selectedItemTitle}` : ""}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void loadSelectedFunnel()}
                          disabled={!selectedItemId || isFunnelLoading}
                          className="gap-2"
                        >
                          <RefreshCw className={`h-4 w-4 ${isFunnelLoading ? "animate-spin" : ""}`} />
                          Refresh
                        </Button>
                      </div>

                      {funnelError ? (
                        <div className="text-sm text-red-600">{funnelError}</div>
                      ) : isFunnelLoading ? (
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" /> Loading funnel...
                        </div>
                      ) : funnelData ? (
                        <>
                          <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={(funnelData.funnel || []).map((step) => ({
                                  name: step.stepLabel,
                                  users: Number(step.uniqueUsers ?? 0),
                                }))}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="users" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>

                          <div className="mt-4 space-y-2">
                            {(funnelData.funnel || []).map((step) => {
                              const isRevenue = step.stepKey === "revenue"
                              const primaryValue = isRevenue
                                ? `${Number(step.events || 0).toLocaleString()} ${funnelData.contentMeta?.currency || "TND"}`
                                : Number(step.uniqueUsers ?? 0).toLocaleString()
                              const rate = step.rateFromPrev == null ? null : `${Math.round(step.rateFromPrev * 100)}%`
                              return (
                                <div key={step.stepKey} className="flex items-center justify-between text-sm">
                                  <div className="text-gray-700">{step.stepLabel}</div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-medium text-gray-900">{primaryValue}</span>
                                    <span className="text-xs text-gray-500 w-12 text-right">{rate || "—"}</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {Array.isArray(funnelData.warnings) && funnelData.warnings.length > 0 ? (
                            <div className="mt-4 space-y-1">
                              {funnelData.warnings.slice(0, 4).map((w) => (
                                <p key={w} className="text-xs text-amber-700">
                                  {w}
                                </p>
                              ))}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div className="text-sm text-gray-600">Select an item to load a funnel.</div>
                      )}
                    </div>

                    <div className="border rounded-lg bg-white p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-900">Step drop-off</p>
                        {selectedContentType === "course" && focusStepId ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/creator/courses/${encodeURIComponent(String(selectedItemId || ""))}/manage?tab=content&chapterId=${encodeURIComponent(String(focusStepId))}`)}
                          >
                            Open in Course Manager
                          </Button>
                        ) : null}
                      </div>

                      {selectedContentType === "course" || selectedContentType === "challenge" ? (
                        stepFunnelData && Array.isArray((stepFunnelData as any).items) ? (
                          <>
                            {(() => {
                              const items = (stepFunnelData as any).items
                                .filter((it: any) => Number(it.uniqueStarts || 0) > 0)
                                .sort((a: any, b: any) => Number(b.dropOffRate || 0) - Number(a.dropOffRate || 0))
                                .slice(0, 5)

                              if (items.length === 0) {
                                return (
                                  <div className="text-sm text-gray-600">
                                    No step-level drop-off yet for this time range (no chapter/task starts recorded).
                                  </div>
                                )
                              }

                              return (
                                <div className="space-y-2">
                                  {items.map((it: any) => {
                                    const isFocused = focusStepId && String(focusStepId) === String(it.stepId)
                                    return (
                                      <div
                                        key={it.stepId}
                                        className={`flex items-center justify-between rounded-md border p-2 text-sm cursor-pointer ${
                                          isFocused ? "border-blue-400 bg-blue-50" : "hover:bg-gray-50"
                                        }`}
                                        onClick={() => {
                                          setFocusStepId(String(it.stepId))
                                          setAiInsights(null)
                                          setAiInsightsMeta(null)
                                          setAiTab("summary")
                                        }}
                                      >
                                        <div className="min-w-0 pr-3">
                                          <p className="font-medium text-gray-900 truncate" dir="auto">
                                            {it.stepTitle}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            Starts: {Number(it.uniqueStarts || 0).toLocaleString()} · Completes:{" "}
                                            {Number(it.uniqueCompletes || 0).toLocaleString()}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-semibold text-gray-900">
                                            {Math.round(Number(it.dropOffRate || 0) * 100)}%
                                          </p>
                                          <p className="text-xs text-gray-500">drop</p>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )
                            })()}

                            {Array.isArray((stepFunnelData as any).warnings) && (stepFunnelData as any).warnings.length > 0 ? (
                              <div className="mt-3 space-y-1">
                                {(stepFunnelData as any).warnings.slice(0, 4).map((w: string) => (
                                  <p key={w} className="text-xs text-amber-700">
                                    {w}
                                  </p>
                                ))}
                              </div>
                            ) : null}
                          </>
                        ) : (
                          <div className="text-sm text-gray-600">No step-level data yet.</div>
                        )
                      ) : (
                        <div className="text-sm text-gray-600">Step drop-off is available for courses and challenges.</div>
                      )}
                    </div>
                  </div>

                  {aiInsights ? (
                    <div className="border rounded-lg bg-white p-4 space-y-4">
                      {(() => {
                        const parsed = tryParseJsonObject(aiInsights.summary)
                        const derived = parsed && typeof (parsed as any).summary === "string" ? (parsed as any) : null
                        const effectiveInsights: CreatorInsightsResponse = derived
                          ? {
                              ...aiInsights,
                              summary: String(derived.summary),
                              topIssues: Array.isArray(derived.topIssues) ? derived.topIssues : aiInsights.topIssues,
                              fixes: Array.isArray(derived.fixes) ? derived.fixes : aiInsights.fixes,
                              rewriteSuggestions: Array.isArray(derived.rewriteSuggestions)
                                ? derived.rewriteSuggestions
                                : aiInsights.rewriteSuggestions,
                              experiments: Array.isArray(derived.experiments) ? derived.experiments : aiInsights.experiments,
                              warnings: Array.from(
                                new Set([
                                  ...(Array.isArray(aiInsights.warnings) ? aiInsights.warnings : []),
                                  ...(Array.isArray(derived.warnings) ? derived.warnings : []),
                                ]),
                              ),
                            }
                          : aiInsights

                        const warnings = Array.isArray(effectiveInsights.warnings) ? effectiveInsights.warnings : []
                        const uiWarnings = warnings
                          .map((w) => String(w))
                          .filter((w) => w.trim().length > 0)
                          .filter((w) => !/ai response was not valid json/i.test(w))
                          .filter((w) => !/returned a safe fallback summary/i.test(w))
                          .filter((w) => !/response is not an object/i.test(w))
                          .filter((w) => !/fallback response/i.test(w))
                        const summaryText = String(effectiveInsights.summary || "")
                        const humanSummary = toHumanParagraph(summaryText) || "No summary returned."
                        const summaryTitle = `Insights for ${selectedItemTitle ? selectedItemTitle : selectedItemId}${focusStepId ? ` · ${focusStepTitle ? focusStepTitle : `Step ${focusStepId}`}` : ""}`
                        const conclusionText = (() => {
                          if (effectiveInsights.fixes?.length) {
                            const actions = effectiveInsights.fixes
                              .slice(0, 2)
                              .map((fix) => String(fix.exactCreatorAction || fix.title || "").trim())
                              .filter(Boolean)
                            if (actions.length) return actions.join("\n")
                          }
                          if (effectiveInsights.experiments?.length) {
                            const exp = effectiveInsights.experiments[0]
                            if (exp?.name) return `Run an experiment: ${exp.name} (track: ${exp.successMetric}).`
                          }
                          return "Focus on the worst drop-off step first, simplify prerequisites, and test a clearer intro + CTA."
                        })()

                        const renderConfidence = (confidence: any) => {
                          const value = String(confidence || "").toLowerCase()
                          const label = value === "high" ? "High" : value === "med" ? "Medium" : "Low"
                          const classes =
                            value === "high"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : value === "med"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-gray-50 text-gray-700 border-gray-200"
                          return (
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${classes}`}>
                              {label} confidence
                            </span>
                          )
                        }

                        return (
                          <>
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900">AI Explainer</p>
                                <p className="text-xs text-gray-500" dir="auto">
                                  {selectedItemTitle ? selectedItemTitle : selectedItemId}
                                  {focusStepId ? ` · Focus: ${focusStepTitle ? focusStepTitle : focusStepId}` : ""}
                                  {aiInsightsMeta?.model ? ` · Model: ${aiInsightsMeta.model}` : ""}
                                  {aiInsightsMeta?.cached ? " · Cached" : ""}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => copyToClipboard(humanSummary, "Copied summary")}>
                                  Copy summary
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setAiInsights(null)
                                    setAiInsightsMeta(null)
                                    setAiTab("summary")
                                  }}
                                >
                                  Clear
                                </Button>
                              </div>
                            </div>

                            {uiWarnings.length > 0 ? (
                              <div className="space-y-1">
                                {uiWarnings.slice(0, 6).map((w) => (
                                  <p key={String(w)} className="text-xs text-amber-700" dir="auto">
                                    {String(w)}
                                  </p>
                                ))}
                              </div>
                            ) : null}

                            <Tabs value={aiTab} onValueChange={(v) => setAiTab(v as any)}>
                              <TabsList className="flex flex-wrap h-auto">
                                <TabsTrigger value="summary">Summary</TabsTrigger>
                                <TabsTrigger value="issues">Issues</TabsTrigger>
                                <TabsTrigger value="fixes">Fixes</TabsTrigger>
                                <TabsTrigger value="rewrites">Rewrites</TabsTrigger>
                                <TabsTrigger value="experiments">Experiments</TabsTrigger>
                              </TabsList>

                              <TabsContent value="summary" className="mt-3">
                                <div className="rounded-md border bg-gray-50 p-4 space-y-3">
                                  <div>
                                    <p className="text-xs font-medium text-gray-500">Title</p>
                                    <p className="text-sm font-semibold text-gray-900 mt-1" dir="auto">
                                      {summaryTitle}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-gray-500">Description</p>
                                    <p className="text-sm text-gray-900 mt-1 whitespace-pre-line" dir="auto">
                                      {humanSummary}
                                    </p>
                                  </div>
                                  <div className="rounded-md border bg-white p-3">
                                    <p className="text-xs font-medium text-gray-600">Conclusion</p>
                                    <p className="text-sm text-gray-900 mt-1 whitespace-pre-line" dir="auto">
                                      {conclusionText}
                                    </p>
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="issues" className="mt-3">
                                {effectiveInsights.topIssues?.length ? (
                                  <div className="space-y-3">
                                    {effectiveInsights.topIssues.slice(0, 6).map((issue) => (
                                      <div key={`${issue.stepId}-${issue.stepTitle}`} className="rounded-md border p-3">
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate" dir="auto">
                                              {issue.stepTitle}
                                            </p>
                                            <p className="text-xs text-gray-500">Step {issue.stepId}</p>
                                          </div>
                                          {renderConfidence(issue.confidence)}
                                        </div>
                                        {Array.isArray(issue.metricEvidence) && issue.metricEvidence.length > 0 ? (
                                          <ul className="mt-2 space-y-1">
                                            {issue.metricEvidence.slice(0, 4).map((ev) => (
                                              <li key={ev} className="text-xs text-gray-700" dir="auto">
                                                • {ev}
                                              </li>
                                            ))}
                                          </ul>
                                        ) : null}
                                        {issue.hypothesis ? (
                                          <p className="text-xs text-gray-700 mt-2 whitespace-pre-line" dir="auto">
                                            {issue.hypothesis}
                                          </p>
                                        ) : null}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-600">No issues returned.</p>
                                )}
                              </TabsContent>

                              <TabsContent value="fixes" className="mt-3">
                                {effectiveInsights.fixes?.length ? (
                                  <div className="space-y-3">
                                    {effectiveInsights.fixes.slice(0, 8).map((fix) => (
                                      <div key={fix.title} className="rounded-md border p-3">
                                        <p className="text-sm font-semibold text-gray-900" dir="auto">
                                          {fix.title}
                                        </p>
                                        {fix.whyItHelps ? (
                                          <p className="text-xs text-gray-700 mt-1 whitespace-pre-line" dir="auto">
                                            {fix.whyItHelps}
                                          </p>
                                        ) : null}
                                        {fix.exactCreatorAction ? (
                                          <div className="mt-2 rounded-md bg-gray-50 border px-3 py-2">
                                            <p className="text-xs font-medium text-gray-800">What to do</p>
                                            <p className="text-xs text-gray-700 mt-0.5 whitespace-pre-line" dir="auto">
                                              {fix.exactCreatorAction}
                                            </p>
                                          </div>
                                        ) : null}
                                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                          <div className="rounded-md border bg-white px-3 py-2">
                                            <p className="text-xs font-medium text-gray-800">Expected lift</p>
                                            <p className="text-xs text-gray-700 mt-0.5" dir="auto">
                                              {fix.expectedMetricLift || "—"}
                                            </p>
                                          </div>
                                          <div className="rounded-md border bg-white px-3 py-2">
                                            <p className="text-xs font-medium text-gray-800">Risk</p>
                                            <p className="text-xs text-gray-700 mt-0.5" dir="auto">
                                              {fix.risk || "—"}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-600">No fixes returned.</p>
                                )}
                              </TabsContent>

                              <TabsContent value="rewrites" className="mt-3">
                                {effectiveInsights.rewriteSuggestions?.length ? (
                                  <div className="space-y-3">
                                    {effectiveInsights.rewriteSuggestions.slice(0, 8).map((rw, idx) => (
                                      <div key={`${rw.stepId}-${rw.target}-${idx}`} className="rounded-md border p-3">
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="min-w-0">
                                            <p className="text-xs text-gray-500" dir="auto">
                                              {rw.target} · step {rw.stepId}
                                            </p>
                                          </div>
                                          <Button variant="outline" size="sm" onClick={() => copyToClipboard(rw.text, "Copied rewrite")}>
                                            Copy
                                          </Button>
                                        </div>
                                        <div className="mt-2 rounded-md border bg-gray-50 p-3">
                                          <p className="text-sm text-gray-900 whitespace-pre-line" dir="auto">
                                            {rw.text}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-600">No rewrite suggestions returned.</p>
                                )}
                              </TabsContent>

                              <TabsContent value="experiments" className="mt-3">
                                {effectiveInsights.experiments?.length ? (
                                  <div className="space-y-3">
                                    {effectiveInsights.experiments.slice(0, 6).map((exp) => (
                                      <div key={exp.name} className="rounded-md border p-3">
                                        <p className="text-sm font-semibold text-gray-900" dir="auto">
                                          {exp.name}
                                        </p>
                                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <div className="rounded-md border bg-gray-50 p-3">
                                            <p className="text-xs font-medium text-gray-800">Variant A</p>
                                            <p className="text-xs text-gray-700 mt-1 whitespace-pre-line" dir="auto">
                                              {exp.variantA}
                                            </p>
                                          </div>
                                          <div className="rounded-md border bg-gray-50 p-3">
                                            <p className="text-xs font-medium text-gray-800">Variant B</p>
                                            <p className="text-xs text-gray-700 mt-1 whitespace-pre-line" dir="auto">
                                              {exp.variantB}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                          <div className="rounded-md border bg-white px-3 py-2">
                                            <p className="text-xs font-medium text-gray-800">Success metric</p>
                                            <p className="text-xs text-gray-700 mt-0.5" dir="auto">
                                              {exp.successMetric}
                                            </p>
                                          </div>
                                          <div className="rounded-md border bg-white px-3 py-2">
                                            <p className="text-xs font-medium text-gray-800">Run for</p>
                                            <p className="text-xs text-gray-700 mt-0.5">
                                              {Number(exp.runForDays || 0)} days
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-600">No experiments returned.</p>
                                )}
                              </TabsContent>
                            </Tabs>
                          </>
                        )
                      })()}
                    </div>
                  ) : null}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </PageShell>
  )
}
