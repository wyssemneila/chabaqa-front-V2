"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  LayoutDashboard,
  BookOpen,
  Zap,
  Calendar,
  MessageSquare,
  TrendingUp,
  Trophy,
  Target,
  Clock,
  Users,
} from "lucide-react"
import { AppHeader } from "@/components/layout/app-header"
import { communitiesApi } from "@/lib/api/communities.api"
import { coursesApi } from "@/lib/api/courses.api"
import { progressionApi } from "@/lib/api/progression.api"
import { achievementsApi } from "@/lib/api/achievements.api"
import { sessionsCommunityApi } from "@/lib/api/sessions-community.api"
import { postsApi } from "@/lib/api/posts.api"
import { challengesApi } from "@/lib/api/challenges.api"

interface CommunitySidebarProps {
  communitySlug: string
}

type SidebarMenuEntry = {
  title: string
  url: string
  icon: typeof LayoutDashboard
  badge?: string
  color?: "courses" | "challenges" | "sessions"
}

const baseMenuItems: SidebarMenuEntry[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Courses",
    url: "/courses",
    icon: BookOpen,
    color: "courses",
  },
  {
    title: "My Challenge",
    url: "/challenge",
    icon: Zap,
    color: "challenges",
  },
  {
    title: "1-on-1 Sessions",
    url: "/sessions",
    icon: Calendar,
    color: "sessions",
  },
  {
    title: "Booking Calendar",
    url: "/calendar",
    icon: Calendar,
  },
  {
    title: "Posts Feed",
    url: "/posts",
    icon: MessageSquare,
  },
  {
    title: "Progress Tracking",
    url: "/progress",
    icon: TrendingUp,
  },
  {
    title: "Achievements",
    url: "/achievements",
    icon: Trophy,
  },
]

type SidebarData = {
  community: any | null
  activeCourses: number
  completedCourses: number
  bookedSessions: number
  recentPosts: number
  overallProgress: number
  learningStreak: number | null
  rank: number | null
  activeChallenge: any | null
  challengeProgress: number
  challengeDay: number | null
  challengeDaysLeft: number | null
  challengeParticipants: number
  achievements: any[]
}

const emptySidebarData: SidebarData = {
  community: null,
  activeCourses: 0,
  completedCourses: 0,
  bookedSessions: 0,
  recentPosts: 0,
  overallProgress: 0,
  learningStreak: null,
  rank: null,
  activeChallenge: null,
  challengeProgress: 0,
  challengeDay: null,
  challengeDaysLeft: null,
  challengeParticipants: 0,
  achievements: [],
}

const unwrap = (value: any) => value?.data?.data ?? value?.data ?? value ?? {}
const asArray = (value: any): any[] => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.data?.data)) return value.data.data
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.docs)) return value.docs
  if (Array.isArray(value?.enrollments)) return value.enrollments
  if (Array.isArray(value?.participations)) return value.participations
  return []
}

function useCommunitySidebarData(slug: string) {
  const [data, setData] = useState<SidebarData>(emptySidebarData)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      setIsLoading(true)
      try {
        const communityResponse = await communitiesApi.getBySlug(slug)
        const community = unwrap(communityResponse)
        const communityId = community?._id || community?.id

        const [enrollmentsResult, progressionResult, achievementsResult, bookingsResult, postsResult, challengesResult, participationsResult] = await Promise.allSettled([
          coursesApi.getMyEnrollments(),
          progressionApi.getOverview({ communityId, communitySlug: slug }),
          achievementsApi.getUserAchievements({ communitySlug: slug }),
          sessionsCommunityApi.getUserBookings({ communityId, communitySlug: slug }),
          communityId ? postsApi.getByCommunity(communityId, { page: 1, limit: 1 }) : Promise.resolve(null),
          challengesApi.getByCommunity(slug),
          challengesApi.getMyParticipations({ communitySlug: slug, status: "active" }),
        ])

        if (!active) return

        const enrollments = enrollmentsResult.status === "fulfilled" ? asArray(enrollmentsResult.value) : []
        const progression = progressionResult.status === "fulfilled" ? progressionResult.value as any : {}
        const achievements = achievementsResult.status === "fulfilled" ? achievementsResult.value : []
        const bookings = bookingsResult.status === "fulfilled" ? bookingsResult.value : []
        const postTotal = postsResult.status === "fulfilled" ? Number((postsResult.value as any)?.pagination?.total ?? 0) : 0
        const challenges = challengesResult.status === "fulfilled" ? asArray(challengesResult.value) : []
        const participations = participationsResult.status === "fulfilled" ? asArray(participationsResult.value) : []
        const activeChallenge = participations[0]?.challenge || challenges.find(challenge => challenge?.isActive !== false) || null
        const startedAt = participations[0]?.startedAt || participations[0]?.createdAt
        const endDate = activeChallenge?.endDate
        const challengeDay = startedAt ? Math.max(1, Math.floor((Date.now() - new Date(startedAt).getTime()) / 86_400_000) + 1) : null
        const challengeDaysLeft = endDate ? Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000)) : null

        setData({
          community,
          activeCourses: enrollments.filter((item: any) => String(item?.status || "").toLowerCase() !== "completed").length,
          completedCourses: enrollments.filter((item: any) => String(item?.status || "").toLowerCase() === "completed" || Number(item?.progressPercent ?? item?.progress ?? 0) >= 100).length,
          bookedSessions: bookings.length,
          recentPosts: postTotal,
          overallProgress: Math.round(Number(progression?.overallProgress ?? progression?.averageProgress ?? progression?.completionPercentage ?? 0)),
          learningStreak: progression?.streakDays ?? progression?.learningStreak ?? null,
          rank: progression?.communityRank ?? progression?.rank ?? null,
          activeChallenge,
          challengeProgress: Math.round(Number(participations[0]?.progress ?? participations[0]?.progressPercent ?? 0)),
          challengeDay,
          challengeDaysLeft,
          challengeParticipants: Number(activeChallenge?.participantsCount ?? activeChallenge?.participants?.length ?? 0),
          achievements: achievements.slice(0, 2),
        })
      } catch {
        if (active) setData(emptySidebarData)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [slug])

  return { data, isLoading }
}

