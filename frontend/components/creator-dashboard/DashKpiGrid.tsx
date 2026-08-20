'use client'

import { Users, BookOpen, Zap, Calendar, DollarSign, Activity } from 'lucide-react'
import { kpiCards, type KpiCard, type TrendDir } from '@/lib/dashboard-data'
import { useDashPrefs } from '@/hooks/use-dash-prefs'

const ICON_MAP: Record<string, any> = {
  users:    Users,
  book:     BookOpen,
  bolt:     Zap,
  calendar: Calendar,
  dollar:   DollarSign,
  pulse:    Activity,
}

const LABELS: Record<string, { en: string; ar: string }> = {
  'Total Members':    { en: 'Total Members',    ar: 'إجمالي الأعضاء' },
  'Total Courses':    { en: 'Total Courses',    ar: 'إجمالي الدورات' },
  'Total Challenges': { en: 'Total Challenges', ar: 'إجمالي التحديات' },
  'Total Sessions':   { en: 'Total Sessions',   ar: 'إجمالي الجلسات' },
  'Total Revenue':    { en: 'Total Revenue',    ar: 'إجمالي الإيرادات' },
  'Avg. Engagement':  { en: 'Avg. Engagement',  ar: 'متوسط التفاعل' },
}

function trendStyle(dir: TrendDir): React.CSSProperties {
  if (dir === 'up')   return { background: 'rgba(26,122,74,.1)',  color: '#1a7a4a' }
  if (dir === 'down') return { background: 'rgba(184,50,50,.1)',  color: '#b83232' }
  return { background: 'var(--p2)', color: 'var(--t3)' }
}

function KpiCardUI({ card, lang }: { card: KpiCard; lang: 'en' | 'ar' }) {
  const Icon = ICON_MAP[card.icon] ?? Activity
  const label = LABELS[card.label]?.[lang] ?? card.label

  return (
    <div className="rounded-[14px] p-[18px_20px] transition-all hover:-translate-y-[2px] hover:shadow-[0_16px_48px_rgba(142,120,251,.18)]"
      style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[.05em] mb-2"
        style={{ color: 'var(--t3)' }}>
        <div className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0"
          style={{ background: card.iconBg }}>
          <Icon className="w-3.5 h-3.5" strokeWidth={1.7} style={{ color: card.iconColor }} />
        </div>
        {label}
      </div>
      <div className="text-[28px] font-semibold leading-none mb-2 font-mono"
        style={{ color: 'var(--t1)' }}>
        {card.value}
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
          style={trendStyle(card.trendDir)}>
          {card.trend}
        </span>
        {card.label === 'Total Revenue' && (
          <span className="text-[11px]" style={{ color: 'var(--t3)' }}>TND</span>
        )}
      </div>
    </div>
  )
}

export default function DashKpiGrid() {
  const { lang } = useDashPrefs()
  const title = lang === 'ar' ? 'نظرة عامة على الأداء' : 'Performance overview'

  return (
    <section className="mb-6" style={{ animation: 'dashFadeUp .4s .1s ease both' }}>
      <p className="text-[12px] font-semibold tracking-[.05em] uppercase mb-3" style={{ color: 'var(--t3)' }}>
        {title}
      </p>
      <div className="grid grid-cols-3 gap-3">
        {kpiCards.map(card => <KpiCardUI key={card.label} card={card} lang={lang} />)}
      </div>
    </section>
  )
}
