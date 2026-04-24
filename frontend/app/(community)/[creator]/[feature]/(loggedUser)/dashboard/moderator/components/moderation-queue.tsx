"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Flag,
  MoreHorizontal,
  Eye,
  EyeOff,
  Trash2,
  RotateCcw,
  CheckCircle,
  Clock,
  AlertTriangle,
  MessageSquare,
  User,
  Calendar,
  Filter,
  RefreshCw,
  Inbox,
  type LucideIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  moderationApi,
  type ModerationItem,
  type ModerationStatus,
  type ModerationAction,
  type ModerationQueueFilters,
} from "@/lib/api/moderation.api";

// ── Types ──────────────────────────────────────────────────────────────────

interface ModerationQueueProps {
  communityId: string;
  className?: string;
}

interface QueueItemProps {
  item: ModerationItem;
  onAction: (action: ModerationAction, reason?: string) => Promise<void>;
  isActing: boolean;
}

interface ActionDialogState {
  open: boolean;
  action: ModerationAction | null;
  item: ModerationItem | null;
}

// ── Config ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ModerationStatus,
  { label: string; icon: LucideIcon; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pending", icon: Clock, variant: "secondary" },
  approved: { label: "Approved", icon: CheckCircle, variant: "default" },
  hidden: { label: "Hidden", icon: EyeOff, variant: "outline" },
  deleted: { label: "Deleted", icon: Trash2, variant: "destructive" },
};

const ACTION_CONFIG: Record<
  ModerationAction,
  { label: string; icon: LucideIcon; description: string; destructive?: boolean }
> = {
  approve: { label: "Approve", icon: CheckCircle, description: "Approve this content and remove from queue" },
  hide: { label: "Hide", icon: EyeOff, description: "Hide content from public view (reversible)" },
  delete: { label: "Delete", icon: Trash2, description: "Permanently delete this content", destructive: true },
  restore: { label: "Restore", icon: RotateCcw, description: "Restore previously hidden or deleted content" },
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

function getPostContent(item: ModerationItem): { title?: string; content: string; author?: string; avatar?: string } {
  const content = item.content as any;
  return {
    title: content?.title,
    content: content?.content || content?.text || "",
    author: content?.author?.name || content?.author?.username || content?.authorId,
    avatar: content?.author?.profileImage || content?.author?.avatar,
  };
}

// ── Status Badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ModerationStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" aria-hidden="true" />
      {config.label}
    </Badge>
  );
}

// ── Queue Item Component ───────────────────────────────────────────────────

