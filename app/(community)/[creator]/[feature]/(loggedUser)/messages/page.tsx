"use client"

import React from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import {
  ArrowLeft,
  Copy,
  Eye,
  EyeOff,
  FileIcon,
  Loader2,
  MessageSquare,
  Paperclip,
  Reply,
  Search,
  Send,
  Video,
  X,
} from "lucide-react"
import { format, formatDistanceToNow, isSameDay, isToday, isYesterday } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import type { Conversation, Message, MessageAttachment } from "@/lib/api/types"
import { useAuthContext } from "@/app/providers/auth-provider"
import { useSocket } from "@/lib/socket-context"
import { getErrorMessage } from "@/lib/utils/error-messages"

const getParticipantId = (p: any): string => {
  if (!p) return ""
  if (typeof p === "string") return p
  return p.id || p._id || ""
}

const getOtherParticipant = (c: Conversation, myId: string): any => {
  const aId = getParticipantId(c.participantA)
  return aId === myId ? c.participantB : c.participantA
}

const getMyUnreadCount = (c: Conversation, myId: string): number => {
  const aId = getParticipantId(c.participantA)
  return aId === myId ? c.unreadCountA : c.unreadCountB
}

const getParticipantName = (p: any): string => {
  if (!p || typeof p === "string") return "User"
  return p.name || `${p.firstName || ""} ${p.lastName || ""}`.trim() || p.username || "User"
}

const getParticipantAvatar = (p: any): string | undefined => {
  if (!p || typeof p === "string") return undefined
  return p.avatar || p.profile_picture || p.photo_profil || p.photo
}

const formatMessageTime = (date: string) => {
  const d = new Date(date)
  if (isToday(d)) return format(d, "h:mm a")
  if (isYesterday(d)) return "Yesterday " + format(d, "h:mm a")
  return format(d, "MMM d, h:mm a")
}

const formatConversationTime = (date?: string) => {
  if (!date) return ""
  const d = new Date(date)
  if (isToday(d)) return format(d, "h:mm a")
  if (isYesterday(d)) return "Yesterday"
  return formatDistanceToNow(d, { addSuffix: false })
}

const formatDateSeparator = (date: string) => {
  const d = new Date(date)
  if (isToday(d)) return "Today"
  if (isYesterday(d)) return "Yesterday"
  return format(d, "MMMM d, yyyy")
}

const getMsgSenderId = (msg: Message, myId: string): { id: string; isMine: boolean } => {
  const rawSenderId = (msg as any).senderId
  const msgSenderId =
    typeof rawSenderId === "string"
      ? rawSenderId
      : rawSenderId?._id || rawSenderId?.id || (typeof rawSenderId?.toString === "function" ? rawSenderId.toString() : "")
  const isMine =
    msgSenderId === myId || (msg.sender as any)?._id === myId || (msg.sender as any)?.id === myId
  return { id: msgSenderId, isMine }
}

const getSessionChatClosedMessage = (conversation?: Conversation | null): string => {
  if (!conversation || conversation.type !== "SESSION_TEMP_DM" || conversation.isOpen) return ""
  if (conversation.closeReason === "session_finished") return "This session chat is closed because the session has finished."
  if (conversation.closeReason === "booking_cancelled") return "This session chat is closed because the booking was cancelled."
  if (conversation.closeReason === "booking_completed") return "This session chat is closed because the session was completed."
  return "This session chat is closed."
}

const isImageAttachment = (att: MessageAttachment) => {
  if (att.type === "image") return true
  return /\.(png|jpe?g|gif|webp)$/i.test(att.url || "")
}

const normalizeParam = (value: string | string[] | undefined): string => {
  if (!value) return ""
  return Array.isArray(value) ? value[0] : value
}

