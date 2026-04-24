"use client"

import { useEffect, useRef } from "react"
import { io, Socket } from "socket.io-client"
import { useAuthContext } from "@/app/providers/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { resolveSocketBaseUrl } from "@/lib/socket-url"

type IncomingNotification = {
  id?: string
  type?: string
  title?: string
  body?: string
  message?: string
  isRead?: boolean
  data?: Record<string, any>
}

const NOTIFICATION_EVENT = "creator:notification-received"

export function CreatorNotificationListener() {
  const { user, isAuthenticated } = useAuthContext()
  const { toast } = useToast()
  const socketRef = useRef<Socket | null>(null)
  const seenNotificationIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const userId = user?._id ? String(user._id) : ""
    if (!isAuthenticated || !userId) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      return
    }

    const socketUrl = resolveSocketBaseUrl(process.env.NEXT_PUBLIC_API_URL)
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
    })
    socketRef.current = socket

    socket.on("connect", () => {
      socket.emit("register", userId)
    })

    socket.on("notification", (notification: IncomingNotification) => {
      const notificationId = String(notification?.id || "").trim()
      if (notificationId) {
        if (seenNotificationIdsRef.current.has(notificationId)) {
          return
        }
        seenNotificationIdsRef.current.add(notificationId)
        if (seenNotificationIdsRef.current.size > 300) {
          seenNotificationIdsRef.current.clear()
          seenNotificationIdsRef.current.add(notificationId)
        }
      }

      const title = String(notification?.title || "New Notification").trim()
      const description = String(notification?.message || notification?.body || "").trim()
      toast({
        title: (
          <div className="flex items-center gap-2">
            <img
              src="/Logos/PNG/brandmark.png"
              alt="Chabaqa"
              className="h-5 w-5 rounded-sm object-contain"
            />
            <span className="font-semibold text-chabaqa-primary">{title}</span>
          </div>
        ),
        description: (
          <span className="text-[13px] text-slate-700">
            {description || "You received a new notification."}
          </span>
        ),
        className:
          "border border-chabaqa-primary/35 bg-gradient-to-r from-chabaqa-primary/10 via-white to-chabaqa-secondary1/10 shadow-xl",
        duration: 30000,
      })

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(NOTIFICATION_EVENT, {
            detail: { notification },
          }),
        )
      }
    })

    return () => {
      try {
        socket.emit("unregister")
      } catch {}
      socket.disconnect()
      if (socketRef.current === socket) {
        socketRef.current = null
      }
    }
  }, [isAuthenticated, user?._id, toast])

  return null
}
