'use client'

import { useState } from 'react'
import { BookOpen, Zap, Calendar, FileText, Pencil } from 'lucide-react'
import { contentItems, type ContentItem } from '@/lib/dashboard-data'
import { useDashPrefs } from '@/hooks/use-dash-prefs'

const TYPE_ICON: Record<ContentItem['type'], any> = {
  Course:    BookOpen,
  Challenge: Zap,
  Session:   Calendar,
  Post:      FileText,
}

const TYPE_STYLE: Record<ContentItem['type'], React.CSSProperties> = {
  Course:    { background: 'var(--p2)',    color: 'var(--p)' },
  Challenge: { background: '#fff3e4',      color: '#cc7a00'  },
  Session:   { background: '#e4f8fd',      color: '#0e7a8a'  },
  Post:      { background: 'var(--bg)',    color: 'var(--t3)' },
}

const TYPE_ICON_BG: Record<ContentItem['type'], string> = {
  Course:    'var(--p2)',
  Challenge: '#fff3e4',
  Session:   '#e4f8fd',
  Post:      'var(--bg)',
}

const TR = {
  en: {
    title: 'Your Content', sub: 'Share to get your first students',
    tabs: { All: 'All', Courses: 'Courses', Challenges: 'Challenges', Sessions: 'Sessions', Posts: 'Posts' },
    typeLabel: { Course: 'Course', Challenge: 'Challenge', Session: 'Session', Post: 'Post' },
    noItems: (t: string) => `No ${t.toLowerCase()} yet`,
    share: 'Share link →',
    edit: 'Edit',
  },
  ar: {
    title: 'محتواك', sub: 'شارك للحصول على طلابك الأوائل',
    tabs: { All: 'الكل', Courses: 'الدورات', Challenges: 'التحديات', Sessions: 'الجلسات', Posts: 'المنشورات' },
    typeLabel: { Course: 'دورة', Challenge: 'تحدي', Session: 'جلسة', Post: 'منشور' },
    noItems: (tab: string) => `لا يوجد ${tab} بعد`,
    share: '← مشاركة الرابط',
    edit: 'تعديل',
  },
}

const TABS = ['All', 'Courses', 'Challenges', 'Sessions', 'Posts'] as const
type Tab = typeof TABS[number]

const TAB_TYPE_MAP: Record<Tab, ContentItem['type'] | null> = {
  All: null, Courses: 'Course', Challenges: 'Challenge', Sessions: 'Session', Posts: 'Post',
}

export default function DashYourContent({ items = contentItems, loading = false }: { items?: ContentItem[]; loading?: boolean }) {
  const { lang } = useDashPrefs()
  const t = TR[lang]
  const [activeTab, setActiveTab] = useState<Tab>('All')

  const filtered = activeTab === 'All'
    ? items
    : items.filter(i => i.type === TAB_TYPE_MAP[activeTab])

  return (
    <div className="rounded-[14px] overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
      {/* header */}
      <div className="px-5 pt-4 pb-3 flex items-baseline justify-between" style={{ borderBottom: '1px solid var(--bd)' }}>
        <h3 className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>{t.title}</h3>
        <span className="text-[11px]" style={{ color: 'var(--t3)' }}>{t.sub}</span>
      </div>

      {/* tabs */}
      <div className="flex gap-0.5 px-4 pt-3 pb-2 overflow-x-auto" style={{ borderBottom: '1px solid var(--bd)' }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-3 py-1.5 rounded-[6px] text-xs whitespace-nowrap transition-all cursor-pointer"
            style={{
              background: activeTab === tab ? 'var(--p2)' : 'transparent',
              color: activeTab === tab ? 'var(--p)' : 'var(--t3)',
              fontWeight: activeTab === tab ? 600 : 400,
              border: 'none',
            }}>
            {t.tabs[tab]}
          </button>
        ))}
      </div>

      {/* list */}
      <div>
        {loading ? (
          [1, 2, 3].map(item => (
            <div key={item} className="flex items-center gap-3 px-5 py-3 animate-pulse" style={{ borderBottom: '1px solid var(--bd)' }}>
              <div className="w-10 h-10 rounded-[10px]" style={{ background: 'var(--bg)' }} />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded" style={{ background: 'var(--bg)' }} />
                <div className="h-3 w-1/2 rounded" style={{ background: 'var(--bg)' }} />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px]" style={{ color: 'var(--t3)' }}>
            {t.noItems(t.tabs[activeTab])}
          </div>
        ) : filtered.map((item, i) => {
          const Icon = TYPE_ICON[item.type]
          const iconColor = TYPE_STYLE[item.type].color as string
          return (
            <div key={i} className="flex items-center gap-3 px-5 py-3 transition-colors cursor-default"
              style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--bd)' : 'none' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--p2)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>

              {/* outline icon instead of emoji */}
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                style={{ background: TYPE_ICON_BG[item.type], border: '1.5px solid var(--bd)' }}>
                <Icon className="w-5 h-5" strokeWidth={1.6} style={{ color: iconColor }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate mb-1" style={{ color: 'var(--t1)' }}>{item.name}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-[4px]" style={TYPE_STYLE[item.type]}>
                    {t.typeLabel[item.type]}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--t3)' }}>
                    {item.enrollPrompt} —{' '}
                    <a href="#" className="font-medium hover:opacity-70" style={{ color: 'var(--p)' }}>{t.share}</a>
                  </span>
                </div>
              </div>

              <button className="flex items-center gap-1 text-[11px] font-medium transition-opacity hover:opacity-70 shrink-0 cursor-pointer"
                style={{ color: 'var(--p)', background: 'transparent', border: 'none' }}>
                {t.edit} <Pencil className="w-3 h-3" strokeWidth={1.7} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
