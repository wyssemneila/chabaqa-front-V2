"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAdminAuth } from "../../providers/admin-auth-provider"
import { adminApi } from "@/lib/api/admin-api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "@/app/(admin)/_components/metric-card"
import {
  ArrowRight,
  Building2,
  Coins,
  FileText,
  LifeBuoy,
  RefreshCcw,
  UserPlus,
  Users,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { localizeHref } from "@/lib/i18n/client"

type WidgetState = {
  label: string
  value: number
  description: string
  available: boolean
  loading: boolean
  error: string | null
}

type DashboardWidgets = {
  totalUsers: WidgetState
  pendingCommunities: WidgetState
  pendingContent: WidgetState
  liveSupport: WidgetState
  revenue: WidgetState
}

const INITIAL_WIDGETS: DashboardWidgets = {
  totalUsers: {
    label: "Total Users",
    value: 0,
    description: "User base",
    available: true,
    loading: true,
    error: null,
  },
  pendingCommunities: {
    label: "Pending Communities",
    value: 0,
    description: "Awaiting approval",
    available: true,
    loading: true,
    error: null,
  },
  pendingContent: {
    label: "Pending Content",
    value: 0,
    description: "Needs review",
    available: true,
    loading: true,
    error: null,
  },
  liveSupport: {
    label: "Live Support Queue",
    value: 0,
    description: "Available tickets",
    available: true,
    loading: true,
    error: null,
  },
  revenue: {
    label: "Revenue",
    value: 0,
    description: "This period",
    available: true,
    loading: true,
    error: null,
  },
}

function getResponsePayload<T>(response: { data?: T } | T): T {
  if (response && typeof response === "object" && "data" in response && response.data) {
    return response.data
  }
  return response as T
}

function getErrorMessage(error: any): string {
  const message = error?.message || "Request failed"
  if (typeof message !== "string") return "Request failed"
  return message
}

export default function AdminDashboardPage() {
  const { admin, isAuthenticated, loading: authLoading, logout, capabilities } = useAdminAuth()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations("admin.dashboard")
  const [loading, setLoading] = useState(true)
  const [growthRate, setGrowthRate] = useState(0)
  const [revenueChange, setRevenueChange] = useState(0)
  const [widgets, setWidgets] = useState<DashboardWidgets>(INITIAL_WIDGETS)

  const widgetText = {
    totalUsers: { label: t("totalUsers"), description: t("userBase") },
    pendingCommunities: { label: t("pendingCommunities"), description: t("awaitingApproval") },
    pendingContent: { label: t("pendingContent"), description: t("needsReview") },
    liveSupport: { label: t("liveSupportQueue"), description: t("availableTickets") },
    revenue: { label: t("revenue"), description: t("thisPeriod") },
  } as const

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(localizeHref(pathname, "/admin/login"))
    }
  }, [authLoading, isAuthenticated, router, pathname])

  useEffect(() => {
    if (!isAuthenticated || authLoading) return

    let cancelled = false

    const fetchDashboard = async () => {
      setLoading(true)

      const period = {
        endDate: new Date().toISOString(),
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
        granularity: "month" as const,
      }

      const tasks = [
        capabilities.analytics ? adminApi.analytics.getDashboard(period) : Promise.resolve(null),
        capabilities.communities ? adminApi.communities.getPendingApprovals({ page: 1, limit: 1 }) : Promise.resolve(null),
        capabilities.contentModeration ? adminApi.contentModeration.getQueueStats() : Promise.resolve(null),
        capabilities.liveSupport ? adminApi.support.getQueueCounts() : Promise.resolve(null),
        !capabilities.analytics && capabilities.financial
          ? adminApi.financial.getRevenueDashboard({ period: "month" })
          : Promise.resolve(null),
      ] as const

      const [analyticsResult, communitiesResult, moderationResult, liveSupportResult, financialResult] = await Promise.allSettled(tasks)

      if (cancelled) return

      const nextWidgets: DashboardWidgets = {
        totalUsers: {
          ...INITIAL_WIDGETS.totalUsers,
          available: capabilities.analytics,
          loading: false,
        },
        pendingCommunities: {
          ...INITIAL_WIDGETS.pendingCommunities,
          available: capabilities.communities,
          loading: false,
        },
        pendingContent: {
          ...INITIAL_WIDGETS.pendingContent,
          available: capabilities.contentModeration,
          loading: false,
        },
        liveSupport: {
          ...INITIAL_WIDGETS.liveSupport,
          available: capabilities.liveSupport,
          loading: false,
        },
        revenue: {
          ...INITIAL_WIDGETS.revenue,
          available: capabilities.analytics || capabilities.financial,
          loading: false,
        },
      }

      if (analyticsResult.status === "fulfilled" && analyticsResult.value) {
        const dashboard = getResponsePayload<any>(analyticsResult.value)
        const platformStats = dashboard?.platformStatistics || {}
        const revenueMetrics = dashboard?.revenueMetrics || {}

        nextWidgets.totalUsers.value = Number(dashboard?.userGrowth?.totalUsers || platformStats?.totalUsers || 0)
        nextWidgets.revenue.value = Number(dashboard?.revenue?.totalRevenue || platformStats?.totalRevenue || 0)
        setGrowthRate(Number(dashboard?.userGrowth?.growthRate || platformStats?.growthRate || 0))
        setRevenueChange(Number(revenueMetrics?.revenueChange || 0))
      } else if (capabilities.analytics) {
        const error = analyticsResult.status === "rejected" ? getErrorMessage(analyticsResult.reason) : "Failed to load analytics"
        nextWidgets.totalUsers.error = error
        nextWidgets.revenue.error = error
        if (error.includes("401")) {
          await logout()
          return
        }
      } else if (financialResult.status === "fulfilled" && financialResult.value) {
        const financialMetrics = getResponsePayload<any>(financialResult.value) || {}
        nextWidgets.revenue.value = Number(financialMetrics?.monthlyRevenue || financialMetrics?.totalRevenue || 0)
      } else if (capabilities.financial) {
        nextWidgets.revenue.error =
          financialResult.status === "rejected" ? getErrorMessage(financialResult.reason) : "Failed to load revenue"
      }

      if (communitiesResult.status === "fulfilled" && communitiesResult.value) {
        const pendingCommunities = getResponsePayload<any>(communitiesResult.value)
        nextWidgets.pendingCommunities.value = Number(pendingCommunities?.total || pendingCommunities?.data?.total || 0)
      } else if (capabilities.communities) {
        nextWidgets.pendingCommunities.error =
          communitiesResult.status === "rejected" ? getErrorMessage(communitiesResult.reason) : "Failed to load communities"
      }

      if (moderationResult.status === "fulfilled" && moderationResult.value) {
        const moderationStats = getResponsePayload<any>(moderationResult.value) || {}
        nextWidgets.pendingContent.value = Number(
          moderationStats?.pending ||
          moderationStats?.pendingCount ||
          moderationStats?.byStatus?.pending ||
          0,
        )
      } else if (capabilities.contentModeration) {
        nextWidgets.pendingContent.error =
          moderationResult.status === "rejected" ? getErrorMessage(moderationResult.reason) : "Failed to load moderation"
      }

      if (liveSupportResult.status === "fulfilled" && liveSupportResult.value) {
        const supportCounts = getResponsePayload<any>(liveSupportResult.value)
        nextWidgets.liveSupport.value = Number(supportCounts?.available || 0)
      } else if (capabilities.liveSupport) {
        nextWidgets.liveSupport.error =
          liveSupportResult.status === "rejected" ? getErrorMessage(liveSupportResult.reason) : "Failed to load live support"
      }

      setWidgets(nextWidgets)
      setLoading(false)
    }

    fetchDashboard().catch(async (error) => {
      if (cancelled) return

      const message = getErrorMessage(error)
      if (message.includes("401")) {
        await logout()
        return
      }

      setLoading(false)
      toast.error(t("failedToLoad"))
    })

    return () => {
      cancelled = true
    }
  }, [authLoading, capabilities, isAuthenticated, logout, t])

  const visibleWidgets = [
    {
      key: "totalUsers",
      icon: Users,
      onClick: localizeHref(pathname, "/admin/users"),
      formatter: (value: number) => value.toLocaleString(),
      trend: growthRate,
      widget: widgets.totalUsers,
    },
    {
      key: "pendingCommunities",
      icon: Building2,
      onClick: localizeHref(pathname, "/admin/communities"),
      formatter: (value: number) => value.toLocaleString(),
      trend: null,
      widget: widgets.pendingCommunities,
    },
    {
      key: "pendingContent",
      icon: FileText,
      onClick: localizeHref(pathname, "/admin/content-moderation"),
      formatter: (value: number) => value.toLocaleString(),
      trend: null,
      widget: widgets.pendingContent,
    },
    {
      key: "liveSupport",
      icon: LifeBuoy,
      onClick: localizeHref(pathname, "/admin/communication/support"),
      formatter: (value: number) => value.toLocaleString(),
      trend: null,
      widget: widgets.liveSupport,
    },
    {
      key: "revenue",
      icon: Coins,
      onClick: localizeHref(pathname, "/admin/financial"),
      formatter: (value: number) =>
        new Intl.NumberFormat("fr-TN", {
          style: "currency",
          currency: "TND",
          maximumFractionDigits: 0,
        }).format(value || 0),
      trend: revenueChange,
      widget: widgets.revenue,
    },
  ].filter(({ widget }) => widget.available)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">{t("loadingDashboardData")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="admin-surface overflow-hidden rounded-[2rem] border-0 shadow-none">
        <div className="grid gap-6 px-6 py-7 lg:grid-cols-[1.5fr_0.9fr] lg:px-8">
          <div className="space-y-5">
            <div className="admin-badge w-fit border-0">Chabaqa operations center</div>
            <div className="space-y-3">
              <h1 className="bg-gradient-to-r from-primary via-[hsl(var(--admin-pink))] to-[hsl(var(--admin-cyan))] bg-clip-text text-4xl font-bold tracking-tight text-transparent">
                Admin Dashboard
              </h1>
              <p className="max-w-2xl text-base text-[hsl(var(--admin-muted))]">
                Welcome back, <span className="font-semibold text-foreground">{admin?.name || "Admin"}</span>. Monitor approvals,
                moderation, support, and revenue from one branded control room.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="admin-surface-muted rounded-3xl p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--admin-muted))]">Capabilities</p>
              <p className="mt-2 text-3xl font-semibold">{visibleWidgets.length}</p>
              <p className="mt-1 text-sm text-[hsl(var(--admin-muted))]">modules active for this admin</p>
            </div>
            <div className="admin-surface-muted rounded-3xl p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--admin-muted))]">User growth</p>
              <p className="mt-2 text-3xl font-semibold">{growthRate >= 0 ? "+" : ""}{growthRate.toFixed(1)}%</p>
              <p className="mt-1 text-sm text-[hsl(var(--admin-muted))]">last 30 days</p>
            </div>
            <div className="admin-surface-muted rounded-3xl p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--admin-muted))]">Revenue change</p>
              <p className="mt-2 text-3xl font-semibold">{revenueChange >= 0 ? "+" : ""}{revenueChange.toFixed(1)}%</p>
              <p className="mt-1 text-sm text-[hsl(var(--admin-muted))]">current reporting period</p>
            </div>
          </div>
        </div>
      </section>

      <div className="admin-section-header">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Operational snapshot</h2>
          <p className="mt-1 text-sm text-[hsl(var(--admin-muted))]">Live metrics from the connected admin services.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {visibleWidgets.map(({ key, icon: Icon, onClick, formatter, trend, widget }) => (
          <MetricCard
            key={key}
            onClick={() => router.push(onClick)}
            title={widgetText[key as keyof typeof widgetText]?.label || widget.label}
            value={formatter(widget.value)}
            icon={Icon}
            color={
              key === "pendingContent" ? "warning" :
              key === "liveSupport" ? "info" :
              key === "revenue" ? "success" :
              "primary"
            }
            change={
              widget.error
                ? { value: widget.error, trend: "neutral" }
                : trend !== null
                  ? { value: `${trend >= 0 ? "+" : ""}${trend.toFixed(1)}% ${widgetText[key as keyof typeof widgetText]?.description || widget.description}`, trend: trend >= 0 ? "up" : "down" }
                  : undefined
            }
          />
        ))}
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {capabilities.users && (
            <Button
              variant="outline"
              className="admin-surface-muted h-28 flex-col items-start justify-between rounded-3xl border-[hsl(var(--admin-border)/0.85)] px-5 py-4 text-left transition hover:-translate-y-0.5 hover:bg-[hsl(var(--admin-primary)/0.06)]"
              onClick={() => router.push(localizeHref(pathname, "/admin/users"))}
            >
              <span className="admin-icon-chip h-11 w-11 rounded-2xl"><UserPlus className="h-5 w-5 text-[hsl(var(--admin-primary-strong))]" /></span>
              <span className="flex w-full items-center justify-between font-medium">Manage Users <ArrowRight className="h-4 w-4 text-[hsl(var(--admin-muted))]" /></span>
            </Button>
          )}

          {capabilities.communities && (
            <Button
              variant="outline"
              className="admin-surface-muted h-28 flex-col items-start justify-between rounded-3xl border-[hsl(var(--admin-border)/0.85)] px-5 py-4 text-left transition hover:-translate-y-0.5 hover:bg-[hsl(var(--admin-success)/0.06)]"
              onClick={() => router.push(localizeHref(pathname, "/admin/communities"))}
            >
              <span className="admin-icon-chip h-11 w-11 rounded-2xl"><Building2 className="h-5 w-5 text-[hsl(var(--admin-success))]" /></span>
              <span className="flex w-full items-center justify-between font-medium">Review Communities <ArrowRight className="h-4 w-4 text-[hsl(var(--admin-muted))]" /></span>
            </Button>
          )}

          {capabilities.contentModeration && (
            <Button
              variant="outline"
              className="admin-surface-muted h-28 flex-col items-start justify-between rounded-3xl border-[hsl(var(--admin-border)/0.85)] px-5 py-4 text-left transition hover:-translate-y-0.5 hover:bg-[hsl(var(--admin-warning)/0.06)]"
              onClick={() => router.push(localizeHref(pathname, "/admin/content-moderation"))}
            >
              <span className="admin-icon-chip h-11 w-11 rounded-2xl"><FileText className="h-5 w-5 text-[hsl(var(--admin-warning))]" /></span>
              <span className="flex w-full items-center justify-between font-medium">Moderate Content <ArrowRight className="h-4 w-4 text-[hsl(var(--admin-muted))]" /></span>
            </Button>
          )}

          {(capabilities.analytics || capabilities.financial) && (
            <Button
              variant="outline"
              className="admin-surface-muted h-28 flex-col items-start justify-between rounded-3xl border-[hsl(var(--admin-border)/0.85)] px-5 py-4 text-left transition hover:-translate-y-0.5 hover:bg-[hsl(var(--admin-cyan)/0.06)]"
              onClick={() => router.push(localizeHref(pathname, capabilities.financial ? "/admin/financial" : "/admin/analytics"))}
            >
              <span className="admin-icon-chip h-11 w-11 rounded-2xl"><RefreshCcw className="h-5 w-5 text-[hsl(var(--admin-cyan))]" /></span>
              <span className="flex w-full items-center justify-between font-medium">View Reports <ArrowRight className="h-4 w-4 text-[hsl(var(--admin-muted))]" /></span>
            </Button>
          )}
        </div>
      </div>

      {visibleWidgets.length === 0 && (
        <Card className="admin-surface rounded-[2rem] border-0 shadow-none">
          <CardHeader>
            <CardTitle>No Dashboard Modules Available</CardTitle>
            <CardDescription>
              This admin account does not currently have dashboard capabilities assigned.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
