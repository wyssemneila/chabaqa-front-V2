"use client"

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  ArrowUpRight,
  BadgeDollarSign,
  BarChart3,
  Copy,
  Crown,
  Gift,
  Link2,
  Loader2,
  Mail,
  Megaphone,
  MessageSquare,
  MousePointerClick,
  Network,
  Plus,
  RefreshCw,
  RotateCcw,
  Rocket,
  Send,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trophy,
  UserPlus,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"

import { PageShell } from "@/components/creator-dashboard"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useAuthContext } from "@/app/providers/auth-provider"
import { useCommunityGuard } from "@/hooks/use-community-guard"
import {
  affiliateApi,
  challengesApi,
  communitiesApi,
  coursesApi,
  eventsApi,
  productsApi,
  sessionsApi,
  type AffiliateMarketingResponse,
  type AffiliateMarketingTemplate,
  type AffiliatePartner,
  type AffiliateProgram,
} from "@/lib/api"

import {
  AffiliateLinkBuilder,
  type AffiliateTargetType,
  type LinkBuilderSubmitPayload,
  type PartnerOption,
  type TargetOption,
} from "./components/affiliate-link-builder"
import { StatusChip } from "./components/status-chip"

const CHART_COLORS = ["#14b8a6", "#6366f1", "#f59e0b", "#e11d48", "#7c3aed", "#0ea5e9"]

const PERIOD_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "180", label: "Last 180 days" },
]

const ZERO_MARKETING: AffiliateMarketingResponse = {
  generatedAt: "",
  timezone: "UTC",
  query: {},
  summary: {
    clicks: 0,
    uniqueVisitors: 0,
    botClicks: 0,
    conversions: 0,
    allConversions: 0,
    totalRevenueDT: 0,
    totalCreatorNetDT: 0,
    totalCommissionDT: 0,
    pendingCommissionDT: 0,
    approvedCommissionDT: 0,
    paidCommissionDT: 0,
    reversedCommissionDT: 0,
    pendingConversions: 0,
    approvedConversions: 0,
    paidConversions: 0,
    reversedConversions: 0,
    programCount: 0,
    activeProgramCount: 0,
    partnerCount: 0,
    activePartnerCount: 0,
    pendingPartnerCount: 0,
    linkCount: 0,
    averageLagHours: 0,
    conversionRatePct: 0,
    visitorConversionRatePct: 0,
    revenuePerClickDT: 0,
    commissionPerClickDT: 0,
    averageOrderDT: 0,
    averageCommissionDT: 0,
    approvalRatePct: 0,
    reversalRatePct: 0,
  },
  programs: [],
  funnels: [],
  timeSeries: [],
  leaderboards: {
    partners: [],
    links: [],
  },
  breakdowns: {
    sources: [],
    devices: [],
    contentTypes: [],
  },
  payoutHealth: {
    pendingCommissionDT: 0,
    approvedCommissionDT: 0,
    paidCommissionDT: 0,
    reversedCommissionDT: 0,
    pendingConversions: 0,
    approvedConversions: 0,
    nextReleases: [],
  },
  mergeFields: [],
  templates: [],
  insights: [],
  linkBuilder: {
    targetTypes: [],
    utmPresets: [{ label: "Partner newsletter", utmSource: "partner_newsletter", utmMedium: "email" }],
    attributionModels: [
      { value: "last_click", label: "Last click" },
      { value: "first_click", label: "First click" },
    ],
    recentLinks: [],
  },
}

type ProgramFormState = {
  name: string
  description: string
  scopeType: "community" | "course" | "challenge" | "event" | "product" | "session"
  commissionPercent: string
  cookieWindowDays: string
  holdDays: string
  attributionModel: "last_click" | "first_click"
  autoApprovePartners: boolean
}

type InviteFormState = {
  userId: string
  email: string
  displayName: string
  customCommissionPercent: string
  couponCode: string
  source: string
  tags: string
}

const initialTargets: Record<AffiliateTargetType, TargetOption[]> = {
  community: [],
  course: [],
  challenge: [],
  event: [],
  product: [],
  session: [],
}

const templateIconMap: Record<string, LucideIcon> = {
  acquisition: UserPlus,
  activation: Zap,
  welcome: UserPlus,
  launch: Rocket,
  social: Share2,
  reward: Gift,
  payout: Wallet,
  winback: RotateCcw,
  milestone: Trophy,
  newsletter: Mail,
  message: MessageSquare,
  promotion: Megaphone,
}

function isMongoObjectId(value?: string | null) {
  return Boolean(value && /^[a-f\d]{24}$/i.test(value))
}

function readId(entity: any) {
  return String(entity?._id || entity?.id || "")
}

function extractArray(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.docs)) return payload.docs
  if (Array.isArray(payload?.results)) return payload.results
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  if (Array.isArray(payload?.data?.docs)) return payload.data.docs
  if (Array.isArray(payload?.data?.results)) return payload.data.results
  return []
}

function money(value?: number | null) {
  return `${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} DT`
}

function compact(value?: number | null) {
  return Number(value || 0).toLocaleString()
}

function percent(value?: number | null) {
  return `${Number(value || 0).toFixed(1)}%`
}

function titleCase(value?: string | null) {
  if (!value) return "Unknown"
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
}

