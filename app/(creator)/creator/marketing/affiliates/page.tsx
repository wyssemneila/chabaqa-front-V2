"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Users, Link2, Wallet, TrendingUp, RefreshCw, Plus, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { affiliateApi, communitiesApi, coursesApi, challengesApi, eventsApi, productsApi, sessionsApi } from "@/lib/api"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { useCommunityGuard } from "@/hooks/use-community-guard"
import { PageShell } from "@/components/creator-dashboard"
import { useAuthContext } from "@/app/providers/auth-provider"
import { StatusChip } from "./components/status-chip"
import { AffiliateLinkBuilder, type AffiliateTargetType, type PartnerOption, type TargetOption } from "./components/affiliate-link-builder"

type ProgramForm = {
  scopeType: 'community' | 'creator' | 'content'
  commissionPercent: string
  cookieWindowDays: string
  holdDays: string
}

const extractArray = <T,>(value: any): T[] => {
  if (Array.isArray(value)) return value as T[]
  if (Array.isArray(value?.data)) return value.data as T[]
  if (Array.isArray(value?.items)) return value.items as T[]
  if (Array.isArray(value?.campaigns)) return value.campaigns as T[]
  return []
}

const firstId = (item: any): string => String(item?._id || item?.id || "")
const isMongoObjectId = (value?: string | null): boolean => Boolean(value && /^[a-f\d]{24}$/i.test(value))

