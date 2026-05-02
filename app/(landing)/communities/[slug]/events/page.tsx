import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { Calendar, Ticket, Video, MapPin } from 'lucide-react'
import { getCommunity } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

export default async function EventsPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-extrabold" style={{ color: 'var(--t1)' }}>{isAr ? 'الفعاليات' : 'Events'}</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>{isAr ? 'اكتشف وسجل في الفعاليات القادمة' : 'Discover and register for upcoming events'}</p>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {[
          { value: community.events.filter(e => !e.registered).length, label: isAr ? 'فعالية قادمة' : 'Upcoming', color: 'var(--p)' },
          { value: community.events.filter(e => e.registered).length, label: isAr ? 'تذاكري' : 'My Tickets', color: 'var(--cyan)' },
          { value: community.events.reduce((a, e) => a + e.ticketsSold, 0), label: isAr ? 'تذكرة مباعة' : 'Sold', color: 'var(--orange)' },
        ].map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5 px-4 py-3 rounded-2xl flex-shrink-0" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
            <span className="text-lg font-extrabold" style={{ color: s.color }}>{s.value}</span>
            <span className="text-[10px]" style={{ color: 'var(--t3)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1">
        {[isAr ? 'المتاحة' : 'Available', isAr ? 'تذاكري' : 'My Tickets', isAr ? 'التقويم' : 'Calendar'].map((tab, i) => (
          <button key={i} className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={i === 0 ? { background: 'var(--p)', color: '#fff' } : { color: 'var(--t2)', background: 'var(--white)', border: '1px solid var(--bd)' }}>
            {tab}
          </button>
        ))}
      </div>

      {community.events.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
          <Calendar className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--p3)' }} strokeWidth={1.5} />
          <p className="text-sm font-semibold" style={{ color: 'var(--t2)' }}>{isAr ? 'لا توجد فعاليات' : 'No Events Available'}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--t3)' }}>{isAr ? 'ترقبوا قريباً' : 'Check back later for upcoming events'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {community.events.map(event => {
            const pct = Math.round((event.ticketsSold / event.ticketsTotal) * 100)
            return (
              <article key={event.id} className="group rounded-2xl p-5 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(142,120,251,.12)] cursor-pointer" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                <div className="flex items-start gap-4">
                  <div className="w-14 rounded-2xl overflow-hidden flex-shrink-0 text-center" style={{ border: '1px solid var(--bd)' }}>
                    <div className="py-1 text-[10px] font-bold text-white" style={{ background: 'var(--p)' }}>{event.date.split(' ')[0]}</div>
                    <div className="py-2">
                      <p className="text-xl font-extrabold leading-none" style={{ color: 'var(--t1)' }}>{event.date.split(' ')[1]?.replace(',','')}</p>
                      <p className="text-[9px] mt-0.5" style={{ color: 'var(--t3)' }}>{event.date.split(' ')[2]}</p>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: event.type === 'online' ? '#ede9ff' : '#d1fae5', color: event.type === 'online' ? 'var(--p)' : '#10b981' }}>
                        {event.type === 'online' ? <Video className="w-3 h-3" strokeWidth={1.7} /> : <MapPin className="w-3 h-3" strokeWidth={1.7} />}
                        {event.type === 'online' ? (isAr ? 'أونلاين' : 'Online') : (isAr ? 'حضوري' : 'In-Person')}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold mb-1.5 group-hover:text-[var(--p)] transition-colors" style={{ color: 'var(--t1)' }}>{event.title}</h3>
                    <p className="text-xs line-clamp-2 leading-relaxed mb-3" style={{ color: 'var(--t2)' }}>{event.description}</p>
                    <div className="flex items-center gap-4 text-[11px] mb-3" style={{ color: 'var(--t3)' }}>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" strokeWidth={1.7} />{event.time}</span>
                      <span className="flex items-center gap-1"><Ticket className="w-3 h-3" strokeWidth={1.7} />{event.ticketsSold}/{event.ticketsTotal} {isAr ? 'تذكرة' : 'tickets'}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--bg)' }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: pct > 80 ? '#ef4444' : 'var(--p)' }} />
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-2 self-start">
                    <span className="text-sm font-extrabold" style={{ color: event.price === 0 ? '#10b981' : 'var(--p)' }}>
                      {event.price === 0 ? (isAr ? 'مجاني' : 'Free') : `${event.price} ${event.currency}`}
                    </span>
                    <button className="px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80" style={{ background: 'var(--p)', color: '#fff' }}>
                      {isAr ? 'سجل الآن' : 'Register'}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  )
}
