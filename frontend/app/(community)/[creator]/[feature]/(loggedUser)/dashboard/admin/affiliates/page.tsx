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
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Users,
  Link2,
  BarChart3,
  DollarSign,
  Plus,
  Search,
  Copy,
  ExternalLink,
  TrendingUp,
  Percent,
  ShoppingCart,
  UserPlus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

// Mock affiliate data
const MOCK_AFFILIATES = [
  { id: "1", name: "John Doe", email: "john@example.com", avatar: null, status: "active", referrals: 45, revenue: 2340, commission: 234, joinedAt: "2026-01-15" },
  { id: "2", name: "Jane Smith", email: "jane@example.com", avatar: null, status: "active", referrals: 32, revenue: 1890, commission: 189, joinedAt: "2026-02-01" },
  { id: "3", name: "Bob Wilson", email: "bob@example.com", avatar: null, status: "pending", referrals: 0, revenue: 0, commission: 0, joinedAt: "2026-03-18" },
  { id: "4", name: "Alice Brown", email: "alice@example.com", avatar: null, status: "inactive", referrals: 12, revenue: 560, commission: 56, joinedAt: "2025-11-01" },
];

type AffiliateStatus = "active" | "pending" | "inactive";
const STATUS_CONFIG: Record<AffiliateStatus, { color: string; icon: typeof CheckCircle }> = {
  active: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  pending: { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: UserPlus },
  inactive: { color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400", icon: XCircle },
};

export default function AdminAffiliatesPage() {
  const { role, can, isLoading, canAccessDashboard, getDashboardPath, creatorSlug, communityId } = useDashboard();
  const basePath = getDashboardPath("admin");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("partners");

  const affiliateLink = `https://chabaqa.com/join/${communityId}?ref=`;

  if (isLoading) return <DashboardLoading message="Loading affiliates..." />;
  if (!canAccessDashboard("admin")) {
    return <DashboardUnauthorized role={role} requiredRole="admin" backAction={{ label: "Back", href: `/${creatorSlug}` }} />;
  }

  if (!can(CommunityPermission.AFFILIATES_MANAGE)) {
    return (
      <DashboardShell variant="admin">
        <DashboardUnauthorized role={role} requiredRole="admin with affiliates.manage" backAction={{ label: "Back", href: basePath }} />
      </DashboardShell>
    );
  }

  const filteredAffiliates = MOCK_AFFILIATES.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${affiliateLink}${code}`);
    toast.success("Link copied to clipboard");
  };

  return (
    <DashboardShell variant="admin">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={basePath}><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Affiliates</h1>
            <p className="mt-1 text-muted-foreground">Manage affiliate partners and track referral performance.</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Invite Affiliate
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <DashboardSection title="Affiliate Performance" description="All time stats" className="mb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Affiliates" value="89" description="4 pending approval" icon={Users} />
          <StatCard title="Total Referrals" value="1,247" description="This month: 156" icon={UserPlus} trend={{ value: 23 }} />
          <StatCard title="Revenue Generated" value="$47,890" description="From referrals" icon={DollarSign} trend={{ value: 18 }} />
          <StatCard title="Commission Rate" value="10%" description="Default rate" icon={Percent} />
        </div>
      </DashboardSection>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="links">Referral Links</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="partners" className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search affiliates..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>

          {/* Affiliates table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Referrals</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAffiliates.map(affiliate => {
                  const StatusIcon = STATUS_CONFIG[affiliate.status as AffiliateStatus].icon;
                  return (
                    <TableRow key={affiliate.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={affiliate.avatar ?? undefined} />
                            <AvatarFallback>{affiliate.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{affiliate.name}</p>
                            <p className="text-xs text-muted-foreground">{affiliate.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={STATUS_CONFIG[affiliate.status as AffiliateStatus].color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {affiliate.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{affiliate.referrals}</TableCell>
                      <TableCell className="text-right font-mono">${affiliate.revenue.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">${affiliate.commission.toLocaleString()}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem><Eye className="mr-2 h-4 w-4" />View Profile</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyLink(affiliate.id)}><Copy className="mr-2 h-4 w-4" />Copy Link</DropdownMenuItem>
                            <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Edit Rate</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Remove</DropdownMenuItem>
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

        <TabsContent value="links" className="space-y-4">
          <DashboardSection title="Referral Links" description="Generate and manage referral links">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Referral Link</CardTitle>
                <CardDescription>Share this link to track referrals for your community</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input value={`${affiliateLink}OWNER`} readOnly className="font-mono text-sm" />
                  <Button variant="outline" onClick={() => copyLink("OWNER")}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </DashboardSection>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <DashboardSection title="Payout History" description="Commission payments to affiliates">
            <BackendRequiredPlaceholder feature="Affiliate Payouts" description="Payout processing requires backend integration with payment provider." />
          </DashboardSection>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
