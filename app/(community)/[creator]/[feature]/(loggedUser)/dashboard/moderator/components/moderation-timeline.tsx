"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  Activity,
  CheckCircle,
  EyeOff,
  Trash2,
  RotateCcw,
  MessageSquare,
  RefreshCw,
  Clock,
  History,
  AlertTriangle,
  Filter,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek } from "date-fns";
import {
  moderationApi,
  type ModerationActivityLog,
  type ModerationAction,
  type ContentType,
} from "@/lib/api/admin/moderation.api";

// ── Types ──────────────────────────────────────────────────────────────────

interface ModerationTimelineProps {
  communityId: string;
  className?: string;
}

interface TimelineFilters {
  action: ModerationAction | "all";
  contentType: ContentType | "all";
  page: number;
}

// ── Config ─────────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<
  ModerationAction,
  { label: string; icon: LucideIcon; color: string; bgColor: string }
> = {
  approve: {
    label: "Approved",
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  hide: {
    label: "Hidden",
    icon: EyeOff,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  delete: {
    label: "Deleted",
    icon: Trash2,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
  restore: {
    label: "Restored",
    icon: RotateCcw,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
};

// ── Utility Functions ──────────────────────────────────────────────────────

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getDateGroup(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isThisWeek(date)) return "This Week";
  return format(date, "MMMM yyyy");
}

function groupByDate(activities: ModerationActivityLog[]): Map<string, ModerationActivityLog[]> {
  const groups = new Map<string, ModerationActivityLog[]>();

  for (const activity of activities) {
    const group = getDateGroup(new Date(activity.timestamp));
    const existing = groups.get(group) || [];
    groups.set(group, [...existing, activity]);
  }

  return groups;
}

// ── Timeline Item ──────────────────────────────────────────────────────────

interface TimelineItemProps {
  activity: ModerationActivityLog;
  isLast: boolean;
}

function TimelineItem({ activity, isLast }: TimelineItemProps) {
  const config = ACTION_CONFIG[activity.action];
  const Icon = config.icon;
  const ContentIcon = MessageSquare;

  return (
    <div className="relative flex gap-4 pb-6">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-5 top-10 h-full w-px bg-border" aria-hidden="true" />
      )}

      {/* Icon */}
      <div
        className={cn(
          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          config.bgColor,
        )}
      >
        <Icon className={cn("h-5 w-5", config.color)} aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          {activity.moderatorName && (
            <span className="font-medium text-sm">{activity.moderatorName}</span>
          )}
          <span className="text-sm text-muted-foreground">
            {config.label.toLowerCase()} a
          </span>
          <Badge variant="outline" className="gap-1 text-xs">
            <ContentIcon className="h-3 w-3" aria-hidden="true" />
            {activity.contentType}
          </Badge>
        </div>

        {activity.reason && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            Reason: {activity.reason}
          </p>
        )}

        <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

// ── Date Group Header ──────────────────────────────────────────────────────

function DateGroupHeader({ label }: { label: string }) {
  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur py-2 mb-2">
      <h4 className="text-sm font-medium text-muted-foreground">{label}</h4>
    </div>
  );
}

// ── Loading Skeleton ───────────────────────────────────────────────────────

function TimelineSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading activity timeline">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Backend Pending Placeholder ────────────────────────────────────────────

function BackendPendingState() {
  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <CardTitle className="text-base">Activity Timeline - Backend Pending</CardTitle>
        </div>
        <CardDescription>
          Moderation activity logging requires backend endpoint implementation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-amber-100/50 dark:bg-amber-900/20 p-4 text-sm">
          <p className="font-medium mb-2">Required Backend Endpoint:</p>
          <code className="block bg-white dark:bg-zinc-900 p-2 rounded text-xs">
            GET /communities/:communityId/moderation/activity
          </code>
          <p className="mt-3 font-medium">Required Schema:</p>
          <code className="block bg-white dark:bg-zinc-900 p-2 rounded text-xs whitespace-pre">
{`interface ModerationActivityLog {
  id: string;
  moderatorId: string;
  moderatorName?: string;
  action: 'approve' | 'hide' | 'delete' | 'restore';
  contentType: 'post' | 'comment';
  contentId: string;
  reason?: string;
  timestamp: string;
}`}
          </code>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Implementation Requirements:</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Log all moderation actions with moderator identity</li>
            <li>Support filtering by action type and content type</li>
            <li>Include pagination for large activity logs</li>
            <li>Protect with CommunityPermission.POSTS_MODERATE</li>
          </ul>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Badge variant="outline" className="text-xs">Pending API</Badge>
          <span className="text-sm text-muted-foreground">
            This feature will be available once the backend is aligned.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────

function EmptyTimeline({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center" role="status">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
        <History className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold mb-1">
        {hasFilters ? "No matching activity" : "No activity yet"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        {hasFilters
          ? "Try adjusting your filters to see more activity."
          : "Moderation actions will appear here as they happen."}
      </p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function ModerationTimeline({ communityId, className }: ModerationTimelineProps) {
  const [filters, setFilters] = useState<TimelineFilters>({
    action: "all",
    contentType: "all",
    page: 1,
  });
  const [expanded, setExpanded] = useState(true);

  // Query for activity log
  const {
    data: activities = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["moderation-activity", communityId, filters],
    queryFn: () => moderationApi.getActivityLog(communityId, { page: filters.page, limit: 50 }),
    staleTime: 60 * 1000, // 1 minute
  });

  // Filter activities client-side
  const filteredActivities = useMemo(() => {
    let result = [...activities];

    if (filters.action !== "all") {
      result = result.filter((a) => a.action === filters.action);
    }

    if (filters.contentType !== "all") {
      result = result.filter((a) => a.contentType === filters.contentType);
    }

    // Sort by timestamp descending
    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return result;
  }, [activities, filters]);

  // Group by date
  const groupedActivities = useMemo(() => {
    return groupByDate(filteredActivities);
  }, [filteredActivities]);

  const hasFilters = filters.action !== "all" || filters.contentType !== "all";
  const isBackendUnavailable = !isLoading && activities.length === 0 && !hasFilters;

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className={cn("space-y-4", className)} role="region" aria-label="Moderation Timeline">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto hover:bg-transparent">
              <Activity className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <h3 className="text-lg font-semibold">Activity Timeline</h3>
              <Badge variant="secondary">{filteredActivities.length}</Badge>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  expanded && "rotate-180"
                )}
                aria-hidden="true"
              />
            </Button>
          </CollapsibleTrigger>

          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={filters.action}
              onValueChange={(v) => setFilters((prev) => ({ ...prev, action: v as any }))}
            >
              <SelectTrigger className="w-[130px]" aria-label="Filter by action">
                <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="approve">Approved</SelectItem>
                <SelectItem value="hide">Hidden</SelectItem>
                <SelectItem value="delete">Deleted</SelectItem>
                <SelectItem value="restore">Restored</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.contentType}
              onValueChange={(v) => setFilters((prev) => ({ ...prev, contentType: v as any }))}
            >
              <SelectTrigger className="w-[130px]" aria-label="Filter by content type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="post">Posts</SelectItem>
                <SelectItem value="comment">Comments</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label="Refresh timeline"
            >
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <CollapsibleContent>
          {isLoading ? (
            <TimelineSkeleton />
          ) : isError ? (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="py-8 text-center">
                <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" aria-hidden="true" />
                <p className="font-medium">Failed to load activity</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {(error as any)?.message || "Unknown error"}
                </p>
                <Button variant="outline" onClick={() => refetch()}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : isBackendUnavailable ? (
            <BackendPendingState />
          ) : filteredActivities.length === 0 ? (
            <EmptyTimeline hasFilters={hasFilters} />
          ) : (
            <div className="space-y-4">
              {Array.from(groupedActivities.entries()).map(([dateGroup, items]) => (
                <div key={dateGroup}>
                  <DateGroupHeader label={dateGroup} />
                  <div>
                    {items.map((activity, index) => (
                      <TimelineItem
                        key={activity.id}
                        activity={activity}
                        isLast={index === items.length - 1}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
