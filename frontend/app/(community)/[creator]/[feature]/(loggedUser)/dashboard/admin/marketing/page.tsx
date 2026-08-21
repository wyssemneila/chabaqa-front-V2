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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Send,
  Users,
  Calendar,
  Plus,
  Search,
  Eye,
  MousePointer,
  UserPlus,
  TrendingUp,
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
import { emailCampaignsApi, type CampaignStats, type EmailCampaign } from "@/lib/api/email-campaigns.api";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  paused: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  sent: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const percent = (value: any) => `${Number(value || 0).toFixed(1)}%`;
const campaignStatus = (campaign: EmailCampaign) => campaign.automationActive ? "active" : campaign.status || "draft";

export default function AdminMarketingPage() {
  const { role, can, isLoading, canAccessDashboard, getDashboardPath, creatorSlug, communityId } = useDashboard();
  const basePath = getDashboardPath("admin");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("campaigns");
  const [loadingMarketing, setLoadingMarketing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [welcomeTemplate, setWelcomeTemplate] = useState<EmailCampaign | null>(null);
  const [inactivityAutomations, setInactivityAutomations] = useState<EmailCampaign[]>([]);

  const loadMarketing = async () => {
    if (!communityId) return;
    setLoadingMarketing(true);
    setError(null);
    try {
      const [campaignResponse, statsResponse, welcomeResponse, inactivityResponse] = await Promise.all([
        emailCampaignsApi.getCommunityCampaigns(communityId, { page: 1, limit: 50 }),
        emailCampaignsApi.getCampaignStats(communityId),
        emailCampaignsApi.getWelcomeTemplate(communityId),
        emailCampaignsApi.getInactivityAutomations(communityId),
      ]);
      setCampaigns(campaignResponse.campaigns || []);
      setStats(statsResponse);
      setWelcomeTemplate(welcomeResponse);
      setInactivityAutomations(inactivityResponse || []);
    } catch (err: any) {
      setError(err?.message || "Unable to load marketing data.");
    } finally {
      setLoadingMarketing(false);
    }
  };

  useEffect(() => {
    if (!isLoading && canAccessDashboard("admin") && can(CommunityPermission.MARKETING_MANAGE)) {
      loadMarketing();
    }
  }, [communityId, isLoading, canAccessDashboard, can]);

  const filteredCampaigns = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return campaigns;
    return campaigns.filter(campaign => campaign.title.toLowerCase().includes(q) || campaign.subject?.toLowerCase().includes(q));
  }, [campaigns, search]);
  const automations = useMemo(() => [
    ...(welcomeTemplate ? [welcomeTemplate] : []),
    ...inactivityAutomations,
  ], [welcomeTemplate, inactivityAutomations]);

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

  return (
    <DashboardShell variant="admin">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={basePath}><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Marketing</h1>
            <p className="mt-1 text-muted-foreground">Email campaigns, automations, and audience growth from live campaign APIs.</p>
          </div>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </div>
      </div>

      {error ? (
        <DashboardError message={error} retry={loadMarketing} />
      ) : (
        <>
          <DashboardSection title="Email Performance" description="Backend campaign statistics" className="mb-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total Campaigns" value={stats?.totalCampaigns ?? campaigns.length} description="Community campaigns" icon={Users} isLoading={loadingMarketing} />
              <StatCard title="Emails Sent" value={(stats?.totalEmailsSent ?? 0).toLocaleString()} description={`${stats?.totalEmailsFailed ?? 0} failed`} icon={Send} isLoading={loadingMarketing} />
              <StatCard title="Open Rate" value={percent(stats?.averageOpenRate)} description={`${stats?.totalOpens ?? 0} opens`} icon={Eye} isLoading={loadingMarketing} />
              <StatCard title="Click Rate" value={percent(stats?.averageClickRate)} description={`${stats?.totalClicks ?? 0} clicks`} icon={MousePointer} isLoading={loadingMarketing} />
            </div>
          </DashboardSection>

          <Tabs value={tab} onValueChange={setTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="automations">Automations</TabsTrigger>
              <TabsTrigger value="audience">Audience</TabsTrigger>
            </TabsList>

            <TabsContent value="campaigns" className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
              </div>

              <Card>
                {loadingMarketing ? (
                  <DashboardLoading message="Loading campaigns..." />
                ) : filteredCampaigns.length === 0 ? (
                  <DashboardEmpty title="No campaigns found" description="No email campaigns were returned for this community." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Sent</TableHead>
                        <TableHead className="text-right">Opened</TableHead>
                        <TableHead className="text-right">Clicked</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCampaigns.map(campaign => {
                        const status = campaignStatus(campaign);
                        return (
                          <TableRow key={campaign._id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{campaign.title}</p>
                                <p className="text-xs text-muted-foreground capitalize">{campaign.type}{campaign.isAutomationTemplate ? " automation" : ""}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={STATUS_COLORS[status] || STATUS_COLORS.draft}>
                                {status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">{campaign.sentCount?.toLocaleString?.() ?? 0}</TableCell>
                            <TableCell className="text-right font-mono">{campaign.openCount?.toLocaleString?.() ?? 0}</TableCell>
                            <TableCell className="text-right font-mono">{campaign.clickCount?.toLocaleString?.() ?? 0}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="automations" className="space-y-4">
              <DashboardSection title="Email Automations" description="Welcome and inactivity automations from backend templates">
                {loadingMarketing ? (
                  <DashboardLoading message="Loading automations..." />
                ) : automations.length === 0 ? (
                  <DashboardEmpty title="No automations configured" description="Welcome and inactivity automations will appear here once configured." />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {automations.map(automation => (
                      <Card key={automation._id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            {automation.eventTrigger === "member_inactive" ? <TrendingUp className="h-5 w-5 text-primary" /> : <UserPlus className="h-5 w-5 text-primary" />}
                          </div>
                          <Badge variant="secondary" className={automation.automationActive ? STATUS_COLORS.active : STATUS_COLORS.paused}>
                            {automation.automationActive ? "active" : "paused"}
                          </Badge>
                        </div>
                        <h3 className="mt-4 font-semibold">{automation.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{automation.subject}</p>
                        <p className="mt-3 text-xs text-muted-foreground">
                          <Calendar className="mr-1 inline h-3 w-3" />
                          Created {automation.createdAt ? new Date(automation.createdAt).toLocaleDateString() : "not available"}
                        </p>
                      </Card>
                    ))}
                  </div>
                )}
              </DashboardSection>
            </TabsContent>

            <TabsContent value="audience" className="space-y-4">
              <DashboardSection title="Audience Segments" description="Manage subscriber lists and segments">
                <BackendRequiredPlaceholder feature="Audience Segmentation" description="This dashboard no longer shows fake subscriber totals. Use the email recipient preview/custom audience APIs where available; advanced segment management needs a dedicated backend target." />
              </DashboardSection>
            </TabsContent>
          </Tabs>
        </>
      )}
    </DashboardShell>
  );
}