function formatDate(value?: string | Date | null) {
  if (!value) return "Not scheduled"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not scheduled"
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function formatDateTime(value?: string | Date | null) {
  if (!value) return "Just now"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Just now"
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

function firstTargetId(targets: TargetOption[]) {
  return targets.find((target) => target.id)?.id || undefined
}

export default function CreatorAffiliateMarketingPage() {
  const { guard, selectedCommunity, selectedCommunityId } = useCommunityGuard()
  const { user: authUser } = useAuthContext()
  const { toast } = useToast()

  const [period, setPeriod] = useState("30")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [marketing, setMarketing] = useState<AffiliateMarketingResponse | null>(null)
  const [programs, setPrograms] = useState<AffiliateProgram[]>([])
  const [partners, setPartners] = useState<AffiliatePartner[]>([])
  const [payouts, setPayouts] = useState<any[]>([])
  const [targetsByType, setTargetsByType] = useState<Record<AffiliateTargetType, TargetOption[]>>(initialTargets)
  const [linkProgramId, setLinkProgramId] = useState("")
  const [inviteProgramId, setInviteProgramId] = useState("")
  const [lastLinkCode, setLastLinkCode] = useState<string>()
  const [programForm, setProgramForm] = useState<ProgramFormState>({
    name: "Creator Partner Program",
    description: "Reward trusted partners for every tracked sale they bring into this community.",
    scopeType: "community",
    commissionPercent: "15",
    cookieWindowDays: "30",
    holdDays: "14",
    attributionModel: "last_click",
    autoApprovePartners: false,
  })
  const [inviteForm, setInviteForm] = useState<InviteFormState>({
    userId: "",
    email: "",
    displayName: "",
    customCommissionPercent: "",
    couponCode: "",
    source: "creator_dashboard",
    tags: "",
  })

  const canReviewPayouts = useMemo(() => {
    const role = String(authUser?.role || "").toLowerCase()
    return ["admin", "super_admin", "owner"].includes(role)
  }, [authUser?.role])

  const scopedCommunityId =
    typeof selectedCommunityId === "string" && isMongoObjectId(selectedCommunityId) ? selectedCommunityId : undefined
  const data = marketing || ZERO_MARKETING
  const summary = data.summary || ZERO_MARKETING.summary
  const nextRelease = data.payoutHealth?.nextReleases?.[0]

  const primaryProgramId = useMemo(() => {
    return linkProgramId || data.linkBuilder?.recommendedProgramId || readId(programs[0])
  }, [data.linkBuilder?.recommendedProgramId, linkProgramId, programs])

  const targetOptions = useMemo(() => {
    const recommended = (data.linkBuilder as any)?.recommendedTargets || []
    const merged = { ...targetsByType }
    recommended.forEach((target: any) => {
      const type = target.type as AffiliateTargetType
      if (!type) return
      const option: TargetOption = {
        id: String(target.id || target.targetId || ""),
        label: String(target.title || target.name || titleCase(type)),
        subtitle: String(target.subtitle || target.description || ""),
        path: target.path || "/",
      }
      if (!option.id) return
      const exists = merged[type]?.some((item) => item.id === option.id)
      if (!exists) merged[type] = [option, ...(merged[type] || [])]
    })
    return merged
  }, [data.linkBuilder, targetsByType])

  const partnerOptions = useMemo<PartnerOption[]>(() => {
    return partners
      .filter((partner) => partner.status === "approved")
      .map((partner) => {
        const user = (partner as any).user || {}
        const id = readId(partner)
        return {
          id,
          label:
            partner.displayName ||
            user.name ||
            user.fullName ||
            user.email ||
            partner.email ||
            `Partner ${id.slice(-5)}`,
          email: user.email || partner.email,
        }
      })
      .filter((partner) => partner.id)
  }, [partners])

  const programOptions = useMemo(() => {
    return programs.map((program) => ({
      id: readId(program),
      label: program.name || `Program ${readId(program).slice(-5)}`,
      status: program.status,
      commissionPercent: program.commissionPercent,
    }))
  }, [programs])

  const selectedProgram = useMemo(() => {
    return programs.find((program) => readId(program) === primaryProgramId)
  }, [primaryProgramId, programs])

  const loadTargets = useCallback(async () => {
    if (!selectedCommunityId) return
    const communityId = selectedCommunityId
    const communitySlug = selectedCommunity?.slug || communityId
    const fetchers: Array<[AffiliateTargetType, Promise<any>]> = [
      ["community", communitiesApi.getBySlug(communitySlug).catch(() => null)],
      ["course", coursesApi.getByCommunity(communitySlug, { page: 1, limit: 100 }).catch(() => [])],
      ["challenge", challengesApi.getByCommunity(communitySlug).catch(() => [])],
      ["event", eventsApi.getAll({ communityId: scopedCommunityId || communityId, page: 1, limit: 100 }).catch(() => [])],
      ["product", productsApi.getByCommunity(scopedCommunityId || communityId).catch(() => [])],
      ["session", sessionsApi.getByCommunity(communitySlug).catch(() => [])],
    ]

    const results = await Promise.all(fetchers.map(async ([type, promise]) => [type, await promise] as const))
    const nextTargets: Record<AffiliateTargetType, TargetOption[]> = { ...initialTargets }

    results.forEach(([type, payload]) => {
      if (type === "community") {
        const community = payload?.data || payload
        const id = readId(community) || communityId
        if (community) {
          nextTargets.community = [
            {
              id,
              label: community.name || selectedCommunity?.name || "Current community",
              subtitle: "Community landing page",
              path: `/en/${selectedCommunity?.slug || community?.slug || communityId}`,
            },
          ]
        }
        return
      }

      nextTargets[type] = extractArray(payload)
        .map((item) => ({
          id: readId(item),
          label: item.title || item.name || item.label || titleCase(type),
          subtitle: item.subtitle || item.description || item.status || "",
          path: item.slug
            ? `/en/${selectedCommunity?.slug || communityId}/${type}s/${item.slug}`
            : `/en/${selectedCommunity?.slug || communityId}`,
        }))
        .filter((item) => item.id)
        .slice(0, 30)
    })

    setTargetsByType(nextTargets)
  }, [scopedCommunityId, selectedCommunity?.name, selectedCommunity?.slug, selectedCommunityId])

  const loadData = useCallback(
    async (silent = false) => {
      if (!selectedCommunityId) return
      if (silent) setRefreshing(true)
      else setLoading(true)

      try {
        const [marketingResponse, programsResponse, partnersResponse, payoutsResponse] = await Promise.all([
          affiliateApi.creator.getMarketing({
            communityId: scopedCommunityId,
            days: Number(period),
            interval: "daily",
            includeTemplates: true,
            limit: 12,
          }),
          affiliateApi.creator.listPrograms(),
          affiliateApi.creator.listPartners(),
          canReviewPayouts ? affiliateApi.creator.listPayouts({ status: "pending", limit: 10 }) : Promise.resolve([]),
          loadTargets(),
        ])

        setMarketing(marketingResponse || ZERO_MARKETING)
        setPrograms(programsResponse || [])
        setPartners(partnersResponse || [])
        setPayouts(Array.isArray(payoutsResponse) ? payoutsResponse : extractArray(payoutsResponse))
      } catch (error: any) {
        toast({
          title: "Affiliate data could not load",
          description: error?.message || "Please refresh and try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [canReviewPayouts, loadTargets, period, scopedCommunityId, selectedCommunityId, toast]
  )

  useEffect(() => {
    if (selectedCommunityId) void loadData()
  }, [loadData, selectedCommunityId])

  useEffect(() => {
    const recommended = data.linkBuilder?.recommendedProgramId || readId(programs[0])
    if (!recommended) return
    if (!linkProgramId) setLinkProgramId(recommended)
    if (!inviteProgramId) setInviteProgramId(recommended)
  }, [data.linkBuilder?.recommendedProgramId, inviteProgramId, linkProgramId, programs])

  const createProgram = async () => {
    if (!selectedCommunityId) return
    const commissionPercent = Number(programForm.commissionPercent)
    const cookieWindowDays = Number(programForm.cookieWindowDays)
    const holdDays = Number(programForm.holdDays)

    if (!programForm.name.trim() || Number.isNaN(commissionPercent) || commissionPercent <= 0) {
      toast({
        title: "Program details need a quick fix",
        description: "Add a program name and a valid commission percentage.",
        variant: "destructive",
      })
      return
    }

    setBusy("program")
    try {
      const isContentScope = programForm.scopeType !== "community"
      const targetId = isContentScope ? firstTargetId(targetOptions[programForm.scopeType]) : undefined

      if (isContentScope && !targetId) {
        toast({
          title: "Choose a content target",
          description: `Add at least one ${programForm.scopeType} before creating this scoped program.`,
          variant: "destructive",
        })
        setBusy(null)
        return
      }

      const created = await affiliateApi.creator.createProgram({
        name: programForm.name.trim(),
        description: programForm.description.trim(),
        scopeType: isContentScope ? "content" : "community",
        scopeContentType: isContentScope ? programForm.scopeType : undefined,
        scopeContentId: targetId,
        communityId: scopedCommunityId,
        commissionPercent,
        cookieWindowDays,
        holdDays,
        attributionModel: programForm.attributionModel,
        autoApprovePartners: programForm.autoApprovePartners,
      })

      setPrograms((current) => [created, ...current])
      setLinkProgramId(readId(created))
      setInviteProgramId(readId(created))
      toast({ title: "Affiliate program created", description: "The program is ready for partner invites and links." })
      void loadData(true)
    } catch (error: any) {
      toast({
        title: "Program was not created",
        description: error?.message || "Please check the fields and try again.",
        variant: "destructive",
      })
    } finally {
      setBusy(null)
    }
  }

  const toggleProgramStatus = async (program: AffiliateProgram) => {
    const id = readId(program)
    if (!id) return
    const nextStatus = program.status === "active" ? "paused" : "active"
    setBusy(`program:${id}`)
    try {
      const updated = await affiliateApi.creator.updateProgram(id, { status: nextStatus })
      setPrograms((current) => current.map((item) => (readId(item) === id ? updated : item)))
      toast({ title: `Program ${nextStatus}`, description: `${program.name} is now ${nextStatus}.` })
      void loadData(true)
    } catch (error: any) {
      toast({
        title: "Program status was not updated",
        description: error?.message || "Try again in a moment.",
        variant: "destructive",
      })
    } finally {
      setBusy(null)
    }
  }

  const invitePartner = async () => {
    if (!inviteProgramId) {
      toast({
        title: "Choose a program first",
        description: "A partner invite needs to be attached to an affiliate program.",
        variant: "destructive",
      })
      return
    }

    if (!inviteForm.userId.trim() && !inviteForm.email.trim()) {
      toast({
        title: "Partner contact missing",
        description: "Use a user ID or email to create the invitation.",
        variant: "destructive",
      })
      return
    }

    setBusy("invite")
    try {
      const invited = await affiliateApi.creator.invitePartner({
        programId: inviteProgramId,
        userId: inviteForm.userId.trim() || undefined,
        email: inviteForm.email.trim() || undefined,
        displayName: inviteForm.displayName.trim() || undefined,
        customCommissionPercent: inviteForm.customCommissionPercent
          ? Number(inviteForm.customCommissionPercent)
          : undefined,
        couponCode: inviteForm.couponCode.trim() || undefined,
        source: inviteForm.source.trim() || "creator_dashboard",
        tags: inviteForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      })
      setPartners((current) => [invited, ...current])
      setInviteForm({
        userId: "",
        email: "",
        displayName: "",
        customCommissionPercent: "",
        couponCode: "",
        source: "creator_dashboard",
        tags: "",
      })
      toast({ title: "Partner invited", description: "The invitation is tracked inside the affiliate funnel." })
      void loadData(true)
    } catch (error: any) {
      toast({
        title: "Partner was not invited",
        description: error?.message || "Please check the partner details.",
        variant: "destructive",
      })
    } finally {
      setBusy(null)
    }
  }

  const updatePartnerStatus = async (partner: AffiliatePartner, status: "approved" | "rejected" | "paused") => {
    const id = readId(partner)
    if (!id) return
    setBusy(`partner:${id}:${status}`)
    try {
      const updated = await affiliateApi.creator.updatePartnerStatus(id, { status })
      setPartners((current) => current.map((item) => (readId(item) === id ? updated : item)))
      toast({ title: `Partner ${status}`, description: "Partner status is now reflected in affiliate analytics." })
      void loadData(true)
    } catch (error: any) {
      toast({
        title: "Partner status was not updated",
        description: error?.message || "Try again in a moment.",
        variant: "destructive",
      })
    } finally {
      setBusy(null)
    }
  }

  const createLink = async (payload: LinkBuilderSubmitPayload) => {
    if (!primaryProgramId) {
      toast({
        title: "Create or choose a program",
        description: "Affiliate links need an active program before they can be generated.",
        variant: "destructive",
      })
      return
    }

    setBusy("link")
    try {
      const created = await affiliateApi.creator.createLink({
        programId: primaryProgramId,
        partnerUserId: payload.partnerUserId || undefined,
        targetType: payload.targetType,
        targetId: payload.targetId,
        targetPath: payload.targetPath,
        label: payload.label,
        campaignName: payload.campaignName,
        utmSource: payload.utmSource,
        utmMedium: payload.utmMedium,
        utmCampaign: payload.utmCampaign,
        utmContent: payload.utmContent,
        tags: payload.tags,
        communityId: scopedCommunityId,
      })

      setLastLinkCode(created.code || created.fullUrl || created.url)
      toast({ title: "Affiliate link generated", description: "The link now includes campaign and UTM tracking." })
      void loadData(true)
    } catch (error: any) {
      toast({
        title: "Link was not generated",
        description: error?.message || "Please check the selected target and partner.",
        variant: "destructive",
      })
    } finally {
      setBusy(null)
    }
  }

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link)
      toast({ title: "Copied", description: "Affiliate link copied to clipboard." })
    } catch {
      toast({
        title: "Copy failed",
        description: "Your browser blocked clipboard access.",
        variant: "destructive",
      })
    }
  }

  const updatePayout = async (payout: any, action: "approve" | "paid") => {
    const id = readId(payout)
    if (!id) return
    setBusy(`payout:${id}:${action}`)
    try {
      if (action === "approve") await affiliateApi.creator.approvePayout(id)
      else await affiliateApi.creator.markPayoutPaid(id)
      setPayouts((current) => current.filter((item) => readId(item) !== id))
      toast({ title: action === "approve" ? "Payout approved" : "Payout marked paid" })
      void loadData(true)
    } catch (error: any) {
      toast({
        title: "Payout was not updated",
        description: error?.message || "Try again in a moment.",
        variant: "destructive",
      })
    } finally {
      setBusy(null)
    }
  }

  if (guard) return guard

  if (!selectedCommunity) {
    return (
      <PageShell className="w-full max-w-none">
        <Alert className="border-[var(--bd)] bg-white">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Select a community to manage affiliate marketing.</AlertDescription>
        </Alert>
      </PageShell>
    )
  }

  if (loading) {
    return <AffiliateLoadingShell />
  }

  const sourceData = (data.breakdowns?.sources || []).map((row) => ({
    ...row,
    label: row.label || row.source || "Unknown",
    value: row.clicks || 0,
  }))
  const deviceData = (data.breakdowns?.devices || []).map((row) => ({
    ...row,
    label: row.label || row.device || "Unknown",
    value: row.clicks || 0,
  }))
  const campaignData = (data.breakdowns?.contentTypes || []).map((row) => ({
    ...row,
    label: row.label || row.contentType || "Content",
    value: row.clicks || 0,
    share: row.conversionRatePct || 0,
  }))
  const funnelRows = data.funnels || []
  const partnerRows = data.leaderboards?.partners || []
  const linkRows = data.leaderboards?.links || []
  const hasTimeSeries = Boolean(data.timeSeries?.length)

  return (
    <PageShell className="w-full max-w-none space-y-6 px-4 pb-10 sm:px-6 lg:px-8">
      <section className="w-full rounded-lg border border-[var(--bd)] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-[#d8d0ff] bg-[#f5f2ff] text-[#5f3ef5] hover:bg-[#f5f2ff]">
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                Affiliate intelligence
              </Badge>
              <Badge variant="outline" className="border-[var(--bd)] bg-white text-[var(--t2)]">
                Source: mongo rollup
              </Badge>
              <Badge variant="outline" className="border-[var(--bd)] bg-white text-[var(--t2)]">
                {period}d window
              </Badge>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-normal text-[var(--t1)]">Affiliate Marketing</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--t2)]">
                Build partner programs, generate tracked links, monitor funnel quality, and prepare campaign-ready
                templates from the precise affiliate backend data.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--t3)]">
              <span>Updated {formatDateTime(data.generatedAt)}</span>
              <span className="h-1 w-1 rounded-full bg-[var(--bd)]" />
              <span>{selectedCommunity.name}</span>
              <span className="h-1 w-1 rounded-full bg-[var(--bd)]" />
              <span>{data.timezone || "UTC"}</span>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row xl:justify-end">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-11 w-full rounded-lg border-[var(--bd)] bg-white sm:w-40">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-lg border-[var(--bd)] bg-white"
              onClick={() => loadData(true)}
              disabled={refreshing}
            >
              {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <MetricTile
            icon={BadgeDollarSign}
            label="Revenue"
            value={money(summary.totalRevenueDT)}
            helper={`${money(summary.totalCommissionDT)} commission`}
            tone="teal"
          />
          <MetricTile
            icon={MousePointerClick}
            label="Tracked Clicks"
            value={compact(summary.clicks)}
            helper={`${compact(summary.uniqueVisitors)} unique visitors`}
            tone="indigo"
          />
          <MetricTile
            icon={Target}
            label="Conversions"
            value={compact(summary.conversions)}
            helper={`${percent(summary.conversionRatePct)} conversion rate`}
            tone="amber"
          />
          <MetricTile
            icon={Users}
            label="Partners"
            value={compact(summary.activePartnerCount)}
            helper={`${compact(summary.pendingPartnerCount)} pending review`}
            tone="rose"
          />
          <MetricTile
            icon={Wallet}
            label="Next Payout"
            value={money(nextRelease?.commissionDT || summary.pendingCommissionDT)}
            helper={formatDate(nextRelease?.holdUntil)}
            tone="violet"
          />
        </div>
      </section>

      {data.insights?.length ? (
        <div className="grid gap-3 lg:grid-cols-3">
          {data.insights.slice(0, 3).map((insight, index) => (
            <InsightCard key={`${insight.title}-${index}`} insight={insight} />
          ))}
        </div>
      ) : null}

      <section className="grid w-full gap-4 xl:grid-cols-[1.45fr_0.75fr]">
        <Panel
          title="Performance Pulse"
          eyebrow="Daily rollup"
          icon={BarChart3}
          action={<Badge variant="outline" className="border-[var(--bd)] bg-white text-[var(--t2)]">{period} days</Badge>}
        >
          {hasTimeSeries ? (
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeSeries} margin={{ top: 12, right: 18, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="clickGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.26} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="conversionGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e9edf5" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="bucket" tickLine={false} axisLine={false} tick={{ fill: "#667085", fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "#667085", fontSize: 12 }} />
                  <RechartsTooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    name="Clicks"
                    stroke="#14b8a6"
                    strokeWidth={2.5}
                    fill="url(#clickGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="conversions"
                    name="Conversions"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#conversionGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="commissionDT"
                    name="Commission"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fillOpacity={0}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyBlock icon={BarChart3} title="No timeline yet" body="Tracked clicks and conversions will appear here as partners share links." />
          )}
        </Panel>

        <Panel title="Funnel Health" eyebrow="Conversion path" icon={Network}>
          <div className="space-y-4">
            {funnelRows.length ? (
              funnelRows.map((step, index) => (
                <div key={step.key || step.label || index} className="rounded-lg border border-[var(--bd)] bg-[#fbfcff] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[var(--t1)]">{step.label || titleCase(step.key)}</p>
                      <p className="mt-1 text-xs text-[var(--t3)]">
                        {compact(step.value)} events
                        {typeof step.dropOffRate === "number" ? ` - ${percent(step.dropOffRate)} drop off` : ""}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-[var(--bd)] bg-white text-[var(--t2)]">
                      {index + 1}
                    </Badge>
                  </div>
                  <Progress value={Math.min(100, Math.max(0, Number(step.rate || step.rateFromPreviousPct || 0)))} className="mt-3 h-2" />
                </div>
              ))
            ) : (
              <EmptyBlock icon={Network} title="Funnel is waiting" body="The backend will fill this once click, cart, checkout, and paid events land." />
            )}
          </div>
        </Panel>
      </section>

      <section className="grid w-full gap-4 xl:grid-cols-3">
        <Panel title="Traffic Sources" eyebrow="Attribution" icon={Share2}>
          <div className="h-[290px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#e9edf5" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#667085", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#667085", fontSize: 12 }} />
                <RechartsTooltip content={<ChartTooltip />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {sourceData.map((_, index) => (
                    <Cell key={`source-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Device Mix" eyebrow="Audience context" icon={SlidersHorizontal}>
          <div className="flex min-h-[290px] flex-col items-center justify-center gap-4 md:flex-row xl:flex-col 2xl:flex-row">
            <div className="h-[210px] w-full min-w-[210px] max-w-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deviceData} innerRadius={58} outerRadius={88} dataKey="value" paddingAngle={3}>
                    {deviceData.map((_, index) => (
                      <Cell key={`device-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full space-y-2">
              {deviceData.map((item: any, index) => (
                <div key={`${item.label}-${index}`} className="flex items-center justify-between rounded-lg border border-[var(--bd)] bg-white px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 text-[var(--t2)]">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
                    {item.label || "Unknown"}
                  </span>
                  <span className="font-semibold text-[var(--t1)]">{compact(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Payout Health" eyebrow="Finance readiness" icon={Wallet}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Pending" value={money(data.payoutHealth?.pendingCommissionDT)} />
              <MiniStat label="Paid" value={money(data.payoutHealth?.paidCommissionDT)} />
              <MiniStat label="Approved" value={money(data.payoutHealth?.approvedCommissionDT)} />
              <MiniStat label="Reversed" value={money(data.payoutHealth?.reversedCommissionDT)} />
            </div>
            <div className="rounded-lg border border-[#d8d0ff] bg-[#f7f4ff] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5f3ef5]">Next release</p>
              <p className="mt-2 text-2xl font-bold text-[var(--t1)]">{money(nextRelease?.commissionDT || 0)}</p>
              <p className="mt-1 text-sm text-[var(--t2)]">{formatDate(nextRelease?.holdUntil)}</p>
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid w-full gap-4 xl:grid-cols-2">
        <Panel title="Top Partners" eyebrow="Ranked by commission" icon={Crown}>
          <PartnerPerformanceTable rows={partnerRows} />
        </Panel>
        <Panel title="Top Links" eyebrow="Campaign quality" icon={Link2}>
          <LinkPerformanceTable rows={linkRows} onCopy={copyLink} />
        </Panel>
      </section>

      <Tabs defaultValue="programs" className="w-full">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-lg border border-[var(--bd)] bg-white p-1 shadow-sm">
          <TabsTrigger value="programs" className="rounded-md px-4 py-2 data-[state=active]:bg-[#f5f2ff] data-[state=active]:text-[#5f3ef5]">
            Programs
          </TabsTrigger>
          <TabsTrigger value="partners" className="rounded-md px-4 py-2 data-[state=active]:bg-[#f5f2ff] data-[state=active]:text-[#5f3ef5]">
            Partners
          </TabsTrigger>
          <TabsTrigger value="links" className="rounded-md px-4 py-2 data-[state=active]:bg-[#f5f2ff] data-[state=active]:text-[#5f3ef5]">
            Link Builder
          </TabsTrigger>
          <TabsTrigger value="templates" className="rounded-md px-4 py-2 data-[state=active]:bg-[#f5f2ff] data-[state=active]:text-[#5f3ef5]">
            Templates
          </TabsTrigger>
          <TabsTrigger value="payouts" className="rounded-md px-4 py-2 data-[state=active]:bg-[#f5f2ff] data-[state=active]:text-[#5f3ef5]">
            Payouts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="mt-4">
          <section className="grid gap-4 xl:grid-cols-[0.86fr_1.14fr]">
            <Panel title="Create Program" eyebrow="Commission engine" icon={Plus}>
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Program name">
                    <Input
                      value={programForm.name}
                      onChange={(event) => setProgramForm((form) => ({ ...form, name: event.target.value }))}
                      className="rounded-lg border-[var(--bd)]"
                    />
                  </Field>
                  <Field label="Scope">
                    <Select
                      value={programForm.scopeType}
                      onValueChange={(value: ProgramFormState["scopeType"]) =>
                        setProgramForm((form) => ({ ...form, scopeType: value }))
                      }
                    >
                      <SelectTrigger className="rounded-lg border-[var(--bd)] bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="community">Community</SelectItem>
                        <SelectItem value="course">Course</SelectItem>
                        <SelectItem value="challenge">Challenge</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="session">Session</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field label="Description">
                  <Input
                    value={programForm.description}
                    onChange={(event) => setProgramForm((form) => ({ ...form, description: event.target.value }))}
                    className="rounded-lg border-[var(--bd)]"
                  />
                </Field>

                <div className="grid gap-3 md:grid-cols-3">
                  <Field label="Commission %">
                    <Input
                      type="number"
                      min="0"
                      value={programForm.commissionPercent}
                      onChange={(event) => setProgramForm((form) => ({ ...form, commissionPercent: event.target.value }))}
                      className="rounded-lg border-[var(--bd)]"
                    />
                  </Field>
                  <Field label="Cookie days">
                    <Input
                      type="number"
                      min="1"
                      value={programForm.cookieWindowDays}
                      onChange={(event) => setProgramForm((form) => ({ ...form, cookieWindowDays: event.target.value }))}
                      className="rounded-lg border-[var(--bd)]"
                    />
                  </Field>
                  <Field label="Hold days">
                    <Input
                      type="number"
                      min="0"
                      value={programForm.holdDays}
                      onChange={(event) => setProgramForm((form) => ({ ...form, holdDays: event.target.value }))}
                      className="rounded-lg border-[var(--bd)]"
                    />
                  </Field>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Attribution">
                    <Select
                      value={programForm.attributionModel}
                      onValueChange={(value: ProgramFormState["attributionModel"]) =>
                        setProgramForm((form) => ({ ...form, attributionModel: value }))
                      }
                    >
                      <SelectTrigger className="rounded-lg border-[var(--bd)] bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last_click">Last click</SelectItem>
                        <SelectItem value="first_click">First click</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="flex items-center justify-between rounded-lg border border-[var(--bd)] bg-[#fbfcff] px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--t1)]">Auto approve partners</p>
                      <p className="text-xs text-[var(--t3)]">Useful for open ambassador launches.</p>
                    </div>
                    <Switch
                      checked={programForm.autoApprovePartners}
                      onCheckedChange={(checked) => setProgramForm((form) => ({ ...form, autoApprovePartners: checked }))}
                    />
                  </div>
                </div>

                <Button type="button" onClick={createProgram} disabled={busy === "program"} className="h-11 rounded-lg chabaqa-primary">
                  {busy === "program" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Create program
                </Button>
              </div>
            </Panel>

            <Panel title="Program Portfolio" eyebrow={`${programs.length} configured`} icon={ShieldCheck}>
              {programs.length ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {programs.map((program) => {
                    const id = readId(program)
                    return (
                      <Card key={id} className="rounded-lg border-[var(--bd)] bg-white shadow-sm">
                        <CardHeader className="space-y-3 pb-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <CardTitle className="text-base text-[var(--t1)]">{program.name}</CardTitle>
                              <p className="mt-1 line-clamp-2 text-sm text-[var(--t2)]">{program.description || "No description"}</p>
                            </div>
                            <StatusChip status={program.status || "draft"} />
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-3 gap-2">
                            <MiniStat label="Commission" value={`${Number(program.commissionPercent || 0)}%`} />
                            <MiniStat label="Cookie" value={`${program.cookieWindowDays || 0}d`} />
                            <MiniStat label="Hold" value={`${program.holdDays || 0}d`} />
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-lg border-[var(--bd)]"
                              onClick={() => setLinkProgramId(id)}
                            >
                              <Link2 className="mr-2 h-4 w-4" />
                              Build link
                            </Button>
                            <Button
                              type="button"
                              variant={program.status === "active" ? "outline" : "default"}
                              size="sm"
                              className={program.status === "active" ? "rounded-lg border-[var(--bd)]" : "rounded-lg chabaqa-primary"}
                              disabled={busy === `program:${id}`}
                              onClick={() => toggleProgramStatus(program)}
                            >
                              {busy === `program:${id}` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowUpRight className="mr-2 h-4 w-4" />}
                              {program.status === "active" ? "Pause" : "Activate"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <EmptyBlock icon={ShieldCheck} title="No programs yet" body="Create the first program to unlock invites, links, commissions, and partner analytics." />
              )}
            </Panel>
          </section>
        </TabsContent>

        <TabsContent value="partners" className="mt-4">
          <section className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
            <Panel title="Invite Partner" eyebrow="Ambassador CRM" icon={UserPlus}>
              <div className="space-y-4">
                <Field label="Program">
                  <Select value={inviteProgramId} onValueChange={setInviteProgramId}>
                    <SelectTrigger className="rounded-lg border-[var(--bd)] bg-white">
                      <SelectValue placeholder="Choose program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programOptions.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="User ID">
                    <Input
                      value={inviteForm.userId}
                      onChange={(event) => setInviteForm((form) => ({ ...form, userId: event.target.value }))}
                      placeholder="Existing user ID"
                      className="rounded-lg border-[var(--bd)]"
                    />
                  </Field>
                  <Field label="Email">
                    <Input
                      value={inviteForm.email}
                      onChange={(event) => setInviteForm((form) => ({ ...form, email: event.target.value }))}
                      placeholder="partner@email.com"
                      className="rounded-lg border-[var(--bd)]"
                    />
                  </Field>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Display name">
                    <Input
                      value={inviteForm.displayName}
                      onChange={(event) => setInviteForm((form) => ({ ...form, displayName: event.target.value }))}
                      className="rounded-lg border-[var(--bd)]"
                    />
                  </Field>
                  <Field label="Custom commission %">
                    <Input
                      type="number"
                      min="0"
                      value={inviteForm.customCommissionPercent}
                      onChange={(event) =>
                        setInviteForm((form) => ({ ...form, customCommissionPercent: event.target.value }))
                      }
                      className="rounded-lg border-[var(--bd)]"
                    />
                  </Field>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Coupon code">
                    <Input
                      value={inviteForm.couponCode}
                      onChange={(event) => setInviteForm((form) => ({ ...form, couponCode: event.target.value.toUpperCase() }))}
                      className="rounded-lg border-[var(--bd)]"
                    />
                  </Field>
                  <Field label="Source">
                    <Input
                      value={inviteForm.source}
                      onChange={(event) => setInviteForm((form) => ({ ...form, source: event.target.value }))}
                      className="rounded-lg border-[var(--bd)]"
                    />
                  </Field>
                </div>

                <Field label="Tags">
                  <Input
                    value={inviteForm.tags}
                    onChange={(event) => setInviteForm((form) => ({ ...form, tags: event.target.value }))}
                    placeholder="instagram, vip, launch"
                    className="rounded-lg border-[var(--bd)]"
                  />
                </Field>

                <Button type="button" onClick={invitePartner} disabled={busy === "invite"} className="h-11 rounded-lg chabaqa-primary">
                  {busy === "invite" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Invite partner
                </Button>
              </div>
            </Panel>

            <Panel title="Partner Pipeline" eyebrow={`${partners.length} partners`} icon={Users}>
              <div className="overflow-hidden rounded-lg border border-[var(--bd)]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#fbfcff]">
                      <TableHead>Partner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Links</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partners.length ? (
                      partners.map((partner) => {
                        const id = readId(partner)
                        const user = (partner as any).user || {}
                        return (
                          <TableRow key={id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-[var(--t1)]">
                                  {partner.displayName || user.name || user.email || partner.email || `Partner ${id.slice(-5)}`}
                                </p>
                                <p className="text-xs text-[var(--t3)]">{partner.email || user.email || id}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <StatusChip status={partner.status || "pending"} />
                            </TableCell>
                            <TableCell>{partner.customCommissionPercent ? `${partner.customCommissionPercent}%` : "Program default"}</TableCell>
                            <TableCell>{compact((partner as any).linkCount || (partner as any).linksCount)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="rounded-lg border-[var(--bd)]"
                                  disabled={busy?.startsWith(`partner:${id}`)}
                                  onClick={() => updatePartnerStatus(partner, "approved")}
                                >
                                  Approve
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="rounded-lg text-[var(--t2)]"
                                  disabled={busy?.startsWith(`partner:${id}`)}
                                  onClick={() => updatePartnerStatus(partner, "rejected")}
                                >
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <EmptyBlock icon={Users} title="No partners yet" body="Invite partner profiles, approve applications, and track their link performance here." />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Panel>
          </section>
        </TabsContent>

        <TabsContent value="links" className="mt-4">
          <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4">
              <Panel title="Link Context" eyebrow="Program selection" icon={Link2}>
                <div className="space-y-4">
                  <Field label="Program used for generated links">
                    <Select value={primaryProgramId} onValueChange={setLinkProgramId}>
                      <SelectTrigger className="rounded-lg border-[var(--bd)] bg-white">
                        <SelectValue placeholder="Choose active program" />
                      </SelectTrigger>
                      <SelectContent>
                        {programOptions.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.label} - {program.commissionPercent}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  {selectedProgram ? (
                    <div className="grid grid-cols-3 gap-2">
                      <MiniStat label="Program" value={selectedProgram.status || "draft"} />
                      <MiniStat label="Commission" value={`${selectedProgram.commissionPercent || 0}%`} />
                      <MiniStat label="Cookie" value={`${selectedProgram.cookieWindowDays || 0}d`} />
                    </div>
                  ) : (
                    <EmptyBlock icon={Link2} title="Create a program first" body="The link builder unlocks after at least one affiliate program exists." />
                  )}
                  {lastLinkCode ? (
                    <div className="rounded-lg border border-[#d8d0ff] bg-[#f7f4ff] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5f3ef5]">Latest link</p>
                      <div className="mt-2 flex items-center gap-2">
                        <code className="min-w-0 flex-1 truncate rounded-md bg-white px-3 py-2 text-xs text-[var(--t1)]">
                          {lastLinkCode}
                        </code>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="rounded-lg border-[var(--bd)] bg-white"
                          onClick={() => copyLink(lastLinkCode)}
                          aria-label="Copy latest affiliate link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </Panel>

              <Panel title="Campaign Mix" eyebrow="UTM performance" icon={Megaphone}>
                {campaignData.length ? (
                  <div className="space-y-3">
                    {campaignData.slice(0, 6).map((item: any, index) => (
                      <div key={`${item.label}-${index}`} className="rounded-lg border border-[var(--bd)] bg-[#fbfcff] p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-[var(--t1)]">{item.label || "Campaign"}</p>
                          <span className="text-sm font-semibold text-[var(--t1)]">{compact(item.value)}</span>
                        </div>
                        <Progress value={Math.min(100, Number(item.share || item.rate || 0))} className="mt-2 h-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyBlock icon={Megaphone} title="No campaigns yet" body="Generated UTM campaigns will appear after tracked partner activity starts." />
                )}
              </Panel>
            </div>

            <AffiliateLinkBuilder
              partners={partnerOptions}
              targetsByType={targetOptions}
              baseUrl={typeof window !== "undefined" ? window.location.origin : ""}
              createdCode={lastLinkCode}
              loading={busy === "link"}
              utmPresets={data.linkBuilder?.utmPresets || undefined}
              onSubmit={createLink}
            />
          </section>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <Panel title="Marketing Templates" eyebrow={`${data.templates?.length || 0} backend templates`} icon={Mail}>
              {data.templates?.length ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {data.templates.map((template, index) => (
                    <TemplateCard key={template.id || `${template.name}-${index}`} template={template} />
                  ))}
                </div>
              ) : (
                <EmptyBlock icon={Mail} title="No templates returned" body="The backend template catalog will appear here once marketing templates are enabled." />
              )}
            </Panel>

            <Panel title="Merge Fields" eyebrow="Personalization data" icon={Sparkles}>
              {data.mergeFields?.length ? (
                <div className="space-y-4">
                  {data.mergeFields.map((group) => (
                    <div key={group.key} className="rounded-lg border border-[var(--bd)] bg-[#fbfcff] p-4">
                      <p className="text-sm font-semibold text-[var(--t1)]">{group.label || titleCase(group.key)}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {group.fields.slice(0, 12).map((field) => (
                          <Badge
                            key={field.key}
                            variant="outline"
                            className="border-[#d8d0ff] bg-white font-mono text-[11px] text-[#5f3ef5]"
                          >
                            {field.token || `{{${field.key}}}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyBlock icon={Sparkles} title="No merge fields yet" body="Partner, program, link, payout, and campaign fields will show here for email and message composers." />
              )}
            </Panel>
          </section>
        </TabsContent>

        <TabsContent value="payouts" className="mt-4">
          <Panel title="Pending Payouts" eyebrow={canReviewPayouts ? "Admin review" : "Finance summary"} icon={Wallet}>
            {canReviewPayouts ? (
              payouts.length ? (
                <div className="overflow-hidden rounded-lg border border-[var(--bd)]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#fbfcff]">
                        <TableHead>Partner</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((payout) => {
                        const id = readId(payout)
                        return (
                          <TableRow key={id}>
                            <TableCell>
                              <p className="font-medium text-[var(--t1)]">
                                {payout.partner?.displayName || payout.partner?.email || payout.partnerId || "Partner"}
                              </p>
                              <p className="text-xs text-[var(--t3)]">{id}</p>
                            </TableCell>
                            <TableCell>{money(payout.amount || payout.amountCents / 100)}</TableCell>
                            <TableCell>
                              <StatusChip status={payout.status || "pending"} />
                            </TableCell>
                            <TableCell>{formatDate(payout.createdAt)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="rounded-lg border-[var(--bd)]"
                                  disabled={busy?.startsWith(`payout:${id}`)}
                                  onClick={() => updatePayout(payout, "approve")}
                                >
                                  Approve
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="rounded-lg chabaqa-primary"
                                  disabled={busy?.startsWith(`payout:${id}`)}
                                  onClick={() => updatePayout(payout, "paid")}
                                >
                                  Mark paid
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyBlock icon={Wallet} title="No pending payouts" body="Approved partner commissions will appear here when they are ready for payout review." />
              )
            ) : (
              <div className="grid gap-3 md:grid-cols-4">
                <MiniStat label="Pending" value={money(data.payoutHealth?.pendingCommissionDT)} />
                <MiniStat label="Approved" value={money(data.payoutHealth?.approvedCommissionDT)} />
                <MiniStat label="Paid" value={money(data.payoutHealth?.paidCommissionDT)} />
                <MiniStat label="Next date" value={formatDate(nextRelease?.holdUntil)} />
              </div>
            )}
          </Panel>
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}

function AffiliateLoadingShell() {
  return (
    <PageShell className="w-full max-w-none space-y-6 px-4 pb-10 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-[var(--bd)] bg-white p-5 shadow-sm">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-lg" />
          ))}
        </div>
      </section>
      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.75fr]">
        <Skeleton className="h-[430px] rounded-lg" />
        <Skeleton className="h-[430px] rounded-lg" />
      </div>
    </PageShell>
  )
}

function MetricTile({
  icon: Icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string
  helper: string
  tone: "teal" | "indigo" | "amber" | "rose" | "violet"
}) {
  const tones = {
    teal: "bg-[#e9fbf7] text-[#0f766e]",
    indigo: "bg-[#eef2ff] text-[#4f46e5]",
    amber: "bg-[#fff7df] text-[#b45309]",
    rose: "bg-[#fff1f4] text-[#e11d48]",
    violet: "bg-[#f5f2ff] text-[#6d4aff]",
  }

  return (
    <Card className="rounded-lg border-[var(--bd)] bg-white shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[var(--t2)]">{label}</p>
            <p className="mt-2 text-2xl font-bold tracking-normal text-[var(--t1)]">{value}</p>
          </div>
          <span className={`grid h-10 w-10 place-items-center rounded-lg ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
          </span>
        </div>
        <p className="mt-4 text-sm text-[var(--t3)]">{helper}</p>
      </CardContent>
    </Card>
  )
}

function Panel({
  title,
  eyebrow,
  icon: Icon,
  action,
  children,
}: {
  title: string
  eyebrow?: string
  icon: LucideIcon
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <Card className="w-full rounded-lg border-[var(--bd)] bg-white shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-[var(--bd)] pb-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#f5f2ff] text-[#5f3ef5]">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--t3)]">{eyebrow}</p> : null}
            <CardTitle className="mt-1 text-lg text-[var(--t1)]">{title}</CardTitle>
          </div>
        </div>
        {action}
      </CardHeader>
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-[var(--t2)]">{label}</Label>
      {children}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--bd)] bg-[#fbfcff] p-3">
      <p className="text-xs font-medium text-[var(--t3)]">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-[var(--t1)]">{value}</p>
    </div>
  )
}

function EmptyBlock({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <div className="flex min-h-[190px] flex-col items-center justify-center rounded-lg border border-dashed border-[var(--bd)] bg-[#fbfcff] p-6 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-lg bg-white text-[#5f3ef5] shadow-sm">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 font-semibold text-[var(--t1)]">{title}</p>
      <p className="mt-1 max-w-sm text-sm leading-6 text-[var(--t2)]">{body}</p>
    </div>
  )
}

function InsightCard({ insight }: { insight: AffiliateMarketingResponse["insights"][number] }) {
  const tone =
    insight.severity === "critical"
      ? "border-[#fecdd3] bg-[#fff1f4] text-[#be123c]"
      : insight.severity === "warning"
        ? "border-[#fde68a] bg-[#fffbeb] text-[#b45309]"
        : "border-[#ccfbf1] bg-[#f0fdfa] text-[#0f766e]"

  return (
    <Card className={`rounded-lg shadow-sm ${tone}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/80">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold">{insight.title}</p>
            <p className="mt-1 text-sm leading-6 opacity-85">{insight.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PartnerPerformanceTable({ rows }: { rows: AffiliateMarketingResponse["leaderboards"]["partners"] }) {
  if (!rows.length) {
    return <EmptyBlock icon={Crown} title="No partner rankings yet" body="Partner revenue, clicks, conversions, and commissions will be ranked here." />
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--bd)]">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#fbfcff]">
            <TableHead>Partner</TableHead>
            <TableHead>Clicks</TableHead>
            <TableHead>Conv.</TableHead>
            <TableHead>Revenue</TableHead>
            <TableHead>Commission</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, 8).map((row, index) => (
            <TableRow key={row.partnerUserId || row.name || index}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#f5f2ff] text-xs font-bold text-[#5f3ef5]">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-[var(--t1)]">{row.name || "Partner"}</p>
                    <p className="text-xs text-[var(--t3)]">{row.email || row.partnerUserId}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{compact(row.clicks)}</TableCell>
              <TableCell>{compact(row.conversions)}</TableCell>
              <TableCell>{money(row.revenueDT)}</TableCell>
              <TableCell>{money(row.commissionDT)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function LinkPerformanceTable({
  rows,
  onCopy,
}: {
  rows: AffiliateMarketingResponse["leaderboards"]["links"]
  onCopy: (value: string) => void
}) {
  if (!rows.length) {
    return <EmptyBlock icon={Link2} title="No tracked links yet" body="Top links will rank by clicks, conversions, commission, and conversion rate." />
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--bd)]">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#fbfcff]">
            <TableHead>Link</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Clicks</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead className="text-right">Copy</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, 8).map((row, index) => (
            <TableRow key={row.linkCode || row.code || index}>
              <TableCell>
                <p className="font-medium text-[var(--t1)]">{row.label || row.code || "Affiliate link"}</p>
                <p className="text-xs text-[var(--t3)]">{row.campaignName || row.utmCampaign || row.linkCode}</p>
              </TableCell>
              <TableCell>{titleCase(row.targetContentType)}</TableCell>
              <TableCell>{compact(row.clicks)}</TableCell>
              <TableCell>{percent(row.conversionRatePct)}</TableCell>
              <TableCell className="text-right">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="rounded-lg"
                  aria-label="Copy affiliate link"
                  onClick={() => onCopy(row.fullUrl || row.code || "")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function TemplateCard({ template }: { template: AffiliateMarketingTemplate }) {
  const channel = template.channel || template.channels?.[0] || "email"
  const key = String(template.icon || template.category || channel || "mail").toLowerCase()
  const Icon = templateIconMap[key] || (channel === "message" ? MessageSquare : Mail)
  const fields = template.requiredFields?.length ? template.requiredFields : template.recommendedVariables || template.variables || []

  return (
    <Card className="rounded-lg border-[var(--bd)] bg-white shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#f5f2ff] text-[#5f3ef5]">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-[var(--t1)]">{template.name || template.title}</p>
              <Badge variant="outline" className="border-[var(--bd)] bg-white text-[var(--t2)]">
                {titleCase(channel)}
              </Badge>
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--t2)]">
              {template.description || template.goal || template.audienceSegment}
            </p>
            <div className="mt-3 rounded-lg border border-[var(--bd)] bg-[#fbfcff] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--t3)]">Subject</p>
              <p className="mt-1 truncate text-sm font-medium text-[var(--t1)]">{template.subject || template.title || "Ready to personalize"}</p>
            </div>
            {fields.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {fields.slice(0, 4).map((field) => (
                  <Badge key={field} variant="outline" className="border-[#d8d0ff] bg-[#f7f4ff] text-[#5f3ef5]">
                    {field}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-[var(--bd)] bg-white p-3 shadow-lg">
      {label ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--t3)]">{label}</p> : null}
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => (
          <div key={`${entry.name}-${index}`} className="flex items-center justify-between gap-6 text-sm">
            <span className="flex items-center gap-2 text-[var(--t2)]">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color || entry.fill }} />
              {entry.name || entry.dataKey}
            </span>
            <span className="font-semibold text-[var(--t1)]">{compact(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
