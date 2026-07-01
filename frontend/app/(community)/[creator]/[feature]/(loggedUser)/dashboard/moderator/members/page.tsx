"use client";

import {
  useDashboard,
  DashboardShell,
  DashboardLoading,
  DashboardUnauthorized,
} from "../../components";
import { MemberDirectory } from "../components";
import { CommunityPermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";

export default function ModeratorMembersPage() {
  const { role, can, isLoading, canAccessDashboard, getDashboardPath, creatorSlug, communityId } = useDashboard();
  const basePath = getDashboardPath("moderator");

  if (isLoading) return <DashboardLoading message="Loading members..." />;
  if (!canAccessDashboard("moderator")) {
    return <DashboardUnauthorized role={role} requiredRole="moderator" backAction={{ label: "Back", href: `/${creatorSlug}` }} />;
  }

  if (!can(CommunityPermission.MEMBERS_VIEW)) {
    return (
      <DashboardShell variant="moderator">
        <DashboardUnauthorized role={role} requiredRole="moderator with members.view" backAction={{ label: "Back", href: basePath }} />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell variant="moderator">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={basePath}><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Member Directory</h1>
            <p className="mt-1 text-muted-foreground">View community members and their activity from the live member directory.</p>
          </div>
          <Badge variant="outline" className="w-fit">
            <Eye className="mr-1 h-3 w-3" />
            Read-only Access
          </Badge>
        </div>
      </div>

      <MemberDirectory communityId={communityId} />
    </DashboardShell>
  );
}
