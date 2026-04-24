"use client";

import { useState } from "react";
import {
  useDashboard,
  DashboardShell,
  DashboardSection,
  StatCard,
  ActionCard,
  DashboardLoading,
  DashboardUnauthorized,
  DashboardEmpty,
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
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  Filter,
  MoreVertical,
  Eye,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock financial data
const MOCK_TRANSACTIONS = [
  { id: "1", type: "sale", description: "Course: Advanced Photography", amount: 99, status: "completed", date: "2026-03-20" },
  { id: "2", type: "sale", description: "Membership: Pro Plan", amount: 29, status: "completed", date: "2026-03-19" },
  { id: "3", type: "payout", description: "Monthly Payout", amount: -450, status: "pending", date: "2026-03-18" },
  { id: "4", type: "refund", description: "Course Refund", amount: -49, status: "completed", date: "2026-03-17" },
  { id: "5", type: "sale", description: "Event: Live Workshop", amount: 149, status: "completed", date: "2026-03-16" },
  { id: "6", type: "sale", description: "Course: Beginner Photography", amount: 49, status: "completed", date: "2026-03-15" },
];

const MOCK_PAYOUTS = [
  { id: "1", amount: 1250, status: "completed", method: "Bank Transfer", date: "2026-03-01" },
  { id: "2", amount: 980, status: "completed", method: "Bank Transfer", date: "2026-02-01" },
  { id: "3", amount: 450, status: "pending", method: "Bank Transfer", date: "2026-03-18" },
];

type TransactionStatus = "completed" | "pending" | "failed";
const STATUS_CONFIG: Record<TransactionStatus, { color: string; icon: typeof CheckCircle }> = {
  completed: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  pending: { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  failed: { color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

export default function AdminFinancePage() {
  const { role, can, isLoading, canAccessDashboard, getDashboardPath, creatorSlug } = useDashboard();
  const basePath = getDashboardPath("admin");
  const [tab, setTab] = useState("overview");

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
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button>
              <Banknote className="mr-2 h-4 w-4" />
              Request Payout
            </Button>
          </div>
        </div>
      </div>

      {/* Revenue Stats */}
      <DashboardSection title="Revenue Overview" description="Financial performance this month" className="mb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Revenue" value="$12,847" description="This month" icon={DollarSign} trend={{ value: 23 }} />
          <StatCard title="Available Balance" value="$3,450" description="Ready to withdraw" icon={Wallet} />
          <StatCard title="Pending" value="$890" description="Processing" icon={Clock} />
          <StatCard title="Total Sales" value="156" description="Transactions" icon={Receipt} trend={{ value: 12 }} />
        </div>
      </DashboardSection>

      {/* Finance Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Transactions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="settings">Payment Settings</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_TRANSACTIONS.map(tx => {
                  const StatusIcon = STATUS_CONFIG[tx.status as TransactionStatus].icon;
                  const isNegative = tx.amount < 0;
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{tx.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{tx.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={STATUS_CONFIG[tx.status as TransactionStatus].color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{tx.date}</TableCell>
                      <TableCell className={`text-right font-mono font-medium ${isNegative ? "text-red-600" : "text-green-600"}`}>
                        {isNegative ? "" : "+"}${Math.abs(tx.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                            <DropdownMenuItem><Receipt className="mr-2 h-4 w-4" />Download Receipt</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Payouts Tab */}
        <TabsContent value="payouts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Payout History</h3>
            <Button>
              <Banknote className="mr-2 h-4 w-4" />
              Request Payout
            </Button>
          </div>

          <Card>
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
                {MOCK_PAYOUTS.map(payout => {
                  const StatusIcon = STATUS_CONFIG[payout.status as TransactionStatus].icon;
                  return (
                    <TableRow key={payout.id}>
                      <TableCell className="font-mono text-sm">PAY-{payout.id.padStart(6, "0")}</TableCell>
                      <TableCell>{payout.method}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={STATUS_CONFIG[payout.status as TransactionStatus].color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {payout.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{payout.date}</TableCell>
                      <TableCell className="text-right font-mono font-medium">${payout.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Payment Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <DashboardSection title="Payment Configuration" description="Manage payout methods and thresholds">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payout Method
                  </CardTitle>
                  <CardDescription>Bank account connected</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">**** **** **** 4242</p>
                  <Button variant="outline" size="sm">Change Method</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Payout Schedule
                  </CardTitle>
                  <CardDescription>When you receive payouts</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Monthly (1st of each month)</p>
                  <Button variant="outline" size="sm">Change Schedule</Button>
                </CardContent>
              </Card>
            </div>
          </DashboardSection>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
