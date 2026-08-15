'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import {
  MessageSquare, BookOpen, Zap, Calendar, ShoppingBag,
  UserCheck, Users, Trophy, Info, Search, Bell,
  MessageCircle, Hash, CheckCircle2, Circle,
  X, Send, Paperclip, Smile, ChevronLeft,
  Maximize2, MoreHorizontal,
} from 'lucide-react'
import type { CommunityData, CommunityTab } from '@/lib/community-data'

interface Props {
  community: CommunityData
  locale: string
  children: React.ReactNode
}

interface Notification {
  id: string
  avatar: string
  avatarColor: string
  name: string
  type: 'new_post' | 'broadcast' | 'following' | 'mention' | 'like'
  preview: string
  time: string
  unread: boolean
}

interface ChatUser {
  id: string
  name: string
  avatar: string
  avatarColor: string
  lastMessage: string
  time: string
  online: boolean
  unread: boolean
}

interface ChatMessage {
  id: string
  text: string
  sender: 'them' | 'me'
  time: string
  date?: string
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', avatar: 'AB', avatarColor: '#6c52f0', name: 'Ahmed Ben Ali', type: 'broadcast', preview: 'AIOS replaced 78% of this clients work (see how here)', time: '1d', unread: true },
  { id: '2', avatar: 'TG', avatarColor: '#3b82f6', name: 'Terrell Gentry', type: 'broadcast', preview: 'how to build a second brain for your business with ...', time: '2d', unread: true },
  { id: '3', avatar: 'AE', avatarColor: '#10b981', name: 'Alaa Elhefnawy', type: 'following', preview: 'إنت شغلك إيه؟ 👋', time: '2d', unread: true },
  { id: '4', avatar: 'AE', avatarColor: '#10b981', name: 'Alaa Elhefnawy', type: 'following', preview: 'ثبات الشخصية.. الحل للمشكلة اللي 3 مشتركين سألوا عنها', time: '3d', unread: false },
  { id: '5', avatar: 'LO', avatarColor: '#f59e0b', name: 'Liam Ottley', type: 'following', preview: "What's your biggest question about running AI Audits?", time: '3d', unread: false },
]

const MOCK_CHATS: ChatUser[] = [
  { id: '1', name: 'Alaa Elhefnawy', avatar: 'AE', avatarColor: '#10b981', lastMessage: '!أهلا Wyssem 👋 ...عملية، وتقدر تصلحها في ثواني', time: '5d', online: true, unread: true },
  { id: '2', name: 'Ufuk Ekici', avatar: 'UE', avatarColor: '#94a3b8', lastMessage: 'Hey Wyssem, welcome to AI Video Generator! ✅ Start...', time: '9d', online: false, unread: false },
  { id: '3', name: 'Money Lab', avatar: 'ML', avatarColor: '#a855f7', lastMessage: '01055617399 💭 ...بعت كلمة تفاصيل على الرقم ده و هيوصلك', time: 'Mar 20', online: false, unread: false },
  { id: '4', name: 'Terrell Gentry', avatar: 'TG', avatarColor: '#3b82f6', lastMessage: 'Helloo', time: 'Mar 9', online: false, unread: false },
]

const MOCK_CONVERSATION: ChatMessage[] = [
  { id: '1', text: 'في الصفحة فوق ، و ابدأ الكورسات بالترتيب', sender: 'them', time: '2:38pm' },
  { id: '2', text: 'و لو عندك أي اسئلة اكتبلنا على الكميونيتي و هنجاوبك 😊', sender: 'them', time: '2:38pm' },
  { id: '3', text: 'آلاء', sender: 'them', time: '2:38pm', date: 'Aug 10th 2026' },
  { id: '4', text: '!أهلا Wyssem 👋', sender: 'them', time: '2:40pm' },
  { id: '5', text: 'بس حبيت أنبهك بسرعة إن آخر دفعة لاشتراكك في الكميونيتي ما تمت', sender: 'them', time: '2:40pm' },
  { id: '6', text: 'غالبًا بتكون حاجة بسيطة زي إن الكارت انتهى أو البنك موقف العملية، وتقدر تصلحها في ثواني من إعدادات الاشتراك', sender: 'them', time: '2:40pm' },
]

