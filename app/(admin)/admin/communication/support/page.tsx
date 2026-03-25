"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { io, Socket } from "socket.io-client"
import { toast } from "sonner"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { adminApi } from "@/lib/api/admin-api"
import { resolveSocketBaseUrl } from "@/lib/socket-url"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, MessageSquare, Lock, CheckCircle2, Search, Mail, UserRound, Clock3, Hash, AtSign } from "lucide-react"

type ViewMode = "available" | "mine" | "closed"

type TicketUser = {
  _id?: string
  id?: string
  name?: string
  firstName?: string
  lastName?: string
  username?: string
  email?: string
  avatar?: string
  profile_picture?: string
  photo_profil?: string
  photo?: string
}

type Ticket = {
  id: string
  _id?: string
  participantA: string | TicketUser
  supportStatus: "BOT_ACTIVE" | "WAITING_ADMIN" | "ASSIGNED" | "CLOSED"
  isOpen: boolean
  assignedAdminId?: string
  lastMessageText?: string
  lastMessageAt?: string
  requestedAdminAt?: string
  claimedAt?: string
  createdAt: string
  updatedAt: string
}

type SupportMessage = {
  id: string
  senderType: "user" | "ai" | "admin"
  text: string
  createdAt: string
}

const statusTone: Record<Ticket["supportStatus"], string> = {
  BOT_ACTIVE: "bg-blue-100 text-blue-700 border-blue-200",
  WAITING_ADMIN: "bg-amber-100 text-amber-700 border-amber-200",
  ASSIGNED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CLOSED: "bg-slate-100 text-slate-700 border-slate-200",
}

function getTicketUser(ticket?: Ticket | null): TicketUser | null {
  if (!ticket) return null
  if (!ticket.participantA || typeof ticket.participantA === "string") return null
  return ticket.participantA
}

function getDisplayName(user: TicketUser | null, fallbackId?: string) {
  if (!user) return fallbackId || "Unknown user"
  const full = `${user.firstName || ""} ${user.lastName || ""}`.trim()
  return user.name || full || (user.username ? `@${user.username}` : "Unknown user")
}

function getEmail(user: TicketUser | null) {
  return user?.email || "No email"
}

function getAvatar(user: TicketUser | null) {
  return user?.avatar || user?.profile_picture || user?.photo_profil || user?.photo || ""
}

