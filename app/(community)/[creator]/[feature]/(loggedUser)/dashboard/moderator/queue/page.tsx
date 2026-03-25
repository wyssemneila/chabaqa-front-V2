"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useDashboard,
  DashboardShell,
  DashboardSection,
  DashboardLoading,
  DashboardUnauthorized,
  DashboardEmpty,
} from "../../components";
import { CommunityPermission } from "@/lib/permissions";
import { moderationApi, ModerationAction } from "@/lib/api/moderation.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Flag,
  RefreshCw,
  MoreVertical,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type QueueStatus = "all" | "pending" | "approved" | "hidden";

export default function ModeratorQueuePage() {
  const { role, can, isLoading, canAccessDashboard, getDashboardPath, creatorSlug, communityId } = useDashboard();
  const basePath = getDashboardPath("moderator");
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState<QueueStatus>("pending");
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [actionDialog, setActionDialog] = useState<{ open: boolean; action: ModerationAction | null; itemId: string | null }>({
    open: false,
    action: null,
    itemId: null,
  });
  const [reason, setReason] = useState("");

  // Fetch queue
  const { data: queueData, isLoading: queueLoading, refetch } = useQuery({
    queryKey: ["moderation-queue", communityId, statusFilter, page],
    queryFn: () => moderationApi.getQueue(communityId, { 
      status: statusFilter === "all" ? undefined : statusFilter,
      page, 
      limit: 20 
    }),
    enabled: !!communityId && canAccessDashboard("moderator"),
    staleTime: 30_000,
  });

  // Moderate mutation
  const moderateMutation = useMutation({
    mutationFn: ({ postId, action, reason }: { postId: string; action: ModerationAction; reason?: string }) =>
      moderationApi.moderatePost(postId, { action, reason }),
    onSuccess: (_, vars) => {
      toast.success(`Content ${vars.action === "approve" ? "approved" : vars.action === "hide" ? "hidden" : "deleted"}`);
      queryClient.invalidateQueries({ queryKey: ["moderation-queue", communityId] });
      setActionDialog({ open: false, action: null, itemId: null });
      setReason("");
    },
    onError: (error: any) => {
      toast.error("Action failed", { description: error.message });
    },
  });

  if (isLoading) return <DashboardLoading message="Loading queue..." />;
  if (!canAccessDashboard("moderator")) {
    return <DashboardUnauthorized role={role} requiredRole="moderator" backAction={{ label: "Back", href: `/${creatorSlug}` }} />;
  }
  if (!can(CommunityPermission.CONTENT_MODERATE)) {
    return (
      <DashboardShell variant="moderator">
        <DashboardUnauthorized role={role} requiredRole="moderator with content.moderate" backAction={{ label: "Back", href: basePath }} />
      </DashboardShell>
    );
  }

  const queue = queueData?.queue ?? [];
  const totalPages = queueData?.totalPages ?? 1;
  const counts = {
    all: queueData?.totalCount ?? 0,
    pending: queueData?.pendingCount ?? queue.filter((i: any) => i.status === "pending").length,
    approved: queueData?.approvedCount ?? queue.filter((i: any) => i.status === "approved").length,
    hidden: queueData?.hiddenCount ?? queue.filter((i: any) => i.status === "hidden").length,
  };

  const handleAction = (action: ModerationAction, itemId: string) => {
    if (action === "approve") {
      moderateMutation.mutate({ postId: itemId, action });
    } else {
      setActionDialog({ open: true, action, itemId });
    }
  };

  const confirmAction = () => {
    if (actionDialog.itemId && actionDialog.action) {
      moderateMutation.mutate({
        postId: actionDialog.itemId,
        action: actionDialog.action,
        reason: reason || undefined,
      });
    }
  };

  return (
    <DashboardShell variant="moderator">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={basePath}><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Review Queue</h1>
            <p className="mt-1 text-muted-foreground">Review and moderate flagged content.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />Refresh
          </Button>
        </div>
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v as QueueStatus); setPage(1); }} className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />Pending
            {counts.pending > 0 && <Badge variant="destructive" className="ml-1">{counts.pending}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="approved"><CheckCircle className="mr-2 h-4 w-4" />Approved</TabsTrigger>
          <TabsTrigger value="hidden"><XCircle className="mr-2 h-4 w-4" />Hidden</TabsTrigger>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {statusFilter === "all" ? "All Items" : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Items`}
              </CardTitle>
              <CardDescription>
                {statusFilter === "pending" ? "Items waiting for your review" : `Items that have been ${statusFilter}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {queueLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
                      <Skeleton className="h-12 w-12 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-[300px]" />
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : queue.length === 0 ? (
                <DashboardEmpty
                  title={statusFilter === "pending" ? "Queue is clear" : "No items"}
                  description={statusFilter === "pending" ? "No content needs review right now." : `No ${statusFilter} items to show.`}
                  icon={statusFilter === "pending" ? CheckCircle : AlertTriangle}
                />
              ) : (
                <div className="space-y-4">
                  {queue.map((item: any) => (
                    <div key={item._id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex h-12 w-12 items-center justify-center rounded bg-muted shrink-0">
                        <Flag className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{item.title || "Reported Content"}</h4>
                          <Badge variant={
                            item.status === "pending" ? "destructive" :
                            item.status === "approved" ? "default" : "secondary"
                          }>
                            {item.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Reported by {item.reporterName || "Anonymous"} • {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                        {item.reportReason && (
                          <p className="text-sm bg-muted p-2 rounded mb-2">
                            <span className="font-medium">Reason:</span> {item.reportReason}
                          </p>
                        )}
                        {item.content && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{item.content}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" onClick={() => setSelectedItem(item)}>
                          <Eye className="mr-2 h-4 w-4" />View
                        </Button>
                        {item.status === "pending" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleAction("approve", item._id)}>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAction("hide", item._id)}>
                                <XCircle className="mr-2 h-4 w-4 text-amber-600" />Reject
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleAction("delete", item._id)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                  <span className="py-2 px-4 text-sm">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, action: null, itemId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === "hide" ? "Hide Content" : "Delete Content"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === "hide"
                ? "Provide a reason for hiding this content."
                : "This will permanently delete the content. Provide a reason."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for this action..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, action: null, itemId: null })}>Cancel</Button>
            <Button
              variant={actionDialog.action === "delete" ? "destructive" : "default"}
              onClick={confirmAction}
              disabled={moderateMutation.isPending}
            >
              {moderateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedItem?.title || "Content Details"}</DialogTitle>
            <DialogDescription>Full content and report details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
            {selectedItem?.reportReason && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm font-medium text-destructive">Report Reason</p>
                <p className="text-sm mt-1">{selectedItem.reportReason}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium mb-1">Content</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedItem?.content || "No content available"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Author</p>
                <p className="text-muted-foreground">{selectedItem?.authorName || "Unknown"}</p>
              </div>
              <div>
                <p className="font-medium">Created</p>
                <p className="text-muted-foreground">{selectedItem?.createdAt ? new Date(selectedItem.createdAt).toLocaleString() : "—"}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedItem(null)}>Close</Button>
            {selectedItem?.status === "pending" && (
              <>
                <Button variant="default" onClick={() => { handleAction("approve", selectedItem._id); setSelectedItem(null); }}>
                  <CheckCircle className="mr-2 h-4 w-4" />Approve
                </Button>
                <Button variant="destructive" onClick={() => { handleAction("delete", selectedItem._id); setSelectedItem(null); }}>
                  <Trash2 className="mr-2 h-4 w-4" />Remove
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
