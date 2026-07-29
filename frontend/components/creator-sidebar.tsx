"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  BookOpen,
  Zap,
  Users,
  FileText,
  Palette,
  Calendar,
  Settings,
  ChevronDown,
  Plus,
  LogOut,
  User,
  Loader2,
} from "lucide-react"

const menuItems = [
  {
    title: "Dashboard",
    url: "/creator/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Course Manager",
    url: "/creator/courses",
    icon: BookOpen,
    badge: "0",
    color: "courses",
    key: "courses",
  },
  {
    title: "Challenge Manager",
    url: "/creator/challenges",
    icon: Zap,
    badge: "0",
    color: "challenges",
    key: "challenges",
  },
  {
    title: "Session Manager",
    url: "/creator/sessions",
    icon: Calendar,
    badge: "0",
    color: "sessions",
    key: "sessions",
  },
  {
    title: "Post Editor",
    url: "/creator/posts",
    icon: FileText,
    badge: "0",
    key: "posts",
  },
  {
    title: "Community Members",
    url: "/creator/members",
    icon: Users,
    badge: "0",
    key: "members",
  },
  {
    title: "Landing Page",
    url: "/creator/landing",
    icon: Palette,
  },
  {
    title: "Settings",
    url: "/creator/settings",
    icon: Settings,
  },
]

// Color palette for communities
const COMMUNITY_COLORS = [
  "#8e78fb",
  "#47c7ea",
  "#f65887",
  "#ffa500",
  "#52c41a",
  "#1890ff",
  "#eb2f96",
  "#faad14",
]

function getColorForCommunity(index: number): string {
  return COMMUNITY_COLORS[index % COMMUNITY_COLORS.length]
}

