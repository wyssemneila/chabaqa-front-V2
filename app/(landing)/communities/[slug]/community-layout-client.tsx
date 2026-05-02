'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Users, Star, BookOpen, Zap, Calendar, ShoppingBag,
  Flame, BarChart2, UserCheck, CheckCircle, ChevronRight,
} from 'lucide-react'
import type { CommunityData, CommunityTab } from '@/lib/community-data'

interface Props {
  community: CommunityData
  locale: string
  children: React.ReactNode
}

const NAV: { id: CommunityTab; label: string; labelAr: string; Icon: React.ElementType }[] = [
  { id: 'feed',       label: 'Feed',       labelAr: 'المنشورات', Icon: Flame },
  { id: 'courses',    label: 'Courses',    labelAr: 'الكورسات',  Icon: BookOpen },
  { id: 'challenges', label: 'Challenges', labelAr: 'التحديات',  Icon: Zap },
  { id: 'sessions',   label: 'Sessions',   labelAr: 'الجلسات',   Icon: UserCheck },
  { id: 'products',   label: 'Products',   labelAr: 'المنتجات',  Icon: ShoppingBag },
  { id: 'events',     label: 'Events',     labelAr: 'الفعاليات', Icon: Calendar },
  { id: 'reviews',    label: 'Reviews',    labelAr: 'التقييمات', Icon: Star },
  { id: 'progress',   label: 'Progress',   labelAr: 'التقدم',    Icon: BarChart2 },
  { id: 'members',    label: 'Members',    labelAr: 'الأعضاء',   Icon: Users },
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

      {/* ── Mobile tabs (hidden on desktop) ─────────────────────────── */}
      <div className="lg:hidden sticky z-30" style={{ top: 64, background: 'var(--white)', borderBottom: '1px solid var(--bd)', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
        <div className="px-4 py-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-[11px] flex-shrink-0 shadow"
            style={{ background: c }}>
            {community.avatarInitials}
          </div>
          <span className="font-extrabold text-sm flex-1 truncate" style={{ color: 'var(--t1)' }}>
            {isAr ? community.nameAr : community.name}
          </span>
          {community.isJoined
            ? <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                <CheckCircle className="w-3 h-3" strokeWidth={2.5} />{isAr ? 'عضو' : 'Joined'}
              </span>
            : <button className="text-[10px] font-bold px-3 py-1.5 rounded-full text-white" style={{ background: c }}>
                {isAr ? 'انضم' : 'Join'}
              </button>
          }
        </div>
        <div className="flex overflow-x-auto px-3 pb-2.5 gap-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {visibleNav.map(({ id, label, labelAr, Icon }) => {
            const isActive = active === id
            return (
              <Link key={id} href={tabHref(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all"
                style={isActive
                  ? { background: 'var(--p)', color: '#fff' }
                  : { color: 'var(--t2)', background: 'var(--bg)' }
                }>
                <Icon className="w-3.5 h-3.5" strokeWidth={1.7} />
                {isAr ? labelAr : label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Page body ───────────────────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 lg:py-8 flex gap-7 items-start">

        {/* ── LEFT SIDEBAR (desktop only) ─────────────────────────── */}
        <aside className="hidden lg:flex flex-col gap-4 flex-shrink-0" style={{ width: 256, position: 'sticky', top: 88 }}>

          {/* Brand card */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--bd)', boxShadow: '0 4px 20px rgba(0,0,0,.06)' }}>
            <div style={{ height: 7, background: `linear-gradient(90deg, ${c} 0%, ${c}80 100%)` }} />
            <div className="p-5">

              {/* Avatar + name */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-base flex-shrink-0"
                  style={{ background: c, boxShadow: `0 8px 24px ${c}55` }}>
                  {community.avatarInitials}
                </div>
                <div className="min-w-0">
                  <h2 className="font-extrabold text-sm leading-tight line-clamp-2" style={{ color: 'var(--t1)' }}>
                    {isAr ? community.nameAr : community.name}
                  </h2>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--t3)' }}>
                    {isAr ? 'بقيادة' : 'by'} <span className="font-semibold" style={{ color: 'var(--t2)' }}>{community.creatorName}</span>
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 mb-4 py-3 px-3 rounded-xl" style={{ background: 'var(--bg)' }}>
                <div className="flex flex-col items-center gap-0.5 flex-1">
                  <span className="text-sm font-extrabold" style={{ color: 'var(--t1)' }}>{fmt(community.membersCount)}</span>
                  <span className="text-[10px]" style={{ color: 'var(--t3)' }}>{isAr ? 'عضو' : 'Members'}</span>
                </div>
                <div className="w-px h-8" style={{ background: 'var(--bd)' }} />
                <div className="flex flex-col items-center gap-0.5 flex-1">
                  <span className="text-sm font-extrabold" style={{ color: '#ff9b28' }}>{community.rating.toFixed(1)}</span>
                  <span className="text-[10px]" style={{ color: 'var(--t3)' }}>{isAr ? 'تقييم' : 'Rating'}</span>
                </div>
                <div className="w-px h-8" style={{ background: 'var(--bd)' }} />
                <div className="flex flex-col items-center gap-0.5 flex-1">
                  <span className="text-sm font-extrabold" style={{ color: '#10b981' }}>{community.activeTodayCount}</span>
                  <span className="text-[10px]" style={{ color: 'var(--t3)' }}>{isAr ? 'نشط' : 'Online'}</span>
                </div>
              </div>

              {/* CTA */}
              {community.isJoined ? (
                <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold" style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                  <CheckCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
                  {isAr ? 'أنت عضو في هذا المجتمع' : 'You\'re a member'}
                </div>
              ) : (
                <button className="w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-95"
                  style={{ background: c, color: '#fff', boxShadow: `0 6px 20px ${c}44` }}>
                  {isAr ? '+ انضم للمجتمع' : '+ Join Community'}
                </button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="rounded-2xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--bd)', boxShadow: '0 4px 20px rgba(0,0,0,.06)' }}>
            <div className="px-2 py-2">
              {visibleNav.map(({ id, label, labelAr, Icon }) => {
                const isActive = active === id
                return (
                  <Link key={id} href={tabHref(id)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group"
                    style={isActive
                      ? { background: 'var(--p2)', color: 'var(--p)' }
                      : { color: 'var(--t2)' }
                    }>
                    <Icon
                      className="w-4 h-4 flex-shrink-0 transition-colors"
                      strokeWidth={isActive ? 2.2 : 1.7}
                      style={{ color: isActive ? 'var(--p)' : 'var(--t3)' }} />
                    <span className="flex-1">{isAr ? labelAr : label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} style={{ color: 'var(--p)' }} />}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Posts/week footer */}
          <div className="px-4 py-3 rounded-2xl flex items-center gap-2" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
            <Flame className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--orange)' }} strokeWidth={1.7} />
            <span className="text-xs" style={{ color: 'var(--t3)' }}>
              <span className="font-bold" style={{ color: 'var(--t1)' }}>{community.postsThisWeek}</span>{' '}
              {isAr ? 'منشور هذا الأسبوع' : 'posts this week'}
            </span>
          </div>

        </aside>

        {/* ── MAIN ───────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0">
          {children}
        </main>

      </div>
    </div>
  )
}
