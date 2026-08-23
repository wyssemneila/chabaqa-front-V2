'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { CommunityEvent } from '@/lib/community-data'
import {
  Calendar, MapPin, Globe, Users, Ticket, Search,
  LayoutList, CalendarDays, ChevronLeft, ChevronRight,
  Plus, Pencil, Eye,
} from 'lucide-react'

interface Props {
  slug: string
  events: CommunityEvent[]
  communityName: string
  locale: string
  isAdmin?: boolean
}

const TYPE_CONFIG = {
  online:      { label: 'Online',    labelAr: 'أونلاين',  color: '#8e78fb', bg: '#ede9ff' },
  'in-person': { label: 'In-Person', labelAr: 'حضوري',    color: '#ff9b28', bg: '#fff7ed' },
}

const DAYS_EN = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const day = d.toLocaleDateString('en-US', { weekday: 'short' })
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  const date = d.getDate()
  return `${day}, ${month} ${date}`
}

export default function EventsClient({ slug, events, communityName, locale, isAdmin }: Props) {
  const isAr = locale === 'ar'
  const [view, setView] = useState<'cards' | 'calendar'>('cards')
  const [filter, setFilter] = useState<'all' | 'free' | 'paid'>('all')
  const [calMonth, setCalMonth] = useState(() => {
    const first = events[0]
    if (first) { const d = new Date(first.date); return { year: d.getFullYear(), month: d.getMonth() } }
    const now = new Date(); return { year: now.getFullYear(), month: now.getMonth() }
  })

  const filtered = filter === 'all' ? events : filter === 'free' ? events.filter(e => e.price === 'free' || e.price === 0) : events.filter(e => e.price !== 'free' && e.price !== 0)

  const tabs: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'free', label: 'Free' },
    { key: 'paid', label: 'Paid' },
  ]

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1a1730' }}>
            {communityName} Events
          </h1>
          <p className="mt-1 text-[14px]" style={{ color: '#9590b8' }}>
            Join upcoming events and connect with the community
          </p>
        </div>
      </div>

      {/* Tabs + View toggle */}
      <div className="flex items-center justify-between mb-6 border-b" style={{ borderColor: '#e8e4ff' }}>
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button key={tab.key}
              onClick={() => setFilter(tab.key)}
              className="pb-3 text-sm font-medium border-b-2 transition-colors cursor-pointer"
              style={{
                borderColor: filter === tab.key ? '#8e78fb' : 'transparent',
                color: filter === tab.key ? '#1a1730' : '#9590b8',
              }}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 pb-3 rounded-lg overflow-hidden" style={{ border: '1px solid #e8e4ff' }}>
          <button onClick={() => setView('cards')}
            className="w-9 h-8 flex items-center justify-center transition-colors cursor-pointer"
            style={{ background: view === 'cards' ? '#ede9ff' : '#fff', color: view === 'cards' ? '#8e78fb' : '#9590b8' }}>
            <LayoutList className="w-4 h-4" />
          </button>
          <button onClick={() => setView('calendar')}
            className="w-9 h-8 flex items-center justify-center transition-colors cursor-pointer"
            style={{ background: view === 'calendar' ? '#ede9ff' : '#fff', color: view === 'calendar' ? '#8e78fb' : '#9590b8' }}>
            <CalendarDays className="w-4 h-4" />
          </button>
        </div>
      </div>

      {view === 'cards' ? (
        <CardsView events={filtered} slug={slug} isAr={isAr} />
      ) : (
        <CalendarView events={filtered} slug={slug} isAr={isAr} calMonth={calMonth} setCalMonth={setCalMonth} />
      )}
    </div>
  )
}

