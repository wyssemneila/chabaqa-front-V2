"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Image from "next/image"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  ChevronDown,
  Settings,
  LogOut,
  User as UserIcon,
  Users,
  Home,
  Search,
  Menu,
  Plus,
  MessageSquare,
  Calendar,
  BookOpen,
  Zap,
  Trophy,
  TrendingUp,
  ShoppingBag,
  Sparkles,
  Star,
  LayoutDashboard,
  Route
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCommunityPermissions } from "@/hooks/use-community-permissions"
import { communitiesApi } from "@/lib/api/communities.api"
import { useAuthContext } from "@/app/providers/auth-provider"
import { authApi } from "@/lib/api/auth.api"
import type { Community } from "@/lib/api/types"
import { resolveImageUrl } from "@/lib/resolve-image-url"
import { api } from "@/lib/api"
import type { Conversation } from "@/lib/api/types"
import { useSocket } from "@/lib/socket-context"
import { NotificationsBell } from "./notifications-bell"


interface CommunityHeaderProps {
  currentCommunity: string
  creatorSlug: string
}

const navigationItems = [
  { label: "Feed", href: "/home", icon: MessageSquare },
  { label: "Courses", href: "/courses", icon: BookOpen },
  { label: "Challenge", href: "/challenges", icon: Zap },
  { label: "Sessions", href: "/sessions", icon: Calendar },
  { label: "Products", href: "/products", icon: ShoppingBag },
  { label: "Events", href: "/events", icon: Sparkles },
  { label: "Reviews", href: "/reviews", icon: Star },
  { label: "Progress", href: "/progress", icon: TrendingUp },
  // { label: "Learning Path", href: "/learning-path", icon: Route },
  // { label: "Achievements", href: "/achievements", icon: Trophy },
  { label: "Members", href: "/members", icon: Users },
]


const getCommunityLogoUrl = (community?: Community | null): string | undefined => {
  if (!community) return undefined
  return resolveImageUrl(
    (community as any).logo ||
      (community as any).image ||
      (community as any).settings?.logo
  )
}

