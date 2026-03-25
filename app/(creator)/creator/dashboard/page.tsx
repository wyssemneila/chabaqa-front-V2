"use client"

import { Badge } from "@/components/ui/badge"

import { useEffect, useRef, useState } from "react"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { MetricCard } from "@/components/ui/metric-card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  BookOpen,
  Zap,
  Calendar,
  Coins,
  TrendingUp,
  MessageSquare,
  Star,
  ArrowRight,
  Plus,
  Eye,
  FileText,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { CommunityManager } from "@/app/(creator)/creator/components/community-manager"
import { api } from "@/lib/api"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { useCommunityGuard } from "@/hooks/use-community-guard"
import { PageShell, PageState } from "@/components/creator-dashboard"
import { loadDashboardCoreCached, loadDashboardGrowthCached } from "@/app/(creator)/creator/context/community-switch-cache"


import { useAuthContext } from "@/app/providers/auth-provider"
import { useRouter } from "next/navigation"

export default function CreatorDashboardPage() {
  const router = useRouter()
  const { user: authUser, isAuthenticated, loading: authLoading } = useAuthContext()

  // Use shared community context with guard
  const {
    guard,
    communities: creatorCommunities,
    selectedCommunity,
    selectedCommunityId,
    isLoading: communityLoading
  } = useCommunityGuard()

  // Community feed URL for viewing the community
  const communityFeedUrl = selectedCommunity
    ? `/${encodeURIComponent(selectedCommunity.creator?.name || authUser?.name || 'creator')}/${selectedCommunity.slug}/home`
    : '/creator/posts'

  const [activeTab, setActiveTab] = useState("overview")
  const [isSwitchLoading, setIsSwitchLoading] = useState(true)
  const [isGrowthLoading, setIsGrowthLoading] = useState(false)
  const [creatorCourses, setCreatorCourses] = useState<any[]>([])
  const [creatorChallenges, setCreatorChallenges] = useState<any[]>([])
  const [creatorSessions, setCreatorSessions] = useState<any[]>([])
  const [creatorPosts, setCreatorPosts] = useState<any[]>([])
  const [userCommunities, setUserCommunities] = useState<any[]>([])
  const [overview, setOverview] = useState<any | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [membersCount, setMembersCount] = useState<number>(0)
  const [topContent, setTopContent] = useState<any[]>([])
  const [previousMonthCounts, setPreviousMonthCounts] = useState<{
    courses: number
    challenges: number
    sessions: number
    revenue: number
    engagement: number
  }>({ courses: 0, challenges: 0, sessions: 0, revenue: 0, engagement: 0 })
  const requestIdRef = useRef(0)

  // Helper function to calculate growth percentage
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) {
      return current > 0 ? { value: "+100%", trend: "up" as const } : { value: "0%", trend: "up" as const }
    }
    const growth = ((current - previous) / previous) * 100
    const rounded = Math.round(Math.abs(growth))
    const sign = growth >= 0 ? "+" : "-"
    return {
      value: `${sign}${rounded}%`,
      trend: growth >= 0 ? "up" as const : "down" as const
    }
  }

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/signin?redirect=/creator/dashboard')
    }
  }, [authLoading, isAuthenticated, router])

  // Reload data when selected community changes
  useEffect(() => {
    if (!isAuthenticated || authLoading || communityLoading) return
    if (!selectedCommunityId) {
      requestIdRef.current += 1
      setIsSwitchLoading(false)
      setIsGrowthLoading(false)
      setCreatorCourses([])
      setCreatorChallenges([])
      setCreatorSessions([])
      setCreatorPosts([])
      setOverview(null)
      setRecentActivity([])
      setTopContent([])
      setMembersCount(0)
      setPreviousMonthCounts({ courses: 0, challenges: 0, sessions: 0, revenue: 0, engagement: 0 })
      return
    }

    const requestId = ++requestIdRef.current

    const run = async () => {
      if (!creatorCommunities || creatorCommunities.length === 0) {
        router.push('/creator/communities/create')
        return
      }

      setIsSwitchLoading(true)
      setIsGrowthLoading(true)
      setUserCommunities(creatorCommunities)

      // Clear previous-community data immediately to avoid stale UI while switching.
      setCreatorCourses([])
      setCreatorChallenges([])
      setCreatorSessions([])
      setCreatorPosts([])
      setOverview(null)
      setRecentActivity([])
      setTopContent([])
      setMembersCount(0)
      setPreviousMonthCounts({ courses: 0, challenges: 0, sessions: 0, revenue: 0, engagement: 0 })

      try {
        const core = await loadDashboardCoreCached(selectedCommunityId)
        if (requestId !== requestIdRef.current) return

        const courses = Array.isArray(core.courses) ? core.courses : []
        const challenges = Array.isArray(core.challenges) ? core.challenges : []
        const sessions = Array.isArray(core.sessions) ? core.sessions : []

        setCreatorCourses(courses)
        setCreatorChallenges(challenges)
        setCreatorSessions(sessions)
        setCreatorPosts(Array.isArray(core.posts) ? core.posts : [])
        setOverview(core.overview)

        const recentActivityItems: any[] = []

        if (courses.length > 0) {
          const recentCourses = courses
            .filter((course: any) => course.createdAt)
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 2)
            .map((course: any) => {
              const title = course.title || course.titre || 'Untitled course'
              const enrollmentsCount = Array.isArray(course.enrollments) ? course.enrollments.length : 0
              return ({
                id: `course-${course.id}`,
                title: `New course: ${title}`,
                message: `${enrollmentsCount} students enrolled`,
                type: 'course_created',
                createdAt: course.createdAt
              })
            })
          recentActivityItems.push(...recentCourses)
        }

        if (challenges.length > 0) {
          const recentChallenges = challenges
            .filter((challenge: any) => challenge.startDate)
            .sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
            .slice(0, 2)
            .map((challenge: any) => ({
              id: `challenge-${challenge.id}`,
              title: `New challenge: ${challenge.title}`,
              message: `${challenge.participants?.length || 0} participants joined`,
              type: 'challenge_created',
              createdAt: challenge.startDate
            }))
          recentActivityItems.push(...recentChallenges)
        }

        if (sessions.length > 0) {
          const recentSessions = sessions
            .filter((session: any) => session.createdAt)
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 1)
            .map((session: any) => ({
              id: `session-${session.id}`,
              title: `New session: ${session.title}`,
              message: `Scheduled for your community`,
              type: 'session_created',
              createdAt: session.createdAt
            }))
          recentActivityItems.push(...recentSessions)
        }

        setRecentActivity(
          recentActivityItems
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
        )

        const communityMembersCount = (selectedCommunity as any)?.membersCount || (selectedCommunity as any)?.members || 0
        setMembersCount(typeof communityMembersCount === 'number' ? communityMembersCount : 0)

        const topContentItems: any[] = []

        if (courses.length > 0) {
          const topCourses = [...courses]
            .sort((a: any, b: any) => (b.enrollments?.length || 0) - (a.enrollments?.length || 0))
            .slice(0, 2)
            .map((course: any) => ({
              id: course.id,
              title: course.title || course.titre || 'Untitled course',
              type: 'course',
              metricLabel: 'enrolled',
              metricValue: course.enrollments?.length || 0,
              href: `/creator/courses/${course.id}/manage`
            }))
          topContentItems.push(...topCourses)
        }

        if (challenges.length > 0) {
          const topChallenges = [...challenges]
            .sort((a: any, b: any) => (b.participants?.length || 0) - (a.participants?.length || 0))
            .slice(0, 1)
            .map((challenge: any) => ({
              id: challenge.id,
              title: challenge.title || challenge.titre || 'Untitled challenge',
              type: 'challenge',
              metricLabel: 'participants',
              metricValue: challenge.participants?.length || 0,
              href: `/creator/challenges/${challenge.id}/manage`
            }))
          topContentItems.push(...topChallenges)
        }

        if (sessions.length > 0) {
          const topSessions = [...sessions]
            .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
            .slice(0, 1)
            .map((session: any) => ({
              id: session.id,
              title: session.title || session.name || 'Untitled session',
              type: 'session',
              metricLabel: 'scheduled',
              metricValue: 1,
              href: `/creator/sessions/${session.id}/manage`
            }))
          topContentItems.push(...topSessions)
        }

        setTopContent(topContentItems.sort((a, b) => b.metricValue - a.metricValue).slice(0, 4))
      } catch (e) {
        console.error('[Dashboard] Core load error:', e)
      } finally {
        if (requestId === requestIdRef.current) {
          setIsSwitchLoading(false)
        }
      }

      try {
        const growth = await loadDashboardGrowthCached(selectedCommunityId)
        if (requestId !== requestIdRef.current) return
        setPreviousMonthCounts(growth)
      } catch (e) {
        console.error('[Dashboard] Growth load error:', e)
      } finally {
        if (requestId === requestIdRef.current) {
          setIsGrowthLoading(false)
        }
      }
    }

    void run()
  }, [isAuthenticated, authLoading, authUser, communityLoading, selectedCommunityId, selectedCommunity, creatorCommunities, router])

  // Auto-backfill analytics if data is empty
  useEffect(() => {
    if (overview === null && !isSwitchLoading && isAuthenticated) {
      const backfill = async () => {
        try {
          console.log('[Dashboard] Analytics data is empty, triggering backfill...');
          await api.creatorAnalytics.backfill(90);
          // Optionally, you can reload the data here to reflect the backfilled analytics
        } catch (error) {
          console.error('[Dashboard] Analytics backfill failed:', error);
        }
      };
      backfill();
    }
  }, [overview, isSwitchLoading, isAuthenticated]);

  const getGrowthChange = (current: number, previous: number) => {
    if (isGrowthLoading) {
      return { value: "...", trend: "up" as const }
    }
    return calculateGrowth(current, previous)
  }

  const currentRevenueValue = (() => {
    const raw = overview?.revenue?.total ?? overview?.totalRevenue ?? overview?.salesTotal ?? 0
    const normalized = Number(raw)
    return Number.isFinite(normalized) ? normalized : 0
  })()

  const stats = [
    {
      title: "Total Members",
      value: membersCount || (selectedCommunity as any)?.membersCount || (selectedCommunity as any)?.members || 0,
      icon: Users,
      color: "primary" as const,
    },
    {
      title: "Total Courses",
      value: creatorCourses?.length || 0,
      change: getGrowthChange(creatorCourses?.length || 0, previousMonthCounts.courses),
      icon: BookOpen,
      color: "courses" as const,
    },
    {
      title: "Total Challenges",
      value: creatorChallenges?.length || 0,
      change: getGrowthChange(creatorChallenges?.length || 0, previousMonthCounts.challenges),
      icon: Zap,
      color: "challenges" as const,
    },
    {
      title: "Total Sessions",
      value: creatorSessions?.length || 0,
      change: getGrowthChange(creatorSessions?.length || 0, previousMonthCounts.sessions),
      icon: Calendar,
      color: "sessions" as const,
    },
    {
      title: "Total Revenue",
      value: (() => {
        try { return `${currentRevenueValue.toLocaleString()} TND` } catch { return `${currentRevenueValue} TND` }
      })(),
      change: (() => {
        return getGrowthChange(currentRevenueValue, previousMonthCounts.revenue)
      })(),
      icon: Coins,
      color: "success" as const,
    },
    {
      title: "Avg. Engagement",
      value: (() => {
        const eng = overview?.engagementRate || overview?.avgEngagement || 0
        const pct = typeof eng === 'number' ? Math.round(eng) : eng
        return `${pct}%`
      })(),
      change: (() => {
        const currentEng = overview?.engagementRate || overview?.avgEngagement || 0
        const currentEngNum = typeof currentEng === 'number' ? currentEng : 0
        return getGrowthChange(currentEngNum, previousMonthCounts.engagement)
      })(),
      icon: TrendingUp,
      color: "primary" as const,
    },
  ]

  if (guard) return guard

  return (
    <PageShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Creator Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back! Here is what is happening with your creator content.</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Content
            </Button>
            {isSwitchLoading ? (
              <Button size="sm" disabled>
                <Eye className="h-4 w-4 mr-2" />
                View Community
              </Button>
            ) : (
              <Button size="sm" asChild>
                <Link href={communityFeedUrl}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Community
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {isSwitchLoading ? (
            [0, 1, 2, 3, 4, 5].map((index) => (
              <Skeleton key={index} className="h-32 rounded-xl" />
            ))
          ) : (
            stats.map((stat) => (
              <MetricCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                change={stat.change}
                icon={stat.icon}
                color={stat.color}
              />
            ))
          )}
        </div>

        {/* Content Tabs */}
        <EnhancedCard className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Content Management</CardTitle>
            <CardDescription>Manage your courses, challenges, sessions and posts</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="courses">Courses</TabsTrigger>
                <TabsTrigger value="challenges">Challenges</TabsTrigger>
                <TabsTrigger value="sessions">Sessions</TabsTrigger>
                <TabsTrigger value="posts">Posts</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Recent Activity */}
                  <EnhancedCard>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MessageSquare className="h-5 w-5 mr-2 text-primary-500" />
                        Recent Activity
                      </CardTitle>
                      <CardDescription>Latest interactions across your content</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {isSwitchLoading && (
                          <>
                            <Skeleton className="h-16 w-full rounded-lg" />
                            <Skeleton className="h-16 w-full rounded-lg" />
                            <Skeleton className="h-16 w-full rounded-lg" />
                          </>
                        )}
                        {!isSwitchLoading && recentActivity.length === 0 && (
                          <div className="text-sm text-muted-foreground">No recent activity.</div>
                        )}
                        {!isSwitchLoading && recentActivity.map((n, idx) => (
                          <div key={n.id || idx} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{n.title || n.message || n.type || 'Activity'}</p>
                              <p className="text-xs text-muted-foreground">{new Date(n.createdAt || Date.now()).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </EnhancedCard>

                  {/* Top Performing Content */}
                  <EnhancedCard>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Star className="h-5 w-5 mr-2 text-yellow-500" />
                        Top Performing Content
                      </CardTitle>
                      <CardDescription>Your most popular courses, challenges, and sessions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {isSwitchLoading && (
                          <>
                            <Skeleton className="h-16 w-full rounded-lg" />
                            <Skeleton className="h-16 w-full rounded-lg" />
                          </>
                        )}
                        {!isSwitchLoading && topContent.length === 0 && (
                          <div className="text-sm text-muted-foreground">No top content yet.</div>
                        )}
                        {!isSwitchLoading && topContent.map((item) => {
                          const Icon = item.type === 'course' ? BookOpen : item.type === 'challenge' ? Zap : Calendar
                          const bg = item.type === 'course' ? 'bg-courses-50' : item.type === 'challenge' ? 'bg-challenges-50' : 'bg-sessions-50'
                          const iconColor = item.type === 'course' ? 'text-courses-500' : item.type === 'challenge' ? 'text-challenges-500' : 'text-sessions-500'
                          return (
                            <div key={`${item.type}-${item.id}`} className={`flex items-center space-x-3 p-3 ${bg} rounded-lg`}>
                              <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0`} />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.title}</p>
                                <p className="text-xs text-muted-foreground">{item.type.charAt(0).toUpperCase() + item.type.slice(1)} • {item.metricValue} {item.metricLabel}</p>
                              </div>
                              <Link href={item.href} className="text-sm text-primary-500 flex items-center">
                                View <ArrowRight className="h-3 w-3 ml-1" />
                              </Link>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </EnhancedCard>
                </div>
              </TabsContent>

              <TabsContent value="courses">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {creatorCourses.map((course) => {
                    const enrollmentCount = Array.isArray(course.enrollments) ? course.enrollments.length : (course.enrollmentCount || 0)
                    return (
                      <EnhancedCard key={course.id} hover className="overflow-hidden">
                        <div className="relative w-full aspect-video overflow-hidden">
                          <Image
                            src={course.thumbnail || "/placeholder.svg?height=1080&width=1920&query=course+thumbnail"}
                            alt={course.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-courses-500 text-white">
                              {course.prix > 0 ? `${course.prix} ${course.devise || 'TND'}` : 'Free'}
                            </Badge>
                          </div>
                        </div>
                        <CardHeader>
                          <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                          <CardDescription className="line-clamp-3">{course.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Users className="h-4 w-4 mr-1" />
                            {enrollmentCount} enrolled
                          </div>
                          <Button size="sm" asChild>
                            <Link href={`/creator/courses/${course.id}/manage`}>Manage</Link>
                          </Button>
                        </CardContent>
                      </EnhancedCard>
                    )
                  })}
                  {creatorCourses.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                      <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <h3 className="text-lg font-medium text-gray-900">No courses yet</h3>
                      <p className="text-gray-500 mb-4">Create your first course to share knowledge with your community.</p>
                      <Button asChild className="bg-courses-500 hover:bg-courses-600">
                         <Link href="/creator/courses/new">Create Course</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="challenges">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {creatorChallenges.map((challenge) => {
                    const participantsCount = Array.isArray(challenge.participants) ? challenge.participants.length : (challenge.participantsCount || 0)
                    return (
                      <EnhancedCard key={challenge.id} hover className="overflow-hidden">
                        <div className="relative h-48 bg-gradient-to-r from-challenges-500 to-orange-500 p-6 text-white flex flex-col justify-center">
                          <Badge className="absolute top-3 right-3 bg-white/20 text-white hover:bg-white/30 border-0">
                            {challenge.price > 0 ? `$${challenge.price}` : 'Free'}
                          </Badge>
                          <Zap className="h-10 w-10 mb-3 opacity-90" />
                          <h3 className="text-xl font-bold line-clamp-2 mb-1">{challenge.title}</h3>
                          <p className="text-challenges-100 text-sm line-clamp-2 opacity-90">{challenge.description}</p>
                        </div>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Users className="h-4 w-4 mr-1 text-challenges-500" />
                              <span className="font-medium text-gray-900 mr-1">{participantsCount}</span> participants
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {challenge.difficulty || 'All levels'}
                            </Badge>
                          </div>
                          <Button size="sm" className="w-full bg-challenges-500 hover:bg-challenges-600" asChild>
                            <Link href={`/creator/challenges/${challenge.id}/manage`}>Manage Challenge</Link>
                          </Button>
                        </CardContent>
                      </EnhancedCard>
                    )
                  })}
                  {creatorChallenges.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                      <Zap className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <h3 className="text-lg font-medium text-gray-900">No challenges yet</h3>
                      <p className="text-gray-500 mb-4">Create your first community challenge to engage your members.</p>
                      <Button asChild className="bg-challenges-500 hover:bg-challenges-600">
                         <Link href="/creator/challenges/create">Create Challenge</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="sessions">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {creatorSessions.map((session) => (
                    <EnhancedCard key={session.id} hover className="overflow-hidden">
                      <div className="relative h-48 bg-gradient-to-r from-sessions-500 to-indigo-500 p-6 text-white flex flex-col justify-center items-center text-center">
                        <Calendar className="h-12 w-12 mb-3 opacity-90" />
                        <h3 className="text-xl font-bold line-clamp-2">{session.title}</h3>
                        <Badge className="mt-2 bg-white/20 text-white hover:bg-white/30 border-0">
                          {session.duration || 60} mins
                        </Badge>
                      </div>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center text-sm font-medium text-gray-900">
                             <Coins className="h-4 w-4 mr-1 text-green-600" />
                             {session.price > 0 ? `${session.price} TND` : 'Free'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            1-on-1 Session
                          </div>
                        </div>
                        <Button size="sm" className="w-full bg-sessions-500 hover:bg-sessions-600" asChild>
                          <Link href={`/creator/sessions/${session.id}/manage`}>Manage Session</Link>
                        </Button>
                      </CardContent>
                    </EnhancedCard>
                  ))}
                  {creatorSessions.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                      <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <h3 className="text-lg font-medium text-gray-900">No sessions yet</h3>
                      <p className="text-gray-500 mb-4">Start offering 1-on-1 coaching or consulting sessions.</p>
                      <Button asChild>
                         <Link href="/creator/sessions/create">Create Session</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="posts">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {creatorPosts.map((post) => {
                    const commentsCount = Array.isArray(post.comments) ? post.comments.length : (post.commentsCount || 0)
                    const likesCount = post.likes?.length || post.likesCount || 0
                    return (
                      <EnhancedCard key={post.id} hover className="overflow-hidden">
                        <div className="relative h-48 bg-gray-100">
                          {post.thumbnail ? (
                            <Image
                              src={post.thumbnail}
                              alt={post.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                              <FileText className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-black/50 text-white backdrop-blur-sm border-0 capitalize">
                              {post.category || 'Post'}
                            </Badge>
                          </div>
                        </div>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
                          <CardDescription className="line-clamp-2">{post.excerpt || post.content?.substring(0, 100)}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center">
                                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                                {commentsCount}
                              </div>
                              <div className="flex items-center">
                                <Star className="h-3.5 w-3.5 mr-1" />
                                {likesCount}
                              </div>
                            </div>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <Button size="sm" variant="outline" className="w-full" asChild>
                            <Link href={`/creator/posts?edit=${post.id}`}>Edit Post</Link>
                          </Button>
                        </CardContent>
                      </EnhancedCard>
                    )
                  })}
                  {creatorPosts.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                      <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <h3 className="text-lg font-medium text-gray-900">No posts yet</h3>
                      <p className="text-gray-500 mb-4">Share updates, articles, or announcements with your community.</p>
                      <Button asChild>
                         <Link href={communityFeedUrl}>Create Your First Post</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </EnhancedCard>

        {/* Community Manager */}
        <CommunityManager communities={userCommunities} />
      </div>
    </PageShell>
  )
}
