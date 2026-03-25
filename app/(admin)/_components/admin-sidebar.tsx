"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { adminApi } from "@/lib/api/admin-api"
import { useAdminLayout } from "../providers/admin-layout-provider"
import { useAdminAuth } from "../providers/admin-auth-provider"
import { useTranslations } from "next-intl"
import { localizeHref } from "@/lib/i18n/client"
import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  Coins,
  BarChart3,
  Database,
  Lock,
  Mail,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  FileText,
} from "lucide-react"

interface NavigationItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  hidden?: boolean
  children?: Array<{
    title: string
    href: string
  }>
}

interface AdminSidebarProps {
  className?: string
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname()
  const t = useTranslations("admin")
  const { sidebarOpen, closeSidebar } = useAdminLayout()
  const { admin, logout, capabilities } = useAdminAuth()
  const [pendingCounts, setPendingCounts] = useState({
    users: 0,
    communities: 0,
    moderation: 0,
    support: 0,
  })
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const canAccessOperations = capabilities.financial || capabilities.security || capabilities.analytics || capabilities.dashboard

  useEffect(() => {
    let mounted = true

    const fetchPendingCounts = async () => {
      try {
        const [pendingCommunitiesRes, moderationStatsRes, supportCountsRes] = await Promise.allSettled([
          capabilities.communities ? adminApi.communities.getPendingApprovals({ page: 1, limit: 1 } as any) : Promise.resolve(null),
          capabilities.contentModeration ? adminApi.contentModeration.getQueueStats() : Promise.resolve(null),
          capabilities.liveSupport ? adminApi.support.getQueueCounts() : Promise.resolve(null),
        ])

        const pendingCommunities =
          pendingCommunitiesRes.status === "fulfilled"
            ? Number((pendingCommunitiesRes.value as any)?.data?.total || 0)
            : 0

        const moderationStats =
          moderationStatsRes.status === "fulfilled"
            ? (moderationStatsRes.value as any)?.data || {}
            : {}
        const moderationPending =
          Number(moderationStats?.byStatus?.pending || 0) +
          Number(moderationStats?.byStatus?.under_review || 0)

        const supportAvailable =
          supportCountsRes.status === "fulfilled"
            ? Number((supportCountsRes.value as any)?.data?.available || 0)
            : 0

        if (!mounted) return
        setPendingCounts({
          users: 0,
          communities: capabilities.communities ? pendingCommunities : 0,
          moderation: capabilities.contentModeration ? moderationPending : 0,
          support: capabilities.liveSupport ? supportAvailable : 0,
        })
      } catch (error) {
        if (!mounted) return
        setPendingCounts({
          users: 0,
          communities: 0,
          moderation: 0,
          support: 0,
        })
      }
    }

    fetchPendingCounts()

    return () => {
      mounted = false
    }
  }, [capabilities.communities, capabilities.contentModeration, capabilities.liveSupport])

