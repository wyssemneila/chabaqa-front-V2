"use client"

import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import {
  AlertCircle,
  Bell,
  BellRing,
  BookOpen,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle,
  Clock,
  Coins,
  Filter,
  Info,
  Loader2,
  RefreshCw,
  Search,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  TrendingUp,
  Trophy,
  Users,
  XCircle,
} from "lucide-react"

import { PageShell } from "@/components/creator-dashboard"
import { MutesList } from "@/components/notifications/mute-actions"
import { NotificationPreferences } from "@/components/notifications/notification-preferences"
import { PushSettings } from "@/components/notifications/push-settings"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import { notificationsApi, type Notification } from "@/lib/api"

type NotificationFilter = "all" | "unread" | "read"

type NotificationTone = {
  icon: ComponentType<{ className?: string }>
  label: string
  className: string
}

const typeMeta: Record<string, NotificationTone> = {
  user_joined: {
    icon: Users,
    label: "Member",
    className: "bg-chabaqa-primary/10 text-chabaqa-primary",
  },
  member_joined: {
    icon: Users,
    label: "Member",
    className: "bg-chabaqa-primary/10 text-chabaqa-primary",
  },
  new_community_member: {
    icon: Users,
    label: "Member",
    className: "bg-chabaqa-primary/10 text-chabaqa-primary",
  },
  course_created: {
    icon: BookOpen,
    label: "Course",
    className: "bg-emerald-50 text-emerald-700",
  },
  course_enrolled: {
    icon: BookOpen,
    label: "Course",
    className: "bg-emerald-50 text-emerald-700",
  },
  challenge_created: {
    icon: Trophy,
    label: "Challenge",
    className: "bg-amber-50 text-amber-700",
  },
  challenge_completed: {
    icon: Trophy,
    label: "Challenge",
    className: "bg-amber-50 text-amber-700",
  },
  session_created: {
    icon: Calendar,
    label: "Schedule",
    className: "bg-sky-50 text-sky-700",
  },
  event_created: {
    icon: Calendar,
    label: "Schedule",
    className: "bg-sky-50 text-sky-700",
  },
  product_purchased: {
    icon: ShoppingBag,
    label: "Product",
    className: "bg-pink-50 text-pink-700",
  },
  payment_received: {
    icon: Coins,
    label: "Revenue",
    className: "bg-teal-50 text-teal-700",
  },
  analytics_update: {
    icon: TrendingUp,
    label: "Analytics",
    className: "bg-indigo-50 text-indigo-700",
  },
  system_error: {
    icon: XCircle,
    label: "System",
    className: "bg-red-50 text-red-700",
  },
  success: {
    icon: CheckCircle,
    label: "Success",
    className: "bg-emerald-50 text-emerald-700",
  },
  warning: {
    icon: AlertCircle,
    label: "Warning",
    className: "bg-orange-50 text-orange-700",
  },
}

const fallbackMeta: NotificationTone = {
  icon: Bell,
  label: "Update",
  className: "bg-[var(--p2)] text-[var(--p-dark)]",
}

function getMeta(type?: string): NotificationTone {
  return typeMeta[String(type || "").toLowerCase()] || fallbackMeta
}

function labelFromType(type?: string) {
  return String(type || "notification").replace(/[_-]+/g, " ")
}

function inLastDays(value: string, days: number) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  const threshold = new Date()
  threshold.setDate(threshold.getDate() - days)
  return date >= threshold
}

