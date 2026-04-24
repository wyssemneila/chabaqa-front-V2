"use client";

import { useState } from "react";
import {
  useDashboard,
  DashboardShell,
  DashboardSection,
  StatCard,
  DashboardLoading,
  DashboardUnauthorized,
  DashboardEmpty,
} from "../../components";
import { ModerationQueue } from "../../moderator/components";
import { CommunityPermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Flag,
  Shield,
  Users,
  TrendingUp,
  Eye,
  Filter,
  RefreshCw,
  Settings,
  MoreVertical,
  Ban,
  UserX,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Mock flagged users
const MOCK_FLAGGED_USERS = [
  { id: "1", name: "Spam Bot 123", email: "spam@fake.com", avatar: null, flags: 12, lastFlagged: "2026-03-20", status: "pending" },
  { id: "2", name: "Troll Account", email: "troll@email.com", avatar: null, flags: 8, lastFlagged: "2026-03-19", status: "warned" },
  { id: "3", name: "Suspicious User", email: "sus@domain.com", avatar: null, flags: 5, lastFlagged: "2026-03-18", status: "pending" },
];

// Mock auto-mod rules
const MOCK_AUTOMOD_RULES = [
  { id: "1", name: "Spam Link Filter", enabled: true, triggers: 234, blocked: 189 },
  { id: "2", name: "Profanity Filter", enabled: true, triggers: 156, blocked: 145 },
  { id: "3", name: "New User Limits", enabled: false, triggers: 0, blocked: 0 },
];

export default function AdminModerationPage() {
  const { role, can, isLoading, canAccessDashboard, getDashboardPath, creatorSlug, communityId } = useDashboard();
  const basePath = getDashboardPath("admin");
  const [tab, setTab] = useState("queue");

  if (isLoading) return <DashboardLoading message="Loading moderation..." />;
  if (!canAccessDashboard("admin")) {
    return <DashboardUnauthorized role={role} requiredRole="admin" backAction={{ label: "Back", href: `/${creatorSlug}` }} />;
  }

  if (!can(CommunityPermission.POSTS_MODERATE)) {
    return (
      <DashboardShell variant="admin">
        <DashboardUnauthorized role={role} requiredRole="admin with posts.moderate" backAction={{ label: "Back", href: basePath }} />
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
            <h1 className="text-2xl font-bold tracking-tight">Post Moderation</h1>
            <p className="mt-1 text-muted-foreground">Review flagged content, manage users, and configure auto-moderation.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Moderation Stats */}
      <DashboardSection title="Moderation Overview" description="Community health metrics" className="mb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Pending Review" value="12" description="Items in queue" icon={Clock} />
          <StatCard title="Flagged Today" value="5" description="New reports" icon={Flag} />
          <StatCard title="Auto-blocked" value="23" description="This week" icon={Shield} trend={{ value: 15 }} />
          <StatCard title="Health Score" value="94%" description="Community health" icon={TrendingUp} trend={{ value: 2 }} />
        </div>
      </DashboardSection>

      {/* Moderation Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="queue"><MessageSquare className="mr-2 h-4 w-4" />Content Queue</TabsTrigger>
          <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" />Flagged Users</TabsTrigger>
          <TabsTrigger value="automod"><Shield className="mr-2 h-4 w-4" />Auto-Mod</TabsTrigger>
        </TabsList>

        {/* Content Queue Tab */}
        <TabsContent value="queue">
          <ModerationQueue communityId={communityId} />
        </TabsContent>

        {/* Flagged Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Flagged Users</CardTitle>
              <CardDescription>Users with multiple content flags or reports</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead>Last Flagged</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_FLAGGED_USERS.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar ?? undefined} />
                            <AvatarFallback>{user.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">{user.flags} flags</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.lastFlagged}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === "warned" ? "secondary" : "outline"}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem><Eye className="mr-2 h-4 w-4" />View Profile</DropdownMenuItem>
                            <DropdownMenuItem><MessageSquare className="mr-2 h-4 w-4" />View Posts</DropdownMenuItem>
                            <DropdownMenuItem className="text-amber-600"><AlertTriangle className="mr-2 h-4 w-4" />Warn User</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive"><Ban className="mr-2 h-4 w-4" />Ban User</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auto-Mod Tab */}
        <TabsContent value="automod" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Moderation Rules</CardTitle>
              <CardDescription>Automated content filtering and protection rules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {MOCK_AUTOMOD_RULES.map(rule => (
                  <div key={rule.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <Shield className={`h-5 w-5 ${rule.enabled ? "text-primary" : "text-muted-foreground"}`} />
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {rule.enabled ? `Triggered ${rule.triggers}x • Blocked ${rule.blocked}` : "Disabled"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={rule.enabled ? "default" : "secondary"}>
                        {rule.enabled ? "Active" : "Disabled"}
                      </Badge>
                      <Button variant="ghost" size="sm">Configure</Button>
                    </div>
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
