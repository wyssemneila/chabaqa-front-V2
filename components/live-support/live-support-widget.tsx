"use client"

import Image from "next/image"
import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { X, Send, Loader2, LifeBuoy, Bot, GripVertical, Headphones } from "lucide-react"
import { io, Socket } from "socket.io-client"
import { api } from "@/lib/api"
import { resolveSocketBaseUrl } from "@/lib/socket-url"
import { cn } from "@/lib/utils"
import type { LiveSupportMessage, LiveSupportStatus, LiveSupportTicket } from "@/lib/api/core/types"
import { useAuthContext } from "@/app/providers/auth-provider"

const QUICK_QUESTIONS = [
  "How do I create my first community?",
  "How do payouts work?",
  "How can I reset my password?",
  "How do I contact billing support?",
]

const WELCOME_MSG = "Hey there! 👋 Welcome to Chabaqa — if you need anything at all, I'm right here for you!"
const WELCOME_KEY = "chabaqa_support_welcomed"
const NOTIF_SOUND_KEY = "chabaqa_support_sound"

function playNotifSound() {
  const audio = new Audio("/sounds/notification.mp3")
  audio.volume = 1
  const tryPlay = () => audio.play().catch(() => {
    const retry = () => {
      audio.play().catch(() => {})
      window.removeEventListener("mousemove", retry)
      window.removeEventListener("click", retry)
      window.removeEventListener("scroll", retry)
      window.removeEventListener("touchstart", retry)
      window.removeEventListener("pointerdown", retry)
    }
    window.addEventListener("mousemove", retry, { once: true })
    window.addEventListener("click", retry, { once: true })
    window.addEventListener("scroll", retry, { once: true })
    window.addEventListener("touchstart", retry, { once: true })
    window.addEventListener("pointerdown", retry, { once: true })
  })
  tryPlay()
}

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

  const [open,             setOpen]             = useState(false)
  const [loading,          setLoading]          = useState(false)
  const [sending,          setSending]          = useState(false)
  const [text,             setText]             = useState("")
  const [ticket,           setTicket]           = useState<LiveSupportTicket | null>(null)
  const [messages,         setMessages]         = useState<LiveSupportMessage[]>([])
  const [socketConnected,  setSocketConnected]  = useState(false)
  const [requestingAdmin,  setRequestingAdmin]  = useState(false)
  const [error,            setError]            = useState<string | null>(null)

  const [unread,           setUnread]           = useState(0)
  const [toastMsg,         setToastMsg]         = useState<string | null>(null)

  const scrollRef  = useRef<HTMLDivElement | null>(null)
  const socketRef  = useRef<Socket | null>(null)
  const inputRef   = useRef<HTMLInputElement | null>(null)
  const prevMsgCount = useRef(0)

  // ── drag state ──────────────────────────────────────────────────────────────
  const [pos,      setPos]      = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart  = useRef({ mx: 0, my: 0, ex: 0, ey: 0 })

  const onDragStart = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    setDragging(true)
    dragStart.current = { mx: e.clientX, my: e.clientY, ex: pos.x, ey: pos.y }
    window.addEventListener("pointermove", onDragMove)
    window.addEventListener("pointerup", onDragEnd)
  }

  const onDragMove = (e: PointerEvent) => {
    const dx = e.clientX - dragStart.current.mx
    const dy = e.clientY - dragStart.current.my
    setPos({ x: dragStart.current.ex + dx, y: dragStart.current.ey + dy })
  }

  const onDragEnd = () => {
    setDragging(false)
    window.removeEventListener("pointermove", onDragMove)
    window.removeEventListener("pointerup", onDragEnd)
  }

  useEffect(() => () => {
    window.removeEventListener("pointermove", onDragMove)
    window.removeEventListener("pointerup", onDragEnd)
  }, [])

  // ── welcome auto-message (once per new tab, not on refresh) ─────────────────
  useEffect(() => {
    const already = sessionStorage.getItem(WELCOME_KEY)
    if (already) return

    sessionStorage.setItem(WELCOME_KEY, "1")

    const timer = setTimeout(() => {
      setToastMsg(WELCOME_MSG)
      setUnread(1)
      playNotifSound()

      setTimeout(() => {
        setToastMsg(null)
      }, 40000)
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  // ── mark as read when user opens the panel ──────────────────────────────────
  const handleOpen = useCallback(() => {
    setOpen(v => {
      if (!v) {
        setUnread(0)
        setToastMsg(null)
      }
      return !v
    })
  }, [])

  // ── track incoming messages for unread badge + sound ────────────────────────
  useEffect(() => {
    if (messages.length > prevMsgCount.current && prevMsgCount.current > 0) {
      const newest = messages[messages.length - 1]
      if (newest && newest.senderType !== "user") {
        if (!open) {
          setUnread(u => u + 1)
          setToastMsg(newest.text?.slice(0, 80) || "New message")
          playNotifSound()
          setTimeout(() => setToastMsg(null), 40000)
        }
      }
    }
    prevMsgCount.current = messages.length
  }, [messages, open])

  const status = (ticket?.supportStatus || "BOT_ACTIVE") as LiveSupportStatus
  const statusLabel = useMemo(() => {
    if (status === "BOT_ACTIVE")     return "AI Assistant"
    if (status === "WAITING_ADMIN")  return "Waiting for Agent"
    if (status === "ASSIGNED")       return "Agent Connected"
    return "Closed"
  }, [status])

  const appendMessageIfNew = (message: LiveSupportMessage) => {
    setMessages(prev => prev.some(m => m.id === message.id) ? prev : [...prev, message])
  }

  const loadData = async () => {
    if (!isAuthenticated) return
    setLoading(true); setError(null)
    try {
      const [ticketRes, messagesRes] = await Promise.all([
        api.liveSupport.getMyTicket(),
        api.liveSupport.getMyMessages({ limit: 100 }),
      ])
      setTicket(ticketRes.ticket)
      setMessages(messagesRes.messages || [])
    } catch (e: any) {
      setError(e?.message || "Failed to load chat")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (open && isAuthenticated) { loadData(); setTimeout(() => inputRef.current?.focus(), 300) } }, [open, isAuthenticated])

  useEffect(() => {
    if (!open || !isAuthenticated || !token) return
    const socketUrl = resolveSocketBaseUrl(process.env.NEXT_PUBLIC_API_URL)
    const socket = io(`${socketUrl}/live-support`, {
      auth: { token: `Bearer ${token}` },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
    socketRef.current = socket
    socket.on("connect", () => { setSocketConnected(true); if (ticket?.id) socket.emit("support:join-ticket", { conversationId: ticket.id }) })
    socket.on("disconnect", () => setSocketConnected(false))
    const upd = (key: string) => socket.on(key, ({ ticket: t }: any) => t && setTicket(prev => (!prev || prev.id === (t.id||t._id)) ? t : prev))
    upd("support:ticket:created"); upd("support:ticket:updated"); upd("support:ticket:claimed"); upd("support:ticket:closed")
    socket.on("support:message:new", ({ conversationId, message }: any) => {
      if (!message || !ticket?.id || ticket.id !== conversationId) return
      appendMessageIfNew(normalizeIncomingMessage(message))
    })
    return () => { socket.disconnect(); socketRef.current = null; setSocketConnected(false) }
  }, [open, isAuthenticated, token, ticket?.id])

  useEffect(() => { if (socketConnected && socketRef.current && ticket?.id) socketRef.current.emit("support:join-ticket", { conversationId: ticket.id }) }, [socketConnected, ticket?.id])
  useEffect(() => { if (!open || socketConnected) return; const i = setInterval(() => loadData().catch(()=>{}), 12000); return () => clearInterval(i) }, [open, socketConnected, isAuthenticated])
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, loading, sending])

  const onSend = async (presetText?: string) => {
    if (sending || !isAuthenticated) return
    const value = String(presetText ?? text).trim()
    if (!value) return
    setText(""); setSending(true); setError(null)
    try {
      const result = await api.liveSupport.sendMyMessage(value)
      if (result.ticket)      setTicket(result.ticket)
      if (result.userMessage) appendMessageIfNew(result.userMessage as LiveSupportMessage)
      if (result.aiMessage)   appendMessageIfNew(result.aiMessage as LiveSupportMessage)
    } catch (e: any) {
      if (!presetText) setText(value)
      setError(e?.message || "Failed to send")
    } finally {
      setSending(false)
    }
  }

  const onRequestAdmin = async () => {
    if (!ticket?.id || requestingAdmin) return
    setRequestingAdmin(true); setError(null)
    try { const r = await api.liveSupport.requestAdmin(ticket.id); setTicket(r.ticket) }
    catch (e: any) { setError(e?.message || "Failed to request agent") }
    finally { setRequestingAdmin(false) }
  }

  if (!enabled) return null
  const isAdmin = isAuthenticated && user?.role === "admin"
  if (isAdmin) return null

  return (
    <div
      className="fixed z-[120]"
      style={{
        right: 24 - pos.x,
        bottom: 24 - pos.y,
        touchAction: "none",
        userSelect: dragging ? "none" : "auto",
      }}>

      {/* ── chat panel ─────────────────────────────────────────────────────── */}
      {open && (
        <div
          className="mb-3 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: "#fff",
            border: "1px solid rgba(142,120,251,.12)",
            boxShadow: "0 12px 40px rgba(26,23,48,.12)",
          }}>

          {/* header */}
          <div
            className="relative px-4 py-3.5 flex flex-col gap-2.5 cursor-grab active:cursor-grabbing select-none"
            style={{ background: "linear-gradient(135deg, #8e78fb 0%, #6c52f0 100%)" }}
            onPointerDown={onDragStart}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,255,255,.18)" }}>
                  <Headphones className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[14px] font-bold leading-none text-white">Chabaqa AI Support</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,.7)" }}>
                    AI-powered · human handoff available
                  </p>
                </div>
              </div>
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-white/20"
                aria-label="Close"
                style={{ color: "white" }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,.15)", color: "white" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: status === "ASSIGNED" ? "#4ade80" : "#fbbf24" }} />
                {statusLabel}
              </span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,.15)", color: "white" }}>
                {socketConnected ? "Live" : "Polling"}
              </span>
              <span className="ml-auto flex items-center gap-1 text-[9px] font-medium" style={{ color: "rgba(255,255,255,.45)" }}>
                <GripVertical className="w-3 h-3" /> drag to move
              </span>
            </div>
          </div>

          {/* messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ maxHeight: 380, minHeight: 200, background: "#faf9ff" }}>
            {loading ? (
              <div className="flex items-center justify-center py-10 gap-2" style={{ color: "#9590b8" }}>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[13px]">Loading conversation…</span>
              </div>
            ) : (
              <>
                {messages.length === 0 && (
                  <div className="rounded-xl p-4" style={{ background: "white", border: "1px solid #ece9f6" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg,#8e78fb,#6c52f0)" }}>
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                      <p className="text-[13px] font-bold" style={{ color: "#1a1730" }}>Ask me anything</p>
                    </div>
                    <p className="text-[12px] leading-relaxed mb-3" style={{ color: "#9590b8" }}>
                      I can help you with Chabaqa features, billing, communities, and more. You can also request a human agent anytime.
                    </p>
                    {status === "BOT_ACTIVE" && (
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_QUESTIONS.map(q => (
                          <button key={q} type="button" onClick={() => onSend(q).catch(()=>{})}
                            disabled={sending}
                            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                            style={{ background: "#f4f2fc", color: "#8e78fb", border: "1px solid #ede9ff" }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#ede9ff"}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#f4f2fc"}>
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {messages.map(m => {
                  const isUser  = m.senderType === "user"
                  const isAdm   = m.senderType === "admin"
                  const label   = isUser ? null : isAdm ? "Agent" : "AI"
                  return (
                    <div key={m.id} className={cn("flex", isUser ? "justify-end" : "justify-start gap-2")}>
                      {!isUser && (
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: isAdm ? "#f4f2fc" : "linear-gradient(135deg,#8e78fb,#6c52f0)" }}>
                          {isAdm
                            ? <span className="text-[8px] font-black" style={{ color: "#6c52f0" }}>HU</span>
                            : <Bot className="w-3 h-3 text-white" />
                          }
                        </div>
                      )}
                      <div style={{ maxWidth: "82%" }}>
                        {label && (
                          <p className="text-[10px] font-bold mb-1 px-1" style={{ color: "#9590b8" }}>{label}</p>
                        )}
                        <div className="rounded-xl px-3 py-2 text-[13px] leading-relaxed"
                          style={isUser
                            ? { background: "linear-gradient(135deg,#8e78fb,#6c52f0)", color: "white", borderBottomRightRadius: 4 }
                            : { background: "white", color: "#1a1730", border: "1px solid #ece9f6", borderBottomLeftRadius: 4 }
                          }>
                          <p className="whitespace-pre-wrap break-words">{m.text}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={scrollRef} />
              </>
            )}
          </div>

          {/* error */}
          {error && (
            <div className="px-4 py-2 text-[11px] font-medium" style={{ background: "#fef2f2", color: "#dc2626", borderTop: "1px solid #fecaca" }}>
              {error}
            </div>
          )}

          {/* footer */}
          <div className="px-4 py-3 space-y-2" style={{ background: "white", borderTop: "1px solid #ece9f6" }}>
            {isAuthenticated && status === "BOT_ACTIVE" && ticket?.id && (
              <button onClick={onRequestAdmin} disabled={requestingAdmin}
                className="w-full h-9 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed transition-colors hover:opacity-80"
                style={{ background: "#f4f2fc", color: "#8e78fb" }}>
                {requestingAdmin
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting to agent…</>
                  : <><LifeBuoy className="w-3.5 h-3.5" /> Talk to a human agent</>
                }
              </button>
            )}

            {!isAuthenticated ? (
              <p className="text-[12px] text-center py-2" style={{ color: "#9590b8" }}>
                Sign in to chat with us
              </p>
            ) : (
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onSend().catch(()=>{}) } }}
                  disabled={sending || loading}
                  placeholder={status === "CLOSED" ? "Send a message to reopen…" : "Ask anything…"}
                  className="flex-1 h-10 px-4 rounded-xl text-[13px] focus:outline-none transition-colors disabled:opacity-50"
                  style={{ background: "#faf9ff", border: "1.5px solid #ece9f6", color: "#1a1730" }}
                  onFocus={e => (e.target as HTMLElement).style.borderColor = "#8e78fb"}
                  onBlur={e  => (e.target as HTMLElement).style.borderColor = "#ece9f6"}
                />
                <button
                  onClick={() => onSend().catch(()=>{})}
                  disabled={sending || loading || !text.trim()}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white cursor-pointer disabled:cursor-not-allowed transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#8e78fb,#6c52f0)" }}>
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            )}

            {isAuthenticated && !socketConnected && (
              <p className="text-[10px] text-center" style={{ color: "#9590b8" }}>
                Reconnecting realtime… using auto-refresh
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── toast preview bubble ────────────────────────────────────────────── */}
      {!open && toastMsg && (
        <div
          className="mb-2 flex justify-end"
          style={{ animation: "supportToastIn .3s ease both" }}
        >
          <style>{`
            @keyframes supportToastIn {
              from { opacity: 0; transform: translateY(8px) scale(.95); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
          <div
            className="max-w-[260px] px-3.5 py-2.5 rounded-xl text-[12px] leading-relaxed"
            style={{
              background: "#fff",
              color: "#1a1730",
              border: "1px solid #ece9f6",
              boxShadow: "0 4px 16px rgba(26,23,48,.1)",
            }}
          >
            {toastMsg}
          </div>
        </div>
      )}

      {/* ── floating button ─────────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          onPointerDown={onDragStart}
          onClick={e => { if (!dragging) handleOpen() }}
          aria-label="Open AI Support"
          className={cn(
            "relative w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all duration-200 cursor-pointer",
            dragging ? "cursor-grabbing scale-95" : "hover:scale-105"
          )}
          style={{
            background: "linear-gradient(135deg, #8e78fb 0%, #6c52f0 100%)",
            boxShadow: "0 4px 14px rgba(142,120,251,.25)",
          }}>
          {open
            ? <X className="w-5 h-5" />
            : <Headphones className="w-5.5 h-5.5" />
          }

          {/* unread badge */}
          {!open && unread > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
              style={{ background: "#ef4444", boxShadow: "0 2px 6px rgba(239,68,68,.4)" }}
            >
              {unread}
            </span>
          )}
        </button>
      </div>

    </div>
  )
}
