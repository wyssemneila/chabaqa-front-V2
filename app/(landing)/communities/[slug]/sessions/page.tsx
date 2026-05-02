import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { UserCheck, Clock, Star, CalendarCheck, Sparkles } from 'lucide-react'
import { getCommunity } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

export default async function SessionsPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  const avgRating = community.sessions.length > 0
    ? (community.sessions.reduce((a, s) => a + s.rating, 0) / community.sessions.length).toFixed(1)
    : '—'

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--t1)' }}>
          {isAr ? 'جلسات 1 على 1' : '1-on-1 Sessions'}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>
          {isAr ? 'إرشاد شخصي مباشر من خبراء المجتمع' : 'Direct personal mentorship from community experts'}
        </p>
      </div>

      {/* Promo banner */}
      <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, #f0ebff, #e8f4ff)', border: '1px solid var(--p3, #c4b8fd)' }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--p)', boxShadow: '0 8px 20px rgba(142,120,251,.35)' }}>
          <Sparkles className="w-5 h-5 text-white" strokeWidth={1.7} />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--t1)' }}>
            {isAr ? 'جلسة مخصصة تماماً لك' : 'Tailored just for you'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--t2)' }}>
            {isAr ? 'احصل على ملاحظات مباشرة على عملك وخطة تطوير شخصية' : 'Get direct feedback on your work and a personal growth plan'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: community.sessions.length, label: isAr ? 'جلسة متاحة' : 'Available', color: 'var(--p)', bg: 'var(--p2)', icon: <UserCheck className="w-4 h-4" strokeWidth={1.7} /> },
          { value: community.sessions.filter(s => s.booked).length, label: isAr ? 'محجوز' : 'Booked', color: '#10b981', bg: '#d1fae5', icon: <CalendarCheck className="w-4 h-4" strokeWidth={1.7} /> },
          { value: avgRating, label: isAr ? 'متوسط التقييم' : 'Avg Rating', color: '#ff9b28', bg: '#fff4e5', icon: <Star className="w-4 h-4" strokeWidth={1.7} /> },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <p className="text-lg font-extrabold leading-none" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--t3)' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Session cards */}
      {community.sessions.length === 0 ? (
        <div className="rounded-2xl p-14 text-center" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--p2)' }}>
            <UserCheck className="w-8 h-8" style={{ color: 'var(--p)' }} strokeWidth={1.3} />
          </div>
          <p className="text-base font-bold mb-1" style={{ color: 'var(--t1)' }}>
            {isAr ? 'لا توجد جلسات متاحة' : 'No sessions available'}
          </p>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>
            {isAr ? 'ترقبوا قريباً' : 'Check back soon'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {community.sessions.map(session => (
            <article key={session.id}
              className="group flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(142,120,251,.15)]"
              style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>

              {/* Top color accent */}
              <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${session.mentorColor}, ${session.mentorColor}80)` }} />

              <div className="p-5 flex flex-col flex-1">
                {/* Mentor info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-white text-base flex-shrink-0 shadow-lg"
                    style={{ background: session.mentorColor, boxShadow: `0 8px 20px ${session.mentorColor}55` }}>
                    {session.mentorInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold" style={{ color: 'var(--t1)' }}>{session.mentorName}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} viewBox="0 0 24 24" fill={i < Math.round(session.rating) ? '#ff9b28' : 'none'} stroke="#ff9b28" strokeWidth="1.5" width="11" height="11" aria-hidden="true">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      ))}
                      <span className="text-[11px] font-bold ml-0.5" style={{ color: 'var(--t2)' }}>{session.rating.toFixed(1)}</span>
                      <span className="text-[11px]" style={{ color: 'var(--t3)' }}>({session.reviewsCount})</span>
                    </div>
                  </div>
                  <span className="text-lg font-extrabold flex-shrink-0" style={{ color: 'var(--p)' }}>
                    {session.price} <span className="text-xs font-medium" style={{ color: 'var(--t3)' }}>{session.currency}</span>
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold mb-3 group-hover:text-[var(--p)] transition-colors leading-snug" style={{ color: 'var(--t1)' }}>
                  {session.title}
                </h3>

                {/* Meta */}
                <div className="flex items-center gap-4 mb-4 text-[11px]" style={{ color: 'var(--t3)' }}>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" strokeWidth={1.7} />
                    {session.duration} {isAr ? 'دقيقة' : 'min'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5" strokeWidth={1.7} />
                    {session.availableSlots} {isAr ? 'موعد متاح' : 'slots left'}
                  </span>
                </div>

                {/* Availability pill */}
                <div className="mb-4">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={session.availableSlots > 0
                      ? { background: '#d1fae5', color: '#10b981' }
                      : { background: '#fee2e2', color: '#ef4444' }
                    }>
                    {session.availableSlots > 0
                      ? (isAr ? `${session.availableSlots} مواعيد متاحة` : `${session.availableSlots} slots available`)
                      : (isAr ? 'محجوز بالكامل' : 'Fully booked')
                    }
                  </span>
                </div>

                {/* Book CTA */}
                <button
                  disabled={session.availableSlots === 0}
                  className="mt-auto w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: session.booked ? 'var(--p2)' : 'var(--p)', color: session.booked ? 'var(--p)' : '#fff' }}>
                  {session.booked
                    ? (isAr ? 'محجوز ✓' : 'Booked ✓')
                    : session.availableSlots === 0
                      ? (isAr ? 'لا مواعيد متاحة' : 'No slots available')
                      : (isAr ? 'احجز جلسة' : 'Book Session')
                  }
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
