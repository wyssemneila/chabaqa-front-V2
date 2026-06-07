'use client'

import { Plus, Users } from 'lucide-react'
import { communities, type Community } from '@/lib/dashboard-data'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import Link from 'next/link'

const TR = {
  en: { title: 'Your Communities', createNew: 'Create New', members: 'members', view: 'View', customize: 'Customize', verified: 'VERIFIED' },
  ar: { title: 'مجتمعاتك',          createNew: 'إنشاء جديد', members: 'عضو',     view: 'عرض', customize: 'تخصيص',     verified: 'موثّق' },
}

export default function DashYourCommunities({ items = communities, loading = false }: { items?: Community[]; loading?: boolean }) {
  const { lang } = useDashPrefs()
  const t = TR[lang]

  return (
    <div className="rounded-[14px] overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--bd)', animation: 'dashFadeUp .4s .3s ease both' }}>
      <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--bd)' }}>
        <h3 className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>{t.title}</h3>
        <Link href="/creator/create-community" className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-[8px] transition-all cursor-pointer"
          style={{ border: '1px solid var(--bd)', color: 'var(--t2)', background: 'transparent' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--p2)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
          <Plus className="w-3 h-3" strokeWidth={2} />
          {t.createNew}
        </Link>
      </div>

      {loading ? [1, 2].map(item => (
        <div key={item} className="flex items-center gap-3.5 px-4 py-3.5 mx-4 my-3 rounded-[10px] animate-pulse"
          style={{ background: 'var(--p2)', border: '1px solid var(--bd)' }}>
          <div className="w-11 h-11 rounded-[10px]" style={{ background: 'var(--p3)' }} />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 rounded" style={{ background: 'var(--white)' }} />
            <div className="h-3 w-2/3 rounded" style={{ background: 'var(--white)' }} />
          </div>
        </div>
      )) : items.length === 0 ? (
        <div className="px-5 py-8 text-center text-[13px]" style={{ color: 'var(--t3)' }}>
          {lang === 'ar' ? 'لا توجد مجتمعات بعد' : 'No communities yet'}
        </div>
      ) : items.map(c => (
        <div key={c.name} className="flex items-center gap-3.5 px-4 py-3.5 mx-4 my-3 rounded-[10px] transition-all hover:shadow-[0_8px_24px_rgba(142,120,251,.14)]"
          style={{ background: 'var(--p2)', border: '1px solid var(--bd)' }}>

          {/* community icon — outline Users icon instead of emoji */}
          <div className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0"
            style={{ background: 'var(--p)' }}>
            <Users className="w-5 h-5 text-white" strokeWidth={1.6} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold mb-0.5" style={{ color: 'var(--t1)' }}>
              {c.name}
              {c.verified && (
                <span className="text-[11px] font-bold tracking-[.04em] px-1.5 py-0.5 rounded-[4px]"
                  style={{ background: 'var(--white)', color: 'var(--p)' }}>
                  {t.verified}
                </span>
              )}
            </div>
            <p className="text-[11px] truncate" style={{ color: 'var(--t3)' }}>
              {c.description}&nbsp;·&nbsp;{c.members} {t.members}&nbsp;·&nbsp;{c.category}&nbsp;·&nbsp;{c.plan}
            </p>
          </div>

          <div className="flex gap-1.5 shrink-0">
            <button className="text-[11px] font-medium px-2.5 py-1 rounded-[8px] transition-all cursor-pointer"
              style={{ border: '1px solid var(--bd)', color: 'var(--t2)', background: 'var(--white)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(142,120,251,.12)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
              {t.view}
            </button>
            <button className="text-[11px] font-medium px-2.5 py-1 rounded-[8px] text-white transition-opacity hover:opacity-90 cursor-pointer"
              style={{ background: 'var(--p)', border: 'none' }}>
              {t.customize}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
