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
} from "../../components";
import { CommunityPermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Award,
  ShoppingBag,
  Plus,
  BookOpen,
  Video,
  Users,
  TrendingUp,
  Eye,
  Clock,
  CheckCircle,
  Edit,
  MoreVertical,
  Trash2,
  Copy,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { FeatureGate } from "@/components/plan/feature-gate";
import { LockedFeatureCard } from "@/components/plan/upgrade-modal";
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

// Mock content data
const MOCK_COURSES = [
  { id: "1", title: "Photography Masterclass", type: "course", status: "published", students: 245, rating: 4.8, createdAt: "2026-01-15" },
  { id: "2", title: "Lightroom Basics", type: "course", status: "draft", students: 0, rating: 0, createdAt: "2026-03-18" },
  { id: "3", title: "Portrait Photography", type: "course", status: "published", students: 89, rating: 4.6, createdAt: "2026-02-20" },
];

const MOCK_EVENTS = [
  { id: "1", title: "Live Q&A Session", type: "event", status: "upcoming", attendees: 156, date: "2026-03-25" },
  { id: "2", title: "Photo Walk NYC", type: "event", status: "completed", attendees: 32, date: "2026-03-10" },
];

const MOCK_CHALLENGES = [
  { id: "1", title: "30-Day Photo Challenge", type: "challenge", status: "active", participants: 89, endDate: "2026-04-15" },
];

type ContentStatus = "published" | "draft" | "upcoming" | "active" | "completed";
const STATUS_CONFIG: Record<ContentStatus, { color: string; icon: typeof CheckCircle }> = {
  published: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  draft: { color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400", icon: Edit },
  upcoming: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Clock },
  active: { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: TrendingUp },
  completed: { color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: CheckCircle },
};

export default function AdminContentPage() {
  const { role, can, isLoading, canAccessDashboard, getDashboardPath, creatorSlug } = useDashboard();
  const basePath = getDashboardPath("admin");
  const [tab, setTab] = useState("courses");

  if (isLoading) return <DashboardLoading message="Loading content..." />;
  if (!canAccessDashboard("admin")) {
    return <DashboardUnauthorized role={role} requiredRole="admin" backAction={{ label: "Back", href: `/${creatorSlug}` }} />;
  }

  if (!can(CommunityPermission.CONTENT_MANAGE)) {
    return (
      <DashboardShell variant="admin">
        <DashboardUnauthorized role={role} requiredRole="admin with content.manage" backAction={{ label: "Back", href: basePath }} />
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
            <h1 className="text-2xl font-bold tracking-tight">Content Management</h1>
            <p className="mt-1 text-muted-foreground">Create and manage courses, events, challenges, and products.</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem><BookOpen className="mr-2 h-4 w-4" />New Course</DropdownMenuItem>
              <FeatureGate feature="events" fallback={<DropdownMenuItem disabled><Calendar className="mr-2 h-4 w-4" />New Event 🔒</DropdownMenuItem>}><DropdownMenuItem><Calendar className="mr-2 h-4 w-4" />New Event</DropdownMenuItem></FeatureGate>
              <FeatureGate feature="challenges" fallback={<DropdownMenuItem disabled><Award className="mr-2 h-4 w-4" />New Challenge 🔒</DropdownMenuItem>}><DropdownMenuItem><Award className="mr-2 h-4 w-4" />New Challenge</DropdownMenuItem></FeatureGate>
              <DropdownMenuItem><ShoppingBag className="mr-2 h-4 w-4" />New Product</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content Stats */}
      <DashboardSection title="Content Overview" description="Your content library" className="mb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Courses" value="12" description="3 drafts" icon={BookOpen} />
          <StatCard title="Active Events" value="4" description="2 upcoming" icon={Calendar} />
          <StatCard title="Challenges" value="3" description="1 active" icon={Award} />
          <StatCard title="Products" value="8" description="Digital goods" icon={ShoppingBag} />
        </div>
      </DashboardSection>

      {/* Content Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="courses"><BookOpen className="mr-2 h-4 w-4 hidden sm:inline" />Courses</TabsTrigger>
          <TabsTrigger value="events"><Calendar className="mr-2 h-4 w-4 hidden sm:inline" />Events</TabsTrigger>
          <TabsTrigger value="challenges"><Award className="mr-2 h-4 w-4 hidden sm:inline" />Challenges</TabsTrigger>
          <TabsTrigger value="products"><ShoppingBag className="mr-2 h-4 w-4 hidden sm:inline" />Products</TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_COURSES.map(course => {
                  const StatusIcon = STATUS_CONFIG[course.status as ContentStatus].icon;
                  return (
                    <TableRow key={course.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                            <Video className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{course.title}</p>
                            <p className="text-xs text-muted-foreground">Created {course.createdAt}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={STATUS_CONFIG[course.status as ContentStatus].color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {course.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{course.students}</TableCell>
                      <TableCell className="text-right">
                        {course.rating > 0 ? (
                          <span className="font-mono">⭐ {course.rating}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem><Eye className="mr-2 h-4 w-4" />Preview</DropdownMenuItem>
                            <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                            <DropdownMenuItem><Copy className="mr-2 h-4 w-4" />Duplicate</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
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

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <FeatureGate feature="events" fallback={<LockedFeatureCard feature="Events" requiredPlan="growth" description="Create and manage events for your community. Upgrade to Growth plan to unlock." />}>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Attendees</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_EVENTS.map(event => {
                  const StatusIcon = STATUS_CONFIG[event.status as ContentStatus].icon;
                  return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <p className="font-medium">{event.title}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={STATUS_CONFIG[event.status as ContentStatus].color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {event.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{event.date}</TableCell>
                      <TableCell className="text-right font-mono">{event.attendees}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
          </FeatureGate>
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-4">
          <FeatureGate feature="challenges" fallback={<LockedFeatureCard feature="Challenges" requiredPlan="growth" description="Create and manage challenges for your community. Upgrade to Growth plan to unlock." />}>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Challenge</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="text-right">Participants</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_CHALLENGES.map(challenge => {
                  const StatusIcon = STATUS_CONFIG[challenge.status as ContentStatus].icon;
                  return (
                    <TableRow key={challenge.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                            <Award className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <p className="font-medium">{challenge.title}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={STATUS_CONFIG[challenge.status as ContentStatus].color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {challenge.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{challenge.endDate}</TableCell>
                      <TableCell className="text-right font-mono">{challenge.participants}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
          </FeatureGate>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <DashboardEmpty title="No products yet" description="Create digital products like ebooks, templates, or presets to sell to your community." action={{ label: "Create Product", onClick: () => {} }} />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
