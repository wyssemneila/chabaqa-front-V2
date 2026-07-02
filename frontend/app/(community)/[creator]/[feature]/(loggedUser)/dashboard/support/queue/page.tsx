"use client";

import { useEffect, useState } from "react";
import {
  useDashboard,
  DashboardShell,
  DashboardLoading,
  DashboardUnauthorized,
  DashboardEmpty,
  StatCard,
} from "../../components";
import { communitySupportApi } from "@/lib/api/community-support.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, HeadphonesIcon, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function SupportQueuePage() {
  const { role, isLoading, canAccessDashboard, getDashboardPath, creatorSlug, communityId } = useDashboard();
  const basePath = getDashboardPath("support");
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});

  const load = async () => {
    if (!communityId) return;
    setLoading(true);
    try {
      const [queueResult, metricsResult] = await Promise.all([
        communitySupportApi.getQueue(communityId, { page: 1, limit: 50, status: 'open' }),
        communitySupportApi.getMetrics(communityId),
      ]);
      setQueue(queueResult?.items ?? []);
      setMetrics(metricsResult ?? {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && communityId) void load();
  }, [communityId, isLoading]);

  if (isLoading) return <DashboardLoading message="Loading support queue..." />;
  if (!canAccessDashboard("support")) {
    return <DashboardUnauthorized role={role} requiredRole="support" backAction={{ label: "Back", href: `/${creatorSlug}` }} />;
  }

  return (
    <DashboardShell variant="support">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4"><Link href={basePath}><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link></Button>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Support Queue</h1>
            <p className="mt-1 text-muted-foreground">Community DM conversations needing support attention.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />Refresh
          </Button>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard title="Open conversations" value={metrics.openCount ?? 0} icon={HeadphonesIcon} isLoading={loading} />
        <StatCard title="Resolved today" value={metrics.resolvedToday ?? 0} icon={HeadphonesIcon} isLoading={loading} />
        <StatCard title="Total conversations" value={metrics.totalConversations ?? 0} icon={HeadphonesIcon} isLoading={loading} />
      </div>

      {loading ? (
        <DashboardLoading message="Loading queue..." />
      ) : queue.length === 0 ? (
        <DashboardEmpty title="Queue is clear" description="No open support conversations for this community." />
      ) : (
        <div className="space-y-3">
          {queue.map((item) => {
            const member = item.participantA;
            const name = member?.name || [member?.firstName, member?.lastName].filter(Boolean).join(' ') || member?.email || 'Member';
            return (
              <Card key={item._id || item.id}>
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{name}</p>
                    <p className="text-sm text-muted-foreground truncate">{item.lastMessageText || 'No messages yet'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={item.isOpen ? 'default' : 'secondary'}>{item.isOpen ? 'Open' : 'Closed'}</Badge>
                    <Button size="sm" variant="outline" onClick={() => void communitySupportApi.assignConversation(communityId!, String(item._id || item.id)).then(load)}>
                      Assign to me
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
