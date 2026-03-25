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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  HeadphonesIcon,
  MessageCircle,
  Inbox,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  TrendingUp,
  Settings,
  ExternalLink,
  FileText,
  Ticket,
  Timer,
  Star,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

// Mock support stats
const MOCK_STATS = {
  openTickets: 23,
  avgResponseTime: "2.4h",
  satisfactionRate: "94%",
  resolvedToday: 12,
};

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
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Backend Gap Alert */}
      <Alert className="mb-8 border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-amber-800 dark:text-amber-200">Limited Functionality</AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-300">
          Community-scoped support queue requires backend endpoint alignment. See{" "}
          <Link href="/docs/BACKEND_ALIGNMENT_SUPPORT_ROLE.md" className="underline font-medium">
            Backend Alignment Proposal
          </Link>{" "}
          for details.
        </AlertDescription>
      </Alert>

      {/* Support Stats */}
      <DashboardSection title="Support Overview" description="Current support metrics" className="mb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Open Tickets" value={MOCK_STATS.openTickets.toString()} description="Awaiting response" icon={Inbox} />
          <StatCard title="Avg. Response" value={MOCK_STATS.avgResponseTime} description="First response time" icon={Timer} />
          <StatCard title="Satisfaction" value={MOCK_STATS.satisfactionRate} description="Member rating" icon={Star} />
          <StatCard title="Resolved Today" value={MOCK_STATS.resolvedToday.toString()} description="Tickets closed" icon={CheckCircle} />
        </div>
      </DashboardSection>

      {/* Support Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="chat">Live Chat</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ActionCard 
              title="View Ticket Queue" 
              description="Review and respond to pending support tickets" 
              icon={Ticket} 
              href="#" 
              badge="Backend Required"
              badgeVariant="destructive"
            />
            <ActionCard 
              title="Live Chat Support" 
              description="Real-time chat with community members" 
              icon={MessageCircle} 
              href="#"
              badge="Backend Required"
              badgeVariant="destructive"
            />
            <ActionCard 
              title="Support Analytics" 
              description="View support performance metrics" 
              icon={BarChart3} 
              href="#"
              badge="Backend Required"
              badgeVariant="destructive"
            />
          </div>

          {/* Available Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Available Now
              </CardTitle>
              <CardDescription>Features you can use today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Member Lookup</p>
                    <p className="text-sm text-muted-foreground">Search and view member profiles and activity</p>
                    <Button variant="link" size="sm" className="px-0 h-auto" asChild>
                      <Link href={`${basePath.replace('/admin', '/support')}/members`}>Go to Member Lookup →</Link>
                    </Button>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Knowledge Base</p>
                    <p className="text-sm text-muted-foreground">Access help articles and documentation</p>
                    <Button variant="link" size="sm" className="px-0 h-auto">View Documentation →</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets">
          <BackendRequiredPlaceholder 
            feature="Support Ticket Queue" 
            description="Community-scoped ticket management requires backend endpoint integration. The current live-support endpoints are protected by AdminAuthGuard and don't support community role access."
          />
        </TabsContent>

        {/* Live Chat Tab */}
        <TabsContent value="chat">
          <BackendRequiredPlaceholder 
            feature="Live Chat Support" 
            description="Real-time chat functionality requires WebSocket integration with community-role-aware authentication."
          />
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Support Resources</CardTitle>
              <CardDescription>Help documents and guides for support staff</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { title: "Support Staff Handbook", description: "Guidelines for handling member inquiries", type: "PDF" },
                  { title: "Escalation Procedures", description: "When and how to escalate issues", type: "Doc" },
                  { title: "Common Issues FAQ", description: "Frequently asked questions and answers", type: "Doc" },
                  { title: "Refund Policy", description: "Official refund and dispute handling", type: "Policy" },
                ].map((resource, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{resource.title}</p>
                        <p className="text-sm text-muted-foreground">{resource.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{resource.type}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
