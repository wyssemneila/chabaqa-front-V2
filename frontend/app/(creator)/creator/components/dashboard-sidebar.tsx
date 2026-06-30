"use client"

import { useState, useEffect, useCallback } from "react"
import type { ComponentType } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  Users,
  Settings,
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
  ExternalLink,
  Star,
  WalletCards,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { launchIcons } from "@/components/icons/launch-icons"
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
  icon: ComponentType<{ className?: string }>
  badge?: string | null
  requiredPermission?: CommunityPermissionValue
  external?: boolean
  /** "soon" items show a coming-soon badge and are not clickable */
  soon?: boolean
}

interface NavGroup {
  label: string
  section: string
  icon: ComponentType<{ className?: string }>
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

  // Community-specific base path for settings/customize
  const communityBasePath = selectedCommunity
    ? `/creator/community/${selectedCommunity.slug}`
    : "/creator"

  const canCreateContent = Boolean(selectedCommunityId) && canPermission(CommunityPermission.CONTENT_MANAGE as CommunityPermissionValue)

  /* ──────────────────────────────────────────────────────────
     Information Architecture — grouped navigation
     ────────────────────────────────────────────────────────── */

  const navigation: NavEntry[] = [
    {
      label: "Home",
      section: "home",
      icon: LayoutDashboard,
      expandable: true,
      items: [
        { title: "Overview", href: "/creator/dashboard", icon: LayoutDashboard },
        { title: "Analytics", href: "/creator/analytics", icon: ChartSpline, requiredPermission: CommunityPermission.ANALYTICS_VIEW as CommunityPermissionValue },
      ],
    },
    {
      label: "Content",
      section: "content",
      icon: launchIcons.post,
      expandable: true,
      items: [
        { title: "Courses", href: "/creator/courses", icon: launchIcons.course, requiredPermission: CommunityPermission.CONTENT_MANAGE as CommunityPermissionValue },
        { title: "Posts", href: "/creator/posts", icon: launchIcons.post, requiredPermission: CommunityPermission.CONTENT_MANAGE as CommunityPermissionValue },
        { title: "Products", href: "/creator/products", icon: launchIcons.product, requiredPermission: CommunityPermission.CONTENT_MANAGE as CommunityPermissionValue },
        { title: "Sessions", href: "/creator/sessions", icon: launchIcons.session, requiredPermission: CommunityPermission.CONTENT_MANAGE as CommunityPermissionValue },
        { title: "Events", href: "/creator/events", icon: launchIcons.event, requiredPermission: CommunityPermission.CONTENT_MANAGE as CommunityPermissionValue },
        { title: "Challenges", href: "/creator/challenges", icon: launchIcons.challenge, requiredPermission: CommunityPermission.CONTENT_MANAGE as CommunityPermissionValue },
      ],
    },
    {
      label: "Money",
      section: "money",
      icon: launchIcons.payout,
      expandable: true,
      items: [
        { title: "Account Billing", href: "/creator/billing", icon: CreditCard },
        { title: "Payouts", href: "/creator/monetization/payouts", icon: launchIcons.payout, requiredPermission: CommunityPermission.FINANCE_VIEW as CommunityPermissionValue },
        { title: "Plan History", href: "/creator/monetization/subscriptions", icon: launchIcons.pricing, requiredPermission: CommunityPermission.FINANCE_VIEW as CommunityPermissionValue },
        { title: "Manual Payments", href: "/creator/monetization/manual-payments", icon: WalletCards, requiredPermission: CommunityPermission.FINANCE_VIEW as CommunityPermissionValue },
      ],
    },
    {
      label: "Community",
      section: "community",
      icon: launchIcons.community,
      expandable: true,
      items: [
        { title: "Communities", href: "/creator/communities", icon: launchIcons.community },
        { title: "Customize", href: `${communityBasePath}/customize`, icon: launchIcons.branding },
        { title: "Team & Roles", href: "/creator/team", icon: Shield, requiredPermission: CommunityPermission.ROLES_MANAGE as CommunityPermissionValue },
      ],
    },
    {
      label: "Growth",
      section: "growth",
      icon: launchIcons.audience,
      expandable: true,
      items: [
        { title: "Email Campaigns", href: "/creator/marketing/emails", icon: Mail, requiredPermission: CommunityPermission.MARKETING_MANAGE as CommunityPermissionValue },
        { title: "Affiliates", href: "/creator/marketing/affiliates", icon: UserPlus, requiredPermission: CommunityPermission.MARKETING_MANAGE as CommunityPermissionValue },
        { title: "Notifications", href: "/creator/notifications", icon: Bell, badge: unreadCount > 0 ? unreadCount.toString() : null },
      ],
    },
    {
      label: "Help",
      section: "help",
      icon: HelpCircle,
      expandable: true,
      items: [
        { title: "Integrations", href: "/creator/integrations", icon: Globe, badge: "soon" },
        { title: "Help", href: "/creator/help", icon: HelpCircle },
        { title: "Affiliate Portal", href: "/dashboard/affiliate", icon: ExternalLink },
      ],
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

  useEffect(() => {
    setExpandedSections(getInitialExpanded())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? [] : [section],
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

  const getVisibleItems = (group: NavGroup) => (
    group.items.filter((item) => {
      if (!item.requiredPermission) return true
      return canPermission(item.requiredPermission)
    })
  )

  const isGroupActive = (group: NavGroup) => (
    group.items.some((item) => item.href && !item.soon && isActive(item.href))
  )

  const renderCreateMenuItem = (
    label: string,
    href: string,
    Icon: ComponentType<{ className?: string }>,
    disabled = false,
  ) => {
    if (disabled) {
      return (
        <DropdownMenuItem key={label} disabled className="text-xs">
          <Icon className="h-4 w-4" />
          {label}
        </DropdownMenuItem>
      )
    }

    return (
      <DropdownMenuItem key={label} asChild className="text-xs">
        <Link href={href}>
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      </DropdownMenuItem>
    )
  }

  /* ──────────────────────────────────────────────────────────
     Render
     ────────────────────────────────────────────────────────── */

  const navGroups = visibleNav.filter((entry) => entry.expandable) as NavGroup[]

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 text-xs">
      {/* ── Brand + Community Selector ── */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex-shrink-0">
            <div className="w-8 h-8 relative cursor-pointer hover:opacity-90 transition-opacity">
              <Image src="/Logos/PNG/brandmark.png" alt="Chabaqa" fill sizes="32px" className="object-contain" />
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

      {/* ── Create Menu ── */}
      <div className="p-3 border-b border-gray-200">
        {communities.length === 0 ? (
          <Link href="/creator/communities/create" className="block">
            <Button
              className="w-full bg-gradient-to-r from-chabaqa-primary to-chabaqa-secondary1 text-white hover:from-chabaqa-primary/90 hover:to-chabaqa-secondary1/90 text-xs h-8"
              size="sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Build Your First Community
            </Button>
          </Link>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="w-full bg-gradient-to-r from-chabaqa-primary to-chabaqa-secondary1 text-white hover:from-chabaqa-primary/90 hover:to-chabaqa-secondary1/90 text-xs h-8"
                size="sm"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Create
                <ChevronDown className="w-3.5 h-3.5 ml-auto" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56">
              <DropdownMenuLabel className="text-xs">Create</DropdownMenuLabel>
              {renderCreateMenuItem("Community", "/creator/communities/create", Building)}
              <DropdownMenuSeparator />
              {renderCreateMenuItem("Course", "/creator/courses/new", BookOpen, !canCreateContent)}
              {renderCreateMenuItem("Challenge", "/creator/challenges/new", Zap, !canCreateContent)}
              {renderCreateMenuItem("Session", "/creator/sessions/new", Calendar, !canCreateContent)}
              {renderCreateMenuItem("Event", "/creator/events/new", Star, !canCreateContent)}
              {renderCreateMenuItem("Product", "/creator/products/new", ShoppingBag, !canCreateContent)}
              {renderCreateMenuItem("Post", "/creator/posts?create=1", FileText, !canCreateContent)}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        <div className="space-y-0.5">
          {navGroups.map((group, index) => {
            const visibleItems = getVisibleItems(group)
            if (visibleItems.length === 0) return null
            const active = isGroupActive(group)

            return (
              <div key={group.section}>
                {index > 0 && <Separator className="my-2" />}
                <Collapsible
                  open={expandedSections.includes(group.section)}
                  onOpenChange={() => toggleSection(group.section)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-between text-left font-normal h-9",
                        expandedSections.includes(group.section) && "bg-gray-50",
                        active && "text-chabaqa-primary",
                      )}
                    >
                      <div className="flex items-center">
                        <group.icon className={cn("w-3.5 h-3.5 mr-2", active ? "text-chabaqa-primary" : "text-gray-500")} />
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
                    {visibleItems.map((item) => renderNavItem(item, true))}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )
          })}
        </div>
      </nav>

      {/* ── Footer ── */}
      <div className="p-3 border-t border-gray-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full h-auto justify-start gap-2 px-2 py-2 text-left">
              <Avatar className="w-7 h-7">
                <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name || "User"} />
                <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="truncate text-xs font-medium text-gray-900">{user?.name}</p>
                  {user?.verified && <Badge className="bg-blue-100 text-blue-800 text-[10px] leading-none">Pro</Badge>}
                </div>
                <p className="truncate text-[11px] font-normal text-gray-500">{user?.email}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel className="text-xs">Account</DropdownMenuLabel>
            <DropdownMenuItem asChild className="text-xs">
              <Link href="/profile">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-xs text-red-600 focus:text-red-700">
              <LogOut className="h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
