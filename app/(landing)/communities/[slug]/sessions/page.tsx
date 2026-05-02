import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { UserCheck, Clock, Star, Calendar } from 'lucide-react'
import { getCommunity } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

export default async function SessionsPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-extrabold" style={{ color: 'var(--t1)' }}>{isAr ? 'جلسات 1-على-1' : '1-on-1 Sessions'}</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>{isAr ? 'احصل على إرشاد شخصي من خبراء المجتمع' : 'Get personalized mentorship from community experts'}</p>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {[
          { value: community.sessions.filter(s => s.booked).length, label: isAr ? 'محجوز' : 'Booked', color: 'var(--p)' },
          { value: community.sessions.length, label: isAr ? 'متاح' : 'Available', color: 'var(--cyan)' },
          { value: community.sessions.length > 0 ? community.sessions[0].rating.toFixed(1) : '—', label: isAr ? 'التقييم' : 'Avg Rating', color: 'var(--orange)' },
        ].map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5 px-4 py-3 rounded-2xl flex-shrink-0" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
            <span className="text-lg font-extrabold" style={{ color: s.color }}>{s.value}</span>
            <span className="text-[10px]" style={{ color: 'var(--t3)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1">
        {[isAr ? 'المتاحة' : 'Available', isAr ? 'جلساتي' : 'My Sessions', isAr ? 'التقويم' : 'Calendar'].map((tab, i) => (
          <button key={i} className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={i === 0 ? { background: 'var(--p)', color: '#fff' } : { color: 'var(--t2)', background: 'var(--white)', border: '1px solid var(--bd)' }}>
            {tab}
          </button>
        ))}
      </div>

      {community.sessions.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
          <UserCheck className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--p3)' }} strokeWidth={1.5} />
          <p className="text-sm font-semibold" style={{ color: 'var(--t2)' }}>{isAr ? 'لا توجد جلسات بعد' : 'No Sessions Booked'}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--t3)' }}>{isAr ? 'احجز جلستك الأولى مع مرشد' : 'Book your first 1-on-1 session to get personalized guidance'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {community.sessions.map(session => (
            <article key={session.id} className="group rounded-2xl p-5 transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_16px_48px_rgba(142,120,251,.18)] cursor-pointer" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0" style={{ background: session.mentorColor }}>{session.mentorInitials}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--t1)' }}>{session.mentorName}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <svg viewBox="0 0 24 24" fill="#ff9b28" width="11" height="11" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <span className="text-xs font-semibold" style={{ color: 'var(--t2)' }}>{session.rating.toFixed(1)}</span>
                    <span className="text-xs" style={{ color: 'var(--t3)' }}>({session.reviewsCount})</span>
                  </div>
                </div>
                <span className="text-sm font-extrabold flex-shrink-0" style={{ color: 'var(--p)' }}>{session.price} {session.currency}</span>
              </div>
              <h3 className="text-sm font-bold mb-3 group-hover:text-[var(--p)] transition-colors" style={{ color: 'var(--t1)' }}>{session.title}</h3>
              <div className="flex items-center gap-4 mb-4 text-[11px]" style={{ color: 'var(--t3)' }}>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" strokeWidth={1.7} />{session.duration} min</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" strokeWidth={1.7} />{session.availableSlots} {isAr ? 'متاح' : 'slots'}</span>
              </div>
              <button className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80" style={{ background: 'var(--p)', color: '#fff' }}>
                {isAr ? 'احجز الآن' : 'Book Session'}
              </button>
            </article>
          ))}
        </div>
      )}
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  )
}
