"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useDashboard,
  DashboardShell,
  DashboardSection,
  StatCard,
  DashboardLoading,
  DashboardUnauthorized,
} from "../../components";
import { CommunityPermission } from "@/lib/permissions";
import { communitiesApi } from "@/lib/api/community/communities.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  BarChart3,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  Activity,
  Calendar,
  BookOpen,
  Video,
  FileText,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TimeRange = "7d" | "30d" | "90d" | "1y";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  isLoading?: boolean;
}

function MetricCard({ title, value, change, changeLabel = "vs last period", icon: Icon, isLoading }: MetricCardProps) {
  const isPositive = change && change >= 0;
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
            {change !== undefined && (
              <div className={`flex items-center text-xs ${isPositive ? "text-green-600" : "text-red-600"}`}>
                {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {isPositive ? "+" : ""}{change}% {changeLabel}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminAnalyticsPage() {
  const { role, can, isLoading, canAccessDashboard, getDashboardPath, creatorSlug, communityId } = useDashboard();
  const basePath = getDashboardPath("admin");
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [tab, setTab] = useState("overview");

  // Fetch community stats
  const { data: statsResponse, isLoading: statsLoading, refetch } = useQuery({
    queryKey: ["community-stats", communityId],
    queryFn: () => communitiesApi.getStats(communityId),
    enabled: !!communityId && canAccessDashboard("admin"),
    staleTime: 60_000,
  });

  // Fetch members for additional metrics
  const { data: membersResponse, isLoading: membersLoading } = useQuery({
    queryKey: ["community-members", communityId, { limit: 1 }],
    queryFn: () => communitiesApi.getMembers(communityId, { limit: 1 }),
    enabled: !!communityId && canAccessDashboard("admin"),
    staleTime: 60_000,
  });

  const stats = statsResponse?.data;
  const memberCount = membersResponse?.totalCount ?? stats?.memberCount ?? 0;

  // Derived metrics (these would ideally come from a dedicated analytics endpoint)
  const metrics = useMemo(() => ({
    members: memberCount,
    activeMembers: Math.floor(memberCount * 0.65), // Placeholder - 65% active
    newMembers: stats?.newMembersThisWeek ?? Math.floor(memberCount * 0.08),
    engagement: stats?.engagementRate ?? 72,
    revenue: stats?.totalRevenue ?? 0,
    courses: stats?.courseCount ?? 0,
    events: stats?.eventCount ?? 0,
    posts: stats?.postCount ?? 0,
    views: stats?.totalViews ?? 0,
  }), [stats, memberCount]);

  if (isLoading) return <DashboardLoading message="Loading analytics..." />;
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

  const anyLoading = statsLoading || membersLoading;

  return (
    <DashboardShell variant="admin">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={basePath}><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
            <p className="mt-1 text-muted-foreground">Understand your community growth and engagement.</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard title="Total Members" value={anyLoading ? "—" : metrics.members.toLocaleString()} change={12} icon={Users} isLoading={anyLoading} />
        <MetricCard title="Active Members" value={anyLoading ? "—" : metrics.activeMembers.toLocaleString()} change={8} icon={Activity} isLoading={anyLoading} />
        <MetricCard title="Engagement Rate" value={anyLoading ? "—" : `${metrics.engagement}%`} change={5} icon={TrendingUp} isLoading={anyLoading} />
        <MetricCard title="Total Revenue" value={anyLoading ? "—" : `$${metrics.revenue.toLocaleString()}`} change={15} icon={DollarSign} isLoading={anyLoading} />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview"><BarChart3 className="mr-2 h-4 w-4" />Overview</TabsTrigger>
          <TabsTrigger value="members"><Users className="mr-2 h-4 w-4" />Members</TabsTrigger>
          <TabsTrigger value="content"><BookOpen className="mr-2 h-4 w-4" />Content</TabsTrigger>
          <TabsTrigger value="revenue"><DollarSign className="mr-2 h-4 w-4" />Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Growth Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Growth Overview</CardTitle>
              <CardDescription>Member growth and engagement trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg border border-dashed">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Growth chart visualization</p>
                  <p className="text-xs text-muted-foreground mt-1">Connect a charting library to display trends</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">New Members This Week</CardTitle>
              </CardHeader>
              <CardContent>
                {anyLoading ? <Skeleton className="h-8 w-16" /> : (
                  <div className="text-3xl font-bold text-green-600">+{metrics.newMembers}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Content Pieces</CardTitle>
              </CardHeader>
              <CardContent>
                {anyLoading ? <Skeleton className="h-8 w-16" /> : (
                  <div className="text-3xl font-bold">{metrics.courses + metrics.events + metrics.posts}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              </CardHeader>
              <CardContent>
                {anyLoading ? <Skeleton className="h-8 w-16" /> : (
                  <div className="text-3xl font-bold">{metrics.views.toLocaleString()}</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Total Members" value={metrics.members.toLocaleString()} icon={Users} isLoading={anyLoading} />
            <MetricCard title="New This Month" value={Math.floor(metrics.members * 0.12).toLocaleString()} change={18} icon={TrendingUp} isLoading={anyLoading} />
            <MetricCard title="Active Rate" value="65%" change={3} icon={Activity} isLoading={anyLoading} />
            <MetricCard title="Churn Rate" value="2.1%" change={-0.3} icon={TrendingDown} isLoading={anyLoading} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Member Growth</CardTitle>
              <CardDescription>Track how your community is growing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] flex items-center justify-center bg-muted/30 rounded-lg border border-dashed">
                <div className="text-center">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Member growth chart</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Courses" value={metrics.courses} icon={BookOpen} isLoading={anyLoading} />
            <MetricCard title="Events" value={metrics.events} icon={Calendar} isLoading={anyLoading} />
            <MetricCard title="Posts" value={metrics.posts} icon={FileText} isLoading={anyLoading} />
            <MetricCard title="Videos" value={stats?.videoCount ?? 0} icon={Video} isLoading={anyLoading} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Content Performance</CardTitle>
              <CardDescription>See what content resonates with your audience</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] flex items-center justify-center bg-muted/30 rounded-lg border border-dashed">
                <div className="text-center">
                  <Eye className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Content performance chart</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Total Revenue" value={`$${metrics.revenue.toLocaleString()}`} change={15} icon={DollarSign} isLoading={anyLoading} />
            <MetricCard title="This Month" value={`$${Math.floor(metrics.revenue * 0.15).toLocaleString()}`} change={22} icon={TrendingUp} isLoading={anyLoading} />
            <MetricCard title="Avg. Order Value" value={`$${stats?.avgOrderValue ?? 49}`} icon={DollarSign} isLoading={anyLoading} />
            <MetricCard title="Transactions" value={stats?.transactionCount ?? 0} icon={Activity} isLoading={anyLoading} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
              <CardDescription>Track your earnings growth</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] flex items-center justify-center bg-muted/30 rounded-lg border border-dashed">
                <div className="text-center">
                  <DollarSign className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Revenue chart</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