export function CommunitySidebar({ communitySlug }: CommunitySidebarProps) {
  const pathname = usePathname()
  const { data, isLoading } = useCommunitySidebarData(communitySlug)
  const community = data.community
  const menuItems = useMemo(() => baseMenuItems.map(item => {
    if (item.url === "/courses") return { ...item, badge: data.activeCourses > 0 ? `${data.activeCourses} Active` : undefined }
    if (item.url === "/challenge") return { ...item, badge: data.challengeDay ? `Day ${data.challengeDay}` : undefined }
    if (item.url === "/sessions") return { ...item, badge: data.bookedSessions > 0 ? `${data.bookedSessions} Booked` : undefined }
    if (item.url === "/posts") return { ...item, badge: data.recentPosts > 0 ? `${data.recentPosts} Posts` : undefined }
    return item
  }), [data])

  return (
    <Sidebar className="border-r hidden lg:block w-64 shrink-0 sticky top-24 self-start space-y-6">
      <SidebarHeader>
        <div className="px-3 py-2">
          <div className="flex items-center space-x-3">
            {community && (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: community.settings?.primaryColor || community.primaryColor || '#7c3aed' }}
              >
                {(community.name || "C").charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold gradient-text">Community Hub</h2>
              <p className="text-sm text-muted-foreground">Your learning journey</p>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const href = `/community/${communitySlug}${item.url}`
                const isActive = pathname === href

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "group relative pl-3 transition-all duration-300 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-0 before:bg-[#8e78fb] before:rounded-r-md before:transition-all before:duration-300",
                        isActive && "before:h-3/4 text-[#8e78fb]"
                      )}
                    >
                      <Link href={href}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                        {item.badge && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              "ml-auto text-xs",
                              item.color === "courses" && "bg-courses-100 text-courses-700",
                              item.color === "challenges" && "bg-challenges-100 text-challenges-700",
                              item.color === "sessions" && "bg-sessions-100 text-sessions-700",
                            )}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Active Challenge Widget */}
        {data.activeChallenge && (
          <SidebarGroup>
            <SidebarGroupLabel>Current Challenge</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-3 py-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-challenges-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-4 w-4 text-challenges-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{data.activeChallenge.title || data.activeChallenge.name}</h4>
                    <p className="text-xs text-muted-foreground">{data.challengeDay ? `Day ${data.challengeDay}` : "In progress"}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Your Progress</span>
                    <span>{data.challengeProgress}%</span>
                  </div>
                  <Progress value={data.challengeProgress} className="h-2" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {data.challengeDaysLeft !== null ? `${data.challengeDaysLeft} days left` : "Ends later"}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Users className="h-3 w-3 mr-1" />
                    {data.challengeParticipants}
                  </div>
                </div>
                <Link
                  href={`/community/${communitySlug}/challenge`}
                  className="text-xs text-challenges-600 hover:text-challenges-700 font-medium flex items-center"
                >
                  <Target className="h-3 w-3 mr-1" />
                  View Challenge →
                </Link>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Learning Stats */}
        <SidebarGroup>
          <SidebarGroupLabel>Learning Stats</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-3 py-2 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Courses Enrolled</span>
                <span className="font-medium">{isLoading ? "..." : data.activeCourses + data.completedCourses}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium">
                  {isLoading ? "..." : data.completedCourses}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Learning Streak</span>
                <div className="flex items-center">
                  <span className="font-medium">{data.learningStreak !== null ? `${data.learningStreak} days` : "No data"}</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full ml-2" />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Community Rank</span>
                <Badge variant="secondary" className="text-xs bg-primary-100 text-primary-700">
                  {data.rank ? `#${data.rank}` : "No data"}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Overall Progress</span>
                  <span>{data.overallProgress}%</span>
                </div>
                <Progress value={data.overallProgress} className="h-2" />
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent Achievements */}
        <SidebarGroup>
          <SidebarGroupLabel>Recent Achievements</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-3 py-2 space-y-2">
              {data.achievements.length === 0 ? (
                <p className="px-2 text-xs text-muted-foreground">No achievements yet.</p>
              ) : data.achievements.map((achievement: any) => (
                <div key={achievement?._id || achievement?.id || achievement?.title} className="flex items-center space-x-2 p-2 bg-primary-50 rounded-lg">
                  <Trophy className="h-4 w-4 text-primary-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{achievement?.title || achievement?.name || "Achievement"}</p>
                    <p className="text-xs text-muted-foreground">{achievement?.description || "Unlocked from your activity"}</p>
                  </div>
                </div>
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

export function CommunityLayout({
  children,
  communitySlug,
}: {
  children: React.ReactNode
  communitySlug: string
}) {
  return (
    <div className="min-h-screen">
      <AppHeader userType="member" currentCommunity={communitySlug} showCommunitySelector={true} />
      <SidebarProvider>
        <div className="flex min-h-[calc(100vh-4rem)] w-full">
          <CommunitySidebar communitySlug={communitySlug} />
          <div className="flex-1">
            <div className="sticky top-16 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-14 items-center px-4">
                <SidebarTrigger className="-ml-1" />
              </div>
            </div>
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  )
}
