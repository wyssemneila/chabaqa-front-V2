"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Shield, UserPlus, Trash2, Loader2, Search, Info } from "lucide-react"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { useCommunityGuard } from "@/hooks/use-community-guard"
import { PageShell } from "@/components/creator-dashboard"
import { communityAccessApi, CommunityStaffMember } from "@/lib/api/community-access.api"
import { useToast } from "@/hooks/use-toast"
import { useCommunityPermissions } from "@/hooks/use-community-permissions"
import {
  COMMUNITY_STAFF_ROLES,
  ROLE_LABELS,
  ROLE_COLORS,
  ROLE_PERMISSIONS,
  PERMISSION_LABELS,
  CommunityPermission,
  type CommunityStaffRole,
  type CommunityRole,
  type CommunityPermissionValue,
} from "@/lib/permissions"
import { api } from "@/lib/api"

// ── Helpers ────────────────────────────────────────────────────────────────

function getDisplayName(staff: CommunityStaffMember): string {
  const u = staff.user as any
  if (!u) return staff.userId
  const names = [u.firstName, u.lastName].filter(Boolean).join(" ")
  return names || u.name || u.username || u.email || staff.userId
}

function getInitials(staff: CommunityStaffMember): string {
  const u = staff.user
  if (!u) return "?"
  if (u.firstName) return (u.firstName[0] + (u.lastName?.[0] ?? "")).toUpperCase()
  if (u.username) return u.username.slice(0, 2).toUpperCase()
  return u.email?.slice(0, 2).toUpperCase() ?? "?"
}

// ── Role permissions tooltip card ──────────────────────────────────────────

function RolePermissionsInfo({ role }: { role: CommunityRole }) {
  const perms = ROLE_PERMISSIONS[role] ?? []
  if (perms.length === 0) return null
  return (
    <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
      {perms.map((p) => (
        <span
          key={p}
          className="inline-block mr-2 px-1.5 py-0.5 rounded bg-muted"
        >
          {PERMISSION_LABELS[p] ?? p}
        </span>
      ))}
    </div>
  )
}

// ── Page component ─────────────────────────────────────────────────────────

