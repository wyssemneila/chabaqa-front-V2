"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  Bell,
  BookOpen,
  CheckCheck,
  Coins,
  Loader2,
  MessageSquare,
  RefreshCw,
  ShoppingBag,
  Trash2,
  TrendingUp,
  Trophy,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { formatDistanceToNow, isToday } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useAuthContext } from "@/app/providers/auth-provider"
import { notificationsApi } from "@/lib/api/notifications.api"
import { cn } from "@/lib/utils"

type NormalizedNotification = {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt?: string
  data?: Record<string, any>
}

function useIsMobile(maxWidthPx: number = 639) {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const media = window.matchMedia(`(max-width: ${maxWidthPx}px)`)
    const update = () => setIsMobile(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [maxWidthPx])

  return isMobile
}

function normalizeNotification(raw: any): NormalizedNotification {
  const id = String(raw?.id || raw?._id || "").trim()
  const type = String(raw?.type || "").trim() || "notification"
  const title = String(raw?.title || "Notification").trim()
  const message = String(raw?.message || raw?.body || "").trim()
  const isRead = Boolean(raw?.isRead ?? raw?.read ?? false)
  const createdAt = raw?.createdAt ? String(raw.createdAt) : undefined
  const data = raw?.data && typeof raw.data === "object" ? raw.data : undefined
  return { id, type, title, message, isRead, createdAt, data }
}

function resolveNotificationHref(
  notification: NormalizedNotification,
  context: { creatorSlug: string; communitySlug: string },
): string | null {
  const url = notification?.data?.url
  if (typeof url === "string" && url.trim()) return url.trim()

  if (notification.type === "new_dm_message") {
    const conversationId = notification?.data?.conversationId
    if (typeof conversationId === "string" && conversationId.trim()) {
      return `/${encodeURIComponent(context.creatorSlug)}/${encodeURIComponent(context.communitySlug)}/messages?conversationId=${encodeURIComponent(conversationId.trim())}`
    }
  }

  if (notification.type === "comment_mention" || notification.type === "post_mention") {
    const postId = notification?.data?.postId
    if (typeof postId === "string" && postId.trim()) {
      return `/${encodeURIComponent(context.creatorSlug)}/${encodeURIComponent(context.communitySlug)}/home?post=${encodeURIComponent(postId.trim())}`
    }
    return `/${encodeURIComponent(context.creatorSlug)}/${encodeURIComponent(context.communitySlug)}/home`
  }

  return null
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "comment_mention":
    case "post_mention":
      return MessageSquare
    case "user_joined":
    case "member_joined":
    case "new_community_member":
      return Users
    case "course_created":
    case "course_enrolled":
      return BookOpen
    case "challenge_created":
    case "challenge_completed":
      return Trophy
    case "session_created":
    case "event_created":
      return Calendar
    case "product_purchased":
      return ShoppingBag
    case "payment_received":
      return Coins
    case "analytics_update":
      return TrendingUp
    case "new_dm_message":
      return MessageSquare
    case "success":
      return CheckCircle
    case "system_error":
      return XCircle
    default:
      return Bell
  }
}

function getIconTone(type: string) {
  switch (type) {
    case "comment_mention":
    case "post_mention":
      return "from-blue-500/20 to-blue-500/5 text-blue-700"
    case "new_dm_message":
      return "from-sky-500/20 to-sky-500/5 text-sky-700"
    case "new_community_member":
      return "from-emerald-500/20 to-emerald-500/5 text-emerald-700"
    case "course_enrolled":
      return "from-green-500/20 to-green-500/5 text-green-700"
    case "challenge_completed":
      return "from-amber-500/20 to-amber-500/5 text-amber-700"
    case "product_purchased":
    case "payment_received":
      return "from-pink-500/20 to-pink-500/5 text-pink-700"
    case "system_error":
      return "from-red-500/20 to-red-500/5 text-red-700"
    default:
      return "from-slate-500/15 to-slate-500/5 text-slate-700"
  }
}