export default function MessagesPage() {
  const { user: currentUser } = useAuthContext()
  const { socket, isConnected, onlineUsers } = useSocket()
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const creator = normalizeParam(params?.creator as string | string[] | undefined)
  const feature = normalizeParam(params?.feature as string | string[] | undefined)

  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = React.useState<Conversation | null>(null)
  const [messages, setMessages] = React.useState<Message[]>([])
  const [isLoadingInbox, setIsLoadingInbox] = React.useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [newMessage, setNewMessage] = React.useState("")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = React.useState<string | null>(null)
  const [replyTarget, setReplyTarget] = React.useState<{ id: string; name: string; text: string } | null>(null)
  const myId = currentUser?.id || (currentUser as any)?._id || ""

  const scrollRef = React.useRef<HTMLDivElement>(null)
  const loadedConvIdRef = React.useRef<string | null>(null)
  const loadingConvRef = React.useRef<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const messagesBasePath = creator && feature ? `/${creator}/${feature}/messages` : "/messages"

  const scrollToBottom = React.useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    })
  }, [])

  const fetchConversations = React.useCallback(async () => {
    try {
      setIsLoadingInbox(true)
      const res = await api.dm.listInbox()
      setConversations(res.conversations || [])
    } catch (err) {
      console.error("Error fetching conversations:", err)
    } finally {
      setIsLoadingInbox(false)
    }
  }, [])

  const loadMessages = React.useCallback(async (convId: string) => {
    if (!convId || loadingConvRef.current === convId) return
    loadingConvRef.current = convId

    try {
      setIsLoadingMessages(true)
      const res = await api.dm.listMessages(convId)
      setMessages(res.messages || [])
      loadedConvIdRef.current = convId
      if (res.conversation?.id) {
        setSelectedConversation(res.conversation)
      }
      await api.dm.markRead(convId).catch(() => undefined)
      scrollToBottom()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoadingMessages(false)
      loadingConvRef.current = null
    }
  }, [scrollToBottom])

  const openConversationById = React.useCallback(async (conversationId: string) => {
    if (!conversationId) return
    setError(null)
    setSelectedConversation((prev) => {
      if (prev?.id === conversationId) return prev
      const existing = conversations.find((c) => c.id === conversationId)
      return existing || ({ id: conversationId } as Conversation)
    })
    await loadMessages(conversationId)
  }, [conversations, loadMessages])

  const ensurePeerConversation = React.useCallback(async (communityId: string, targetUserId: string) => {
    if (!communityId || !targetUserId) return
    if (targetUserId === myId) {
      setError("You can't message yourself")
      return
    }

    const existingConv = conversations.find((c) => {
      const otherId = getParticipantId(getOtherParticipant(c, myId))
      return otherId === targetUserId
    })

    if (existingConv?.id) {
      await openConversationById(existingConv.id)
      router.replace(`${messagesBasePath}?conversationId=${existingConv.id}`, { scroll: false })
      return
    }

    try {
      setIsLoadingMessages(true)
      const res = await api.dm.startPeerConversation(communityId, targetUserId)
      const conv = res?.conversation
      if (conv?.id) {
        await openConversationById(conv.id)
        router.replace(`${messagesBasePath}?conversationId=${conv.id}`, { scroll: false })
      }
      fetchConversations().catch(() => undefined)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoadingMessages(false)
    }
  }, [conversations, fetchConversations, messagesBasePath, myId, openConversationById, router])

  React.useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  React.useEffect(() => {
    const conversationId = searchParams.get("conversationId") || ""
    const communityId = searchParams.get("communityId") || ""
    const targetUserId = searchParams.get("targetUserId") || ""

    if (conversationId) {
      openConversationById(conversationId)
      return
    }

    if (communityId && targetUserId) {
      ensurePeerConversation(communityId, targetUserId)
    }
  }, [searchParams, ensurePeerConversation, openConversationById])

  React.useEffect(() => {
    if (selectedConversation?.id && selectedConversation.id !== loadedConvIdRef.current) {
      loadMessages(selectedConversation.id)
    }
  }, [selectedConversation?.id, loadMessages])

  React.useEffect(() => {
    if (selectedConversation && !isLoadingMessages) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [selectedConversation, isLoadingMessages])

  React.useEffect(() => {
    if (!socket) return

    const handleNewMessage = (payload: any) => {
      const message = payload?.message || payload
      const convId = message?.conversationId || payload?.conversationId
      if (!convId) {
        fetchConversations().catch(() => undefined)
        return
      }

      if (selectedConversation?.id === convId && message?.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev
          return [...prev, message]
        })
      } else {
        fetchConversations().catch(() => undefined)
      }
    }

    const handleRead = (payload: any) => {
      const convId = payload?.conversationId
      if (!convId) return
      if (selectedConversation?.id === convId) {
        const readAt = payload?.readAt || new Date().toISOString()
        setMessages((prev) =>
          prev.map((m) => {
            if (m.senderId === myId || (m.sender as any)?.id === myId || (m.sender as any)?._id === myId) {
              return { ...m, readAt }
            }
            return m
          }),
        )
      } else {
        fetchConversations().catch(() => undefined)
      }
    }

    socket.on("dm:message:new", handleNewMessage)
    socket.on("dm:message:read", handleRead)
    return () => {
      socket.off("dm:message:new", handleNewMessage)
      socket.off("dm:message:read", handleRead)
    }
  }, [fetchConversations, myId, selectedConversation?.id, socket])

  React.useEffect(() => {
    if (!socket || !selectedConversation?.id) return
    socket.emit("dm:join", { conversationId: selectedConversation.id })
  }, [socket, selectedConversation?.id])

  React.useEffect(() => {
    if (isConnected) return
    const interval = setInterval(() => {
      fetchConversations().catch(() => undefined)
    }, 30000)
    return () => clearInterval(interval)
  }, [isConnected, fetchConversations])

  // Note: no auto-refresh of the active thread to avoid disrupting typing.

  React.useEffect(() => {
    scrollToBottom()
  }, [messages.length, scrollToBottom])

  const handleSelectConversation = (conv: Conversation) => {
    setError(null)
    setSelectedConversation(conv)
    if (conv.id) {
      router.replace(`${messagesBasePath}?conversationId=${conv.id}`, { scroll: false })
    }
  }

  const handleBackToList = () => {
    setSelectedConversation(null)
    setMessages([])
    loadedConvIdRef.current = null
    setError(null)
    router.replace(messagesBasePath, { scroll: false })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!newMessage.trim() || !selectedConversation?.id) return
    if (selectedConversation.type === "SESSION_TEMP_DM" && !selectedConversation.isOpen) {
      setError(getSessionChatClosedMessage(selectedConversation))
      return
    }

    const text = newMessage.trim()
    setNewMessage("")
    setError(null)

    const tempId = `temp-${Date.now()}`
    const optimisticMsg: Message & { replyPreview?: { name: string; text: string } } = {
      id: tempId,
      conversationId: selectedConversation.id,
      senderId: myId,
      recipientId:
        getParticipantId(selectedConversation.participantA) === myId
          ? getParticipantId(selectedConversation.participantB)
          : getParticipantId(selectedConversation.participantA),
      text,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    if (replyTarget) {
      optimisticMsg.replyPreview = { name: replyTarget.name, text: replyTarget.text }
    }
    setMessages((prev) => [...prev, optimisticMsg])
    scrollToBottom()
    setReplyTarget(null)

    try {
      const res = await api.dm.sendMessage(selectedConversation.id, { text })
      const serverMsg = res?.message
      if (serverMsg?.id) {
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== tempId)
          if (withoutTemp.some((m) => m.id === serverMsg.id)) return withoutTemp
          const withReply = replyTarget
            ? { ...(serverMsg as any), replyPreview: { name: replyTarget.name, text: replyTarget.text } }
            : serverMsg
          return [...withoutTemp, withReply]
        })
      }
      fetchConversations().catch(() => undefined)
      scrollToBottom()
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setNewMessage(text)
      const rawMessage = getErrorMessage(err) || ""
      if (/session chat is closed/i.test(rawMessage)) {
        setError("This session chat is closed.")
      } else {
        setError(rawMessage || "Failed to send message")
      }
    }
  }

  const handleCopyMessage = async (text?: string) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error("Failed to copy message:", err)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!selectedConversation?.id) {
      setError("No conversation selected")
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const res = await api.dm.uploadAttachment(selectedConversation.id, file)
      const serverMsg = res?.message
      if (serverMsg?.id) {
        setMessages((prev) => [...prev, serverMsg])
        scrollToBottom()
        fetchConversations().catch(() => undefined)
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const filteredConversations = conversations.filter((c) => {
    const other = getOtherParticipant(c, myId)
    const name = getParticipantName(other)
    if (!searchQuery.trim()) return true
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const selectedConversationClosedMessage = getSessionChatClosedMessage(selectedConversation)
  const selectedOtherParticipant = selectedConversation ? getOtherParticipant(selectedConversation, myId) : null
  const selectedOtherId = getParticipantId(selectedOtherParticipant)
  const selectedIsOnline = selectedOtherId && onlineUsers.has(selectedOtherId)
  const totalUnread = conversations.reduce((sum, conv) => sum + Math.max(0, getMyUnreadCount(conv, myId)), 0)
  const onlineCount = React.useMemo(() => {
    const ids = new Set<string>()
    conversations.forEach((conv) => {
      const other = getOtherParticipant(conv, myId)
      const otherId = getParticipantId(other)
      if (otherId && onlineUsers.has(otherId)) ids.add(otherId)
    })
    return ids.size
  }, [conversations, myId, onlineUsers])

  return (
    <div className="min-h-screen bg-[#f8f8fb]">
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="mb-6">
          <div className="relative flex flex-col items-center justify-between overflow-hidden rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 p-4 text-white md:flex-row">
            <div className="absolute right-0 top-0 h-20 w-20 -translate-y-12 translate-x-12 rounded-full bg-white/10"></div>
            <div className="absolute bottom-0 left-0 h-16 w-16 -translate-x-8 translate-y-8 rounded-full bg-white/10"></div>

            <div className="flex flex-col space-y-1 md:flex-row md:items-center md:space-x-3 md:space-y-0">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Messages</h1>
              </div>
            </div>

            <p className="mt-2 text-sm text-amber-100 md:ml-4 md:mt-0">
              Stay connected with your community.
            </p>

            <div className="mt-4 flex space-x-6 md:mt-0">
              <div className="text-center">
                <div className="text-xl font-bold">{conversations.length}</div>
                <div className="text-xs text-amber-100">Conversations</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{totalUnread}</div>
                <div className="text-xs text-amber-100">Unread</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{onlineCount}</div>
                <div className="text-xs text-amber-100">Online Now</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[340px_1fr]">
          {/* Conversation List */}
          <div
            className={cn(
              "flex h-[calc(100vh-180px)] flex-col rounded-2xl border border-[#e8e9f1] bg-white shadow-sm",
              selectedConversation ? "hidden md:flex" : "flex",
            )}
          >
            <div className="border-b border-[#f1f2f8] px-4 py-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-[#6b7280]" />
                <Input
                  placeholder="Search conversations"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 border-[#e8e9f1] bg-[#f8f8fb] text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoadingInbox ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-[#8e78fb]" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f2f8]">
                    <MessageSquare className="h-6 w-6 text-[#6b7280]" />
                  </div>
                  <p className="text-sm font-medium text-[#1f2430]">No conversations yet</p>
                  <p className="text-xs text-[#6b7280]">Start a DM from the Members page.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#f1f2f8]">
                  {filteredConversations.map((conv) => {
                    const other = getOtherParticipant(conv, myId)
                    const name = getParticipantName(other)
                    const avatar = getParticipantAvatar(other)
                    const unread = Math.max(0, getMyUnreadCount(conv, myId))
                    const isActive = selectedConversation?.id === conv.id
                    const lastMessage = conv.lastMessageText || (conv.type === "SESSION_TEMP_DM" ? "Session chat" : "Conversation")
                    const timestamp = formatConversationTime(conv.lastMessageAt || conv.updatedAt)
                    const otherId = getParticipantId(other)
                    const isOnline = otherId && onlineUsers.has(otherId)

                    return (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => handleSelectConversation(conv)}
                        className={cn(
                          "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                          isActive ? "bg-[#f1f2f8]" : "hover:bg-[#f8f8fb]",
                        )}
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={avatar} />
                            <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          {isOnline ? (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-teal-400" />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-[#1f2430]">{name}</p>
                            <span className="text-[11px] text-[#6b7280]">{timestamp}</span>
                          </div>
                          <p className="truncate text-xs text-[#6b7280]">{lastMessage}</p>
                        </div>
                        {unread > 0 ? (
                          <span className="ml-2 rounded-full bg-[#8e78fb] px-2 py-0.5 text-[10px] font-semibold text-white">
                            {unread > 99 ? "99+" : unread}
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Chat Thread */}
          <div
            className={cn(
              "flex h-[calc(100vh-180px)] flex-col rounded-2xl border border-[#e8e9f1] bg-white shadow-sm",
              selectedConversation ? "flex" : "hidden md:flex",
            )}
          >
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#f1f2f8] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={handleBackToList}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={getParticipantAvatar(selectedOtherParticipant)} />
                      <AvatarFallback>{getParticipantName(selectedOtherParticipant).slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#1f2430]">
                          {getParticipantName(selectedOtherParticipant)}
                        </p>
                        {selectedIsOnline ? (
                          <span className="text-[10px] font-medium text-teal-500">Online</span>
                        ) : null}
                      </div>
                      <p className="text-xs text-[#6b7280]">
                        {selectedConversation.type === "SESSION_TEMP_DM" ? "Session chat" : "Direct message"}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedConversationClosedMessage ? (
                  <div className="border-b border-[#f1f2f8] bg-amber-50 px-4 py-2 text-xs text-amber-700">
                    {selectedConversationClosedMessage}
                  </div>
                ) : null}

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
                  {isLoadingMessages ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-[#8e78fb]" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f2f8]">
                        <MessageSquare className="h-6 w-6 text-[#6b7280]" />
                      </div>
                      <p className="text-sm font-medium text-[#1f2430]">Start the conversation</p>
                      <p className="text-xs text-[#6b7280]">Say hello or share a file.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {messages.map((msg, index) => {
                        const { isMine } = getMsgSenderId(msg, myId)
                        const showDate =
                          index === 0 ||
                          !isSameDay(new Date(msg.createdAt), new Date(messages[index - 1].createdAt))
                        const attachments = msg.attachments || []
                        return (
                          <div key={msg.id} className="flex flex-col gap-1">
                            {showDate ? (
                              <div className="my-2 flex items-center justify-center">
                                <span className="rounded-full bg-[#f1f2f8] px-3 py-1 text-[11px] text-[#6b7280]">
                                  {formatDateSeparator(msg.createdAt)}
                                </span>
                              </div>
                            ) : null}
                            <div className={cn("flex", isMine ? "justify-start" : "justify-end")}>
                              <div
                                className={cn(
                                  "max-w-[75%] rounded-2xl px-4 py-3 text-sm",
                                  isMine ? "bg-[#f1f2f8] text-[#1f2430]" : "bg-[#1f2430] text-white",
                                )}
                              >
                                {(msg as any).replyPreview ? (
                                  <div
                                    className={cn(
                                      "mb-2 rounded-lg px-3 py-2 text-[11px] leading-snug",
                                      isMine ? "bg-white/80 text-[#4b5563]" : "bg-white/10 text-white/80",
                                    )}
                                  >
                                    <span className="font-semibold">{(msg as any).replyPreview.name}</span>
                                    <span className="ml-2 line-clamp-2">{(msg as any).replyPreview.text}</span>
                                  </div>
                                ) : null}
                                {attachments.length > 0 ? (
                                  <div className="mb-2 space-y-2">
                                    {attachments.map((att, idx) => (
                                      <div key={`${att.url}-${idx}`}>
                                        {isImageAttachment(att) ? (
                                          <button
                                            type="button"
                                            className="block"
                                            onClick={() => setPreviewImageUrl(att.url)}
                                          >
                                            <img
                                              src={att.url}
                                              alt="Attachment"
                                              className="max-h-48 rounded-lg object-cover"
                                            />
                                          </button>
                                        ) : (
                                          <div
                                            className={cn(
                                              "flex items-center gap-2 rounded-lg px-3 py-2 text-xs",
                                              isMine ? "bg-[#e5e7f4] text-[#1f2430]" : "bg-white/10 text-white",
                                            )}
                                          >
                                            {att.type === "video" ? (
                                              <Video className="h-4 w-4" />
                                            ) : (
                                              <FileIcon className="h-4 w-4" />
                                            )}
                                            <a className="underline" href={att.url} target="_blank" rel="noreferrer">
                                              View attachment
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                                {msg.text ? <p className="whitespace-pre-wrap">{msg.text}</p> : null}
                                <div
                                  className={cn(
                                    "mt-2 flex items-center gap-2 text-[10px]",
                                    isMine ? "justify-start text-[#6b7280]" : "justify-end text-white/70",
                                  )}
                                >
                                  <span>{formatMessageTime(msg.createdAt)}</span>
                                  {isMine ? (
                                    msg.readAt ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />
                                  ) : null}
                                  <button
                                    type="button"
                                    className="inline-flex items-center opacity-70 transition hover:opacity-100"
                                    onClick={() =>
                                      setReplyTarget({
                                        id: msg.id,
                                        name: isMine ? "You" : getParticipantName(selectedOtherParticipant),
                                        text: msg.text || "Attachment",
                                      })
                                    }
                                    aria-label="Reply"
                                  >
                                    <Reply className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    className="inline-flex items-center opacity-70 transition hover:opacity-100"
                                    onClick={() => handleCopyMessage(msg.text)}
                                    aria-label="Copy message"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Composer */}
                <form
                  onSubmit={handleSendMessage}
                  className="border-t border-[#f1f2f8] bg-white px-4 py-3"
                >
                  {replyTarget ? (
                    <div className="mb-2 flex items-center justify-between rounded-lg bg-[#f1f2f8] px-3 py-2 text-xs text-[#4b5563]">
                      <div className="truncate">
                        Replying to <span className="font-semibold">{replyTarget.name}</span>:{" "}
                        <span className="text-[#6b7280]">{replyTarget.text}</span>
                      </div>
                      <button
                        type="button"
                        className="ml-3 inline-flex items-center text-[#6b7280] hover:text-[#1f2430]"
                        onClick={() => setReplyTarget(null)}
                        aria-label="Cancel reply"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                  {error ? (
                    <div className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || !selectedConversation?.isOpen}
                    >
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                    </Button>
                    <Input
                      ref={inputRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={selectedConversation?.isOpen ? "Type a message..." : "Chat closed"}
                      className="h-10 flex-1 border-[#e8e9f1] bg-[#f8f8fb]"
                      disabled={!selectedConversation?.isOpen}
                    />
                    <Button type="submit" disabled={!selectedConversation?.isOpen || !newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f2f8]">
                  <MessageSquare className="h-6 w-6 text-[#6b7280]" />
                </div>
                <p className="text-sm font-medium text-[#1f2430]">Select a conversation</p>
                <p className="text-xs text-[#6b7280]">Choose a chat from the left to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {previewImageUrl ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-6">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setPreviewImageUrl(null)}
            aria-label="Close image preview"
          />
          <img src={previewImageUrl} alt="Preview" className="relative max-h-full max-w-full rounded-xl" />
        </div>
      ) : null}
    </div>
  )
}
