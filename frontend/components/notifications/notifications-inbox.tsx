"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import {
  AlertCircle,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle,
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
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { notificationsApi } from "@/lib/api/notifications.api"
import { cn } from "@/lib/utils"

export type NormalizedNotification = {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt?: string
  data?: Record<string, any>
}

export function normalizeNotification(raw: any): NormalizedNotification {
  const id = String(raw?.id || raw?._id || "").trim()
  const type = String(raw?.type || "").trim() || "notification"
  const title = String(raw?.title || "Notification").trim()
  const message = String(raw?.message || raw?.body || "").trim()
  const isRead = Boolean(raw?.isRead ?? raw?.read ?? false)
  const createdAt = raw?.createdAt ? String(raw.createdAt) : undefined
  const data = raw?.data && typeof raw.data === "object" ? raw.data : undefined
  return { id, type, title, message, isRead, createdAt, data }
}

function getNotificationIcon(type: string) {
  if (type.includes("course")) return BookOpen
  if (type.includes("challenge")) return Trophy
  if (type.includes("event")) return Calendar
  if (type.includes("payment") || type.includes("purchase")) return Coins
  if (type.includes("product")) return ShoppingBag
  if (type.includes("member")) return Users
  if (type.includes("dm") || type.includes("message")) return MessageSquare
  if (type.includes("analytics") || type.includes("growth")) return TrendingUp
  if (type.includes("success") || type.includes("complete")) return CheckCircle
  if (type.includes("fail") || type.includes("error")) return XCircle
  return Bell
}

function relativeTime(value?: string) {
  if (!value) return ""
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true })
  } catch {
    return ""
  }
}

export function NotificationsInbox({
  fetchLimit = 50,
  onNavigate,
}: {
  fetchLimit?: number
  onNavigate?: (href: string) => void
}) {
  const router = useRouter()
  const [items, setItems] = React.useState<NormalizedNotification[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const unreadCount = React.useMemo(
    () => items.filter((item) => !item.isRead).length,
    [items],
  )

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await notificationsApi.getAll({ limit: fetchLimit })
      setItems((response?.items || []).map(normalizeNotification).filter((item) => item.id))
    } catch (err: any) {
      setError(err?.message || "Failed to load notifications")
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [fetchLimit])

  React.useEffect(() => {
    void load()
  }, [load])

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })))
    try {
      await notificationsApi.markAllAsRead()
    } catch {
      void load()
    }
  }

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    try {
      await notificationsApi.delete(id)
    } catch {
      void load()
    }
  }

  const handleOpen = async (notification: NormalizedNotification) => {
    if (!notification.isRead) {
      setItems((prev) =>
        prev.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)),
      )
      notificationsApi.markAsRead(notification.id).catch(() => undefined)
    }

    const href = typeof notification.data?.url === "string" ? notification.data.url.trim() : ""
    if (href) {
      if (onNavigate) onNavigate(href)
      else router.push(href)
    }
  }

  return (
    <div className="rounded-2xl border bg-white shadow-sm" style={{ borderColor: "var(--bd)" }}>
      <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 className="text-base font-bold" style={{ color: "var(--t1)" }}>
            Inbox
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--t3)" }}>
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void handleMarkAllRead()} disabled={unreadCount === 0}>
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-3 p-10 text-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="text-sm font-medium">{error}</p>
          <Button type="button" variant="outline" onClick={() => void load()}>
            Try again
          </Button>
        </div>
      ) : loading && items.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="p-10 text-center text-sm text-muted-foreground">No notifications yet.</div>
      ) : (
        <ScrollArea className="max-h-[560px]">
          <div className="divide-y">
            {items.map((notification) => {
              const Icon = getNotificationIcon(notification.type)
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "group flex items-start gap-3 px-5 py-4 transition-colors hover:bg-slate-50",
                    !notification.isRead && "bg-primary/5",
                  )}
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    onClick={() => void handleOpen(notification)}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-gray-900">{notification.title}</p>
                        {!notification.isRead ? (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                        ) : null}
                      </div>
                      {notification.message ? (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{notification.message}</p>
                      ) : null}
                      <p className="mt-2 text-xs text-muted-foreground">{relativeTime(notification.createdAt)}</p>
                    </div>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 opacity-0 group-hover:opacity-100"
                    onClick={() => void handleDelete(notification.id)}
                    aria-label="Delete notification"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
