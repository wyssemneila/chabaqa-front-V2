"use client"

import type React from "react"

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
import {
  getCommunityBySlug,
  getUserEnrollments,
  getActiveChallengesByCommunity,
  getUserChallengeParticipation,
} from "@/lib/mock-data"

interface CommunitySidebarProps {
  communitySlug: string
}

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Courses",
    url: "/courses",
    icon: BookOpen,
    badge: "3 Active",
    color: "courses",
  },
  {
    title: "My Challenge",
    url: "/challenge",
    icon: Zap,
    badge: "Day 18",
    color: "challenges",
  },
  {
    title: "1-on-1 Sessions",
    url: "/sessions",
    icon: Calendar,
    badge: "1 Booked",
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
    badge: "12 New",
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

export function CommunitySidebar({ communitySlug }: CommunitySidebarProps) {
  const pathname = usePathname()
  const community = getCommunityBySlug(communitySlug)
  const userEnrollments = getUserEnrollments("2")
  const challenges = getActiveChallengesByCommunity(community?.id || "")
  const userChallenge = challenges.length > 0 ? getUserChallengeParticipation("2", challenges[0].id) : null

  return (
    <Sidebar className="border-r">
      <SidebarHeader>
        <div className="px-3 py-2">
          <div className="flex items-center space-x-3">
            {community && (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: community.settings?.primaryColor || '#7c3aed' }}
              >
                {community.name.charAt(0)}
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
                    <SidebarMenuButton asChild isActive={isActive} className="group">
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
        {userChallenge && challenges.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Current Challenge</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-3 py-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-challenges-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-4 w-4 text-challenges-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{challenges[0].title}</h4>
                    <p className="text-xs text-muted-foreground">Day 18 of 30</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Your Progress</span>
                    <span>{userChallenge.progress}%</span>
                  </div>
                  <Progress value={userChallenge.progress} className="h-2" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    12 days left
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Users className="h-3 w-3 mr-1" />
                    {challenges[0].participants.length}
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
                <span className="font-medium">{userEnrollments.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium">
                  {userEnrollments.reduce((acc, e) => acc + e.progress.filter((p) => p.isCompleted).length, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Learning Streak</span>
                <div className="flex items-center">
                  <span className="font-medium">12 days</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full ml-2" />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Community Rank</span>
                <Badge variant="secondary" className="text-xs bg-primary-100 text-primary-700">
                  #47
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Overall Progress</span>
                  <span>68%</span>
                </div>
                <Progress value={68} className="h-2" />
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent Achievements */}
        <SidebarGroup>
          <SidebarGroupLabel>Recent Achievements</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-3 py-2 space-y-2">
              <div className="flex items-center space-x-2 p-2 bg-primary-50 rounded-lg">
                <Trophy className="h-4 w-4 text-primary-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">12-Day Streak!</p>
                  <p className="text-xs text-muted-foreground">Keep it up!</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-courses-50 rounded-lg">
                <BookOpen className="h-4 w-4 text-courses-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">Course Completed</p>
                  <p className="text-xs text-muted-foreground">HTML Fundamentals</p>
                </div>
              </div>
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