export function CreatorSidebar() {
  const pathname = usePathname()
  const [selectedCommunity, setSelectedCommunity] = useState<any>(null)
  const [communities, setCommunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<{ name?: string; email?: string; photo_profil?: string; profile_picture?: string } | null>(null)
  const [counts, setCounts] = useState<Record<string, string>>({
    courses: "0",
    challenges: "0",
    sessions: "0",
    posts: "0",
    members: "0",
  })

  // Fetch counts for sidebar badges
  const fetchCounts = async () => {
    try {
      // Get current user ID
      const me = await api.auth.me().catch(() => null)
      const user = me?.data || (me as any)?.user || null
      const userId = user?._id || user?.id

      if (!userId) return
      setCurrentUser(user)

      // Fetch all counts in parallel
      const [coursesRes, challengesRes, sessionsRes, postsRes] = await Promise.all([
        api.courses.getByCreator(userId, { limit: 1 }).catch(() => ({ data: { courses: [], pagination: { total: 0, page: 1, limit: 1, totalPages: 0 } } })),
        api.challenges.getByCreator(userId, { limit: 1, status: 'active' } as any).catch(() => ({ data: { courses: [], pagination: { total: 0, page: 1, limit: 1, totalPages: 0 } } })),
        api.sessions.getByCreator(userId, { limit: 1 }).catch(() => ({ data: { courses: [], pagination: { total: 0, page: 1, limit: 1, totalPages: 0 } } })),
        api.posts.getByCreator(userId, { page: 1, limit: 1 }).catch(() => ({ posts: [], pagination: { total: 0, page: 1, limit: 1, totalPages: 0 } } as any)),
      ])

      // Calculate total members across all manageable communities
      const communitiesResponse = await api.communities.getMyManageable()
      const communitiesData = communitiesResponse?.data || []
      const totalMembers = communitiesData.reduce((sum: number, community: any) => {
        return sum + (community.membersCount || community.members?.length || 0)
      }, 0)

      // Format numbers
      const formatNumber = (num: number) => {
        if (num >= 1000) {
          return `${(num / 1000).toFixed(1)}k`
        }
        return num.toString()
      }

      const challengesCount = challengesRes.data?.pagination?.total || challengesRes.data?.length || 0
      setCounts({
        courses: formatNumber(coursesRes.data?.pagination?.total || coursesRes.data?.length || 0),
        challenges: challengesCount > 0 ? `${challengesCount} Active` : "0",
        sessions: formatNumber(sessionsRes.data?.pagination?.total || sessionsRes.data?.length || 0),
        posts: formatNumber(postsRes.pagination?.total || postsRes.posts?.length || 0),
        members: formatNumber(totalMembers),
      })
    } catch (err) {
      console.error('Failed to fetch counts:', err)
      // Keep default values on error
    }
  }

  // Fetch communities and counts on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch communities and counts in parallel
        const [communitiesResponse] = await Promise.all([
          api.communities.getMyCreated(),
          fetchCounts(),
        ])

        const communitiesData = communitiesResponse?.data || []

        setCommunities(communitiesData)
        
        // Set first community as default, or try to restore from localStorage
        if (communitiesData.length > 0) {
          const savedCommunityId = localStorage.getItem('creator_selected_community_id')
          const defaultCommunity = savedCommunityId
            ? communitiesData.find((c: any) => c._id === savedCommunityId) || communitiesData[0]
            : communitiesData[0]
          
          setSelectedCommunity(defaultCommunity)
        }
      } catch (err) {
        console.error('Failed to fetch communities:', err)
        setError('Failed to load communities')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Handle community selection and save to localStorage
  const handleSelectCommunity = (community: any) => {
    setSelectedCommunity(community)
    localStorage.setItem('creator_selected_community_id', community._id || community.id)
    
    // Optionally redirect to community dashboard
    // router.push(`/creator/community/${community._id || community.id}/dashboard`)
  }

  // Show loading state
  if (loading) {
    return (
      <Sidebar className="border-r">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" disabled>
                <Loader2 className="size-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
      </Sidebar>
    )
  }

  // Show error state
  if (error && communities.length === 0) {
    return (
      <Sidebar className="border-r">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" disabled>
                <span className="text-sm text-destructive">{error}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
      </Sidebar>
    )
  }

  return (
    <Sidebar className="border-r">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  {selectedCommunity ? (
                    <>
                      <div
                        className="flex aspect-square size-8 items-center justify-center rounded-lg text-primary-foreground font-semibold"
                        style={{
                          backgroundColor:
                            selectedCommunity.color ||
                            getColorForCommunity(communities.indexOf(selectedCommunity)),
                        }}
                      >
                        <span className="text-sm">{selectedCommunity.name?.charAt(0) || 'C'}</span>
                      </div>
                      <div className="grid flex-1 text-start text-sm leading-tight">
                        <span className="truncate font-semibold">{selectedCommunity.name}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {selectedCommunity.members?.toLocaleString?.() ||
                            selectedCommunity.memberCount ||
                            0}{' '}
                          members
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="text-sm">Select Community</span>
                  )}
                  <ChevronDown className="ms-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                <DropdownMenuItem className="gap-2 p-2">
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <Plus className="size-4" />
                  </div>
                  <div className="font-medium text-muted-foreground">Create Community</div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {communities.length > 0 ? (
                  communities.map((community, index) => (
                    <DropdownMenuItem
                      key={community._id || community.id}
                      className="gap-2 p-2 cursor-pointer"
                      onClick={() => handleSelectCommunity(community)}
                    >
                      <div
                        className="flex size-6 items-center justify-center rounded-sm font-semibold text-white"
                        style={{
                          backgroundColor: community.color || getColorForCommunity(index),
                        }}
                      >
                        <span className="text-xs">{community.name?.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{community.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {community.members?.toLocaleString?.() || community.memberCount || 0} members
                        </div>
                      </div>
                      {selectedCommunity?._id === community._id ||
                      selectedCommunity?.id === community.id ? (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      ) : null}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No communities yet
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Creator Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} className="group">
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                      {item.key && counts[item.key] && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "ms-auto text-xs",
                            item.color === "courses" && "bg-courses-100 text-courses-700",
                            item.color === "challenges" && "bg-challenges-100 text-challenges-700",
                            item.color === "sessions" && "bg-sessions-100 text-sessions-700",
                          )}
                        >
                          {counts[item.key]}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={currentUser?.photo_profil || currentUser?.profile_picture || undefined} alt={currentUser?.name || "User"} />
                    <AvatarFallback className="rounded-lg">{(currentUser?.name || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-start text-sm leading-tight">
                    <span className="truncate font-semibold">{currentUser?.name || "User"}</span>
                    <span className="truncate text-xs text-muted-foreground">Creator</span>
                  </div>
                  <ChevronDown className="ms-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/creator/profile">
                    <User className="me-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/creator/settings">
                    <Settings className="me-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/signin">
                    <LogOut className="me-2 h-4 w-4" />
                    Log out
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <CreatorSidebar />
        <div className="flex-1">
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
              <SidebarTrigger className="-ms-1" />
              <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                <div className="w-full flex-1 md:w-auto md:flex-none">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded flex items-center justify-center">
                      <span className="text-white font-bold text-xs">C</span>
                    </div>
                    <span className="font-semibold gradient-text">Chabaqa Creator</span>
                  </div>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
