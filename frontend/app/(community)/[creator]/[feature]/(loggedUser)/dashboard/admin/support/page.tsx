"use client";

import { useState } from "react";
import {
  useDashboard,
  DashboardShell,
  DashboardSection,
  ActionCard,
  DashboardLoading,
  DashboardUnauthorized,
  BackendRequiredPlaceholder,
} from "../../components";
import { CommunityPermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  MessageCircle,
  CheckCircle,
  AlertTriangle,
  Users,
  Settings,
  FileText,
  Ticket,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

export default function AdminSupportPage() {
  const { role, can, isLoading, canAccessDashboard, getDashboardPath, creatorSlug } = useDashboard();
  const basePath = getDashboardPath("admin");
  const [tab, setTab] = useState("overview");

  if (isLoading) return <DashboardLoading message="Loading support center..." />;
  if (!canAccessDashboard("admin")) {
    return <DashboardUnauthorized role={role} requiredRole="admin" backAction={{ label: "Back", href: `/${creatorSlug}` }} />;
  }

  if (!can(CommunityPermission.SUPPORT_MANAGE)) {
    return (
      <DashboardShell variant="admin">
        <DashboardUnauthorized role={role} requiredRole="admin with support.manage" backAction={{ label: "Back", href: basePath }} />
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Support Center</h1>
              <Badge variant="secondary">Limited</Badge>
            </div>
            <p className="mt-1 text-muted-foreground">Manage support tickets and member assistance.</p>
          </div>
          <Button variant="outline" size="sm" disabled>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      <Alert className="mb-8 border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-amber-800 dark:text-amber-200">Limited Functionality</AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-300">
          Community-scoped support queue and metrics require backend endpoint alignment. The current live-support APIs are not safe to present as community-role dashboard data.
        </AlertDescription>
      </Alert>

      <DashboardSection title="Support Overview" description="Community-role support metrics are not exposed yet" className="mb-8">
        <BackendRequiredPlaceholder
          feature="Support Metrics"
          description="The dashboard no longer displays sample support counts. Open tickets, response time, satisfaction, and resolution metrics need community-scoped support endpoints."
        />
      </DashboardSection>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="chat">Live Chat</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ActionCard title="View Ticket Queue" description="Review and respond to pending support tickets" icon={Ticket} badge="Unavailable" badgeVariant="destructive" backendRequired />
            <ActionCard title="Live Chat Support" description="Real-time chat with community members" icon={MessageCircle} badge="Unavailable" badgeVariant="destructive" backendRequired />
            <ActionCard title="Support Analytics" description="View support performance metrics" icon={BarChart3} badge="Unavailable" badgeVariant="destructive" backendRequired />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Available Now
              </CardTitle>
              <CardDescription>Features backed by the current community dashboard routes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Member Lookup</p>
                    <p className="text-sm text-muted-foreground">Search and view member profiles and activity</p>
                    <Button variant="link" size="sm" className="px-0 h-auto" asChild>
                      <Link href={`${basePath.replace('/admin', '/support')}/members`}>Go to Member Lookup</Link>
                    </Button>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Knowledge Base</p>
                    <p className="text-sm text-muted-foreground">Static help resources can be linked here once content is configured.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets">
          <BackendRequiredPlaceholder
            feature="Support Ticket Queue"
            description="Community-scoped ticket management requires backend endpoint integration. The current live-support endpoints are admin-auth scoped."
          />
        </TabsContent>

        <TabsContent value="chat">
          <BackendRequiredPlaceholder
            feature="Live Chat Support"
            description="Real-time chat functionality requires WebSocket integration with community-role-aware authentication."
          />
        </TabsContent>

        <TabsContent value="resources">
          <BackendRequiredPlaceholder
            feature="Support Resources"
            description="Support handbook and resource management needs a backend-backed content source before this tab can show live documents."
          />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