export default function TeamRolesPage() {
  const { guard, selectedCommunityId, selectedCommunity } = useCommunityGuard()
  const { can, role: myRole, isLoading: permLoading } = useCommunityPermissions(selectedCommunityId)
  const { toast } = useToast()

  const [staff, setStaff] = useState<CommunityStaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Add staff dialog
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addEmail, setAddEmail] = useState("")
  const [addRole, setAddRole] = useState<CommunityStaffRole>("moderator")
  const [adding, setAdding] = useState(false)
  const [memberSearch, setMemberSearch] = useState<any[]>([])
  const [searchingMembers, setSearchingMembers] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  // Remove dialog
  const [removeTarget, setRemoveTarget] = useState<CommunityStaffMember | null>(null)
  const [removing, setRemoving] = useState(false)

  // Role detail card
  const [detailRole, setDetailRole] = useState<CommunityRole | null>(null)

  // ── Fetch staff ──────────────────────────────────────────────────────────

  const fetchStaff = useCallback(async () => {
    if (!selectedCommunityId) return
    setLoading(true)
    try {
      const data = await communityAccessApi.listStaff(selectedCommunityId)
      setStaff(data)
    } catch {
      toast({ title: "Error", description: "Failed to load team members", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [selectedCommunityId, toast])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  // ── Member search for add dialog ────────────────────────────────────────

  const searchMembers = useCallback(
    async (q: string) => {
      if (!selectedCommunityId || q.length < 2) {
        setMemberSearch([])
        return
      }
      setSearchingMembers(true)
      try {
        const res = await api.communities.getMembers(selectedCommunityId, { page: 1, limit: 20 })
        const members: any[] = (res as any)?.data ?? (res as any)?.items ?? res ?? []
        const filtered = members.filter((m: any) => {
          const u = m.user ?? m
          const text = [u.name, u.firstName, u.lastName, u.email, u.username].filter(Boolean).join(" ").toLowerCase()
          return text.includes(q.toLowerCase())
        })
        setMemberSearch(filtered)
      } catch {
        setMemberSearch([])
      } finally {
        setSearchingMembers(false)
      }
    },
    [selectedCommunityId],
  )

  // ── Add staff handler ────────────────────────────────────────────────────

  const handleAddStaff = async () => {
    if (!selectedCommunityId || !selectedUserId) return
    setAdding(true)
    try {
      await communityAccessApi.assignStaff(selectedCommunityId, selectedUserId, addRole)
      toast({ title: "Success", description: `Staff member assigned as ${ROLE_LABELS[addRole]}` })
      setShowAddDialog(false)
      setAddEmail("")
      setSelectedUserId(null)
      setMemberSearch([])
      fetchStaff()
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message ?? "Failed to assign role",
        variant: "destructive",
      })
    } finally {
      setAdding(false)
    }
  }

  // ── Update role handler ──────────────────────────────────────────────────

  const handleUpdateRole = async (userId: string, newRole: CommunityStaffRole) => {
    if (!selectedCommunityId) return
    try {
      await communityAccessApi.updateStaffRole(selectedCommunityId, userId, newRole)
      toast({ title: "Updated", description: `Role changed to ${ROLE_LABELS[newRole]}` })
      fetchStaff()
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message ?? "Failed to update role",
        variant: "destructive",
      })
    }
  }

  // ── Remove handler ───────────────────────────────────────────────────────

  const handleRemove = async () => {
    if (!selectedCommunityId || !removeTarget) return
    setRemoving(true)
    try {
      await communityAccessApi.removeStaff(selectedCommunityId, removeTarget.userId)
      toast({ title: "Removed", description: "Staff member removed" })
      setRemoveTarget(null)
      fetchStaff()
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message ?? "Failed to remove staff",
        variant: "destructive",
      })
    } finally {
      setRemoving(false)
    }
  }

  // ── Filtered list ────────────────────────────────────────────────────────

  const filteredStaff = staff.filter((s) => {
    if (!searchQuery) return true
    const name = getDisplayName(s).toLowerCase()
    return name.includes(searchQuery.toLowerCase())
  })

  const canManageRoles = can(CommunityPermission.ROLES_MANAGE)

  // ── No community selected ───────────────────────────────────────────────

  if (!selectedCommunityId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Shield className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold">Select a Community</h2>
        <p className="text-muted-foreground mt-2">Choose a community from the sidebar to manage team roles.</p>
      </div>
    )
  }

  if (guard) return guard

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team & Roles</h1>
          <p className="text-muted-foreground mt-1">
            Manage staff roles and permissions for{" "}
            <span className="font-medium text-foreground">
              {selectedCommunity?.name ?? "this community"}
            </span>
          </p>
        </div>
        {canManageRoles && (
          <Button onClick={() => setShowAddDialog(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Staff Member
          </Button>
        )}
      </div>

      {/* Role overview cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {(["owner", "admin", "moderator", "support"] as const).map((r) => {
          const count = r === "owner" ? 1 : staff.filter((s) => s.role === r).length
          return (
            <Card
              key={r}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setDetailRole(r)}
            >
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center justify-between">
                  <Badge className={ROLE_COLORS[r]}>{ROLE_LABELS[r]}</Badge>
                  <span className="text-2xl font-bold">{count}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {(ROLE_PERMISSIONS[r] ?? []).length} permissions
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Staff list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Staff Members</CardTitle>
              <CardDescription>{staff.length} member{staff.length !== 1 ? "s" : ""}</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading || permLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? "No staff matching your search." : "No staff members assigned yet."}
            </div>
          ) : (
            <div className="divide-y">
              {filteredStaff.map((s) => (
                <div
                  key={s._id}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={s.user?.profileImage} />
                    <AvatarFallback>{getInitials(s)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{getDisplayName(s)}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {s.user?.email ?? s.userId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManageRoles ? (
                      <Select
                        value={s.role}
                        onValueChange={(v) => handleUpdateRole(s.userId, v as CommunityStaffRole)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COMMUNITY_STAFF_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={ROLE_COLORS[s.role as CommunityRole]}>
                        {ROLE_LABELS[s.role as CommunityRole] ?? s.role}
                      </Badge>
                    )}
                    {canManageRoles && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setRemoveTarget(s)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Add Staff Dialog ────────────────────────────────────────────────── */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>
              Search for a community member and assign them a staff role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Search Member</label>
              <Input
                placeholder="Type name, email or username..."
                value={addEmail}
                onChange={(e) => {
                  setAddEmail(e.target.value)
                  searchMembers(e.target.value)
                }}
              />
              {searchingMembers && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Searching...
                </div>
              )}
              {memberSearch.length > 0 && (
                <div className="mt-2 border rounded-md max-h-48 overflow-y-auto divide-y">
                  {memberSearch.map((m: any) => {
                    const u = m.user ?? m
                    const uid = u._id ?? u.id ?? m.userId
                    const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.name || u.username || u.email
                    const isSelected = selectedUserId === uid
                    return (
                      <button
                        key={uid}
                        type="button"
                        onClick={() => setSelectedUserId(uid)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent transition-colors ${
                          isSelected ? "bg-accent" : ""
                        }`}
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={u.profileImage ?? u.avatar} />
                          <AvatarFallback>{(name?.[0] ?? "?").toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{name}</p>
                          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                        </div>
                        {isSelected && (
                          <Badge variant="secondary" className="text-xs">Selected</Badge>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Role</label>
              <Select value={addRole} onValueChange={(v) => setAddRole(v as CommunityStaffRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMUNITY_STAFF_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      <div>
                        <span className="font-medium">{ROLE_LABELS[r]}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({(ROLE_PERMISSIONS[r] ?? []).length} permissions)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <RolePermissionsInfo role={addRole} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddStaff} disabled={!selectedUserId || adding}>
                {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assign Role
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Remove confirmation ─────────────────────────────────────────────── */}
      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove staff member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke <strong>{removeTarget ? getDisplayName(removeTarget) : ""}</strong>&apos;s{" "}
              <strong>{ROLE_LABELS[(removeTarget?.role as CommunityRole) ?? "member"]}</strong> role.
              They will remain a community member.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Role detail dialog ──────────────────────────────────────────────── */}
      <Dialog open={!!detailRole} onOpenChange={(o) => !o && setDetailRole(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              {ROLE_LABELS[detailRole ?? "none"]} Role
            </DialogTitle>
            <DialogDescription>
              Permissions granted to the {ROLE_LABELS[detailRole ?? "none"]} role.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            {detailRole && (ROLE_PERMISSIONS[detailRole] ?? []).length > 0 ? (
              <div className="grid gap-2">
                {(ROLE_PERMISSIONS[detailRole] ?? []).map((p: CommunityPermissionValue) => (
                  <div
                    key={p}
                    className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted text-sm"
                  >
                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                    {PERMISSION_LABELS[p] ?? p}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No special permissions.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
