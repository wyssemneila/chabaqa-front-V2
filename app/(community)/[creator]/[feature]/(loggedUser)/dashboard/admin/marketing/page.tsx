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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Mail,
  Send,
  BarChart3,
  Users,
  Calendar,
  Clock,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  TrendingUp,
  MousePointer,
  UserPlus,
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

// Mock campaign data for UI demonstration
const MOCK_CAMPAIGNS = [
  { id: "1", name: "Welcome Series", type: "automation", status: "active", sent: 1245, opened: 892, clicked: 234, createdAt: "2026-03-01" },
  { id: "2", name: "Weekly Newsletter", type: "broadcast", status: "scheduled", sent: 0, opened: 0, clicked: 0, createdAt: "2026-03-15" },
  { id: "3", name: "Course Launch Promo", type: "broadcast", status: "draft", sent: 0, opened: 0, clicked: 0, createdAt: "2026-03-18" },
  { id: "4", name: "Re-engagement Flow", type: "automation", status: "paused", sent: 567, opened: 234, clicked: 89, createdAt: "2026-02-14" },
];

type CampaignStatus = "active" | "scheduled" | "draft" | "paused" | "completed";
const STATUS_COLORS: Record<CampaignStatus, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  paused: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

export default function AdminMarketingPage() {
  const { role, can, isLoading, canAccessDashboard, getDashboardPath, creatorSlug } = useDashboard();
  const basePath = getDashboardPath("admin");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("campaigns");

  if (isLoading) return <DashboardLoading message="Loading marketing..." />;
  if (!canAccessDashboard("admin")) {
    return <DashboardUnauthorized role={role} requiredRole="admin" backAction={{ label: "Back", href: `/${creatorSlug}` }} />;
  }

  if (!can(CommunityPermission.MARKETING_MANAGE)) {
    return (
      <DashboardShell variant="admin">
        <DashboardUnauthorized role={role} requiredRole="admin with marketing.manage" backAction={{ label: "Back", href: basePath }} />
      </DashboardShell>
    );
  }

  const filteredCampaigns = MOCK_CAMPAIGNS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardShell variant="admin">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={basePath}><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Marketing</h1>
            <p className="mt-1 text-muted-foreground">Email campaigns, automations, and audience growth.</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <DashboardSection title="Email Performance" description="Last 30 days" className="mb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Subscribers" value="3,847" description="Active list size" icon={Users} trend={{ value: 12, isPositive: true }} />
          <StatCard title="Emails Sent" value="12,456" description="This month" icon={Send} />
          <StatCard title="Open Rate" value="68.4%" description="Industry avg: 42%" icon={Eye} trend={{ value: 8, isPositive: true }} />
          <StatCard title="Click Rate" value="24.2%" description="Industry avg: 18%" icon={MousePointer} trend={{ value: 3, isPositive: true }} />
        </div>
      </DashboardSection>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          {/* Search and filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>

          {/* Campaigns table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Opened</TableHead>
                  <TableHead className="text-right">Clicked</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map(campaign => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{campaign.type}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={STATUS_COLORS[campaign.status as CampaignStatus]}>
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{campaign.sent.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono">{campaign.opened.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono">{campaign.clicked.toLocaleString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Eye className="mr-2 h-4 w-4" />View</DropdownMenuItem>
                          <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          {campaign.status === "active" ? (
                            <DropdownMenuItem><Pause className="mr-2 h-4 w-4" />Pause</DropdownMenuItem>
                          ) : campaign.status === "paused" ? (
                            <DropdownMenuItem><Play className="mr-2 h-4 w-4" />Resume</DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="automations" className="space-y-4">
          <DashboardSection title="Email Automations" description="Automated email sequences">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ActionCard title="Welcome Series" description="Onboard new members with a 5-email welcome sequence" icon={UserPlus} href="#" badge="Active" />
              <ActionCard title="Re-engagement" description="Win back inactive members with targeted emails" icon={TrendingUp} href="#" badge="Paused" />
              <ActionCard title="Course Completion" description="Celebrate and upsell after course completion" icon={Calendar} href="#" badge="Draft" />
            </div>
          </DashboardSection>
        </TabsContent>

        <TabsContent value="audience" className="space-y-4">
          <DashboardSection title="Audience Segments" description="Manage subscriber lists and segments">
            <BackendRequiredPlaceholder feature="Audience Segmentation" description="Advanced audience segmentation requires backend integration for subscriber list management." />
          </DashboardSection>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