  const navigationItems: NavigationItem[] = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      hidden: !capabilities.dashboard,
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: Users,
      badge: pendingCounts.users,
      hidden: !capabilities.users,
    },
    {
      title: "Communities",
      href: "/admin/communities",
      icon: Building2,
      badge: pendingCounts.communities,
      hidden: !capabilities.communities,
    },
    {
      title: "Content Moderation",
      href: "/admin/content-moderation",
      icon: Shield,
      badge: pendingCounts.moderation,
      hidden: !capabilities.contentModeration,
    },
    {
      title: "Content Management",
      href: "/admin/content",
      icon: FileText,
      hidden: !capabilities.contentManagement,
      children: [
        { title: "Courses", href: "/admin/content/courses" },
        { title: "Challenges", href: "/admin/content/challenges" },
        { title: "Events", href: "/admin/content/events" },
        { title: "Posts", href: "/admin/content/posts" },
      ],
    },
    {
      title: "Financial",
      href: "/admin/financial",
      icon: Coins,
      hidden: !capabilities.financial,
      children: [
        { title: "Dashboard", href: "/admin/financial" },
        { title: "Subscriptions", href: "/admin/financial/subscriptions" },
        { title: "Transactions", href: "/admin/financial/transactions" },
        { title: "Payouts", href: "/admin/financial/payouts" },
      ],
    },
    {
      title: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
      hidden: !capabilities.analytics,
    },
    {
      title: "Operations",
      href: "/admin/export",
      icon: Database,
      hidden: !canAccessOperations,
      children: [
        { title: "Export Center", href: "/admin/export" },
        { title: "Bulk Operations", href: "/admin/data-management" },
      ],
    },
    {
      title: "Security",
      href: "/admin/security",
      icon: Lock,
      hidden: !capabilities.security,
      children: [
        { title: "Audit Logs", href: "/admin/security" },
        { title: "Security Events", href: "/admin/security/events" },
      ],
    },
    {
      title: "Communication",
      href: capabilities.communication ? "/admin/communication" : "/admin/communication/support",
      icon: Mail,
      badge: pendingCounts.support,
      hidden: !capabilities.communication && !capabilities.liveSupport,
      children: [
        ...(capabilities.communication ? [{ title: "Campaigns", href: "/admin/communication" }] : []),
        ...(capabilities.communication ? [{ title: "Templates", href: "/admin/communication/templates" }] : []),
        ...(capabilities.communication ? [{ title: "Notifications", href: "/admin/communication/notifications" }] : []),
        ...(capabilities.communication ? [{ title: "Communication Analytics", href: "/admin/communication/analytics" }] : []),
        ...(capabilities.liveSupport ? [{ title: "Live Support", href: "/admin/communication/support" }] : []),
      ],
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: Settings,
      hidden: !capabilities.settings,
    },
  ].filter((item) => !item.hidden)

  const localizedNavigationItems: NavigationItem[] = navigationItems.map((item) => ({
    ...item,
    title: translateMenuLabel(item.title),
    href: localizeHref(pathname, item.href),
    children: item.children?.map((child) => ({
      ...child,
      title: translateMenuLabel(child.title),
      href: localizeHref(pathname, child.href),
    })),
  }))

  function translateMenuLabel(label: string): string {
    const mapping: Record<string, string> = {
      Dashboard: t("menu.dashboard"),
      Users: t("menu.users"),
      Communities: t("menu.communities"),
      "Content Moderation": t("menu.contentModeration"),
      "Content Management": t("menu.contentManagement"),
      "All Content": t("menu.allContent"),
      Courses: t("menu.courses"),
      Challenges: t("menu.challenges"),
      Events: t("menu.events"),
      Posts: t("menu.posts"),
      Financial: t("menu.financial"),
      Analytics: t("menu.analytics"),
      Security: t("menu.security"),
      Communication: t("menu.communication"),
      Settings: t("menu.settings"),
      Subscriptions: t("menu.subscriptions"),
      Transactions: t("menu.transactions"),
      Payouts: t("menu.payouts"),
      "Audit Logs": t("menu.auditLogs"),
      "Security Events": t("menu.securityEvents"),
      Campaigns: t("menu.campaigns"),
      Templates: t("menu.templates"),
      Notifications: t("menu.notifications"),
      "Communication Analytics": t("menu.analytics"),
      "Live Support": t("menu.liveSupport"),
      Operations: t("menu.operations"),
      "Export Center": t("menu.exportCenter"),
      "Bulk Operations": t("menu.bulkOperations"),
    }
    return mapping[label] || label
  }

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    )
  }

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/")
  }

  const isParentActive = (item: NavigationItem) => {
    if (isActive(item.href)) return true
    if (item.children) {
      return item.children.some((child) => isActive(child.href))
    }
    return false
  }

  const handleLogout = async () => {
    await logout()
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="border-b border-[hsl(var(--admin-border)/0.85)] px-4 py-4">
        <Link 
          href={localizeHref(pathname, "/admin/dashboard")}
          className="group flex items-center gap-3"
          aria-label="Chabaqa Admin Dashboard Home"
        >
          <div className="admin-icon-chip h-12 w-12 overflow-hidden rounded-2xl p-2">
            <Image
              src="/Logos/PNG/brandmark.png"
              alt="Chabaqa"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
          </div>
          <div className="min-w-0">
            <Image
              src="/logo_chabaqa.png"
              alt="Chabaqa"
              width={122}
              height={28}
              className="h-7 w-auto object-contain"
            />
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.22em] text-[hsl(var(--admin-muted))]">
              Admin control
            </p>
          </div>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-2.5 py-4">
        <nav className="space-y-0.5" aria-label="Main navigation">
          {localizedNavigationItems.map((item) => {
            const Icon = item.icon
            const hasChildren = item.children && item.children.length > 0
            const isExpanded = expandedItems.includes(item.title)
            const active = isParentActive(item)

            if (hasChildren) {
              return (
                <Collapsible
                  key={item.title}
                  open={isExpanded}
                  onOpenChange={() => toggleExpanded(item.title)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "admin-nav-item h-auto min-h-10 !justify-start text-left",
                        active && "admin-nav-active"
                      )}
                      aria-expanded={isExpanded}
                      aria-label={`${item.title} menu${item.badge ? `, ${item.badge} pending items` : ''}`}
                    >
                      <span className="admin-icon-chip mr-2.5 h-8 w-8 rounded-xl">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="flex-1 text-left">{item.title}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <Badge
                          variant="secondary"
                          className="admin-badge ml-auto mr-2 border-0"
                          aria-label={`${item.badge} pending`}
                        >
                          {item.badge}
                        </Badge>
                      )}
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-0.5 space-y-0.5">
                    {item.children?.map((child) => (
                      <Button
                        key={child.href}
                        variant="ghost"
                        size="sm"
                        asChild
                        className={cn(
                          "admin-nav-item h-10 rounded-xl px-2.5 py-2 text-sm",
                          isActive(child.href) && "admin-nav-active"
                        )}
                      >
                        <Link 
                          href={child.href} 
                          onClick={closeSidebar}
                          className="flex w-full items-center justify-start text-left"
                          aria-current={isActive(child.href) ? "page" : undefined}
                        >
                          <span className="admin-icon-chip mr-2.5 h-8 w-8 rounded-xl opacity-70" aria-hidden="true" />
                          <span className="flex-1 text-left">{child.title}</span>
                        </Link>
                      </Button>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )
            }

            return (
              <Button
                key={item.href}
                variant="ghost"
                asChild
                className={cn(
                  "admin-nav-item h-auto min-h-10 !justify-start text-left",
                  active && "admin-nav-active"
                )}
              >
                <Link 
                  href={item.href} 
                  onClick={closeSidebar}
                  className="flex w-full items-center justify-start text-left"
                  aria-current={active ? "page" : undefined}
                  aria-label={`${item.title}${item.badge ? `, ${item.badge} pending items` : ''}`}
                >
                  <span className="admin-icon-chip mr-2.5 h-8 w-8 rounded-xl">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="flex-1 text-left">{item.title}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge
                      variant="secondary"
                      className="admin-badge ml-auto border-0"
                      aria-label={`${item.badge} pending`}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </Button>
            )
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-[hsl(var(--admin-border)/0.85)] p-3">
        <div className="admin-surface-muted flex items-center space-x-3 rounded-3xl px-3 py-2.5">
          <Avatar className="border border-[hsl(var(--admin-border)/0.9)]">
            <AvatarFallback>
              {admin?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "AD"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{admin?.name || "Admin"}</p>
            <p className="truncate text-xs text-muted-foreground">
              {admin?.email || "admin@chabaqa.com"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="rounded-2xl text-[hsl(var(--admin-muted))] hover:bg-[hsl(var(--admin-primary)/0.1)] hover:text-foreground"
            aria-label={t("header.logout")}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )

  // Desktop sidebar
  const desktopSidebar = (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-72 border-r border-[hsl(var(--admin-border)/0.75)] bg-white/85 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:translate-x-0",
        !sidebarOpen && "-translate-x-full",
        className
      )}
      aria-label={t("header.toggleNavigation")}
      role="navigation"
    >
      {sidebarContent}
    </aside>
  )

  // Mobile drawer
  const mobileDrawer = (
    <Sheet open={sidebarOpen} onOpenChange={closeSidebar}>
      <SheetContent 
        side="left" 
        className="w-72 border-r border-[hsl(var(--admin-border)/0.75)] bg-white/95 p-0 backdrop-blur-xl"
        aria-label={t("header.toggleNavigation")}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{t("header.toggleNavigation")}</SheetTitle>
          <SheetDescription>
            {t("brandName")}
          </SheetDescription>
        </SheetHeader>
        {sidebarContent}
      </SheetContent>
    </Sheet>
  )

  return (
    <>
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden lg:block">{desktopSidebar}</div>
      {/* Mobile drawer - shown on mobile */}
      <div className="lg:hidden">{mobileDrawer}</div>
    </>
  )
}