const SIDEBAR_NAV: { id: CommunityTab; label: string; labelAr: string; Icon: React.ElementType }[] = [
  { id: 'feed',       label: 'Feed',        labelAr: 'المنشورات', Icon: MessageSquare },
  { id: 'courses',    label: 'Courses',     labelAr: 'الدورات',   Icon: BookOpen },
  { id: 'events',     label: 'Events',      labelAr: 'الفعاليات', Icon: Calendar },
  { id: 'sessions',   label: 'Sessions',    labelAr: 'الجلسات',   Icon: UserCheck },
  { id: 'challenges', label: 'Challenges',  labelAr: 'التحديات',  Icon: Zap },
  { id: 'products',   label: 'Products',    labelAr: 'المنتجات',  Icon: ShoppingBag },
]

export function CommunityLayoutClient({ community, locale, children }: Props) {
  const pathname = usePathname()
  const isAr = locale === 'ar'

  const [notifOpen, setNotifOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [activeChat, setActiveChat] = useState<ChatUser | null>(null)
  const [chatMsg, setChatMsg] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [chatSearchQuery, setChatSearchQuery] = useState('')
  const notifRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (chatRef.current && !chatRef.current.contains(e.target as Node) && !activeChat) setChatOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [activeChat])

  function tabHref(id: CommunityTab | 'saved') {
    const base = `/communities/${community.slug}`
    if (id === 'feed') return base
    if (id === 'saved') return `${base}?tab=saved`
    return `${base}/${id}`
  }

  function activeTab(): CommunityTab | 'channels' {
    if (pathname.includes('/channels/')) return 'channels' as any
    const last = pathname.split('/').at(-1) as CommunityTab
    const subs: CommunityTab[] = ['courses','challenges','sessions','products','events','reviews','progress','members']
    return subs.includes(last) ? last : 'feed'
  }

  const active = activeTab()
  const visibleNav = SIDEBAR_NAV.filter(n => community.tabs.includes(n.id))
  const unreadNotifs = MOCK_NOTIFICATIONS.filter(n => n.unread).length
  const unreadChats = MOCK_CHATS.filter(c => c.unread).length

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>

      {/* ── TOP BAR ──────────────────────────────── */}
      <header className="sticky top-0 z-50" style={{ background: '#fff', borderBottom: '1px solid #e8e8e8' }}>
        <div className="max-w-[1200px] mx-auto px-6 flex items-center h-[56px] gap-6">

          <Link href={tabHref('feed')} className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-[10px]"
              style={{ background: community.avatarColor }}>
              {community.avatarInitials}
            </div>
            <span className="font-bold text-[16px] text-gray-900 hidden sm:block">
              {isAr ? community.nameAr : community.name}
            </span>
          </Link>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative" ref={searchRef}>
              <button onClick={() => { setSearchOpen(v => !v); setNotifOpen(false); setChatOpen(false) }}
                className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-400">
                <Search className="w-[19px] h-[19px]" strokeWidth={1.7} />
              </button>
              {searchOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-[340px] rounded-2xl overflow-hidden"
                  style={{ background: '#fff', boxShadow: '0 20px 60px rgba(26,23,48,.14), 0 0 0 1px rgba(0,0,0,.06)', animation: 'ckSlide .2s ease both' }}>
                  <div className="p-4">
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: '#f5f5f5' }}>
                      <Search className="w-4 h-4 text-gray-400" strokeWidth={1.7} />
                      <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        placeholder={isAr ? 'ابحث في المجتمع...' : 'Search community...'}
                        className="text-[13px] bg-transparent outline-none flex-1 text-gray-700 placeholder:text-gray-400"
                        autoFocus />
                    </div>
                    {searchQuery ? (
                      <div className="mt-3 py-2">
                        <p className="text-[12px] text-gray-400 px-1">
                          {isAr ? `نتائج البحث عن "${searchQuery}"...` : `Searching for "${searchQuery}"...`}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 py-4 text-center">
                        <Search className="w-8 h-8 mx-auto mb-2 text-gray-200" strokeWidth={1.3} />
                        <p className="text-[12px] text-gray-400">{isAr ? 'ابحث عن منشورات، أعضاء، دورات...' : 'Search posts, members, courses...'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(v => !v); setChatOpen(false); setActiveChat(null) }}
                className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500">
                <Bell className="w-[20px] h-[20px]" strokeWidth={1.7} />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {unreadNotifs}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-[380px] rounded-2xl overflow-hidden"
                  style={{ background: '#fff', boxShadow: '0 20px 60px rgba(26,23,48,.14), 0 0 0 1px rgba(0,0,0,.06)', animation: 'ckSlide .2s ease both' }}>
                  <style>{`@keyframes ckSlide { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
                    @keyframes ckCenter { from { opacity:0; transform:translate(-50%,-50%) scale(.96) } to { opacity:1; transform:translate(-50%,-50%) scale(1) } }`}</style>

                  <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <h3 className="text-[15px] font-bold text-gray-900">Notifications</h3>
                    <div className="flex items-center gap-3">
                      <button className="text-[12px] font-medium" style={{ color: '#8e78fb' }}>Mark all as read</button>
                      <select className="text-[12px] text-gray-500 bg-transparent outline-none cursor-pointer">
                        <option>All</option>
                        <option>Unread</option>
                      </select>
                    </div>
                  </div>

                  <div className="max-h-[420px] overflow-y-auto">
                    {MOCK_NOTIFICATIONS.map(n => (
                      <div key={n.id}
                        className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer"
                        style={{ background: n.unread ? '#faf8ff' : 'transparent' }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-[11px] flex-shrink-0"
                          style={{ background: n.avatarColor }}>
                          {n.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-gray-800 leading-snug">
                            <span className="font-semibold">{n.name}</span>
                            <span className="text-gray-400 ml-1">({n.type === 'broadcast' ? 'broadcast' : 'following'}) new post</span>
                            <span className="text-gray-400 ml-1">· {n.time}</span>
                          </p>
                          <p className="text-[12px] text-gray-500 mt-0.5 truncate">{n.preview}</p>
                        </div>
                        {n.unread && <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: '#8e78fb' }} />}
                      </div>
                    ))}
                  </div>

                  <div className="px-5 py-3 text-center" style={{ borderTop: '1px solid #f0f0f0' }}>
                    <button className="text-[12px] font-medium" style={{ color: '#8e78fb' }}>View all notifications</button>
                  </div>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="relative" ref={chatRef}>
              <button
                onClick={() => { setChatOpen(v => !v); setNotifOpen(false); if (activeChat) setActiveChat(null) }}
                className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500">
                <MessageCircle className="w-[20px] h-[20px]" strokeWidth={1.7} />
                {unreadChats > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {unreadChats}
                  </span>
                )}
              </button>

              {/* Chat list dropdown */}
              {chatOpen && !activeChat && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-[380px] rounded-2xl overflow-hidden"
                  style={{ background: '#fff', boxShadow: '0 20px 60px rgba(26,23,48,.14), 0 0 0 1px rgba(0,0,0,.06)', animation: 'ckSlide .2s ease both' }}>

                  <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <h3 className="text-[15px] font-bold text-gray-900">Chats</h3>
                    <div className="flex items-center gap-3">
                      <button className="text-[12px] font-medium" style={{ color: '#8e78fb' }}>Mark all as read</button>
                      <select className="text-[12px] text-gray-500 bg-transparent outline-none cursor-pointer">
                        <option>All</option>
                        <option>Unread</option>
                      </select>
                    </div>
                  </div>

                  <div className="px-4 py-2.5">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#f5f5f5' }}>
                      <Search className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.7} />
                      <input type="text" value={chatSearchQuery} onChange={e => setChatSearchQuery(e.target.value)}
                        placeholder="Search users" className="text-[12px] bg-transparent outline-none flex-1 text-gray-700 placeholder:text-gray-400" />
                    </div>
                  </div>

                  <div className="max-h-[380px] overflow-y-auto">
                    {MOCK_CHATS.filter(c => !chatSearchQuery || c.name.toLowerCase().includes(chatSearchQuery.toLowerCase())).map(chat => (
                      <div key={chat.id}
                        onClick={() => setActiveChat(chat)}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                        style={{ background: chat.unread ? '#faf8ff' : 'transparent' }}>
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-[11px]"
                            style={{ background: chat.avatarColor }}>
                            {chat.avatar}
                          </div>
                          {chat.online && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-semibold text-gray-800">{chat.name}</span>
                            <span className="text-[11px] text-gray-400">{chat.time}</span>
                          </div>
                          <p className="text-[12px] text-gray-500 mt-0.5 truncate">{chat.lastMessage}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-5 py-3 text-center" style={{ borderTop: '1px solid #f0f0f0' }}>
                    <button className="text-[12px] font-medium" style={{ color: '#8e78fb' }}>Settings</button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-[10px] cursor-pointer ml-1"
              style={{ background: community.avatarColor }}>
              WN
            </div>
          </div>
        </div>
      </header>

      {/* ── Conversation popup (centered) ── */}
      {activeChat && (
        <>
          <div className="fixed inset-0 z-[90]" style={{ background: 'rgba(26,23,48,.25)', backdropFilter: 'blur(4px)' }}
            onClick={() => { setActiveChat(null); setChatOpen(false) }} />
          <div className="fixed w-[520px] rounded-2xl overflow-hidden z-[100] flex flex-col"
            style={{ background: '#fff', boxShadow: '0 24px 80px rgba(26,23,48,.2), 0 0 0 1px rgba(0,0,0,.06)', height: 560, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>

            <div className="flex items-center gap-3 px-5 py-3.5" style={{ background: 'linear-gradient(135deg, #8e78fb, #6c52f0)' }}>
              <button onClick={() => { setActiveChat(null); setChatOpen(true) }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                <ChevronLeft className="w-4 h-4" strokeWidth={2} />
              </button>
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-[10px]"
                  style={{ background: 'rgba(255,255,255,.2)' }}>
                  {activeChat.avatar}
                </div>
                {activeChat.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#6c52f0]" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-white">{activeChat.name}</p>
                <p className="text-[11px] text-white/70">{activeChat.online ? 'online now' : 'offline'}</p>
              </div>
              <button className="w-7 h-7 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                <Maximize2 className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
              <button className="w-7 h-7 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                <MoreHorizontal className="w-4 h-4" strokeWidth={2} />
              </button>
              <button onClick={() => { setActiveChat(null); setChatOpen(false) }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3" style={{ background: '#fafbfc' }}>
              {MOCK_CONVERSATION.map(msg => (
                <div key={msg.id}>
                  {msg.date && <p className="text-center text-[11px] text-gray-400 my-3">{msg.date}</p>}
                  <div className={`flex items-end gap-2.5 ${msg.sender === 'me' ? 'flex-row-reverse' : ''}`}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[8px] flex-shrink-0"
                      style={{ background: msg.sender === 'me' ? community.avatarColor : activeChat.avatarColor }}>
                      {msg.sender === 'me' ? 'WN' : activeChat.avatar}
                    </div>
                    <div className="max-w-[75%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed"
                      style={msg.sender === 'me'
                        ? { background: 'linear-gradient(135deg, #8e78fb, #6c52f0)', color: '#fff', borderBottomRightRadius: 6 }
                        : { background: '#fff', color: '#1a1730', border: '1px solid #eee', borderBottomLeftRadius: 6 }
                      }>
                      {msg.text}
                      <span className="block text-[10px] mt-1 text-right" style={{ opacity: 0.5 }}>{msg.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderTop: '1px solid #f0f0f0' }}>
              <input type="text" value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                placeholder={`Message ${activeChat.name.split(' ')[0]}`}
                className="flex-1 text-[13px] outline-none text-gray-700 placeholder:text-gray-400 bg-transparent" />
              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <Paperclip className="w-4 h-4" strokeWidth={1.7} />
              </button>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <Smile className="w-4 h-4" strokeWidth={1.7} />
              </button>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <span className="text-[11px] font-bold">GIF</span>
              </button>
              {chatMsg.trim() && (
                <button className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#8e78fb', color: '#fff' }}>
                  <Send className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── 3-COLUMN BODY ────────────────────────── */}
      <div className="max-w-[1200px] mx-auto flex">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="hidden lg:flex flex-col w-[200px] flex-shrink-0 border-r border-gray-100 sticky top-[56px] h-[calc(100vh-56px)] overflow-y-auto py-4 px-3"
          style={{ background: '#fafbfc' }}>

          <nav className="flex flex-col gap-0.5">
            {visibleNav.map(({ id, label, labelAr, Icon }) => {
              const isActive = active === id
              return (
                <Link key={id} href={tabHref(id)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all"
                  style={{
                    color: isActive ? '#1a1730' : '#46426a',
                    background: isActive ? '#ede9ff' : 'transparent',
                  }}>
                  <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.7}
                    style={{ color: isActive ? '#8e78fb' : '#9590b8' }} />
                  {isAr ? labelAr : label}
                </Link>
              )
            })}
          </nav>

          <div className="my-4 border-t border-gray-100" />

          <div className="mb-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              {isAr ? 'المجتمع' : 'Community'}
            </p>
            {[
              { id: 'members' as CommunityTab, label: isAr ? 'الأعضاء' : 'Members', labelAr: 'الأعضاء', Icon: Users },
              { id: 'progress' as CommunityTab, label: isAr ? 'المتصدرين' : 'Leaderboards', labelAr: 'المتصدرين', Icon: Trophy },
              { id: 'reviews' as CommunityTab, label: isAr ? 'حول' : 'About', labelAr: 'حول', Icon: Info },
            ].map(({ id, label, Icon }) => {
              const isActive = active === id
              return (
                <Link key={id} href={tabHref(id)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all"
                  style={{
                    color: isActive ? '#1a1730' : '#46426a',
                    background: isActive ? '#ede9ff' : 'transparent',
                  }}>
                  <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.7}
                    style={{ color: isActive ? '#8e78fb' : '#9590b8' }} />
                  {label}
                </Link>
              )
            })}
          </div>

          <div className="my-4 border-t border-gray-100" />

          <div className="mb-4">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              {isAr ? 'القنوات' : 'All Channels'}
            </p>
            {(community.channels || ['General', 'Resources', 'Showcase']).map((ch: string, i: number) => {
              const chSlug = ch.toLowerCase()
              const isChActive = pathname.includes(`/channels/${chSlug}`)
              return (
                <Link key={ch} href={`/communities/${community.slug}/channels/${chSlug}`}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] transition-colors"
                  style={{
                    color: isChActive ? '#1a1730' : '#6b7280',
                    background: isChActive ? '#ede9ff' : 'transparent',
                    fontWeight: isChActive ? 600 : 400,
                  }}>
                  <Hash className="w-3 h-3" strokeWidth={1.7} style={{ color: isChActive ? '#8e78fb' : '#9ca3af' }} />
                  {ch}
                  {i === 0 && !isChActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-400" />}
                </Link>
              )
            })}
          </div>

          <div className="mt-auto">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1">
              {isAr ? 'أكمل ملفك' : 'Complete Your Intro'}
              <span className="text-[9px]">👋</span>
            </p>
            {[
              { label: isAr ? 'شاهد الفيديو التعريفي' : 'Watch intro video', done: true },
              { label: isAr ? 'تفاعل مع منشور' : 'React to a post', done: true },
              { label: isAr ? 'علّق على منشور' : 'Comment on a post', done: false },
              { label: isAr ? 'شارك أول منشور' : 'Share your first post', done: false },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 px-3 py-1.5 text-[11px]"
                style={{ color: item.done ? '#999' : '#555' }}>
                {item.done
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" strokeWidth={2} />
                  : <Circle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" strokeWidth={1.5} />}
                <span className={item.done ? 'line-through' : ''}>{item.label}</span>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 min-w-0 px-5 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
