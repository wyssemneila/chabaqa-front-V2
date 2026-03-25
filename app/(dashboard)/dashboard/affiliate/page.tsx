"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { affiliateApi } from "@/lib/api"
import { StatusChip } from "@/app/(creator)/creator/marketing/affiliates/components/status-chip"
import { PayoutRequestForm } from "@/app/(creator)/creator/marketing/affiliates/components/payout-request-form"

type ProgramLink = {
  partner: any
  program: any
}

export default function AffiliatePortalPage() {
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [submittingPayout, setSubmittingPayout] = useState(false)

  const [balance, setBalance] = useState<any>(null)
  const [programs, setPrograms] = useState<ProgramLink[]>([])
  const [links, setLinks] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [payouts, setPayouts] = useState<any[]>([])

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [balanceRes, programsRes, linksRes, statsRes, payoutsRes] = await Promise.all([
        affiliateApi.affiliate.myBalance(),
        affiliateApi.affiliate.myPrograms(),
        affiliateApi.affiliate.myLinks(),
        affiliateApi.affiliate.myStats(),
        affiliateApi.affiliate.myPayouts(),
      ])

      setBalance(balanceRes)
      setPrograms(programsRes || [])
      setLinks(linksRes || [])
      setStats(statsRes)
      setPayouts(payoutsRes || [])
    } catch (error: any) {
      toast({ title: 'Failed to load affiliate portal', description: error?.message || 'Please refresh.', variant: 'destructive' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [toast])

  useEffect(() => {
    void load()
  }, [load])

  const conversionRows = useMemo(() => {
    const map = stats?.conversions || {}
    return ['pending', 'approved', 'paid', 'reversed'].map((status) => ({
      status,
      count: Number(map?.[status]?.count || 0),
      totalDT: Number(map?.[status]?.totalDT || 0),
    }))
  }, [stats])

  const minPayout = Number(process.env.NEXT_PUBLIC_AFFILIATE_MIN_PAYOUT_DT || 50)
  const approvedBalance = Number(balance?.approvedBalanceDT || 0)

  const submitPayout = async (payload: { amountDT: number; method: 'bank_transfer' | 'paypal' | 'stripe'; metadata: Record<string, any> }) => {
    setSubmittingPayout(true)
    try {
      await affiliateApi.affiliate.requestPayout(payload)
      toast({ title: 'Payout requested', description: 'Your request is now pending review.' })
      await load(true)
    } catch (error: any) {
      toast({ title: 'Request failed', description: error?.message || 'Could not request payout.', variant: 'destructive' })
    } finally {
      setSubmittingPayout(false)
    }
  }

  const renderSkeleton = (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Affiliate Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your links, conversions, and payouts. Pending commissions unlock after the hold period.
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="mt-2 text-2xl font-semibold">{Number(balance?.pendingDT || 0).toFixed(2)} DT</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="mt-2 text-2xl font-semibold">{Number(balance?.approvedBalanceDT || 0).toFixed(2)} DT</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Paid</p>
            <p className="mt-2 text-2xl font-semibold">{Number(balance?.paidDT || 0).toFixed(2)} DT</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {loading ? renderSkeleton : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Approved Programs</CardTitle>
                <CardDescription>Programs where you are currently approved as an affiliate partner.</CardDescription>
              </CardHeader>
              <CardContent>
                {programs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No approved programs yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Program</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Cookie Window</TableHead>
                        <TableHead>Hold</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {programs.map((item: any, index) => (
                        <TableRow key={String(item?.partner?._id || index)}>
                          <TableCell className="font-medium">{String(item?.program?.scopeType || 'program')}</TableCell>
                          <TableCell>{Number(item?.program?.commissionPercent || 0)}%</TableCell>
                          <TableCell>{Number(item?.program?.cookieWindowDays || 0)} days</TableCell>
                          <TableCell>{Number(item?.program?.holdDays || 0)} days</TableCell>
                          <TableCell><StatusChip status={item?.partner?.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="links">
          {loading ? renderSkeleton : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">My Links</CardTitle>
                <CardDescription>Share these links. Attribution is last-click with cookie window validation.</CardDescription>
              </CardHeader>
              <CardContent>
                {links.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No links yet. Ask a creator to approve you and create links.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {links.map((link) => (
                        <TableRow key={link._id}>
                          <TableCell className="font-medium">{link.code}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{link.targetPath}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{link.createdAt ? new Date(link.createdAt).toLocaleString() : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="conversions">
          {loading ? renderSkeleton : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Conversions</CardTitle>
                <CardDescription>Status summary of your commission ledger entries.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversionRows.map((row) => (
                      <TableRow key={row.status}>
                        <TableCell><StatusChip status={row.status} /></TableCell>
                        <TableCell>{row.count}</TableCell>
                        <TableCell>{row.totalDT.toFixed(2)} DT</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          {loading ? renderSkeleton : (
            <>
              <PayoutRequestForm
                minAmount={minPayout}
                maxAmount={approvedBalance}
                loading={submittingPayout}
                onSubmit={submitPayout}
              />

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Payout History</CardTitle>
                  <CardDescription>Manual processing today, Stripe Connect automation can be enabled later.</CardDescription>
                </CardHeader>
                <CardContent>
                  {payouts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No payout requests yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Reference</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Requested</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payouts.map((payout) => (
                          <TableRow key={payout._id}>
                            <TableCell>{payout.reference}</TableCell>
                            <TableCell>{Number(payout.amountDT || 0).toFixed(2)} {payout.currency || 'TND'}</TableCell>
                            <TableCell>{String(payout.method || '-')}</TableCell>
                            <TableCell><StatusChip status={payout.status} /></TableCell>
                            <TableCell>{payout.requestedAt ? new Date(payout.requestedAt).toLocaleDateString() : '-'}</TableCell>
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
    </div>
  )
}
