'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import {
  Plus, Calendar, Globe, MapPin, Layers2,
  Ticket, Users, Clock, Tag, Pencil, Trash2,
  Inbox,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Event {
  id: string; title: string; description: string; category: string
  format: 'online' | 'offline' | 'hybrid'
  startDate: string; startTime: string; endDate: string; endTime: string
  coverPreview: string; status: 'draft' | 'published'
  tickets: { id:string; pricing:'free'|'paid'; price:number }[]
  capacity: number | 'unlimited'
}

// ─── Status + format config ───────────────────────────────────────────────────
const FORMAT_ICON  = { online: Globe, offline: MapPin, hybrid: Layers2 }
const FORMAT_COLOR = {
  online:  { bg:'var(--p2)',                   color:'var(--p)'      },
  offline: { bg:'rgba(251,146,60,.12)',         color:'var(--orange)' },
  hybrid:  { bg:'rgba(34,211,238,.12)',         color:'var(--cyan)'   },
}
const STATUS_STYLE = {
  published: { bg:'rgba(74,222,128,.12)', color:'#16a34a', border:'rgba(74,222,128,.3)'  },
  draft:     { bg:'var(--bg)',            color:'var(--t3)', border:'var(--bd)'           },
}

export default function EventsPage() {
  const router  = useRouter()
  const { lang } = useDashPrefs()

  const [events,  setEvents]  = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('chabaqa_events')
      setEvents(raw ? JSON.parse(raw) : [])
    } catch { setEvents([]) }
    finally   { setLoading(false) }
  }, [])

  const deleteEvent = (id: string) => {
    const next = events.filter(e => e.id !== id)
    setEvents(next)
    localStorage.setItem('chabaqa_events', JSON.stringify(next))
  }

  const T = {
    title:    lang==='ar'?'الفعاليات':'Events',
    subtitle: lang==='ar'?'أنشئ وأدر فعاليات مجتمعك':'Create and manage your community events',
    create:   lang==='ar'?'إنشاء فعالية':'Create Event',
    empty:    lang==='ar'?'لا توجد فعاليات بعد':'No events yet',
    emptyDesc:lang==='ar'?'أنشئ أول فعالية لمجتمعك':'Create your first event for the community',
    edit:     lang==='ar'?'تعديل':'Edit',
    delete:   lang==='ar'?'حذف':'Delete',
    draft:    lang==='ar'?'مسودة':'Draft',
    published:lang==='ar'?'منشور':'Published',
    free:     lang==='ar'?'مجاني':'Free',
    online:   lang==='ar'?'أونلاين':'Online',
    offline:  lang==='ar'?'حضوري':'In-Person',
    hybrid:   lang==='ar'?'هجين':'Hybrid',
    seats:    lang==='ar'?'مقعد':'seat',
    unlimited:lang==='ar'?'غير محدود':'Unlimited',
    tickets:  lang==='ar'?'تذاكر':'tickets',
  }

  const formatLabel = { online:T.online, offline:T.offline, hybrid:T.hybrid }

  return (
    <>
      <style>{`
        @keyframes dashFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-thumb{background:var(--p3);border-radius:10px}
      `}</style>

      <div className="flex min-h-screen" style={{ background:'var(--bg)' }}>
        <DashSidebar />

        <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar title={T.title} subtitle={T.subtitle} />

          <main className="p-7 flex-1" style={{ animation:'dashFadeUp .4s ease both' }}>

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-[13px] font-semibold" style={{ color:'var(--t3)' }}>
                {events.length} {lang==='ar'?'فعالية':'event'}{events.length!==1&&lang==='en'?'s':''}
              </p>
              <button onClick={() => router.push('/creator/events/create')}
                className="flex items-center gap-2 h-9 px-4 rounded-xl text-[12px] font-bold text-white
                           cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background:'var(--p)' }}>
                <Plus className="w-4 h-4" strokeWidth={1.7} /> {T.create}
              </button>
            </div>

            {/* Loading */}
            {loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 rounded-full border-2 border-[var(--p3)] border-t-[var(--p)] animate-spin" />
              </div>
            ) : events.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed"
                style={{ borderColor:'var(--bd)', background:'var(--white)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background:'var(--p2)' }}>
                  <Calendar className="w-8 h-8" style={{ color:'var(--p)' }} strokeWidth={1.7} />
                </div>
                <p className="text-[15px] font-bold mb-1.5" style={{ color:'var(--t1)' }}>{T.empty}</p>
                <p className="text-[13px] mb-6" style={{ color:'var(--t3)' }}>{T.emptyDesc}</p>
                <button onClick={() => router.push('/creator/events/create')}
                  className="flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-bold text-white
                             cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ background:'var(--p)' }}>
                  <Plus className="w-4 h-4" strokeWidth={1.7} /> {T.create}
                </button>
              </div>
            ) : (
              /* Events grid */
              <div className="grid grid-cols-1 gap-4 max-w-4xl">
                {events.map((ev, i) => {
                  const FormatIcon = FORMAT_ICON[ev.format]
                  const fmtColor   = FORMAT_COLOR[ev.format]
                  const stStatus   = STATUS_STYLE[ev.status]
                  const minPrice   = ev.tickets.filter(t=>t.pricing==='paid').map(t=>t.price)
                  const lowestPrice = minPrice.length ? Math.min(...minPrice) : null

                  return (
                    <div key={ev.id}
                      className="flex gap-4 rounded-2xl overflow-hidden transition-all duration-200"
                      style={{
                        background:'var(--white)', border:'1px solid var(--bd)',
                        animation:`dashFadeUp .3s ${i*60}ms ease both`,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,.07)')}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow='none')}>

                      {/* Cover */}
                      <div className="w-[140px] shrink-0 relative"
                        style={{ background: ev.coverPreview ? 'transparent' : 'linear-gradient(135deg,var(--p) 0%,#6c52f0 100%)' }}>
                        {ev.coverPreview
                          ? <img src={ev.coverPreview} alt="" className="w-full h-full object-cover" />
                          : <div className="absolute inset-0 flex items-center justify-center">
                              <Calendar className="w-8 h-8 text-white opacity-40" strokeWidth={1.7} />
                            </div>
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 py-4 pr-4 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <p className="text-[14px] font-bold truncate" style={{ color:'var(--t1)' }}>{ev.title}</p>
                              {/* Status badge */}
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border"
                                style={{ background:stStatus.bg, color:stStatus.color, borderColor:stStatus.border }}>
                                {ev.status==='published'?T.published:T.draft}
                              </span>
                            </div>
                            <p className="text-[12px] truncate" style={{ color:'var(--t2)' }}>{ev.description}</p>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => router.push(`/creator/events/${ev.id}/edit`)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
                              style={{ background:'var(--bg)', color:'var(--t3)' }}>
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteEvent(ev.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
                              style={{ background:'rgba(239,68,68,.08)', color:'#ef4444' }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Meta chips */}
                        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                          {/* Format */}
                          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background:fmtColor.bg, color:fmtColor.color }}>
                            <FormatIcon className="w-2.5 h-2.5" strokeWidth={1.7} />
                            {formatLabel[ev.format]}
                          </span>
                          {/* Date */}
                          {ev.startDate && (
                            <span className="flex items-center gap-1 text-[11px]" style={{ color:'var(--t3)' }}>
                              <Calendar className="w-3 h-3" strokeWidth={1.7} />
                              {ev.startDate}{ev.startTime && `, ${ev.startTime}`}
                            </span>
                          )}
                          {/* Category */}
                          {ev.category && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background:'var(--p2)', color:'var(--p)' }}>
                              <Tag className="w-2.5 h-2.5" strokeWidth={1.7} />
                              {ev.category}
                            </span>
                          )}
                          {/* Tickets */}
                          {ev.tickets.length > 0 && (
                            <span className="flex items-center gap-1 text-[11px]" style={{ color:'var(--t3)' }}>
                              <Ticket className="w-3 h-3" strokeWidth={1.7} />
                              {ev.tickets.length} {T.tickets}
                              {lowestPrice !== null && ` · ${lang==='ar'?'من':'from'} ${lowestPrice} ${lang==='ar'?'د.ت':'TND'}`}
                              {lowestPrice === null && ` · ${T.free}`}
                            </span>
                          )}
                          {/* Capacity */}
                          <span className="flex items-center gap-1 text-[11px]" style={{ color:'var(--t3)' }}>
                            <Users className="w-3 h-3" strokeWidth={1.7} />
                            {ev.capacity==='unlimited' ? T.unlimited : `${ev.capacity} ${T.seats}s`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  )
}
