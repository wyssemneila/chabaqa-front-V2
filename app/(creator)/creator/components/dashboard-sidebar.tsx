"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import {
  LayoutDashboard,
  Users,
  Settings,
  BarChart3,
  CreditCard,
  Bell,
  HelpCircle,
  Plus,
  FileText,
  Calendar,
  Zap,
  Shield,
  Globe,
  ChevronDown,
  ChevronRight,
  LogOut,
  User,
  Building,
  ChartSpline,
  BookOpen,
  ShoppingBag,
  Mail,
  UserPlus,
  MessageSquare,
  Palette,
  Lock,
  ExternalLink,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { prefetchCommunity } from "@/app/(creator)/creator/context/community-switch-cache"
import { api } from "@/lib/api"
import { useCommunityPermissions } from "@/hooks/use-community-permissions"
import { CommunityPermission, type CommunityPermissionValue } from "@/lib/permissions"

/* ────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────── */

interface NavItem {
  title: string
  href?: string
  icon: LucideIcon
  badge?: string | null
  requiredPermission?: CommunityPermissionValue
  external?: boolean
  /** "soon" items show a coming-soon badge and are not clickable */
  soon?: boolean
}

interface NavGroup {
  label: string
  section: string
  icon: LucideIcon
  expandable: true
  items: NavItem[]
  requiredPermission?: CommunityPermissionValue
}

type NavEntry = (NavItem & { expandable?: false }) | NavGroup

/* ────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────── */

const getCommunityId = (community: any): string => {
  const rawId = community?.id ?? community?._id
  if (typeof rawId === "string") return rawId
  if (rawId && typeof rawId.toString === "function") return rawId.toString()
  return ""
}

/* ────────────────────────────────────────────────────────────
   Sidebar Props
   ──────────────────────────────────────────────────────────── */

interface DashboardSidebarProps {
  user: any
  onLogout: () => void
}

