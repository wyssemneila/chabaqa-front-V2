"use client"

import Image from "next/image"
import { motion, useDragControls } from "framer-motion"
import { useEffect, useMemo, useRef, useState } from "react"
import { X, Send, Loader2, Sparkles, LifeBuoy } from "lucide-react"
import { io, Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api } from "@/lib/api"
import { resolveSocketBaseUrl } from "@/lib/socket-url"
import { cn } from "@/lib/utils"
import type { LiveSupportMessage, LiveSupportStatus, LiveSupportTicket } from "@/lib/api/core/types"
import { useAuthContext } from "@/app/providers/auth-provider"

const QUICK_QUESTIONS = [
  "How do I start my first community on Chabaqa?",
  "How can I reset my account password?",
  "How do payouts and subscriptions work?",
  "Where can I contact support for billing?",
]

function normalizeIncomingMessage(message: any): LiveSupportMessage {
  return {
    ...message,
    id: message.id || message._id,
    conversationId: message.conversationId?.toString?.() || message.conversationId,
  }
}

export function LiveSupportWidget() {
  const enabled = process.env.NEXT_PUBLIC_LIVE_SUPPORT_ENABLED !== "false"
  const { user, token, isAuthenticated } = useAuthContext()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [text, setText] = useState("")
  const [ticket, setTicket] = useState<LiveSupportTicket | null>(null)
  const [messages, setMessages] = useState<LiveSupportMessage[]>([])
  const [socketConnected, setSocketConnected] = useState(false)
  const [requestingAdmin, setRequestingAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const socketRef = useRef<Socket | null>(null)

  const [isDesktop, setIsDesktop] = useState(false)
  const dragControls = useDragControls()

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const status = (ticket?.supportStatus || "BOT_ACTIVE") as LiveSupportStatus

  const statusLabel = useMemo(() => {
    if (status === "BOT_ACTIVE") return "AI Assistant"
    if (status === "WAITING_ADMIN") return "Waiting Admin"
    if (status === "ASSIGNED") return "Admin Connected"
    return "Closed"
  }, [status])

  const appendMessageIfNew = (message: LiveSupportMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev
      return [...prev, message]
    })
  }

  const loadData = async () => {
    if (!isAuthenticated) return
    setLoading(true)
    setError(null)
    try {
      const [ticketRes, messagesRes] = await Promise.all([
        api.liveSupport.getMyTicket(),
        api.liveSupport.getMyMessages({ limit: 100 }),
      ])
      setTicket(ticketRes.ticket)
      setMessages(messagesRes.messages || [])
    } catch (e: any) {
      setError(e?.message || "Failed to load support chat")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    loadData()
  }, [open, isAuthenticated])

  useEffect(() => {
    if (!open || !isAuthenticated || !token) return

    const socketUrl = resolveSocketBaseUrl(process.env.NEXT_PUBLIC_API_URL)
    const socket = io(`${socketUrl}/live-support`, {
      auth: { token: `Bearer ${token}` },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket

    socket.on("connect", () => {
      setSocketConnected(true)
      if (ticket?.id) {
        socket.emit("support:join-ticket", { conversationId: ticket.id })
      }
    })

    socket.on("disconnect", () => setSocketConnected(false))

    socket.on("support:ticket:created", ({ ticket: created }: any) => {
      if (!created) return
      setTicket((prev) => {
        if (!prev || prev.id === (created.id || created._id)) return created
        return prev
      })
    })

    socket.on("support:ticket:updated", ({ ticket: updated }: any) => {
      if (!updated) return
      setTicket((prev) => {
        if (!prev || prev.id === (updated.id || updated._id)) return updated
        return prev
      })
    })

    socket.on("support:ticket:claimed", ({ ticket: updated }: any) => {
      if (!updated) return
      setTicket((prev) => {
        if (!prev || prev.id === (updated.id || updated._id)) return updated
        return prev
      })
    })

    socket.on("support:ticket:closed", ({ ticket: updated }: any) => {
      if (!updated) return
      setTicket((prev) => {
        if (!prev || prev.id === (updated.id || updated._id)) return updated
        return prev
      })
    })

    socket.on("support:message:new", ({ conversationId, message }: any) => {
      if (!message) return
      if (!ticket?.id || ticket.id !== conversationId) return
      appendMessageIfNew(normalizeIncomingMessage(message))
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      setSocketConnected(false)
    }
  }, [open, isAuthenticated, token, ticket?.id])

  useEffect(() => {
    if (!socketConnected || !socketRef.current || !ticket?.id) return
    socketRef.current.emit("support:join-ticket", { conversationId: ticket.id })
  }, [socketConnected, ticket?.id])

  useEffect(() => {
    if (!open || socketConnected) return
    const interval = setInterval(() => {
      loadData().catch(() => undefined)
    }, 12000)
    return () => clearInterval(interval)
  }, [open, socketConnected, isAuthenticated])

  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading, sending])

  const onSend = async (presetText?: string) => {
    if (sending || !isAuthenticated) return

    const value = String(presetText ?? text).trim()
    if (!value) return

    setText("")
    setSending(true)
    setError(null)

    try {
      const result = await api.liveSupport.sendMyMessage(value)
      if (result.ticket) setTicket(result.ticket)
      if (result.userMessage) appendMessageIfNew(result.userMessage as LiveSupportMessage)
      if (result.aiMessage) appendMessageIfNew(result.aiMessage as LiveSupportMessage)
    } catch (e: any) {
      if (!presetText) setText(value)
      setError(e?.message || "Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const onRequestAdmin = async () => {
    if (!ticket?.id || requestingAdmin) return
    setRequestingAdmin(true)
    setError(null)
    try {
      const result = await api.liveSupport.requestAdmin(ticket.id)
      setTicket(result.ticket)
    } catch (e: any) {
      setError(e?.message || "Failed to request admin")
    } finally {
      setRequestingAdmin(false)
    }
  }

  if (!enabled || !isAuthenticated || !user || user.role === "admin") return null

  return (
    <motion.div 
      drag={isDesktop}
      dragMomentum={false}
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={typeof window !== 'undefined' ? { left: -window.innerWidth + 100, right: 0, top: -window.innerHeight + 100, bottom: 0 } : undefined}
      className={cn("fixed z-[120] flex flex-col items-end", isDesktop ? "" : "bottom-4 right-4 sm:bottom-6 sm:right-6")}
      style={isDesktop ? { right: 24, bottom: 24, touchAction: "none" } : undefined}
    >
      {open && (
        <div className="mb-3 w-[370px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-3xl border border-chabaqa-secondary2/30 bg-white shadow-2xl shadow-chabaqa-primary/20">
          <div 
             className={cn("bg-gradient-to-r from-[#4c1d95] via-[#6d28d9] to-[#8b5cf6] px-4 py-3 text-white transition-colors duration-200", isDesktop && "cursor-grab active:cursor-grabbing")}
             onPointerDown={(e) => isDesktop ? dragControls.start(e) : undefined}
             style={{ touchAction: "none" }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-white/30 bg-white/15 p-1.5">
                  <Image
                    src="/Logos/PNG/pop.png"
                    alt="Chabaqa"
                    width={24}
                    height={24}
                    className="h-6 w-6"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-none">Chabaqa Live Support</p>
                  <p className="mt-1 text-xs text-white/90">Fast AI help, then human admin handoff</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-full text-white hover:bg-white/20 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Badge className="bg-white/15 text-white hover:bg-white/15">{statusLabel}</Badge>
              <Badge className="bg-white/15 text-white hover:bg-white/15">
                {socketConnected ? "Realtime" : "Fallback refresh"}
              </Badge>
            </div>
          </div>

          <ScrollArea className="h-[370px] bg-gradient-to-b from-white to-slate-50 px-4 py-3">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="me-2 h-4 w-4 animate-spin" /> Loading support conversation...
              </div>
            ) : (
              <div className="space-y-3">
                {messages.length === 0 && (
                  <div className="rounded-2xl border border-chabaqa-primary/10 bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Sparkles className="h-4 w-4 text-chabaqa-secondary1" />
                      Ask me anything about Chabaqa
                    </div>
                    <p className="mt-1 text-xs text-slate-600">
                      You can start with a common question, and request a human admin anytime.
                    </p>
                    {status === "BOT_ACTIVE" && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {QUICK_QUESTIONS.map((question) => (
                          <button
                            key={question}
                            type="button"
                            onClick={() => onSend(question).catch(() => undefined)}
                            className="rounded-full border border-chabaqa-primary/20 bg-chabaqa-primary/5 px-3 py-1 text-start text-xs font-medium text-chabaqa-primary transition hover:border-chabaqa-primary/40 hover:bg-chabaqa-primary/10"
                            disabled={sending}
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {messages.map((m) => {
                  const isUser = m.senderType === "user"
                  const isAdmin = m.senderType === "admin"
                  const senderLabel = isUser ? "You" : isAdmin ? "Admin" : "AI"

                  return (
                    <div key={m.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[88%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                          isUser
                            ? "bg-gradient-to-r from-[#5b21b6] to-[#8b5cf6] text-white"
                            : isAdmin
                              ? "border border-chabaqa-secondary1/20 bg-chabaqa-secondary1/10 text-slate-900"
                              : "border border-slate-200 bg-white text-slate-900"
                        )}
                      >
                        {!isUser && <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{senderLabel}</p>}
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      </div>
                    </div>
                  )
                })}
                <div ref={scrollRef} />
              </div>
            )}
          </ScrollArea>

          {error && <div className="px-4 pb-2 text-xs text-red-600">{error}</div>}

          <div className="border-t bg-white p-3">
            {status === "BOT_ACTIVE" && ticket?.id && (
              <Button
                className="mb-2 w-full bg-gradient-to-r from-[#5b21b6] to-[#8b5cf6] text-white hover:from-[#4c1d95] hover:to-[#7c3aed]"
                onClick={onRequestAdmin}
                disabled={requestingAdmin}
              >
                <LifeBuoy className="me-2 h-4 w-4" />
                {requestingAdmin ? "Requesting admin..." : "Request Admin"}
              </Button>
            )}

            <div className="flex gap-2">
              <Input
                placeholder={status === "CLOSED" ? "Ticket closed. Send to open a new ticket" : "Type your message"}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    onSend().catch(() => undefined)
                  }
                }}
                disabled={sending || loading}
                className="border-slate-300 focus-visible:ring-chabaqa-primary"
              />
              <Button
                size="icon"
                onClick={() => onSend().catch(() => undefined)}
                disabled={sending || loading || !text.trim()}
                className="bg-chabaqa-primary text-white hover:bg-chabaqa-primary/90"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            {!socketConnected && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Realtime reconnecting. Using safe refresh every few seconds.
              </p>
            )}
          </div>
        </div>
      )}

      <Button
        onPointerDown={(e) => isDesktop ? dragControls.start(e) : undefined}
        className={cn(
          "group relative h-16 w-16 overflow-hidden rounded-full border border-white/20 bg-gradient-to-br from-[#4c1d95] via-[#6d28d9] to-[#a855f7] shadow-[0_14px_30px_rgba(124,58,237,0.55)] transition hover:scale-[1.03] hover:shadow-[0_18px_36px_rgba(124,58,237,0.65)]",
          isDesktop && "cursor-move"
        )}
        style={{ touchAction: "none" }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Open live support"
      >
        <span className="absolute inset-0 bg-transparent transition group-hover:bg-white/10" />
        {open ? (
          <X className="relative h-7 w-7 text-white" />
        ) : (
          <Image
            src="/Logos/PNG/pop.png"
            alt="Chabaqa"
            width={30}
            height={30}
            className="relative h-8 w-8"
          />
        )}
      </Button>
    </motion.div>
  )
}