function relativeTime(createdAt?: string) {
  if (!createdAt) return "Just now"
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return "Just now"
  return formatDistanceToNow(date, { addSuffix: true })
}

function splitByToday(list: NormalizedNotification[]) {
  const today: NormalizedNotification[] = []
  const earlier: NormalizedNotification[] = []

  for (const n of list) {
    const date = n.createdAt ? new Date(n.createdAt) : null
    if (date && !Number.isNaN(date.getTime()) && isToday(date)) today.push(n)
    else earlier.push(n)
  }

  return { today, earlier }
}

type NotificationsBellProps = {
  creatorSlug: string
  communitySlug: string
  fetchLimit?: number
  previewLimit?: number
}

export function NotificationsBell({
  creatorSlug,
  communitySlug,
  fetchLimit = 20,
  previewLimit = 15,
}: NotificationsBellProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuthContext()

  const [mounted, setMounted] = React.useState(false)
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)

  const [items, setItems] = React.useState<NormalizedNotification[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const lastFetchedAtRef = React.useRef<number>(0)
  const fetchingRef = React.useRef<Promise<void> | null>(null)

  React.useEffect(() => setMounted(true), [])

  const unreadCount = React.useMemo(
    () => items.filter((n) => !n.isRead).length,
    [items],
  )

  const fetchNotifications = React.useCallback(
    async (opts?: { force?: boolean }) => {
      if (!isAuthenticated) return

      const now = Date.now()
      const force = Boolean(opts?.force)
      const isFresh = now - lastFetchedAtRef.current < 30_000
      if (!force && isFresh) return

      if (fetchingRef.current) return fetchingRef.current

      setLoading(true)
      setError(null)

      const task = (async () => {
        try {
          const response = await notificationsApi.getAll({ limit: fetchLimit })
          const normalized = (response?.items || []).map(normalizeNotification).filter((n) => n.id)
          setItems(normalized)
          lastFetchedAtRef.current = Date.now()
        } catch (err: any) {
          setError(String(err?.message || "Failed to load notifications"))
        } finally {
          setLoading(false)
          fetchingRef.current = null
        }
      })()

      fetchingRef.current = task
      return task
    },
    [fetchLimit, isAuthenticated],
  )

  React.useEffect(() => {
    if (!mounted) return
    if (!isAuthenticated) return
    void fetchNotifications({ force: true })
  }, [fetchNotifications, isAuthenticated, mounted])

  React.useEffect(() => {
    if (!open) return
    void fetchNotifications()
  }, [fetchNotifications, open])

  const previewItems = React.useMemo(
    () => items.slice(0, Math.max(0, previewLimit)),
    [items, previewLimit],
  )
  const split = React.useMemo(() => splitByToday(previewItems), [previewItems])

  const markAsReadOptimistic = React.useCallback((id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
  }, [])

  const removeOptimistic = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const handleMarkAllRead = async () => {
    if (!isAuthenticated || unreadCount === 0) return
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })))
    try {
      await notificationsApi.markAllAsRead()
    } catch {
      // If this fails, a refresh will re-sync.
    }
  }

  const handleDelete = async (id: string) => {
    if (!isAuthenticated) return
    removeOptimistic(id)
    try {
      await notificationsApi.delete(id)
    } catch {
      // If this fails, a refresh will re-sync.
    }
  }

  const handleItemClick = async (notification: NormalizedNotification) => {
    if (!isAuthenticated) return

    if (!notification.isRead) {
      markAsReadOptimistic(notification.id)
      notificationsApi.markAsRead(notification.id).catch(() => undefined)
    }

    const href = resolveNotificationHref(notification, { creatorSlug, communitySlug })
    if (href) {
      setOpen(false)
      router.push(href)
    }
  }

  const TriggerButton = (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "relative rounded-full",
        !isAuthenticated && "opacity-60",
      )}
      aria-label={
        isAuthenticated
          ? `Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`
          : "Sign in to view notifications"
      }
      disabled={!isAuthenticated}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white p-0 text-[10px]"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </Button>
  )

  const Panel = (
    <div className="flex h-full flex-col">
      <div className="border-b bg-white/90 px-4 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-base font-semibold tracking-tight text-gray-900">Notifications</div>
            <div className="mt-0.5 text-xs text-muted-foreground">Latest updates across Chabaqa</div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => fetchNotifications({ force: true })}
              disabled={loading}
              aria-label="Refresh notifications"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-2 rounded-full px-3 text-xs"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || loading}
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-2xl border bg-white p-5 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="text-sm font-semibold text-gray-900">Couldn’t load notifications</div>
            <div className="mt-1 text-sm text-muted-foreground">{error}</div>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => fetchNotifications({ force: true })}
            >
              Try again
            </Button>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-4 p-4">
            {loading && items.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex gap-3 rounded-2xl border bg-white p-4 shadow-sm"
                  >
                    <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-4 w-2/5 animate-pulse rounded bg-slate-200" />
                      <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                      <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : previewItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-white p-6 text-center text-sm text-muted-foreground shadow-sm">
                You’re all caught up.
              </div>
            ) : (
              <>
                {split.today.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
                      Today
                    </div>
                    {split.today.map((n) => {
                      const Icon = getNotificationIcon(n.type)
                      const href = resolveNotificationHref(n, { creatorSlug, communitySlug })
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => handleItemClick(n)}
                          className={cn(
                            "group relative w-full overflow-hidden rounded-2xl border bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            !n.isRead ? "border-primary/30" : "border-border-color",
                          )}
                          aria-label={href ? `${n.title}. Open.` : `${n.title}. Mark as read.`}
                        >
                          {!n.isRead && (
                            <span className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary to-primary/40" />
                          )}
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br",
                                getIconTone(n.type),
                              )}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <div className="line-clamp-1 text-sm font-semibold text-gray-900">
                                      {n.title}
                                    </div>
                                    {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary" />}
                                  </div>
                                  {n.message && (
                                    <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                      {n.message}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    void handleDelete(n.id)
                                  }}
                                  aria-label="Delete notification"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{relativeTime(n.createdAt)}</span>
                                {!n.isRead && (
                                  <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                    Unread
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {split.earlier.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
                      Earlier
                    </div>
                    {split.earlier.map((n) => {
                      const Icon = getNotificationIcon(n.type)
                      const href = resolveNotificationHref(n, { creatorSlug, communitySlug })
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => handleItemClick(n)}
                          className={cn(
                            "group relative w-full overflow-hidden rounded-2xl border bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            !n.isRead ? "border-primary/30" : "border-border-color",
                          )}
                          aria-label={href ? `${n.title}. Open.` : `${n.title}. Mark as read.`}
                        >
                          {!n.isRead && (
                            <span className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary to-primary/40" />
                          )}
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br",
                                getIconTone(n.type),
                              )}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <div className="line-clamp-1 text-sm font-semibold text-gray-900">
                                      {n.title}
                                    </div>
                                    {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary" />}
                                  </div>
                                  {n.message && (
                                    <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                      {n.message}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    void handleDelete(n.id)
                                  }}
                                  aria-label="Delete notification"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{relativeTime(n.createdAt)}</span>
                                {!n.isRead && (
                                  <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                    Unread
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      )}

      {loading && items.length > 0 && (
        <div className="border-t bg-white px-4 py-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Updating…
          </span>
        </div>
      )}
    </div>
  )

  if (!mounted) return TriggerButton

  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label={
            isAuthenticated
              ? `Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`
              : "Sign in to view notifications"
          }
          disabled={!isAuthenticated}
          onClick={() => setOpen(true)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white p-0 text-[10px]"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="right"
            className="w-full max-w-none overflow-hidden p-0 sm:max-w-sm"
          >
            {Panel}
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{TriggerButton}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[440px] overflow-hidden rounded-2xl border bg-[radial-gradient(120%_80%_at_10%_0%,#f7f7ff_0%,#ffffff_55%)] p-0 shadow-xl"
      >
        {Panel}
      </PopoverContent>
    </Popover>
  )
}
