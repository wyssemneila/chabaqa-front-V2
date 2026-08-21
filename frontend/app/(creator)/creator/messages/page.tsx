'use client'

import { useEffect, useRef, useState } from 'react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import { useAuthContext } from '@/app/providers/auth-provider'
import { dmApi, normalizeDmMessage } from '@/lib/api/dm.api'
import { useSocket } from '@/lib/socket-context'
import { dmBroadcastsApi, type DmAutomation, type DmBroadcast } from '@/lib/api/dm-broadcasts.api'
import { useCreatorCommunity } from '@/app/(creator)/creator/context/creator-community-context'
import type { Conversation as ApiConversation, Message as ApiMessage, MessageParticipant } from '@/lib/api/types'
import {
  Search, Send, Zap, Check, MoreHorizontal,
  MessageSquare, Megaphone, Edit3, Plus, Trash2, Play,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type View = 'conversations' | 'broadcasts' | 'automations'

interface Message { id: string | number; from: 'creator' | 'member'; text: string; time: string }

interface Conversation {
  id: string | number
  member: { name: string; initials: string; color: string; handle: string; avatar?: string }
  lastMessage: string
  lastTime: string
  unread: number
  messages: Message[]
}

// ─── API mapping helpers ──────────────────────────────────────────────────────

const MEMBER_COLORS = ['#7c3aed', '#db2777', '#0891b2', '#d97706', '#16a34a', '#6366f1', '#0f766e', '#be123c']

const normalizeId = (value: any): string => {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value._id?.toString?.() || value.id || value.toString?.() || ''
}

const getParticipant = (value: any): MessageParticipant | null =>
  value && typeof value === 'object' ? (value as MessageParticipant) : null

const getUserId = (user: any): string => normalizeId(user?._id || user?.id)

const getDisplayName = (user: any): string => {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
  return user?.name || fullName || user?.username || user?.email || 'Member'
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] || 'M') + (parts[1]?.[0] || '')).toUpperCase()
}

const getParticipantAvatar = (user: any): string | undefined =>
  user?.avatar || user?.profile_picture || user?.photo_profil || user?.photo || undefined

const formatMessageTime = (value?: string): string => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const today = new Date()
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getOtherParticipant = (conversation: ApiConversation, myId: string): MessageParticipant | null => {
  const a = getParticipant(conversation.participantA)
  const b = getParticipant(conversation.participantB)
  if (a && normalizeId(a) !== myId) return a
  if (b && normalizeId(b) !== myId) return b
  return b || a
}

const getMyUnreadCount = (conversation: ApiConversation, myId: string): number => {
  const participantAId = normalizeId(conversation.participantA)
  return participantAId === myId ? conversation.unreadCountA || 0 : conversation.unreadCountB || 0
}

const toUiMessage = (message: ApiMessage, myId: string): Message => ({
  id: message.id,
  from: normalizeId(message.senderId || message.sender) === myId ? 'creator' : 'member',
  text: message.deletedAt ? 'Message deleted' : (message.text || (message.attachments?.[0]?.type === 'image' ? 'Image attachment' : 'Attachment')),
  time: formatMessageTime(message.createdAt),
})

const toUiConversation = (
  conversation: ApiConversation,
  myId: string,
  messages: ApiMessage[] = [],
  index = 0,
): Conversation => {
  const other = getOtherParticipant(conversation, myId)
  const name = getDisplayName(other)
  return {
    id: conversation.id,
    member: {
      name,
      initials: getInitials(name),
      color: MEMBER_COLORS[index % MEMBER_COLORS.length],
      handle: other?.username ? `@${other.username}` : (other?.email || 'Member'),
      avatar: getParticipantAvatar(other),
    },
    lastMessage: conversation.lastMessageText || (conversation.type === 'SESSION_TEMP_DM' ? 'Session chat' : 'Conversation'),
    lastTime: formatMessageTime(conversation.lastMessageAt || conversation.updatedAt),
    unread: getMyUnreadCount(conversation, myId),
    messages: messages.map(message => toUiMessage(message, myId)),
  }
}

// ─── Conversation panel ────────────────────────────────────────────────────────

