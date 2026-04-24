"use client";

import { useMemo, useState } from "react";
import { MetricCard } from "@/components/ui/metric-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Search,
  Users,
  Coins,
  Eye,
  Edit,
  Power,
  PowerOff,
  ClipboardList,
  Plus,
} from "lucide-react";


import Link from "next/link";
import { sessionsApi, type CreatorBookingViewModel } from "@/lib/api/sessions.api";
import { resolveImageUrl } from "@/lib/resolve-image-url";

import UpcomingSessionsCard from "./upcoming-sessions-card";
import PendingRequestsCard from "./pending-requests-card";
import MonthlyStatsCard from "./monthly-stats-card";
import GoogleCalendarIntegration from "./google-calendar-integration";

export default function ClientSessionsView({
  allSessions,
  allBookings,
  revenue,
  isSwitchLoading = false,
  onSessionsUpdate
}: {
  allSessions: any[];
  allBookings: CreatorBookingViewModel[];
  revenue?: number;
  isSwitchLoading?: boolean;
  onSessionsUpdate?: () => void;
}) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [updatingSession, setUpdatingSession] = useState<string | null>(null);

  const handleToggleSessionStatus = async (sessionId: string, currentStatus: boolean) => {
    // DISABLED FOR TESTING - Subscription check
    // If trying to publish (activate) a session, check subscription first
    // if (!currentStatus) {
    //   try {
    //     const hasSubscription = await subscriptionApi.hasActiveSubscription();
    //     if (!hasSubscription) {
    //       toast({
    //         title: 'Active subscription required',
    //         description: 'You need an active subscription to publish sessions. Please upgrade your plan to publish this session.',
    //         variant: 'destructive'
    //       });
    //       return;
    //     }
    //   } catch (subscriptionError) {
    //     console.error('Failed to check subscription status:', subscriptionError);
    //     // Continue with the API call even if subscription check fails
    //   }
    // }

    try {
      setUpdatingSession(sessionId);
      await sessionsApi.update(sessionId, { isActive: !currentStatus });
      toast({
        title: currentStatus ? 'Session unpublished' : 'Session published',
        description: `The session has been ${currentStatus ? 'unpublished' : 'published'} successfully.`
      });
      onSessionsUpdate?.();
    } catch (error: any) {
      console.error('Session update error:', error);

      // Provide user-friendly error messages
      let errorTitle = 'Failed to update session';
      let errorDescription = 'Please try again.';

      if (error?.message) {
        const message = error.message.toLowerCase();

        if (message.includes('abonnement actif') || message.includes('subscription')) {
          errorTitle = 'Active subscription required';
          errorDescription = 'You need an active subscription to publish sessions. Please upgrade your plan to publish this session.';
        } else if (message.includes('forbidden') || message.includes('autorisé')) {
          errorTitle = 'Permission denied';
          errorDescription = 'You don\'t have permission to modify this session.';
        } else if (message.includes('not found') || message.includes('trouvée')) {
          errorTitle = 'Session not found';
          errorDescription = 'The session could not be found. It may have been deleted.';
        } else {
          errorDescription = error.message;
        }
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive'
      });
    } finally {
      setUpdatingSession(null);
    }
  };

  const filteredSessions = allSessions.filter((session) => {
    const matchesSearch =
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "active") return matchesSearch && session.isActive;
    if (activeTab === "inactive") return matchesSearch && !session.isActive;
    return matchesSearch;
  });

  const bookingsRevenueFallback = allBookings.reduce((sum: number, b) => sum + Number(b.sessionPrice ?? 0), 0)

  const completedThisMonth = useMemo(() => allBookings.filter((b) => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const t = new Date(b.scheduledAt)
    return b.status === 'completed' && t >= startOfMonth && t <= now
  }), [allBookings])
  const hoursMentored = useMemo(() => completedThisMonth.reduce((h: number, b) => h + (Number(b.sessionDuration || 0) / 60), 0), [completedThisMonth])
  const monthRevenueFallback = useMemo(() => completedThisMonth.reduce((s: number, b) => s + Number(b.sessionPrice || 0), 0), [completedThisMonth])
  const averageRating = useMemo(() => {
    const ratings = allBookings
      .map((booking) => Number((booking as any)?.rating))
      .filter((rating) => Number.isFinite(rating) && rating > 0)

    if (ratings.length === 0) return undefined
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
  }, [allBookings])

  const stats = [
    {
      title: "Total Sessions",
      value: allSessions.length,
      icon: Calendar,
      color: "sessions" as const,
    },
    {
      title: "Active Sessions",
      value: allSessions.filter((s) => s.isActive).length,
      icon: Eye,
      color: "success" as const,
    },
    {
      title: "Total Bookings",
      value: allBookings.length,
      icon: Users,
      color: "primary" as const,
    },
    {
      title: "Session Revenue",
      value: `${Number(revenue ?? bookingsRevenueFallback).toLocaleString()} TND`,
      icon: Coins,
      color: "success" as const,
    },
  ];

  if (isSwitchLoading) {
    return (
      <div className="space-y-8 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-96 max-w-full" />
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  

  return (
    <div className="space-y-8 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text-sessions">Session Manager</h1>
          <p className="text-muted-foreground mt-2 text-lg">Manage your 1-on-1 mentoring sessions</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button variant="outline" size="sm" asChild>
            <Link href="/creator/sessions/bookings">
              <ClipboardList className="h-4 w-4 mr-2" /> All Bookings
            </Link>
          </Button>
          <Button size="sm" className="bg-sessions-500 hover:bg-sessions-600" asChild>
            <Link href="/creator/sessions/new"><Search className="h-4 w-4 mr-2" /> Create Session</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <MetricCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search sessions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Sessions ({allSessions.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({allSessions.filter((s) => s.isActive).length})</TabsTrigger>
              <TabsTrigger value="inactive">Inactive ({allSessions.filter((s) => !s.isActive).length})</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSessions.length > 0 ? (
                    filteredSessions.map((session) => {
                      const sessionCover = resolveImageUrl(session.thumbnail || session.image) || "/placeholder.svg"
                      return (
                        <div
                        key={session.id}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow hover:shadow-md transition flex flex-col relative"
                        >
                        <div className="-mx-4 -mt-4 mb-3 h-32 overflow-hidden rounded-t-xl bg-zinc-100 dark:bg-zinc-800">
                            <img
                              src={sessionCover}
                              alt={session.title || "Session cover"}
                              className="h-full w-full object-cover"
                            />
                        </div>
                        {/* Badge en position absolue */}
                        <div className="absolute top-4 right-4">
                            <Badge
                                variant={session.isActive ? "default" : "secondary"}
                                className={session.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                            >
                                {session.isActive ? "Published" : "Draft"}
                            </Badge>
                        </div>

                        {/* Titre - hauteur fixe */}
                        <div className="mb-3 pr-24">
                            <h4 className="text-lg font-semibold line-clamp-1">{session.title}</h4>
                        </div>

                        {/* Description - hauteur fixe */}
                        <div className="mb-3">
                            <p className="text-sm text-zinc-500 line-clamp-3">{session.description}</p>
                        </div>

                        {/* Durée et Prix - hauteur fixe */}
                        <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400 mb-3" style={{ height: '24px' }}>
                            <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {session.duration} min
                            </span>
                            <span className="font-medium">{session.price} TND</span>
                        </div>

                        {/* Catégorie - hauteur fixe */}
                        <div className="mb-3" style={{ height: '28px' }}>
                            {session.category && (
                                <Badge variant="outline" className="text-xs">
                                    {session.category}
                                </Badge>
                            )}
                        </div>

                        {/* Boutons - en bas, hauteur fixe */}
                        <div className="mt-auto flex items-center gap-2 w-full">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleSessionStatus(session.id, session.isActive)}
                                disabled={updatingSession === session.id}
                                className="flex-1 flex items-center justify-center gap-1"
                            >
                                {updatingSession === session.id ? (
                                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                ) : session.isActive ? (
                                    <PowerOff className="w-3 h-3" />
                                ) : (
                                    <Power className="w-3 h-3" />
                                )}
                                {session.isActive ? 'Unpublish' : 'Publish'}
                            </Button>
                            <Button size="sm" variant="outline" className="flex items-center justify-center" asChild>
                                <Link href={`/creator/sessions/${session.id}/edit`}>
                                    <Edit className="w-3 h-3" />
                                </Link>
                            </Button>
                        </div>
                        </div>
                      )
                    })
                    ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                        <Calendar className="h-16 w-16 text-zinc-300 dark:text-zinc-700 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No sessions found</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 text-center mb-6 max-w-md">
                          {activeTab === "all" 
                            ? "Get started by creating your first mentoring session."
                            : activeTab === "active"
                            ? "You don't have any active sessions yet. Publish a session to get started."
                            : "You don't have any inactive sessions."}
                        </p>
                        {activeTab !== "inactive" && (
                          <Button className="bg-sessions-500 hover:bg-sessions-600" asChild>
                            <Link href="/creator/sessions/new">
                              <Plus className="h-4 w-4 mr-2" />
                              Create Session
                            </Link>
                          </Button>
                        )}
                    </div>
                    )}
                </div>
                </TabsContent>

          </Tabs>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          <GoogleCalendarIntegration onConnectionUpdated={onSessionsUpdate} />
          <UpcomingSessionsCard bookings={allBookings} onBookingUpdated={onSessionsUpdate} />
          <PendingRequestsCard bookings={allBookings} onBookingUpdated={onSessionsUpdate} />
          <MonthlyStatsCard
            completed={completedThisMonth.length}
            hours={hoursMentored}
            revenue={revenue ?? monthRevenueFallback}
            avgRating={averageRating}
          />
        </div>
      </div>
    </div>
  );
}
