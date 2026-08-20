'use client'

import { useEffect, useRef, useState } from 'react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import {
  Search, Send, Users, UserCheck, UserX, Star, Zap, BookOpen,
  Trophy, Plus, Check, Clock, MoreHorizontal, X, ChevronDown,
  MessageSquare, Megaphone, Settings2, Edit3, Trash2, Play, Pause,
  UserPlus, ShoppingCart,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type View = 'conversations' | 'broadcasts' | 'automations'

interface Message { id: number; from: 'creator' | 'member'; text: string; time: string }

interface Conversation {
  id: number
  member: { name: string; initials: string; color: string; handle: string }
  lastMessage: string
  lastTime: string
  unread: number
  messages: Message[]
}

interface BroadcastRecord {
  id: number; segment: string; message: string; sent: number; time: string; status: 'delivered' | 'sending'
}

interface AutoRule {
  id: number; trigger: string; triggerLabel: string; description: string
  message: string; active: boolean; sent: number; icon: React.ReactNode
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const INIT_CONVERSATIONS: Conversation[] = [
  {
    id: 1,
    member: { name: 'Aymen Khaled', initials: 'AK', color: '#7c3aed', handle: '@aymenk' },
    lastMessage: 'When does the next live session start?',
    lastTime: '2:30 PM',
    unread: 2,
    messages: [
      { id: 1, from: 'member',  text: 'Hey! I just joined Motion Masters 🎉', time: '2:00 PM' },
      { id: 2, from: 'creator', text: 'Welcome Aymen! So glad to have you here 🙌', time: '2:05 PM' },
      { id: 3, from: 'member',  text: 'Thank you! Quick question — when does the next live session start?', time: '2:30 PM' },
      { id: 4, from: 'member',  text: 'When does the next live session start?', time: '2:30 PM' },
    ],
  },
  {
    id: 2,
    member: { name: 'Sana Ben Ali', initials: 'SB', color: '#db2777', handle: '@sanaba' },
    lastMessage: 'The course material is amazing, thank you!',
    lastTime: '11:00 AM',
    unread: 0,
    messages: [
      { id: 1, from: 'creator', text: 'Hi Sana! How are you finding the course so far?', time: '10:45 AM' },
      { id: 2, from: 'member',  text: 'The course material is amazing, thank you!', time: '11:00 AM' },
      { id: 3, from: 'creator', text: "I'm really glad! Let me know if you have any questions 😊", time: '11:02 AM' },
    ],
  },
  {
    id: 3,
    member: { name: 'Rami Chaabane', initials: 'RC', color: '#0891b2', handle: '@rami_c' },
    lastMessage: 'I have a question about my subscription',
    lastTime: 'Yesterday',
    unread: 1,
    messages: [
      { id: 1, from: 'member', text: 'Hello, I have a question about my subscription', time: 'Yesterday 4:00 PM' },
      { id: 2, from: 'member', text: 'I was charged twice this month', time: 'Yesterday 4:01 PM' },
    ],
  },
  {
    id: 4,
    member: { name: 'Leila Mansouri', initials: 'LM', color: '#d97706', handle: '@leilam' },
    lastMessage: 'Is there a way to download the videos offline?',
    lastTime: 'Yesterday',
    unread: 0,
    messages: [
      { id: 1, from: 'creator', text: 'Hi Leila! Welcome to the community 👋', time: 'Mon 9:00 AM' },
      { id: 2, from: 'member',  text: 'Thanks! Is there a way to download the videos offline?', time: 'Yesterday 6:30 PM' },
    ],
  },
  {
    id: 5,
    member: { name: 'Mohamed Trabelsi', initials: 'MT', color: '#16a34a', handle: '@motrabl' },
    lastMessage: 'Completed the 30-day challenge! 💪',
    lastTime: 'Monday',
    unread: 0,
    messages: [
      { id: 1, from: 'member',  text: 'Completed the 30-day challenge! 💪', time: 'Monday 8:00 AM' },
      { id: 2, from: 'creator', text: 'Amazing work Mohamed! That takes real dedication 🏆', time: 'Monday 9:30 AM' },
      { id: 3, from: 'member',  text: 'Thank you! Starting the advanced course next', time: 'Monday 9:45 AM' },
    ],
  },
  {
    id: 6,
    member: { name: 'Nour Hamdi', initials: 'NH', color: '#6366f1', handle: '@nourh' },
    lastMessage: 'Can I join two communities at once?',
    lastTime: 'Sunday',
    unread: 0,
    messages: [
      { id: 1, from: 'member',  text: 'Hi! Quick question — can I join two communities at once?', time: 'Sunday 3:00 PM' },
      { id: 2, from: 'creator', text: 'Yes absolutely! Each community has its own subscription 😊', time: 'Sunday 4:00 PM' },
    ],
  },
]

const INIT_BROADCASTS: BroadcastRecord[] = [
  { id: 1, segment: 'All Members',    message: '🚀 Exciting news! Our new advanced course is live. Enroll now with 20% off.', sent: 1298, time: 'Apr 1, 2026',    status: 'delivered' },
  { id: 2, segment: 'Inactive (30d)', message: '👋 We miss you! Come back and see what\'s new in the community this month.', sent: 312,  time: 'Mar 20, 2026',  status: 'delivered' },
  { id: 3, segment: 'New Members',    message: '🎉 Welcome to Motion Masters! Here are 3 things to do first to get started.', sent: 89,   time: 'Mar 15, 2026',  status: 'delivered' },
  { id: 4, segment: 'Top Members',    message: '⭐ You\'re one of our most engaged members! Here\'s an exclusive early access offer.', sent: 45,   time: 'Mar 10, 2026',  status: 'delivered' },
]

const INIT_AUTOMATIONS: AutoRule[] = [
  {
    id: 1, trigger: 'new_member', triggerLabel: 'New Member Joins',
    description: 'Sent automatically when someone joins your community',
    message: 'Welcome to Motion Masters! 🎉 We\'re so excited to have you here. Start with the fundamentals course and join our weekly live sessions. Any questions? Reply anytime!',
    active: true, sent: 1298,
    icon: <UserPlus className="w-4 h-4" strokeWidth={1.7} />,
  },
  {
    id: 2, trigger: 'course_complete', triggerLabel: 'Course Completed',
    description: 'Sent when a member finishes any course',
    message: 'Congrats on completing the course! 🏆 Your dedication is inspiring. Here\'s what I recommend as your next step...',
    active: true, sent: 342,
    icon: <BookOpen className="w-4 h-4" strokeWidth={1.7} />,
  },
  {
    id: 3, trigger: 'challenge_complete', triggerLabel: 'Challenge Completed',
    description: 'Sent when a member finishes a challenge',
    message: 'You did it! 💪 Completing a challenge takes real commitment. You should be proud. Ready for the next one?',
    active: true, sent: 218,
    icon: <Trophy className="w-4 h-4" strokeWidth={1.7} />,
  },
  {
    id: 4, trigger: 'purchase', triggerLabel: 'New Purchase',
    description: 'Sent after any purchase or enrollment',
    message: 'Thank you for your purchase! 🙏 Here\'s everything you need to get started. Feel free to reply with any questions.',
    active: true, sent: 567,
    icon: <ShoppingCart className="w-4 h-4" strokeWidth={1.7} />,
  },
  {
    id: 5, trigger: 'inactive_7d', triggerLabel: 'Inactive 7 Days',
    description: 'Sent after 7 days of inactivity',
    message: 'Hey! Haven\'t seen you around in a while 👋 We just dropped new content you might love. Come check it out!',
    active: false, sent: 89,
    icon: <Clock className="w-4 h-4" strokeWidth={1.7} />,
  },
  {
    id: 6, trigger: 'inactive_30d', triggerLabel: 'Inactive 30 Days',
    description: 'Win-back message after 30 days of inactivity',
    message: 'We miss you! 😢 It\'s been a month since your last visit. Here\'s a special offer to welcome you back...',
    active: false, sent: 34,
    icon: <UserX className="w-4 h-4" strokeWidth={1.7} />,
  },
]

const SEGMENTS = [
  { id: 'all',      label: 'All Members',    sub: '1,298 members', icon: <Users      className="w-4 h-4" strokeWidth={1.7} />, color: 'var(--p)'      },
  { id: 'new',      label: 'New Members',    sub: 'Joined last 30d', icon: <UserPlus  className="w-4 h-4" strokeWidth={1.7} />, color: 'var(--cyan)'   },
  { id: 'inactive', label: 'Inactive',       sub: 'No activity 30d+', icon: <UserX   className="w-4 h-4" strokeWidth={1.7} />, color: 'var(--orange)' },
  { id: 'top',      label: 'Top Members',    sub: 'Most engaged',   icon: <Star      className="w-4 h-4" strokeWidth={1.7} />, color: '#d97706'       },
  { id: 'enrolled', label: 'Enrolled Only',  sub: 'Paid members',   icon: <UserCheck className="w-4 h-4" strokeWidth={1.7} />, color: '#16a34a'       },
]

// ─── Auto-save helper ─────────────────────────────────────────────────────────

function useLocalList<T>(key: string, init: T[]): [T[], React.Dispatch<React.SetStateAction<T[]>>] {
  const [list, setList] = useState<T[]>(() => {
    if (typeof window === 'undefined') return init
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : init } catch { return init }
  })
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(list)) } catch { /**/ } }, [key, list])
  return [list, setList]
}

