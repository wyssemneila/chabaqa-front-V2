"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useDashboard,
  DashboardShell,
  DashboardLoading,
  DashboardUnauthorized,
} from "../../components";
import { CommunityPermission } from "@/lib/permissions";
import { usePlan } from "@/hooks/use-plan";
import {
  useAnalyticsOverview,
  useAnalyticsCourses,
  useAnalyticsChallenges,
  useAnalyticsSessions,
  useAnalyticsEvents,
  useAnalyticsProducts,
  useAnalyticsPosts,
  useAnalyticsDevices,
  useAnalyticsReferrers,
  useAnalyticsRevenue,
  useAnalyticsGeography,
  useAnalyticsRetention,
  useAnalyticsCompare,
  useAnalyticsWeeklyReport,
  useAnalyticsExportCsv,
} from "@/hooks/use-creator-analytics";
import { creatorAnalyticsApi } from "@/lib/api/creator-analytics.api";
import { AnalyticsPlanGate, RetentionCohortGrid, GeographyTable, AIInsightsPanel } from "@/components/analytics";
import dynamic from "next/dynamic";

const FunnelChart = dynamic(
  () => import("@/components/analytics/FunnelChart").then(mod => ({ default: mod.FunnelChart })),
  { loading: () => <div className="h-64 w-full animate-pulse rounded-lg bg-muted" />, ssr: false }
);
const RevenueByContentChart = dynamic(
  () => import("@/components/analytics/RevenueByContentChart").then(mod => ({ default: mod.RevenueByContentChart })),
  { loading: () => <div className="h-64 w-full animate-pulse rounded-lg bg-muted" />, ssr: false }
);
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  BarChart3,
  Users,
  TrendingUp,
  DollarSign,
  Eye,
  Activity,
  BookOpen,
  Zap,
  ShoppingBag,
  FileText,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Monitor,
  Globe,
  Download,
  Calendar,
  Target,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";

type TimeRange = "7d" | "30d" | "90d" | "1y";

