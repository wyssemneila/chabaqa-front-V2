'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Users, Star, BookOpen, Zap, Calendar, ShoppingBag,
  Flame, BarChart2, UserCheck, Search, MessageCircle,
  Bell, ChevronDown, Settings,
} from 'lucide-react'
import type { CommunityData, CommunityTab } from '@/lib/community-data'

interface Props {
  community: CommunityData
  locale: string
  children: React.ReactNode
}

const NAV: { id: CommunityTab; label: string; labelAr: string; Icon: React.ElementType }[] = [
  { id: 'feed',       label: 'Community',   labelAr: 'المجتمع',   Icon: Flame },
  { id: 'courses',    label: 'Classroom',   labelAr: 'الفصل',     Icon: BookOpen },
  { id: 'challenges', label: 'Challenges',  labelAr: 'التحديات',  Icon: Zap },
  { id: 'sessions',   label: 'Sessions',    labelAr: 'الجلسات',   Icon: UserCheck },
  { id: 'products',   label: 'Products',    labelAr: 'المنتجات',  Icon: ShoppingBag },
  { id: 'events',     label: 'Calendar',    labelAr: 'التقويم',   Icon: Calendar },
  { id: 'members',    label: 'Members',     labelAr: 'الأعضاء',   Icon: Users },
  { id: 'progress',   label: 'Leaderboards', labelAr: 'المتصدرين', Icon: BarChart2 },
  { id: 'reviews',    label: 'About',       labelAr: 'حول',       Icon: Star },
]

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`
}

export function CommunityLayoutClient({ community, locale, children }: Props) {
  const pathname = usePathname()
  const isAr = locale === 'ar'
  const c = community.avatarColor

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

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── TOP BAR ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40" style={{ background: 'var(--white)', borderBottom: '1px solid var(--bd)' }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">

          {/* Row 1: Community name + search + actions */}
          <div className="flex items-center gap-4 h-[60px]">
            {/* Community identity */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-white text-xs"
                style={{ background: c }}>
                {community.avatarInitials}
              </div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-[15px] leading-tight" style={{ color: 'var(--t1)' }}>
                  {isAr ? community.nameAr : community.name}
                </h1>
                <ChevronDown className="w-3.5 h-3.5 opacity-40" style={{ color: 'var(--t3)' }} />
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-[480px] mx-auto hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--t3)' }} strokeWidth={1.7} />
                <input
                  type="text"
                  readOnly
                  placeholder={isAr ? 'بحث...' : 'Search'}
                  className="w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none cursor-pointer transition-colors"
                  style={{ background: 'var(--bg)', border: '1px solid var(--bd)', color: 'var(--t1)' }}
                />
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
              <button className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg)]"
                style={{ color: 'var(--t3)' }}>
                <MessageCircle className="w-[18px] h-[18px]" strokeWidth={1.7} />
              </button>
              <button className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg)]"
                style={{ color: 'var(--t3)' }}>
                <Bell className="w-[18px] h-[18px]" strokeWidth={1.7} />
              </button>
              {/* User avatar */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-[10px] cursor-pointer"
                style={{ background: 'var(--p)' }}>
                WN
              </div>
            </div>
          </div>

          {/* Row 2: Horizontal tab navigation */}
          <div className="flex items-center gap-0 -mb-px overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {visibleNav.map(({ id, label, labelAr }) => {
              const isActive = active === id
              return (
                <Link key={id} href={tabHref(id)}
                  className="relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors"
                  style={{ color: isActive ? 'var(--t1)' : 'var(--t3)' }}>
                  {isAr ? labelAr : label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full" style={{ background: 'var(--t1)' }} />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── PAGE BODY ───────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 lg:py-8 flex flex-col lg:flex-row gap-6 items-start">

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0 order-2 lg:order-1">
          {children}
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="w-full lg:w-[320px] flex-shrink-0 order-1 lg:order-2 lg:sticky lg:top-[120px]">
          <div className="flex flex-col gap-4">

            {/* Community info card */}
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
              {/* Banner */}
              <div className="h-[140px] relative flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${c}, ${c}cc)` }}>
                <span className="text-5xl font-black text-white/30 select-none">
                  {community.avatarInitials}
                </span>
              </div>

              <div className="p-5">
                {/* Name + link */}
                <h2 className="font-bold text-base mb-0.5" style={{ color: 'var(--t1)' }}>
                  {isAr ? community.nameAr : community.name}
                </h2>
                <p className="text-xs mb-3 truncate" style={{ color: 'var(--t3)' }}>
                  chabaqa.com/{community.slug}
                </p>

                {/* Description */}
                <p className="text-[13px] leading-relaxed mb-4" style={{ color: 'var(--t2)' }}>
                  {isAr ? community.descriptionAr : community.description}
                </p>

                {/* Stats row */}
                <div className="flex items-center gap-0 mb-4 py-3 rounded-lg" style={{ background: 'var(--bg)' }}>
                  <div className="flex flex-col items-center flex-1">
                    <span className="text-base font-bold" style={{ color: 'var(--t1)' }}>{fmt(community.membersCount)}</span>
                    <span className="text-[11px]" style={{ color: 'var(--t3)' }}>{isAr ? 'عضو' : 'Members'}</span>
                  </div>
                  <div className="w-px h-8" style={{ background: 'var(--bd)' }} />
                  <div className="flex flex-col items-center flex-1">
                    <span className="text-base font-bold" style={{ color: '#10b981' }}>{community.activeTodayCount}</span>
                    <span className="text-[11px]" style={{ color: 'var(--t3)' }}>{isAr ? 'نشط' : 'Online'}</span>
                  </div>
                  <div className="w-px h-8" style={{ background: 'var(--bd)' }} />
                  <div className="flex flex-col items-center flex-1">
                    <span className="text-base font-bold" style={{ color: 'var(--t1)' }}>1</span>
                    <span className="text-[11px]" style={{ color: 'var(--t3)' }}>{isAr ? 'مشرف' : 'Admin'}</span>
                  </div>
                </div>

                {/* Member avatars */}
                <div className="flex items-center gap-0 mb-4">
                  {community.members.slice(0, 8).map((m, i) => (
                    <div key={m.id}
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-[9px] border-2"
                      style={{
                        background: m.color,
                        borderColor: 'var(--white)',
                        marginLeft: i > 0 ? -6 : 0,
                        zIndex: 10 - i,
                        position: 'relative',
                      }}>
                      {m.initials}
                    </div>
                  ))}
                </div>

                {/* CTA / Settings */}
                {community.isJoined ? (
                  <button className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--bg)]"
                    style={{ color: 'var(--t2)', border: '1px solid var(--bd)' }}>
                    <Settings className="w-4 h-4 inline-block mr-2 -mt-0.5" strokeWidth={1.7} />
                    {isAr ? 'الإعدادات' : 'SETTINGS'}
                  </button>
                ) : (
                  <button className="w-full py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: c }}>
                    {isAr ? '+ انضم للمجتمع' : '+ Join Community'}
                  </button>
                )}
              </div>
            </div>

          </div>
        </aside>

      </div>
    </div>
  )
}
