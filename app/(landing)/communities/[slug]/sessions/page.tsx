import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { UserCheck, Clock, Star, CalendarCheck } from 'lucide-react'
import { getCommunity } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

export default async function SessionsPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  return (
    <div className="flex flex-col gap-5">

      {/* Session cards */}
      {community.sessions.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--p2)' }}>
            <UserCheck className="w-7 h-7" style={{ color: 'var(--p)' }} strokeWidth={1.3} />
          </div>
          <p className="text-base font-bold mb-1" style={{ color: 'var(--t1)' }}>
            {isAr ? 'لا توجد جلسات متاحة' : 'No sessions available'}
          </p>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>
            {isAr ? 'ترقبوا قريباً' : 'Check back soon'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {community.sessions.map(session => (
            <article key={session.id}
              className="group flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-shadow duration-200 hover:shadow-md"
              style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>

              <div className="p-5 flex flex-col flex-1 gap-4">
                {/* Mentor info */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-white text-sm flex-shrink-0"
                    style={{ background: session.mentorColor }}>
                    {session.mentorInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold" style={{ color: 'var(--t1)' }}>{session.mentorName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} viewBox="0 0 24 24" fill={i < Math.round(session.rating) ? '#ff9b28' : 'none'} stroke="#ff9b28" strokeWidth="1.5" width="11" height="11" aria-hidden="true">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      ))}
                      <span className="text-[11px] font-semibold ml-0.5" style={{ color: 'var(--t2)' }}>{session.rating.toFixed(1)}</span>
                      <span className="text-[11px]" style={{ color: 'var(--t3)' }}>({session.reviewsCount})</span>
                    </div>
                  </div>
                  <span className="text-lg font-extrabold flex-shrink-0" style={{ color: 'var(--p)' }}>
                    {session.price} <span className="text-xs font-medium" style={{ color: 'var(--t3)' }}>{session.currency}</span>
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold group-hover:text-[var(--p)] transition-colors leading-snug" style={{ color: 'var(--t1)' }}>
                  {session.title}
                </h3>

                {/* Meta */}
                <div className="flex items-center gap-4 text-[11px]" style={{ color: 'var(--t3)' }}>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" strokeWidth={1.7} />
                    {session.duration} {isAr ? 'دقيقة' : 'min'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5" strokeWidth={1.7} />
                    {session.availableSlots} {isAr ? 'موعد متاح' : 'slots left'}
                  </span>
                </div>

                {/* Book CTA */}
                <button
                  disabled={session.availableSlots === 0}
                  className="mt-auto w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