// ── Stat Card ─────────────────────────────────────────
function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  isLoading,
}: {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  isLoading?: boolean;
}) {
  const isPositive = change != null && change >= 0;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-7 w-20 mb-1" />
            <Skeleton className="h-4 w-16" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {change != null && (
              <div className={`flex items-center text-xs ${isPositive ? "text-green-600" : "text-red-600"}`}>
                {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {isPositive ? "+" : ""}{change}%
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Content Items Table ───────────────────────────────
function ContentTable({
  items,
  isLoading,
  contentType,
  basePath,
}: {
  items: any[];
  isLoading: boolean;
  contentType: string;
  basePath: string;
}) {
  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No {contentType} data for this period</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead className="text-end">Views</TableHead>
          <TableHead className="text-end">Starts</TableHead>
          <TableHead className="text-end">Completes</TableHead>
          <TableHead className="text-end">Rate</TableHead>
          {contentType === "courses" && <TableHead className="text-end">Action</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item: any, idx: number) => {
          const title = item.title || item.name || item.contentId || `${contentType} #${idx + 1}`;
          const views = item.views ?? item.totalViews ?? 0;
          const starts = item.starts ?? item.enrollments ?? item.totalStarts ?? 0;
          const completes = item.completes ?? item.completions ?? item.totalCompletes ?? 0;
          const rate = starts > 0 ? Math.round((completes / starts) * 100) : 0;
          const id = item.courseId || item.challengeId || item.sessionId || item.contentId || item._id;

          return (
            <TableRow key={id || idx}>
              <TableCell className="font-medium max-w-[200px] truncate">{title}</TableCell>
              <TableCell className="text-end">{views.toLocaleString()}</TableCell>
              <TableCell className="text-end">{starts.toLocaleString()}</TableCell>
              <TableCell className="text-end">{completes.toLocaleString()}</TableCell>
              <TableCell className="text-end">{rate}%</TableCell>
              {contentType === "courses" && id && (
                <TableCell className="text-end">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`${basePath}/analytics/courses/${id}`}>Details</Link>
                  </Button>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// ── Daily Trend Chart ─────────────────────────────────
function DailyTrendChart({ data, isLoading }: { data: any[]; isLoading: boolean }) {
  if (isLoading) return <Skeleton className="h-[280px] w-full" />;
  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground text-center py-12">No trend data available</p>;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="viewsG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8e78fb" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#8e78fb" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="completesG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#47c7ea" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#47c7ea" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Area type="monotone" dataKey="views" stroke="#8e78fb" fill="url(#viewsG)" strokeWidth={2} />
        <Area type="monotone" dataKey="completes" stroke="#47c7ea" fill="url(#completesG)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Device Donut ──────────────────────────────────────
const DEVICE_COLORS = ["#8e78fb", "#47c7ea", "#ff9b28", "#f65887", "#22c55e"];

function DeviceDonut({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) return <Skeleton className="h-[220px] w-full" />;

  const devices = data?.devices || data?.breakdown || [];
  if (!devices || devices.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No device data</p>;

  const chartData = devices.slice(0, 5).map((d: any) => ({
    name: d.device || d.type || d.name || "Unknown",
    value: d.count || d.views || d.value || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={80}>
          {chartData.map((_: any, idx: number) => (
            <Cell key={idx} fill={DEVICE_COLORS[idx % DEVICE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Referrers Bar Chart ───────────────────────────────
function ReferrersBar({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) return <Skeleton className="h-[200px] w-full" />;

  const rows = data?.rows || data?.referrers || [];
  if (!rows || rows.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No referrer data</p>;

  const chartData = rows.slice(0, 10).map((r: any) => ({
    name: r.source || r.referrer || r.channel || "Direct",
    views: r.sessions || r.views || r.count || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 36)}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
        <Tooltip />
        <Bar dataKey="views" fill="#8e78fb" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ═══════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════
export default function AdminAnalyticsPage() {
  const { role, can, isLoading: dashLoading, canAccessDashboard, getDashboardPath, creatorSlug, communityId } = useDashboard();
  const basePath = getDashboardPath("admin");
  const { tier: planTier } = usePlan();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [tab, setTab] = useState("overview");

  const isGrowthPlus = planTier === "growth" || planTier === "pro";
  const isProPlus = planTier === "pro";

  // ── Data hooks ────────────────────────────────────
  const overview = useAnalyticsOverview(timeRange, communityId);
  const courses = useAnalyticsCourses(timeRange, communityId);
  const challenges = useAnalyticsChallenges(timeRange, communityId);
  const sessions = useAnalyticsSessions(timeRange, communityId);
  const events = useAnalyticsEvents(timeRange, communityId);
  const products = useAnalyticsProducts(timeRange, communityId);
  const posts = useAnalyticsPosts(timeRange, communityId);
  const devices = useAnalyticsDevices(timeRange, communityId);
  const referrers = useAnalyticsReferrers(timeRange, communityId);
  const revenue = useAnalyticsRevenue(timeRange, communityId, isGrowthPlus);
  const geography = useAnalyticsGeography(timeRange, "country", communityId, isGrowthPlus);
  const retention = useAnalyticsRetention(timeRange, "weekly", communityId, isGrowthPlus);
  const compareViews = useAnalyticsCompare(timeRange, "views", communityId, isGrowthPlus);
  const weeklyReport = useAnalyticsWeeklyReport(isGrowthPlus);
  const exportCsv = useAnalyticsExportCsv();

  // ── Extract overview data ─────────────────────────
  const ov = overview.data?.data ?? overview.data;
  const ovData = ov?.overview ?? ov ?? {};

  const totalViews = ovData.totalViews ?? ovData.views ?? 0;
  const totalStarts = ovData.totalStarts ?? ovData.starts ?? 0;
  const totalCompletes = ovData.totalCompletes ?? ovData.completes ?? 0;
  const totalRevenue = ovData.totalRevenue ?? ovData.revenue ?? 0;
  const totalUniqueUsers = ovData.totalUniqueUsers ?? ovData.uniqueUsers ?? 0;
  const totalWatchTime = ovData.totalWatchTime ?? ovData.watchTime ?? 0;
  const dailyTrend = ovData.dailyTrend ?? ovData.trend ?? ovData.daily ?? [];

  // Change from compare
  const viewsChange = (compareViews.data as any)?.data?.change ?? (compareViews.data as any)?.change;

  // ── Guards ────────────────────────────────────────
  if (dashLoading) return <DashboardLoading message="Loading analytics..." />;
  if (!canAccessDashboard("admin")) {
    return <DashboardUnauthorized role={role} requiredRole="admin" backAction={{ label: "Back", href: `/${creatorSlug}` }} />;
  }
  if (!can(CommunityPermission.ANALYTICS_VIEW)) {
    return (
      <DashboardShell variant="admin">
        <DashboardUnauthorized role={role} requiredRole="admin with analytics.view" backAction={{ label: "Back", href: basePath }} />
      </DashboardShell>
    );
  }

  const handleExport = async (scope: string) => {
    const { from, to } = (() => {
      const t = new Date().toISOString().slice(0, 10);
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365;
      const f = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
      return { from: f, to: t };
    })();
    try {
      const res = await exportCsv.mutateAsync({ scope: scope as any, from, to, communityId });
      const csvData = res?.data?.csv ?? (res as any)?.csv;
      if (csvData) {
        const blob = new Blob([csvData], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `analytics-${scope}-${from}-${to}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch { /* handled by mutation state */ }
  };

  return (
    <DashboardShell variant="admin">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={basePath}><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
        </Button>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
            <p className="mt-1 text-muted-foreground">Deep insights into your content performance</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                {isGrowthPlus && <SelectItem value="90d">Last 3 months</SelectItem>}
                {isProPlus && <SelectItem value="1y">Last year</SelectItem>}
              </SelectContent>
            </Select>
            {isProPlus && (
              <Button variant="outline" size="sm" onClick={() => handleExport("overview")} disabled={exportCsv.isPending}>
                <Download className="h-4 w-4 mr-1" />CSV
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={() => overview.refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 mb-8">
        <MetricCard title="Total Views" value={overview.isLoading ? "—" : totalViews.toLocaleString()} change={viewsChange} icon={Eye} isLoading={overview.isLoading} />
        <MetricCard title="Starts" value={overview.isLoading ? "—" : totalStarts.toLocaleString()} icon={Activity} isLoading={overview.isLoading} />
        <MetricCard title="Completions" value={overview.isLoading ? "—" : totalCompletes.toLocaleString()} icon={Target} isLoading={overview.isLoading} />
        <MetricCard title="Revenue" value={overview.isLoading ? "—" : `${totalRevenue.toLocaleString()} TND`} icon={DollarSign} isLoading={overview.isLoading} />
        <MetricCard title="Unique Users" value={overview.isLoading ? "—" : totalUniqueUsers.toLocaleString()} icon={Users} isLoading={overview.isLoading} />
        <MetricCard title="Watch Time" value={overview.isLoading ? "—" : `${Math.round(totalWatchTime / 3600)}h`} icon={BarChart3} isLoading={overview.isLoading} />
      </div>

      {/* Weekly Report Banner */}
      {isGrowthPlus && weeklyReport.data?.data && (
        <Card className="mb-6 border-[var(--p)]/30 bg-[var(--p)]/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekly Analytics Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{(weeklyReport.data.data as any)?.summary?.slice(0, 300)}</p>
            {(weeklyReport.data.data as any)?.highlights && (
              <div className="flex gap-4 mt-2 flex-wrap">
                {((weeklyReport.data.data as any).highlights as any[]).slice(0, 3).map((h: any, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs gap-1">
                    {h.metric}: {h.value} ({h.change > 0 ? "+" : ""}{h.change}%)
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview"><BarChart3 className="mr-1.5 h-3.5 w-3.5" />Overview</TabsTrigger>
          <TabsTrigger value="courses"><BookOpen className="mr-1.5 h-3.5 w-3.5" />Courses</TabsTrigger>
          <TabsTrigger value="challenges"><Zap className="mr-1.5 h-3.5 w-3.5" />Challenges</TabsTrigger>
          <TabsTrigger value="sessions"><Calendar className="mr-1.5 h-3.5 w-3.5" />Sessions</TabsTrigger>
          <TabsTrigger value="events"><Calendar className="mr-1.5 h-3.5 w-3.5" />Events</TabsTrigger>
          <TabsTrigger value="products"><ShoppingBag className="mr-1.5 h-3.5 w-3.5" />Products</TabsTrigger>
          <TabsTrigger value="posts"><FileText className="mr-1.5 h-3.5 w-3.5" />Posts</TabsTrigger>
          <TabsTrigger value="audience"><Monitor className="mr-1.5 h-3.5 w-3.5" />Audience</TabsTrigger>
          <TabsTrigger value="revenue"><DollarSign className="mr-1.5 h-3.5 w-3.5" />Revenue</TabsTrigger>
          <TabsTrigger value="geography"><Globe className="mr-1.5 h-3.5 w-3.5" />Geography</TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ──────────────────────────── */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Trend</CardTitle>
              <CardDescription>Views and completions over time</CardDescription>
            </CardHeader>
            <CardContent>
              <DailyTrendChart data={dailyTrend} isLoading={overview.isLoading} />
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Devices</CardTitle></CardHeader>
              <CardContent>
                <DeviceDonut data={devices.data?.data ?? devices.data} isLoading={devices.isLoading} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Top Referrers</CardTitle></CardHeader>
              <CardContent>
                <ReferrersBar data={referrers.data?.data ?? referrers.data} isLoading={referrers.isLoading} />
              </CardContent>
            </Card>
          </div>

          {/* Retention (Growth+) */}
          <AnalyticsPlanGate requiredPlan="growth" currentPlan={planTier}>
            <RetentionCohortGrid cohorts={retention.data?.data?.cohorts ?? []} />
          </AnalyticsPlanGate>
        </TabsContent>

        {/* ─── Courses Tab ───────────────────────────── */}
        <TabsContent value="courses" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Courses Performance</CardTitle></CardHeader>
            <CardContent>
              <ContentTable
                items={(courses.data as any)?.data?.items ?? (courses.data as any)?.data ?? []}
                isLoading={courses.isLoading}
                contentType="courses"
                basePath={basePath}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Challenges Tab ────────────────────────── */}
        <TabsContent value="challenges" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Challenges Performance</CardTitle></CardHeader>
            <CardContent>
              <ContentTable
                items={challenges.data?.data?.items ?? challenges.data?.data ?? []}
                isLoading={challenges.isLoading}
                contentType="challenges"
                basePath={basePath}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Sessions Tab ──────────────────────────── */}
        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Sessions Performance</CardTitle></CardHeader>
            <CardContent>
              <ContentTable
                items={sessions.data?.data?.items ?? sessions.data?.data ?? []}
                isLoading={sessions.isLoading}
                contentType="sessions"
                basePath={basePath}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Events Tab ────────────────────────────── */}
        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Events Performance</CardTitle></CardHeader>
            <CardContent>
              <ContentTable
                items={events.data?.data?.items ?? events.data?.data ?? []}
                isLoading={events.isLoading}
                contentType="events"
                basePath={basePath}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Products Tab ──────────────────────────── */}
        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Products Performance</CardTitle></CardHeader>
            <CardContent>
              <ContentTable
                items={products.data?.data?.items ?? products.data?.data ?? []}
                isLoading={products.isLoading}
                contentType="products"
                basePath={basePath}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Posts Tab ─────────────────────────────── */}
        <TabsContent value="posts" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Posts Performance</CardTitle></CardHeader>
            <CardContent>
              <ContentTable
                items={posts.data?.data?.items ?? posts.data?.data ?? []}
                isLoading={posts.isLoading}
                contentType="posts"
                basePath={basePath}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Audience Tab ──────────────────────────── */}
        <TabsContent value="audience" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Audience Devices</CardTitle></CardHeader>
              <CardContent>
                <DeviceDonut data={devices.data?.data ?? devices.data} isLoading={devices.isLoading} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Traffic Sources</CardTitle></CardHeader>
              <CardContent>
                <ReferrersBar data={referrers.data?.data ?? referrers.data} isLoading={referrers.isLoading} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Revenue Tab (Growth+) ─────────────────── */}
        <TabsContent value="revenue" className="space-y-6">
          <AnalyticsPlanGate requiredPlan="growth" currentPlan={planTier}>
            {revenue.data?.data && (
              <RevenueByContentChart
                items={revenue.data.data.byContent ?? []}
                totalRevenue={revenue.data.data.totalRevenue ?? 0}
                currency={revenue.data.data.currency ?? "TND"}
              />
            )}
            {revenue.isLoading && <Skeleton className="h-[300px] w-full" />}
            {!revenue.isLoading && !revenue.data?.data && (
              <Card>
                <CardContent className="py-12 text-center">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No revenue data for this period</p>
                </CardContent>
              </Card>
            )}
          </AnalyticsPlanGate>
        </TabsContent>

        {/* ─── Geography Tab (Growth+) ───────────────── */}
        <TabsContent value="geography" className="space-y-6">
          <AnalyticsPlanGate requiredPlan="growth" currentPlan={planTier}>
            <GeographyTable rows={(geography.data?.data as any)?.data ?? []} />
          </AnalyticsPlanGate>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