export default function CreatorAffiliatesPage() {
  const { guard, selectedCommunity, selectedCommunityId } = useCommunityGuard()
  const { user: authUser } = useAuthContext()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [programs, setPrograms] = useState<any[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [links, setLinks] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [payouts, setPayouts] = useState<any[]>([])

  const [programForm, setProgramForm] = useState<ProgramForm>({
    scopeType: 'community',
    commissionPercent: '15',
    cookieWindowDays: '30',
    holdDays: '14',
  })

  const [inviteProgramId, setInviteProgramId] = useState<string>("")
  const [inviteUserId, setInviteUserId] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")

  const [targetsByType, setTargetsByType] = useState<Record<AffiliateTargetType, TargetOption[]>>({
    community: [],
    course: [],
    product: [],
    event: [],
    challenge: [],
    session: [],
  })

  const [linkProgramId, setLinkProgramId] = useState<string>("")
  const [lastLinkCode, setLastLinkCode] = useState<string | undefined>(undefined)
  const [busy, setBusy] = useState<string | null>(null)

  const canReviewPayouts = useMemo(() => {
    const role = String(authUser?.role || "").toLowerCase().trim()
    return role === "admin" || role === "superadmin" || role.includes("admin")
  }, [authUser?.role])

  const loadTargets = useCallback(async () => {
    const [communitiesRes, coursesRes, productsRes, eventsRes, challengesRes, sessionsRes] = await Promise.all([
      communitiesApi.getMyCreated().catch(() => []),
      selectedCommunity?.slug ? coursesApi.getByCommunity(selectedCommunity.slug, { page: 1, limit: 100 }) : Promise.resolve([]),
      selectedCommunityId ? productsApi.getByCommunity(selectedCommunityId) : Promise.resolve([]),
      eventsApi.getAll({ communityId: selectedCommunityId || undefined, page: 1, limit: 100 }).catch(() => []),
      selectedCommunity?.slug ? challengesApi.getByCommunity(selectedCommunity.slug) : Promise.resolve([]),
      sessionsApi.getByCreator('me', { page: 1, limit: 100 }).catch(() => []),
    ])

    const communities = extractArray<any>(communitiesRes).map((item) => {
      const id = firstId(item)
      const slug = String(item?.slug || '')
      return {
        id,
        label: String(item?.name || item?.title || `Community ${id}`),
        path: slug ? `/en/community/${slug}` : `/en/community/${id}`,
      }
    })

    const courses = extractArray<any>(coursesRes).map((item) => {
      const id = firstId(item)
      const creatorName = String(item?.creator?.name || item?.creatorName || 'creator')
      return {
        id,
        label: String(item?.title || item?.titre || `Course ${id}`),
        path: `/en/${encodeURIComponent(creatorName)}/courses/${id}`,
      }
    })

    const products = extractArray<any>(productsRes).map((item) => {
      const id = firstId(item)
      const creatorName = String(item?.creator?.name || item?.creatorName || 'creator')
      return {
        id,
        label: String(item?.title || item?.name || `Product ${id}`),
        path: `/en/${encodeURIComponent(creatorName)}/products/${id}`,
      }
    })

    const events = extractArray<any>(eventsRes).map((item) => {
      const id = firstId(item)
      const creatorName = String(item?.creator?.name || item?.creatorName || 'creator')
      return {
        id,
        label: String(item?.title || item?.name || `Event ${id}`),
        path: `/en/${encodeURIComponent(creatorName)}/events/${id}`,
      }
    })

    const challenges = extractArray<any>(challengesRes).map((item) => {
      const id = firstId(item)
      const creatorName = String(item?.creator?.name || item?.creatorName || 'creator')
      return {
        id,
        label: String(item?.title || item?.name || `Challenge ${id}`),
        path: `/en/${encodeURIComponent(creatorName)}/challenges/${id}`,
      }
    })

    const sessions = extractArray<any>(sessionsRes).map((item) => {
      const id = firstId(item)
      const creatorName = String(item?.creator?.name || item?.creatorName || 'creator')
      return {
        id,
        label: String(item?.title || item?.name || `Session ${id}`),
        path: `/en/${encodeURIComponent(creatorName)}/sessions/${id}`,
      }
    })

    setTargetsByType({
      community: communities,
      course: courses,
      product: products,
      event: events,
      challenge: challenges,
      session: sessions,
    })
  }, [selectedCommunity?.slug, selectedCommunityId])

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [programsRes, partnersRes, statsRes, linksRes] = await Promise.all([
        affiliateApi.creator.listPrograms(),
        affiliateApi.creator.listPartners(),
        affiliateApi.creator.listStats(),
        affiliateApi.affiliate.myLinks(),
      ])

      setPrograms(programsRes || [])
      setPartners(partnersRes || [])
      setStats(statsRes)
      setLinks(linksRes || [])

      if (canReviewPayouts) {
        try {
          const payoutRes = await affiliateApi.admin.listPayouts('pending')
          setPayouts(payoutRes || [])
        } catch {
          setPayouts([])
        }
      } else {
        setPayouts([])
      }

      await loadTargets()
    } catch (error: any) {
      toast({ title: 'Failed to load affiliate data', description: error?.message || 'Please try again.', variant: 'destructive' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [canReviewPayouts, loadTargets, toast])

  useEffect(() => {
    void load()
  }, [load])

  const partnerOptions = useMemo<PartnerOption[]>(() => {
    return partners
      .filter((partner) => String(partner?.status || '').toLowerCase() === 'approved')
      .map((partner) => {
        const user = partner?.partnerUserId || {}
        const id = String(user?._id || user?.id || partner?.partnerUserId || '')
        const label = String(user?.name || user?.email || id)
        return { id, label }
      })
      .filter((partner) => partner.id)
  }, [partners])

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'https://chabaqa.io')

  const submitProgram = async () => {
    const commission = Number(programForm.commissionPercent)
    const cookieWindowDays = Number(programForm.cookieWindowDays)
    const holdDays = Number(programForm.holdDays)

    if (!Number.isFinite(commission) || commission < 0 || commission > 100) {
      toast({ title: 'Invalid commission', description: 'Commission must be between 0 and 100.', variant: 'destructive' })
      return
    }

    setBusy('create-program')
    try {
      await affiliateApi.creator.createProgram({
        scopeType: programForm.scopeType,
        communityId: programForm.scopeType === 'community' ? selectedCommunityId || undefined : undefined,
        commissionPercent: commission,
        cookieWindowDays,
        holdDays,
      })
      toast({ title: 'Program created', description: 'Your affiliate program is ready.' })
      await load(true)
    } catch (error: any) {
      toast({ title: 'Create failed', description: error?.message || 'Could not create program.', variant: 'destructive' })
    } finally {
      setBusy(null)
    }
  }

  const invitePartner = async () => {
    if (!inviteProgramId) {
      toast({ title: 'Program required', description: 'Select a program first.', variant: 'destructive' })
      return
    }
    if (!inviteUserId && !inviteEmail) {
      toast({ title: 'Partner required', description: 'Provide userId or email.', variant: 'destructive' })
      return
    }

    setBusy('invite-partner')
    try {
      await affiliateApi.creator.invitePartner(inviteProgramId, {
        userId: inviteUserId || undefined,
        email: inviteEmail || undefined,
      })
      setInviteUserId('')
      setInviteEmail('')
      toast({ title: 'Invitation sent', description: 'Partner was added as pending.' })
      await load(true)
    } catch (error: any) {
      toast({ title: 'Invite failed', description: error?.message || 'Unable to invite partner.', variant: 'destructive' })
    } finally {
      setBusy(null)
    }
  }

  const toggleProgramStatus = async (program: any, enabled: boolean) => {
    const status = enabled ? 'active' : 'paused'
    setBusy(`program-${program._id}`)
    try {
      await affiliateApi.creator.updateProgram(program._id, { status })
      await load(true)
    } catch (error: any) {
      toast({ title: 'Update failed', description: error?.message || 'Could not update program.', variant: 'destructive' })
    } finally {
      setBusy(null)
    }
  }

  const updatePartner = async (partnerId: string, status: 'approved' | 'rejected' | 'paused') => {
    setBusy(`partner-${partnerId}`)
    try {
      await affiliateApi.creator.updatePartnerStatus(partnerId, status)
      await load(true)
    } catch (error: any) {
      toast({ title: 'Partner update failed', description: error?.message || 'Try again.', variant: 'destructive' })
    } finally {
      setBusy(null)
    }
  }

  const createLink = async (payload: { partnerUserId?: string; targetType: AffiliateTargetType; targetId: string; targetPath: string }) => {
    if (!linkProgramId) {
      toast({ title: 'Select a program', description: 'Program is required for link generation.', variant: 'destructive' })
      return
    }

    setBusy('create-link')
    try {
      const link = await affiliateApi.creator.createLink({
        programId: linkProgramId,
        partnerUserId: payload.partnerUserId,
        targetPath: payload.targetPath,
        targetContentType: payload.targetType,
        targetContentId: payload.targetId,
        communityId: isMongoObjectId(selectedCommunityId) ? selectedCommunityId! : undefined,
      })
      setLastLinkCode(link?.code)
      toast({ title: 'Link generated', description: 'Share it with your affiliate partner.' })
      await load(true)
    } catch (error: any) {
      toast({ title: 'Link creation failed', description: error?.message || 'Could not create link.', variant: 'destructive' })
    } finally {
      setBusy(null)
    }
  }

  const copyFullAffiliateLink = async (code: string) => {
    const fullLink = `${baseUrl.replace(/\/$/, "")}/r/${code}`
    try {
      await navigator.clipboard.writeText(fullLink)
      toast({ title: 'Link copied', description: 'Full affiliate link copied to clipboard.' })
    } catch {
      toast({ title: 'Copy failed', description: 'Unable to copy link. Please try again.', variant: 'destructive' })
    }
  }

  const approvePayout = async (payoutId: string) => {
    setBusy(`approve-${payoutId}`)
    try {
      await affiliateApi.admin.approvePayout(payoutId)
      toast({ title: 'Payout approved' })
      await load(true)
    } catch (error: any) {
      toast({ title: 'Approval failed', description: error?.message || 'Could not approve payout.', variant: 'destructive' })
    } finally {
      setBusy(null)
    }
  }

  const markPayoutPaid = async (payoutId: string) => {
    setBusy(`paid-${payoutId}`)
    try {
      await affiliateApi.admin.markPaid(payoutId)
      toast({ title: 'Marked paid' })
      await load(true)
    } catch (error: any) {
      toast({ title: 'Update failed', description: error?.message || 'Could not mark payout as paid.', variant: 'destructive' })
    } finally {
      setBusy(null)
    }
  }

  const summary = useMemo(() => {
    return {
      clicks: Number(stats?.clicks || 0),
      conversions: Number(stats?.conversions || 0),
      revenue: Number(stats?.totalRevenueDT || 0),
      commission: Number(stats?.totalCommissionDT || 0),
    }
  }, [stats])

  const renderSkeleton = (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-56 w-full" />
    </div>
  )

  if (guard) return guard

  return (
    <PageShell className="container mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Affiliate Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build referral programs, approve partners, and track commissions under hold and payout rules.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setRefreshing(true)
            void load(true)
          }}
          disabled={refreshing}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Clicks</p>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-semibold mt-2">{summary.clicks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Conversions</p>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-semibold mt-2">{summary.conversions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Revenue</p>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-semibold mt-2">{summary.revenue.toFixed(2)} DT</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Commission</p>
              <Link2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-semibold mt-2">{summary.commission.toFixed(2)} DT</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="programs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="space-y-4">
          {loading ? renderSkeleton : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Create Program</CardTitle>
                  <CardDescription>Set your commission, hold period, and cookie window.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-5">
                  <div className="space-y-2">
                    <Label>Scope</Label>
                    <Select value={programForm.scopeType} onValueChange={(value) => setProgramForm((prev) => ({ ...prev, scopeType: value as any }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="community">Community</SelectItem>
                        <SelectItem value="creator">Creator</SelectItem>
                        <SelectItem value="content">Content</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Commission %</Label>
                    <Input value={programForm.commissionPercent} onChange={(e) => setProgramForm((prev) => ({ ...prev, commissionPercent: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cookie days</Label>
                    <Input value={programForm.cookieWindowDays} onChange={(e) => setProgramForm((prev) => ({ ...prev, cookieWindowDays: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hold days</Label>
                    <Input value={programForm.holdDays} onChange={(e) => setProgramForm((prev) => ({ ...prev, holdDays: e.target.value }))} />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full" onClick={submitProgram} disabled={busy === 'create-program'}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                {programs.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-sm text-muted-foreground">No affiliate programs yet.</CardContent>
                  </Card>
                ) : programs.map((program) => (
                  <Card key={program._id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{String(program.scopeType || 'program').toUpperCase()} Program</CardTitle>
                        <StatusChip status={program.status} />
                      </div>
                      <CardDescription>
                        {Number(program.commissionPercent || 0)}% commission • {Number(program.holdDays || 0)} hold days • {Number(program.cookieWindowDays || 0)} cookie days
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Active program visibility and click attribution.</span>
                      <Switch
                        checked={String(program.status || '').toLowerCase() === 'active'}
                        onCheckedChange={(checked) => void toggleProgramStatus(program, checked)}
                        disabled={busy === `program-${program._id}`}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="partners" className="space-y-4">
          {loading ? renderSkeleton : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Invite Partner</CardTitle>
                  <CardDescription>Invite by user ID or email. They start as pending.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Program</Label>
                    <Select value={inviteProgramId} onValueChange={setInviteProgramId}>
                      <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                      <SelectContent>
                        {programs.map((program) => (
                          <SelectItem key={program._id} value={String(program._id)}>
                            {String(program.scopeType)} • {Number(program.commissionPercent)}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>User ID</Label>
                    <Input value={inviteUserId} onChange={(event) => setInviteUserId(event.target.value)} placeholder="Optional" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="Optional" />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full" onClick={invitePartner} disabled={busy === 'invite-partner'}>Invite</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Partners</CardTitle>
                  <CardDescription>Approve, pause, or reject affiliates per program.</CardDescription>
                </CardHeader>
                <CardContent>
                  {partners.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No partners yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Partner</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Program</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {partners.map((partner) => {
                          const partnerUser = partner?.partnerUserId || {}
                          const partnerName = String(partnerUser?.name || partnerUser?.email || partnerUser || 'Unknown')
                          return (
                            <TableRow key={partner._id}>
                              <TableCell>{partnerName}</TableCell>
                              <TableCell><StatusChip status={partner.status} /></TableCell>
                              <TableCell className="text-xs text-muted-foreground">{String(partner.programId || '').slice(-8)}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => void updatePartner(partner._id, 'approved')} disabled={busy === `partner-${partner._id}`}>Approve</Button>
                                  <Button size="sm" variant="outline" onClick={() => void updatePartner(partner._id, 'paused')} disabled={busy === `partner-${partner._id}`}>Pause</Button>
                                  <Button size="sm" variant="destructive" onClick={() => void updatePartner(partner._id, 'rejected')} disabled={busy === `partner-${partner._id}`}>Reject</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="links" className="space-y-4">
          {loading ? renderSkeleton : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Program Selection</CardTitle>
                  <CardDescription>Select a program before generating referral links.</CardDescription>
                </CardHeader>
                <CardContent className="max-w-sm">
                  <Select value={linkProgramId} onValueChange={setLinkProgramId}>
                    <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                    <SelectContent>
                      {programs.map((program) => (
                        <SelectItem key={program._id} value={String(program._id)}>
                          {String(program.scopeType)} • {Number(program.commissionPercent)}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <AffiliateLinkBuilder
                partners={partnerOptions}
                targetsByType={targetsByType}
                onSubmit={createLink}
                createdCode={lastLinkCode}
                loading={busy === 'create-link'}
                baseUrl={baseUrl}
              />

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Links</CardTitle>
                  <CardDescription>Most recently created affiliate links.</CardDescription>
                </CardHeader>
                <CardContent>
                  {links.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No links generated yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Full link</TableHead>
                          <TableHead>Target</TableHead>
                          <TableHead>Partner</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {links.slice(0, 10).map((link) => (
                          <TableRow key={link._id}>
                            <TableCell className="font-medium">{link.code}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[320px] truncate">
                              {`${baseUrl.replace(/\/$/, "")}/r/${link.code}`}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{link.targetPath}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{String(link.partnerUserId || '').slice(-8)}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void copyFullAffiliateLink(link.code)}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy full link
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          {loading ? renderSkeleton : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payout Reviews</CardTitle>
                <CardDescription>
                  Manual payout processing with hold checks. This tab is visible only if your account can access admin payout endpoints.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!canReviewPayouts ? (
                  <p className="text-sm text-muted-foreground">Payout review is admin-only for your current role.</p>
                ) : payouts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending payout requests.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((payout) => (
                        <TableRow key={payout._id}>
                          <TableCell>{payout.reference}</TableCell>
                          <TableCell>{Number(payout.amountDT || 0).toFixed(2)} {payout.currency || 'TND'}</TableCell>
                          <TableCell>{String(payout.method || '-')}</TableCell>
                          <TableCell><StatusChip status={payout.status} /></TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => void approvePayout(payout._id)} disabled={busy === `approve-${payout._id}`}>Approve</Button>
                              <Button size="sm" onClick={() => void markPayoutPaid(payout._id)} disabled={busy === `paid-${payout._id}`}>Mark paid</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {loading ? renderSkeleton : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Partners</CardTitle>
                  <CardDescription>By generated commission.</CardDescription>
                </CardHeader>
                <CardContent>
                  {(stats?.topPartners || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No partner performance data yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Partner</TableHead>
                          <TableHead>Conversions</TableHead>
                          <TableHead>Commission</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(stats?.topPartners || []).map((partner: any) => (
                          <TableRow key={String(partner.partnerUserId)}>
                            <TableCell>{String(partner.name || partner.email || partner.partnerUserId)}</TableCell>
                            <TableCell>{Number(partner.conversions || 0)}</TableCell>
                            <TableCell>{Number(partner.commissionDT || 0).toFixed(2)} DT</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}
