"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useDashboard,
  DashboardShell,
  DashboardSection,
  DashboardLoading,
  DashboardUnauthorized,
  DashboardEmpty,
  DashboardError,
} from "../../components";
import { CommunityPermission, ROLE_LABELS, ROLE_COLORS, type CommunityStaffRole } from "@/lib/permissions";
import { communityAccessApi, type CommunityStaffMember } from "@/lib/api/community-access.api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Shield,
  MoreHorizontal,
  UserMinus,
  RefreshCw,
  Search,
  Crown,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface RemoveDialogState {
  open: boolean;
  member: CommunityStaffMember | null;
}

function getInitials(member: CommunityStaffMember): string {
  const user = member.user;
  if (!user) return "?";
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function getDisplayName(member: CommunityStaffMember): string {
  const user = member.user;
  if (!user) return "Unknown User";
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || user.email || "Unknown";
}

interface StaffRowProps {
  member: CommunityStaffMember;
  onRoleChange: (userId: string, role: CommunityStaffRole) => void;
  onRemove: (member: CommunityStaffMember) => void;
  canManage: boolean;
  isUpdating: boolean;
}

function StaffRow({ member, onRoleChange, onRemove, canManage, isUpdating }: StaffRowProps) {
  const name = getDisplayName(member);
  const initials = getInitials(member);
  const isOwner = member.role === ("owner" as CommunityStaffRole);

  return (
    <Card className={cn("transition-all", isUpdating && "opacity-60 pointer-events-none")}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={member.user?.profileImage} alt={name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{name}</p>
            {member.user?.email && (
              <p className="text-sm text-muted-foreground truncate">{member.user.email}</p>
            )}
          </div>
          <Badge className={cn(ROLE_COLORS[member.role] || ROLE_COLORS.member)}>
            {isOwner && <Crown className="h-3 w-3 mr-1" />}
            {ROLE_LABELS[member.role] || member.role}
          </Badge>
          {canManage && !isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onRoleChange(member.userId, "admin")}>Set as Admin</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRoleChange(member.userId, "moderator")}>Set as Moderator</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRoleChange(member.userId, "support")}>Set as Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => onRemove(member)}>
                  <UserMinus className="h-4 w-4 mr-2" />Remove Staff
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminStaffPage() {
  const { communityId, can, role, isLoading, canAccessDashboard, getDashboardPath, creatorSlug } = useDashboard();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [removeDialog, setRemoveDialog] = useState<RemoveDialogState>({ open: false, member: null });
  const basePath = getDashboardPath("admin");

  const {
    data: staff = [],
    isLoading: staffLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["community-staff", communityId],
    queryFn: () => communityAccessApi.listStaff(communityId),
    staleTime: 30_000,
    enabled: !!communityId,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role: newRole }: { userId: string; role: CommunityStaffRole }) =>
      communityAccessApi.updateStaffRole(communityId, userId, newRole),
    onSuccess: () => {
      toast.success("Role updated successfully");
      queryClient.invalidateQueries({ queryKey: ["community-staff", communityId] });
    },
    onError: (err: any) => { toast.error(err?.message || "Failed to update role"); },
  });

  const removeStaffMutation = useMutation({
    mutationFn: (userId: string) => communityAccessApi.removeStaff(communityId, userId),
    onSuccess: () => {
      toast.success("Staff member removed");
      queryClient.invalidateQueries({ queryKey: ["community-staff", communityId] });
      setRemoveDialog({ open: false, member: null });
    },
    onError: (err: any) => { toast.error(err?.message || "Failed to remove staff member"); },
  });

  const handleRoleChange = useCallback(
    (userId: string, newRole: CommunityStaffRole) => { updateRoleMutation.mutate({ userId, role: newRole }); },
    [updateRoleMutation],
  );

  const handleRemove = useCallback((member: CommunityStaffMember) => {
    setRemoveDialog({ open: true, member });
  }, []);

  const handleConfirmRemove = useCallback(() => {
    if (removeDialog.member) { removeStaffMutation.mutate(removeDialog.member.userId); }
  }, [removeDialog.member, removeStaffMutation]);

  const filteredStaff = staff.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = getDisplayName(m).toLowerCase();
    const email = m.user?.email?.toLowerCase() || "";
    return name.includes(q) || email.includes(q) || m.role.includes(q);
  });

  if (isLoading) return <DashboardLoading message="Loading staff management..." />;
  if (!canAccessDashboard("admin")) {
    return <DashboardUnauthorized role={role} requiredRole="admin" backAction={{ label: "Back", href: `/${creatorSlug}` }} />;
  }

  return (
    <DashboardShell variant="admin">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={basePath}><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Staff & Roles</h1>
        <p className="mt-1 text-muted-foreground">Manage your community staff team and role assignments.</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search staff..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{staff.length} members</Badge>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {staffLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-4"><div className="flex items-center gap-4"><Skeleton className="h-10 w-10 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div><Skeleton className="h-5 w-20" /></div></CardContent></Card>
          ))}
        </div>
      ) : isError ? (
        <DashboardError title="Failed to load staff" message={(error as any)?.message} retry={() => refetch()} />
      ) : filteredStaff.length === 0 ? (
        <DashboardEmpty icon={Shield} title={searchQuery ? "No matching staff" : "No staff members"} description={searchQuery ? "Try a different search term." : "Assign staff roles to community members."} />
      ) : (
        <div className="space-y-3">
          {filteredStaff.map((member) => (
            <StaffRow key={member._id} member={member} onRoleChange={handleRoleChange} onRemove={handleRemove} canManage={can(CommunityPermission.ROLES_MANAGE)} isUpdating={updateRoleMutation.isPending} />
          ))}
        </div>
      )}

      <AlertDialog open={removeDialog.open} onOpenChange={(open) => !open && setRemoveDialog({ open: false, member: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{removeDialog.member ? getDisplayName(removeDialog.member) : ""}</strong> from the staff team? They will lose all staff permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}
