'use client'

import { activityItems } from '@/lib/dashboard-data'
import { useDashPrefs } from '@/hooks/use-dash-prefs'

const dotColor: Record<string, string> = {
  challenge: '#ff9b28',
  course:    '#8e78fb',
  post:      '#9590b8',
}
const typeColor: Record<string, string> = {
  challenge: '#cc7a00',
  course:    '#8e78fb',
  post:      '#9590b8',
}

const TYPE_LABEL_AR: Record<string, string> = {
  challenge: 'تحدي جديد',
  course:    'دورة جديدة',
  post:      'منشور جديد',
}

export default function DashRecentActivity() {
  const { lang } = useDashPrefs()

  const title   = lang === 'ar' ? 'النشاط الأخير'    : 'Recent Activity'
  const subtext = lang === 'ar' ? 'آخر التفاعلات'    : 'Latest interactions'

  return (
    <div className="rounded-[14px] overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
      <div className="px-5 pt-4 pb-3 flex items-baseline justify-between" style={{ borderBottom: '1px solid var(--bd)' }}>
        <h3 className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>{title}</h3>
        <span className="text-[11px]" style={{ color: 'var(--t3)' }}>{subtext}</span>
      </div>

      <div>
        {activityItems.map((item, i) => (
          <div key={i} className="flex items-start gap-3 px-5 py-3 transition-colors"
            style={{ borderBottom: i < activityItems.length - 1 ? '1px solid var(--bd)' : 'none' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--p2)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
            <div className="w-2 h-2 rounded-full mt-[5px] shrink-0"
              style={{ background: dotColor[item.type] }} />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[.05em] mb-0.5"
                style={{ color: typeColor[item.type] }}>
                {lang === 'ar' ? (TYPE_LABEL_AR[item.type] ?? item.label) : item.label}
              </p>
              <p className="text-[13px] truncate" style={{ color: 'var(--t1)' }}>{item.name}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--t3)' }}>{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
