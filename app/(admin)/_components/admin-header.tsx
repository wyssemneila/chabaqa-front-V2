"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAdminLayout } from "../providers/admin-layout-provider"
import { useAdminAuth } from "../providers/admin-auth-provider"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Menu, Bell, User, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { localizeHref } from "@/lib/i18n/client"
import { adminApi, type AdminNotificationFeedItem } from "@/lib/api/admin-api"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface AdminHeaderProps {
  title?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  className?: string
}

export function AdminHeader({
  title,
  breadcrumbs,
  actions,
  className,
}: AdminHeaderProps) {
  const { toggleSidebar } = useAdminLayout()
  const { admin, logout } = useAdminAuth()
  const pathname = usePathname()
  const t = useTranslations("admin.header")
  const [notificationCount, setNotificationCount] = useState(0)
  const [notificationFeed, setNotificationFeed] = useState<AdminNotificationFeedItem[]>([])

  const formatRelativeTime = (value: string) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ""

    const diffMs = Date.now() - date.getTime()
    const diffMinutes = Math.max(1, Math.floor(diffMs / 60000))

    if (diffMinutes < 60) return `${diffMinutes}m ago`

    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const withLocale = (href: string) => localizeHref(pathname, href)

  useEffect(() => {
    let isMounted = true

    const loadNotifications = async () => {
      try {
        const [summary, feed] = await Promise.all([
          adminApi.notifications.getSummary(),
          adminApi.notifications.getFeed(6),
        ])

        if (!isMounted) return
        setNotificationCount(summary.total)
        setNotificationFeed(feed.items)
      } catch {
        if (!isMounted) return
        setNotificationCount(0)
        setNotificationFeed([])
      }
    }

    void loadNotifications()

    return () => {
      isMounted = false
    }
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header
      className={cn(
        "sticky top-4 z-30 flex h-16 items-center gap-4 rounded-3xl border border-[hsl(var(--admin-border)/0.75)] bg-white/80 px-4 shadow-[0_18px_40px_-30px_rgba(95,74,180,0.3)] backdrop-blur-xl sm:px-6",
        className
      )}
      role="banner"
    >
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={toggleSidebar}
        aria-label={t("toggleNavigation")}
        aria-expanded={false}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Button>

      {/* Breadcrumbs or Title */}
      <div className="flex flex-1 items-center gap-3">
        <div className="hidden rounded-2xl border border-[hsl(var(--admin-border)/0.8)] bg-white/75 px-3 py-2 lg:flex lg:items-center lg:gap-2">
          <Image src="/Logos/PNG/brandmark.png" alt="Chabaqa" width={20} height={20} className="h-5 w-5 object-contain" />
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[hsl(var(--admin-muted))]">Operations</span>
        </div>
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((item, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {item.href ? (
                      <BreadcrumbLink asChild>
                        <Link href={item.href}>{item.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        ) : title ? (
          <h1 className="text-lg font-semibold">{title}</h1>
        ) : null}
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={`${t("notifications")}${notificationCount > 0 ? `, ${notificationCount} unread` : ""}`}
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {notificationCount > 0 && (
              <Badge
                variant="secondary"
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-0 bg-[hsl(var(--admin-pink))] p-0 text-xs text-white"
                aria-label={`${notificationCount} unread notifications`}
              >
                {notificationCount > 9 ? "9+" : notificationCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 rounded-3xl border border-[hsl(var(--admin-border)/0.8)] bg-white/95 p-2 shadow-[0_24px_48px_-24px_rgba(95,74,180,0.35)]">
          <DropdownMenuLabel className="flex items-center justify-between gap-3">
            <span>{t("notifications")}</span>
            <Badge variant="secondary" className="admin-badge border-0">{notificationCount}</Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {notificationFeed.length > 0 ? (
            notificationFeed.map((item) => (
              <DropdownMenuItem key={item.id} asChild className="cursor-pointer items-start rounded-2xl px-3 py-3 focus:bg-[hsl(var(--admin-primary)/0.08)]">
                <Link href={withLocale(item.href)} className="flex w-full flex-col gap-1">
                  <div className="flex items-start justify-between gap-3">
                    <span className="line-clamp-1 text-sm font-medium">{item.title}</span>
                    <span
                      className={cn(
                        "shrink-0 text-[11px] uppercase tracking-wide",
                        item.severity === "critical"
                          ? "text-destructive"
                          : item.severity === "warning"
                            ? "text-amber-600"
                            : "text-muted-foreground"
                      )}
                    >
                      {item.severity}
                    </span>
                  </div>
                  <span className="line-clamp-2 text-xs text-muted-foreground">{item.message}</span>
                  <span className="text-[11px] text-muted-foreground">{formatRelativeTime(item.createdAt)}</span>
                </Link>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-2 py-4 text-sm text-muted-foreground">
              No pending admin notifications.
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <LanguageSwitcher />

      {/* Admin Profile Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-10 rounded-2xl border border-[hsl(var(--admin-border)/0.85)] bg-white/70"
            aria-label={t("openAdminMenu")}
            aria-haspopup="true"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={admin?.avatar} alt={`${admin?.name || 'Admin'} profile picture`} />
              <AvatarFallback>
                {admin?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() || "AD"}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-3xl border border-[hsl(var(--admin-border)/0.8)] bg-white/95 p-2 shadow-[0_24px_48px_-24px_rgba(95,74,180,0.35)]">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {admin?.name || "Admin"}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {admin?.email || "admin@chabaqa.com"}
              </p>
              {admin?.role && (
                <p className="text-xs leading-none text-muted-foreground capitalize">
                  {admin.role.replace("_", " ")}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={withLocale("/admin/settings")} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" aria-hidden="true" />
              <span>{t("profile")}</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={withLocale("/admin/settings")} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
              <span>{t("settings")}</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>{t("logout")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
