"use client";

import dynamic from "next/dynamic";
import {
  useDashboard,
  DashboardShell,
  DashboardLoading,
  DashboardUnauthorized,
} from "../../components";
import { CommunityPermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const PinnedContentManager = dynamic(
  () => import("../components/pinned-content-manager").then(mod => ({ default: mod.PinnedContentManager })),
  {
    loading: () => <div className="h-64 w-full animate-pulse rounded-lg bg-muted" />,
    ssr: false,
  }
);

export default function ModeratorPinnedPage() {
  const { role, can, isLoading, canAccessDashboard, getDashboardPath, creatorSlug, communityId } = useDashboard();
  const basePath = getDashboardPath("moderator");

  if (isLoading) return <DashboardLoading message="Loading pinned content..." />;
  if (!canAccessDashboard("moderator")) {
    return <DashboardUnauthorized role={role} requiredRole="moderator" backAction={{ label: "Back", href: `/${creatorSlug}` }} />;
  }

  if (!can(CommunityPermission.POSTS_MODERATE)) {
    return (
      <DashboardShell variant="moderator">
        <DashboardUnauthorized role={role} requiredRole="moderator with posts.moderate" backAction={{ label: "Back", href: basePath }} />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell variant="moderator">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={basePath}><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pinned Content</h1>
          <p className="mt-1 text-muted-foreground">Manage posts pinned to the top of your community feed from the live moderation API.</p>
        </div>
      </div>

      <PinnedContentManager communityId={communityId} />
    </DashboardShell>
  );
}