// ─── Conversation panel ────────────────────────────────────────────────────────

function ConversationsView({ lang }: { lang: string }) {
  const [convs, setConvs]     = useLocalList('chabaq_msgs', INIT_CONVERSATIONS)
  const [selected, setSelected] = useState<number>(convs[0]?.id ?? 0)
  const [query, setQuery]       = useState('')
  const [input, setInput]       = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const thread = convs.find(c => c.id === selected)
  const filtered = convs.filter(c =>
    c.member.name.toLowerCase().includes(query.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(query.toLowerCase())
  )

  const sendMessage = () => {
    if (!input.trim() || !thread) return
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const newMsg: Message = { id: Date.now(), from: 'creator', text: input.trim(), time: now }
    setConvs(prev => prev.map(c =>
      c.id === selected
        ? { ...c, messages: [...c.messages, newMsg], lastMessage: input.trim(), lastTime: 'Now', unread: 0 }
        : c
    ))
    setInput('')
  }

  const markRead = (id: number) => {
    setConvs(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c))
  }

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
          {filtered.map(c => (
            <button key={c.id} onClick={() => { setSelected(c.id); markRead(c.id) }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-colors"
              style={{ background: selected === c.id ? 'var(--p2)' : 'transparent', borderBottom: '1px solid var(--bd)' }}
              onMouseEnter={e => { if (selected !== c.id) (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
              onMouseLeave={e => { if (selected !== c.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                style={{ background: c.member.color }}>
                {c.member.initials}
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
              {thread.member.initials}
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
                    {thread.member.initials[0]}
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
  const [broadcasts, setBroadcasts] = useLocalList('chabaq_bcasts', INIT_BROADCASTS)
  const [segment, setSegment]       = useState('all')
  const [message, setMessage]       = useState('')
  const [sending, setSending]       = useState(false)
  const [sent, setSent]             = useState(false)

  const seg = SEGMENTS.find(s => s.id === segment)!

  const sendBroadcast = () => {
    if (!message.trim()) return
    setSending(true)
    setTimeout(() => {
      const segCount: Record<string, number> = { all: 1298, new: 89, inactive: 312, top: 45, enrolled: 867 }
      const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      setBroadcasts(prev => [{
        id: Date.now(), segment: seg.label,
        message: message.trim(), sent: segCount[segment] ?? 100, time: now, status: 'delivered',
      }, ...prev])
      setMessage('')
      setSending(false)
      setSent(true)
      setTimeout(() => setSent(false), 3000)
    }, 1800)
  }

  return (
    <div className="space-y-5">
      {/* Segment selector */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
        <p className="text-[13px] font-bold mb-4" style={{ color: 'var(--t1)' }}>{lang === 'ar' ? 'الجمهور المستهدف' : 'Target Audience'}</p>
        <div className="grid grid-cols-5 gap-3">
          {SEGMENTS.map(s => (
            <button key={s.id} onClick={() => setSegment(s.id)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer transition-all"
              style={{
                border: `1.5px solid ${segment === s.id ? s.color : 'var(--bd)'}`,
                background: segment === s.id ? s.color + '10' : 'var(--bg)',
              }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: segment === s.id ? s.color + '20' : 'var(--white)', color: s.color }}>
                {s.icon}
              </div>
              <div className="text-center">
                <p className="text-[11px] font-semibold" style={{ color: segment === s.id ? s.color : 'var(--t1)' }}>{s.label}</p>
                <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{s.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Compose */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-bold" style={{ color: 'var(--t1)' }}>{lang === 'ar' ? 'الرسالة' : 'Message'}</p>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: seg.color + '15', color: seg.color }}>
            → {seg.label} · {seg.sub}
          </span>
        </div>
        <textarea
          value={message} onChange={e => setMessage(e.target.value)}
          placeholder={lang === 'ar' ? 'اكتب رسالتك للأعضاء…' : 'Write your message to members…'}
          rows={4}
          className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none"
          style={{ background: 'var(--bg)', border: '1.5px solid var(--bd)', color: 'var(--t1)', transition: 'border-color .15s' }}
          onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--p)' }}
          onBlur={e  => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--bd)' }}
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{message.length} characters</p>
          <button onClick={sendBroadcast} disabled={!message.trim() || sending}
            className="flex items-center gap-2 px-5 h-9 rounded-xl text-[12px] font-semibold cursor-pointer transition-all hover:opacity-85"
            style={{
              background: sent ? '#16a34a' : 'var(--p)', color: '#fff',
              opacity: (!message.trim() || sending) ? .5 : 1,
              cursor: (!message.trim() || sending) ? 'not-allowed' : 'pointer',
            }}>
            {sent
              ? <><Check className="w-3.5 h-3.5" strokeWidth={1.7} /> {lang === 'ar' ? 'تم الإرسال!' : 'Sent!'}</>
              : sending
              ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> {lang === 'ar' ? 'جاري الإرسال…' : 'Sending…'}</>
              : <><Megaphone className="w-3.5 h-3.5" strokeWidth={1.7} /> {lang === 'ar' ? 'إرسال رسالة جماعية' : 'Send Broadcast'}</>
            }
          </button>
        </div>
      </div>

      {/* History */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--bd)' }}>
          <p className="text-[13px] font-bold" style={{ color: 'var(--t1)' }}>{lang === 'ar' ? 'سجل الرسائل الجماعية' : 'Broadcast History'}</p>
        </div>
        {broadcasts.map((b, i) => (
          <div key={b.id} className="flex items-start gap-4 px-5 py-4"
            style={{ borderBottom: i < broadcasts.length - 1 ? '1px solid var(--bd)' : 'none' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: 'var(--p2)' }}>
              <Megaphone className="w-4 h-4" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] leading-relaxed truncate" style={{ color: 'var(--t1)' }}>{b.message}</p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--t3)' }}>→ {b.segment}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[12px] font-bold" style={{ color: 'var(--p)' }}>{b.sent.toLocaleString()}</p>
              <p className="text-[11px]" style={{ color: 'var(--t3)' }}>sent · {b.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Automations view ─────────────────────────────────────────────────────────

interface AutoDraft { trigger: string; message: string; delay: string }

function AutomationsView({ lang }: { lang: string }) {
  const [rules, setRules] = useLocalList<AutoRule>('chabaq_auto_msgs', INIT_AUTOMATIONS)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [draft, setDraft] = useState<AutoDraft>({ trigger: 'new_member', message: '', delay: 'immediate' })

  const TRIGGER_OPTS = [
    { id: 'new_member',         label: 'New Member Joins',     icon: <UserPlus    className="w-3.5 h-3.5" strokeWidth={1.7} /> },
    { id: 'course_complete',    label: 'Course Completed',     icon: <BookOpen    className="w-3.5 h-3.5" strokeWidth={1.7} /> },
    { id: 'challenge_complete', label: 'Challenge Completed',  icon: <Trophy      className="w-3.5 h-3.5" strokeWidth={1.7} /> },
    { id: 'purchase',           label: 'New Purchase',         icon: <ShoppingCart className="w-3.5 h-3.5" strokeWidth={1.7} /> },
    { id: 'inactive_7d',        label: 'Inactive 7 Days',      icon: <Clock       className="w-3.5 h-3.5" strokeWidth={1.7} /> },
    { id: 'inactive_30d',       label: 'Inactive 30 Days',     icon: <UserX       className="w-3.5 h-3.5" strokeWidth={1.7} /> },
  ]

  const DELAY_OPTS = [
    { id: 'immediate', label: 'Immediately' },
    { id: '5m',        label: 'After 5 min' },
    { id: '1h',        label: 'After 1 hour' },
    { id: '1d',        label: 'After 1 day'  },
  ]

  const saveRule = () => {
    if (!draft.message.trim()) return
    const trig = TRIGGER_OPTS.find(t => t.id === draft.trigger)!
    const newRule: AutoRule = {
      id: Date.now(), trigger: draft.trigger, triggerLabel: trig.label,
      description: '', message: draft.message, active: true, sent: 0, icon: trig.icon,
    }
    setRules(prev => [...prev, newRule])
    setDraft({ trigger: 'new_member', message: '', delay: 'immediate' })
    setDrawerOpen(false)
  }

  const toggleRule = (id: number) => setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r))
  const deleteRule = (id: number) => setRules(prev => prev.filter(r => r.id !== id))

  const active = rules.filter(r => r.active).length

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center gap-4 mb-5">
        <div className="rounded-2xl px-5 py-3.5 flex items-center gap-3" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
          <Zap className="w-4 h-4" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
          <div>
            <p className="text-[18px] font-bold" style={{ color: 'var(--t1)' }}>{rules.length}</p>
            <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{lang === 'ar' ? 'إجمالي القواعد' : 'Total Rules'}</p>
          </div>
        </div>
        <div className="rounded-2xl px-5 py-3.5 flex items-center gap-3" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
          <Play className="w-4 h-4" style={{ color: '#16a34a' }} strokeWidth={1.7} />
          <div>
            <p className="text-[18px] font-bold" style={{ color: 'var(--t1)' }}>{active}</p>
            <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{lang === 'ar' ? 'نشطة' : 'Active'}</p>
          </div>
        </div>
        <div className="rounded-2xl px-5 py-3.5 flex items-center gap-3" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
          <Send className="w-4 h-4" style={{ color: 'var(--cyan)' }} strokeWidth={1.7} />
          <div>
            <p className="text-[18px] font-bold" style={{ color: 'var(--t1)' }}>
              {rules.reduce((s, r) => s + r.sent, 0).toLocaleString()}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{lang === 'ar' ? 'إجمالي المرسلة' : 'Total Sent'}</p>
          </div>
        </div>
        <button onClick={() => setDrawerOpen(true)}
          className="ml-auto flex items-center gap-2 px-4 h-10 rounded-xl text-[13px] font-semibold cursor-pointer transition-opacity hover:opacity-85"
          style={{ background: 'var(--p)', color: '#fff' }}>
          <Plus className="w-4 h-4" strokeWidth={1.7} />
          {lang === 'ar' ? 'أتمتة جديدة' : 'New Automation'}
        </button>
      </div>

      {/* Rules list */}
      <div className="space-y-3">
        {rules.map(rule => (
          <div key={rule.id} className="rounded-2xl p-4"
            style={{ background: 'var(--white)', border: `1.5px solid ${rule.active ? 'var(--bd)' : 'var(--bd)'}`, opacity: rule.active ? 1 : .7 }}>
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: rule.active ? 'var(--p2)' : 'var(--bg)', color: rule.active ? 'var(--p)' : 'var(--t3)' }}>
                {rule.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>{rule.triggerLabel}</p>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                    style={rule.active
                      ? { background: 'rgba(74,222,128,.12)', color: '#16a34a' }
                      : { background: 'var(--bg)',            color: 'var(--t3)' }}>
                    {rule.active ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'متوقف' : 'Paused')}
                  </span>
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: 'var(--t2)', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' as const }}>
                  &ldquo;{rule.message}&rdquo;
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[14px] font-bold" style={{ color: 'var(--p)' }}>{rule.sent.toLocaleString()}</p>
                <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{lang === 'ar' ? 'رسالة مرسلة' : 'messages sent'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--bd)' }}>
              <button onClick={() => toggleRule(rule.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold cursor-pointer transition-all hover:opacity-80"
                style={rule.active
                  ? { background: 'rgba(239,68,68,.08)', color: '#ef4444' }
                  : { background: 'rgba(74,222,128,.1)',  color: '#16a34a' }}>
                {rule.active
                  ? <><Pause className="w-3 h-3" strokeWidth={1.7} /> {lang === 'ar' ? 'إيقاف مؤقت' : 'Pause'}</>
                  : <><Play className="w-3 h-3" strokeWidth={1.7} /> {lang === 'ar' ? 'تفعيل' : 'Activate'}</>}
              </button>
              <button onClick={() => deleteRule(rule.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold cursor-pointer transition-all hover:opacity-80 ml-auto"
                style={{ background: 'var(--bg)', color: 'var(--t3)', border: '1px solid var(--bd)' }}>
                <Trash2 className="w-3 h-3" strokeWidth={1.7} /> {lang === 'ar' ? 'حذف' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setDrawerOpen(false) }}>
          <div className="w-full max-w-[500px] rounded-2xl"
            style={{ background: 'var(--white)', border: '1px solid var(--bd)', boxShadow: '0 24px 80px rgba(0,0,0,.2)' }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: '1px solid var(--bd)' }}>
              <p className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>{lang === 'ar' ? 'أتمتة جديدة' : 'New Automation'}</p>
              <button onClick={() => setDrawerOpen(false)} className="cursor-pointer hover:opacity-60" style={{ color: 'var(--t3)' }}>
                <X className="w-4 h-4" strokeWidth={1.7} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              {/* Trigger */}
              <div>
                <label className="block text-[12px] font-medium mb-2" style={{ color: 'var(--t2)' }}>{lang === 'ar' ? 'حدث التشغيل' : 'Trigger Event'}</label>
                <div className="grid grid-cols-2 gap-2">
                  {TRIGGER_OPTS.map(t => (
                    <button key={t.id} onClick={() => setDraft(d => ({ ...d, trigger: t.id }))}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-medium cursor-pointer text-left transition-all"
                      style={{
                        border: `1.5px solid ${draft.trigger === t.id ? 'var(--p)' : 'var(--bd)'}`,
                        background: draft.trigger === t.id ? 'var(--p2)' : 'var(--bg)',
                        color: draft.trigger === t.id ? 'var(--p)' : 'var(--t1)',
                      }}>
                      <span style={{ color: draft.trigger === t.id ? 'var(--p)' : 'var(--t3)' }}>{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Delay */}
              <div>
                <label className="block text-[12px] font-medium mb-2" style={{ color: 'var(--t2)' }}>{lang === 'ar' ? 'وقت الإرسال' : 'Send'}</label>
                <div className="flex gap-2">
                  {DELAY_OPTS.map(d => (
                    <button key={d.id} onClick={() => setDraft(prev => ({ ...prev, delay: d.id }))}
                      className="flex-1 px-2 py-2 rounded-xl text-[11px] font-semibold cursor-pointer transition-all"
                      style={draft.delay === d.id
                        ? { background: 'var(--p)', color: '#fff' }
                        : { background: 'var(--bg)', color: 'var(--t2)', border: '1px solid var(--bd)' }}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Message */}
              <div>
                <label className="block text-[12px] font-medium mb-2" style={{ color: 'var(--t2)' }}>{lang === 'ar' ? 'الرسالة' : 'Message'}</label>
                <textarea value={draft.message} onChange={e => setDraft(d => ({ ...d, message: e.target.value }))}
                  rows={3} placeholder={lang === 'ar' ? 'اكتب الرسالة الآلية…' : 'Write the automated message…'}
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none"
                  style={{ background: 'var(--bg)', border: '1.5px solid var(--bd)', color: 'var(--t1)', transition: 'border-color .15s' }}
                  onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--p)' }}
                  onBlur={e  => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--bd)' }} />
              </div>
            </div>
            <div className="px-5 pb-5 flex justify-end gap-3">
              <button onClick={() => setDrawerOpen(false)}
                className="px-4 h-9 rounded-xl text-[12px] font-medium cursor-pointer hover:opacity-60"
                style={{ color: 'var(--t2)' }}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={saveRule} disabled={!draft.message.trim()}
                className="px-5 h-9 rounded-xl text-[12px] font-semibold cursor-pointer transition-opacity hover:opacity-85"
                style={{ background: 'var(--p)', color: '#fff', opacity: draft.message.trim() ? 1 : .5 }}>
                {lang === 'ar' ? 'حفظ الأتمتة' : 'Save Automation'}
              </button>
            </div>
          </div>
        </div>
      )}
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
