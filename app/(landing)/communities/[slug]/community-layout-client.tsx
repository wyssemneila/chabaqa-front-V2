'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, MessageCircle, Bell, Crown } from 'lucide-react'
import type { CommunityData, CommunityTab } from '@/lib/community-data'

interface Props {
  community: CommunityData
  locale: string
  children: React.ReactNode
}

const NAV: { id: CommunityTab; label: string; labelAr: string }[] = [
  { id: 'feed',       label: 'Community',    labelAr: 'المجتمع'    },
  { id: 'courses',    label: 'Classroom',    labelAr: 'الفصل'      },
  { id: 'challenges', label: 'Challenges',   labelAr: 'التحديات'   },
  { id: 'sessions',   label: 'Sessions',     labelAr: 'الجلسات'    },
  { id: 'products',   label: 'Products',     labelAr: 'المنتجات'   },
  { id: 'events',     label: 'Calendar',     labelAr: 'التقويم'    },
  { id: 'members',    label: 'Members',      labelAr: 'الأعضاء'    },
  { id: 'progress',   label: 'Leaderboards', labelAr: 'المتصدرين'  },
  { id: 'reviews',    label: 'About',        labelAr: 'حول'        },
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
  const owner = community.members.find(m => m.role === 'owner')

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ━━━ TOP BAR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="sticky top-0 z-40" style={{ background: 'var(--white)', borderBottom: '1px solid var(--bd)' }}>
        <div className="max-w-[1120px] mx-auto px-5">

          {/* Identity row */}
          <div className="flex items-center h-[56px] gap-4">
            <Link href={tabHref('feed')} className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-[10px]"
                style={{ background: c }}>
                {community.avatarInitials}
              </div>
              <span className="font-bold text-[15px] hidden sm:block" style={{ color: 'var(--t1)' }}>
                {isAr ? community.nameAr : community.name}
              </span>
            </Link>

            <div className="flex-1 max-w-[400px] mx-auto hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--t3)' }} strokeWidth={1.8} />
                <input type="text" readOnly
                  placeholder={isAr ? 'بحث...' : 'Search'}
                  className="w-full pl-9 pr-4 py-[7px] rounded-lg text-[13px] outline-none cursor-pointer"
                  style={{ background: 'var(--bg)', border: '1px solid var(--bd)', color: 'var(--t1)' }} />
              </div>
            </div>

            <div className="flex items-center gap-1 ml-auto">
              <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg)] transition-colors" style={{ color: 'var(--t3)' }}>
                <MessageCircle className="w-[17px] h-[17px]" strokeWidth={1.8} />
              </button>
              <button className="relative w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg)] transition-colors" style={{ color: 'var(--t3)' }}>
                <Bell className="w-[17px] h-[17px]" strokeWidth={1.8} />
              </button>
              <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[9px] cursor-pointer ml-1"
                style={{ background: 'var(--p)' }}>WN</div>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-0 -mb-px overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {visibleNav.map(({ id, label, labelAr }) => {
              const isActive = active === id
              return (
                <Link key={id} href={tabHref(id)}
                  className="px-3.5 pb-2.5 pt-1 text-[13px] font-medium whitespace-nowrap transition-colors"
                  style={{ color: isActive ? 'var(--t1)' : 'var(--t3)', borderBottom: isActive ? '2px solid var(--t1)' : '2px solid transparent' }}>
                  {isAr ? labelAr : label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      {/* ━━━ BODY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="max-w-[1120px] mx-auto px-5 py-6 lg:py-7">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* Main content */}
          <main className="flex-1 min-w-0 order-2 lg:order-1">
            {children}
          </main>

          {/* ━━━ SIDEBAR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <aside className="w-full lg:w-[280px] flex-shrink-0 order-1 lg:order-2 lg:sticky lg:top-[104px] flex flex-col gap-4">

            {/* Community card */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>

              {/* Cover image area */}
              <div className="relative h-[100px]" style={{ background: `linear-gradient(135deg, ${c}, var(--p))` }}>
                <div className="absolute inset-0 opacity-[0.07]"
                  style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              </div>

              {/* Avatar overlapping the cover */}
              <div className="flex justify-center -mt-8">
                <div className="w-[60px] h-[60px] rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-lg ring-[3px] ring-[var(--white)]"
                  style={{ background: c }}>
                  {community.avatarInitials}
                </div>
              </div>

              <div className="px-4 pt-3 pb-5 text-center">
                <h2 className="font-bold text-[15px]" style={{ color: 'var(--t1)' }}>
                  {isAr ? community.nameAr : community.name}
                </h2>

                <p className="text-[12px] leading-relaxed mt-2 mb-4" style={{ color: 'var(--t2)' }}>
                  {isAr ? community.descriptionAr : community.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-px rounded-xl overflow-hidden mb-4" style={{ background: 'var(--bd)' }}>
                  {[
                    { val: fmt(community.membersCount), label: isAr ? 'عضو' : 'Members' },
                    { val: String(community.activeTodayCount), label: isAr ? 'نشط' : 'Online' },
                    { val: '1', label: isAr ? 'مشرف' : 'Admin' },
                  ].map((s, i) => (
                    <div key={i} className="py-2.5 flex flex-col items-center" style={{ background: 'var(--white)' }}>
                      <span className="text-sm font-bold" style={{ color: i === 1 ? '#10b981' : 'var(--t1)' }}>{s.val}</span>
                      <span className="text-[10px]" style={{ color: 'var(--t3)' }}>{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Member faces */}
                <div className="flex justify-center mb-4">
                  <div className="flex -space-x-1.5">
                    {community.members.slice(0, 8).map(m => (
                      <div key={m.id}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[8px] font-bold ring-2 ring-[var(--white)]"
                        style={{ background: m.color }}>
                        {m.initials}
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                {community.isJoined ? (
                  <button className="w-full py-2.5 rounded-xl text-[13px] font-medium hover:bg-[var(--bg)] transition-colors"
                    style={{ color: 'var(--t2)', border: '1px solid var(--bd)' }}>
                    {isAr ? 'الإعدادات' : 'SETTINGS'}
                  </button>
                ) : (
                  <button className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: c }}>
                    {isAr ? '+ انضم للمجتمع' : '+ Join Community'}
                  </button>
                )}
              </div>
            </div>

            {/* Creator card */}
            {owner && (
              <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-[11px]"
                  style={{ background: owner.color }}>
                  {owner.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--t1)' }}>{owner.name}</p>
                  <p className="text-[11px] flex items-center gap-1" style={{ color: 'var(--t3)' }}>
                    <Crown className="w-3 h-3 inline" strokeWidth={2} style={{ color: '#ff9b28' }} />
                    {isAr ? 'منشئ المجتمع' : 'Community Creator'}
                  </p>
                </div>
              </div>
            )}

          </aside>
        </div>
      </div>
    </div>
  )
}
