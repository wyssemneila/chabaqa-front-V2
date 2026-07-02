'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import { useCreatorCommunity } from '@/app/(creator)/creator/context/creator-community-context'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import { communityInvitationsApi, type InvitationStatus } from '@/lib/api/community-invitations.api'
import { communitiesApi } from '@/lib/api/communities.api'
import { ImportContactsDialog } from '@/app/(creator)/creator/marketing/contacts/components/import-contacts-dialog'
import { SingleInviteDialog } from '@/app/(creator)/creator/marketing/contacts/components/single-invite-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Copy, Loader2, Mail, MoreVertical, RefreshCw, Send, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

const STATUS_COLORS: Record<InvitationStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-green-100 text-green-800',
  expired: 'bg-gray-100 text-gray-800',
  revoked: 'bg-red-100 text-red-800',
}

export default function MarketingContactsPage() {
  const { lang } = useDashPrefs()
  const { selectedCommunityId, selectedCommunity, isLoading: communityLoading } = useCreatorCommunity()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<'all' | InvitationStatus>('all')
  const [page, setPage] = useState(1)
  const [importOpen, setImportOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['creator-invitation-stats', selectedCommunityId],
    queryFn: () => communityInvitationsApi.getStats(selectedCommunityId!),
    enabled: Boolean(selectedCommunityId),
  })

  const { data: invitationsData, isLoading: invitationsLoading, refetch } = useQuery({
    queryKey: ['creator-invitations', selectedCommunityId, statusFilter, page],
    queryFn: () =>
      communityInvitationsApi.getInvitations(selectedCommunityId!, {
        page,
        limit: 10,
        status: statusFilter,
      }),
    enabled: Boolean(selectedCommunityId),
  })

  const { data: inviteLinkData } = useQuery({
    queryKey: ['creator-invite-link', selectedCommunityId],
    queryFn: () => communitiesApi.generateInviteLink(selectedCommunityId!, false),
    enabled: Boolean(selectedCommunityId),
  })

  const resendMutation = useMutation({
    mutationFn: (invitationId: string) => communityInvitationsApi.resendInvitation(invitationId),
    onSuccess: () => {
      toast.success('Invitation resent')
      void queryClient.invalidateQueries({ queryKey: ['creator-invitations', selectedCommunityId] })
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to resend invitation'),
  })

  const revokeMutation = useMutation({
    mutationFn: (invitationId: string) => communityInvitationsApi.revokeInvitation(invitationId),
    onSuccess: () => {
      toast.success('Invitation revoked')
      void queryClient.invalidateQueries({ queryKey: ['creator-invitations', selectedCommunityId] })
      void queryClient.invalidateQueries({ queryKey: ['creator-invitation-stats', selectedCommunityId] })
    },
    onError: (error: any) => toast.error(error?.message || 'Failed to revoke invitation'),
  })

  const invitations = invitationsData?.invitations || []
  const totalPages = invitationsData?.totalPages || 1
  const communityName = selectedCommunity?.name || selectedCommunity?.nom || 'your community'

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['creator-invitations', selectedCommunityId] })
    void queryClient.invalidateQueries({ queryKey: ['creator-invitation-stats', selectedCommunityId] })
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <DashSidebar />
      <div className="md:ml-[220px] flex-1 flex min-h-screen flex-col">
        <DashTopbar
          title={lang === 'ar' ? 'جهات الاتصال' : 'Marketing Contacts'}
          subtitle={lang === 'ar' ? 'دعوات الأعضاء واستيراد جهات الاتصال' : 'Member invitations and contact imports'}
        />
        <main id="main-content" className="p-7 flex-1 space-y-6 max-w-6xl">
          {!selectedCommunityId && !communityLoading ? (
            <Card>
              <CardHeader>
                <CardTitle>Select a community</CardTitle>
                <CardDescription>Choose a community from the sidebar context to manage invitations.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Total', value: stats?.total ?? 0 },
                  { label: 'Pending', value: stats?.pending ?? 0 },
                  { label: 'Accepted', value: stats?.accepted ?? 0 },
                  { label: 'Expired', value: stats?.expired ?? 0 },
                ].map((item) => (
                  <Card key={item.label}>
                    <CardContent className="pt-6">
                      <p className="text-2xl font-bold">{statsLoading ? '—' : item.value}</p>
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle>Invite members to {communityName}</CardTitle>
                    <CardDescription>Import contacts or send single invitations through the live invitations API.</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => void refetch()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setInviteOpen(true)}>
                      <Send className="h-4 w-4 mr-2" />
                      Single invite
                    </Button>
                    <Button type="button" onClick={() => setImportOpen(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Import contacts
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {inviteLinkData?.inviteLink ? (
                    <div className="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Community invite link</p>
                        <p className="truncate text-xs text-muted-foreground">{inviteLinkData.inviteLink}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          void navigator.clipboard.writeText(inviteLinkData.inviteLink)
                          toast.success('Invite link copied')
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy link
                      </Button>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-3">
                    <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value as typeof statusFilter); setPage(1) }}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="revoked">Revoked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {invitationsLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : invitations.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                      No invitations yet. Import contacts or send a single invite to get started.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Sent</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invitations.map((invitation: any) => (
                          <TableRow key={invitation._id || invitation.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{invitation.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={STATUS_COLORS[invitation.status as InvitationStatus] || ''}>
                                {invitation.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {invitation.createdAt ? new Date(invitation.createdAt).toLocaleDateString() : '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button type="button" variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {invitation.status === 'pending' ? (
                                    <DropdownMenuItem onClick={() => resendMutation.mutate(invitation._id || invitation.id)}>
                                      Resend
                                    </DropdownMenuItem>
                                  ) : null}
                                  {invitation.status === 'pending' ? (
                                    <DropdownMenuItem onClick={() => revokeMutation.mutate(invitation._id || invitation.id)}>
                                      Revoke
                                    </DropdownMenuItem>
                                  ) : null}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  {totalPages > 1 ? (
                    <div className="flex items-center justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                      <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                        Next
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>

      {selectedCommunityId ? (
        <>
          <ImportContactsDialog
            open={importOpen}
            onOpenChange={setImportOpen}
            communityId={selectedCommunityId}
            onSuccess={invalidateAll}
          />
          <SingleInviteDialog
            open={inviteOpen}
            onOpenChange={setInviteOpen}
            communityId={selectedCommunityId}
            onSuccess={invalidateAll}
          />
        </>
      ) : null}
    </div>
  )
}
