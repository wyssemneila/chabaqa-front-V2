"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDashboard, DashboardShell, DashboardLoading, DashboardUnauthorized, DashboardEmpty, DashboardError } from "../../components";
import { ROLE_LABELS, ROLE_COLORS, type CommunityRole } from "@/lib/permissions";
import { communitiesApi } from "@/lib/api/community/communities.api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Users, Search, RefreshCw, Calendar, Mail, Shield, Crown, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import type { CommunityMember } from "@/lib/api/core/types";

function getMemberName(m: CommunityMember): string {
  const u = (m as any).user || m;
  return [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.username || u?.email || "Unknown";
}
function getMemberAvatar(m: CommunityMember): string | undefined { const u = (m as any).user || m; return u?.profileImage || u?.avatar; }
function getMemberEmail(m: CommunityMember): string | undefined { const u = (m as any).user || m; return u?.email; }
function getInitials(n: string): string { return n.split(" ").map((s) => s[0]).join("").toUpperCase().slice(0, 2) || "?"; }
function getMemberRole(m: CommunityMember): CommunityRole {
  if ((m as any).isOwner) return "owner";
  if ((m as any).role === "admin") return "admin";
  if ((m as any).role === "moderator") return "moderator";
  if ((m as any).role === "support") return "support";
  return "member";
}
function getMemberJoinDate(m: CommunityMember): string { return (m as any).joinedAt || (m as any).createdAt || new Date().toISOString(); }

export default function SupportMembersPage() {
  const { communityId, role, isLoading, canAccessDashboard, getDashboardPath, creatorSlug } = useDashboard();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;
  const basePath = getDashboardPath("support");

  const { data: membersData, isLoading: membersLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["community-members-support", communityId, page, limit],
    queryFn: () => communitiesApi.getMembers(communityId, { page, limit }),
    staleTime: 30_000,
    enabled: !!communityId,
  });

  const members = (membersData as any)?.data ?? (membersData as any)?.members ?? [];
  const total = (membersData as any)?.total ?? (membersData as any)?.pagination?.total ?? members.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const filtered = searchQuery.trim()
    ? members.filter((m: CommunityMember) => {
        const q = searchQuery.toLowerCase();
        return getMemberName(m).toLowerCase().includes(q) || (getMemberEmail(m) || "").toLowerCase().includes(q);
      })
    : members;

  if (isLoading) return <DashboardLoading message="Loading member lookup..." />;
  if (!canAccessDashboard("support")) {
    return <DashboardUnauthorized role={role} requiredRole="support" backAction={{ label: "Back", href: `/${creatorSlug}` }} />;
  }

  return (
    <DashboardShell variant="support">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4"><Link href={basePath}><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link></Button>
        <h1 className="text-2xl font-bold tracking-tight">Member Lookup</h1>
        <p className="mt-1 text-muted-foreground">Search and view member profiles to assist with inquiries (read-only).</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{total} members</Badge>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {membersLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i}><CardContent className="p-4"><div className="flex gap-3"><Skeleton className="h-12 w-12 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div></div></CardContent></Card>
          ))}
        </div>
      ) : isError ? (
        <DashboardError title="Failed to load members" message={(error as any)?.message} retry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <DashboardEmpty icon={Users} title="No members found" description={searchQuery ? "Try a different search." : "No members yet."} />
      ) : (
        <>
          <div className="space-y-3">
            {filtered.map((member: CommunityMember, idx: number) => {
              const name = getMemberName(member);
              const avatar = getMemberAvatar(member);
              const email = getMemberEmail(member);
              const mRole = getMemberRole(member);
              const joinDate = getMemberJoinDate(member);
              return (
                <Card key={(member as any)._id || (member as any).userId || idx}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12"><AvatarImage src={avatar} alt={name} /><AvatarFallback>{getInitials(name)}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="font-semibold truncate">{name}</p>
                          <Badge className={cn(ROLE_COLORS[mRole], "gap-1 text-xs")}>
                            {mRole === "owner" && <Crown className="h-3 w-3" />}
                            {(mRole === "admin" || mRole === "moderator") && <Shield className="h-3 w-3" />}
                            {ROLE_LABELS[mRole]}
                          </Badge>
                        </div>
                        {email && <p className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3 shrink-0" />{email}</p>}
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />Joined {formatDistanceToNow(new Date(joinDate), { addSuffix: true })}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4 mr-1" />Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next<ChevronRight className="h-4 w-4 ml-1" /></Button>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardShell>
  );
}