function ConversationsView({ lang }: { lang: string }) {
  const { user } = useAuthContext()
  const { socket, isConnected } = useSocket()
  const myId = getUserId(user)
  const [convs, setConvs]     = useState<Conversation[]>([])
  const [selected, setSelected] = useState<string>('')
  const [query, setQuery]       = useState('')
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const loadInboxRef = useRef<() => Promise<void>>(async () => undefined)

  const thread = convs.find(c => String(c.id) === selected)
  const filtered = convs.filter(c =>
    c.member.name.toLowerCase().includes(query.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(query.toLowerCase())
  )

  const loadInbox = async () => {
    if (!myId) return
    setLoading(true)
    setError('')
    try {
      const inbox = await dmApi.listInbox({ page: 1, limit: 50 })
      const next = (inbox.conversations || []).map((conversation, index) => toUiConversation(conversation, myId, [], index))
      setConvs(next)
      const nextSelected = selected && next.some(c => String(c.id) === selected) ? selected : String(next[0]?.id || '')
      setSelected(nextSelected)
      if (nextSelected) {
        await loadMessages(nextSelected, next)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load conversations')
      setConvs([])
    } finally {
      setLoading(false)
    }
  }

  loadInboxRef.current = loadInbox

  const loadMessages = async (conversationId: string, baseConvs = convs) => {
    if (!conversationId || !myId) return
    try {
      const res = await dmApi.listMessages(conversationId, { page: 1, limit: 100 })
      const baseIndex = baseConvs.findIndex(c => String(c.id) === conversationId)
      const mapped = toUiConversation(res.conversation, myId, res.messages || [], Math.max(0, baseIndex))
      setConvs(prev => {
        const source = prev.length ? prev : baseConvs
        return source.map(c => String(c.id) === conversationId ? { ...mapped, unread: 0 } : c)
      })
      await dmApi.markRead(conversationId).catch(() => undefined)
    } catch (err: any) {
      setError(err?.message || 'Failed to load messages')
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || !thread) return
    const text = input.trim()
    setInput('')
    setError('')
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const clientRequestId = `creator-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const optimistic: Message = { id: `pending-${clientRequestId}`, from: 'creator', text, time: now }
    setConvs(prev => prev.map(c =>
      String(c.id) === selected
        ? { ...c, messages: [...c.messages, optimistic], lastMessage: text, lastTime: 'Now', unread: 0 }
        : c
    ))
    try {
      const res = await dmApi.sendMessage(selected, { text, clientRequestId })
      setConvs(prev => prev.map(c =>
        String(c.id) === selected
          ? {
              ...c,
              messages: c.messages.map(m => m.id === optimistic.id ? toUiMessage(res.message, myId) : m),
              lastMessage: res.message.text || text,
              lastTime: formatMessageTime(res.message.createdAt),
            }
          : c
      ))
    } catch (err: any) {
      setError(err?.message || 'Failed to send message')
      setConvs(prev => prev.map(c =>
        String(c.id) === selected ? { ...c, messages: c.messages.filter(m => m.id !== optimistic.id) } : c
      ))
      setInput(text)
    }
  }

  const markRead = (id: string) => {
    const conversationId = id
    setConvs(prev => prev.map(c => String(c.id) === conversationId ? { ...c, unread: 0 } : c))
    void dmApi.markRead(conversationId).catch(() => undefined)
    void loadMessages(conversationId)
  }

  useEffect(() => {
    if (myId) void loadInboxRef.current()
  }, [myId])

  useEffect(() => {
    if (!socket) return
    const handleNewMessage = (payload: any) => {
      const message = normalizeDmMessage(payload?.message || payload)
      const conversationId = message.conversationId || payload?.conversationId
      if (!conversationId || !message.id) {
        void loadInboxRef.current()
        return
      }

      setConvs(previous => {
        const index = previous.findIndex(conversation => String(conversation.id) === String(conversationId))
        if (index < 0) {
          void loadInboxRef.current()
          return previous
        }

        const current = previous[index]
        const localMessage = toUiMessage(message, myId)
        const messages = current.messages.some(item => String(item.id) === String(localMessage.id))
          ? current.messages
          : [...current.messages.filter(item => !String(item.id).startsWith('pending-')), localMessage]
        const next = {
          ...current,
          messages,
          lastMessage: message.text || (message.attachments?.length ? 'Attachment' : current.lastMessage),
          lastTime: formatMessageTime(message.createdAt) || 'Now',
          unread: String(conversationId) === selected || localMessage.from === 'creator' ? 0 : current.unread + 1,
        }
        return [next, ...previous.filter((_, itemIndex) => itemIndex !== index)]
      })
    }

    const refreshInbox = () => { void loadInboxRef.current() }

    socket.on('connect', refreshInbox)
    socket.on('dm:message:new', handleNewMessage)
    socket.on('dm:message:updated', refreshInbox)
    socket.on('dm:message:deleted', refreshInbox)

    return () => {
      socket.off('connect', refreshInbox)
      socket.off('dm:message:new', handleNewMessage)
      socket.off('dm:message:updated', refreshInbox)
      socket.off('dm:message:deleted', refreshInbox)
    }
  }, [myId, selected, socket])

  useEffect(() => {
    if (!socket || !selected) return
    const conversationId = selected
    const joinConversation = () => socket.emit('dm:join', { conversationId })
    socket.on('connect', joinConversation)
    if (socket.connected) joinConversation()
    return () => {
      socket.off('connect', joinConversation)
      socket.emit('dm:leave', { conversationId })
    }
  }, [selected, socket])

  useEffect(() => {
    if (isConnected || !myId) return
    const interval = window.setInterval(() => {
      void loadInboxRef.current()
    }, 20000)
    return () => window.clearInterval(interval)
  }, [isConnected, myId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [selected, thread?.messages.length])

  const totalUnread = convs.reduce((s, c) => s + c.unread, 0)

  return (
    <div className="flex flex-1 overflow-hidden rounded-2xl"
      style={{ background: 'var(--white)', border: '1px solid var(--bd)', height: 'calc(100vh - 200px)', minHeight: 520 }}>

      {/* Left — conversation list */}
      <div className="w-[280px] shrink-0 flex flex-col" style={{ borderRight: '1px solid var(--bd)' }}>
        {/* Header */}
        <div className="px-4 pt-4 pb-3 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-bold" style={{ color: 'var(--t1)' }}>
              {lang === 'ar' ? 'البريد الوارد' : 'Inbox'} {totalUnread > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold text-white"
                  style={{ background: 'var(--p)' }}>{totalUnread}</span>
              )}
            </p>
            <button className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
              style={{ background: 'var(--bg)', border: '1px solid var(--bd)', color: 'var(--p)' }}>
              <Edit3 className="w-3.5 h-3.5" strokeWidth={1.7} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--t3)' }} strokeWidth={1.7} />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث في المحادثات…' : 'Search conversations…'}
              className="w-full h-8 pl-8 pr-3 rounded-xl text-[12px] outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--bd)', color: 'var(--t1)' }} />
          </div>
        </div>
        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="px-4 py-6 text-center text-[12px]" style={{ color: 'var(--t3)' }}>
              {lang === 'ar' ? 'Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø§Øªâ€¦' : 'Loading conversations...'}
            </div>
          )}
          {!loading && error && (
            <button onClick={() => void loadInbox()} className="w-full px-4 py-4 text-left text-[12px] font-semibold"
              style={{ color: '#ef4444', borderBottom: '1px solid var(--bd)' }}>
              {error} · Retry
            </button>
          )}
          {filtered.map(c => (
            <button key={c.id} onClick={() => { setSelected(String(c.id)); markRead(String(c.id)) }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-colors"
              style={{ background: selected === c.id ? 'var(--p2)' : 'transparent', borderBottom: '1px solid var(--bd)' }}
              onMouseEnter={e => { if (selected !== c.id) (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
              onMouseLeave={e => { if (selected !== c.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                style={{ background: c.member.color }}>
                {c.member.avatar
                  ? <img src={c.member.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  : c.member.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold truncate" style={{ color: selected === c.id ? 'var(--p)' : 'var(--t1)' }}>
                    {c.member.name}
                  </p>
                  <p className="text-[11px] shrink-0 ml-1" style={{ color: 'var(--t3)' }}>{c.lastTime}</p>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-[11px] truncate" style={{ color: 'var(--t3)' }}>{c.lastMessage}</p>
                  {c.unread > 0 && (
                    <span className="ml-1 shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                      style={{ background: 'var(--p)' }}>{c.unread}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right — chat thread */}
      {thread ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Thread header */}
          <div className="flex items-center gap-3 px-5 py-3.5 shrink-0"
            style={{ borderBottom: '1px solid var(--bd)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
              style={{ background: thread.member.color }}>
              {thread.member.avatar
                ? <img src={thread.member.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                : thread.member.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>{thread.member.name}</p>
              <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{thread.member.handle}</p>
            </div>
            <button className="p-1.5 rounded-lg cursor-pointer hover:opacity-60 transition-opacity" style={{ color: 'var(--t3)' }}>
              <MoreHorizontal className="w-4 h-4" strokeWidth={1.7} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {thread.messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.from === 'creator' ? 'justify-end' : 'justify-start'}`}>
                {msg.from === 'member' && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 mr-2 mt-0.5"
                    style={{ background: thread.member.color }}>
                    {thread.member.avatar
                      ? <img src={thread.member.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      : thread.member.initials[0]}
                  </div>
                )}
                <div className="max-w-[65%]">
                  <div className="px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed"
                    style={msg.from === 'creator'
                      ? { background: 'var(--p)', color: '#fff', borderBottomRightRadius: 4 }
                      : { background: 'var(--bg)', color: 'var(--t1)', border: '1px solid var(--bd)', borderBottomLeftRadius: 4 }}>
                    {msg.text}
                  </div>
                  <p className={`text-[11px] mt-1 ${msg.from === 'creator' ? 'text-right' : 'text-left'}`}
                    style={{ color: 'var(--t3)' }}>
                    {msg.time}{msg.from === 'creator' && <Check className="inline w-3 h-3 ml-1" strokeWidth={1.7} />}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 shrink-0" style={{ borderTop: '1px solid var(--bd)' }}>
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder={lang === 'ar' ? 'اكتب رسالة…' : 'Type a message…'}
                className="flex-1 h-10 px-4 rounded-xl text-[13px] outline-none"
                style={{ background: 'var(--bg)', border: '1.5px solid var(--bd)', color: 'var(--t1)', transition: 'border-color .15s' }}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--p)' }}
                onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = 'var(--bd)' }}
              />
              <button onClick={sendMessage}
                className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
                style={{ background: input.trim() ? 'var(--p)' : 'var(--bg)', color: input.trim() ? '#fff' : 'var(--t3)', border: '1px solid var(--bd)' }}>
                <Send className="w-4 h-4" strokeWidth={1.7} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <MessageSquare className="w-12 h-12 opacity-20" style={{ color: 'var(--t2)' }} strokeWidth={1.7} />
          <p className="text-[14px] font-medium" style={{ color: 'var(--t2)' }}>{lang === 'ar' ? 'اختر محادثة' : 'Select a conversation'}</p>
        </div>
      )}
    </div>
  )
}

