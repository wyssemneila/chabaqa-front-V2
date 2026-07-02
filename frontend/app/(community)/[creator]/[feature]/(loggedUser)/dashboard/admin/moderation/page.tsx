"use client";

import { useEffect, useState } from "react";
import {
  useDashboard,
  DashboardShell,
  DashboardSection,
  DashboardLoading,
  DashboardUnauthorized,
  BackendRequiredPlaceholder,
  StatCard,
  DashboardEmpty,
} from "../../components";
import { ModerationQueue } from "../../moderator/components";
import { CommunityPermission } from "@/lib/permissions";
import { moderationApi } from "@/lib/api/moderation.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MessageSquare, Shield, Users, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function AdminModerationPage() {
  const { role, can, isLoading, canAccessDashboard, getDashboardPath, creatorSlug, communityId } = useDashboard();
  const basePath = getDashboardPath("admin");
  const [tab, setTab] = useState("queue");
  const [stats, setStats] = useState<any>(null);
  const [flaggedUsers, setFlaggedUsers] = useState<any[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const loadMeta = async () => {
    if (!communityId) return;
    setLoadingMeta(true);
    try {
      const [statsResult, usersResult] = await Promise.all([
        moderationApi.getStats(communityId),
        moderationApi.getFlaggedUsers(communityId),
      ]);
      setStats(statsResult);
      setFlaggedUsers(usersResult);
    } finally {
      setLoadingMeta(false);
    }
  };

  useEffect(() => {
    if (!isLoading && communityId) void loadMeta();
  }, [communityId, isLoading]);

  if (isLoading) return <DashboardLoading message="Loading moderation..." />;
  if (!canAccessDashboard("admin")) {
    return <DashboardUnauthorized role={role} requiredRole="admin" backAction={{ label: "Back", href: `/${creatorSlug}` }} />;
  }

  if (!can(CommunityPermission.POSTS_MODERATE)) {
    return (
      <DashboardShell variant="admin">
        <DashboardUnauthorized role={role} requiredRole="admin with posts.moderate" backAction={{ label: "Back", href: basePath }} />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell variant="admin">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={basePath}><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Post Moderation</h1>
            <p className="mt-1 text-muted-foreground">Review flagged content and manage community moderation workflows.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { void loadMeta(); window.location.reload(); }}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <DashboardSection title="Moderation Overview" description="Live aggregates from community moderation endpoints." className="mb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Pending review" value={stats?.totalPending ?? 0} icon={MessageSquare} isLoading={loadingMeta} />
          <StatCard title="Reviewed" value={stats?.totalReviewed ?? 0} icon={Shield} isLoading={loadingMeta} />
          <StatCard title="Escalations" value={stats?.escalations ?? 0} icon={Users} isLoading={loadingMeta} />
          <StatCard title="Pinned posts" value={stats?.pinnedPosts ?? 0} icon={MessageSquare} isLoading={loadingMeta} />
        </div>
      </DashboardSection>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="queue"><MessageSquare className="mr-2 h-4 w-4" />Content Queue</TabsTrigger>
          <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" />Flagged Users</TabsTrigger>
          <TabsTrigger value="automod"><Shield className="mr-2 h-4 w-4" />Auto-Mod</TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          <ModerationQueue communityId={communityId} />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {loadingMeta ? (
            <DashboardLoading message="Loading flagged users..." />
          ) : flaggedUsers.length === 0 ? (
            <DashboardEmpty title="No flagged users" description="No users with flagged posts in the moderation queue." />
          ) : (
            <div className="grid gap-3">
              {flaggedUsers.map((user) => (
                <Card key={user.userId}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <p className="text-sm font-medium">{user.flaggedPosts} flagged posts</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="automod" className="space-y-4">
          <BackendRequiredPlaceholder
            feature="Auto-Moderation Rules"
            description="Auto-mod rule configuration and trigger metrics need backend endpoints before this dashboard can manage them."
          />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
