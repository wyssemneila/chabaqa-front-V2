'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Star, BookOpen, Zap, Calendar, ShoppingBag, Flame, BarChart2, UserCheck, CheckCircle } from 'lucide-react'
import type { CommunityData, CommunityTab } from '@/lib/community-data'

interface Props {
  community: CommunityData
  locale: string
  children: React.ReactNode
}

const TAB_CONFIG: { id: CommunityTab; label: string; labelAr: string; icon: React.ReactNode }[] = [
  { id: 'feed',       label: 'Feed',       labelAr: 'المنشورات', icon: <Flame    className="w-3.5 h-3.5" strokeWidth={1.7} /> },
  { id: 'courses',    label: 'Courses',    labelAr: 'الكورسات',  icon: <BookOpen  className="w-3.5 h-3.5" strokeWidth={1.7} /> },
  { id: 'challenges', label: 'Challenges', labelAr: 'التحديات',  icon: <Zap       className="w-3.5 h-3.5" strokeWidth={1.7} /> },
  { id: 'sessions',   label: 'Sessions',   labelAr: 'الجلسات',   icon: <UserCheck className="w-3.5 h-3.5" strokeWidth={1.7} /> },
  { id: 'products',   label: 'Products',   labelAr: 'المنتجات',  icon: <ShoppingBag className="w-3.5 h-3.5" strokeWidth={1.7} /> },
  { id: 'events',     label: 'Events',     labelAr: 'الفعاليات', icon: <Calendar  className="w-3.5 h-3.5" strokeWidth={1.7} /> },
  { id: 'reviews',    label: 'Reviews',    labelAr: 'التقييمات', icon: <Star      className="w-3.5 h-3.5" strokeWidth={1.7} /> },
  { id: 'progress',   label: 'Progress',   labelAr: 'التقدم',    icon: <BarChart2 className="w-3.5 h-3.5" strokeWidth={1.7} /> },
  { id: 'members',    label: 'Members',    labelAr: 'الأعضاء',   icon: <Users     className="w-3.5 h-3.5" strokeWidth={1.7} /> },
]

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`
}

export function CommunityLayoutClient({ community, locale, children }: Props) {
  const pathname = usePathname()
  const isAr = locale === 'ar'

  function tabHref(tab: CommunityTab) {
    const base = `/communities/${community.slug}`
    return tab === 'feed' ? base : `${base}/${tab}`
  }

  function activeTab(): CommunityTab {
    const parts = pathname.split('/')
    const last = parts[parts.length - 1] as CommunityTab
    if (['courses','challenges','sessions','products','events','reviews','progress','members'].includes(last)) return last
    return 'feed'
  }

  const active = activeTab()

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Community Hero ─────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-0">
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--bd)' }}
        >
          {/* Banner */}
          <div
            className="h-36 sm:h-48 w-full relative"
            style={{
              background: `linear-gradient(135deg, ${community.avatarColor}44 0%, ${community.avatarColor}22 50%, var(--p2) 100%)`,
            }}
          >
            <div
              className="absolute inset-0 opacity-[0.15]"
              style={{
                backgroundImage: 'linear-gradient(var(--bd) 1px,transparent 1px),linear-gradient(90deg,var(--bd) 1px,transparent 1px)',
                backgroundSize: '28px 28px',
              }}
              aria-hidden="true"
            />
          </div>

          {/* Info section */}
          <div className="bg-[var(--white)] px-5 pb-5 pt-0">
            <div className="flex items-end gap-4 -mt-9 mb-3">
              <div
                className="flex-shrink-0 rounded-2xl flex items-center justify-center font-black text-white text-2xl"
                style={{ width: 72, height: 72, background: community.avatarColor, boxShadow: '0 0 0 4px var(--white)' }}
                aria-label={community.name}
              >
                {community.avatarInitials}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-extrabold leading-tight" style={{ color: 'var(--t1)' }}>
                  {isAr ? community.nameAr : community.name}
                </h1>
                <p className="text-xs mt-0.5 mb-2" style={{ color: 'var(--t3)' }}>
                  {isAr ? 'من قِبَل' : 'by'}{' '}
                  <span className="font-semibold" style={{ color: 'var(--p)' }}>{community.creatorName}</span>
                </p>
                <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'var(--t2)' }}>
                  {isAr ? community.descriptionAr : community.description}
                </p>

                {/* Stats chips */}
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--t2)' }}>
                    <Users className="w-3.5 h-3.5" strokeWidth={1.7} />
                    {fmt(community.membersCount)} {isAr ? 'عضو' : 'members'}
                  </span>
                  <span className="w-px h-3.5" style={{ background: 'var(--bd)' }} aria-hidden="true" />
                  <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--t2)' }}>
                    <Flame className="w-3.5 h-3.5" strokeWidth={1.7} />
                    {community.activeTodayCount} {isAr ? 'نشط اليوم' : 'active today'}
                  </span>
                  <span className="w-px h-3.5" style={{ background: 'var(--bd)' }} aria-hidden="true" />
                  <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--t2)' }}>
                    <svg viewBox="0 0 24 24" fill="#ff9b28" width="13" height="13" aria-hidden="true">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    {community.rating.toFixed(1)}
                    <span className="font-normal" style={{ color: 'var(--t3)' }}>({community.ratingCount})</span>
                  </span>
                </div>
              </div>

              {/* CTA button */}
              <div className="flex-shrink-0 self-end sm:self-auto">
                {community.isJoined ? (
                  <button
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                    style={{ border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t2)' }}
                  >
                    <CheckCircle className="w-4 h-4" style={{ color: 'var(--p)' }} strokeWidth={2} />
                    {isAr ? 'عضو' : 'Joined'}
                  </button>
                ) : (
                  <button
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                    style={{ background: 'var(--p)', color: '#fff' }}
                  >
                    {isAr ? 'انضم للمجتمع' : 'Join Community'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Tab Navigation ──────────────────────────────────────────────── */}
        <div
          className="sticky z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 mt-1"
          style={{ top: '64px', background: 'var(--bg)', borderBottom: '1px solid var(--bd)' }}
        >
          <div className="max-w-6xl mx-auto">
            <nav
              className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2"
              aria-label="Community navigation"
              role="tablist"
            >
              {community.tabs.map((tabId) => {
                const tab = TAB_CONFIG.find(t => t.id === tabId)
                if (!tab) return null
                const isActive = active === tabId
                return (
                  <Link
                    key={tabId}
                    href={tabHref(tabId)}
                    role="tab"
                    aria-selected={isActive}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-200"
                    style={
                      isActive
                        ? { background: 'var(--p)', color: '#fff' }
                        : { color: 'var(--t2)', background: 'transparent' }
                    }
                  >
                    {tab.icon}
                    {isAr ? tab.labelAr : tab.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* ── Page Content ─────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
