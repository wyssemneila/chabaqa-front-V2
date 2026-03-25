"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { usePathname, useRouter } from "next/navigation"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { adminApi, type AdminAnalyticsReportRequest } from "@/lib/api/admin-api"
import { MetricCard } from "@/app/(admin)/_components/metric-card"
import { ChartCard } from "@/app/(admin)/_components/chart-card"
import { ExportDialog } from "@/app/(admin)/_components/export-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Building2,
  FileText,
  Coins,
  TrendingUp,
  Activity,
  Clock,
  Download,
  Calendar,
  Settings,
  AlertTriangle,
  CheckCircle2,
  HeartPulse,
  GitCompareArrows,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { localizeHref } from "@/lib/i18n/client"
import { useLocale } from "next-intl"
import { formatCurrency as formatLocalizedCurrency, formatDate } from "@/lib/i18n/format"

const LineChart = dynamic(
  () => import("@/app/(admin)/_components/charts/line-chart").then((mod) => ({ default: mod.LineChart })),
  {
    loading: () => (
      <div className="flex h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    ),
    ssr: false,
  },
)

const BarChart = dynamic(
  () => import("@/app/(admin)/_components/charts/bar-chart").then((mod) => ({ default: mod.BarChart })),
  {
    loading: () => (
      <div className="flex h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    ),
    ssr: false,
  },
)

interface PlatformStatistics {
  totalUsers: number
  totalCommunities: number
  totalContent: number
  totalRevenue: number
  activeUsers: number
  newUsers: number
  growthRate: number
  healthScore: number
}

interface EngagementMetrics {
  totalSessions: number
  averageSessionDuration: number
  pageViews: number
  bounceRate: number
  contentInteractions: number
  communityParticipation: number
  engagementRate: number
  breakdown?: Array<{
    metric: string
    value: number
  }>
}

interface RetentionAnalysis {
  day1Retention: number
  day7Retention: number
  day30Retention: number
  overallRetention: number
  churnRate: number
  cohortAnalysis: CohortData[]
}

interface CohortData {
  period: string
  size: number
  retained: number
  retentionRate: number
}

interface DashboardData {
  platformStatistics: PlatformStatistics
  engagementMetrics: EngagementMetrics
  retentionAnalysis: RetentionAnalysis
  userGrowth?: {
    dailyBreakdown?: Array<{
      date: string | Date
      value: number
    }>
  }
  generatedAt?: string | Date
}

interface AlertConfig {
  _id?: string
  metric: string
  threshold: number
  condition: "above" | "below"
  enabled: boolean
}

type AnalyticsRange = "week" | "month" | "quarter" | "year"
type JsonRecord = Record<string, unknown>

interface OperationalAnalytics {
  dashboard: JsonRecord | null
  userGrowth: JsonRecord | null
  engagement: JsonRecord | null
  revenue: JsonRecord | null
  health: JsonRecord | null
  comparative: JsonRecord | null
}

function asObject(value: unknown): JsonRecord {
  return value !== null && typeof value === "object" ? (value as JsonRecord) : {}
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function getDefaultStartDate(range: AnalyticsRange): string {
  const now = new Date()
  switch (range) {
    case "week":
      now.setDate(now.getDate() - 7)
      break
    case "month":
      now.setMonth(now.getMonth() - 1)
      break
    case "quarter":
      now.setMonth(now.getMonth() - 3)
      break
    case "year":
      now.setFullYear(now.getFullYear() - 1)
      break
  }
  return now.toISOString()
}

function getGranularity(range: AnalyticsRange): "day" | "week" | "month" | "year" {
  switch (range) {
    case "week":
      return "day"
    case "month":
      return "week"
    case "quarter":
    case "year":
      return "month"
    default:
      return "day"
  }
}

export default function AnalyticsDashboardPage() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const { isAuthenticated, loading: authLoading } = useAdminAuth()

  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [dateRange, setDateRange] = useState<AnalyticsRange>("month")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [alertsDialogOpen, setAlertsDialogOpen] = useState(false)
  const [alerts, setAlerts] = useState<AlertConfig[]>([])
  const [operational, setOperational] = useState<OperationalAnalytics>({
    dashboard: null,
    userGrowth: null,
    engagement: null,
    revenue: null,
    health: null,
    comparative: null,
  })
  const [reportType, setReportType] = useState<AdminAnalyticsReportRequest["type"]>("executive")
  const [reportFormat, setReportFormat] = useState<AdminAnalyticsReportRequest["format"]>("json")
  const [generatingReport, setGeneratingReport] = useState(false)
  const [reportResult, setReportResult] = useState<JsonRecord | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(localizeHref(pathname, "/admin/login"))
    }
  }, [authLoading, isAuthenticated, pathname, router])

  const period = useMemo(() => {
    const start = startDate || getDefaultStartDate(dateRange)
    const end = endDate || new Date().toISOString()
    return {
      startDate: start,
      endDate: end,
      granularity: getGranularity(dateRange),
    }
  }, [dateRange, endDate, startDate])

  useEffect(() => {
    if (!isAuthenticated || authLoading) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const [
          dashboardRes,
          alertsRes,
          operationalDashboardRes,
          userGrowthRes,
          engagementRes,
          revenueRes,
          healthRes,
          comparativeRes,
        ] = await Promise.all([
          adminApi.analytics.getDashboard(period),
          adminApi.analytics.getAlerts().catch(() => ({ data: [] })),
          adminApi.analytics.getAdminAnalyticsDashboard(period).catch(() => ({ data: {} })),
          adminApi.analytics.getAdminUserGrowth(period).catch(() => ({ data: {} })),
          adminApi.analytics.getAdminEngagement(period).catch(() => ({ data: {} })),
          adminApi.analytics.getAdminRevenue(period).catch(() => ({ data: {} })),
          adminApi.analytics.getAdminHealth(period).catch(() => ({ data: {} })),
          adminApi.analytics.getAdminComparative(period).catch(() => ({ data: {} })),
        ])

        setDashboardData((dashboardRes?.data || dashboardRes) as DashboardData)

        const alertsData = alertsRes?.data || []
        setAlerts(Array.isArray(alertsData) ? (alertsData as AlertConfig[]) : [])

        setOperational({
          dashboard: asObject(operationalDashboardRes?.data),
          userGrowth: asObject(userGrowthRes?.data),
          engagement: asObject(engagementRes?.data),
          revenue: asObject(revenueRes?.data),
          health: asObject(healthRes?.data),
          comparative: asObject(comparativeRes?.data),
        })
      } catch (error) {
        console.error("[Analytics Dashboard] Failed to load analytics", error)
        toast.error("Failed to load analytics data")
      } finally {
        setLoading(false)
      }
    }

    void fetchData()
  }, [authLoading, isAuthenticated, period])

  const handleExport = async (format: "csv" | "json" | "pdf", options: { startDate?: string; endDate?: string; includeDetails?: boolean }) => {
    try {
      await adminApi.analytics.exportAnalytics({
        format,
        startDate: options.startDate || period.startDate,
        endDate: options.endDate || period.endDate,
        includeCharts: options.includeDetails,
      })
      toast.success(`Analytics exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error("[Analytics Export] Failed", error)
      throw error
    }
  }

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true)
      const response = await adminApi.analytics.generateAdminReport({
        type: reportType,
        format: reportFormat,
        startDate: period.startDate,
        endDate: period.endDate,
        includeCharts: true,
        includeComparative: reportType === "comparative",
      })
      const result = asObject(response.data)
      setReportResult(result)
      toast.success("Report generated")
    } catch (error) {
      console.error("[Analytics Report] Failed", error)
      toast.error("Failed to generate report")
    } finally {
      setGeneratingReport(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatCurrency = (amount: number): string => {
    return formatLocalizedCurrency(amount, "TND", locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}m ${secs}s`
  }

  const formatPercentage = (value: number): string => `${(value * 100).toFixed(1)}%`

  const calculateGrowth = (value: number) => {
    if (value === 0) return { value: "0%", trend: "neutral" as const }
    const sign = value >= 0 ? "+" : ""
    return {
      value: `${sign}${value.toFixed(1)}%`,
      trend: value >= 0 ? ("up" as const) : ("down" as const),
    }
  }

  const getHealthColor = (score: number): "success" | "warning" | "danger" => {
    if (score >= 80) return "success"
    if (score >= 60) return "warning"
    return "danger"
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const stats = dashboardData?.platformStatistics
  const engagement = dashboardData?.engagementMetrics
  const retention = dashboardData?.retentionAnalysis

  const userGrowthData =
    dashboardData?.userGrowth?.dailyBreakdown?.map((point) => ({
      period: formatDate(point.date, locale, {
        month: "short",
        day: "numeric",
      }),
      users: point.value,
    })) || []

  const healthScore = asNumber(operational.health?.healthScore, stats?.healthScore || 0)
  const operationalRevenue = asNumber(operational.revenue?.totalRevenue, stats?.totalRevenue || 0)
  const operationalGrowth = asNumber(operational.userGrowth?.growthRate, stats?.growthRate || 0)
  const comparativeVariance = asNumber(operational.comparative?.variance, 0)

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Comprehensive platform analytics and operational reporting.</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={(value: AnalyticsRange) => setDateRange(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="quarter">Last 3 Months</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setExportDialogOpen(true)} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setAlertsDialogOpen(true)} variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Alerts
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Custom Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                max={endDate || undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                min={startDate || undefined}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="operational">Operational</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Users"
              value={formatNumber(stats?.totalUsers || 0)}
              change={calculateGrowth(stats?.growthRate || 0)}
              icon={Users}
              color="primary"
            />
            <MetricCard title="Active Users" value={formatNumber(stats?.activeUsers || 0)} icon={Activity} color="success" />
            <MetricCard title="Communities" value={formatNumber(stats?.totalCommunities || 0)} icon={Building2} color="info" />
            <MetricCard title="Total Content" value={formatNumber(stats?.totalContent || 0)} icon={FileText} color="warning" />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <MetricCard title="Total Revenue" value={formatCurrency(stats?.totalRevenue || 0)} icon={Coins} color="primary" />
            <MetricCard
              title="Platform Health"
              value={`${stats?.healthScore || 0}/100`}
              icon={(stats?.healthScore ?? 0) >= 80 ? CheckCircle2 : AlertTriangle}
              color={getHealthColor(stats?.healthScore || 0)}
            />
          </div>

          <ChartCard title="User Growth" description="New users over time" loading={loading}>
            <LineChart
              data={userGrowthData}
              xKey="period"
              yKeys={[{ key: "users", color: "hsl(var(--chart-1))", name: "New Users" }]}
              height={300}
              formatYAxis={(value) => formatNumber(value)}
            />
          </ChartCard>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Total Sessions" value={formatNumber(engagement?.totalSessions || 0)} icon={Activity} color="primary" />
            <MetricCard
              title="Avg Session Duration"
              value={formatDuration(engagement?.averageSessionDuration || 0)}
              icon={Clock}
              color="info"
            />
            <MetricCard title="Page Views" value={formatNumber(engagement?.pageViews || 0)} icon={FileText} color="success" />
            <MetricCard
              title="Engagement Rate"
              value={formatPercentage(engagement?.engagementRate || 0)}
              icon={TrendingUp}
              color="warning"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <MetricCard
              title="Content Interactions"
              value={formatNumber(engagement?.contentInteractions || 0)}
              icon={FileText}
              color="primary"
            />
            <MetricCard
              title="Community Participation"
              value={formatNumber(engagement?.communityParticipation || 0)}
              icon={Building2}
              color="success"
            />
          </div>

          <ChartCard title="Engagement Metrics" description="Current engagement distribution across key metrics" loading={loading}>
            <BarChart
              data={engagement?.breakdown || []}
              xKey="metric"
              yKeys={[{ key: "value", color: "hsl(var(--chart-1))", name: "Count" }]}
              height={300}
              formatYAxis={(value) => formatNumber(value)}
            />
          </ChartCard>

          <Card>
            <CardHeader>
              <CardTitle>Bounce Rate</CardTitle>
              <CardDescription>Percentage of single-page sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{formatPercentage(engagement?.bounceRate || 0)}</div>
              <p className="mt-2 text-sm text-muted-foreground">
                {(engagement?.bounceRate ?? 1) < 0.4 ? "Excellent" : (engagement?.bounceRate ?? 1) < 0.6 ? "Good" : "Needs Improvement"}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retention" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Day 1 Retention" value={formatPercentage(retention?.day1Retention || 0)} icon={Users} color="primary" />
            <MetricCard title="Day 7 Retention" value={formatPercentage(retention?.day7Retention || 0)} icon={Users} color="info" />
            <MetricCard title="Day 30 Retention" value={formatPercentage(retention?.day30Retention || 0)} icon={Users} color="success" />
            <MetricCard title="Churn Rate" value={formatPercentage(retention?.churnRate || 0)} icon={AlertTriangle} color="danger" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Overall Retention Rate</CardTitle>
              <CardDescription>Average user retention across all periods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{formatPercentage(retention?.overallRetention || 0)}</div>
            </CardContent>
          </Card>

          <ChartCard title="Cohort Analysis" description="7-day retention by monthly signup cohort" loading={loading}>
            <BarChart
              data={retention?.cohortAnalysis || []}
              xKey="period"
              yKeys={[{ key: "retentionRate", color: "hsl(var(--chart-1))", name: "Retention Rate" }]}
              height={300}
              formatYAxis={(value) => formatPercentage(value)}
              formatTooltip={(value) => formatPercentage(value)}
            />
          </ChartCard>
        </TabsContent>

        <TabsContent value="operational" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Operational Revenue" value={formatCurrency(operationalRevenue)} icon={Coins} color="primary" />
            <MetricCard title="Health Index" value={`${healthScore}/100`} icon={HeartPulse} color={getHealthColor(healthScore)} />
            <MetricCard title="Growth Delta" value={calculateGrowth(operationalGrowth).value} icon={TrendingUp} color="success" />
            <MetricCard title="Comparative Variance" value={`${comparativeVariance.toFixed(2)}%`} icon={GitCompareArrows} color="info" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Backend Endpoint Coverage</CardTitle>
              <CardDescription>Data below is sourced from `/admin/analytics/*` endpoints.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium">Dashboard</p>
                <pre className="mt-2 max-h-64 overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(operational.dashboard, null, 2)}</pre>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium">User Growth</p>
                <pre className="mt-2 max-h-64 overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(operational.userGrowth, null, 2)}</pre>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium">Engagement</p>
                <pre className="mt-2 max-h-64 overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(operational.engagement, null, 2)}</pre>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium">Revenue</p>
                <pre className="mt-2 max-h-64 overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(operational.revenue, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Reports</CardTitle>
              <CardDescription>Generate reports from `/admin/analytics/report` with current date filters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select value={reportType} onValueChange={(value: AdminAnalyticsReportRequest["type"]) => setReportType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="executive">Executive</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="engagement">Engagement</SelectItem>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="comparative">Comparative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select value={reportFormat} onValueChange={(value: AdminAnalyticsReportRequest["format"]) => setReportFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button onClick={handleGenerateReport} disabled={generatingReport} className="w-full">
                    {generatingReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                    Generate Report
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline">Date range</Badge>
                <span className="text-sm text-muted-foreground">{period.startDate} to {period.endDate}</span>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium">Last generated report payload</p>
                {reportResult ? (
                  <pre className="mt-2 max-h-80 overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(reportResult, null, 2)}</pre>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Generate a report to view structured response data.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {alertsDialogOpen && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Alert Configuration</CardTitle>
                <CardDescription>Configure thresholds for automated alerts</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setAlertsDialogOpen(false)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div key={alert._id || `${alert.metric}-${alert.threshold}`} className="rounded-lg border p-3 text-sm">
                    <p className="font-medium">{alert.metric}</p>
                    <p className="text-muted-foreground">
                      Trigger when {alert.metric} is {alert.condition} {alert.threshold} ({alert.enabled ? "enabled" : "disabled"})
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No analytics alerts configured.</p>
            )}
          </CardContent>
        </Card>
      )}

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExport={handleExport}
        availableFormats={["csv", "json", "pdf"]}
        dateRangeRequired={false}
        title="Export Analytics"
        description="Export analytics data in your preferred format"
      />
    </div>
  )
}
