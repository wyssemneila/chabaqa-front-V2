import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { BookOpen, Zap, BarChart2, CheckCircle2, Loader2, Circle } from 'lucide-react'
import { getCommunity } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

export default async function ProgressPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  const allItems = [
    ...community.courses.map(c => ({ type: 'course' as const, title: isAr ? c.titleAr : c.title, status: c.enrolled ? (c.progress === 100 ? 'done' : 'active') : 'not_started' as const, progress: c.progress ?? 0, date: 'Apr 30, 2026' })),
    ...community.challenges.map(c => ({ type: 'challenge' as const, title: isAr ? c.titleAr : c.title, status: c.status === 'ended' ? 'done' : c.status === 'active' ? 'active' : 'not_started' as const, progress: c.progress ?? 0, date: c.startDate })),
  ]

  const done = allItems.filter(i => i.status === 'done').length
  const active = allItems.filter(i => i.status === 'active').length
  const total = allItems.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const circumference = 2 * Math.PI * 44

  const byType = [
    { label: isAr ? 'الكورسات' : 'Courses', icon: <BookOpen className="w-4 h-4" strokeWidth={1.7} />, items: community.courses, color: 'var(--p)' },
    { label: isAr ? 'التحديات' : 'Challenges', icon: <Zap className="w-4 h-4" strokeWidth={1.7} />, items: community.challenges, color: 'var(--orange)' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-extrabold" style={{ color: 'var(--t1)' }}>{isAr ? 'تقدمي' : 'My Progress'}</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>{isAr ? 'تابع رحلتك في المجتمع' : `Your journey in ${community.name}`}</p>
      </div>

      {/* Overall */}
      <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
        <div className="relative flex-shrink-0" style={{ width: 108, height: 108 }}>
          <svg width="108" height="108" viewBox="0 0 108 108" aria-label={`${pct}% completion`}>
            <circle cx="54" cy="54" r="44" fill="none" stroke="var(--bg)" strokeWidth="10" />
            <circle cx="54" cy="54" r="44" fill="none" stroke="var(--p)" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={circumference * (1 - pct / 100)} transform="rotate(-90 54 54)" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black" style={{ color: 'var(--t1)' }}>{pct}%</span>
            <span className="text-[9px]" style={{ color: 'var(--t3)' }}>{isAr ? 'مكتمل' : 'Done'}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 w-full">
          {[
            { value: pct + '%', label: isAr ? 'الإتمام' : 'Completion', color: 'var(--p)' },
            { value: done, label: isAr ? 'مكتمل' : 'Completed', color: '#10b981' },
            { value: active, label: isAr ? 'جاري' : 'In Progress', color: 'var(--orange)' },
            { value: total, label: isAr ? 'الإجمالي' : 'Total', color: 'var(--t2)' },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5 py-3 rounded-2xl" style={{ background: 'var(--bg)' }}>
              <span className="text-lg font-extrabold" style={{ color: s.color }}>{s.value}</span>
              <span className="text-[10px] text-center leading-tight" style={{ color: 'var(--t3)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* By type */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--t1)' }}>{isAr ? 'التقدم حسب النوع' : 'Progress by Content Type'}</h3>
        <div className="flex flex-col gap-4">
          {byType.map(type => {
            const typeTotal = type.items.length
            if (typeTotal === 0) return null
            const typeDone = type.items.filter(i => (i as any).progress === 100 || (i as any).status === 'ended').length
            const typePct = Math.round((typeDone / typeTotal) * 100)
            return (
              <div key={type.label}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span style={{ color: type.color }}>{type.icon}</span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--t1)' }}>{type.label}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg)', color: 'var(--t3)' }}>{typeTotal} {isAr ? 'عنصر' : 'items'}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: type.color }}>{typePct}%</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
                  <div className="h-2 rounded-full" style={{ width: `${typePct}%`, background: type.color }} />
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-[10px]" style={{ color: 'var(--t3)' }}>
                  <span>{typeDone} {isAr ? 'مكتمل' : 'done'}</span>
                  <span>{typeTotal - typeDone} {isAr ? 'متبقي' : 'left'}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--t1)' }}>{isAr ? 'جدول التعلم' : 'Learning Timeline'}</h3>
        {allItems.length === 0 ? (
          <div className="text-center py-8">
            <BarChart2 className="w-7 h-7 mx-auto mb-2" style={{ color: 'var(--p3)' }} strokeWidth={1.5} />
            <p className="text-xs" style={{ color: 'var(--t3)' }}>{isAr ? 'لا يوجد نشاط بعد' : 'No activity yet'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {allItems.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {item.status === 'done' ? <CheckCircle2 className="w-4 h-4" style={{ color: '#10b981' }} strokeWidth={2} />
                    : item.status === 'active' ? <Loader2 className="w-4 h-4" style={{ color: 'var(--p)' }} strokeWidth={2} />
                    : <Circle className="w-4 h-4" style={{ color: 'var(--t3)' }} strokeWidth={1.7} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold line-clamp-1" style={{ color: 'var(--t1)' }}>{item.title}</p>
                    <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--t3)' }}>{item.date}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                      style={item.type === 'course' ? { background: 'var(--p2)', color: 'var(--p)' } : { background: '#fff4e5', color: 'var(--orange)' }}>
                      {item.type === 'course' ? (isAr ? 'كورس' : 'Course') : (isAr ? 'تحدي' : 'Challenge')}
                    </span>
                    {item.status === 'active' && (
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${item.progress}%`, background: 'var(--p)' }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
