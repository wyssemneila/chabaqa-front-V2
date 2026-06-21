'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Users, Star, BookOpen, Zap, Calendar, ShoppingBag,
  Flame, BarChart2, UserCheck, Search, MessageCircle,
  Bell, Settings, Trophy, Info, Sparkles,
} from 'lucide-react'
import type { CommunityData, CommunityTab } from '@/lib/community-data'

interface Props {
  community: CommunityData
  locale: string
  children: React.ReactNode
}

const NAV: { id: CommunityTab; label: string; labelAr: string; Icon: React.ElementType }[] = [
  { id: 'feed',       label: 'Community',    labelAr: 'المجتمع',    Icon: Flame },
  { id: 'courses',    label: 'Classroom',    labelAr: 'الفصل',      Icon: BookOpen },
  { id: 'challenges', label: 'Challenges',   labelAr: 'التحديات',   Icon: Zap },
  { id: 'sessions',   label: 'Sessions',     labelAr: 'الجلسات',    Icon: UserCheck },
  { id: 'products',   label: 'Products',     labelAr: 'المنتجات',   Icon: ShoppingBag },
  { id: 'events',     label: 'Calendar',     labelAr: 'التقويم',    Icon: Calendar },
  { id: 'members',    label: 'Members',      labelAr: 'الأعضاء',    Icon: Users },
  { id: 'progress',   label: 'Leaderboards', labelAr: 'المتصدرين',  Icon: Trophy },
  { id: 'reviews',    label: 'About',        labelAr: 'حول',        Icon: Info },
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

      {/* ── STICKY TOP BAR ──────────────────────────────────────── */}
      <div className="sticky top-0 z-40" style={{ background: 'var(--white)', boxShadow: '0 1px 0 var(--bd)' }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">

          {/* Row 1: Identity + Search + Actions */}
          <div className="flex items-center gap-4 h-[56px]">

            {/* Community identity */}
            <Link href={tabHref('feed')} className="flex items-center gap-3 flex-shrink-0 group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-[11px] transition-transform group-hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${c}, ${c}bb)`, boxShadow: `0 4px 12px ${c}40` }}>
                {community.avatarInitials}
              </div>
              <h1 className="font-extrabold text-[15px] hidden sm:block" style={{ color: 'var(--t1)' }}>
                {isAr ? community.nameAr : community.name}
              </h1>
            </Link>

            {/* Search */}
            <div className="flex-1 max-w-[420px] mx-auto hidden md:block">
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors group-focus-within:text-[var(--p)]" style={{ color: 'var(--t3)' }} strokeWidth={1.8} />
                <input
                  type="text"
                  readOnly
                  placeholder={isAr ? 'ابحث في المجتمع...' : 'Search community...'}
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-sm outline-none cursor-pointer transition-all hover:border-[var(--p)]"
                  style={{ background: 'var(--bg)', border: '1.5px solid var(--bd)', color: 'var(--t1)' }}
                />
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
              <button className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-[var(--p2)] hover:text-[var(--p)]"
                style={{ color: 'var(--t3)' }}>
                <MessageCircle className="w-[18px] h-[18px]" strokeWidth={1.8} />
              </button>
              <button className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-[var(--p2)] hover:text-[var(--p)]"
                style={{ color: 'var(--t3)' }}>
                <Bell className="w-[18px] h-[18px]" strokeWidth={1.8} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#f65887', border: '2px solid var(--white)' }} />
              </button>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-[10px] cursor-pointer ml-1 transition-transform hover:scale-105"
                style={{ background: 'var(--p)', boxShadow: '0 2px 8px rgba(142,120,251,.3)' }}>
                WN
              </div>
            </div>
          </div>

          {/* Row 2: Tab navigation */}
          <div className="flex items-end gap-0 -mb-px overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {visibleNav.map(({ id, label, labelAr, Icon }) => {
              const isActive = active === id
              return (
                <Link key={id} href={tabHref(id)}
                  className="relative flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap transition-all rounded-t-lg"
                  style={{
                    color: isActive ? 'var(--p)' : 'var(--t3)',
                    background: isActive ? 'var(--p2)' : 'transparent',
                  }}>
                  <Icon className="w-3.5 h-3.5" strokeWidth={isActive ? 2.2 : 1.7} />
                  {isAr ? labelAr : label}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full" style={{ background: 'var(--p)' }} />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── PAGE BODY ──────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* MAIN CONTENT */}
          <main className="flex-1 min-w-0 order-2 lg:order-1">
            {children}
          </main>

          {/* ── RIGHT SIDEBAR ──────────────────────────────────── */}
          <aside className="w-full lg:w-[300px] flex-shrink-0 order-1 lg:order-2 lg:sticky lg:top-[112px]">
            <div className="flex flex-col gap-4">

              {/* Community card */}
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--bd)', boxShadow: '0 4px 24px rgba(0,0,0,.04)' }}>

                {/* Gradient banner with pattern */}
                <div className="relative h-[120px] overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${c} 0%, var(--p) 50%, #c4b8fd 100%)` }}>
                  {/* Decorative circles */}
                  <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-15" style={{ background: '#fff' }} />
                  <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-10" style={{ background: '#fff' }} />
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-white/90" style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(4px)' }}>
                    <Sparkles className="w-3 h-3" strokeWidth={2} />
                    {isAr ? 'مجتمع نشط' : 'Active community'}
                  </div>
                  {/* Community avatar overlay */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${c}, ${c}cc)`, border: '3px solid var(--white)' }}>
                    {community.avatarInitials}
                  </div>
                </div>

                {/* Card body */}
                <div className="px-5 pt-10 pb-5">
                  <h2 className="font-extrabold text-[15px] text-center mb-0.5" style={{ color: 'var(--t1)' }}>
                    {isAr ? community.nameAr : community.name}
                  </h2>
                  <p className="text-xs text-center mb-3" style={{ color: 'var(--t3)' }}>
                    {isAr ? 'بواسطة' : 'by'} {community.creatorName}
                  </p>

                  <p className="text-[13px] leading-relaxed text-center mb-5" style={{ color: 'var(--t2)' }}>
                    {isAr ? community.descriptionAr : community.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center rounded-xl mb-4 p-1" style={{ background: 'var(--bg)' }}>
                    {[
                      { value: fmt(community.membersCount), label: isAr ? 'عضو' : 'Members', color: 'var(--t1)' },
                      { value: community.activeTodayCount, label: isAr ? 'نشط' : 'Online', color: '#10b981' },
                      { value: community.rating.toFixed(1), label: isAr ? 'تقييم' : 'Rating', color: '#ff9b28' },
                    ].map((s, i) => (
                      <div key={i} className="flex flex-col items-center flex-1 py-2.5">
                        <span className="text-[15px] font-extrabold leading-none" style={{ color: s.color }}>{s.value}</span>
                        <span className="text-[10px] mt-1" style={{ color: 'var(--t3)' }}>{s.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Member faces */}
                  <div className="flex items-center justify-center mb-4">
                    <div className="flex items-center -space-x-2">
                      {community.members.slice(0, 6).map((m) => (
                        <div key={m.id}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[8px] font-bold ring-2 ring-[var(--white)]"
                          style={{ background: m.color }}>
                          {m.initials}
                        </div>
                      ))}
                      {community.membersCount > 6 && (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold ring-2 ring-[var(--white)]"
                          style={{ background: 'var(--bg)', color: 'var(--t3)' }}>
                          +{community.membersCount - 6}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  {community.isJoined ? (
                    <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all hover:bg-[var(--bg)]"
                      style={{ color: 'var(--t2)', border: '1.5px solid var(--bd)' }}>
                      <Settings className="w-3.5 h-3.5" strokeWidth={1.8} />
                      {isAr ? 'إعدادات المجتمع' : 'Community Settings'}
                    </button>
                  ) : (
                    <button className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{ background: `linear-gradient(135deg, var(--p), ${c})`, boxShadow: `0 6px 20px ${c}44` }}>
                      {isAr ? '+ انضم للمجتمع' : '+ Join Community'}
                    </button>
                  )}
                </div>
              </div>

              {/* Quick activity */}
              <div className="rounded-2xl p-4" style={{ background: 'var(--white)', border: '1px solid var(--bd)', boxShadow: '0 4px 24px rgba(0,0,0,.04)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--p2)' }}>
                    <Flame className="w-4 h-4" style={{ color: 'var(--p)' }} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: 'var(--t1)' }}>
                      <span style={{ color: 'var(--p)' }}>{community.postsThisWeek}</span> {isAr ? 'منشور هذا الأسبوع' : 'posts this week'}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--t3)' }}>
                      {isAr ? 'مجتمع نشط ومتفاعل' : 'Active & growing community'}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </aside>

        </div>
      </div>
    </div>
  )
}