export default function NotificationsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<NotificationFilter>("all")
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalNotifications, setTotalNotifications] = useState(0)

  const fetchNotifications = useCallback(
    async (page = 1, silent = false) => {
      if (!isAuthenticated || !user) {
        setLoading(false)
        return
      }

      if (silent) setRefreshing(true)
      else setLoading(true)

      try {
        setError(null)
        const response = await notificationsApi.getAll({ page, limit: 20 })
        const items = response.items || []
        const total = response.total || items.length

        setNotifications(items)
        setCurrentPage(response.page || page)
        setTotalPages(Math.max(1, Math.ceil(total / (response.limit || 20))))
        setTotalNotifications(total)
      } catch (err: any) {
        setError(err?.message || "Failed to load notifications")
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [isAuthenticated, user],
  )

  useEffect(() => {
    if (!authLoading) void fetchNotifications()
  }, [authLoading, fetchNotifications])

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.isRead).length, [notifications])
  const readCount = Math.max(0, notifications.length - unreadCount)
  const weekCount = useMemo(() => notifications.filter((notification) => inLastDays(notification.createdAt, 7)).length, [notifications])
  const readRate = notifications.length > 0 ? Math.round((readCount / notifications.length) * 100) : 0

  const typeBreakdown = useMemo(() => {
    const counts = new Map<string, number>()
    notifications.forEach((notification) => {
      const meta = getMeta(notification.type)
      counts.set(meta.label, (counts.get(meta.label) || 0) + 1)
    })
    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [notifications])

  const filteredNotifications = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()
    return notifications.filter((notification) => {
      const matchesSearch =
        !normalizedSearch ||
        notification.title.toLowerCase().includes(normalizedSearch) ||
        notification.message.toLowerCase().includes(normalizedSearch) ||
        labelFromType(notification.type).includes(normalizedSearch)

      const matchesFilter =
        filterType === "all" ||
        (filterType === "read" && notification.isRead) ||
        (filterType === "unread" && !notification.isRead)

      return matchesSearch && matchesFilter
    })
  }, [filterType, notifications, searchQuery])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setMarkingAsRead(notificationId)
      await notificationsApi.markAsRead(notificationId)
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId ? { ...notification, isRead: true } : notification,
        ),
      )
      toast({ title: "Notification marked as read" })
    } catch (err: any) {
      toast({
        title: "Could not update notification",
        description: err?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setMarkingAsRead(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!unreadCount) return
    try {
      setMarkingAsRead("all")
      await notificationsApi.markAllAsRead()
      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })))
      toast({ title: "All notifications marked as read" })
    } catch (err: any) {
      toast({
        title: "Could not mark all as read",
        description: err?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setMarkingAsRead(null)
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      setDeletingId(notificationId)
      await notificationsApi.delete(notificationId)
      setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId))
      setTotalNotifications((prev) => Math.max(0, prev - 1))
      toast({ title: "Notification deleted" })
    } catch (err: any) {
      toast({
        title: "Could not delete notification",
        description: err?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  if (authLoading || loading) {
    return <NotificationsLoading />
  }

  if (error) {
    return (
      <PageShell className="w-full max-w-none px-4 pb-10 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-[var(--bd)] bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <XCircle className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-xl font-semibold text-[var(--t1)]">Could not load notifications</h1>
          <p className="mt-2 text-sm text-[var(--t2)]">{error}</p>
          <Button
            type="button"
            onClick={() => fetchNotifications()}
            className="mt-5 bg-chabaqa-primary hover:bg-chabaqa-primary/90"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </section>
      </PageShell>
    )
  }

  return (
    <PageShell className="w-full max-w-none space-y-6 px-4 pb-10 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-[var(--bd)] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-chabaqa-primary/20 bg-chabaqa-primary/5 px-3 py-1 text-xs font-semibold text-chabaqa-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Creator notification center
            </div>
            <h1 className="text-3xl font-bold tracking-normal text-[var(--t1)]">Notifications</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--t2)]">
              Follow the creator activity stream, clear unread items, and tune notification delivery from one full-width workspace.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--t3)]">
              <Badge variant="outline" className="border-[var(--bd)] bg-white text-[var(--t2)]">
                {totalNotifications} total
              </Badge>
              <Badge variant="outline" className="border-[var(--bd)] bg-white text-[var(--t2)]">
                {unreadCount} unread
              </Badge>
              <Badge variant="outline" className="border-[var(--bd)] bg-white text-[var(--t2)]">
                {weekCount} this week
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => fetchNotifications(currentPage, true)}
              disabled={refreshing}
              className="h-11 rounded-lg border-[var(--bd)] bg-white"
            >
              {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
            <Button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={!unreadCount || markingAsRead === "all"}
              className="h-11 rounded-lg bg-chabaqa-primary hover:bg-chabaqa-primary/90"
            >
              {markingAsRead === "all" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
              Mark all read
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={BellRing} label="Total" value={String(totalNotifications)} helper="All creator alerts" />
          <MetricCard icon={AlertCircle} label="Unread" value={String(unreadCount)} helper="Need attention" tone="amber" />
          <MetricCard icon={Clock} label="This Week" value={String(weekCount)} helper="Recent activity" tone="teal" />
          <MetricCard icon={CheckCircle} label="Read Rate" value={`${readRate}%`} helper={`${readCount} read locally`} tone="violet" />
        </div>
      </section>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-lg border border-[var(--bd)] bg-white p-1 shadow-sm">
          <TabsTrigger value="notifications" className="rounded-md px-4 py-2 data-[state=active]:bg-[var(--p2)] data-[state=active]:text-[var(--p-dark)]">
            <Bell className="mr-2 h-4 w-4" />
            Inbox
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-md px-4 py-2 data-[state=active]:bg-[var(--p2)] data-[state=active]:text-[var(--p-dark)]">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-4 space-y-4">
          <section className="rounded-lg border border-[var(--bd)] bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--t3)]" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search notifications..."
                  className="h-11 rounded-lg border-[var(--bd)] bg-white pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <FilterButton active={filterType === "all"} onClick={() => setFilterType("all")} label={`All ${notifications.length}`} />
                <FilterButton active={filterType === "unread"} onClick={() => setFilterType("unread")} label={`Unread ${unreadCount}`} />
                <FilterButton active={filterType === "read"} onClick={() => setFilterType("read")} label={`Read ${readCount}`} />
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-3">
              {filteredNotifications.length === 0 ? (
                <EmptyState filtered={Boolean(searchQuery || filterType !== "all")} />
              ) : (
                filteredNotifications.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    isMarking={markingAsRead === notification.id}
                    isDeleting={deletingId === notification.id}
                    onMarkAsRead={() => handleMarkAsRead(notification.id)}
                    onDelete={() => handleDeleteNotification(notification.id)}
                  />
                ))
              )}
            </div>

            <aside className="space-y-4">
              <Card className="rounded-lg border-[var(--bd)] bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--p2)] text-[var(--p-dark)]">
                      <SlidersHorizontal className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-[var(--t1)]">Signal Mix</p>
                      <p className="text-sm text-[var(--t2)]">Current page categories</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {typeBreakdown.length ? (
                      typeBreakdown.map((item) => (
                        <div key={item.label} className="rounded-lg border border-[var(--bd)] bg-[var(--bg)]/70 p-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-[var(--t1)]">{item.label}</span>
                            <span className="font-semibold text-[var(--t1)]">{item.count}</span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                            <div
                              className="h-full rounded-full bg-chabaqa-primary"
                              style={{ width: `${Math.min(100, (item.count / Math.max(1, notifications.length)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-lg border border-dashed border-[var(--bd)] bg-[var(--bg)]/70 p-4 text-sm text-[var(--t2)]">
                        No notification categories yet.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-lg border-[var(--bd)] bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <Info className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-[var(--t1)]">Delivery Status</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--t2)]">
                        In-app notifications are active for this account. Push and channel controls are available in settings.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </section>

          {totalPages > 1 ? (
            <div className="flex flex-col items-center justify-between gap-3 rounded-lg border border-[var(--bd)] bg-white p-3 shadow-sm sm:flex-row">
              <p className="text-sm text-[var(--t2)]">
                Page <span className="font-semibold text-[var(--t1)]">{currentPage}</span> of{" "}
                <span className="font-semibold text-[var(--t1)]">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg border-[var(--bd)] bg-white"
                  onClick={() => fetchNotifications(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg border-[var(--bd)] bg-white"
                  onClick={() => fetchNotifications(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-4">
              <PushSettings userId={user?._id} />
              <MutesList />
            </div>
            <NotificationPreferences />
          </section>
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}

function NotificationsLoading() {
  return (
    <PageShell className="w-full max-w-none space-y-6 px-4 pb-10 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-[var(--bd)] bg-white p-5 shadow-sm">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-lg" />
          ))}
        </div>
      </section>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Skeleton className="h-[520px] rounded-lg" />
        <Skeleton className="h-[520px] rounded-lg" />
      </div>
    </PageShell>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  tone = "primary",
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  helper: string
  tone?: "primary" | "amber" | "teal" | "violet"
}) {
  const tones = {
    primary: "bg-chabaqa-primary/10 text-chabaqa-primary",
    amber: "bg-amber-50 text-amber-700",
    teal: "bg-teal-50 text-teal-700",
    violet: "bg-[var(--p2)] text-[var(--p-dark)]",
  }

  return (
    <Card className="rounded-lg border-[var(--bd)] bg-white shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[var(--t2)]">{label}</p>
            <p className="mt-2 text-2xl font-bold text-[var(--t1)]">{value}</p>
          </div>
          <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", tones[tone])}>
            <Icon className="h-5 w-5" />
          </span>
        </div>
        <p className="mt-4 text-sm text-[var(--t3)]">{helper}</p>
      </CardContent>
    </Card>
  )
}

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      onClick={onClick}
      className={cn(
        "h-10 rounded-lg",
        active
          ? "bg-chabaqa-primary hover:bg-chabaqa-primary/90"
          : "border-[var(--bd)] bg-white text-[var(--t2)] hover:bg-[var(--p2)] hover:text-[var(--p-dark)]",
      )}
    >
      <Filter className="mr-2 h-4 w-4" />
      {label}
    </Button>
  )
}

function NotificationRow({
  notification,
  isMarking,
  isDeleting,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification
  isMarking: boolean
  isDeleting: boolean
  onMarkAsRead: () => void
  onDelete: () => void
}) {
  const meta = getMeta(notification.type)
  const Icon = meta.icon

  return (
    <Card
      className={cn(
        "rounded-lg border-[var(--bd)] bg-white shadow-sm transition hover:border-chabaqa-primary/40 hover:shadow-md",
        !notification.isRead && "border-l-4 border-l-chabaqa-primary bg-[var(--p2)]/20",
      )}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className={cn("mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", meta.className)}>
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-[var(--t1)]">{notification.title}</h3>
                {!notification.isRead ? (
                  <Badge className="bg-chabaqa-primary text-white hover:bg-chabaqa-primary">New</Badge>
                ) : null}
                <Badge variant="outline" className="border-[var(--bd)] bg-white capitalize text-[var(--t2)]">
                  {labelFromType(notification.type)}
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--t2)]">{notification.message}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--t3)]">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: fr })}
                </span>
                <span>{notification.isRead ? "Read" : "Unread"}</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-end md:self-start">
            {!notification.isRead ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-lg border-[var(--bd)] bg-white text-chabaqa-primary hover:bg-[var(--p2)]"
                onClick={onMarkAsRead}
                disabled={isMarking}
                aria-label="Mark notification as read"
              >
                {isMarking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-lg border-red-100 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={onDelete}
              disabled={isDeleting}
              aria-label="Delete notification"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <Card className="rounded-lg border border-dashed border-[var(--bd)] bg-white shadow-sm">
      <CardContent className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--p2)] text-[var(--p-dark)]">
          <Bell className="h-6 w-6" />
        </span>
        <h3 className="mt-4 text-lg font-semibold text-[var(--t1)]">
          {filtered ? "No matching notifications" : "No notifications yet"}
        </h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-[var(--t2)]">
          {filtered
            ? "Adjust the search or switch filters to see more activity."
            : "New member, course, sales, event, and system updates will appear here."}
        </p>
      </CardContent>
    </Card>
  )
}
