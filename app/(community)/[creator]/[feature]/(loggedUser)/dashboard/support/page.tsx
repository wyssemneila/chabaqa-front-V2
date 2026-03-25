"use client";

import {
  useDashboard,
  DashboardShell,
  DashboardSection,
  StatCard,
  ActionCard,
  DashboardUnauthorized,
  DashboardLoading,
  BackendRequiredPlaceholder,
} from "../components";
import { CommunityPermission } from "@/lib/permissions";
import { Users, HeadphonesIcon, Search, MessageCircle, Clock, CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SupportDashboardPage() {
  const { role, can, isLoading, canAccessDashboard, getDashboardPath, creatorSlug } = useDashboard();

  if (isLoading) {
    return <DashboardLoading message="Loading support dashboard..." />;
  }

  if (!canAccessDashboard("support")) {
    return (
      <DashboardUnauthorized
        role={role}
        requiredRole="support"
        backAction={{ label: "Back to Community", href: `/${creatorSlug}` }}
      />
    );
  }

  const basePath = getDashboardPath("support");

  return (
    <DashboardShell variant="support">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Support Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Help community members and resolve their issues efficiently.</p>
      </div>

      <Alert className="mb-8 border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-amber-800 dark:text-amber-200">Limited Functionality</AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-300">
          Some support features are pending backend implementation. Available tools are marked accordingly below.
        </AlertDescription>
      </Alert>

      <DashboardSection title="Support Overview" description="Current support metrics" className="mb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Open Tickets" value="—" description="Pending" icon={HelpCircle} />
          <StatCard title="Resolved Today" value="—" description="Your activity" icon={CheckCircle} />
          <StatCard title="Avg Response" value="—" description="Time" icon={Clock} />
          <StatCard title="Satisfaction" value="—" description="Rating" icon={MessageCircle} />
        </div>
      </DashboardSection>

      {can(CommunityPermission.MEMBERS_VIEW) && (
        <DashboardSection title="Available Tools" description="Tools you can use right now" className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ActionCard
              title="Member Lookup"
              description="Search and view member profiles to assist with inquiries"
              icon={Search}
              href={`${basePath}/members`}
              badge="Available"
              badgeVariant="default"
            />
          </div>
        </DashboardSection>
      )}

      {can(CommunityPermission.SUPPORT_MANAGE) && (
        <DashboardSection title="Pending Features" description="Features awaiting backend implementation" className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ActionCard
              title="Support Queue"
              description="View and manage incoming support tickets"
              icon={HeadphonesIcon}
              backendRequired
              badge="Backend Required"
              badgeVariant="destructive"
            />
            <ActionCard
              title="Live Chat"
              description="Real-time chat support with community members"
              icon={MessageCircle}
              backendRequired
              badge="Backend Required"
              badgeVariant="destructive"
            />
          </div>
        </DashboardSection>
      )}

      <BackendRequiredPlaceholder
        feature="Community Support Queue"
        description="The community-scoped support queue requires backend endpoint alignment. Currently, live support endpoints are platform-admin scoped (AdminAuthGuard) and not accessible via community role permissions."
      />
    </DashboardShell>
  );
}
