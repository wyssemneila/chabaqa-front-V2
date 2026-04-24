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
  useAnalyticsFunnel,
  useAnalyticsChallengeStreaks,
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
  Zap,
  Users,
  Target,
  Flame,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type TimeRange = "7d" | "30d" | "90d" | "1y";

export default function ChallengeAnalyticsPage() {
  const params = useParams();
  const challengeId = params.challengeId as string;
  const { role, can, isLoading: dashLoading, canAccessDashboard, getDashboardPath, creatorSlug, communityId } = useDashboard();
  const basePath = getDashboardPath("admin");
  const { tier: planTier } = usePlan();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const isGrowthPlus = planTier === "growth" || planTier === "pro";

  const funnel = useAnalyticsFunnel("challenge", challengeId, timeRange, communityId, !!challengeId);
  const streaks = useAnalyticsChallengeStreaks(challengeId, timeRange, !!challengeId && isGrowthPlus);
  const insightsMutation = useAnalyticsInsights();

  const funnelData = funnel.data?.data;
  const streakData = streaks.data?.data;

  if (dashLoading) return <DashboardLoading message="Loading challenge analytics..." />;
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
              <Zap className="h-5 w-5 text-[#ff9b28]" />
              {funnelData?.contentMeta?.title ?? "Challenge Analytics"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Deep-dive into challenge engagement</p>
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

      {/* Streak KPIs (Growth+) */}
      <AnalyticsPlanGate requiredPlan="growth" currentPlan={planTier}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          {streaks.isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Participants</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{(streakData?.activeChallengers ?? 0).toLocaleString()}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{streakData?.completionRate ?? 0}%</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Daily Active Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{streakData?.dailyActiveRate ?? 0}%</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg Streak</CardTitle>
                  <Flame className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{streakData?.avgStreakDays ?? 0} days</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Max Streak</CardTitle>
                  <Flame className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{streakData?.maxStreakDays ?? 0} days</div></CardContent>
              </Card>
            </>
          )}
        </div>
      </AnalyticsPlanGate>

      {/* Conversion Funnel */}
      <div className="mb-6">
        <FunnelChart steps={(funnelData?.funnel ?? []).map((s: any) => ({ label: s.stepLabel, value: s.uniqueUsers ?? s.events ?? 0 }))} />
      </div>

      {/* Drop-off Info */}
      {funnelData?.dropOff?.worstStep && (
        <Card className="mb-6 border-orange-200 bg-orange-50/50">
          <CardContent className="py-4">
            <p className="text-sm">
              <span className="font-medium text-orange-700">Biggest drop-off: </span>
              {funnelData.dropOff.worstStep.stepLabel} — {funnelData.dropOff.worstStep.dropOffRate != null
                ? `${Math.round(funnelData.dropOff.worstStep.dropOffRate)}% drop`
                : "significant drop detected"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* AI Insights (Growth+) */}
      <AnalyticsPlanGate requiredPlan="growth" currentPlan={planTier}>
        <AIInsightsPanel
          contentType="challenge"
          contentId={challengeId}
          communityId={communityId}
          plan={planTier}
        />
      </AnalyticsPlanGate>
    </DashboardShell>
  );
}
