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
} from "../../components";
import { CommunityPermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  Award,
  ShoppingBag,
  Plus,
  BookOpen,
  Clock,
  CheckCircle,
  Edit,
  ExternalLink,
  TrendingUp,
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
import { communitiesApi } from "@/lib/api/communities.api";
import { coursesApi } from "@/lib/api/courses.api";
import { eventsApi, normalizeEventListResponse } from "@/lib/api/events.api";
import { challengesApi } from "@/lib/api/challenges.api";
import { productsApi } from "@/lib/api/products.api";

type ContentStatus = "published" | "draft" | "upcoming" | "active" | "completed" | "archived";
type ContentItem = {
  id: string;
  title: string;
  status: ContentStatus;
  subtitle?: string;
  metric?: number;
  metricLabel?: string;
  date?: string;
  href?: string;
};

const STATUS_CONFIG: Record<ContentStatus, { color: string; icon: typeof CheckCircle }> = {
  published: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  draft: { color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400", icon: Edit },
  upcoming: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Clock },
  active: { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: TrendingUp },
  completed: { color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: CheckCircle },
  archived: { color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400", icon: CheckCircle },
};

const asArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.docs)) return value.docs;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.courses)) return value.courses;
  if (Array.isArray(value?.products)) return value.products;
  if (Array.isArray(value?.challenges)) return value.challenges;
  return [];
};

const getCommunity = (response: any) => response?.data?.data || response?.data || response;
const getId = (item: any) => String(item?._id || item?.id || item?.slug || crypto.randomUUID());
const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString() : "Not scheduled";
const boolStatus = (item: any): ContentStatus => item?.isPublished || item?.published || item?.status === "published" ? "published" : "draft";
const eventStatus = (item: any): ContentStatus => {
  const raw = String(item?.status || "").toLowerCase();
  if (raw === "completed" || raw === "cancelled") return "completed";
  if (item?.isActive === false) return "draft";
  const startsAt = item?.startDate || item?.date;
  if (startsAt && new Date(startsAt).getTime() < Date.now()) return "completed";
  return item?.isPublished === false ? "draft" : "upcoming";
};
const challengeStatus = (item: any): ContentStatus => {
  const raw = String(item?.status || "").toLowerCase();
  if (raw === "completed" || raw === "ended") return "completed";
  if (item?.isPublished === false || raw === "draft") return "draft";
  return item?.isActive === false ? "archived" : "active";
};