function getShortId(value?: string) {
  if (!value) return "-"
  if (value.length <= 10) return value
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

export default function AdminLiveSupportPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading, admin } = useAdminAuth()
  const [view, setView] = useState<ViewMode>("available")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [messageText, setMessageText] = useState("")
  const [sending, setSending] = useState(false)
  const [acting, setActing] = useState(false)
  const [counts, setCounts] = useState({ available: 0, mine: 0, closed: 0 })
  const [socketConnected, setSocketConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const selectedId = selected?.id || selected?._id || null

  const selectedUser = useMemo(() => getTicketUser(selected), [selected])

  const loadCounts = async () => {
    try {
      const res = await adminApi.support.getQueueCounts()
      const root = (res as any)?.data ?? res
      setCounts({
        available: Number(root?.available || 0),
        mine: Number(root?.mine || 0),
        closed: Number(root?.closed || 0),
      })
    } catch {
      // no-op
    }
  }

  const loadTickets = async () => {
    setLoading(true)
    try {
      const res = await adminApi.support.listTickets({ view, search: search || undefined, page: 1, limit: 50 })
      const root = (res as any)?.data ?? res
      const items = (root?.items || []).map((t: any) => ({ ...t, id: t.id || t._id }))
      setTickets(items)

      if (selectedId) {
        const next = items.find((t: Ticket) => t.id === selectedId)
        setSelected(next || null)
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to load tickets")
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (ticketId: string) => {
    try {
      const res = await adminApi.support.getMessages(ticketId, { limit: 100 })
      const root = (res as any)?.data ?? res
      setMessages((root?.messages || []).map((m: any) => ({ ...m, id: m.id || m._id })))
      if (root?.ticket) setSelected({ ...root.ticket, id: root.ticket.id || root.ticket._id })
    } catch (e: any) {
      toast.error(e?.message || "Failed to load messages")
    }
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/admin/login")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated || authLoading) return
    loadCounts().catch(() => undefined)
    loadTickets().catch(() => undefined)
  }, [isAuthenticated, authLoading, view])

  useEffect(() => {
    if (!selectedId) {
      setMessages([])
      return
    }
    loadMessages(selectedId).catch(() => undefined)
  }, [selectedId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!isAuthenticated) return

    const token = typeof window !== "undefined" ? localStorage.getItem("admin_access_token") : null
    if (!token) return

    const socketUrl = resolveSocketBaseUrl(process.env.NEXT_PUBLIC_API_URL)
    const socket = io(`${socketUrl}/live-support`, {
      auth: { token: `Bearer ${token}` },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket

    socket.on("connect", () => {
      setSocketConnected(true)
      if (selectedId) socket.emit("support:join-ticket", { conversationId: selectedId })
    })

    socket.on("disconnect", () => setSocketConnected(false))

    const onTicketMutation = () => {
      loadCounts().catch(() => undefined)
      loadTickets().catch(() => undefined)
    }

    socket.on("support:ticket:created", () => {
      onTicketMutation()
      toast.info("New live support ticket")
    })
    socket.on("support:ticket:updated", onTicketMutation)
    socket.on("support:ticket:claimed", onTicketMutation)
    socket.on("support:ticket:closed", onTicketMutation)

    socket.on("support:message:new", ({ conversationId, message }: any) => {
      if (!message || !selectedId || conversationId !== selectedId) return
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === (message.id || message._id))
        if (exists) return prev
        return [...prev, { ...message, id: message.id || message._id }]
      })
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      setSocketConnected(false)
    }
  }, [isAuthenticated, selectedId])

  useEffect(() => {
    if (socketConnected) return
    const interval = setInterval(() => {
      loadCounts().catch(() => undefined)
      loadTickets().catch(() => undefined)
      if (selectedId) loadMessages(selectedId).catch(() => undefined)
    }, 12000)
    return () => clearInterval(interval)
  }, [socketConnected, selectedId, view, search])

  const canReply = useMemo(() => {
    if (!selected) return false
    if (!admin?._id) return false
    return selected.isOpen && selected.supportStatus === "ASSIGNED" && selected.assignedAdminId === admin._id
  }, [selected, admin?._id])

  const claimTicket = async () => {
    if (!selectedId) return
    setActing(true)
    try {
      await adminApi.support.claimTicket(selectedId)
      toast.success("Ticket claimed")
      await Promise.all([loadCounts(), loadTickets(), loadMessages(selectedId)])
    } catch (e: any) {
      toast.error(e?.message || "Failed to claim ticket")
      await loadTickets()
    } finally {
      setActing(false)
    }
  }

  const closeTicket = async () => {
    if (!selectedId) return
    setActing(true)
    try {
      await adminApi.support.closeTicket(selectedId)
      toast.success("Ticket closed")
      await Promise.all([loadCounts(), loadTickets(), loadMessages(selectedId)])
    } catch (e: any) {
      toast.error(e?.message || "Failed to close ticket")
    } finally {
      setActing(false)
    }
  }

  const sendMessage = async () => {
    if (!selectedId || !messageText.trim() || !canReply) return
    const text = messageText.trim()
    setMessageText("")
    setSending(true)
    try {
      const res = await adminApi.support.sendMessage(selectedId, text)
      const root = (res as any)?.data ?? res
      if (root?.message) {
        setMessages((prev) => [...prev, { ...root.message, id: root.message.id || root.message._id }])
      }
      await loadTickets()
    } catch (e: any) {
      setMessageText(text)
      toast.error(e?.message || "Failed to send message")
    } finally {
      setSending(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-gradient-to-r from-slate-50 to-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Live Support</h1>
            <p className="text-sm text-muted-foreground">AI-first tickets with admin takeover and locking.</p>
          </div>
          <Badge variant={socketConnected ? "default" : "secondary"}>
            {socketConnected ? "Realtime connected" : "Polling fallback"}
          </Badge>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Card className="shadow-none">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Available</p>
              <p className="text-xl font-semibold">{counts.available}</p>
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">My Tickets</p>
              <p className="text-xl font-semibold">{counts.mine}</p>
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Closed</p>
              <p className="text-xl font-semibold">{counts.closed}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={view === "available" ? "default" : "outline"} onClick={() => setView("available")}>Available ({counts.available})</Button>
        <Button variant={view === "mine" ? "default" : "outline"} onClick={() => setView("mine")}>My Tickets ({counts.mine})</Button>
        <Button variant={view === "closed" ? "default" : "outline"} onClick={() => setView("closed")}>Closed ({counts.closed})</Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <Card className="h-[calc(100vh-270px)] min-h-[520px]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Conversations</CardTitle>
            <CardDescription>Search and select a support ticket.</CardDescription>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by message text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") loadTickets().catch(() => undefined)
                }}
              />
            </div>
          </CardHeader>
          <CardContent className="max-h-[calc(100%-140px)] space-y-2 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading tickets...
              </div>
            ) : tickets.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No tickets found.</p>
            ) : (
              tickets.map((ticket) => {
                const user = getTicketUser(ticket)
                return (
                  <button
                    key={ticket.id}
                    className={`w-full rounded-xl border p-3 text-left transition ${selectedId === ticket.id ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}
                    onClick={() => setSelected(ticket)}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Badge className={`border ${statusTone[ticket.supportStatus]}`}>{ticket.supportStatus.replace("_", " ")}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(ticket.updatedAt).toLocaleString()}</span>
                    </div>
                    <div className="mb-2 flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={getAvatar(user)} />
                        <AvatarFallback>{getDisplayName(user, ticket.participantA as string).slice(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{getDisplayName(user, ticket.participantA as string)}</p>
                        <p className="truncate text-xs text-muted-foreground">{user?.email || user?.username || getShortId(ticket.participantA as string)}</p>
                      </div>
                    </div>
                    <p className="line-clamp-2 text-sm text-foreground">{ticket.lastMessageText || "No messages yet"}</p>
                  </button>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card className="h-[calc(100vh-270px)] min-h-[520px]">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">{selected ? `Ticket ${selected.id}` : "Select a ticket"}</CardTitle>
                {selected && <CardDescription>Conversation with {getDisplayName(selectedUser, selected.participantA as string)}</CardDescription>}
              </div>
              {selected && (
                <div className="flex items-center gap-2">
                  <Badge className={`border ${statusTone[selected.supportStatus]}`}>{selected.supportStatus.replace("_", " ")}</Badge>
                  {selected.supportStatus === "WAITING_ADMIN" && (
                    <Button size="sm" onClick={claimTicket} disabled={acting}>
                      <Lock className="mr-2 h-4 w-4" /> Take Ticket
                    </Button>
                  )}
                  {canReply && selected.isOpen && (
                    <Button size="sm" variant="outline" onClick={closeTicket} disabled={acting}>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Close
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="grid h-[calc(100%-88px)] gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            {!selected ? (
              <div className="col-span-full flex h-full items-center justify-center text-sm text-muted-foreground">
                <MessageSquare className="mr-2 h-4 w-4" /> Pick a ticket from the left panel.
              </div>
            ) : (
              <>
                <div className="flex min-h-0 flex-col">
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-lg border bg-muted/10 p-3">
                    {messages.length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
                    {messages.map((m) => (
                      <div key={m.id} className={`flex ${m.senderType === "admin" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                            m.senderType === "admin" ? "bg-black text-white" : m.senderType === "user" ? "bg-white border" : "bg-slate-200 text-slate-900"
                          }`}
                        >
                          <div className="mb-1 flex items-center gap-2 text-[10px] uppercase opacity-70">
                            <span>{m.senderType}</span>
                            <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <div className="whitespace-pre-wrap break-words">{m.text}</div>
                        </div>
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={canReply ? "Type your reply" : "Reply disabled"}
                      disabled={!canReply || sending}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          sendMessage().catch(() => undefined)
                        }
                      }}
                    />
                    <Button onClick={() => sendMessage().catch(() => undefined)} disabled={!canReply || sending || !messageText.trim()}>
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
                    </Button>
                  </div>
                </div>

                <aside className="space-y-3 rounded-lg border bg-muted/10 p-3">
                  <h3 className="text-sm font-semibold">User Details</h3>

                  <div className="flex items-center gap-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={getAvatar(selectedUser)} />
                      <AvatarFallback>{getDisplayName(selectedUser, selected.participantA as string).slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{getDisplayName(selectedUser, selected.participantA as string)}</p>
                      <p className="truncate text-xs text-muted-foreground">{selectedUser?.username ? `@${selectedUser.username}` : "No username"}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 rounded-md border bg-white px-2 py-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate">{getEmail(selectedUser)}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border bg-white px-2 py-1.5">
                      <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate">User ID: {getShortId(selectedUser?.id || selectedUser?._id || (selected.participantA as string))}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border bg-white px-2 py-1.5">
                      <AtSign className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Ticket: {getShortId(selected.id)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <p className="font-medium text-muted-foreground">Timeline</p>
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Created: {new Date(selected.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Updated: {new Date(selected.updatedAt).toLocaleString()}</span>
                    </div>
                    {selected.requestedAdminAt && (
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Requested admin: {new Date(selected.requestedAdminAt).toLocaleString()}</span>
                      </div>
                    )}
                    {selected.claimedAt && (
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Claimed: {new Date(selected.claimedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="rounded-md border bg-white p-2 text-xs text-muted-foreground">
                    <div className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
                      <UserRound className="h-3.5 w-3.5" /> Owner
                    </div>
                    {selected.assignedAdminId === admin?._id ? "Assigned to you" : selected.assignedAdminId ? "Assigned to another admin" : "Not assigned"}
                  </div>
                </aside>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
