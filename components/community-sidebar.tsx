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
import { LayoutDashboard, BookOpen, Zap, Calendar, MessageSquare, TrendingUp } from "lucide-react"

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
]

export function CommunitySidebar({ communitySlug }: CommunitySidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r">
      <SidebarHeader>
        <div className="px-3 py-2">
          <h2 className="text-lg font-semibold gradient-text">Community Hub</h2>
          <p className="text-sm text-muted-foreground">Your learning journey</p>
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

        {/* Challenge Progress Widget */}
        <SidebarGroup>
          <SidebarGroupLabel>Current Challenge</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-3 py-4 space-y-3">
              <div>
                <h4 className="text-sm font-medium">30-Day Coding Challenge</h4>
                <p className="text-xs text-muted-foreground">Day 18 of 30</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Progress</span>
                  <span>60%</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
              <Link
                href={`/community/${communitySlug}/challenge`}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                View Challenge →
              </Link>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Stats */}
        <SidebarGroup>
          <SidebarGroupLabel>Quick Stats</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-3 py-2 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Courses Completed</span>
                <span className="font-medium">2/5</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Learning Streak</span>
                <span className="font-medium">12 days</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Community Rank</span>
                <Badge variant="secondary" className="text-xs">
                  #47
                </Badge>
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
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <CommunitySidebar communitySlug={communitySlug} />
        <div className="flex-1">
          <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-4">
              <SidebarTrigger className="-ml-1" />
            </div>
          </div>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