function QueueItem({ item, onAction, isActing }: QueueItemProps) {
  const [actionDialog, setActionDialog] = useState<ActionDialogState>({
    open: false,
    action: null,
    item: null,
  });
  const [actionReason, setActionReason] = useState("");

  const postContent = getPostContent(item);
  const isPost = item.contentType === "post";
  const ContentIcon = MessageSquare;

  const handleActionClick = useCallback((action: ModerationAction) => {
    if (action === "delete") {
      setActionDialog({ open: true, action, item });
    } else {
      onAction(action);
    }
  }, [onAction, item]);

  const handleConfirmAction = useCallback(async () => {
    if (actionDialog.action) {
      await onAction(actionDialog.action, actionReason || undefined);
      setActionDialog({ open: false, action: null, item: null });
      setActionReason("");
    }
  }, [actionDialog.action, actionReason, onAction]);

  const availableActions: ModerationAction[] = useMemo(() => {
    switch (item.status) {
      case "pending":
        return ["approve", "hide", "delete"];
      case "hidden":
        return ["restore", "delete"];
      case "deleted":
        return ["restore"];
      case "approved":
        return ["hide", "delete"];
      default:
        return [];
    }
  }, [item.status]);

  return (
    <>
      <Card className={cn("transition-all duration-200 hover:shadow-md", isActing && "opacity-75 pointer-events-none")}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={postContent.avatar} alt={postContent.author || "Author"} />
                <AvatarFallback>{getInitials(postContent.author)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{postContent.author || "Unknown"}</span>
                  <Badge variant="outline" className="gap-1 text-xs">
                    <ContentIcon className="h-3 w-3" aria-hidden="true" />
                    {isPost ? "Post" : "Comment"}
                  </Badge>
                  <StatusBadge status={item.status} />
                </div>
                {postContent.title && (
                  <h4 className="font-semibold mt-1 truncate">{postContent.title}</h4>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  disabled={isActing}
                  aria-label="Actions menu"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="gap-2">
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  View Full Content
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {availableActions.map((action) => {
                  const config = ACTION_CONFIG[action];
                  return (
                    <DropdownMenuItem
                      key={action}
                      className={cn("gap-2", config.destructive && "text-destructive focus:text-destructive")}
                      onClick={() => handleActionClick(action)}
                    >
                      <config.icon className="h-4 w-4" aria-hidden="true" />
                      {config.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Content Preview */}
          <p className="text-sm text-muted-foreground line-clamp-3">{postContent.content || "No content preview available"}</p>

          {/* Report Info */}
          {item.reportCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Flag className="h-4 w-4 text-amber-500" aria-hidden="true" />
              <span className="text-amber-700 dark:text-amber-400 font-medium">
                {item.reportCount} report{item.reportCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </span>
            {item.moderatedAt && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" aria-hidden="true" />
                Moderated {formatDistanceToNow(new Date(item.moderatedAt), { addSuffix: true })}
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 pt-2 flex-wrap">
            {availableActions.slice(0, 3).map((action) => {
              const config = ACTION_CONFIG[action];
              return (
                <Button
                  key={action}
                  variant={config.destructive ? "destructive" : "outline"}
                  size="sm"
                  className="gap-1.5"
                  disabled={isActing}
                  onClick={() => handleActionClick(action)}
                >
                  <config.icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {config.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={actionDialog.open}
        onOpenChange={(open) => !open && setActionDialog({ open: false, action: null, item: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
              Confirm {actionDialog.action ? ACTION_CONFIG[actionDialog.action].label : "Action"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog.action && ACTION_CONFIG[actionDialog.action].description}
              {actionDialog.action === "delete" && (
                <span className="block mt-2 font-medium text-destructive">This action cannot be undone.</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="action-reason">Reason (optional)</Label>
            <Textarea
              id="action-reason"
              placeholder="Add a reason for this action..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={cn(actionDialog.action === "delete" && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ── Queue Skeleton ─────────────────────────────────────────────────────────

function QueueSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading moderation queue">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────

function QueueEmpty({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" role="status">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
        <Inbox className="h-8 w-8 text-green-600 dark:text-green-400" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold mb-1">
        {hasFilters ? "No matching items" : "Queue is empty"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        {hasFilters
          ? "Try adjusting your filters to see more content."
          : "Great job! There's no content awaiting moderation right now."}
      </p>
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
          <CardTitle className="text-base">Moderation Queue - Backend Pending</CardTitle>
        </div>
        <CardDescription>
          Community-level moderation queue requires backend endpoint implementation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-amber-100/50 dark:bg-amber-900/20 p-4 text-sm">
          <p className="font-medium mb-2">Required Backend Endpoint:</p>
          <code className="block bg-white dark:bg-zinc-900 p-2 rounded text-xs">
            GET /communities/:communityId/moderation/queue
          </code>
          <p className="mt-2 text-muted-foreground">
            This endpoint should be protected by <code>CommunityPermission.POSTS_MODERATE</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">Pending API</Badge>
          <span className="text-sm text-muted-foreground">
            This feature will be available once the backend is aligned.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function ModerationQueue({ communityId, className }: ModerationQueueProps) {
  const queryClient = useQueryClient();

  // Filters state
  const [filters, setFilters] = useState<ModerationQueueFilters>({
    page: 1,
    limit: 10,
    status: undefined,
    contentType: undefined,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Query for moderation queue
  const {
    data: queue,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["moderation-queue", communityId, filters],
    queryFn: () => moderationApi.getQueue(communityId, filters),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Mutation for moderation actions
  const moderationMutation = useMutation({
    mutationFn: async ({
      itemId,
      action,
      reason,
    }: {
      itemId: string;
      action: ModerationAction;
      reason?: string;
    }) => {
      return moderationApi.moderatePost(itemId, action, reason);
    },
    onSuccess: (_, variables) => {
      toast.success(`Content \${ACTION_CONFIG[variables.action].label.toLowerCase()}d successfully`);
      queryClient.invalidateQueries({ queryKey: ["moderation-queue", communityId] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to moderate content");
    },
  });

  // Handlers
  const handleFilterChange = useCallback((key: keyof ModerationQueueFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
      page: key === "page" ? value : 1, // Reset page when other filters change
    }));
  }, []);

  const handleItemAction = useCallback(
    async (item: ModerationItem, action: ModerationAction, reason?: string) => {
      await moderationMutation.mutateAsync({
        itemId: item.contentId,
        action,
        reason,
      });
    },
    [moderationMutation],
  );

  const hasFilters = Boolean(filters.status || filters.contentType);
  const hasItems = (queue?.items?.length ?? 0) > 0;
  const isBackendUnavailable = !isLoading && !hasItems && queue?.pagination?.total === 0 && !hasFilters;

  return (
    <div className={cn("space-y-6", className)} role="region" aria-label="Moderation Queue">
      {/* Header with Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Moderation Queue</h3>
          {queue?.stats && (
            <Badge variant={queue.stats.pending > 0 ? "destructive" : "secondary"}>
              {queue.stats.pending} pending
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={filters.status ?? "all"}
            onValueChange={(v) => handleFilterChange("status", v)}
          >
            <SelectTrigger className="w-[130px]" aria-label="Filter by status">
              <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.contentType ?? "all"}
            onValueChange={(v) => handleFilterChange("contentType", v)}
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
            aria-label="Refresh queue"
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <QueueSkeleton />
      ) : isError ? (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" aria-hidden="true" />
            <p className="font-medium">Failed to load moderation queue</p>
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
      ) : !hasItems ? (
        <QueueEmpty hasFilters={hasFilters} />
      ) : (
        <div className="space-y-4">
          {queue?.items.map((item) => (
            <QueueItem
              key={item.id}
              item={item}
              onAction={(action, reason) => handleItemAction(item, action, reason)}
              isActing={moderationMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
