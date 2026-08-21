"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { MessageSquare, X, Send, Loader2, Search, ArrowLeft, Paperclip, FileIcon, Check, CheckCheck, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import type { Conversation, Message } from "@/lib/api/types"
import { useAuthContext } from "@/app/providers/auth-provider"
import { useSocket } from "@/lib/socket-context"
import { formatDistanceToNow, format, isToday, isYesterday, isSameDay } from "date-fns"
import { getErrorMessage } from "@/lib/utils/error-messages"

// ─── Helpers ────────────────────────────────────────────────────────────────

const getParticipantId = (p: any): string => {
  if (!p) return ''
  if (typeof p === 'string') return p
  return p.id || p._id || ''
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
  if (!p || typeof p === 'string') return 'User'
  return p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.username || 'User'
}

const getParticipantAvatar = (p: any): string | undefined => {
  if (!p || typeof p === 'string') return undefined
  return p.avatar || p.profile_picture || p.photo_profil || p.photo
}

const formatMessageTime = (date: string) => {
  const d = new Date(date)
  if (isToday(d)) return format(d, 'h:mm a')
  if (isYesterday(d)) return 'Yesterday ' + format(d, 'h:mm a')
  return format(d, 'MMM d, h:mm a')
}

const formatConversationTime = (date: string) => {
  const d = new Date(date)
  if (isToday(d)) return format(d, 'h:mm a')
  if (isYesterday(d)) return 'Yesterday'
  return formatDistanceToNow(d, { addSuffix: false })
}

const formatDateSeparator = (date: string) => {
  const d = new Date(date)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMMM d, yyyy')
}

const getMsgSenderId = (msg: Message, myId: string): { id: string; isMine: boolean } => {
  const rawSenderId = (msg as any).senderId
  const msgSenderId = typeof rawSenderId === 'string'
    ? rawSenderId
    : (rawSenderId?._id || rawSenderId?.id || (typeof rawSenderId?.toString === 'function' ? rawSenderId.toString() : rawSenderId || ''))
  const isMine = msgSenderId === myId || ((msg.sender as any)?._id === myId) || ((msg.sender as any)?.id === myId)
  return { id: msgSenderId, isMine }
}

const getSessionChatClosedMessage = (conversation?: Conversation | null): string => {
  if (!conversation || conversation.type !== 'SESSION_TEMP_DM' || conversation.isOpen) return ''
  if (conversation.closeReason === 'session_finished') return 'This session chat is closed because the session has finished.'
  if (conversation.closeReason === 'booking_cancelled') return 'This session chat is closed because the booking was cancelled.'
  if (conversation.closeReason === 'booking_completed') return 'This session chat is closed because the session was completed.'
  return 'This session chat is closed.'
}

// ─── Component ──────────────────────────────────────────────────────────────

