'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MessageSquare, BookOpen, Zap, Calendar, ShoppingBag,
  UserCheck, Users, Trophy, Info, Search, Bell,
  MessageCircle, Hash, ExternalLink, CheckCircle2, Circle,
} from 'lucide-react'
import type { CommunityData, CommunityTab } from '@/lib/community-data'

interface Props {
  community: CommunityData
  locale: string
  children: React.ReactNode
}

const NAV: { id: CommunityTab; label: string; labelAr: string; Icon: React.ElementType }[] = [
  { id: 'feed',       label: 'Feed',        labelAr: 'المنشورات', Icon: MessageSquare },
  { id: 'courses',    label: 'Courses',     labelAr: 'الدورات',   Icon: BookOpen },
  { id: 'events',     label: 'Events',      labelAr: 'الفعاليات', Icon: Calendar },
  { id: 'members',    label: 'Members',     labelAr: 'الأعضاء',   Icon: Users },
  { id: 'reviews',    label: 'About',       labelAr: 'حول',       Icon: Info },
  { id: 'sessions',   label: 'Sessions',    labelAr: 'الجلسات',   Icon: UserCheck },
  { id: 'challenges', label: 'Challenges',  labelAr: 'التحديات',  Icon: Zap },
  { id: 'products',   label: 'Products',    labelAr: 'المنتجات',  Icon: ShoppingBag },
  { id: 'progress',   label: 'Leaderboards',labelAr: 'المتصدرين', Icon: Trophy },
]

export function CommunityLayoutClient({ community, locale, children }: Props) {
  const pathname = usePathname()
  const isAr = locale === 'ar'

  function tabHref(id: CommunityTab) {
    const base = `/communities/${community.slug}`
    return id === 'feed' ? base : `${base}/${id}`
  }

  function activeTab(): CommunityTab {
    const last = pathname.split('/').at(-1) as CommunityTab
    const subs: CommunityTab[] = ['courses','challenges','sessions','products','events','reviews','progress','members']
    return subs.includes(last) ? last : 'feed'
  }

  const active = activeTab()
  const visibleNav = NAV.filter(n => community.tabs.includes(n.id))
  const owner = community.members.find(m => m.role === 'owner')

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>

      {/* ── TOP BAR ──────────────────────────────── */}
      <header className="sticky top-0 z-50" style={{ background: '#fff', borderBottom: '1px solid #e8e8e8' }}>
        <div className="max-w-[1200px] mx-auto px-6 flex items-center h-[52px] gap-6">

          {/* Logo / brand */}
          <Link href={tabHref('feed')} className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-md flex items-center justify-center font-black text-white text-[9px]"
              style={{ background: community.avatarColor }}>
              {community.avatarInitials}
            </div>
            <span className="font-bold text-[15px] text-gray-900 hidden sm:block">
              {isAr ? community.nameAr : community.name}
            </span>
          </Link>

          {/* Center nav tabs */}
          <nav className="hidden md:flex items-center gap-1 ml-6">
            {['Home', 'Community', 'Courses'].map((t, i) => (
              <span key={t}
                className="px-3 py-1.5 text-[13px] font-medium rounded-md cursor-pointer transition-colors"
                style={{
                  color: i === 1 ? '#111' : '#999',
                  background: i === 1 ? '#f3f3f3' : 'transparent',
                }}>
                {t}
              </span>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Right icons */}
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-400">
              <Bell className="w-[17px] h-[17px]" strokeWidth={1.6} />
            </button>
            <button className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-400">
              <MessageCircle className="w-[17px] h-[17px]" strokeWidth={1.6} />
            </button>
            <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[9px] cursor-pointer ml-1"
              style={{ background: community.avatarColor }}>
              WN
            </div>
          </div>
        </div>
      </header>

      {/* ── 3-COLUMN BODY ────────────────────────── */}
      <div className="max-w-[1200px] mx-auto flex">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="hidden lg:flex flex-col w-[200px] flex-shrink-0 border-r border-gray-100 sticky top-[52px] h-[calc(100vh-52px)] overflow-y-auto py-4 px-3"
          style={{ background: '#fafbfc' }}>

          {/* Navigation */}
          <nav className="flex flex-col gap-0.5">
            {visibleNav.map(({ id, label, labelAr, Icon }) => {
              const isActive = active === id
              return (
                <Link key={id} href={tabHref(id)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all"
                  style={{
                    color: isActive ? '#111' : '#666',
                    background: isActive ? '#e8f4f8' : 'transparent',
                  }}>
                  <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.7}
                    style={{ color: isActive ? '#3AAFA9' : '#999' }} />
                  {isAr ? labelAr : label}
                </Link>
              )
            })}
          </nav>

          {/* Divider */}
          <div className="my-4 border-t border-gray-100" />

          {/* Channels section */}
          <div className="mb-4">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              {isAr ? 'القنوات' : 'All Channels'}
            </p>
            {['General', 'Resources', 'Showcase'].map((ch, i) => (
              <button key={ch} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] text-gray-500 hover:bg-gray-100 transition-colors">
                <Hash className="w-3 h-3 text-gray-400" strokeWidth={1.7} />
                {ch}
                {i === 0 && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-400" />}
              </button>
            ))}
          </div>

          {/* Links section */}
          <div className="mb-4">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              {isAr ? 'روابط' : 'Links'}
            </p>
            {[
              { label: isAr ? 'الموقع' : 'Website', href: '#' },
              { label: isAr ? 'يوتيوب' : 'YouTube', href: '#' },
            ].map(link => (
              <button key={link.label} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] text-gray-500 hover:bg-gray-100 transition-colors">
                <ExternalLink className="w-3 h-3 text-gray-400" strokeWidth={1.7} />
                {link.label}
              </button>
            ))}
          </div>

          {/* Complete your intro */}
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

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 min-w-0 px-5 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
