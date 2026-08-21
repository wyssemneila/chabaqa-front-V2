"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Bell, Calendar, GraduationCap, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface Notification {
  id: string
  title: string
  message: string
  time: string
  unread: boolean
  icon: LucideIcon
  tone: string
  iconColor: string
}

const notifications: Notification[] = [
  {
    id: "1",
    title: "New course enrollment",
    message: "Mike Chen enrolled in your React course",
    time: "2 hours ago",
    unread: true,
    icon: GraduationCap,
    tone: "from-[#47c7ea]/30 to-[#47c7ea]/5",
    iconColor: "text-[#47c7ea]",
  },
  {
    id: "2",
    title: "Challenge update",
    message: "Day 18 of 30-Day Coding Challenge is live",
    time: "4 hours ago",
    unread: true,
    icon: Target,
    tone: "from-[#ff9b28]/30 to-[#ff9b28]/5",
    iconColor: "text-[#ff9b28]",
  },
  {
    id: "3",
    title: "Session reminder",
    message: "1-on-1 session with Sarah starts in 30 minutes",
    time: "6 hours ago",
    unread: false,
    icon: Calendar,
    tone: "from-[#f65887]/30 to-[#f65887]/5",
    iconColor: "text-[#f65887]",
  },
]

function NotificationItem({ notification }: { notification: Notification }) {
  const Icon = notification.icon
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-white/80 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        notification.unread ? "border-[#8e78fb]/30" : "border-border-color",
      )}
    >
      {notification.unread && (
        <span className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#8e78fb] to-[#86e4fd]" />
      )}
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${notification.tone}`}>
          <Icon className={`h-5 w-5 ${notification.iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">{notification.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
            </div>
            {notification.unread && <div className="mt-1 h-2 w-2 rounded-full bg-[#8e78fb]" />}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{notification.time}</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            <span>Chabaqa</span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface NotificationPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationPanel({ open, onOpenChange }: NotificationPanelProps) {
  const unreadCount = notifications.filter((n) => n.unread).length
  const splitNotifications = notifications.reduce(
    (acc, notification) => {
      const label = String(notification.time || "").toLowerCase()
      const isToday = label.includes("min") || label.includes("hour") || label.includes("today")
      if (isToday) acc.today.push(notification)
      else acc.earlier.push(notification)
      return acc
    },
    { today: [] as Notification[], earlier: [] as Notification[] },
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="relative overflow-hidden bg-[radial-gradient(120%_80%_at_10%_0%,#f7f5ff_0%,#ffffff_55%)]">
        <div className="pointer-events-none absolute -top-24 right-0 h-60 w-60 rounded-full bg-[#86e4fd]/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-[#8e78fb]/20 blur-3xl" />
        <SheetHeader className="relative space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl tracking-tight">Notifications</SheetTitle>
              <SheetDescription className="text-sm">Stay updated with your community activity</SheetDescription>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">
              <span>{unreadCount}</span>
              <span className="text-muted-foreground">unread</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground">Last 7 days</div>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
              Mark all read
            </Button>
          </div>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {notifications.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border-color bg-white/80 p-6 text-center text-sm text-muted-foreground shadow-sm">
              You&apos;re all caught up.
            </div>
          )}
          {splitNotifications.today.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">Today</div>
              {splitNotifications.today.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>
          )}
          {splitNotifications.earlier.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">Earlier</div>
              {splitNotifications.earlier.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
