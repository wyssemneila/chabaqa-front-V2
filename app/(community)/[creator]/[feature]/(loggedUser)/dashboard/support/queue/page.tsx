"use client";

import { useDashboard, DashboardShell, DashboardLoading, DashboardUnauthorized, BackendRequiredPlaceholder } from "../../components";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, HeadphonesIcon, AlertTriangle, MessageCircle, Inbox } from "lucide-react";
import Link from "next/link";

export default function SupportQueuePage() {
  const { role, isLoading, canAccessDashboard, getDashboardPath, creatorSlug } = useDashboard();
  const basePath = getDashboardPath("support");

  if (isLoading) return <DashboardLoading message="Loading support queue..." />;
  if (!canAccessDashboard("support")) {
    return <DashboardUnauthorized role={role} requiredRole="support" backAction={{ label: "Back", href: `/${creatorSlug}` }} />;
  }

  return (
    <DashboardShell variant="support">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4"><Link href={basePath}><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link></Button>
        <h1 className="text-2xl font-bold tracking-tight">Support Queue</h1>
        <p className="mt-1 text-muted-foreground">View and manage incoming support tickets.</p>
      </div>

      <Alert className="mb-8 border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-amber-800 dark:text-amber-200">Backend Required</AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-300">This feature requires community-scoped support endpoints pending backend implementation.</AlertDescription>
      </Alert>

      <div className="space-y-4">
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"><Inbox className="h-5 w-5 text-muted-foreground" /></div>
              <div><CardTitle className="text-base">Ticket Queue</CardTitle><CardDescription>Incoming support tickets from community members</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed p-8 text-center">
              <HeadphonesIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium mb-1">Support queue not yet available</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">Community-level support queue requires backend endpoint alignment.</p>
              <Badge variant="outline" className="text-xs">Pending Backend Alignment</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"><MessageCircle className="h-5 w-5 text-muted-foreground" /></div>
              <div><CardTitle className="text-base">Live Chat</CardTitle><CardDescription>Real-time chat support with community members</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed p-8 text-center">
              <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium mb-1">Live chat not yet available</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">Requires community-role-compatible live support endpoints.</p>
              <Badge variant="outline" className="text-xs">Pending Backend Alignment</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <BackendRequiredPlaceholder feature="Community Support Queue" description="To enable support queue, backend needs community-scoped endpoints protected by CommunityPermission.SUPPORT_MANAGE." />
      </div>
    </DashboardShell>
  );
}
