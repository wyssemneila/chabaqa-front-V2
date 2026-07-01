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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Users,
  Link2,
  DollarSign,
  Plus,
  Search,
  Percent,
  UserPlus,
  CheckCircle,
  XCircle,
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
import { affiliateApi, type AffiliateMarketingResponse, type AffiliatePartner, type AffiliateProgram } from "@/lib/api/affiliate.api";

type PartnerStatus = "approved" | "pending" | "rejected" | "paused";
const STATUS_CONFIG: Record<PartnerStatus, { color: string; icon: typeof CheckCircle; label: string }> = {
  approved: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle, label: "active" },
  pending: { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: UserPlus, label: "pending" },
  rejected: { color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: XCircle, label: "rejected" },
  paused: { color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400", icon: XCircle, label: "paused" },
};

const money = (value: any) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
const initials = (name: string) => name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase() || "?";
const getPartnerName = (partner: AffiliatePartner) => {
  const user = typeof partner.partnerUserId === "object" ? partner.partnerUserId : undefined;
  return partner.displayName || partner.user?.fullName || partner.user?.name || user?.name || partner.email || partner.inviteEmail || "Unnamed partner";
};
const getPartnerEmail = (partner: AffiliatePartner) => {
  const user = typeof partner.partnerUserId === "object" ? partner.partnerUserId : undefined;
  return partner.user?.email || user?.email || partner.email || partner.inviteEmail || "";
};
const getPartnerAvatar = (partner: AffiliatePartner) => {
  const user = typeof partner.partnerUserId === "object" ? partner.partnerUserId : undefined;
  return partner.user?.avatar || partner.user?.avatarUrl || user?.avatar;
};