export default function AdminContentPage() {
  const { role, can, isLoading, canAccessDashboard, getDashboardPath, creatorSlug, communityId } = useDashboard();
  const basePath = getDashboardPath("admin");
  const [tab, setTab] = useState("courses");
  const [loadingContent, setLoadingContent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<ContentItem[]>([]);
  const [events, setEvents] = useState<ContentItem[]>([]);
  const [challenges, setChallenges] = useState<ContentItem[]>([]);
  const [products, setProducts] = useState<ContentItem[]>([]);

  useEffect(() => {
    if (!communityId || isLoading || !canAccessDashboard("admin") || !can(CommunityPermission.CONTENT_MANAGE)) return;

    let active = true;
    const loadContent = async () => {
      setLoadingContent(true);
      setError(null);
      try {
        const communityResponse = await communitiesApi.getById(communityId);
        const community = getCommunity(communityResponse);
        const communitySlug = community?.slug || creatorSlug || communityId;
        const [courseResult, eventResult, challengeResult, productResult] = await Promise.allSettled([
          coursesApi.getByCommunity(communitySlug, { page: 1, limit: 100 }),
          eventsApi.getAll({ communityId, page: 1, limit: 100 }),
          challengesApi.getByCommunity(communitySlug),
          productsApi.getByCommunity(communityId),
        ]);

        if (!active) return;

        setCourses(courseResult.status === "fulfilled" ? asArray(courseResult.value).map((course: any) => ({
          id: getId(course),
          title: course?.title || course?.name || "Untitled course",
          status: boolStatus(course),
          subtitle: course?.category || course?.level,
          metric: Number(course?.studentsCount ?? course?.enrollmentsCount ?? course?.enrolledCount ?? 0),
          metricLabel: "students",
          date: course?.createdAt,
          href: course?.slug ? `/${creatorSlug}/courses/${course.slug}` : undefined,
        })) : []);
        setEvents(eventResult.status === "fulfilled" ? normalizeEventListResponse(eventResult.value).map((event: any) => ({
          id: getId(event),
          title: event?.title || event?.name || "Untitled event",
          status: eventStatus(event),
          subtitle: event?.type || event?.category,
          metric: Number(event?.attendeesCount ?? event?.registrationsCount ?? event?.registeredCount ?? 0),
          metricLabel: "attendees",
          date: event?.startDate || event?.date,
          href: event?._id || event?.id ? `/${creatorSlug}/events/${event._id || event.id}` : undefined,
        })) : []);
        setChallenges(challengeResult.status === "fulfilled" ? asArray(challengeResult.value).map((challenge: any) => ({
          id: getId(challenge),
          title: challenge?.title || challenge?.name || "Untitled challenge",
          status: challengeStatus(challenge),
          subtitle: challenge?.category,
          metric: Number(challenge?.participantsCount ?? challenge?.submissionsCount ?? 0),
          metricLabel: "participants",
          date: challenge?.endDate || challenge?.createdAt,
          href: challenge?.slug ? `/${creatorSlug}/challenges/${challenge.slug}` : undefined,
        })) : []);
        setProducts(productResult.status === "fulfilled" ? asArray(productResult.value).map((product: any) => ({
          id: getId(product),
          title: product?.title || product?.name || "Untitled product",
          status: boolStatus(product),
          subtitle: product?.type || product?.category,
          metric: Number(product?.salesCount ?? product?.ordersCount ?? product?.purchasesCount ?? 0),
          metricLabel: "sales",
          date: product?.createdAt,
          href: product?._id || product?.id ? `/${creatorSlug}/products/${product._id || product.id}` : undefined,
        })) : []);
      } catch (err: any) {
        if (active) setError(err?.message || "Unable to load community content.");
      } finally {
        if (active) setLoadingContent(false);
      }
    };

    loadContent();
    return () => {
      active = false;
    };
  }, [communityId, creatorSlug, isLoading, canAccessDashboard, can]);

  const stats = useMemo(() => ({
    courseDrafts: courses.filter(item => item.status === "draft").length,
    upcomingEvents: events.filter(item => item.status === "upcoming").length,
    activeChallenges: challenges.filter(item => item.status === "active").length,
    publishedProducts: products.filter(item => item.status === "published").length,
  }), [courses, events, challenges, products]);

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

  const renderRows = (items: ContentItem[], emptyTitle: string, emptyDescription: string) => (
    <Card>
      {loadingContent ? (
        <DashboardLoading message="Loading live content..." />
      ) : items.length === 0 ? (
        <DashboardEmpty title={emptyTitle} description={emptyDescription} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Metric</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => {
              const StatusIcon = STATUS_CONFIG[item.status].icon;
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={STATUS_CONFIG[item.status].color}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(item.date)}</TableCell>
                  <TableCell className="text-right font-mono">{item.metric ?? 0} {item.metricLabel}</TableCell>
                  <TableCell>
                    {item.href ? (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={item.href}><ExternalLink className="h-4 w-4" /></Link>
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Card>
  );

  return (
    <DashboardShell variant="admin">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={basePath}><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Content Management</h1>
            <p className="mt-1 text-muted-foreground">Create and manage courses, events, challenges, and products from live community data.</p>
          </div>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Create New
          </Button>
        </div>
      </div>

      {error ? (
        <DashboardError message={error} retry={() => window.location.reload()} />
      ) : (
        <>
          <DashboardSection title="Content Overview" description="Counts are derived from fetched community content" className="mb-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total Courses" value={courses.length} description={`${stats.courseDrafts} drafts`} icon={BookOpen} isLoading={loadingContent} />
              <StatCard title="Events" value={events.length} description={`${stats.upcomingEvents} upcoming`} icon={Calendar} isLoading={loadingContent} />
              <StatCard title="Challenges" value={challenges.length} description={`${stats.activeChallenges} active`} icon={Award} isLoading={loadingContent} />
              <StatCard title="Products" value={products.length} description={`${stats.publishedProducts} published`} icon={ShoppingBag} isLoading={loadingContent} />
            </div>
          </DashboardSection>

          <Tabs value={tab} onValueChange={setTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="courses"><BookOpen className="mr-2 h-4 w-4 hidden sm:inline" />Courses</TabsTrigger>
              <TabsTrigger value="events"><Calendar className="mr-2 h-4 w-4 hidden sm:inline" />Events</TabsTrigger>
              <TabsTrigger value="challenges"><Award className="mr-2 h-4 w-4 hidden sm:inline" />Challenges</TabsTrigger>
              <TabsTrigger value="products"><ShoppingBag className="mr-2 h-4 w-4 hidden sm:inline" />Products</TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="space-y-4">
              {renderRows(courses, "No courses found", "No courses were returned for this community.")}
            </TabsContent>
            <TabsContent value="events" className="space-y-4">
              <FeatureGate feature="events" fallback={<LockedFeatureCard feature="Events" requiredPlan="growth" description="Create and manage events for your community. Upgrade to Growth plan to unlock." />}>
                {renderRows(events, "No events found", "No events were returned for this community.")}
              </FeatureGate>
            </TabsContent>
            <TabsContent value="challenges" className="space-y-4">
              <FeatureGate feature="challenges" fallback={<LockedFeatureCard feature="Challenges" requiredPlan="growth" description="Create and manage challenges for your community. Upgrade to Growth plan to unlock." />}>
                {renderRows(challenges, "No challenges found", "No challenges were returned for this community.")}
              </FeatureGate>
            </TabsContent>
            <TabsContent value="products" className="space-y-4">
              {renderRows(products, "No products found", "No products were returned for this community.")}
            </TabsContent>
          </Tabs>
        </>
      )}
    </DashboardShell>
  );
}
