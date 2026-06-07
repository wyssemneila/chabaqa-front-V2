"use client"

import React from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Check,
  Copy,
  Eye,
  EyeOff,
  FileIcon,
  ImageIcon,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Pin,
  PinOff,
  Reply,
  Search,
  Send,
  SmilePlus,
  Trash2,
  Video,
  X,
} from "lucide-react"
import { format, formatDistanceToNow, isSameDay, isToday, isYesterday } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuthContext } from "@/app/providers/auth-provider"
import { api } from "@/lib/api"
import type { Conversation, Message, MessageAttachment, MessageReaction } from "@/lib/api/types"
import { useSocket } from "@/lib/socket-context"
import { cn } from "@/lib/utils"
import { getErrorMessage } from "@/lib/utils/error-messages"

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🔥", "👏", "🎉"]

type ReplyTarget = {
  id: string
  name: string
  text: string
  message?: Message
}

type EditingTarget = {
  id: string
  originalText: string
}

const normalizeParam = (value: string | string[] | undefined): string => {
  if (!value) return ""
  return Array.isArray(value) ? value[0] : value
}

const normalizeId = (value: any): string => {
  if (!value) return ""
  if (typeof value === "string") return value
  return value.id || value._id || value.toString?.() || ""
}

const getParticipantId = (p: any): string => normalizeId(p)

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

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U"

