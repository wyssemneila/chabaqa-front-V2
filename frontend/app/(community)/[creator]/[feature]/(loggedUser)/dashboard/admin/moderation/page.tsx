"use client";

import { useState } from "react";
import {
  useDashboard,
  DashboardShell,
  DashboardSection,
  DashboardLoading,
  DashboardUnauthorized,
  BackendRequiredPlaceholder,
} from "../../components";
import { ModerationQueue } from "../../moderator/components";
import { CommunityPermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MessageSquare, Shield, Users, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function AdminModerationPage() {
  const { role, can, isLoading, canAccessDashboard, getDashboardPath, creatorSlug, communityId } = useDashboard();
  const basePath = getDashboardPath("admin");
  const [tab, setTab] = useState("queue");

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
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <DashboardSection title="Moderation Overview" description="Live queue data is available below; aggregate moderation metrics require dedicated endpoints." className="mb-8">
        <BackendRequiredPlaceholder
          feature="Moderation Aggregates"
          description="Pending review counts, flagged-user rollups, community health score, and auto-mod rule metrics need community-scoped moderation aggregate endpoints before they can be displayed here."
        />
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
          <BackendRequiredPlaceholder
            feature="Flagged Users"
            description="The content queue is live, but user-level flag aggregation is not exposed as a community-role endpoint yet."
          />
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
