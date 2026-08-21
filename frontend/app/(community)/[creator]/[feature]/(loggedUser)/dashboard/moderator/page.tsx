"use client";

import { useQuery } from "@tanstack/react-query";
import {
  useDashboard,
  DashboardShell,
  DashboardSection,
  StatCard,
  ActionCard,
  DashboardLoading,
  DashboardUnauthorized,
} from "../components";
import { CommunityPermission } from "@/lib/permissions";
import { moderationApi } from "@/lib/api/moderation.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Pin,
  FileText,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ModeratorDashboardPage() {
  const { role, can, isLoading, canAccessDashboard, getDashboardPath, creatorSlug, communityId } = useDashboard();
  const basePath = getDashboardPath("moderator");

  // Fetch moderation queue
  const { data: queueData, isLoading: queueLoading, refetch } = useQuery({
    queryKey: ["moderation-queue", communityId],
    queryFn: () => moderationApi.getQueue(communityId, { limit: 100 }),
    enabled: !!communityId && canAccessDashboard("moderator"),
    staleTime: 30_000,
  });

  // Fetch pinned posts
  const { data: pinnedData, isLoading: pinnedLoading } = useQuery({
    queryKey: ["pinned-posts", communityId],
    queryFn: () => moderationApi.getPinnedPosts(communityId),
    enabled: !!communityId && canAccessDashboard("moderator"),
    staleTime: 60_000,
  });

  if (isLoading) return <DashboardLoading message="Loading moderator dashboard..." />;
  if (!canAccessDashboard("moderator")) {
    return <DashboardUnauthorized role={role} requiredRole="moderator" backAction={{ label: "Back to Community", href: `/${creatorSlug}` }} />;
  }

  // Calculate stats from queue
  const queue = queueData?.items ?? [];
  const pendingCount = queue.filter((item: any) => item.status === "pending").length;
  const reviewedToday = queue.filter((item: any) => {
    if (item.reviewedAt) {
      const reviewDate = new Date(item.reviewedAt);
      const today = new Date();
      return reviewDate.toDateString() === today.toDateString();
    }
    return false;
  }).length;
  const pinnedCount = (pinnedData as any)?.length ?? 0;
  const flaggedCount = queue.filter((item: any) => item.type === "flagged").length;

  const anyLoading = queueLoading || pinnedLoading;

  const actionCards = [
    {
      title: "Review Queue",
      description: "Review reported content and flagged posts",
      href: `${basePath}/queue`,
      icon: AlertTriangle,
      badge: pendingCount > 0 ? `${pendingCount} pending` : undefined,
      badgeVariant: "destructive" as const,
    },
    {
      title: "Pinned Content",
      description: "Manage pinned posts and announcements",
      href: `${basePath}/pinned`,
      icon: Pin,
      badge: `${pinnedCount} pinned`,
    },
    {
      title: "Member List",
      description: "View and manage community members",
      href: `${basePath}/members`,
      icon: Users,
    },
  ];

  const recentQueue = queue.slice(0, 5);

  return (
    <DashboardShell variant="moderator">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Moderator Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Monitor and moderate community activity.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />Refresh
        </Button>
      </div>

      {/* Stats */}
      <DashboardSection title="Today's Overview" description="Moderation activity at a glance" className="mb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pending Review"
            value={anyLoading ? "—" : pendingCount.toString()}
            description="Items awaiting review"
            icon={Clock}
            isLoading={anyLoading}
          />
          <StatCard
            title="Reviewed Today"
            value={anyLoading ? "—" : reviewedToday.toString()}
            description="Actions taken today"
            icon={CheckCircle}
            isLoading={anyLoading}
          />
          <StatCard
            title="Flagged Users"
            value={anyLoading ? "—" : flaggedCount.toString()}
            description="Users with flags"
            icon={AlertTriangle}
            isLoading={anyLoading}
          />
          <StatCard
            title="Pinned Posts"
            value={anyLoading ? "—" : pinnedCount.toString()}
            description="Active pinned content"
            icon={Pin}
            isLoading={anyLoading}
          />
        </div>
      </DashboardSection>

      {/* Quick Actions */}
      <DashboardSection title="Quick Actions" description="Common moderation tasks" className="mb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {actionCards.map((card) => (
            <ActionCard
              key={card.title}
              title={card.title}
              description={card.description}
              href={card.href}
              icon={card.icon}
              badge={card.badge}
              badgeVariant={card.badgeVariant}
            />
          ))}
        </div>
      </DashboardSection>

      {/* Recent Queue Items */}
      <DashboardSection title="Recent Queue Items" description="Latest items requiring attention">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Review Queue</CardTitle>
              <CardDescription>Most recent flagged content</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`${basePath}/queue`}>View All<ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {anyLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[100px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentQueue.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
                <p className="font-medium">All clear!</p>
                <p className="text-sm text-muted-foreground">No items in the review queue</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentQueue.map((item: any) => (
                  <div key={item._id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.title || item.content?.slice(0, 50) || "Reported content"}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.reportReason || item.type || "Flagged"} • {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={item.status === "pending" ? "destructive" : "secondary"}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </DashboardSection>
    </DashboardShell>
  );
}