export function DashboardSidebar({ user, onLogout }: DashboardSidebarProps) {
  const pathname = usePathname()

  // Shared community context
  const {
    communities,
    selectedCommunityId,
    selectedCommunity,
    isLoading: isLoadingCommunities,
    error: communitiesError,
    setSelectedCommunityId,
  } = useCreatorCommunity()

  // RBAC permissions
  const { can: canPermission } = useCommunityPermissions(selectedCommunityId)

  // Unread notifications
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.notifications.getAll()
      const unread = response.items.filter((n: any) => !n.isRead).length
      setUnreadCount(unread)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => { fetchUnreadCount() }, [fetchUnreadCount])

  useEffect(() => {
    const handler = (event: Event) => {
      const e = event as CustomEvent<{ notification?: { isRead?: boolean } }>
      if (e.detail?.notification?.isRead) return
      setUnreadCount((prev) => prev + 1)
    }
    window.addEventListener("creator:notification-received", handler as EventListener)
    return () => window.removeEventListener("creator:notification-received", handler as EventListener)
  }, [])

  // Community switching
  const handleCommunityChange = (communityId: string) => {
    setSelectedCommunityId(communityId)
  }

  const prefetchLikelyCommunities = useCallback(() => {
    communities
      .map((c) => getCommunityId(c))
      .filter((id) => Boolean(id) && id !== selectedCommunityId)
      .slice(0, 2)
      .forEach((id) => void prefetchCommunity(id))
  }, [communities, selectedCommunityId])

  // Community feed URL
  const communityFeedUrl = selectedCommunity
    ? `/${encodeURIComponent(selectedCommunity.creator?.name || "creator")}/${selectedCommunity.slug}/home`
    : "/creator/posts"

  // Community-specific base path for settings/customize
  const communityBasePath = selectedCommunity
    ? `/creator/community/${selectedCommunity.slug}`
    : "/creator"

  /* ──────────────────────────────────────────────────────────
     Information Architecture — grouped navigation
     ────────────────────────────────────────────────────────── */

  const navigation: NavEntry[] = [
    // ── Run the Business ──
    {
      title: "Overview",
      icon: LayoutDashboard,
      href: "/creator/dashboard",
    },
    {
      title: "Communities",
      icon: Building,
      href: "/creator/communities",
    },
    {
      title: "Analytics",
      icon: ChartSpline,
      href: "/creator/analytics",
      requiredPermission: CommunityPermission.ANALYTICS_VIEW as CommunityPermissionValue,
    },

    // ── Manage Content ──
    {
      label: "Content",
      section: "content",
      icon: FileText,
      expandable: true,
      requiredPermission: CommunityPermission.CONTENT_MANAGE as CommunityPermissionValue,
      items: [
        { title: "Courses", href: "/creator/courses", icon: BookOpen },
        { title: "Challenges", href: "/creator/challenges", icon: Zap },
        { title: "Sessions", href: "/creator/sessions", icon: Calendar },
        { title: "Events", href: "/creator/events", icon: Calendar },
        { title: "Products", href: "/creator/products", icon: ShoppingBag },
        { title: "Posts", href: communityFeedUrl, icon: FileText, external: communityFeedUrl.startsWith("/") && !communityFeedUrl.startsWith("/creator") },
      ],
    },

    // ── Manage Revenue ──
    {
      label: "Monetization",
      section: "monetization",
      icon: CreditCard,
      expandable: true,
      requiredPermission: CommunityPermission.FINANCE_VIEW as CommunityPermissionValue,
      items: [
        { title: "Subscriptions", href: "/creator/monetization/subscriptions", icon: CreditCard },
        { title: "Payouts", href: "/creator/monetization/payouts", icon: CreditCard },
        { title: "Manual Payments", href: "/creator/monetization/manual-payments", icon: CreditCard },
      ],
    },

    // ── Manage Growth ──
    {
      label: "Marketing",
      section: "marketing",
      icon: Zap,
      expandable: true,
      requiredPermission: CommunityPermission.MARKETING_MANAGE as CommunityPermissionValue,
      items: [
        { title: "Email Campaigns", href: "/creator/marketing/emails", icon: Mail },
        { title: "Affiliates", href: "/creator/marketing/affiliates", icon: UserPlus },
        { title: "Affiliate Portal", href: "/dashboard/affiliate", icon: ExternalLink, external: true },
        { title: "Contacts", href: "/creator/marketing/contacts", icon: Users },
        { title: "Messages", href: "/creator/marketing/messages", icon: MessageSquare, soon: true },
        { title: "WhatsApp", href: "/creator/marketing/whatsapp", icon: MessageSquare, soon: true },
      ],
    },

    // ── Configure Workspace ──
    {
      title: "Team & Roles",
      icon: Shield,
      href: "/creator/team",
      requiredPermission: CommunityPermission.ROLES_MANAGE as CommunityPermissionValue,
    },
    {
      title: "Customize",
      icon: Palette,
      href: `${communityBasePath}/customize`,
    },
    {
      title: "Integrations",
      icon: Globe,
      href: "/creator/integrations",
      badge: "soon",
    },

    // ── System ──
    {
      title: "Notifications",
      icon: Bell,
      href: "/creator/notifications",
      badge: unreadCount > 0 ? unreadCount.toString() : null,
    },
    {
      title: "Help & Support",
      icon: HelpCircle,
      href: "/creator/help",
    },
  ]

  // Filter by permission
  const visibleNav = navigation.filter((entry) => {
    if (!entry.requiredPermission) return true
    return canPermission(entry.requiredPermission)
  })

  // Active-state logic
  const isActive = (href: string) => {
    if (href === "/creator/dashboard") return pathname === "/creator/dashboard"
    return pathname.startsWith(href)
  }

  // Auto-expand sections that contain the active route
  const getInitialExpanded = () => {
    const active: string[] = []
    for (const entry of visibleNav) {
      if (entry.expandable && entry.items) {
        for (const item of entry.items) {
          if (item.href && pathname.startsWith(item.href)) {
            active.push(entry.section)
            break
          }
        }
      }
    }
    return active
  }

  const [expandedSections, setExpandedSections] = useState<string[]>(getInitialExpanded)

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section],
    )
  }

  /* ──────────────────────────────────────────────────────────
     Render helpers
     ────────────────────────────────────────────────────────── */

  const renderBadge = (entry: NavItem) => {
    if (entry.soon) {
      return (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="ml-auto text-[10px] opacity-60">
                Soon
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-xs">This feature is coming soon</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }
    if (entry.badge === "soon") {
      return (
        <Badge variant="outline" className="ml-auto text-[10px] opacity-60">
          Soon
        </Badge>
      )
    }
    if (entry.badge) {
      return (
        <Badge variant="secondary" className="ml-auto text-[10px]">
          {entry.badge}
        </Badge>
      )
    }
    return null
  }

  const renderNavItem = (item: NavItem, indent = false) => {
    const disabled = item.soon
    const active = !disabled && item.href ? isActive(item.href) : false

    const inner = (
      <Button
        variant="ghost"
        disabled={disabled}
        className={cn(
          "w-full justify-start text-left font-normal h-8 text-xs",
          indent && "pl-8",
          active && "bg-chabaqa-primary/10 text-chabaqa-primary border-r-2 border-chabaqa-primary",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <item.icon className="w-3.5 h-3.5 mr-2 flex-shrink-0 text-gray-500" />
        <span className="truncate">{item.title}</span>
        {item.external && <ExternalLink className="w-3 h-3 ml-1 text-gray-400 flex-shrink-0" />}
        {renderBadge(item)}
      </Button>
    )

    if (disabled || !item.href) return <div key={item.title}>{inner}</div>

    return (
      <Link key={item.title} href={item.href}>
        {inner}
      </Link>
    )
  }

  /* ──────────────────────────────────────────────────────────
     Render
     ────────────────────────────────────────────────────────── */

  // Separate entries into top-level groups by semantic section
  const topEntries = visibleNav.filter(
    (e) => !e.expandable && ["Overview", "Communities", "Analytics"].includes((e as NavItem).title),
  )
  const contentGroups = visibleNav.filter((e) => e.expandable) as NavGroup[]
  const configEntries = visibleNav.filter(
    (e) => !e.expandable && ["Team & Roles", "Customize", "Integrations"].includes((e as NavItem).title),
  )
  const systemEntries = visibleNav.filter(
    (e) => !e.expandable && ["Notifications", "Help & Support"].includes((e as NavItem).title),
  )

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 text-xs">
      {/* ── Brand + Community Selector ── */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex-shrink-0">
            <div className="w-8 h-8 relative cursor-pointer hover:opacity-90 transition-opacity">
              <Image src="/Logos/PNG/brandmark.png" alt="Chabaqa" fill className="object-contain" />
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            {isLoadingCommunities ? (
              <div className="h-8 bg-gray-100 animate-pulse rounded" />
            ) : communitiesError ? (
              <p className="text-xs text-red-500 truncate">{communitiesError}</p>
            ) : communities.length > 0 ? (
              <Select
                onValueChange={handleCommunityChange}
                value={selectedCommunityId || undefined}
                onOpenChange={(open) => { if (open) prefetchLikelyCommunities() }}
              >
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select Community" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {communities.map((community) => {
                    const id = getCommunityId(community)
                    if (!id) return null
                    return (
                      <SelectItem key={id} value={id}>
                        {community.name}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-gray-500">No communities</p>
            )}
          </div>
        </div>
      </div>

      {/* ── User Profile ── */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name || "User"} />
            <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
          </div>
          {user?.verified && <Badge className="bg-blue-100 text-blue-800 text-[10px]">Pro</Badge>}
        </div>
      </div>

      {/* ── Create Community CTA ── */}
      <div className="p-3 border-b border-gray-200">
        <Link href="/creator/communities/create" className="block">
          <Button
            className="w-full bg-gradient-to-r from-chabaqa-primary to-chabaqa-secondary1 text-white hover:from-chabaqa-primary/90 hover:to-chabaqa-secondary1/90 text-xs h-8"
            size="sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            {communities.length === 0 ? "Build Your First Community" : "Create Community"}
          </Button>
        </Link>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {/* Run the Business */}
        <div className="space-y-0.5">
          {topEntries.map((entry) => renderNavItem(entry as NavItem))}
        </div>

        <Separator className="my-2" />

        {/* Content / Monetization / Marketing groups */}
        <div className="space-y-0.5">
          {contentGroups.map((group) => (
            <Collapsible
              key={group.section}
              open={expandedSections.includes(group.section)}
              onOpenChange={() => toggleSection(group.section)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between text-left font-normal h-9",
                    expandedSections.includes(group.section) && "bg-gray-50",
                  )}
                >
                  <div className="flex items-center">
                    <group.icon className="w-3.5 h-3.5 mr-2 text-gray-500" />
                    <span className="text-xs font-medium">{group.label}</span>
                  </div>
                  {expandedSections.includes(group.section) ? (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5 mt-0.5">
                {group.items
                  .filter((item) => {
                    if (!item.requiredPermission) return true
                    return canPermission(item.requiredPermission)
                  })
                  .map((item) => renderNavItem(item, true))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>

        <Separator className="my-2" />

        {/* Configure Workspace */}
        <div className="space-y-0.5">
          {configEntries.map((entry) => renderNavItem(entry as NavItem))}
        </div>

        <Separator className="my-2" />

        {/* System */}
        <div className="space-y-0.5">
          {systemEntries.map((entry) => renderNavItem(entry as NavItem))}
        </div>
      </nav>

      {/* ── Footer ── */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center justify-between space-x-2">
          <Link href="/profile" className="flex-1">
            <Button variant="ghost" className="w-full justify-start text-left font-normal h-8 text-xs">
              <User className="w-3.5 h-3.5 mr-2 text-gray-500" />
              Profile
            </Button>
          </Link>
          <Button
            variant="ghost"
            onClick={onLogout}
            className="flex-1 justify-start text-left font-normal h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