// ─── Broadcasts view ──────────────────────────────────────────────────────────

function BroadcastsView({ lang }: { lang: string }) {
  const { selectedCommunityId } = useCreatorCommunity()
  const [broadcasts, setBroadcasts] = useState<DmBroadcast[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    if (!selectedCommunityId) return
    setLoading(true)
    setError('')
    try {
      const result = await dmBroadcastsApi.listBroadcasts(selectedCommunityId)
      setBroadcasts(result.broadcasts)
    } catch (err: any) {
      setError(err?.message || 'Failed to load broadcasts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [selectedCommunityId])

  const createAndSend = async () => {
    if (!selectedCommunityId || !body.trim()) return
    setSaving(true)
    setError('')
    try {
      const { broadcast } = await dmBroadcastsApi.createBroadcast({
        communityId: selectedCommunityId,
        title: title.trim() || undefined,
        body: body.trim(),
      })
      await dmBroadcastsApi.sendBroadcast(String(broadcast.id || broadcast._id), selectedCommunityId)
      setBody('')
      setTitle('')
      await load()
    } catch (err: any) {
      setError(err?.message || 'Failed to send broadcast')
    } finally {
      setSaving(false)
    }
  }

  if (!selectedCommunityId) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
        <p className="text-[14px] font-semibold" style={{ color: 'var(--t1)' }}>Select a community to manage broadcasts.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
        <p className="text-[15px] font-bold mb-3" style={{ color: 'var(--t1)' }}>{lang === 'ar' ? 'بث جديد' : 'New broadcast'}</p>
        <div className="space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={lang === 'ar' ? 'عنوان اختياري' : 'Optional title'}
            className="w-full h-10 px-3 rounded-xl text-[13px] outline-none" style={{ border: '1px solid var(--bd)', background: 'var(--bg)' }} />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4}
            placeholder={lang === 'ar' ? 'رسالة لجميع الأعضاء' : 'Message to all community members'}
            className="w-full px-3 py-2 rounded-xl text-[13px] outline-none resize-none" style={{ border: '1px solid var(--bd)', background: 'var(--bg)' }} />
          {error && <p className="text-[12px] text-red-500">{error}</p>}
          <button onClick={() => void createAndSend()} disabled={saving || !body.trim()}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-bold text-white disabled:opacity-50"
            style={{ background: 'var(--p)' }}>
            <Send className="w-4 h-4" />{saving ? (lang === 'ar' ? 'جاري الإرسال…' : 'Sending…') : (lang === 'ar' ? 'إرسال للجميع' : 'Send to all members')}
          </button>
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
        <p className="text-[15px] font-bold mb-4" style={{ color: 'var(--t1)' }}>{lang === 'ar' ? 'سجل البث' : 'Broadcast history'}</p>
        {loading ? (
          <p className="text-[13px]" style={{ color: 'var(--t3)' }}>Loading…</p>
        ) : broadcasts.length === 0 ? (
          <p className="text-[13px]" style={{ color: 'var(--t3)' }}>{lang === 'ar' ? 'لا توجد رسائل جماعية بعد' : 'No broadcasts yet.'}</p>
        ) : (
          <div className="space-y-3">
            {broadcasts.map((b) => (
              <div key={b.id || b._id} className="rounded-xl p-4" style={{ border: '1px solid var(--bd)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold" style={{ color: 'var(--t1)' }}>{b.title || 'Broadcast'}</p>
                    <p className="text-[12px] mt-1 line-clamp-2" style={{ color: 'var(--t2)' }}>{b.body}</p>
                  </div>
                  <span className="text-[11px] font-semibold uppercase" style={{ color: 'var(--p)' }}>{b.status}</span>
                </div>
                <p className="text-[11px] mt-2" style={{ color: 'var(--t3)' }}>
                  {b.sentCount}/{b.recipientCount} delivered
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AutomationsView({ lang }: { lang: string }) {
  const { selectedCommunityId } = useCreatorCommunity()
  const [automations, setAutomations] = useState<DmAutomation[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [trigger, setTrigger] = useState<'new_member' | 'inactive_7' | 'inactive_30'>('new_member')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    if (!selectedCommunityId) return
    setLoading(true)
    try {
      const result = await dmBroadcastsApi.listAutomations(selectedCommunityId)
      setAutomations(result.automations)
    } catch (err: any) {
      setError(err?.message || 'Failed to load automations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [selectedCommunityId])

  const createAutomation = async () => {
    if (!selectedCommunityId || !name.trim() || !body.trim()) return
    setSaving(true)
    setError('')
    try {
      await dmBroadcastsApi.createAutomation({
        communityId: selectedCommunityId,
        name: name.trim(),
        trigger,
        body: body.trim(),
      })
      setName('')
      setBody('')
      await load()
    } catch (err: any) {
      setError(err?.message || 'Failed to create automation')
    } finally {
      setSaving(false)
    }
  }

  if (!selectedCommunityId) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
        <p className="text-[14px] font-semibold" style={{ color: 'var(--t1)' }}>Select a community to manage automations.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
        <p className="text-[15px] font-bold mb-3" style={{ color: 'var(--t1)' }}>{lang === 'ar' ? 'أتمتة جديدة' : 'New automation'}</p>
        <div className="grid gap-3 md:grid-cols-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Automation name"
            className="h-10 px-3 rounded-xl text-[13px] outline-none" style={{ border: '1px solid var(--bd)', background: 'var(--bg)' }} />
          <select value={trigger} onChange={(e) => setTrigger(e.target.value as any)}
            className="h-10 px-3 rounded-xl text-[13px] outline-none" style={{ border: '1px solid var(--bd)', background: 'var(--bg)' }}>
            <option value="new_member">New member joins</option>
            <option value="inactive_7">Inactive 7 days</option>
            <option value="inactive_30">Inactive 30 days</option>
          </select>
        </div>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Automated DM message"
          className="w-full mt-3 px-3 py-2 rounded-xl text-[13px] outline-none resize-none" style={{ border: '1px solid var(--bd)', background: 'var(--bg)' }} />
        {error && <p className="text-[12px] text-red-500 mt-2">{error}</p>}
        <button onClick={() => void createAutomation()} disabled={saving || !name.trim() || !body.trim()}
          className="mt-3 inline-flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-bold text-white disabled:opacity-50"
          style={{ background: 'var(--p)' }}>
          <Plus className="w-4 h-4" />{saving ? 'Saving…' : 'Create automation'}
        </button>
      </div>

      <div className="grid gap-3">
        {loading ? (
          <p className="text-[13px]" style={{ color: 'var(--t3)' }}>Loading…</p>
        ) : automations.length === 0 ? (
          <p className="text-[13px]" style={{ color: 'var(--t3)' }}>No automations yet.</p>
        ) : automations.map((a) => (
          <div key={a.id || a._id} className="rounded-2xl p-4 flex items-start justify-between gap-4"
            style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
            <div>
              <p className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>{a.name}</p>
              <p className="text-[12px] mt-1" style={{ color: 'var(--t3)' }}>{a.trigger.replace('_', ' ')} · {a.triggeredCount} triggered</p>
              <p className="text-[12px] mt-2 line-clamp-2" style={{ color: 'var(--t2)' }}>{a.body}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => void dmBroadcastsApi.toggleAutomation(String(a.id || a._id), selectedCommunityId).then(load)}
                className="h-8 px-3 rounded-lg text-[12px] font-semibold" style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                {a.isActive ? 'Pause' : 'Activate'}
              </button>
              <button onClick={() => void dmBroadcastsApi.deleteAutomation(String(a.id || a._id), selectedCommunityId).then(load)}
                className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,.1)', color: '#ef4444' }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { lang } = useDashPrefs()
  const [view, setView] = useState<View>('conversations')

  const VIEWS: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'conversations', label: lang === 'ar' ? 'المحادثات'         : 'Conversations', icon: <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.7} /> },
    { id: 'broadcasts',    label: lang === 'ar' ? 'الرسائل الجماعية' : 'Broadcasts',    icon: <Megaphone     className="w-3.5 h-3.5" strokeWidth={1.7} /> },
    { id: 'automations',   label: lang === 'ar' ? 'الأتمتة'          : 'Automations',   icon: <Zap           className="w-3.5 h-3.5" strokeWidth={1.7} /> },
  ]

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:var(--p3);border-radius:10px}
      `}</style>
      <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
        <DashSidebar />
        <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar title="Messages" subtitle="Conversations, broadcasts and automated DMs" />

          <main id="main-content" className="p-7 flex-1 flex flex-col" style={{ animation: 'fadeUp .4s ease both' }}>
            {/* View toggle */}
            <div className="flex items-center gap-1 p-1 rounded-2xl mb-5 w-fit"
              style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
              {VIEWS.map(v => (
                <button key={v.id} onClick={() => setView(v.id)}
                  className="flex items-center gap-1.5 h-8 px-4 rounded-xl text-[12px] font-semibold cursor-pointer transition-all"
                  style={view === v.id ? { background: 'var(--p)', color: '#fff' } : { color: 'var(--t3)' }}>
                  {v.icon}
                  {v.label}
                </button>
              ))}
            </div>

            {view === 'conversations' && <ConversationsView lang={lang} />}
            {view === 'broadcasts'    && <BroadcastsView lang={lang} />}
            {view === 'automations'   && <AutomationsView lang={lang} />}
          </main>
        </div>
      </div>
    </>
  )
}
