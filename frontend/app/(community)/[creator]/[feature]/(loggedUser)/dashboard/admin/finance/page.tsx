"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useDashboard,
  DashboardShell,
  DashboardSection,
  StatCard,
  DashboardLoading,
  DashboardUnauthorized,
  DashboardEmpty,
  DashboardError,
  BackendRequiredPlaceholder,
} from "../../components";
import { CommunityPermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  DollarSign,
  CreditCard,
  Receipt,
  Wallet,
  Calendar,
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  Banknote,
} from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { paymentsApi } from "@/lib/api/payments.api";
import { communityFinanceApi } from "@/lib/api/community-finance.api";

type PayoutStatus = "completed" | "paid" | "pending" | "processing" | "failed" | "cancelled";
const STATUS_CONFIG: Record<PayoutStatus, { color: string; icon: typeof CheckCircle }> = {
  completed: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  paid: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  pending: { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  processing: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: RefreshCw },
  failed: { color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
  cancelled: { color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400", icon: XCircle },
};

const asArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.docs)) return value.docs;
  if (Array.isArray(value?.payouts)) return value.payouts;
  return [];
};
const unwrap = (value: any) => value?.data?.data ?? value?.data ?? value ?? {};
const money = (value: any) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
};
const date = (value?: string) => value ? new Date(value).toLocaleDateString() : "Not available";
const statusKey = (status: any): PayoutStatus => {
  const normalized = String(status || "pending").toLowerCase() as PayoutStatus;
  return STATUS_CONFIG[normalized] ? normalized : "pending";
};