const formatMessageTime = (date: string) => {
  const d = new Date(date)
  if (isToday(d)) return format(d, "h:mm a")
  if (isYesterday(d)) return `Yesterday ${format(d, "h:mm a")}`
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

const formatBytes = (size?: number) => {
  if (!size) return "File"
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

const getMsgSenderId = (msg: Message): string => normalizeId(msg.senderId || msg.sender)

const isMine = (msg: Message, myId: string) => getMsgSenderId(msg) === myId || normalizeId(msg.sender) === myId

const getSessionChatClosedMessage = (conversation?: Conversation | null): string => {
  if (!conversation || conversation.type !== "SESSION_TEMP_DM" || conversation.isOpen) return ""
  if (conversation.closeReason === "session_finished") return "This session chat is closed because the session has finished."
  if (conversation.closeReason === "booking_cancelled") return "This session chat is closed because the booking was cancelled."
  if (conversation.closeReason === "booking_completed") return "This session chat is closed because the session was completed."
  return "This session chat is closed."
}

const isImageAttachment = (att: MessageAttachment) => {
  if (att.type === "image") return true
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(att.url || "")
}

const describeMessage = (msg?: Message | null) => {
  if (!msg) return "Message"
  if (msg.deletedAt) return "Deleted message"
  if (msg.text?.trim()) return msg.text.trim()
  const firstAttachment = msg.attachments?.[0]
  if (firstAttachment?.name) return firstAttachment.name
  if (firstAttachment?.type === "image") return "Image attachment"
  if (firstAttachment?.type === "video") return "Video attachment"
  if (firstAttachment) return "File attachment"
  return "Message"
}

const getReplyMessage = (msg: Message): Message | null => {
  const reply = msg.replyToMessageId
  if (!reply || typeof reply === "string") return null
  return reply
}

const getReactionCount = (reaction: MessageReaction) => reaction.count || reaction.userIds?.length || 0

const hasMyReaction = (reaction: MessageReaction, myId: string) =>
  Boolean(reaction.usersIncludeMe || reaction.userIds?.includes(myId))

const coerceSocketMessage = (rawMessage: any): Message => {
  const raw = rawMessage?._doc || rawMessage || {}
  return {
    ...raw,
    id: raw.id || raw._id || "",
    conversationId: normalizeId(raw.conversationId),
    senderId: normalizeId(raw.senderId),
    recipientId: normalizeId(raw.recipientId),
    attachments: raw.attachments || [],
    reactions: (raw.reactions || []).map((reaction: any) => ({
      ...reaction,
      userIds: (reaction.userIds || []).map(normalizeId).filter(Boolean),
      count: reaction.count || reaction.userIds?.length || 0,
    })),
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
  } as Message
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
  const [pinnedMessages, setPinnedMessages] = React.useState<Message[]>([])
  const [searchResults, setSearchResults] = React.useState<Message[]>([])
  const [isLoadingInbox, setIsLoadingInbox] = React.useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [isSearching, setIsSearching] = React.useState(false)
  const [newMessage, setNewMessage] = React.useState("")
  const [conversationSearch, setConversationSearch] = React.useState("")
  const [threadSearch, setThreadSearch] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = React.useState<string | null>(null)
  const [replyTarget, setReplyTarget] = React.useState<ReplyTarget | null>(null)
  const [editingTarget, setEditingTarget] = React.useState<EditingTarget | null>(null)
  const [typingUsers, setTypingUsers] = React.useState<Record<string, number>>({})

  const myId = currentUser?.id || (currentUser as any)?._id || ""
  const messagesBasePath = creator && feature ? `/${creator}/${feature}/messages` : "/messages"
  const selectedOtherParticipant = selectedConversation ? getOtherParticipant(selectedConversation, myId) : null
  const selectedOtherId = getParticipantId(selectedOtherParticipant)
  const selectedName = getParticipantName(selectedOtherParticipant)
  const selectedAvatar = getParticipantAvatar(selectedOtherParticipant)
  const selectedIsOnline = Boolean(selectedOtherId && onlineUsers.has(selectedOtherId))
  const selectedConversationClosedMessage = getSessionChatClosedMessage(selectedConversation)

  const scrollRef = React.useRef<HTMLDivElement>(null)
  const loadedConvIdRef = React.useRef<string | null>(null)
  const loadingConvRef = React.useRef<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const typingTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingSentRef = React.useRef(false)
  const messageRefs = React.useRef<Record<string, HTMLDivElement | null>>({})

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
      const res = await api.dm.listInbox({ limit: 50 })
      setConversations(res.conversations || [])
    } catch (err) {
      console.error("Error fetching conversations:", err)
    } finally {
      setIsLoadingInbox(false)
    }
  }, [])

  const loadPinnedMessages = React.useCallback(async (convId: string) => {
    try {
      const res = await api.dm.listPinnedMessages(convId)
      setPinnedMessages(res.messages || [])
    } catch {
      setPinnedMessages([])
    }
  }, [])

  const loadMessages = React.useCallback(async (convId: string) => {
    if (!convId || loadingConvRef.current === convId) return
    loadingConvRef.current = convId

    try {
      setIsLoadingMessages(true)
      setError(null)
      const res = await api.dm.listMessages(convId, { limit: 80 })
      setMessages(res.messages || [])
      loadedConvIdRef.current = convId
      if (res.conversation?.id) {
        setSelectedConversation(res.conversation)
      }
      await Promise.all([
        api.dm.markRead(convId).catch(() => undefined),
        loadPinnedMessages(convId).catch(() => undefined),
      ])
      scrollToBottom()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoadingMessages(false)
      loadingConvRef.current = null
    }
  }, [loadPinnedMessages, scrollToBottom])

  const openConversationById = React.useCallback(async (conversationId: string) => {
    if (!conversationId) return
    setError(null)
    setSelectedConversation((prev) => {
      if (prev?.id === conversationId) return prev
      const existing = conversations.find((c) => c.id === conversationId)
      return existing || ({ id: conversationId, type: "PEER_DM", unreadCountA: 0, unreadCountB: 0, isOpen: true } as Conversation)
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
      setTimeout(() => textareaRef.current?.focus({ preventScroll: true }), 100)
    }
  }, [selectedConversation, isLoadingMessages])

  React.useEffect(() => {
    if (!socket) return

    const handleNewMessage = (payload: any) => {
      const message = coerceSocketMessage(payload?.message || payload)
      const convId = message.conversationId || payload?.conversationId
      if (!convId) {
        fetchConversations().catch(() => undefined)
        return
      }

      if (selectedConversation?.id === convId && message.id) {
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.clientRequestId !== message.clientRequestId)
          if (withoutTemp.some((m) => m.id === message.id)) return withoutTemp
          return [...withoutTemp, message]
        })
        scrollToBottom()
        api.dm.markRead(convId).catch(() => undefined)
      }
      fetchConversations().catch(() => undefined)
    }

    const handleRead = (payload: any) => {
      const convId = payload?.conversationId
      if (!convId) return
      if (selectedConversation?.id === convId) {
        const readAt = payload?.readAt || new Date().toISOString()
        setMessages((prev) =>
          prev.map((m) => (isMine(m, myId) ? { ...m, readAt } : m)),
        )
      } else {
        fetchConversations().catch(() => undefined)
      }
    }

    const handleUpdated = (payload: any) => {
      const convId = payload?.conversationId
      const message = coerceSocketMessage(payload?.message)
      if (!message.id || selectedConversation?.id !== convId) return
      setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, ...message } : m)))
      setPinnedMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, ...message } : m)))
    }

    const handleDeleted = (payload: any) => {
      const convId = payload?.conversationId
      if (selectedConversation?.id !== convId) return
      const messageId = payload?.messageId
      const scope = payload?.scope
      const userId = payload?.userId
      if (!messageId) return

      if (scope === "me" && userId === myId) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId))
      } else if (scope === "everyone") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, text: "", attachments: [], reactions: [], deletedAt: new Date().toISOString(), deletedBy: userId }
              : m,
          ),
        )
      }
      setPinnedMessages((prev) => prev.filter((m) => m.id !== messageId))
      fetchConversations().catch(() => undefined)
    }

    const handleReaction = (payload: any) => {
      const convId = payload?.conversationId
      if (selectedConversation?.id !== convId) return
      const messageId = payload?.messageId
      const reactions = (payload?.reactions || []).map((reaction: any) => ({
        ...reaction,
        userIds: (reaction.userIds || []).map(normalizeId).filter(Boolean),
        count: reaction.count || reaction.userIds?.length || 0,
      }))
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)))
      setPinnedMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)))
    }

    const handlePinned = (payload: any) => {
      const convId = payload?.conversationId
      const message = coerceSocketMessage(payload?.message)
      if (!message.id || selectedConversation?.id !== convId) return
      setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, ...message } : m)))
      loadPinnedMessages(convId).catch(() => undefined)
    }

    const handleTyping = (payload: any) => {
      const convId = payload?.conversationId
      const userId = payload?.userId
      if (!userId || userId === myId || selectedConversation?.id !== convId) return
      setTypingUsers((prev) => {
        const next = { ...prev }
        if (payload?.isTyping) next[userId] = Date.now()
        else delete next[userId]
        return next
      })
    }

    socket.on("dm:message:new", handleNewMessage)
    socket.on("dm:message:read", handleRead)
    socket.on("dm:message:updated", handleUpdated)
    socket.on("dm:message:deleted", handleDeleted)
    socket.on("dm:message:reaction", handleReaction)
    socket.on("dm:message:pinned", handlePinned)
    socket.on("dm:typing", handleTyping)
    return () => {
      socket.off("dm:message:new", handleNewMessage)
      socket.off("dm:message:read", handleRead)
      socket.off("dm:message:updated", handleUpdated)
      socket.off("dm:message:deleted", handleDeleted)
      socket.off("dm:message:reaction", handleReaction)
      socket.off("dm:message:pinned", handlePinned)
      socket.off("dm:typing", handleTyping)
    }
  }, [fetchConversations, loadPinnedMessages, myId, scrollToBottom, selectedConversation?.id, socket])

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

  React.useEffect(() => {
    scrollToBottom()
  }, [messages.length, scrollToBottom])

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers((prev) => {
        const next = { ...prev }
        const now = Date.now()
        Object.entries(next).forEach(([userId, timestamp]) => {
          if (now - timestamp > 3000) delete next[userId]
        })
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  React.useEffect(() => {
    if (!selectedConversation?.id || threadSearch.trim().length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true)
        const res = await api.dm.searchMessages(selectedConversation.id, { q: threadSearch.trim(), limit: 20 })
        setSearchResults(res.messages || [])
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [selectedConversation?.id, threadSearch])

  const emitTyping = React.useCallback((isTyping: boolean) => {
    if (!selectedConversation?.id || !selectedConversation.isOpen) return
    api.dm.typing(selectedConversation.id, isTyping).catch(() => undefined)
  }, [selectedConversation?.id, selectedConversation?.isOpen])

  const handleMessageInput = (value: string) => {
    setNewMessage(value)
    if (!selectedConversation?.id || editingTarget) return
    if (!typingSentRef.current) {
      typingSentRef.current = true
      emitTyping(true)
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      typingSentRef.current = false
      emitTyping(false)
    }, 1200)
  }

  const filteredConversations = React.useMemo(() => {
    const query = conversationSearch.trim().toLowerCase()
    return conversations.filter((c) => {
      const other = getOtherParticipant(c, myId)
      const name = getParticipantName(other)
      if (!query) return true
      return name.toLowerCase().includes(query) || (c.lastMessageText || "").toLowerCase().includes(query)
    })
  }, [conversationSearch, conversations, myId])

  const totalUnread = React.useMemo(
    () => conversations.reduce((sum, conv) => sum + Math.max(0, getMyUnreadCount(conv, myId)), 0),
    [conversations, myId],
  )

  const onlineCount = React.useMemo(() => {
    const ids = new Set<string>()
    conversations.forEach((conv) => {
      const other = getOtherParticipant(conv, myId)
      const otherId = getParticipantId(other)
      if (otherId && onlineUsers.has(otherId)) ids.add(otherId)
    })
    return ids.size
  }, [conversations, myId, onlineUsers])

  const threadAttachments = React.useMemo(
    () => messages.flatMap((message) => (message.deletedAt ? [] : (message.attachments || []))),
    [messages],
  )

  const activeTypingNames = React.useMemo(() => {
    return Object.keys(typingUsers)
      .map((userId) => {
        if (userId === selectedOtherId) return selectedName
        return "Someone"
      })
      .filter(Boolean)
  }, [selectedName, selectedOtherId, typingUsers])

  const handleSelectConversation = (conv: Conversation) => {
    setError(null)
    setReplyTarget(null)
    setEditingTarget(null)
    setThreadSearch("")
    setSearchResults([])
    setSelectedConversation(conv)
    if (conv.id) {
      router.replace(`${messagesBasePath}?conversationId=${conv.id}`, { scroll: false })
    }
  }

  const handleBackToList = () => {
    setSelectedConversation(null)
    setMessages([])
    setPinnedMessages([])
    setSearchResults([])
    loadedConvIdRef.current = null
    setError(null)
    router.replace(messagesBasePath, { scroll: false })
  }

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (!selectedConversation?.id) return
    if (selectedConversation.type === "SESSION_TEMP_DM" && !selectedConversation.isOpen) {
      setError(getSessionChatClosedMessage(selectedConversation))
      return
    }

    const text = newMessage.trim()
    if (!text) return

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingSentRef.current = false
    emitTyping(false)

    if (editingTarget) {
      try {
        setError(null)
        const res = await api.dm.editMessage(selectedConversation.id, editingTarget.id, text)
        setMessages((prev) => prev.map((m) => (m.id === editingTarget.id ? res.message : m)))
        setPinnedMessages((prev) => prev.map((m) => (m.id === editingTarget.id ? res.message : m)))
        setEditingTarget(null)
        setNewMessage("")
      } catch (err) {
        setError(getErrorMessage(err) || "Failed to edit message")
      }
      return
    }

    const clientRequestId = `client-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const tempId = `temp-${clientRequestId}`
    const recipientId =
      getParticipantId(selectedConversation.participantA) === myId
        ? getParticipantId(selectedConversation.participantB)
        : getParticipantId(selectedConversation.participantA)
    const optimisticMsg: Message = {
      id: tempId,
      conversationId: selectedConversation.id,
      senderId: myId,
      recipientId,
      text,
      clientRequestId,
      replyToMessageId: replyTarget?.message || replyTarget?.id,
      attachments: [],
      reactions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setNewMessage("")
    setReplyTarget(null)
    setError(null)
    setMessages((prev) => [...prev, optimisticMsg])
    scrollToBottom()

    try {
      const res = await api.dm.sendMessage(selectedConversation.id, {
        text,
        replyToMessageId: replyTarget?.id,
        clientRequestId,
      })
      const serverMsg = res?.message
      if (serverMsg?.id) {
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== tempId && m.clientRequestId !== clientRequestId)
          if (withoutTemp.some((m) => m.id === serverMsg.id)) return withoutTemp
          return [...withoutTemp, serverMsg]
        })
      }
      fetchConversations().catch(() => undefined)
      scrollToBottom()
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setNewMessage(text)
      const rawMessage = getErrorMessage(err) || ""
      setError(/session chat is closed/i.test(rawMessage) ? "This session chat is closed." : rawMessage || "Failed to send message")
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
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
        setMessages((prev) => {
          if (prev.some((m) => m.id === serverMsg.id)) return prev
          return [...prev, serverMsg]
        })
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

  const handleCopyMessage = async (text?: string) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error("Failed to copy message:", err)
    }
  }

  const handleReact = async (msg: Message, emoji: string) => {
    if (!selectedConversation?.id || msg.deletedAt || msg.id.startsWith("temp-")) return
    const previous = messages
    const myExisting = msg.reactions?.find((reaction) => hasMyReaction(reaction, myId))
    const nextReactions = (msg.reactions || [])
      .map((reaction) => ({
        ...reaction,
        userIds: (reaction.userIds || []).filter((id) => id !== myId),
        count: Math.max(0, getReactionCount(reaction) - (hasMyReaction(reaction, myId) ? 1 : 0)),
        usersIncludeMe: false,
      }))
      .filter((reaction) => reaction.count > 0)

    if (myExisting?.emoji !== emoji) {
      const target = nextReactions.find((reaction) => reaction.emoji === emoji)
      if (target) {
        target.userIds = [...(target.userIds || []), myId]
        target.count = getReactionCount(target) + 1
        target.usersIncludeMe = true
      } else {
        nextReactions.push({ emoji, userIds: [myId], count: 1, usersIncludeMe: true })
      }
    }

    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, reactions: nextReactions } : m)))
    try {
      const res = await api.dm.reactToMessage(selectedConversation.id, msg.id, emoji)
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, reactions: res.reactions || [] } : m)))
      setPinnedMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, reactions: res.reactions || [] } : m)))
    } catch (err) {
      setMessages(previous)
      setError(getErrorMessage(err) || "Failed to update reaction")
    }
  }

  const handlePin = async (msg: Message) => {
    if (!selectedConversation?.id || msg.deletedAt || msg.id.startsWith("temp-")) return
    try {
      const shouldPin = !msg.pinnedAt
      const res = await api.dm.pinMessage(selectedConversation.id, msg.id, shouldPin)
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? res.message : m)))
      await loadPinnedMessages(selectedConversation.id)
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to update pinned message")
    }
  }

  const handleDelete = async (msg: Message, scope: "me" | "everyone") => {
    if (!selectedConversation?.id || msg.id.startsWith("temp-")) return
    try {
      await api.dm.deleteMessage(selectedConversation.id, msg.id, scope)
      if (scope === "me") {
        setMessages((prev) => prev.filter((m) => m.id !== msg.id))
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msg.id
              ? { ...m, text: "", attachments: [], reactions: [], deletedAt: new Date().toISOString(), deletedBy: myId }
              : m,
          ),
        )
      }
      setPinnedMessages((prev) => prev.filter((m) => m.id !== msg.id))
      fetchConversations().catch(() => undefined)
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to delete message")
    }
  }

  const startReply = (msg: Message) => {
    setEditingTarget(null)
    setReplyTarget({
      id: msg.id,
      name: isMine(msg, myId) ? "You" : selectedName,
      text: describeMessage(msg),
      message: msg,
    })
    textareaRef.current?.focus()
  }

  const startEdit = (msg: Message) => {
    if (!msg.text || msg.deletedAt) return
    setReplyTarget(null)
    setEditingTarget({ id: msg.id, originalText: msg.text })
    setNewMessage(msg.text)
    textareaRef.current?.focus()
  }

  const cancelComposerMode = () => {
    setReplyTarget(null)
    if (editingTarget) {
      setNewMessage("")
      setEditingTarget(null)
    }
  }

  const scrollToMessage = (messageId: string) => {
    messageRefs.current[messageId]?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  return (
    <TooltipProvider delayDuration={150}>
      <main className="min-h-screen bg-[#f7f5f1]">
        <div className="w-full px-3 py-4 sm:px-5 lg:px-6">
          <div className="mb-4">
            <div className="relative flex flex-col items-center justify-between overflow-hidden rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 p-4 text-white md:flex-row">
              <div className="absolute right-0 top-0 h-20 w-20 -translate-y-12 translate-x-12 rounded-full bg-white/10" />
              <div className="absolute bottom-0 left-0 h-16 w-16 -translate-x-8 translate-y-8 rounded-full bg-white/10" />

              <div className="relative flex flex-col space-y-1 md:flex-row md:items-center md:space-x-3 md:space-y-0">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-6 w-6" />
                  <h1 className="text-2xl font-bold">Messages</h1>
                </div>
              </div>

              <p className="relative mt-2 text-sm text-amber-100 md:ml-4 md:mt-0">
                Stay connected with your community.
              </p>

              <div className="relative mt-4 flex space-x-6 md:mt-0">
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

          <section className="grid h-[calc(100vh-150px)] min-h-[620px] grid-cols-1 gap-3 md:grid-cols-[330px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)_330px]">
            <aside
              className={cn(
                "flex min-h-0 flex-col overflow-hidden rounded-[8px] border border-[#e5ded3] bg-white shadow-sm",
                selectedConversation ? "hidden md:flex" : "flex",
              )}
              aria-label="Conversation list"
            >
              <div className="border-b border-[#eee7dc] p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#2d261e]">Inbox</p>
                    <p className="text-xs text-[#81766a]">{filteredConversations.length} visible threads</p>
                  </div>
                  <span className={cn(
                    "rounded-full px-2 py-1 text-[11px] font-semibold",
                    isConnected ? "bg-teal-50 text-teal-700" : "bg-stone-100 text-stone-600",
                  )}>
                    {isConnected ? "Live" : "Polling"}
                  </span>
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d8175]" />
                  <Input
                    value={conversationSearch}
                    onChange={(event) => setConversationSearch(event.target.value)}
                    placeholder="Search people or messages"
                    className="h-10 rounded-[8px] border-[#e5ded3] bg-[#fbfaf7] pl-9 text-sm"
                  />
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {isLoadingInbox ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <EmptyState
                    icon={<MessageSquare className="h-5 w-5" />}
                    title="No conversations yet"
                    description="Start a direct message from the Members page."
                  />
                ) : (
                  <div className="divide-y divide-[#f0eae0]">
                    {filteredConversations.map((conv) => {
                      const other = getOtherParticipant(conv, myId)
                      const name = getParticipantName(other)
                      const avatar = getParticipantAvatar(other)
                      const unread = Math.max(0, getMyUnreadCount(conv, myId))
                      const active = selectedConversation?.id === conv.id
                      const lastMessage = conv.lastMessageText || (conv.type === "SESSION_TEMP_DM" ? "Session chat" : "Conversation")
                      const timestamp = formatConversationTime(conv.lastMessageAt || conv.updatedAt)
                      const otherId = getParticipantId(other)
                      const online = Boolean(otherId && onlineUsers.has(otherId))

                      return (
                        <button
                          key={conv.id}
                          type="button"
                          onClick={() => handleSelectConversation(conv)}
                          className={cn(
                            "group flex w-full items-start gap-3 px-3 py-3 text-left transition",
                            active ? "bg-[#fff4e1]" : "hover:bg-[#fbfaf7]",
                          )}
                        >
                          <div className="relative shrink-0">
                            <Avatar className="h-11 w-11 border border-white shadow-sm">
                              <AvatarImage src={avatar} />
                              <AvatarFallback className="bg-[#2d261e] text-xs text-white">{getInitials(name)}</AvatarFallback>
                            </Avatar>
                            <span className={cn(
                              "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white",
                              online ? "bg-teal-500" : "bg-[#c7bdb0]",
                            )} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-semibold text-[#2d261e]">{name}</p>
                              <span className="shrink-0 text-[11px] text-[#81766a]">{timestamp}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <p className="min-w-0 flex-1 truncate text-xs text-[#81766a]">{lastMessage}</p>
                              {unread > 0 ? (
                                <span className="rounded-full bg-[#2d261e] px-2 py-0.5 text-[10px] font-semibold text-white">
                                  {unread > 99 ? "99+" : unread}
                                </span>
                              ) : null}
                            </div>
                            {conv.type === "SESSION_TEMP_DM" ? (
                              <span className="mt-2 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                Session chat
                              </span>
                            ) : null}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </aside>

            <section
              className={cn(
                "min-h-0 overflow-hidden rounded-[8px] border border-[#e5ded3] bg-white shadow-sm",
                selectedConversation ? "flex flex-col" : "hidden md:flex md:flex-col",
              )}
              aria-label="Message thread"
            >
              {selectedConversation ? (
                <>
                  <div className="flex items-center justify-between border-b border-[#eee7dc] bg-white px-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden" onClick={handleBackToList}>
                            <ArrowLeft className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Back</TooltipContent>
                      </Tooltip>
                      <div className="relative shrink-0">
                        <Avatar className="h-11 w-11 border border-[#eee7dc]">
                          <AvatarImage src={selectedAvatar} />
                          <AvatarFallback className="bg-[#2d261e] text-xs text-white">{getInitials(selectedName)}</AvatarFallback>
                        </Avatar>
                        <span className={cn(
                          "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white",
                          selectedIsOnline ? "bg-teal-500" : "bg-[#c7bdb0]",
                        )} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="truncate text-sm font-semibold text-[#2d261e]">{selectedName}</h2>
                          {selectedIsOnline ? <span className="text-[11px] font-semibold text-teal-600">Online</span> : null}
                        </div>
                        <p className="truncate text-xs text-[#81766a]">
                          {selectedConversation.type === "SESSION_TEMP_DM" ? "Session chat" : "Direct message"}
                          {activeTypingNames.length > 0 ? ` · ${activeTypingNames[0]} is typing` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="hidden items-center gap-2 sm:flex">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => textareaRef.current?.focus()}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Focus composer</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {selectedConversationClosedMessage ? (
                    <div className="border-b border-[#eee7dc] bg-amber-50 px-4 py-2 text-xs text-amber-800">
                      {selectedConversationClosedMessage}
                    </div>
                  ) : null}

                  <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-[#fbfaf7] px-3 py-4 sm:px-5">
                    {isLoadingMessages ? (
                      <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                      </div>
                    ) : messages.length === 0 ? (
                      <EmptyState
                        icon={<MessageSquare className="h-5 w-5" />}
                        title="Start the conversation"
                        description="Send a message, share an image, or drop a useful file."
                      />
                    ) : (
                      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
                        {messages.map((msg, index) => {
                          const mine = isMine(msg, myId)
                          const showDate =
                            index === 0 ||
                            !isSameDay(new Date(msg.createdAt), new Date(messages[index - 1].createdAt))
                          return (
                            <MessageRow
                              key={msg.id}
                              refCallback={(node) => {
                                messageRefs.current[msg.id] = node
                              }}
                              message={msg}
                              mine={mine}
                              myId={myId}
                              selectedName={selectedName}
                              showDate={showDate}
                              onPreviewImage={setPreviewImageUrl}
                              onReply={startReply}
                              onCopy={handleCopyMessage}
                              onEdit={startEdit}
                              onDelete={handleDelete}
                              onReact={handleReact}
                              onPin={handlePin}
                            />
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSendMessage} className="border-t border-[#eee7dc] bg-white p-3">
                    <div className="mx-auto w-full max-w-5xl">
                      {replyTarget || editingTarget ? (
                        <div className="mb-2 flex items-center justify-between rounded-[8px] border border-[#eadfce] bg-[#fbfaf7] px-3 py-2 text-xs text-[#5d5145]">
                          <div className="min-w-0">
                            <span className="font-semibold">{editingTarget ? "Editing message" : `Replying to ${replyTarget?.name}`}</span>
                            <span className="ml-2 text-[#81766a] line-clamp-1">
                              {editingTarget?.originalText || replyTarget?.text}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="ml-3 inline-flex h-7 w-7 items-center justify-center rounded-[8px] text-[#81766a] hover:bg-[#efe8dc] hover:text-[#2d261e]"
                            onClick={cancelComposerMode}
                            aria-label="Cancel composer mode"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : null}
                      {error ? (
                        <div className="mb-2 rounded-[8px] border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
                          {error}
                        </div>
                      ) : null}
                      <div className="flex items-end gap-2">
                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 shrink-0 rounded-[8px]"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploading || !selectedConversation?.isOpen || Boolean(editingTarget)}
                            >
                              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Attach file</TooltipContent>
                        </Tooltip>
                        <Textarea
                          ref={textareaRef}
                          value={newMessage}
                          onChange={(event) => handleMessageInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault()
                              event.currentTarget.form?.requestSubmit()
                            }
                          }}
                          placeholder={selectedConversation?.isOpen ? "Write a thoughtful reply..." : "Chat closed"}
                          className="max-h-36 min-h-[44px] flex-1 resize-none rounded-[8px] border-[#e5ded3] bg-[#fbfaf7] text-sm"
                          disabled={!selectedConversation?.isOpen}
                        />
                        <Button
                          type="submit"
                          className="h-10 shrink-0 rounded-[8px] bg-[#2d261e] px-4 text-white hover:bg-[#46392d]"
                          disabled={!selectedConversation?.isOpen || !newMessage.trim()}
                        >
                          {editingTarget ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                          <span className="sr-only">{editingTarget ? "Save message" : "Send message"}</span>
                        </Button>
                      </div>
                    </div>
                  </form>
                </>
              ) : (
                <EmptyState
                  icon={<MessageSquare className="h-5 w-5" />}
                  title="Select a conversation"
                  description="Choose a chat from the left to open the workspace."
                />
              )}
            </section>

            <aside className="hidden min-h-0 flex-col overflow-hidden rounded-[8px] border border-[#e5ded3] bg-white shadow-sm xl:flex" aria-label="Conversation tools">
              {selectedConversation ? (
                <>
                  <div className="border-b border-[#eee7dc] p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border border-[#eee7dc]">
                        <AvatarImage src={selectedAvatar} />
                        <AvatarFallback className="bg-[#2d261e] text-xs text-white">{getInitials(selectedName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#2d261e]">{selectedName}</p>
                        <p className="text-xs text-[#81766a]">{selectedIsOnline ? "Online now" : "Not currently online"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    <div className="mb-5">
                      <label className="mb-2 block text-xs font-semibold uppercase text-[#81766a]">Search thread</label>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d8175]" />
                        <Input
                          value={threadSearch}
                          onChange={(event) => setThreadSearch(event.target.value)}
                          placeholder="Find a detail"
                          className="h-10 rounded-[8px] border-[#e5ded3] bg-[#fbfaf7] pl-9 text-sm"
                        />
                      </div>
                      <div className="mt-2 space-y-2">
                        {isSearching ? (
                          <div className="flex items-center gap-2 text-xs text-[#81766a]">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Searching
                          </div>
                        ) : searchResults.length > 0 ? (
                          searchResults.map((msg) => (
                            <button
                              key={msg.id}
                              type="button"
                              onClick={() => scrollToMessage(msg.id)}
                              className="block w-full rounded-[8px] border border-[#eee7dc] bg-[#fbfaf7] px-3 py-2 text-left text-xs transition hover:border-orange-200 hover:bg-orange-50"
                            >
                              <span className="line-clamp-2 text-[#2d261e]">{describeMessage(msg)}</span>
                              <span className="mt-1 block text-[11px] text-[#81766a]">{formatMessageTime(msg.createdAt)}</span>
                            </button>
                          ))
                        ) : threadSearch.trim().length >= 2 ? (
                          <p className="text-xs text-[#81766a]">No matching messages.</p>
                        ) : null}
                      </div>
                    </div>

                    <PanelSection title="Pinned">
                      {pinnedMessages.length === 0 ? (
                        <p className="text-xs text-[#81766a]">Pin important notes, files, and decisions.</p>
                      ) : (
                        <div className="space-y-2">
                          {pinnedMessages.map((msg) => (
                            <button
                              key={msg.id}
                              type="button"
                              onClick={() => scrollToMessage(msg.id)}
                              className="block w-full rounded-[8px] border border-[#eee7dc] px-3 py-2 text-left text-xs transition hover:border-orange-200 hover:bg-orange-50"
                            >
                              <span className="line-clamp-2 text-[#2d261e]">{describeMessage(msg)}</span>
                              <span className="mt-1 block text-[11px] text-[#81766a]">{formatMessageTime(msg.createdAt)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </PanelSection>

                    <PanelSection title="Shared files">
                      {threadAttachments.length === 0 ? (
                        <p className="text-xs text-[#81766a]">Images and files from this thread will appear here.</p>
                      ) : (
                        <div className="space-y-2">
                          {threadAttachments.slice(0, 12).map((att, index) => (
                            <a
                              key={`${att.url}-${index}`}
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 rounded-[8px] border border-[#eee7dc] px-3 py-2 text-xs transition hover:border-orange-200 hover:bg-orange-50"
                            >
                              {isImageAttachment(att) ? <ImageIcon className="h-4 w-4 text-orange-500" /> : att.type === "video" ? <Video className="h-4 w-4 text-orange-500" /> : <FileIcon className="h-4 w-4 text-orange-500" />}
                              <span className="min-w-0 flex-1 truncate text-[#2d261e]">{att.name || "Attachment"}</span>
                              <span className="text-[11px] text-[#81766a]">{formatBytes(att.size)}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </PanelSection>
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={<Search className="h-5 w-5" />}
                  title="Thread tools"
                  description="Open a conversation to search, pin, and inspect shared files."
                />
              )}
            </aside>
          </section>
        </div>

        {previewImageUrl ? (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4">
            <button
              type="button"
              className="absolute inset-0"
              onClick={() => setPreviewImageUrl(null)}
              aria-label="Close image preview"
            />
            <button
              type="button"
              className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#2d261e]"
              onClick={() => setPreviewImageUrl(null)}
              aria-label="Close image preview"
            >
              <X className="h-5 w-5" />
            </button>
            <img src={previewImageUrl} alt="Preview" className="relative max-h-full max-w-full rounded-[8px] object-contain shadow-2xl" />
          </div>
        ) : null}
      </main>
    </TooltipProvider>
  )
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex h-full min-h-[220px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[8px] bg-[#f0eae0] text-[#81766a]">
        {icon}
      </div>
      <p className="text-sm font-semibold text-[#2d261e]">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-[#81766a]">{description}</p>
    </div>
  )
}

function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 text-xs font-semibold uppercase text-[#81766a]">{title}</h3>
      {children}
    </section>
  )
}

function MessageRow({
  message,
  mine,
  myId,
  selectedName,
  showDate,
  refCallback,
  onPreviewImage,
  onReply,
  onCopy,
  onEdit,
  onDelete,
  onReact,
  onPin,
}: {
  message: Message
  mine: boolean
  myId: string
  selectedName: string
  showDate: boolean
  refCallback: (node: HTMLDivElement | null) => void
  onPreviewImage: (url: string) => void
  onReply: (message: Message) => void
  onCopy: (text?: string) => void
  onEdit: (message: Message) => void
  onDelete: (message: Message, scope: "me" | "everyone") => void
  onReact: (message: Message, emoji: string) => void
  onPin: (message: Message) => void
}) {
  const deleted = Boolean(message.deletedAt)
  const reply = getReplyMessage(message)
  const reactions = message.reactions || []

  return (
    <div ref={refCallback} data-message-id={message.id} className="flex flex-col gap-1 scroll-mt-28">
      {showDate ? (
        <div className="my-2 flex items-center justify-center">
          <span className="rounded-full border border-[#eee7dc] bg-white px-3 py-1 text-[11px] text-[#81766a]">
            {formatDateSeparator(message.createdAt)}
          </span>
        </div>
      ) : null}

      <div className={cn("group flex", mine ? "justify-end" : "justify-start")}>
        <div className={cn("flex max-w-[min(760px,82%)] flex-col", mine ? "items-end" : "items-start")}>
          <div
            className={cn(
              "relative rounded-[8px] border px-4 py-3 text-sm shadow-sm transition",
              mine
                ? "border-[#2d261e] bg-[#2d261e] text-white"
                : "border-[#eee7dc] bg-white text-[#2d261e]",
              deleted && "border-[#eee7dc] bg-[#f5f0e8] text-[#81766a]",
            )}
          >
            {message.pinnedAt ? (
              <div className={cn("mb-2 flex items-center gap-1 text-[11px]", mine ? "text-amber-100" : "text-orange-600")}>
                <Pin className="h-3 w-3" />
                Pinned
              </div>
            ) : null}

            {reply ? (
              <button
                type="button"
                className={cn(
                  "mb-2 block w-full rounded-[8px] border-l-2 px-3 py-2 text-left text-[11px]",
                  mine ? "border-amber-300 bg-white/10 text-white/80" : "border-orange-300 bg-[#fbfaf7] text-[#5d5145]",
                )}
              >
                <span className="block font-semibold">{mine ? selectedName : "You"}</span>
                <span className="line-clamp-2">{describeMessage(reply)}</span>
              </button>
            ) : null}

            {deleted ? (
              <p className="italic">This message was deleted.</p>
            ) : (
              <>
                {message.attachments?.length > 0 ? (
                  <div className="mb-2 space-y-2">
                    {message.attachments.map((att, idx) => (
                      <AttachmentPreview
                        key={`${att.url}-${idx}`}
                        attachment={att}
                        mine={mine}
                        onPreviewImage={onPreviewImage}
                      />
                    ))}
                  </div>
                ) : null}
                {message.text ? <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p> : null}
              </>
            )}

            <div className={cn("mt-2 flex flex-wrap items-center gap-2 text-[10px]", mine ? "text-white/65" : "text-[#81766a]")}>
              <span>{formatMessageTime(message.createdAt)}</span>
              {message.editedAt && !deleted ? <span>edited</span> : null}
              {mine ? message.readAt ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" /> : null}
            </div>
          </div>

          {reactions.length > 0 ? (
            <div className={cn("mt-1 flex flex-wrap gap-1", mine ? "justify-end" : "justify-start")}>
              {reactions.map((reaction) => (
                <button
                  key={reaction.emoji}
                  type="button"
                  onClick={() => onReact(message, reaction.emoji)}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-xs shadow-sm transition",
                    hasMyReaction(reaction, myId)
                      ? "border-orange-300 bg-orange-50 text-orange-700"
                      : "border-[#eee7dc] bg-white text-[#5d5145] hover:border-orange-200",
                  )}
                >
                  {reaction.emoji} {getReactionCount(reaction)}
                </button>
              ))}
            </div>
          ) : null}

          {!deleted ? (
            <div className={cn(
              "mt-1 flex items-center gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100",
              mine ? "justify-end" : "justify-start",
            )}>
              <ReactionMenu message={message} onReact={onReact} />
              <MessageActionButton label="Reply" onClick={() => onReply(message)}>
                <Reply className="h-3.5 w-3.5" />
              </MessageActionButton>
              <MessageActionButton label="Copy" onClick={() => onCopy(message.text)}>
                <Copy className="h-3.5 w-3.5" />
              </MessageActionButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#eee7dc] bg-white text-[#81766a] shadow-sm hover:border-orange-200 hover:text-[#2d261e]"
                    aria-label="More message actions"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={mine ? "end" : "start"} className="rounded-[8px]">
                  {mine ? (
                    <DropdownMenuItem onClick={() => onEdit(message)}>
                      <Pencil className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem onClick={() => onPin(message)}>
                    {message.pinnedAt ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    {message.pinnedAt ? "Unpin" : "Pin"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete(message, "me")}>
                    <Trash2 className="h-4 w-4" />
                    Delete for me
                  </DropdownMenuItem>
                  {mine ? (
                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(message, "everyone")}>
                      <Trash2 className="h-4 w-4" />
                      Delete for everyone
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function AttachmentPreview({
  attachment,
  mine,
  onPreviewImage,
}: {
  attachment: MessageAttachment
  mine: boolean
  onPreviewImage: (url: string) => void
}) {
  if (isImageAttachment(attachment)) {
    return (
      <button type="button" className="block overflow-hidden rounded-[8px]" onClick={() => onPreviewImage(attachment.url)}>
        <img src={attachment.url} alt={attachment.name || "Attachment"} className="max-h-64 w-full max-w-sm object-cover" />
      </button>
    )
  }

  return (
    <a
      className={cn(
        "flex min-w-64 items-center gap-2 rounded-[8px] px-3 py-2 text-xs",
        mine ? "bg-white/10 text-white" : "bg-[#fbfaf7] text-[#2d261e]",
      )}
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
    >
      {attachment.type === "video" ? <Video className="h-4 w-4" /> : <FileIcon className="h-4 w-4" />}
      <span className="min-w-0 flex-1 truncate">{attachment.name || "View attachment"}</span>
      <span className={cn("text-[11px]", mine ? "text-white/60" : "text-[#81766a]")}>{formatBytes(attachment.size)}</span>
    </a>
  )
}

function MessageActionButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#eee7dc] bg-white text-[#81766a] shadow-sm hover:border-orange-200 hover:text-[#2d261e]"
          onClick={onClick}
          aria-label={label}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function ReactionMenu({ message, onReact }: { message: Message; onReact: (message: Message, emoji: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#eee7dc] bg-white text-[#81766a] shadow-sm hover:border-orange-200 hover:text-[#2d261e]"
          aria-label="React to message"
        >
          <SmilePlus className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="rounded-[8px] p-2">
        <div className="flex gap-1">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-[8px] text-base transition hover:bg-orange-50"
              onClick={() => onReact(message, emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
