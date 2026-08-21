"use client"

import React, { useMemo } from "react"
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
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  BarChart3,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { CreatorAnalyticsChart, CreatorContentChartPack } from "@/lib/api/creator-analytics.api"

const CHART_COLORS = ["#0f766e", "#2563eb", "#f59e0b", "#e11d48", "#7c3aed", "#475569", "#16a34a", "#db2777"]

const PRIMARY_METRICS = [
  "views",
  "starts",
  "completes",
  "completionRate",
  "uniqueUsers",
  "preciseUniqueUsers",
  "revenueAttributed",
  "revenue",
  "orders",
  "likes",
  "shares",
  "bookmarks",
  "comments",
  "downloads",
]

const DAY_ORDER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function toNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function compact(value: number): string {
  return new Intl.NumberFormat(undefined, {
    notation: Math.abs(value) >= 10000 ? "compact" : "standard",
    maximumFractionDigits: Math.abs(value) >= 1000 ? 1 : 0,
  }).format(value)
}

function formatValue(value: unknown, unit?: string): string {
  const number = toNumber(value)
  if (unit === "percent") return `${number.toFixed(number % 1 === 0 ? 0 : 1)}%`
  if (unit === "TND") return `${compact(number)} TND`
  return compact(number)
}

function metricLabel(metric: string): string {
  const labels: Record<string, string> = {
    preciseUniqueUsers: "Unique users",
    uniqueUsers: "Unique users",
    revenueAttributed: "Revenue",
    completionRate: "Completion rate",
    engagementRate: "Engagement rate",
    avgWatchTimeSeconds: "Avg watch time",
    watchTime: "Watch time",
    chapterCompletes: "Chapter completes",
    ratingsCount: "Ratings",
    activeStreaks: "Active streaks",
    maxStreakDays: "Max streak",
    sessionShowUps: "Show-ups",
    sessionNoShows: "No-shows",
    sessionRebookings: "Rebookings",
    rateFromPrevious: "Step rate",
    actionType: "Action",
    stepLabel: "Step",
  }
  if (labels[metric]) return labels[metric]
  return metric
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function chartById(pack: CreatorContentChartPack | null, id: string): CreatorAnalyticsChart | null {
  return pack?.charts?.find((chart) => chart.id === id) || null
}

function visibleRows(chart: CreatorAnalyticsChart | null, limit = 10): Array<Record<string, any>> {
  if (!chart || !Array.isArray(chart.data)) return []
  return chart.data.filter(Boolean).slice(0, limit)
}

function hasData(chart: CreatorAnalyticsChart | null): boolean {
  return visibleRows(chart, 1).length > 0
}

function getMetricKeys(chart: CreatorAnalyticsChart | null, fallback: string[] = []): string[] {
  if (!chart) return fallback
  const fromChart = chart.yKeys?.length ? chart.yKeys : chart.metrics
  const rows = visibleRows(chart, 30)
  const keys = fromChart.filter((metric) => rows.some((row) => toNumber(row?.[metric]) > 0))
  const ordered = PRIMARY_METRICS.filter((metric) => keys.includes(metric))
  return [...ordered, ...keys.filter((metric) => !ordered.includes(metric))].slice(0, 4)
}

function shorten(value: unknown, max = 16): string {
  const text = String(value || "")
  return text.length > max ? `${text.slice(0, max - 1)}...` : text
}

function precisionTone(label?: string): string {
  const normalized = String(label || "").toLowerCase()
  if (normalized.includes("reliable")) return "border-emerald-300 bg-emerald-50 text-emerald-700"
  if (normalized.includes("directional")) return "border-amber-300 bg-amber-50 text-amber-700"
  return "border-slate-300 bg-slate-100 text-slate-700"
}

function contentTitle(label: string, pack: CreatorContentChartPack | null): string {
  return pack?.contentMeta?.title || label
}

function SectionCard({
  chart,
  children,
  className,
}: {
  chart: CreatorAnalyticsChart | null
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn("overflow-hidden border-slate-200 bg-white shadow-sm", className)}>
      <CardHeader className="border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-base font-semibold text-slate-950">
              {chart?.title || "Analytics chart"}
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
              {chart?.description || "No chart description available."}
            </CardDescription>
          </div>
          {chart?.precision && (
            <Badge variant="outline" className="shrink-0 border-slate-200 bg-slate-50 text-[11px] capitalize text-slate-600">
              {chart.precision}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">{children}</CardContent>
    </Card>
  )
}

function EmptyChart({ label = "No chart data yet" }: { label?: string }) {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center rounded-md border border-dashed border-slate-200 bg-white text-center">
      <BarChart3 className="h-7 w-7 text-slate-400" />
      <p className="mt-3 text-sm font-medium text-slate-700">{label}</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">Fresh events will fill this chart as members interact with the selected content type.</p>
    </div>
  )
}

function TrendChart({ chart, height = 340 }: { chart: CreatorAnalyticsChart | null; height?: number }) {
  const rows = visibleRows(chart, 120)
  const keys = getMetricKeys(chart, ["views", "starts", "completes"])

  if (!chart || rows.length === 0 || keys.length === 0) {
    return <EmptyChart label="No time-series data yet" />
  }

  return (
    <div className="h-[340px] min-w-0" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
          <defs>
            {keys.map((key, index) => (
              <linearGradient key={key} id={`chart-fill-${chart.id}-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.22} />
                <stop offset="100%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey={chart.xKey || "date"}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickFormatter={(value) => shorten(value, 10)}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(value) => compact(Number(value))} />
          <Tooltip
            contentStyle={{ border: "1px solid #cbd5e1", borderRadius: 8, boxShadow: "0 16px 40px rgba(15,23,42,0.12)" }}
            formatter={(value, name) => [formatValue(value, chart.unit), metricLabel(String(name))]}
            labelFormatter={(label) => String(label)}
          />
          {keys.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              name={metricLabel(key)}
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2.3}
              fill={`url(#chart-fill-${chart.id}-${key})`}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function BarMetricChart({
  chart,
  xKey,
  yKey,
  limit = 8,
  height = 300,
}: {
  chart: CreatorAnalyticsChart | null
  xKey?: string
  yKey?: string
  limit?: number
  height?: number
}) {
  const rows = visibleRows(chart, limit)
  const resolvedXKey = xKey || chart?.xKey || "label"
  const resolvedYKey = yKey || chart?.valueKey || chart?.yKeys?.[0] || chart?.metrics?.[0] || "value"

  if (!chart || rows.length === 0) return <EmptyChart />

  return (
    <div className="h-[300px] min-w-0" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 18 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey={resolvedXKey}
            axisLine={false}
            tickLine={false}
            height={44}
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickFormatter={(value) => shorten(value, 12)}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(value) => compact(Number(value))} />
          <Tooltip
            contentStyle={{ border: "1px solid #cbd5e1", borderRadius: 8, boxShadow: "0 16px 40px rgba(15,23,42,0.12)" }}
            formatter={(value) => [formatValue(value, chart.unit), metricLabel(resolvedYKey)]}
            labelFormatter={(label) => String(label)}
          />
          <Bar dataKey={resolvedYKey} name={metricLabel(resolvedYKey)} radius={[6, 6, 0, 0]}>
            {rows.map((_, index) => (
              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function DonutChart({ chart }: { chart: CreatorAnalyticsChart | null }) {
  const rows = visibleRows(chart, 8)
  const valueKey = chart?.valueKey || "events"

  if (!chart || rows.length === 0) return <EmptyChart />

  return (
    <div className="grid gap-4 sm:grid-cols-[220px_1fr] sm:items-center">
      <div className="h-[220px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey={valueKey} nameKey="actionType" innerRadius={62} outerRadius={94} paddingAngle={2}>
              {rows.map((_, index) => (
                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [formatValue(value, chart.unit), metricLabel(valueKey)]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={`${row.actionType || row.source || index}`} className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
              {metricLabel(String(row.actionType || row.source || row.label || `Item ${index + 1}`))}
            </span>
            <span className="font-mono text-sm font-semibold text-slate-950">{formatValue(row[valueKey], chart.unit)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FunnelPanel({ chart }: { chart: CreatorAnalyticsChart | null }) {
  const rows = visibleRows(chart, 8)
  const maxUsers = Math.max(...rows.map((row) => toNumber(row.uniqueUsers)), 1)

  if (!chart || rows.length === 0) return <EmptyChart label="No funnel data yet" />

  return (
    <div className="space-y-3">
      {rows.map((row, index) => {
        const users = toNumber(row.uniqueUsers)
        const width = Math.max(6, (users / maxUsers) * 100)
        return (
          <div key={`${row.stepKey || row.stepLabel || index}`} className="rounded-md border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{row.stepLabel || metricLabel(String(row.stepKey || `Step ${index + 1}`))}</p>
                <p className="text-xs text-slate-500">
                  {formatValue(row.events)} events
                  {row.rateFromPrevious != null ? ` / ${formatValue(row.rateFromPrevious, "percent")} from previous` : ""}
                </p>
              </div>
              <span className="font-mono text-sm font-semibold text-slate-950">{formatValue(users)}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${width}%`, backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function HeatmapPanel({ chart }: { chart: CreatorAnalyticsChart | null }) {
  const rows = visibleRows(chart, 250)
  const maxEvents = Math.max(...rows.map((row) => toNumber(row.events)), 1)
  const byKey = new Map(rows.map((row) => [`${row.day}-${row.hour}`, row]))

  if (!chart || rows.length === 0) return <EmptyChart label="No activity heatmap yet" />

  return (
    <div className="overflow-x-auto pb-1">
      <div className="min-w-[760px]">
        <div className="grid items-center gap-1 text-[10px] text-slate-400" style={{ gridTemplateColumns: "56px repeat(24, minmax(18px, 1fr))" }}>
          <span />
          {Array.from({ length: 24 }, (_, hour) => (
            <span key={hour} className="text-center">{hour % 6 === 0 ? `${hour}:00` : ""}</span>
          ))}
        </div>
        <div className="mt-2 space-y-1">
          {DAY_ORDER.map((day) => (
            <div key={day} className="grid items-center gap-1" style={{ gridTemplateColumns: "56px repeat(24, minmax(18px, 1fr))" }}>
              <span className="text-xs font-medium text-slate-500">{day}</span>
              {Array.from({ length: 24 }, (_, hour) => {
                const row = byKey.get(`${day}-${hour}`)
                const events = toNumber(row?.events)
                const opacity = events > 0 ? Math.max(0.18, events / maxEvents) : 0.05
                return (
                  <div
                    key={`${day}-${hour}`}
                    className="h-5 rounded-[4px] border border-white"
                    title={`${day} ${hour}:00 - ${events} events`}
                    style={{ backgroundColor: `rgba(15, 118, 110, ${opacity})` }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LeaderboardPanel({ chart }: { chart: CreatorAnalyticsChart | null }) {
  const rows = visibleRows(chart, 7)
  const metrics = getMetricKeys(chart, ["views", "starts", "completes"]).slice(0, 3)

  if (!chart || rows.length === 0) return <EmptyChart label="No ranked content yet" />

  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={`${row.contentId || row.title || index}`} className="flex min-w-0 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-violet-100 bg-violet-50 font-mono text-xs font-bold text-violet-700">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-950">{row.title || row.name || row.contentId || `Item ${index + 1}`}</p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              {metrics.map((metric) => (
                <span key={metric}>
                  {metricLabel(metric)} <strong className="font-mono text-slate-700">{formatValue(row[metric], chart.unit)}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function LoadingWorkspace() {
  return (
    <section className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
      <div className="space-y-5">
        <div className="h-20 animate-pulse rounded-md bg-slate-100" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-md bg-slate-100" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="h-[420px] animate-pulse rounded-md bg-slate-100 xl:col-span-7" />
          <div className="h-[420px] animate-pulse rounded-md bg-slate-100 xl:col-span-5" />
        </div>
      </div>
    </section>
  )
}

export interface ContentChartWorkspaceProps {
  pack: CreatorContentChartPack | null
  contentTypeLabel: string
  isLoading?: boolean
  error?: string | null
  onRefresh?: () => void
}

export function ContentChartWorkspace({
  pack,
  contentTypeLabel,
  isLoading = false,
  error,
  onRefresh,
}: ContentChartWorkspaceProps) {
  const dailyChart = useMemo(() => chartById(pack, "daily-performance"), [pack])
  const actionTrendChart = useMemo(() => chartById(pack, "action-trend"), [pack])
  const funnelChart = useMemo(() => chartById(pack, "conversion-funnel"), [pack])
  const actionBreakdownChart = useMemo(() => chartById(pack, "action-breakdown"), [pack])
  const leaderboardChart = useMemo(() => chartById(pack, "content-leaderboard"), [pack])
  const devicesChart = useMemo(() => chartById(pack, "audience-devices"), [pack])
  const trafficChart = useMemo(() => chartById(pack, "traffic-sources"), [pack])
  const heatmapChart = useMemo(() => chartById(pack, "activity-heatmap"), [pack])
  const revenueTrendChart = useMemo(() => chartById(pack, "revenue-trend"), [pack])
  const revenueByContentChart = useMemo(() => chartById(pack, "revenue-by-content"), [pack])
  const snapshotChart = useMemo(() => pack?.charts?.find((chart) => chart.id.endsWith("-snapshot")) || null, [pack])
  const specificCharts = useMemo(() => {
    if (!pack?.charts?.length) return []
    const hidden = new Set([
      "daily-performance",
      "action-trend",
      "conversion-funnel",
      "action-breakdown",
      "content-leaderboard",
      "audience-devices",
      "traffic-sources",
      "activity-heatmap",
      "revenue-trend",
      "revenue-by-content",
      snapshotChart?.id || "",
    ])
    return pack.charts.filter((chart) => !hidden.has(chart.id) && hasData(chart)).slice(0, 3)
  }, [pack, snapshotChart?.id])

  if (isLoading && !pack) return <LoadingWorkspace />

  if (!pack) {
    return (
      <section className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">Chart intelligence</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">No chart pack loaded</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {error || "The analytics endpoint did not return chart data for this filter yet."}
            </p>
          </div>
          {onRefresh && (
            <Button type="button" variant="secondary" onClick={onRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Update charts
            </Button>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-50">Chart intelligence</Badge>
              <Badge variant="outline" className={cn("border bg-white text-slate-700", precisionTone(pack.precision?.label))}>
                {pack.precision?.label || "Sample pending"}
              </Badge>
              {isLoading && (
                <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">
                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                  Refreshing
                </Badge>
              )}
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
              {contentTitle(contentTypeLabel, pack)}
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              Full-funnel analytics for {contentTypeLabel.toLowerCase()}: rollups, raw action tracking, funnel health, traffic source quality, device behavior, heatmap timing, and revenue where it applies.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {(pack.precision?.sources || []).slice(0, 4).map((source) => (
              <Badge key={source} variant="outline" className="border-slate-200 bg-white text-xs text-slate-600">
                {source.replace(/_/g, " ")}
              </Badge>
            ))}
            {onRefresh && (
              <Button type="button" variant="secondary" size="sm" onClick={onRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Update charts
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <SectionCard chart={dailyChart} className="xl:col-span-7">
            <TrendChart chart={dailyChart} />
          </SectionCard>
          <SectionCard chart={funnelChart} className="xl:col-span-5">
            <FunnelPanel chart={funnelChart} />
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <SectionCard chart={leaderboardChart} className="xl:col-span-5">
            <LeaderboardPanel chart={leaderboardChart} />
          </SectionCard>
          <SectionCard chart={actionTrendChart} className="xl:col-span-7">
            <TrendChart chart={actionTrendChart} height={320} />
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SectionCard chart={actionBreakdownChart}>
            <DonutChart chart={actionBreakdownChart} />
          </SectionCard>
          <SectionCard chart={devicesChart}>
            <BarMetricChart chart={devicesChart} xKey="device" yKey="users" limit={7} height={260} />
          </SectionCard>
          <SectionCard chart={trafficChart}>
            <BarMetricChart chart={trafficChart} xKey="source" yKey="count" limit={7} height={260} />
          </SectionCard>
          <SectionCard chart={snapshotChart}>
            <BarMetricChart chart={snapshotChart} xKey="metric" yKey="value" limit={8} height={260} />
          </SectionCard>
        </div>

        {(hasData(revenueTrendChart) || hasData(revenueByContentChart)) && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <SectionCard chart={revenueTrendChart} className="xl:col-span-7">
              <TrendChart chart={revenueTrendChart} height={300} />
            </SectionCard>
            <SectionCard chart={revenueByContentChart} className="xl:col-span-5">
              <LeaderboardPanel chart={revenueByContentChart} />
            </SectionCard>
          </div>
        )}

        <SectionCard chart={heatmapChart}>
          <HeatmapPanel chart={heatmapChart} />
        </SectionCard>

        {specificCharts.length > 0 && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {specificCharts.map((chart) => (
              <SectionCard key={chart.id} chart={chart}>
                {chart.visualization === "donut" ? (
                  <DonutChart chart={chart} />
                ) : chart.visualization === "table" ? (
                  <LeaderboardPanel chart={chart} />
                ) : (
                  <BarMetricChart chart={chart} xKey={chart.xKey || "label"} yKey={chart.valueKey || chart.yKeys?.[0] || chart.metrics[0]} height={280} />
                )}
              </SectionCard>
            ))}
          </div>
        )}

        {pack.precision?.notes?.length > 0 && (
          <div className="grid gap-2 text-xs leading-5 text-slate-600 sm:grid-cols-2 xl:grid-cols-3">
            {pack.precision.notes.slice(0, 3).map((note) => (
              <div key={note} className="flex gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