export default function AdminFinancePage() {
  const { role, can, isLoading, canAccessDashboard, getDashboardPath, creatorSlug, communityId } = useDashboard();
  const basePath = getDashboardPath("admin");
  const [tab, setTab] = useState("overview");
  const [loadingFinance, setLoadingFinance] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [balance, setBalance] = useState<any>({});
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionStats, setTransactionStats] = useState<any>({});

  const loadFinance = async () => {
    if (!communityId) return;
    setLoadingFinance(true);
    setError(null);
    try {
      const [payoutResult, statsResult, balanceResult, txResult, txStatsResult] = await Promise.all([
        paymentsApi.getPayouts({ communityId, page: 1, limit: 50 }),
        paymentsApi.getPayoutStats({ communityId }),
        paymentsApi.getAvailableBalance({ communityId }),
        communityFinanceApi.getTransactions(communityId, { page: 1, limit: 50 }),
        communityFinanceApi.getTransactionStats(communityId),
      ]);
      setPayouts(asArray(payoutResult));
      setStats(unwrap(statsResult));
      setBalance(unwrap(balanceResult));
      setTransactions(asArray(txResult?.items ?? txResult));
      setTransactionStats(unwrap(txStatsResult));
    } catch (err: any) {
      setError(err?.message || "Unable to load finance data.");
    } finally {
      setLoadingFinance(false);
    }
  };

  useEffect(() => {
    if (!isLoading && canAccessDashboard("admin") && can(CommunityPermission.FINANCE_VIEW)) {
      loadFinance();
    }
  }, [communityId, isLoading, canAccessDashboard, can]);

  const totals = useMemo(() => {
    const paid = Number(stats.totalPaid ?? stats.paidAmount ?? stats.completedAmount ?? payouts.filter(p => ["paid", "completed"].includes(statusKey(p.status))).reduce((sum, p) => sum + Number(p.amount ?? p.amountDT ?? 0), 0));
    const pending = Number(stats.totalPending ?? stats.pendingAmount ?? payouts.filter(p => statusKey(p.status) === "pending").reduce((sum, p) => sum + Number(p.amount ?? p.amountDT ?? 0), 0));
    const available = Number(balance.availableBalance ?? balance.balance ?? 0);
    const count = Number(stats.totalPayouts ?? stats.count ?? payouts.length);
    return { paid, pending, available, count };
  }, [stats, balance, payouts]);

  if (isLoading) return <DashboardLoading message="Loading finance..." />;
  if (!canAccessDashboard("admin")) {
    return <DashboardUnauthorized role={role} requiredRole="admin" backAction={{ label: "Back", href: `/${creatorSlug}` }} />;
  }

  if (!can(CommunityPermission.FINANCE_VIEW)) {
    return (
      <DashboardShell variant="admin">
        <DashboardUnauthorized role={role} requiredRole="admin with finance.view" backAction={{ label: "Back", href: basePath }} />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell variant="admin">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={basePath}><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Finance</h1>
            <p className="mt-1 text-muted-foreground">Revenue overview, payouts, and transaction history.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button disabled={!totals.available}>
              <Banknote className="mr-2 h-4 w-4" />
              Request Payout
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <DashboardError message={error} retry={loadFinance} />
      ) : (
        <>
          <DashboardSection title="Revenue Overview" description="Live payout stats and available balance" className="mb-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Paid Out" value={money(totals.paid)} description="Completed payouts" icon={DollarSign} isLoading={loadingFinance} />
              <StatCard title="Available Balance" value={money(totals.available)} description={balance.minimumPayoutAmount ? `Minimum ${money(balance.minimumPayoutAmount)}` : "Ready to withdraw"} icon={Wallet} isLoading={loadingFinance} />
              <StatCard title="Pending" value={money(totals.pending)} description="Processing payouts" icon={Clock} isLoading={loadingFinance} />
              <StatCard title="Payouts" value={totals.count} description="Returned by payout API" icon={Receipt} isLoading={loadingFinance} />
            </div>
          </DashboardSection>

          <Tabs value={tab} onValueChange={setTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Transactions</TabsTrigger>
              <TabsTrigger value="payouts">Payouts</TabsTrigger>
              <TabsTrigger value="settings">Payment Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Transaction Ledger</h3>
                <Badge variant="outline">{transactionStats.orderCount ?? transactions.length} orders</Badge>
              </div>
              <Card>
                {loadingFinance ? (
                  <DashboardLoading message="Loading transactions..." />
                ) : transactions.length === 0 ? (
                  <DashboardEmpty title="No transactions yet" description="Paid orders for this community will appear here." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Buyer</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Net</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>{date(tx.date)}</TableCell>
                          <TableCell>{tx.buyerName || tx.buyerEmail || 'Member'}</TableCell>
                          <TableCell className="capitalize">{tx.contentType}</TableCell>
                          <TableCell>{money(tx.amountDT)}</TableCell>
                          <TableCell>{money(tx.creatorNetDT)}</TableCell>
                          <TableCell><Badge variant="outline">{tx.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="payouts" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Payout History</h3>
                <Button variant="outline" size="sm" onClick={loadFinance} disabled={loadingFinance}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>

              <Card>
                {loadingFinance ? (
                  <DashboardLoading message="Loading payouts..." />
                ) : payouts.length === 0 ? (
                  <DashboardEmpty title="No payouts found" description="No payouts were returned for this community." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payout ID</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map(payout => {
                        const status = statusKey(payout.status);
                        const StatusIcon = STATUS_CONFIG[status].icon;
                        return (
                          <TableRow key={payout._id || payout.id || payout.reference}>
                            <TableCell className="font-mono text-sm">{payout.reference || payout._id || payout.id}</TableCell>
                            <TableCell className="capitalize">{String(payout.method || "not configured").replace(/_/g, " ")}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={STATUS_CONFIG[status].color}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{date(payout.processedAt || payout.requestedAt || payout.createdAt)}</TableCell>
                            <TableCell className="text-right font-mono font-medium">{money(payout.amount ?? payout.amountDT)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <DashboardSection title="Payment Configuration" description="Configured payout methods and schedules">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payout Method
                      </CardTitle>
                      <CardDescription>No fake bank details are shown.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Connect or manage payout methods from the backend-supported payout settings flow.</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Payout Schedule
                      </CardTitle>
                      <CardDescription>Returned by payout configuration</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">No schedule endpoint is currently exposed to this dashboard.</p>
                    </CardContent>
                  </Card>
                </div>
              </DashboardSection>
            </TabsContent>
          </Tabs>
        </>
      )}
    </DashboardShell>
  );
}
