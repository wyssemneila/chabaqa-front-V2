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
    ...community.courses.map(c => ({
      type: 'course' as const,
      title: isAr ? c.titleAr : c.title,
      status: c.enrolled ? (c.progress === 100 ? 'done' : 'active') : 'not_started' as const,
      progress: c.progress ?? 0,
      date: 'Apr 30, 2026',
    })),
    ...community.challenges.map(c => ({
      type: 'challenge' as const,
      title: isAr ? c.titleAr : c.title,
      status: c.status === 'ended' ? 'done' : c.status === 'active' ? 'active' : 'not_started' as const,
      progress: c.progress ?? 0,
      date: c.startDate,
    })),
  ]

  const done = allItems.filter(i => i.status === 'done').length
  const active = allItems.filter(i => i.status === 'active').length
  const total = allItems.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const circumference = 2 * Math.PI * 44

  const byType = [
    { label: isAr ? 'الكورسات' : 'Courses', Icon: BookOpen, items: community.courses, color: 'var(--p)', bg: 'var(--p2)',
      getDone: (items: typeof community.courses) => items.filter(i => (i as any).progress === 100).length },
    { label: isAr ? 'التحديات' : 'Challenges', Icon: Zap, items: community.challenges, color: 'var(--orange, #ff9b28)', bg: '#fff4e5',
      getDone: (items: typeof community.challenges) => items.filter(i => (i as any).status === 'ended').length },
  ]

  return (
    <div className="flex flex-col gap-5">

      {/* Overall progress card with ring */}
      <div className="rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-6"
        style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>

        {/* Ring */}
        <div className="relative flex-shrink-0" style={{ width: 116, height: 116 }}>
          <svg width="116" height="116" viewBox="0 0 116 116" aria-label={`${pct}% complete`}>
            <circle cx="58" cy="58" r="44" fill="none" stroke="var(--bg)" strokeWidth="12" />
            <circle cx="58" cy="58" r="44" fill="none" stroke="url(#pg)" strokeWidth="12" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={circumference * (1 - pct / 100)}
              transform="rotate(-90 58 58)" />
            <defs>
              <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--p)" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold" style={{ color: 'var(--t1)', lineHeight: 1 }}>{pct}%</span>
            <span className="text-[11px] mt-0.5" style={{ color: 'var(--t3)' }}>{isAr ? 'مكتمل' : 'Done'}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 flex-1 w-full">
          {[
            { value: done, label: isAr ? 'مكتمل' : 'Completed', color: '#10b981', bg: '#d1fae5' },
            { value: active, label: isAr ? 'جارٍ' : 'In Progress', color: 'var(--orange, #ff9b28)', bg: '#fff4e5' },
            { value: total, label: isAr ? 'الإجمالي' : 'Total', color: 'var(--t2)', bg: 'var(--bg)' },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1 py-3 rounded-xl" style={{ background: s.bg }}>
              <span className="text-xl font-extrabold" style={{ color: s.color }}>{s.value}</span>
              <span className="text-[11px] text-center leading-tight" style={{ color: 'var(--t3)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* By content type */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
        <h2 className="text-sm font-extrabold mb-4" style={{ color: 'var(--t1)' }}>
          {isAr ? 'التقدم حسب النوع' : 'Progress by Content Type'}
        </h2>
        <div className="flex flex-col gap-5">
          {byType.map(type => {
            const typeTotal = type.items.length
            if (typeTotal === 0) return null
            const typeDone = type.getDone(type.items as any)
            const typePct = Math.round((typeDone / typeTotal) * 100)
            const { Icon } = type
            return (
              <div key={type.label}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: type.bg }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: type.color }} strokeWidth={1.7} />
                    </div>
                    <span className="text-sm font-semibold" style={{ color: 'var(--t1)' }}>{type.label}</span>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'var(--bg)', color: 'var(--t3)' }}>
                      {typeTotal} {isAr ? 'عنصر' : 'items'}
                    </span>
                  </div>
                  <span className="text-sm font-extrabold" style={{ color: type.color }}>{typePct}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
                  <div className="h-2.5 rounded-full transition-all" style={{ width: `${typePct}%`, background: type.color }} />
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-[11px]" style={{ color: 'var(--t3)' }}>
                  <span className="font-semibold" style={{ color: '#10b981' }}>{typeDone} {isAr ? 'مكتمل' : 'done'}</span>
                  <span>{typeTotal - typeDone} {isAr ? 'متبقي' : 'remaining'}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
        <h2 className="text-sm font-extrabold mb-4" style={{ color: 'var(--t1)' }}>
          {isAr ? 'جدول التعلم' : 'Learning Timeline'}
        </h2>
        {allItems.length === 0 ? (
          <div className="text-center py-8">
            <BarChart2 className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--p)' }} strokeWidth={1.5} />
            <p className="text-sm" style={{ color: 'var(--t3)' }}>{isAr ? 'لا يوجد نشاط بعد' : 'No activity yet'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-0">
            {allItems.map((item, idx) => (
              <div key={idx} className="flex items-start gap-4 relative">
                {/* Timeline line */}
                {idx < allItems.length - 1 && (
                  <div className="absolute left-[18px] top-8 bottom-0 w-px" style={{ background: 'var(--bd)' }} />
                )}
                {/* Status icon */}
                <div className="flex-shrink-0 mt-0.5 z-10">
                  {item.status === 'done'
                    ? <CheckCircle2 className="w-[18px] h-[18px]" style={{ color: '#10b981' }} strokeWidth={2} />
                    : item.status === 'active'
                      ? <Loader2 className="w-[18px] h-[18px] animate-spin" style={{ color: 'var(--p)' }} strokeWidth={2} />
                      : <Circle className="w-[18px] h-[18px]" style={{ color: 'var(--bd)' }} strokeWidth={1.7} />
                  }
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold line-clamp-1" style={{ color: item.status === 'not_started' ? 'var(--t3)' : 'var(--t1)' }}>
                      {item.title}
                    </p>
                    <span className="text-[11px] flex-shrink-0 mt-0.5" style={{ color: 'var(--t3)' }}>{item.date}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={item.type === 'course'
                        ? { background: 'var(--p2)', color: 'var(--p)' }
                        : { background: '#fff4e5', color: 'var(--orange, #ff9b28)' }
                      }>
                      {item.type === 'course' ? (isAr ? 'كورس' : 'Course') : (isAr ? 'تحدي' : 'Challenge')}
                    </span>
                    {item.status === 'active' && item.progress > 0 && (
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${item.progress}%`, background: 'var(--p)' }} />
                        </div>
                        <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: 'var(--p)' }}>{item.progress}%</span>
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
