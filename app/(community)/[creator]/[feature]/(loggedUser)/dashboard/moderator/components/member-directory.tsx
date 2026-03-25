"use client";

import { useState, useMemo, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Users,
  Search,
  RefreshCw,
  Calendar,
  Mail,
  Shield,
  Crown,
  Filter,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Info,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { communitiesApi } from "@/lib/api/communities.api";
import type { CommunityMember } from "@/lib/api/types";
import { ROLE_COLORS, ROLE_LABELS, type CommunityRole } from "@/lib/permissions";

// ── Types ──────────────────────────────────────────────────────────────────

interface MemberDirectoryProps {
  communityId: string;
  className?: string;
}

interface MemberFilters {
  search: string;
  role: string;
  sortBy: "joinedAt" | "name";
  sortOrder: "asc" | "desc";
  page: number;
  limit: number;
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

function getMemberRole(member: CommunityMember): CommunityRole {
  if ((member as any).isOwner) return "owner";
  if ((member as any).isAdmin || (member as any).role === "admin") return "admin";
  if ((member as any).isModerator || (member as any).role === "moderator") return "moderator";
  if ((member as any).role === "support") return "support";
  return "member";
}

function getMemberName(member: CommunityMember): string {
  const user = (member as any).user || member;
  return user?.name || user?.firstName
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
    : user?.username || user?.email || "Unknown";
}

function getMemberEmail(member: CommunityMember): string | undefined {
  const user = (member as any).user || member;
  return user?.email;
}

function getMemberAvatar(member: CommunityMember): string | undefined {
  const user = (member as any).user || member;
  return user?.profileImage || user?.avatar || user?.photo_profil;
}

function getMemberJoinDate(member: CommunityMember): string {
  return (member as any).joinedAt || (member as any).createdAt || new Date().toISOString();
}

// ── Role Badge ─────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: CommunityRole }) {
  const RoleIcon = role === "owner" ? Crown : Shield;

  return (
    <Badge className={cn(ROLE_COLORS[role], "gap-1")}>
      {(role === "owner" || role === "admin" || role === "moderator") && (
        <RoleIcon className="h-3 w-3" aria-hidden="true" />
      )}
      {ROLE_LABELS[role]}
    </Badge>
  );
}

// ── Member Row (Desktop) ───────────────────────────────────────────────────

interface MemberRowProps {
  member: CommunityMember;
}

function MemberRow({ member }: MemberRowProps) {
  const name = getMemberName(member);
  const email = getMemberEmail(member);
  const avatar = getMemberAvatar(member);
  const role = getMemberRole(member);
  const joinDate = getMemberJoinDate(member);

  return (
    <TableRow className="group">
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium truncate">{name}</p>
            {email && (
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
                {email}
              </p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <RoleBadge role={role} />
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                {formatDistanceToNow(new Date(joinDate), { addSuffix: true })}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Joined {format(new Date(joinDate), "PPP")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell className="text-right">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Eye className="h-4 w-4" />
                <span className="sr-only">View profile</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View profile (read-only)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
    </TableRow>
  );
}

// ── Member Card (Mobile) ───────────────────────────────────────────────────

function MemberCard({ member }: { member: CommunityMember }) {
  const name = getMemberName(member);
  const email = getMemberEmail(member);
  const avatar = getMemberAvatar(member);
  const role = getMemberRole(member);
  const joinDate = getMemberJoinDate(member);

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback>{getInitials(name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold truncate">{name}</p>
            <RoleBadge role={role} />
          </div>
          {email && (
            <p className="text-sm text-muted-foreground truncate">{email}</p>
          )}
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" aria-hidden="true" />
            Joined {formatDistanceToNow(new Date(joinDate), { addSuffix: true })}
          </p>
        </div>
      </div>
    </Card>
  );
}

// ── Loading Skeleton ───────────────────────────────────────────────────────

function MembersSkeleton() {
  return (
    <>
      {/* Desktop Skeleton */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Mobile Skeleton */}
      <div className="md:hidden space-y-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" role="status">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <Users className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold mb-1">
        {hasFilters ? "No members found" : "No members yet"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        {hasFilters
          ? "Try adjusting your search or filters."
          : "Members will appear here once they join the community."}
      </p>
    </div>
  );
}

// ── Read-only Info Card ────────────────────────────────────────────────────

function ReadOnlyInfoCard() {
  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-medium text-sm text-blue-800 dark:text-blue-200">
              Read-only Access
            </p>
            <p className="text-sm text-blue-600/80 dark:text-blue-300/80">
              As a moderator, you can view member information but cannot modify member roles or remove members. 
              Contact an admin for member management actions.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function MemberDirectory({ communityId, className }: MemberDirectoryProps) {
  const [filters, setFilters] = useState<MemberFilters>({
    search: "",
    role: "all",
    sortBy: "joinedAt",
    sortOrder: "desc",
    page: 1,
    limit: 20,
  });

  // Query for members
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["community-members", communityId, filters.page, filters.limit],
    queryFn: () => communitiesApi.getMembers(communityId, { page: filters.page, limit: filters.limit }),
    staleTime: 60 * 1000, // 1 minute
  });

  // Extract members from response
  const members = useMemo(() => {
    const items = (data as any)?.data?.items || (data as any)?.items || (data as any)?.data || [];
    return Array.isArray(items) ? items : [];
  }, [data]);

  const pagination = useMemo(() => {
    const pag = (data as any)?.data?.pagination || (data as any)?.pagination || {};
    return {
      page: pag.page || filters.page,
      limit: pag.limit || filters.limit,
      total: pag.total || members.length,
      totalPages: pag.totalPages || Math.ceil((pag.total || members.length) / filters.limit),
    };
  }, [data, members.length, filters.page, filters.limit]);

  // Client-side filtering and sorting
  const filteredMembers = useMemo(() => {
    let result = [...members];

    // Search filter
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();
      result = result.filter((m) => {
        const name = getMemberName(m).toLowerCase();
        const email = getMemberEmail(m)?.toLowerCase() || "";
        return name.includes(query) || email.includes(query);
      });
    }

    // Role filter
    if (filters.role !== "all") {
      result = result.filter((m) => getMemberRole(m) === filters.role);
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (filters.sortBy === "name") {
        comparison = getMemberName(a).localeCompare(getMemberName(b));
      } else {
        comparison = new Date(getMemberJoinDate(a)).getTime() - new Date(getMemberJoinDate(b)).getTime();
      }
      return filters.sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [members, filters]);

  // Handlers
  const handleFilterChange = useCallback(<K extends keyof MemberFilters>(key: K, value: MemberFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  }, []);

  const hasFilters = Boolean(filters.search.trim() || filters.role !== "all");

  return (
    <div className={cn("space-y-6", className)} role="region" aria-label="Member Directory">
      {/* Read-only Info */}
      <ReadOnlyInfoCard />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Member Directory</h3>
          <Badge variant="secondary">{pagination.total} members</Badge>
          <Badge variant="outline" className="gap-1">
            <Eye className="h-3 w-3" aria-hidden="true" />
            Read-only
          </Badge>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="Refresh members"
        >
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="pl-9"
            aria-label="Search members"
          />
        </div>

        <Select
          value={filters.role}
          onValueChange={(v) => handleFilterChange("role", v)}
        >
          <SelectTrigger className="w-[140px]" aria-label="Filter by role">
            <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="owner">Owners</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="moderator">Moderators</SelectItem>
            <SelectItem value="support">Support</SelectItem>
            <SelectItem value="member">Members</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.sortBy}
          onValueChange={(v) => handleFilterChange("sortBy", v as "joinedAt" | "name")}
        >
          <SelectTrigger className="w-[140px]" aria-label="Sort by">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="joinedAt">Join Date</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <MembersSkeleton />
      ) : isError ? (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" aria-hidden="true" />
            <p className="font-medium">Failed to load members</p>
            <p className="text-sm text-muted-foreground mb-4">
              {(error as any)?.message || "Unknown error"}
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : filteredMembers.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member, index) => (
                  <MemberRow key={(member as any)._id || (member as any).id || index} member={member} />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredMembers.map((member, index) => (
              <MemberCard key={(member as any)._id || (member as any).id || index} member={member} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