/* ───── Cards View ───── */
function CardsView({ events, slug, isAr }: { events: CommunityEvent[]; slug: string; isAr: boolean }) {
  if (events.length === 0) {
    return (
      <div className="rounded-2xl border p-12 flex flex-col items-center gap-3" style={{ borderColor: '#e8e4ff', background: '#fff' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#ede9ff' }}>
          <Calendar className="w-7 h-7" style={{ color: '#8e78fb' }} />
        </div>
        <p className="text-[15px] font-semibold" style={{ color: '#1a1730' }}>No events yet</p>
        <p className="text-[13px]" style={{ color: '#9590b8' }}>Upcoming events will appear here</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map((event) => {
        const cfg = TYPE_CONFIG[event.type]
        const free = event.price === 'free' || event.price === 0
        const spotsLeft = event.ticketsTotal - event.ticketsSold

        return (
          <Link key={event.id}
            href={`/communities/${slug}/events/${event.id}`}
            className="group rounded-2xl overflow-hidden border bg-white flex flex-col transition-all hover:shadow-xl hover:scale-[1.015]"
            style={{ borderColor: '#e8e4ff' }}>
            {/* Banner */}
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              {event.banner ? (
                <img src={event.banner} alt={event.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: cfg.bg }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#fff' }}>
                    {event.type === 'online'
                      ? <Globe className="w-7 h-7" style={{ color: cfg.color }} />
                      : <MapPin className="w-7 h-7" style={{ color: cfg.color }} />}
                  </div>
                </div>
              )}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.25) 0%, transparent 30%, transparent 70%, rgba(0,0,0,.3) 100%)' }} />

              {/* Type badge */}
              <span className="absolute top-3 right-3 text-[11px] font-bold px-2 py-1 rounded-md text-white shadow-md"
                style={{ background: cfg.color }}>
                {isAr ? cfg.labelAr : cfg.label}
              </span>

              {/* Registered ribbon */}
              {event.registered && (
                <span className="absolute top-3 left-3 text-[11px] font-semibold px-2 py-1 rounded-md text-white shadow-md"
                  style={{ background: 'rgba(0,0,0,.55)' }}>
                  ✓ Registered
                </span>
              )}

              {/* Price pill */}
              <span className="absolute bottom-3 left-3 text-[12px] font-bold px-2.5 py-1 rounded-full shadow-md"
                style={{
                  background: free ? '#10b981' : 'rgba(255,255,255,.95)',
                  color: free ? '#fff' : '#8e78fb',
                }}>
                {free ? 'Free' : `${event.price} ${event.currency || 'TND'}`}
              </span>
            </div>

            {/* Body */}
            <div className="p-3.5 flex-1 flex flex-col gap-2">
              <h3 className="text-[14px] font-bold line-clamp-2 leading-snug group-hover:text-[#8e78fb] transition-colors"
                style={{ color: '#1a1730' }}>
                {event.title}
              </h3>
              <p className="text-[11.5px] line-clamp-2 leading-snug" style={{ color: '#9590b8' }}>
                {event.description}
              </p>

              {/* Meta */}
              <div className="flex items-center gap-3 text-[11px]" style={{ color: '#9590b8' }}>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(event.date)}
                </span>
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px]" style={{ color: '#9590b8' }}>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {event.ticketsSold}/{event.ticketsTotal} joined
                </span>
                {spotsLeft <= 10 && spotsLeft > 0 && (
                  <span className="font-semibold" style={{ color: '#ef4444' }}>
                    {spotsLeft} spots left
                  </span>
                )}
              </div>

              {/* Speakers */}
              {event.speakers && event.speakers.length > 0 && (
                <div className="flex items-center gap-1 mt-auto">
                  {event.speakers.slice(0, 3).map((s, i) => (
                    <div key={s.id} className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ background: s.color, marginLeft: i > 0 ? -4 : 0, border: '2px solid #fff', zIndex: 3 - i }}>
                      {s.initials}
                    </div>
                  ))}
                  <span className="text-[10px] ml-1" style={{ color: '#9590b8' }}>
                    {event.speakers.length === 1 ? event.speakers[0].name : `${event.speakers.length} speakers`}
                  </span>
                </div>
              )}

              {/* CTA: Admin vs User */}
              {isAdmin ? (
                <div className="flex gap-2 mt-1">
                  <button className="flex-1 py-2 text-[12px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors hover:bg-[#f9f7ff]"
                    style={{ border: '1px solid #e8e4ff', color: '#46426a' }}
                    onClick={(e) => e.preventDefault()}>
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <span className="flex-1 py-2 text-[12px] font-semibold rounded-lg text-white flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90"
                    style={{ background: '#8e78fb' }}>
                    <Eye className="w-3 h-3" /> View as User
                  </span>
                </div>
              ) : (
                <div className="w-full mt-1 py-2 text-[12px] font-semibold rounded-lg text-white text-center flex items-center justify-center gap-1.5 transition-opacity group-hover:opacity-90"
                  style={{ background: event.registered ? '#10b981' : '#8e78fb' }}>
                  <Ticket className="w-3 h-3" />
                  {event.registered ? 'Registered' : free ? 'RSVP Free' : 'Get Tickets'}
                </div>
              )}
            </div>
          </Link>
        )
      })}

      {/* +New Event card (admin only) */}
      {isAdmin && (
        <button className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 min-h-[280px] transition-colors hover:bg-[#f9f7ff] cursor-pointer"
                style={{ borderColor: '#d8d5e8', color: '#9590b8' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#ede9ff' }}>
            <Plus className="w-5 h-5" style={{ color: '#8e78fb' }} />
          </div>
          <span className="text-[14px] font-medium" style={{ color: '#8e78fb' }}>
            + New event
          </span>
        </button>
      )}
    </div>
  )
}

/* ───── Calendar View ───── */
function CalendarView({ events, slug, isAr, calMonth, setCalMonth }: {
  events: CommunityEvent[]; slug: string; isAr: boolean;
  calMonth: { year: number; month: number }; setCalMonth: (v: { year: number; month: number }) => void
}) {
  const { year, month } = calMonth
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7
  const daysInMonth = lastDay.getDate()

  const eventsByDate = useMemo(() => {
    const map: Record<string, CommunityEvent[]> = {}
    events.forEach(e => {
      if (!map[e.date]) map[e.date] = []
      map[e.date].push(e)
    })
    return map
  }, [events])

  const cells: { day: number | null; dateStr: string }[] = []
  for (let i = 0; i < startDow; i++) cells.push({ day: null, dateStr: '' })
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    cells.push({ day: d, dateStr })
  }
  const remainder = cells.length % 7
  if (remainder > 0) for (let i = 0; i < 7 - remainder; i++) cells.push({ day: null, dateStr: '' })

  function prev() { setCalMonth(month === 0 ? { year: year-1, month: 11 } : { year, month: month-1 }) }
  function next() { setCalMonth(month === 11 ? { year: year+1, month: 0 } : { year, month: month+1 }) }
  function goToday() { setCalMonth({ year: today.getFullYear(), month: today.getMonth() }) }

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#e8e4ff', background: '#fff' }}>
      {/* Calendar header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #e8e4ff' }}>
        <button onClick={goToday}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-[#f9f7ff]"
          style={{ border: '1px solid #e8e4ff', color: '#46426a' }}>
          Today
        </button>
        <div className="flex items-center gap-3">
          <button onClick={prev} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#f9f7ff] transition-colors" style={{ color: '#46426a' }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-[16px] font-bold min-w-[160px] text-center" style={{ color: '#1a1730' }}>
            {MONTHS_EN[month]} {year}
          </h2>
          <button onClick={next} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#f9f7ff] transition-colors" style={{ color: '#46426a' }}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="w-[60px]" />
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7" style={{ borderBottom: '1px solid #e8e4ff' }}>
        {DAYS_EN.map(d => (
          <div key={d} className="text-center py-2.5 text-[12px] font-semibold" style={{ color: '#9590b8' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const isToday = cell.dateStr === todayStr
          const dayEvents = cell.dateStr ? (eventsByDate[cell.dateStr] || []) : []

          return (
            <div key={i}
              className="min-h-[100px] p-1.5 relative"
              style={{ borderRight: (i + 1) % 7 !== 0 ? '1px solid #f0edf8' : undefined, borderBottom: i < cells.length - 7 ? '1px solid #f0edf8' : undefined }}>
              {cell.day !== null && (
                <>
                  <span className={`text-[13px] font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'text-white' : ''}`}
                    style={{
                      color: isToday ? '#fff' : '#46426a',
                      background: isToday ? '#8e78fb' : undefined,
                    }}>
                    {cell.day}
                  </span>
                  <div className="mt-0.5 space-y-0.5">
                    {dayEvents.map(ev => (
                      <Link key={ev.id}
                        href={`/communities/${slug}/events/${ev.id}`}
                        className="block text-[10px] font-medium px-1.5 py-0.5 rounded truncate transition-opacity hover:opacity-80"
                        style={{
                          background: TYPE_CONFIG[ev.type].bg,
                          color: TYPE_CONFIG[ev.type].color,
                        }}>
                        {ev.time} - {ev.title}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
