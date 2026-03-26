"use client";

import { useState, useCallback, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import {
  Pin,
  PinOff,
  GripVertical,
  Search,
  RefreshCw,
  Calendar,
  MessageSquare,
  Heart,
  AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { moderationApi, type PinnedPost } from "@/lib/api/admin/moderation.api";

// ── Types ──────────────────────────────────────────────────────────────────

interface PinnedContentManagerProps {
  communityId: string;
  className?: string;
}

interface SortablePinnedPostProps {
  post: PinnedPost;
  onUnpin: (postId: string) => Promise<void>;
  isUnpinning: boolean;
}

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

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

// ── Sortable Pinned Post Card ──────────────────────────────────────────────

function SortablePinnedPost({ post, onUnpin, isUnpinning }: SortablePinnedPostProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: post.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const author = post.author;
  const authorName = (author as any)?.name || (author as any)?.username || "Unknown";
  const authorAvatar = (author as any)?.profileImage || (author as any)?.avatar;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group",
        isDragging && "z-50 opacity-90",
      )}
    >
      <Card
        className={cn(
          "transition-all duration-200",
          isDragging && "shadow-lg ring-2 ring-primary/20",
          "hover:shadow-md",
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <button
              className={cn(
                "shrink-0 cursor-grab touch-none rounded p-1",
                "text-muted-foreground hover:text-foreground hover:bg-muted",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isDragging && "cursor-grabbing",
              )}
              aria-label="Drag to reorder"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Author Avatar */}
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={authorAvatar} alt={authorName} />
              <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{authorName}</span>
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Pin className="h-3 w-3" aria-hidden="true" />
                  Pinned
                </Badge>
              </div>

              {post.title && (
                <h4 className="font-semibold text-sm line-clamp-1">{post.title}</h4>
              )}

              <p className="text-sm text-muted-foreground line-clamp-2">
                {truncateText(post.content || "", 150)}
              </p>

              {/* Stats Row */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" aria-hidden="true" />
                  {(post as any).likes || 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" aria-hidden="true" />
                  {(post as any).commentsCount || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" aria-hidden="true" />
                  {post.pinnedAt
                    ? formatDistanceToNow(new Date(post.pinnedAt), { addSuffix: true })
                    : formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Unpin Action */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isUnpinning}
                  aria-label="Unpin post"
                >
                  <PinOff className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Unpin this post?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove the post from the pinned section. Members will
                    still be able to see it in the regular feed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onUnpin(post.id)}>
                    Unpin
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Loading Skeleton ───────────────────────────────────────────────────────

function PinnedPostsSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading pinned posts">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────

function NoPinnedPosts() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center" role="status">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
        <Pin className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold mb-1">No pinned posts</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Pin important posts to keep them visible at the top of the community feed.
      </p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function PinnedContentManager({ communityId, className }: PinnedContentManagerProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Query for pinned posts
  const {
    data: pinnedPosts = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["pinned-posts", communityId],
    queryFn: () => moderationApi.getPinnedPosts(communityId),
    staleTime: 60 * 1000, // 1 minute
  });

  // Unpin mutation
  const unpinMutation = useMutation({
    mutationFn: (postId: string) => moderationApi.unpinPost(postId),
    onSuccess: () => {
      toast.success("Post unpinned successfully");
      queryClient.invalidateQueries({ queryKey: ["pinned-posts", communityId] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to unpin post");
    },
  });

  // Handlers
  const handleUnpin = useCallback(async (postId: string) => {
    await unpinMutation.mutateAsync(postId);
  }, [unpinMutation]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Currently just visual reordering - backend doesn't support pin order yet
      // This would need a backend endpoint to persist the order
      toast.info("Reordering pinned posts requires backend support");
    }
  }, []);

  // Filter posts by search
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return pinnedPosts;
    const query = searchQuery.toLowerCase();
    return pinnedPosts.filter(
      (post) =>
        post.title?.toLowerCase().includes(query) ||
        post.content?.toLowerCase().includes(query) ||
        (post.author as any)?.name?.toLowerCase().includes(query),
    );
  }, [pinnedPosts, searchQuery]);

  const pinIds = useMemo(() => filteredPosts.map((p) => p.id), [filteredPosts]);

  return (
    <div className={cn("space-y-6", className)} role="region" aria-label="Pinned Content Manager">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Pinned Content</h3>
          <Badge variant="secondary">{pinnedPosts.length}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search pinned posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              aria-label="Search pinned posts"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh pinned posts"
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <PinnedPostsSkeleton />
      ) : isError ? (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" aria-hidden="true" />
            <p className="font-medium">Failed to load pinned posts</p>
            <p className="text-sm text-muted-foreground mb-4">
              {(error as any)?.message || "Unknown error"}
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : pinnedPosts.length === 0 ? (
        <NoPinnedPosts />
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center" role="status">
          <Search className="h-8 w-8 text-muted-foreground mb-2" aria-hidden="true" />
          <h3 className="text-lg font-semibold mb-1">No matching posts</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Try adjusting your search to find pinned posts.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={pinIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {filteredPosts.map((post) => (
                <SortablePinnedPost
                  key={post.id}
                  post={post}
                  onUnpin={handleUnpin}
                  isUnpinning={unpinMutation.isPending}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