export default function AdminAffiliatesPage() {
  const { role, can, isLoading, canAccessDashboard, getDashboardPath, creatorSlug, communityId } = useDashboard();
  const basePath = getDashboardPath("admin");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("partners");
  const [loadingAffiliates, setLoadingAffiliates] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [programs, setPrograms] = useState<AffiliateProgram[]>([]);
  const [partners, setPartners] = useState<AffiliatePartner[]>([]);
  const [marketing, setMarketing] = useState<AffiliateMarketingResponse | null>(null);

  const loadAffiliates = async () => {
    if (!communityId) return;
    setLoadingAffiliates(true);
    setError(null);
    try {
      const [allPrograms, marketingData] = await Promise.all([
        affiliateApi.creator.listPrograms(),
        affiliateApi.creator.getMarketing({ communityId, days: 30, limit: 100 }),
      ]);
      const scopedPrograms = allPrograms.filter(program => String(program.communityId || "") === String(communityId));
      const partnerLists = await Promise.all(scopedPrograms.map(program => affiliateApi.creator.listPartners(program._id)));
      setPrograms(scopedPrograms);
      setPartners(partnerLists.flat());
      setMarketing(marketingData);
    } catch (err: any) {
      setError(err?.message || "Unable to load affiliate data.");
    } finally {
      setLoadingAffiliates(false);
    }
  };

  useEffect(() => {
    if (!isLoading && canAccessDashboard("admin") && can(CommunityPermission.AFFILIATES_MANAGE)) {
      loadAffiliates();
    }
  }, [communityId, isLoading, canAccessDashboard, can]);

  const filteredPartners = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return partners;
    return partners.filter(partner => getPartnerName(partner).toLowerCase().includes(q) || getPartnerEmail(partner).toLowerCase().includes(q));
  }, [partners, search]);

  const summary = marketing?.summary;
  const defaultRate = programs[0]?.commissionPercent ?? 0;

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

  return (
    <DashboardShell variant="admin">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={basePath}><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Affiliates</h1>
            <p className="mt-1 text-muted-foreground">Manage affiliate partners and track referral performance from live affiliate APIs.</p>
          </div>
          <Button disabled={programs.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Invite Affiliate
          </Button>
        </div>
      </div>

      {error ? (
        <DashboardError message={error} retry={loadAffiliates} />
      ) : (
        <>
          <DashboardSection title="Affiliate Performance" description="Last 30 days from creator affiliate analytics" className="mb-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total Affiliates" value={summary?.partnerCount ?? partners.length} description={`${summary?.pendingPartnerCount ?? partners.filter(p => p.status === "pending").length} pending approval`} icon={Users} isLoading={loadingAffiliates} />
              <StatCard title="Conversions" value={summary?.conversions ?? 0} description={`${summary?.clicks ?? 0} clicks`} icon={UserPlus} isLoading={loadingAffiliates} />
              <StatCard title="Revenue Generated" value={money(summary?.totalRevenueDT)} description={`${money(summary?.totalCommissionDT)} commission`} icon={DollarSign} isLoading={loadingAffiliates} />
              <StatCard title="Commission Rate" value={`${defaultRate}%`} description={`${programs.length} scoped programs`} icon={Percent} isLoading={loadingAffiliates} />
            </div>
          </DashboardSection>

          <Tabs value={tab} onValueChange={setTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="partners">Partners</TabsTrigger>
              <TabsTrigger value="links">Referral Links</TabsTrigger>
              <TabsTrigger value="payouts">Payouts</TabsTrigger>
            </TabsList>

            <TabsContent value="partners" className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search affiliates..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
              </div>

              <Card>
                {loadingAffiliates ? (
                  <DashboardLoading message="Loading partners..." />
                ) : filteredPartners.length === 0 ? (
                  <DashboardEmpty title="No affiliates found" description="No affiliate partners were returned for this community's programs." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Affiliate</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Links</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPartners.map(partner => {
                        const name = getPartnerName(partner);
                        const status = (partner.status || "pending") as PartnerStatus;
                        const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
                        const StatusIcon = config.icon;
                        return (
                          <TableRow key={partner._id || partner.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={getPartnerAvatar(partner)} />
                                  <AvatarFallback>{initials(name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{name}</p>
                                  <p className="text-xs text-muted-foreground">{getPartnerEmail(partner) || "No email"}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={config.color}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {config.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">{partner.linkCount ?? partner.linksCount ?? 0}</TableCell>
                            <TableCell className="text-right font-mono">{partner.customCommissionPercent ?? defaultRate}%</TableCell>
                            <TableCell className="text-muted-foreground">{partner.createdAt ? new Date(partner.createdAt).toLocaleDateString() : "Not available"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="links" className="space-y-4">
              <DashboardSection title="Referral Links" description="Recent backend-generated affiliate links">
                <Card>
                  {loadingAffiliates ? (
                    <DashboardLoading message="Loading links..." />
                  ) : (marketing?.linkBuilder?.recentLinks?.length || 0) === 0 ? (
                    <DashboardEmpty icon={Link2} title="No referral links found" description="Links will appear here once they are created through the affiliate link API." />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Target</TableHead>
                          <TableHead className="text-right">Clicks</TableHead>
                          <TableHead>Last Clicked</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {marketing?.linkBuilder?.recentLinks.map(link => (
                          <TableRow key={link.id || link.code}>
                            <TableCell className="font-mono">{link.code}</TableCell>
                            <TableCell>{link.targetPath || "Community"}</TableCell>
                            <TableCell className="text-right font-mono">{link.clicks}</TableCell>
                            <TableCell className="text-muted-foreground">{link.lastClickedAt ? new Date(link.lastClickedAt).toLocaleDateString() : "Never"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Card>
              </DashboardSection>
            </TabsContent>

            <TabsContent value="payouts" className="space-y-4">
              <DashboardSection title="Payout History" description="Commission payout administration">
                <BackendRequiredPlaceholder feature="Affiliate Payouts" description="Creator affiliate payout administration is restricted to the platform admin payout API; this community dashboard does not show sample payout rows." />
              </DashboardSection>
            </TabsContent>
          </Tabs>
        </>
      )}
    </DashboardShell>
  );
}