export function DMComponent() {
  const [mounted, setMounted] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = React.useState<Conversation | null>(null)
  const [messages, setMessages] = React.useState<Message[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [newMessage, setNewPost] = React.useState("")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = React.useState<string | null>(null)
  const { user: currentUser } = useAuthContext()
  const { onlineUsers } = useSocket()
  const myId = currentUser?.id || (currentUser as any)?._id || ''

  const getErrorMessage = (err: any, fallback: string) => {
    const e = err?.response?.data ?? err
    if (!e) return fallback
    if (typeof e === 'string') return e
    if (typeof e?.message === 'string') return e.message
    if (typeof err?.message === 'string') return err.message
    return fallback
  }

  const scrollRef = React.useRef<HTMLDivElement>(null)
  const loadedConvIdRef = React.useRef<string | null>(null)
  const loadingConvRef = React.useRef<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)

  // ── Fetch conversations ───────────────────────────────────────────────

  const fetchConversations = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await api.dm.listInbox()
      setConversations(res.conversations || [])
    } catch (err) {
      console.error("Error fetching conversations:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── Load messages ─────────────────────────────────────────────────────

  const loadMessages = React.useCallback(async (convId: string) => {
    if (loadingConvRef.current === convId) return
    loadingConvRef.current = convId

    try {
      setIsLoadingMessages(true)
      const res = await api.dm.listMessages(convId)
      setMessages(res.messages || [])
      loadedConvIdRef.current = convId
      if (res.conversation?.id) {
        setSelectedConversation(res.conversation)
      }
      scrollToBottom()
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load messages'))
    } finally {
      setIsLoadingMessages(false)
      loadingConvRef.current = null
    }
  }, [])

  const scrollToBottom = React.useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, 100)
  }, [])

  // ── Open-DM event (with frontend dedup) ───────────────────────────────

  React.useEffect(() => {
    const handleOpenDM = async (e: any) => {
      const { communityId, targetUserId, conversationId } = e.detail || {}
      if (!conversationId && (!communityId || !targetUserId)) return

      setIsOpen(true)
      setError(null)

      if (conversationId) {
        loadedConvIdRef.current = null
        setSelectedConversation((prev) => {
          if (prev?.id === conversationId) return prev
          const existing = conversations.find((c) => c.id === conversationId)
          return existing || ({ id: conversationId } as Conversation)
        })
        await loadMessages(conversationId)
        return
      }

      if (targetUserId === myId) {
        setError("You can't message yourself")
        return
      }

      // Frontend dedup: check if we already have a conversation with this user
      const existingConv = conversations.find(c => {
        const otherId = getParticipantId(getOtherParticipant(c, myId))
        return otherId === targetUserId
      })

      if (existingConv) {
        loadedConvIdRef.current = null
        setSelectedConversation(existingConv)
        await loadMessages(existingConv.id)
        return
      }

      try {
        setIsLoadingMessages(true)
        const res = await api.dm.startPeerConversation(communityId, targetUserId)
        const conv = res?.conversation

        if (conv?.id) {
          loadedConvIdRef.current = null
          setSelectedConversation(conv)
          await loadMessages(conv.id)
        }
        fetchConversations().catch(() => { })
      } catch (err: any) {
        setError(getErrorMessage(err, 'Failed to start conversation'))
      } finally {
        setIsLoadingMessages(false)
      }
    }

    window.addEventListener('open-dm', handleOpenDM)
    return () => window.removeEventListener('open-dm', handleOpenDM)
  }, [myId, conversations, loadMessages, fetchConversations])

  // ── File upload ───────────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!selectedConversation?.id) {
      setError('No conversation selected')
      if (fileInputRef.current) fileInputRef.current.value = ''
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
        fetchConversations().catch(() => { })
      }
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to upload file'))
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── SSR: Set mounted ────────────────────────────────────────────────
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // ── Auto-fetch on open ───────────────────────────────────────────────

  React.useEffect(() => {
    if (isOpen) fetchConversations()
  }, [isOpen, fetchConversations])

  React.useEffect(() => {
    if (selectedConversation?.id && selectedConversation.id !== loadedConvIdRef.current) {
      loadMessages(selectedConversation.id)
      api.dm.markRead(selectedConversation.id).catch(console.error)
    }
  }, [selectedConversation?.id, loadMessages])

  // Focus input when conversation is selected
  React.useEffect(() => {
    if (selectedConversation && !isLoadingMessages) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [selectedConversation, isLoadingMessages])

  // ── Polling: refresh messages every 5s and conversations every 15s ──

  React.useEffect(() => {
    if (!isOpen) return

    // Poll conversations every 15s
    const convInterval = setInterval(() => {
      api.dm.listInbox().then(res => {
        setConversations(res.conversations || [])
      }).catch(() => { })
    }, 15000)

    return () => clearInterval(convInterval)
  }, [isOpen])

  React.useEffect(() => {
    if (!isOpen || !selectedConversation?.id) return

    const msgInterval = setInterval(() => {
      const convId = selectedConversation.id
      api.dm.listMessages(convId).then(res => {
        const newMsgs = res.messages || []
        if (res.conversation?.id) {
          setSelectedConversation(res.conversation)
        }
        setMessages(prev => {
          // Only update if there are genuinely new messages
          if (newMsgs.length !== prev.length || (newMsgs.length > 0 && newMsgs[newMsgs.length - 1]?.id !== prev[prev.length - 1]?.id)) {
            return newMsgs
          }
          return prev
        })
      }).catch(() => { })
    }, 5000)

    return () => clearInterval(msgInterval)
  }, [isOpen, selectedConversation?.id])

  // ── Send message ──────────────────────────────────────────────────────

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!newMessage.trim() || !selectedConversation) return
    if (selectedConversation.type === 'SESSION_TEMP_DM' && !selectedConversation.isOpen) {
      setError(getSessionChatClosedMessage(selectedConversation))
      return
    }

    const text = newMessage.trim()
    setNewPost("")
    setError(null)

    const tempId = `temp-${Date.now()}`
    const optimisticMsg: Message = {
      id: tempId,
      conversationId: selectedConversation.id,
      senderId: myId,
      recipientId: getParticipantId(selectedConversation.participantA) === myId
        ? getParticipantId(selectedConversation.participantB)
        : getParticipantId(selectedConversation.participantA),
      text,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticMsg])
    scrollToBottom()

    try {
      const res = await api.dm.sendMessage(selectedConversation.id, { text })
      const serverMsg = res?.message
      if (serverMsg?.id) {
        setMessages((prev) => {
          const withoutTemp = prev.filter(m => m.id !== tempId)
          if (withoutTemp.some(m => m.id === serverMsg.id)) return withoutTemp
          return [...withoutTemp, serverMsg]
        })
      }
      fetchConversations().catch(() => { })
      scrollToBottom()
    } catch (err: any) {
      setMessages((prev) => prev.filter(m => m.id !== tempId))
      setNewPost(text)
      const rawMessage = getErrorMessage(err, '') || ''
      if (/session chat is closed/i.test(rawMessage)) {
        setError('This session chat is closed.')
      } else {
        setError(rawMessage || 'Failed to send message')
      }
    }
  }

  // ── Filtered conversations ────────────────────────────────────────────

  const filteredConversations = conversations.filter((c) => {
    const other = getOtherParticipant(c, myId)
    const name = getParticipantName(other)
    if (!searchQuery.trim()) return true
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const handleSelectConversation = (conv: Conversation) => {
    setError(null)
    setSelectedConversation(conv)
  }

  const handleBack = () => {
    setSelectedConversation(null)
    setMessages([])
    loadedConvIdRef.current = null
  }

  // ── Total unread badge ────────────────────────────────────────────────

  const totalUnread = conversations.filter(c => getMyUnreadCount(c, myId) > 0).length
  const selectedConversationClosedMessage = getSessionChatClosedMessage(selectedConversation)

  // ── Close on Escape ───────────────────────────────────────────────────

  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (previewImageUrl) {
        setPreviewImageUrl(null)
        return
      }
      setIsOpen(false)
    }
    if (isOpen) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, previewImageUrl])

  // ── Click outside to close (desktop) ──────────────────────────────────

  React.useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        // Don't close if clicking the trigger button
        const target = e.target as HTMLElement
        if (target.closest('[data-dm-trigger]')) return
        setIsOpen(false)
      }
    }

    // Use a slight delay so the open click doesn't immediately close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative rounded-full hover:bg-gray-100 transition-colors duration-200"
        onClick={() => setIsOpen(o => !o)}
        data-dm-trigger
      >
        <MessageSquare className="h-5 w-5 text-gray-600" />
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] px-1 bg-gray-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
            {totalUnread}
          </span>
        )}
      </Button>

      {/* Backdrop — full screen, works on all viewports */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[59] bg-black/20 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-none"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      )}

      {/* Messenger Panel - Rendered in a Portal to avoid clipping from sticky header's backdrop filler */}
      {mounted && createPortal(
        <div
          className={cn(
            "fixed inset-0 z-[100] transition-all duration-300 pointer-events-none",
            isOpen ? "opacity-100 visible" : "opacity-0 invisible"
          )}
        >
          {/* Backdrop on mobile */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm sm:hidden pointer-events-auto"
            onClick={() => setIsOpen(false)}
          />

          {/* Main Panel */}
          <div
            ref={panelRef}
            className={cn(
              "absolute flex flex-col bg-white shadow-xl shadow-gray-200/50 transition-all duration-300 ease-out overflow-hidden pointer-events-auto",
              // Mobile: full screen
              "inset-0 sm:inset-auto",
              // Desktop: top-right dropdown style
              "sm:top-[80px] sm:right-6 sm:w-[420px] sm:h-[640px] sm:max-h-[calc(100vh-120px)] sm:rounded-2xl sm:border sm:border-gray-200",
              // Animation
              isOpen
                ? "translate-y-0 sm:scale-100"
                : "translate-y-4 sm:scale-95 sm:translate-y-2"
            )}
            style={{ willChange: 'transform, opacity' }}
          >
            {!selectedConversation ? (
              /* ═══════════════════════════════════════════════════════
                 CONVERSATIONS LIST
                 ═══════════════════════════════════════════════════════ */
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 leading-tight">Messages</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="h-9 w-9 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search conversations..."
                      className="pl-10 h-10 text-sm bg-gray-100 border-transparent rounded-lg focus-visible:ring-0 placeholder:text-gray-400"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                          </div>
                        </div>
                        <p className="text-sm text-gray-400">Loading conversations...</p>
                      </div>
                    </div>
                  ) : filteredConversations.length > 0 ? (
                    <div className="py-1">
                      {filteredConversations.map((conv) => {
                        const other = getOtherParticipant(conv, myId)
                        const isUnread = getMyUnreadCount(conv, myId) > 0
                        const unreadCount = getMyUnreadCount(conv, myId)
                        const name = getParticipantName(other)
                        const avatar = getParticipantAvatar(other)
                        const otherId = getParticipantId(other)
                        const isOnline = onlineUsers.has(otherId)

                        return (
                          <button
                            key={conv.id}
                            onClick={() => handleSelectConversation(conv)}
                            className={cn(
                              "w-full flex items-center gap-3.5 px-5 py-3.5 transition-all duration-200 text-left group relative",
                              "hover:bg-gray-50 active:bg-gray-100",
                              isUnread && "bg-gray-50/50"
                            )}
                          >
                            {/* Unread indicator bar */}
                            {isUnread && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-gray-900 rounded-r-full" />
                            )}
                            <div className="relative flex-shrink-0">
                              <Avatar className="h-12 w-12 border border-gray-100">
                                <AvatarImage src={avatar} />
                                <AvatarFallback className="bg-gray-100 text-gray-600 text-sm font-semibold">
                                  {name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {isOnline && (
                                <span className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-400 border-2 border-white rounded-full" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className={cn(
                                  "text-[14px] truncate leading-tight",
                                  isUnread ? "font-bold text-gray-900" : "font-medium text-gray-700"
                                )}>
                                  {name}
                                </span>
                                <span className={cn(
                                  "text-[11px] flex-shrink-0 ml-2",
                                  isUnread ? "text-gray-900 font-semibold" : "text-gray-400"
                                )}>
                                  {conv.lastMessageAt ? formatConversationTime(conv.lastMessageAt) : ''}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <p className={cn(
                                  "text-[13px] truncate leading-snug",
                                  isUnread ? "text-gray-900 font-medium" : "text-gray-400"
                                )}>
                                  {conv.lastMessageText || "Start a conversation"}
                                </p>
                                {isUnread && unreadCount > 0 && (
                                  <span className="h-5 min-w-[20px] px-1.5 bg-gray-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                      <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
                        <MessageSquare className="h-8 w-8 text-gray-300" />
                      </div>
                      <p className="text-base font-semibold text-gray-700 mb-1">No conversations yet</p>
                      <p className="text-sm text-gray-400 max-w-[240px] leading-relaxed">Start chatting by visiting a community and messaging a member</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ═══════════════════════════════════════════════════════
                 CHAT VIEW
                 ═══════════════════════════════════════════════════════ */
              <div className="flex flex-col h-full">
                {/* Chat Header */}
                {(() => {
                  const other = getOtherParticipant(selectedConversation, myId)
                  const name = getParticipantName(other)
                  const avatar = getParticipantAvatar(other)
                  const otherId = getParticipantId(other)
                  const isOnline = onlineUsers.has(otherId)

                  return (
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 flex-shrink-0 bg-white">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleBack}
                        className="h-9 w-9 rounded-full hover:bg-gray-100 flex-shrink-0 transition-colors duration-200"
                      >
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                      </Button>
                      <Avatar className="h-10 w-10 border border-gray-100 flex-shrink-0">
                        <AvatarImage src={avatar} />
                        <AvatarFallback className="bg-gray-100 text-gray-600 text-xs font-semibold">
                          {name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-bold text-gray-900 truncate leading-tight">{name}</h3>
                        {isOnline && (
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            <span className="text-xs text-emerald-600 font-medium">Online</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsOpen(false)}
                        className="h-9 w-9 rounded-full hover:bg-gray-100 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  )
                })()}

                {/* Messages Area */}
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto overscroll-contain px-4 bg-white"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-400">Loading messages...</p>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center px-4">
                        <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
                          <X className="h-5 w-5 text-red-400" />
                        </div>
                        <p className="text-sm text-red-500 font-medium">{error}</p>
                        <button
                          onClick={() => { setError(null); if (selectedConversation) loadMessages(selectedConversation.id) }}
                          className="text-sm text-gray-900 mt-2 hover:underline font-medium transition-all"
                        >
                          Try again
                        </button>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                      {(() => {
                        const other = getOtherParticipant(selectedConversation, myId)
                        const name = getParticipantName(other)
                        const avatar = getParticipantAvatar(other)
                        return (
                          <>
                            <Avatar className="h-16 w-16 mb-4 border border-gray-100">
                              <AvatarImage src={avatar} />
                              <AvatarFallback className="bg-gray-100 text-gray-600 text-lg font-bold">
                                {name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-base font-semibold text-gray-800 mb-1">{name}</p>
                            <p className="text-sm text-gray-400 leading-relaxed">Send a message to start the conversation</p>
                          </>
                        )
                      })()}
                    </div>
                  ) : (
                    <div className="py-4">
                      {messages.map((msg, idx) => {
                        const { isMine } = getMsgSenderId(msg, myId)
                        const prevMsg = messages[idx - 1]
                        const nextMsg = messages[idx + 1]

                        // Date separator
                        const showDateSep = idx === 0 || (prevMsg && !isSameDay(new Date(msg.createdAt), new Date(prevMsg.createdAt)))

                        // Time gap > 5 minutes
                        const showTimestamp = idx === 0 || (prevMsg && (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 5 * 60 * 1000))

                        // Grouping: is this message part of a consecutive group from the same sender?
                        const prevIsSame = prevMsg && getMsgSenderId(prevMsg, myId).isMine === isMine && !showTimestamp && !showDateSep
                        const nextIsSame = nextMsg && getMsgSenderId(nextMsg, myId).isMine === isMine &&
                          (new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime() <= 5 * 60 * 1000) &&
                          isSameDay(new Date(msg.createdAt), new Date(nextMsg.createdAt))

                        // Is this the last message from me in a group? (to show seen indicator)
                        const isLastInGroup = !nextIsSame

                        // Read receipt logic for sent messages
                        const isTemp = msg.id.startsWith('temp-')
                        const hasReadAt = !!(msg as any).readAt

                        return (
                          <div key={msg.id}>
                            {/* Date Separator */}
                            {showDateSep && (
                              <div className="flex items-center justify-center my-5">
                                <div className="h-px flex-1 bg-gray-100" />
                                <span className="text-[11px] text-gray-400 font-medium bg-white px-3 py-1 rounded-full border border-gray-100 mx-3">
                                  {formatDateSeparator(msg.createdAt)}
                                </span>
                                <div className="h-px flex-1 bg-gray-100" />
                              </div>
                            )}

                            {/* Time Stamp */}
                            {showTimestamp && !showDateSep && (
                              <div className="flex items-center justify-center my-3">
                                <span className="text-[10px] text-gray-400 font-medium">
                                  {format(new Date(msg.createdAt), 'h:mm a')}
                                </span>
                              </div>
                            )}

                            {/* Message Bubble */}
                            <div className={cn(
                              "flex w-full",
                              isMine ? "justify-end" : "justify-start",
                              prevIsSame ? "mt-0.5" : "mt-3"
                            )}>
                              <div className={cn("max-w-[78%] relative group")}>
                                <div className={cn(
                                  "px-4 py-2.5 text-[14px] leading-relaxed",
                                  isMine
                                    ? "bg-gray-900 text-white"
                                    : "bg-gray-100 text-gray-900",
                                  // Border radius based on position in group
                                  isMine ? cn(
                                    "rounded-2xl",
                                    !prevIsSame && nextIsSame && "rounded-br-md",
                                    prevIsSame && nextIsSame && "rounded-r-md",
                                    prevIsSame && !nextIsSame && "rounded-tr-md",
                                  ) : cn(
                                    "rounded-2xl",
                                    !prevIsSame && nextIsSame && "rounded-bl-md",
                                    prevIsSame && nextIsSame && "rounded-l-md",
                                    prevIsSame && !nextIsSame && "rounded-tl-md",
                                  ),
                                )}>
                                  {msg.text && <div className="whitespace-pre-wrap break-words">{msg.text}</div>}

                                  {/* Attachments */}
                                  {msg.attachments && msg.attachments.length > 0 && (
                                    <div className={cn("space-y-2", msg.text && "mt-2 pt-2 border-t", isMine ? "border-white/20" : "border-gray-200")}>
                                      {msg.attachments.map((att, attIdx) => (
                                        <div key={attIdx}>
                                          {att.type === 'image' ? (
                                            <div className="relative max-w-[260px] overflow-hidden rounded-xl">
                                              <img
                                                src={att.url}
                                                alt="attachment"
                                                className="w-full object-cover max-h-[280px] cursor-zoom-in hover:scale-[1.02] transition-transform duration-200"
                                                onClick={() => setPreviewImageUrl(att.url)}
                                                onError={(e) => {
                                                  (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Image+Not+Found';
                                                }}
                                              />
                                            </div>
                                          ) : att.type === 'video' ? (
                                            <a href={att.url} target="_blank" rel="noopener noreferrer" className={cn(
                                              "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200",
                                              isMine ? "bg-white/10 border-white/20 text-white hover:bg-white/20" : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50"
                                            )}>
                                              <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                                                <Video className="h-4 w-4 text-red-600" />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold truncate">Video</p>
                                                <p className="text-[10px] opacity-60">Tap to play</p>
                                              </div>
                                            </a>
                                          ) : (
                                            <a href={att.url} target="_blank" rel="noopener noreferrer" className={cn(
                                              "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200",
                                              isMine ? "bg-white/10 border-white/20 text-white hover:bg-white/20" : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50"
                                            )}>
                                              <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                <FileIcon className="h-4 w-4 text-gray-600" />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold truncate">File</p>
                                                <p className="text-[10px] opacity-60">Tap to download</p>
                                              </div>
                                            </a>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Inline timestamp on hover */}
                                  <div className={cn(
                                    "mt-1 flex items-center gap-1",
                                    isMine ? "justify-end" : "justify-start"
                                  )}>
                                    <span className={cn(
                                      "text-[10px]",
                                      isMine ? "text-white/60" : "text-gray-400"
                                    )}>
                                      {format(new Date(msg.createdAt), 'h:mm a')}
                                    </span>

                                    {/* Seen / Delivered / Sent indicator */}
                                    {isMine && isLastInGroup && (
                                      <span className="inline-flex items-center ml-0.5">
                                        {isTemp ? (
                                          <Check className="h-3 w-3 text-white/60" />
                                        ) : hasReadAt ? (
                                          <CheckCheck className="h-3.5 w-3.5 text-white" />
                                        ) : (
                                          <CheckCheck className="h-3.5 w-3.5 text-white/60" />
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* "Seen" label after the very last sent message */}
                            {isMine && hasReadAt && idx === messages.length - 1 && (
                              <div className="flex justify-end mt-1 pr-1">
                                <span className="text-[10px] text-gray-400 font-medium">Seen</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Error banner */}
                {error && messages.length > 0 && (
                  <div className="px-4 py-2 bg-red-50 border-t border-red-100 flex-shrink-0">
                    <p className="text-xs text-red-600 text-center font-medium">{error}</p>
                  </div>
                )}

                {/* Closed session chat banner */}
                {!error && selectedConversationClosedMessage && (
                  <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 flex-shrink-0">
                    <p className="text-xs text-amber-700 text-center font-medium">{selectedConversationClosedMessage}</p>
                  </div>
                )}

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="px-4 py-3 border-t border-gray-100 flex-shrink-0 bg-white safe-area-inset-bottom">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 focus-within:ring-1 focus-within:ring-gray-300 focus-within:bg-white transition-all duration-200">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-200 transition-colors duration-200 flex-shrink-0"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || Boolean(selectedConversationClosedMessage)}
                    >
                      {isUploading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Paperclip className="h-4.5 w-4.5" />}
                    </Button>
                    <Input
                      ref={inputRef}
                      value={newMessage}
                      onChange={(e) => setNewPost(e.target.value)}
                      placeholder={selectedConversationClosedMessage ? "Session chat is closed" : isUploading ? "Uploading..." : "Type a message..."}
                      className="flex-1 h-9 text-[14px] bg-transparent border-0 focus-visible:ring-0 px-1"
                      disabled={isUploading || Boolean(selectedConversationClosedMessage)}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className={cn(
                        "h-9 w-9 rounded-full transition-all duration-200 flex-shrink-0",
                        newMessage.trim()
                          ? "bg-gray-900 hover:bg-black text-white scale-100"
                          : "bg-transparent text-gray-300 hover:bg-transparent scale-90"
                      )}
                      disabled={!newMessage.trim() || Boolean(selectedConversationClosedMessage)}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Image preview modal */}
            {previewImageUrl && (
              <div
                className="absolute inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
                onClick={() => setPreviewImageUrl(null)}
              >
                <button
                  type="button"
                  className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors"
                  onClick={() => setPreviewImageUrl(null)}
                  aria-label="Close image preview"
                >
                  <X className="h-5 w-5" />
                </button>
                <img
                  src={previewImageUrl}
                  alt="Preview"
                  className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