export function CommunityHeader({ currentCommunity, creatorSlug }: CommunityHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userCommunities, setUserCommunities] = useState<Community[]>([])
  const [currentCommunityData, setCurrentCommunityData] = useState<Community | null>(null)
  const [loading, setLoading] = useState(true)
  const [dmUnread, setDmUnread] = useState(0)

  const { user: currentUser, isAuthenticated, logout } = useAuthContext()
  const { socket } = useSocket()
  const searchParams = useSearchParams()
  const joinedFlag = searchParams.get('joined')
  const myId = currentUser?.id || (currentUser as any)?._id || ""
  const messagesHref = `/${creatorSlug}/${currentCommunity}/messages`

  const getParticipantId = (p: any): string => {
    if (!p) return ""
    if (typeof p === "string") return p
    return p.id || p._id || ""
  }

  const getMyUnreadCount = (c: Conversation, myIdValue: string): number => {
    const aId = getParticipantId(c.participantA)
    return aId === myIdValue ? c.unreadCountA : c.unreadCountB
  }

  const fetchDmUnread = useCallback(async () => {
    if (!isAuthenticated || !myId) {
      setDmUnread(0)
      return
    }

    try {
      const res = await api.dm.listInbox()
      const count = (res.conversations || []).reduce((sum, conv) => {
        return sum + Math.max(0, getMyUnreadCount(conv, myId))
      }, 0)
      setDmUnread(count)
    } catch (error) {
      console.error("Error fetching DM unread count:", error)
    }
  }, [isAuthenticated, myId])

  useEffect(() => {
    if (!isAuthenticated || !myId) {
      setDmUnread(0)
      return
    }

    let isActive = true

    fetchDmUnread()
    const interval = setInterval(fetchDmUnread, 30000)

    return () => {
      isActive = false
      clearInterval(interval)
    }
  }, [fetchDmUnread, isAuthenticated, myId])

  useEffect(() => {
    if (!socket) return
    let refreshTimer: ReturnType<typeof setTimeout> | null = null

    const scheduleRefresh = () => {
      if (refreshTimer) return
      refreshTimer = setTimeout(() => {
        refreshTimer = null
        fetchDmUnread()
      }, 500)
    }

    const handleNewMessage = (payload: any) => {
      const message = payload?.message || payload
      const senderId = typeof message?.senderId === "string"
        ? message.senderId
        : message?.senderId?._id || message?.senderId?.id
      if (senderId && senderId === myId) return
      scheduleRefresh()
    }

    const handleRead = () => {
      scheduleRefresh()
    }

    socket.on("dm:message:new", handleNewMessage)
    socket.on("dm:message:read", handleRead)
    return () => {
      socket.off("dm:message:new", handleNewMessage)
      socket.off("dm:message:read", handleRead)
      if (refreshTimer) clearTimeout(refreshTimer)
    }
  }, [fetchDmUnread, myId, socket])

  useEffect(() => {
    if (pathname?.includes("/messages")) {
      fetchDmUnread()
    }
  }, [fetchDmUnread, pathname])

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching header data for community:', currentCommunity)

        const [userCommunitiesRes, currentCommunityRes] = await Promise.all([
          isAuthenticated ? communitiesApi.getMyJoined().catch((err) => {
            console.error('Error fetching user communities:', err)
            return null
          }) : Promise.resolve(null),
          communitiesApi.getBySlug(currentCommunity).catch((err) => {
            console.error('Error fetching current community:', err)
            return null
          }),
        ])

        if (userCommunitiesRes) {
          setUserCommunities(userCommunitiesRes.data)
        }

        if (currentCommunityRes) {
          setCurrentCommunityData(currentCommunityRes.data)
        }
      } catch (error) {
        console.error('Error fetching header data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentCommunity, isAuthenticated, joinedFlag])

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/${creatorSlug}/${currentCommunity}/home?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // Handle create post - scroll to post form on home page
  const handleCreatePost = () => {
    router.push(`/${creatorSlug}/${currentCommunity}/home#create-post`)
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await authApi.logout()
      logout()
      router.push('/signin')
    } catch (error) {
      console.error('Logout error:', error)
      // Force logout even if API fails
      logout()
      router.push('/signin')
    }
  }


  const community = currentCommunityData
  const communityId = useMemo(() => {
    const raw = (community as any)?._id || (community as any)?.id || ""
    const normalized = String(raw).trim()
    return normalized || null
  }, [community])
  const { isStaff } = useCommunityPermissions(communityId)
  const headerNavigationItems = useMemo(() => {
    return navigationItems
  }, [isStaff])
  const mobilePrimaryNavigationItems = useMemo(
    () =>
      headerNavigationItems.filter((item) =>
        ["/home", "/courses", "/challenges", "/sessions"].includes(item.href),
      ),
    [headerNavigationItems],
  )
  const communityBasePath = `/${creatorSlug}/${currentCommunity}`
  const mobilePrimaryHrefs = new Set(mobilePrimaryNavigationItems.map((item) => item.href))
  const isRouteActive = (href: string) => {
    const fullPath = `${communityBasePath}${href}`
    return pathname === fullPath || pathname.startsWith(`${fullPath}/`)
  }

  const isMoreActive = headerNavigationItems.some(
    (item) => !mobilePrimaryHrefs.has(item.href) && isRouteActive(item.href),
  )
  if (loading) {
    return (
      <header className="community-mobile-header sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    )
  }
  return (
    <header className="community-mobile-header sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b shadow-sm">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Community Info (Responsive) */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center">
              {/* Desktop Full Logo */}
              <div className="hidden sm:block relative h-24 w-[100px]">
                <Image
                  src="/Logos/PNG/frensh1.png"
                  alt="Chabaqa Logo"
                  fill
                  sizes="100px"
                  style={{ objectFit: "contain" }}
                  priority
                />
              </div>
              {/* Mobile Small Logo */}
              <div className="sm:hidden relative h-8 w-8">
                <Image
                  src="/Logos/PNG/brandmark.png"
                  alt="Chabaqa Logo"
                  fill
                  sizes="32px"
                  style={{ objectFit: "contain" }}
                  priority
                />
              </div>
            </Link>

            {/* Desktop Community Info */}
            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 px-3 h-10">
                    {community && (
                      <>
                        <Avatar className="w-8 h-8 rounded-lg">
                          <AvatarImage
                            src={getCommunityLogoUrl(community) || undefined}
                            alt={`${community.name} logo`}
                            className="object-cover"
                          />
                          <AvatarFallback
                            className="text-white text-sm font-semibold rounded-lg"
                            style={{ backgroundColor: (community as any).settings?.primaryColor || '#3b82f6' }}
                          >
                            {community.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <div className="font-medium text-sm">{community.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {typeof (community as any).members === 'number'
                              ? (community as any).members.toLocaleString()
                              : (community as any).members?.length || (community as any).membersCount || 0} members
                          </div>
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80">
                  <div className="px-2 py-1.5 text-sm font-semibold">Switch Community</div>
                  <DropdownMenuSeparator />
                  <div className="max-h-64 overflow-y-auto">
                    {userCommunities.map((comm) => (
                      <DropdownMenuItem key={comm.id} asChild>
                        <Link
                          href={`/${creatorSlug}/${comm.slug}/home`}
                          className={cn(
                            "flex items-center space-x-3 cursor-pointer",
                            comm.slug === currentCommunity && "bg-accent"
                          )}
                        >
                          <Avatar className="w-10 h-10 rounded-lg flex-shrink-0">
                            <AvatarImage
                              src={getCommunityLogoUrl(comm) || undefined}
                              alt={`${comm.name} logo`}
                              className="object-cover"
                            />
                            <AvatarFallback
                              className="text-white text-sm font-semibold rounded-lg"
                              style={{ backgroundColor: (comm as any).settings?.primaryColor || '#3b82f6' }}
                            >
                              {comm.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{comm.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {typeof (comm as any).members === 'number'
                                ? (comm as any).members.toLocaleString()
                                : (comm as any).members?.length || (comm as any).membersCount || 0} members
                            </div>
                          </div>
                          {comm.slug === currentCommunity && (
                            <Badge variant="secondary" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/explore" className="cursor-pointer">
                      <Search className="mr-2 h-4 w-4" />
                      <span>Explore Communities</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Community Name */}
            <div className="sm:hidden font-medium text-sm truncate">
              {community?.name}
            </div>
          </div>

          {/* Desktop Search */}
          {/* <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts, courses, challenges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-0 focus-visible:ring-1 rounded-full"
            />
          </div>
        </form> */}

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            {/* Messages Link */}
            <Link href={messagesHref}>
              <Button variant="ghost" size="icon" className="relative rounded-full">
                <MessageSquare className="h-5 w-5 text-gray-600" />
                {dmUnread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] px-1 bg-gray-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {dmUnread > 99 ? "99+" : dmUnread}
                  </span>
                )}
              </Button>
            </Link>

            <NotificationsBell creatorSlug={creatorSlug} communitySlug={currentCommunity} />

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetContent side="right" className="p-0">
                <div className="h-full overflow-y-auto p-6 space-y-6">
                  {/* Profile */}
                  <Link href="/profile">
                    <div className="flex items-center space-x-3 cursor-pointer">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={currentUser?.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {currentUser?.firstName?.[0] || ''}{currentUser?.lastName?.[0] || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{currentUser?.firstName} {currentUser?.lastName}</div>
                        <div className="text-sm text-muted-foreground">{currentUser?.email || ""}</div>
                      </div>
                    </div>
                  </Link>

                  {/* Community Switcher */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {community?.name}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64">
                      {userCommunities.map((comm) => (
                        <DropdownMenuItem
                          key={comm.id}
                          asChild
                          onClick={() => setMobileMenuOpen(false)} // ✅ closes menu
                          className={comm.slug === currentCommunity ? "bg-accent" : ""}
                        >
                          <Link href={`/${creatorSlug}/${comm.slug}/home`}>
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-8 h-8 rounded-lg">
                                <AvatarImage
                                  src={getCommunityLogoUrl(comm) || undefined}
                                  alt={`${comm.name} logo`}
                                  className="object-cover"
                                />
                                <AvatarFallback
                                  className="text-white text-sm font-semibold rounded-lg"
                                  style={{ backgroundColor: (comm as any).settings?.primaryColor || '#3b82f6' }}
                                >
                                  {comm.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="font-medium">{comm.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {typeof (comm as any).members === 'number'
                                    ? (comm as any).members.toLocaleString()
                                    : (comm as any).members?.length || (comm as any).membersCount || 0} members
                                </div>
                              </div>
                              {comm.slug === currentCommunity && (
                                <Badge variant="secondary" className="text-xs">
                                  Current
                                </Badge>
                              )}
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/explore" className="flex items-center space-x-2">
                          <Search className="h-4 w-4" />
                          <span>Explore Communities</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Navigation Items */}
                  <div className="space-y-2">
                    {headerNavigationItems.map((item) => (
                      <Button
                        key={item.label}
                        variant="ghost"
                        className="w-full justify-start"
                        asChild
                        onClick={() => setMobileMenuOpen(false)} // ✅ closes menu
                      >
                        <Link href={`/${creatorSlug}/${currentCommunity}${item.href}`}>
                          <item.icon className="mr-2 h-4 w-4" />
                          {item.label}
                        </Link>
                      </Button>
                    ))}
                  </div>

                  {/* User Menu */}
                  <div className="space-y-2 pt-4 border-t">
                    {currentUser?.role === 'creator' && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        asChild
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Link href="/creator/dashboard">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      asChild
                      onClick={() => setMobileMenuOpen(false)} // ✅ closes menu
                    >
                      <Link href="/home">
                        <Home className="mr-2 h-4 w-4" />
                        Home
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      asChild
                      onClick={() => setMobileMenuOpen(false)} // ✅ closes menu
                    >
                      <Link href="/profile">
                        <UserIcon className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => setMobileMenuOpen(false)} // ✅ closes menu
                    >
                      <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        handleLogout()
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>



            {/* User Menu (Desktop Only) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Link href="/profile">
                  <Button variant="ghost" className="hidden sm:flex items-center space-x-2 px-3 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUser?.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {currentUser?.firstName?.[0] || ''}{currentUser?.lastName?.[0] || ''}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </Link>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <div className="font-medium">{currentUser?.firstName} {currentUser?.lastName}</div>
                  <div className="text-sm text-muted-foreground">{currentUser?.email || ""}</div>
                </div>
                <DropdownMenuSeparator />
                {currentUser?.role === 'creator' && (
                  <DropdownMenuItem asChild>
                    <Link href="/creator/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Navigation Bar (Desktop only) */}
        <div className="hidden sm:block border-t bg-white/50">
          <div className="flex items-center space-x-1 py-2 overflow-x-auto">
            {headerNavigationItems.map((item) => {
              const href = `${communityBasePath}${item.href}`
              const isActive = isRouteActive(item.href)

              return (
                <Link
                  key={item.label}
                  href={href}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-primary-100 text-primary-700"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        <nav
          aria-label="Mobile navigation"
          className="fixed inset-x-0 bottom-0 z-[60] border-t border-gray-100/60 bg-white/98 backdrop-blur-xl supports-[backdrop-filter]:bg-white/95 sm:hidden shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)]"
        >
          <div
            className="mx-auto flex max-w-lg items-center justify-between gap-1 px-2 pt-2"
            style={{
              paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))",
              paddingLeft: "max(0.5rem, env(safe-area-inset-left))",
              paddingRight: "max(0.5rem, env(safe-area-inset-right))",
            }}
          >
            {mobilePrimaryNavigationItems.map((item) => {
              const href = `${communityBasePath}${item.href}`
              const isActive = isRouteActive(item.href)

              return (
                <Link
                  key={item.label}
                  href={href}
                  className={cn(
                    "flex h-14 min-w-[60px] flex-1 flex-col items-center justify-center rounded-2xl text-[10px] font-semibold tracking-tight transition-all duration-200 active:scale-95",
                    isActive ? "bg-gradient-to-b from-primary-50 to-primary-100/70 text-primary-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]" : "text-gray-400 hover:text-gray-700 hover:bg-gray-50/80",
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive && "text-primary-700")} />
                  <span className="mt-1 leading-none">{item.label}</span>
                </Link>
              )
            })}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className={cn(
                "flex h-14 min-w-[60px] flex-1 flex-col items-center justify-center rounded-2xl text-[10px] font-semibold tracking-tight transition-all duration-200 active:scale-95",
                isMoreActive || mobileMenuOpen
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-500 hover:text-gray-900",
              )}
            >
              <Menu className={cn("h-5 w-5", (isMoreActive || mobileMenuOpen) && "text-primary-700")} />
              <span className="mt-1 leading-none">More</span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  )

}
