import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { Calendar, Ticket, Video, MapPin, Clock, Users } from 'lucide-react'
import { getCommunity } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

export default async function EventsPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  const upcoming = community.events.filter(e => !e.registered)
  const myTickets = community.events.filter(e => e.registered)
  const totalSold = community.events.reduce((a, e) => a + e.ticketsSold, 0)

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--t1)' }}>
          {isAr ? 'الفعاليات' : 'Events'}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>
          {isAr ? 'اكتشف وسجل في الفعاليات القادمة' : 'Discover and register for upcoming events'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: upcoming.length, label: isAr ? 'فعاليات قادمة' : 'Upcoming', color: 'var(--p)', bg: 'var(--p2)', icon: <Calendar className="w-4 h-4" strokeWidth={1.7} /> },
          { value: myTickets.length, label: isAr ? 'تذاكري' : 'My Tickets', color: '#10b981', bg: '#d1fae5', icon: <Ticket className="w-4 h-4" strokeWidth={1.7} /> },
          { value: totalSold, label: isAr ? 'تذكرة مباعة' : 'Tickets Sold', color: 'var(--orange, #ff9b28)', bg: '#fff4e5', icon: <Users className="w-4 h-4" strokeWidth={1.7} /> },
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

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {[
          { label: isAr ? 'كل الفعاليات' : 'All Events', count: community.events.length, active: true },
          { label: isAr ? 'تذاكري' : 'My Tickets', count: myTickets.length, active: false },
        ].map((tab, i) => (
          <button key={i}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={tab.active
              ? { background: 'var(--p)', color: '#fff', boxShadow: '0 4px 12px rgba(142,120,251,.35)' }
              : { background: 'var(--white)', color: 'var(--t2)', border: '1px solid var(--bd)' }
            }>
            {tab.label}
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black"
              style={tab.active ? { background: 'rgba(255,255,255,.25)' } : { background: 'var(--bg)', color: 'var(--t3)' }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Events list */}
      {community.events.length === 0 ? (
        <div className="rounded-2xl p-14 text-center" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--p2)' }}>
            <Calendar className="w-8 h-8" style={{ color: 'var(--p)' }} strokeWidth={1.3} />
          </div>
          <p className="text-base font-bold mb-1" style={{ color: 'var(--t1)' }}>
            {isAr ? 'لا توجد فعاليات' : 'No events yet'}
          </p>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>
            {isAr ? 'ترقبوا قريباً' : 'Check back soon'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {community.events.map(event => {
            const pct = Math.round((event.ticketsSold / event.ticketsTotal) * 100)
            const soldOut = event.ticketsSold >= event.ticketsTotal
            const [month, day, year] = event.date.split(' ')
            const isOnline = event.type === 'online'
            return (
              <article key={event.id}
                className="group rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_12px_40px_rgba(142,120,251,.14)]"
                style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>

                <div className="p-5 flex items-start gap-5">

                  {/* Date card */}
                  <div className="rounded-2xl overflow-hidden flex-shrink-0 text-center" style={{ width: 60, border: '1px solid var(--bd)' }}>
                    <div className="py-1.5 text-[10px] font-extrabold text-white" style={{ background: 'var(--p)' }}>
                      {month?.toUpperCase()}
                    </div>
                    <div className="py-2 px-1">
                      <p className="text-2xl font-extrabold leading-none" style={{ color: 'var(--t1)' }}>{day?.replace(',', '')}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--t3)' }}>{year}</p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
                        style={isOnline
                          ? { background: 'var(--p2)', color: 'var(--p)' }
                          : { background: '#d1fae5', color: '#10b981' }
                        }>
                        {isOnline ? <Video className="w-3 h-3" strokeWidth={1.7} /> : <MapPin className="w-3 h-3" strokeWidth={1.7} />}
                        {isOnline ? (isAr ? 'أونلاين' : 'Online') : (isAr ? 'حضوري' : 'In-Person')}
                      </span>
                      {soldOut && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#fee2e2', color: '#ef4444' }}>
                          {isAr ? 'نفدت التذاكر' : 'Sold Out'}
                        </span>
                      )}
                      {event.registered && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#d1fae5', color: '#10b981' }}>
                          {isAr ? 'مسجل ✓' : 'Registered ✓'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold mb-1.5 group-hover:text-[var(--p)] transition-colors" style={{ color: 'var(--t1)' }}>
                      {event.title}
                    </h3>
                    <p className="text-xs leading-relaxed line-clamp-2 mb-3" style={{ color: 'var(--t2)' }}>
                      {event.description}
                    </p>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 mb-3 text-[11px]" style={{ color: 'var(--t3)' }}>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" strokeWidth={1.7} />{event.time}</span>
                      <span className="flex items-center gap-1">
                        <Ticket className="w-3 h-3" strokeWidth={1.7} />
                        {event.ticketsSold}/{event.ticketsTotal} {isAr ? 'تذكرة' : 'tickets'}
                      </span>
                    </div>

                    {/* Ticket progress */}
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: pct > 80 ? '#ef4444' : pct > 60 ? '#f59e0b' : 'var(--p)' }} />
                    </div>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--t3)' }}>
                      {event.ticketsTotal - event.ticketsSold} {isAr ? 'تذكرة متبقية' : 'tickets left'}
                    </p>
                  </div>

                  {/* Price + CTA */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-3 self-start">
                    <span className="text-base font-extrabold" style={{ color: event.price === 0 ? '#10b981' : 'var(--p)' }}>
                      {event.price === 0 ? (isAr ? 'مجاني' : 'Free') : `${event.price} ${event.currency ?? ''}`}
                    </span>
                    <button
                      disabled={soldOut && !event.registered}
                      className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={event.registered
                        ? { background: 'var(--p2)', color: 'var(--p)' }
                        : { background: 'var(--p)', color: '#fff' }
                      }>
                      {event.registered ? (isAr ? 'تذكرتي' : 'My Ticket') : soldOut ? (isAr ? 'نفدت' : 'Sold Out') : (isAr ? 'سجل الآن' : 'Register')}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
