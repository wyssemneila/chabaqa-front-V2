"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  useDashboard,
  DashboardShell,
  DashboardLoading,
  DashboardUnauthorized,
} from "../../../../components";
import { CommunityPermission } from "@/lib/permissions";
import { usePlan } from "@/hooks/use-plan";
import {
  useAnalyticsCourseDetail,
  useAnalyticsCourseChaptersFunnel,
  useAnalyticsInsights,
} from "@/hooks/use-creator-analytics";
import { AnalyticsPlanGate, AIInsightsPanel } from "@/components/analytics";
import dynamic from "next/dynamic";

const FunnelChart = dynamic(
  () => import("@/components/analytics/FunnelChart").then(mod => ({ default: mod.FunnelChart })),
  { loading: () => <div className="h-64 w-full animate-pulse rounded-lg bg-muted" />, ssr: false }
);
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  BookOpen,
  Eye,
  Users,
  Target,
  Clock,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

type TimeRange = "7d" | "30d" | "90d" | "1y";

export default function CourseAnalyticsPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { role, can, isLoading: dashLoading, canAccessDashboard, getDashboardPath, creatorSlug, communityId } = useDashboard();
  const basePath = getDashboardPath("admin");
  const { tier: planTier } = usePlan();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const isGrowthPlus = planTier === "growth" || planTier === "pro";

  const courseDetail = useAnalyticsCourseDetail(courseId, timeRange, !!courseId);
  const chapterFunnel = useAnalyticsCourseChaptersFunnel(courseId, timeRange, communityId, !!courseId);
  const insightsMutation = useAnalyticsInsights();

  const data = courseDetail.data?.data;
  const kpis = data?.kpis;
  const trend = data?.dailyTrend ?? [];
  const chapters = chapterFunnel.data?.data?.items ?? [];

  if (dashLoading) return <DashboardLoading message="Loading course analytics..." />;
  if (!canAccessDashboard("admin")) {
    return <DashboardUnauthorized role={role} requiredRole="admin" backAction={{ label: "Back", href: `/${creatorSlug}` }} />;
  }
  if (!can(CommunityPermission.ANALYTICS_VIEW)) {
    return (
      <DashboardShell variant="admin">
        <DashboardUnauthorized role={role} requiredRole="admin" backAction={{ label: "Back", href: basePath }} />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell variant="admin">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`${basePath}/analytics`}><ArrowLeft className="mr-2 h-4 w-4" />Back to Analytics</Link>
        </Button>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#47c7ea]" />
              {data?.courseTitle ?? "Course Analytics"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Deep-dive into course performance</p>
          </div>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
        {courseDetail.isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Enrollments</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{(kpis?.enrollments ?? 0).toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{(kpis?.views ?? 0).toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{Math.round(kpis?.completionRate ?? 0)}%</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Watch Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{Math.round((kpis?.avgWatchTimeSeconds ?? 0) / 60)}min</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{(kpis?.revenue ?? 0).toLocaleString()} TND</div></CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Daily Trend Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Daily Trend</CardTitle>
          <CardDescription>Views, starts, and completions over time</CardDescription>
        </CardHeader>
        <CardContent>
          {courseDetail.isLoading ? <Skeleton className="h-[280px] w-full" /> : trend.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No trend data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8e78fb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8e78fb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="completesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#47c7ea" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#47c7ea" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="views" stroke="#8e78fb" fill="url(#viewsGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="starts" stroke="#ff9b28" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
                <Area type="monotone" dataKey="completes" stroke="#47c7ea" fill="url(#completesGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Chapter Funnel */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Chapter Progress Funnel</CardTitle>
          <CardDescription>How students progress through chapters</CardDescription>
        </CardHeader>
        <CardContent>
          {chapterFunnel.isLoading ? <Skeleton className="h-[300px] w-full" /> : chapters.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No chapter funnel data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, chapters.length * 40)}>
              <BarChart data={chapters.map((c: any) => ({
                name: c.stepTitle?.slice(0, 30) || `Ch ${c.order}`,
                starts: c.uniqueStarts,
                completes: c.uniqueCompletes,
                rate: `${Math.round(c.completionRate)}%`,
              }))} layout="vertical" margin={{ left: 120 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                <Tooltip />
                <Bar dataKey="starts" fill="#8e78fb" radius={[0, 4, 4, 0]} name="Starts" />
                <Bar dataKey="completes" fill="#47c7ea" radius={[0, 4, 4, 0]} name="Completes" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* AI Insights (Growth+) */}
      <AnalyticsPlanGate requiredPlan="growth" currentPlan={planTier}>
        <AIInsightsPanel
          contentType="course"
          contentId={courseId}
          communityId={communityId}
          plan={planTier}
        />
      </AnalyticsPlanGate>
    </DashboardShell>
  );
}
