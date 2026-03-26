"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useDashboard,
  DashboardShell,
  DashboardSection,
  StatCard,
  DashboardLoading,
  DashboardUnauthorized,
  DashboardEmpty,
} from "../../components";
import { CommunityPermission } from "@/lib/permissions";
import { communityInvitationsApi, type InvitationStatus } from "@/lib/api/community/community-invitations.api";
import { communitiesApi } from "@/lib/api/community/communities.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  UserPlus,
  Mail,
  Link2,
  Copy,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  MoreVertical,
  Trash2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_CONFIG: Record<InvitationStatus, { color: string; icon: typeof Clock }> = {
  pending: { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  accepted: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  expired: { color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400", icon: XCircle },
  revoked: { color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

export default function AdminInvitationsPage() {
  const { role, can, isLoading, canAccessDashboard, getDashboardPath, creatorSlug, communityId } = useDashboard();
  const basePath = getDashboardPath("admin");
  const queryClient = useQueryClient();
  
  const [tab, setTab] = useState("email");
  const [emails, setEmails] = useState("");
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | InvitationStatus>("all");
  const [page, setPage] = useState(1);

  // Fetch invitation stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["invitation-stats", communityId],
    queryFn: () => communityInvitationsApi.getStats(communityId),
    enabled: !!communityId && canAccessDashboard("admin"),
    staleTime: 30_000,
  });

  // Fetch invitations list
  const { data: invitationsData, isLoading: invitationsLoading, refetch } = useQuery({
    queryKey: ["invitations", communityId, statusFilter, page],
    queryFn: () => communityInvitationsApi.getInvitations(communityId, { 
      page, 
      limit: 10, 
      status: statusFilter 
    }),
    enabled: !!communityId && canAccessDashboard("admin"),
    staleTime: 30_000,
  });

  // Generate invite link
  const { data: inviteLinkData, isLoading: linkLoading } = useQuery({
    queryKey: ["invite-link", communityId],
    queryFn: () => communitiesApi.generateInviteLink(communityId, false),
    enabled: !!communityId && canAccessDashboard("admin"),
    staleTime: 300_000, // 5 minutes
  });

  // Send invitations mutation
  const sendInviteMutation = useMutation({
    mutationFn: async () => {
      const emailList = emails.split(/[,\n]/).map(e => e.trim()).filter(Boolean);
      const contacts = emailList.map(email => ({ email }));
      return communityInvitationsApi.importContacts({
        contacts,
        communityId,
        personalMessage: message || undefined,
      });
    },
    onSuccess: (result) => {
      toast.success(`Sent ${result.created} invitation${result.created !== 1 ? "s" : ""}`, {
        description: result.skipped > 0 ? `${result.skipped} skipped (already invited)` : undefined,
      });
      setEmails("");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["invitations", communityId] });
      queryClient.invalidateQueries({ queryKey: ["invitation-stats", communityId] });
    },
    onError: (error: any) => {
      toast.error("Failed to send invitations", { description: error.message });
    },
  });

  // Resend invitation mutation
  const resendMutation = useMutation({
    mutationFn: (invitationId: string) => communityInvitationsApi.resendInvitation(invitationId),
    onSuccess: () => {
      toast.success("Invitation resent");
      refetch();
    },
    onError: (error: any) => {
      toast.error("Failed to resend", { description: error.message });
    },
  });

  // Revoke invitation mutation
  const revokeMutation = useMutation({
    mutationFn: (invitationId: string) => communityInvitationsApi.revokeInvitation(invitationId),
    onSuccess: () => {
      toast.success("Invitation revoked");
      queryClient.invalidateQueries({ queryKey: ["invitations", communityId] });
      queryClient.invalidateQueries({ queryKey: ["invitation-stats", communityId] });
    },
    onError: (error: any) => {
      toast.error("Failed to revoke", { description: error.message });
    },
  });

  // Regenerate link mutation
  const regenerateLinkMutation = useMutation({
    mutationFn: () => communitiesApi.generateInviteLink(communityId, true),
    onSuccess: () => {
      toast.success("New invite link generated");
      queryClient.invalidateQueries({ queryKey: ["invite-link", communityId] });
    },
    onError: (error: any) => {
      toast.error("Failed to generate link", { description: error.message });
    },
  });

  if (isLoading) return <DashboardLoading message="Loading invitations..." />;
  if (!canAccessDashboard("admin")) {
    return <DashboardUnauthorized role={role} requiredRole="admin" backAction={{ label: "Back", href: `/${creatorSlug}` }} />;
  }
  if (!can(CommunityPermission.MEMBERS_MANAGE)) {
    return (
      <DashboardShell variant="admin">
        <DashboardUnauthorized role={role} requiredRole="admin with members.manage" backAction={{ label: "Back", href: basePath }} />
      </DashboardShell>
    );
  }

  const inviteLink = inviteLinkData?.data?.inviteLink ?? `https://chabaqa.com/join/${communityId}`;
  const invitations = invitationsData?.invitations ?? [];
  const totalPages = invitationsData?.totalPages ?? 1;

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied");
  };

  return (
    <DashboardShell variant="admin">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={basePath}><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Invitations</h1>
        <p className="mt-1 text-muted-foreground">Invite new members to join your community.</p>
      </div>

      {/* Stats */}
      <DashboardSection title="Invitation Stats" description="Track your invitations" className="mb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Pending" value={statsLoading ? "—" : (stats?.pending ?? 0).toString()} description="Awaiting response" icon={Clock} isLoading={statsLoading} />
          <StatCard title="Accepted" value={statsLoading ? "—" : (stats?.accepted ?? 0).toString()} description="All time" icon={CheckCircle} isLoading={statsLoading} />
          <StatCard title="Conversion" value={statsLoading ? "—" : `${stats?.conversionRate ?? 0}%`} description="Invite to join" icon={UserPlus} isLoading={statsLoading} />
          <StatCard title="Total Sent" value={statsLoading ? "—" : (stats?.total ?? 0).toString()} description="All invitations" icon={Send} isLoading={statsLoading} />
        </div>
      </DashboardSection>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="email"><Mail className="mr-2 h-4 w-4" />Email Invite</TabsTrigger>
          <TabsTrigger value="link"><Link2 className="mr-2 h-4 w-4" />Invite Link</TabsTrigger>
          <TabsTrigger value="history"><Clock className="mr-2 h-4 w-4" />History</TabsTrigger>
        </TabsList>

        {/* Email Invite Tab */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Send Email Invitations</CardTitle>
              <CardDescription>Invite people by email to join your community</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emails">Email Addresses</Label>
                <Textarea id="emails" placeholder="Enter emails, one per line or comma-separated" value={emails} onChange={e => setEmails(e.target.value)} rows={4} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Personal Message (optional)</Label>
                <Textarea id="message" placeholder="Add a personal message..." value={message} onChange={e => setMessage(e.target.value)} rows={3} />
              </div>
              <Button onClick={() => sendInviteMutation.mutate()} disabled={sendInviteMutation.isPending || !emails.trim()}>
                {sendInviteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {sendInviteMutation.isPending ? "Sending..." : "Send Invitations"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invite Link Tab */}
        <TabsContent value="link" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shareable Invite Link</CardTitle>
              <CardDescription>Share this link to let anyone join</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {linkLoading ? (
                  <Skeleton className="h-10 flex-1" />
                ) : (
                  <Input value={inviteLink} readOnly className="font-mono text-sm" />
                )}
                <Button variant="outline" onClick={copyLink} disabled={linkLoading}>
                  <Copy className="mr-2 h-4 w-4" />Copy
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => regenerateLinkMutation.mutate()} disabled={regenerateLinkMutation.isPending}>
                  {regenerateLinkMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Generate New Link
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={inviteLink} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Preview</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as any); setPage(1); }}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Filter status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />Refresh
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Invitation History</CardTitle>
              <CardDescription>Track all sent invitations</CardDescription>
            </CardHeader>
            <CardContent>
              {invitationsLoading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : invitations.length === 0 ? (
                <DashboardEmpty title="No invitations" description="Send your first invitation to see it here." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map(invite => {
                      const StatusIcon = STATUS_CONFIG[invite.status]?.icon ?? Clock;
                      return (
                        <TableRow key={invite._id}>
                          <TableCell className="font-medium">{invite.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={STATUS_CONFIG[invite.status]?.color}>
                              <StatusIcon className="mr-1 h-3 w-3" />{invite.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{new Date(invite.invitedAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {invite.status === "pending" && (
                                  <>
                                    <DropdownMenuItem onClick={() => resendMutation.mutate(invite._id)} disabled={resendMutation.isPending}>
                                      <RefreshCw className="mr-2 h-4 w-4" />Resend
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => revokeMutation.mutate(invite._id)} disabled={revokeMutation.isPending} className="text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" />Revoke
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {invite.status === "expired" && (
                                  <DropdownMenuItem onClick={() => resendMutation.mutate(invite._id)} disabled={resendMutation.isPending}>
                                    <RefreshCw className="mr-2 h-4 w-4" />Resend
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                  <span className="py-2 px-3 text-sm">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
