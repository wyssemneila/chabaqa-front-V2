"use client"

import { useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { CommunityInvitation, InvitationStatus } from "@/lib/api/community-invitations.api"
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  RefreshCw,
  Ban,
  Trash2,
  Link2,
  Check,
  Clock,
} from "lucide-react"

interface InvitationListProps {
  invitations: CommunityInvitation[]
  loading: boolean
  actionLoadingId?: string | null
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPageChange?: (page: number) => void
  onResend?: (invitation: CommunityInvitation) => void
  onRevoke?: (invitation: CommunityInvitation) => void
  onDelete?: (invitation: CommunityInvitation) => void
}

const STATUS_DOT: Record<InvitationStatus, { label: string; dot: string; text: string }> = {
  pending: { label: "Pending", dot: "bg-amber-500", text: "text-amber-600" },
  accepted: { label: "Accepted", dot: "bg-emerald-500", text: "text-emerald-600" },
  expired: { label: "Expired", dot: "bg-slate-400", text: "text-slate-400" },
  revoked: { label: "Revoked", dot: "bg-rose-500", text: "text-rose-500" },
}

function formatRelativeDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 30) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function isExpiringSoon(inv: CommunityInvitation): boolean {
  if (inv.status !== "pending") return false
  const daysLeft = (new Date(inv.expiresAt).getTime() - Date.now()) / 86400000
  return daysLeft > 0 && daysLeft <= 7
}

function canResend(inv: CommunityInvitation): boolean {
  if (inv.status === "accepted" || inv.status === "revoked") return false
  if (inv.lastResentAt) {
    const elapsed = Date.now() - new Date(inv.lastResentAt).getTime()
    if (elapsed < 24 * 60 * 60 * 1000) return false
  }
  return true
}

/* ── Skeleton rows ──────────────────────────────────────────────────── */
function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-muted animate-pulse shrink-0" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-32 bg-muted animate-pulse rounded" />
                <div className="h-2.5 w-20 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <div className="h-3.5 w-16 bg-muted animate-pulse rounded" />
          </TableCell>
          <TableCell>
            <div className="h-3.5 w-12 bg-muted animate-pulse rounded" />
          </TableCell>
          <TableCell>
            <div className="h-3.5 w-20 bg-muted animate-pulse rounded" />
          </TableCell>
          <TableCell>
            <div className="flex justify-end gap-1">
              <div className="h-7 w-7 bg-muted animate-pulse rounded" />
              <div className="h-7 w-7 bg-muted animate-pulse rounded" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

/* ── Pagination page pills ──────────────────────────────────────────── */
function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | "…")[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pages.push("…")
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push("…")
  pages.push(total)
  return pages
}

export function InvitationList({
  invitations,
  loading,
  actionLoadingId,
  pagination,
  onPageChange,
  onResend,
  onRevoke,
  onDelete,
}: InvitationListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopyLink = useCallback(async (inv: CommunityInvitation) => {
    try {
      await navigator.clipboard.writeText(
        `https://chabaqa.io/invitation/${inv.token}`,
      )
      setCopiedId(inv._id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // silently fail
    }
  }, [])

  if (loading) {
    return (
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <SkeletonRows />
          </TableBody>
        </Table>
      </Card>
    )
  }

  if (!invitations.length) {
    return (
      <Card className="p-10">
        <div className="flex flex-col items-center justify-center text-center">
          <Mail className="w-8 h-8 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold text-base mb-1">No invitations yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Start inviting contacts to grow your community. Import a list or invite them one by one.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sent</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((inv) => {
            const isLoading = actionLoadingId === inv._id
            const statusCfg = STATUS_DOT[inv.status] || STATUS_DOT.pending
            const expiringSoon = isExpiringSoon(inv)

            return (
              <TableRow key={inv._id} className="group">
                {/* Contact */}
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-[11px] font-bold text-white uppercase shrink-0">
                      {(inv.name || inv.email)[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{inv.email}</p>
                      {inv.name && (
                        <p className="text-xs text-muted-foreground truncate">{inv.name}</p>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Status — dot + label */}
                <TableCell>
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} inline-block`} />
                    <span className={`text-sm font-medium ${statusCfg.text}`}>
                      {statusCfg.label}
                    </span>
                  </span>
                  {inv.resendCount > 0 && (
                    <span className="text-xs text-muted-foreground ml-1.5">
                      ×{inv.resendCount + 1}
                    </span>
                  )}
                </TableCell>

                {/* Sent */}
                <TableCell className="text-sm text-muted-foreground">
                  {formatRelativeDate(inv.invitedAt)}
                </TableCell>

                {/* Expires */}
                <TableCell>
                  {inv.status === "accepted" || inv.status === "revoked" ? (
                    <span className="text-sm text-muted-foreground">—</span>
                  ) : expiringSoon ? (
                    <span className="text-sm text-amber-600 font-medium inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(inv.expiresAt)}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {formatDate(inv.expiresAt)}
                    </span>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <TooltipProvider delayDuration={200}>
                    <div className="flex items-center justify-end gap-0.5">
                      {/* Copy link */}
                      {inv.status === "pending" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleCopyLink(inv)}
                            >
                              {copiedId === inv._id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Link2 className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {copiedId === inv._id ? "Copied!" : "Copy invite link"}
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* Resend */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            disabled={isLoading || !canResend(inv)}
                            onClick={() => onResend?.(inv)}
                          >
                            {isLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {canResend(inv) ? "Resend invitation" : "Wait 24h to resend"}
                        </TooltipContent>
                      </Tooltip>

                      {/* Revoke */}
                      {inv.status === "pending" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:text-orange-600"
                              disabled={isLoading}
                              onClick={() => onRevoke?.(inv)}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Revoke invitation</TooltipContent>
                        </Tooltip>
                      )}

                      {/* Delete */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:text-destructive"
                            disabled={isLoading}
                            onClick={() => onDelete?.(inv)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete invitation</TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total}
          </p>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange?.(pagination.page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {getPageNumbers(pagination.page, pagination.totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`ellipsis-${i}`} className="text-xs text-muted-foreground px-1">
                  …
                </span>
              ) : (
                <Button
                  key={p}
                  variant={p === pagination.page ? "default" : "ghost"}
                  size="sm"
                  className="h-7 w-7 p-0 text-xs"
                  onClick={() => onPageChange?.(p)}
                >
                  {p}
                </Button>
              ),
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange?.(pagination.page + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
