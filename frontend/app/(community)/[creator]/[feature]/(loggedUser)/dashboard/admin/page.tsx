"use client";

import { useQuery } from "@tanstack/react-query";
import {
  useDashboard,
  DashboardShell,
  DashboardSection,
  StatCard,
  ActionCard,
  DashboardUnauthorized,
  DashboardLoading,
} from "../components";
import { CommunityPermission } from "@/lib/permissions";
import { communitiesApi } from "@/lib/api/communities.api";
import {
  Users,
  Shield,
  FileText,
  Megaphone,
  BarChart3,
  DollarSign,
  Settings,
  UserPlus,
  MessageSquare,
  HeadphonesIcon,
  TrendingUp,
  Activity,
  AlertCircle,
} from "lucide-react";

export default function AdminDashboardPage() {
  const {
    role,
    can,
    isLoading,
    canAccessDashboard,
    getDashboardPath,
    creatorSlug,
    communityId,
  } = useDashboard();

  // Fetch real community stats
  const { data: statsResponse, isLoading: statsLoading } = useQuery({
    queryKey: ["community-stats", communityId],
    queryFn: () => communitiesApi.getStats(communityId),
    enabled: !!communityId && canAccessDashboard("admin"),
    staleTime: 60_000, // 1 minute
  });

  // Fetch member count
  const { data: membersResponse, isLoading: membersLoading } = useQuery({
    queryKey: ["community-members-count", communityId],
    queryFn: () => communitiesApi.getMembers(communityId, { page: 1, limit: 1 }),
    enabled: !!communityId && canAccessDashboard("admin"),
    staleTime: 60_000,
  });

  if (isLoading) {
    return <DashboardLoading message="Loading admin dashboard..." />;
  }

  if (!canAccessDashboard("admin")) {
    return (
      <DashboardUnauthorized
        role={role}
        requiredRole="admin"
        backAction={{ label: "Back to Community", href: `/${creatorSlug}` }}
      />
    );
  }

  const basePath = getDashboardPath("admin");
  const stats = statsResponse?.data ?? {};
  const totalMembers = membersResponse?.pagination?.total ?? stats.totalMembers ?? 0;
  const activeMembers = stats.activeMembers ?? stats.activeToday ?? 0;
  const totalPosts = stats.totalPosts ?? stats.postsThisWeek ?? 0;
  const growthRate = stats.growthRate ?? stats.memberGrowth ?? 0;

  const isStatsLoading = statsLoading || membersLoading;

  return (
    <DashboardShell variant="admin">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Manage your community, track growth, and empower your team.</p>
      </div>

      {/* Stats Overview */}
      <DashboardSection title="Overview" description="Key metrics at a glance" className="mb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Members"
            value={isStatsLoading ? "—" : totalMembers.toLocaleString()}
            description="All time"
            icon={Users}
            isLoading={isStatsLoading}
          />
          <StatCard
            title="Active Today"
            value={isStatsLoading ? "—" : activeMembers.toLocaleString()}
            description="Last 24 hours"
            icon={Activity}
            isLoading={isStatsLoading}
          />
          <StatCard
            title="Posts This Week"
            value={isStatsLoading ? "—" : totalPosts.toLocaleString()}
            description="Community activity"
            icon={MessageSquare}
            isLoading={isStatsLoading}
          />
          <StatCard
            title="Growth Rate"
            value={isStatsLoading ? "—" : `${growthRate > 0 ? "+" : ""}${growthRate}%`}
            description="vs last month"
            icon={TrendingUp}
            isLoading={isStatsLoading}
            trend={growthRate !== 0 ? { value: Math.abs(growthRate) } : undefined}
          />
        </div>
      </DashboardSection>

      {/* Team Management */}
      {(can(CommunityPermission.ROLES_MANAGE) || can(CommunityPermission.MEMBERS_VIEW)) && (
        <DashboardSection title="Team Management" description="Manage staff roles and community members" className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {can(CommunityPermission.ROLES_MANAGE) && (
              <ActionCard title="Staff & Roles" description="Manage admin, moderator, and support staff" icon={Shield} href={`${basePath}/staff`} />
            )}
            {can(CommunityPermission.MEMBERS_VIEW) && (
              <ActionCard title="Members" description="View and search all community members" icon={Users} href={`${basePath}/members`} />
            )}
            {can(CommunityPermission.MEMBERS_MANAGE) && (
              <ActionCard title="Invitations" description="Send invites and manage pending invitations" icon={UserPlus} href={`${basePath}/invitations`} />
            )}
          </div>
        </DashboardSection>
      )}

      {/* Content & Moderation */}
      {(can(CommunityPermission.CONTENT_MANAGE) || can(CommunityPermission.POSTS_MODERATE)) && (
        <DashboardSection title="Content" description="Manage courses, events, products, and moderate posts" className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {can(CommunityPermission.CONTENT_MANAGE) && (
              <ActionCard title="Content Management" description="Create and manage courses, events, challenges" icon={FileText} href={`${basePath}/content`} />
            )}
            {can(CommunityPermission.POSTS_MODERATE) && (
              <ActionCard title="Post Moderation" description="Review flagged posts and manage discussions" icon={MessageSquare} href={`${basePath}/moderation`} />
            )}
          </div>
        </DashboardSection>
      )}

      {/* Growth & Marketing */}
      {(can(CommunityPermission.MARKETING_MANAGE) || can(CommunityPermission.AFFILIATES_MANAGE)) && (
        <DashboardSection title="Growth" description="Marketing campaigns and affiliate programs" className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {can(CommunityPermission.MARKETING_MANAGE) && (
              <ActionCard title="Marketing" description="Create email campaigns and automation" icon={Megaphone} href={`${basePath}/marketing`} />
            )}
            {can(CommunityPermission.AFFILIATES_MANAGE) && (
              <ActionCard title="Affiliates" description="Manage affiliate partners and referrals" icon={Users} href={`${basePath}/affiliates`} />
            )}
          </div>
        </DashboardSection>
      )}

      {/* Insights */}
      {(can(CommunityPermission.ANALYTICS_VIEW) || can(CommunityPermission.FINANCE_VIEW)) && (
        <DashboardSection title="Insights" description="Analytics, reports, and financial overview" className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {can(CommunityPermission.ANALYTICS_VIEW) && (
              <ActionCard title="Analytics" description="View engagement metrics and growth trends" icon={BarChart3} href={`${basePath}/analytics`} />
            )}
            {can(CommunityPermission.FINANCE_VIEW) && (
              <ActionCard title="Finance" description="Revenue overview and payouts" icon={DollarSign} href={`${basePath}/finance`} />
            )}
          </div>
        </DashboardSection>
      )}

      {/* Settings */}
      {(can(CommunityPermission.COMMUNITY_MANAGE_SETTINGS) || can(CommunityPermission.SUPPORT_MANAGE)) && (
        <DashboardSection title="Settings" description="Community configuration and support tools" className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {can(CommunityPermission.COMMUNITY_MANAGE_SETTINGS) && (
              <ActionCard title="Community Settings" description="Configure appearance, privacy, and integrations" icon={Settings} href={`${basePath}/settings`} />
            )}
            {can(CommunityPermission.SUPPORT_MANAGE) && (
              <ActionCard title="Support Center" description="Manage support tickets and resources" icon={HeadphonesIcon} href={`${basePath}/support`} badge="Limited" />
            )}
          </div>
        </DashboardSection>
      )}
    </DashboardShell>
  );
}
