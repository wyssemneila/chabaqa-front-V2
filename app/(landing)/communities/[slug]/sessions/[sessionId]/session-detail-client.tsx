'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { CommunitySession, SessionTimeSlot } from '@/lib/community-data'
import {
  ArrowLeft, Clock, Video, Users, Calendar, MapPin, Globe,
  CheckCircle2, ShieldCheck, ChevronLeft, ChevronRight,
  Sparkles, Mail, X,
} from 'lucide-react'

interface Props {
  slug: string
  session: CommunitySession
  communityName: string
}

const DAYS_EN = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']

function formatFullDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export default function SessionDetailClient({ slug, session, communityName }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<SessionTimeSlot | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isBooked, setIsBooked] = useState(!!session.booked)

  const availableDatesSet = useMemo(() => {
    const set = new Set<string>()
    session.availableDays?.forEach(d => set.add(d.date))
    return set
  }, [session.availableDays])

  const slotsForDate = useMemo(() => {
    if (!selectedDate || !session.availableDays) return []
    const day = session.availableDays.find(d => d.date === selectedDate)
    return day?.slots || []
  }, [selectedDate, session.availableDays])

  const firstAvailable = session.availableDays?.[0]
  const [calMonth, setCalMonth] = useState(() => {
    if (firstAvailable) {
      const d = new Date(firstAvailable.date)
      return { year: d.getFullYear(), month: d.getMonth() }
    }
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const { year, month } = calMonth
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7
  const daysInMonth = lastDay.getDate()

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

  function handleBook() {
    setIsBooked(true)
    setShowConfirmation(true)
  }

  return (
    <div className="w-full">
      {/* Back */}
      <Link href={`/communities/${slug}/sessions`}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-5 transition-colors hover:text-[#8e78fb]"
        style={{ color: '#9590b8' }}>
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
        Sessions
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">

        {/* LEFT — Main content */}
        <div>
          {/* Title */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: session.type === 'online' ? '#ede9ff' : '#fff7ed',
                  color: session.type === 'online' ? '#8e78fb' : '#ff9b28',
                }}>
                {session.type === 'online' ? <Globe className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                {session.type === 'online' ? 'Online' : 'In-Person'}
              </span>
              {session.category && (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: '#ede9ff', color: '#8e78fb' }}>
                  {session.category}
                </span>
              )}
              {isBooked && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: '#d1fae5', color: '#059669' }}>
                  <CheckCircle2 className="w-3 h-3" />
                  Booked
                </span>
              )}
            </div>
            <h1 className="text-[26px] font-bold leading-tight tracking-[-0.01em]" style={{ color: '#1a1730' }}>
              {session.title}
            </h1>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="text-[13px] flex items-center gap-1" style={{ color: '#9590b8' }}>
                <Clock className="w-3.5 h-3.5" />
                {session.duration} minutes
              </span>
              <span className="text-[13px] flex items-center gap-1" style={{ color: '#9590b8' }}>
                <Users className="w-3.5 h-3.5" />
                {session.availableSlots} slots available
              </span>
            </div>
          </div>

          <div className="h-px mb-6" style={{ background: '#ede9ff' }} />

          {/* Description */}
          {session.description && (
            <div className="mb-8">
              <h2 className="text-[15px] font-semibold mb-3" style={{ color: '#1a1730' }}>
                Description
              </h2>
              <p className="text-[14px] leading-[1.7]" style={{ color: '#6b6885' }}>
                {session.description}
              </p>
            </div>
          )}

          {/* What you get */}
          {session.whatYouGet && session.whatYouGet.length > 0 && (
            <div className="mb-8">
              <h2 className="text-[15px] font-semibold mb-3" style={{ color: '#1a1730' }}>
                What you'll get
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {session.whatYouGet.map((item, i) => {
                  const colors = ['#8e78fb','#47c7ea','#f65887','#ff9b28']
                  const c = colors[i % colors.length]
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#f9f8fd' }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${c}12` }}>
                        <CheckCircle2 className="w-4 h-4" style={{ color: c }} strokeWidth={1.7} />
                      </div>
                      <span className="text-[13px] font-medium" style={{ color: '#46426a' }}>{item}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Requirements */}
          {session.requirements && session.requirements.length > 0 && (
            <div className="mb-8">
              <h2 className="text-[15px] font-semibold mb-3" style={{ color: '#1a1730' }}>
                Requirements
              </h2>
              <div className="rounded-xl p-4 space-y-2" style={{ background: '#fff7ed', border: '1px solid #ffedd5' }}>
                {session.requirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold"
                      style={{ background: '#ff9b28', color: '#fff' }}>
                      {i + 1}
                    </div>
                    <span className="text-[13px]" style={{ color: '#92400e' }}>{req}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mentor */}
          <div>
            <h2 className="text-[15px] font-semibold mb-3" style={{ color: '#1a1730' }}>
              Your mentor
            </h2>
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: '#f9f8fd' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-bold text-white"
                style={{ background: session.mentorColor }}>
                {session.mentorInitials}
              </div>
              <div>
                <p className="text-[14px] font-semibold" style={{ color: '#1a1730' }}>{session.mentorName}</p>
                <p className="text-[12px]" style={{ color: '#9590b8' }}>{communityName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Sticky sidebar */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e4ff', background: '#fff' }}>

            {/* Mini Calendar */}
            <div className="p-4 pb-0">
              <p className="text-[12px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#9590b8' }}>
                Pick a date
              </p>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e8e4ff' }}>
                {/* Calendar header */}
                <div className="flex items-center justify-between px-3 py-2" style={{ background: '#f9f8fd' }}>
                  <button onClick={prev} className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white transition-colors" style={{ color: '#46426a' }}>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[13px] font-bold" style={{ color: '#1a1730' }}>
                    {MONTHS_EN[month]} {year}
                  </span>
                  <button onClick={next} className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white transition-colors" style={{ color: '#46426a' }}>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Day headers */}
                <div className="grid grid-cols-7">
                  {DAYS_EN.map(d => (
                    <div key={d} className="text-center py-1.5 text-[10px] font-semibold" style={{ color: '#9590b8' }}>
                      {d}
                    </div>
                  ))}
                </div>
                {/* Day cells */}
                <div className="grid grid-cols-7 px-1 pb-1">
                  {cells.map((cell, i) => {
                    if (cell.day === null) return <div key={i} />
                    const isAvailable = availableDatesSet.has(cell.dateStr)
                    const isSelected = cell.dateStr === selectedDate
                    const isToday = cell.dateStr === todayStr

                    return (
                      <button key={i}
                        onClick={() => {
                          if (!isAvailable) return
                          setSelectedDate(cell.dateStr)
                          setSelectedSlot(null)
                        }}
                        disabled={!isAvailable}
                        className={`w-full aspect-square flex items-center justify-center text-[12px] rounded-lg transition-all ${isAvailable ? 'cursor-pointer hover:bg-[#ede9ff]' : 'cursor-default'}`}
                        style={{
                          fontWeight: isAvailable || isToday ? 600 : 400,
                          color: isSelected ? '#fff' : isAvailable ? '#8e78fb' : '#d8d5e8',
                          background: isSelected ? '#8e78fb' : undefined,
                          ...(isToday && !isSelected ? { boxShadow: 'inset 0 0 0 1.5px #8e78fb', borderRadius: 8 } : {}),
                        }}>
                        {cell.day}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 mb-1">
                <span className="flex items-center gap-1.5 text-[10px]" style={{ color: '#9590b8' }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#8e78fb' }} />
                  Available
                </span>
                <span className="flex items-center gap-1.5 text-[10px]" style={{ color: '#9590b8' }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#e8e4ff' }} />
                  Unavailable
                </span>
              </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div className="px-4 pb-0">
                <p className="text-[12px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#9590b8' }}>
                  Available times — {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {slotsForDate.map(slot => {
                    const isActive = selectedSlot?.id === slot.id
                    return (
                      <button key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        className="px-3.5 py-2 text-[13px] font-medium rounded-lg transition-all cursor-pointer"
                        style={{
                          border: isActive ? '2px solid #8e78fb' : '1px solid #e8e4ff',
                          background: isActive ? '#f9f7ff' : '#fff',
                          color: isActive ? '#8e78fb' : '#46426a',
                          padding: isActive ? '7px 13px' : '8px 14px',
                        }}>
                        {slot.time}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Price + CTA */}
            <div className="p-4 pt-2">
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-[32px] font-bold tracking-tight" style={{ color: '#1a1730' }}>
                  {session.price}
                </span>
                <span className="text-[14px] font-medium" style={{ color: '#9590b8' }}>
                  {session.currency}
                </span>
                <span className="text-[12px]" style={{ color: '#b5b0d0' }}>
                  / {session.duration}min
                </span>
              </div>

              {isBooked ? (
                <button className="w-full h-12 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 cursor-pointer"
                  style={{ background: '#10b981' }}>
                  <CheckCircle2 className="w-[18px] h-[18px]" strokeWidth={2} />
                  Session Booked
                </button>
              ) : (
                <button
                  onClick={handleBook}
                  disabled={!selectedDate || !selectedSlot}
                  className="w-full h-12 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: '#8e78fb', boxShadow: selectedSlot ? '0 4px 14px rgba(142,120,251,.35)' : undefined }}>
                  <Calendar className="w-[18px] h-[18px]" strokeWidth={2} />
                  {!selectedDate ? 'Select a date' : !selectedSlot ? 'Pick a time' : 'Book Session'}
                </button>
              )}
              {!isBooked && (
                <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px]" style={{ color: '#b5b0d0' }}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Secure & instant confirmation
                </div>
              )}
            </div>

            <div className="mx-4 h-px" style={{ background: '#f0edf8' }} />

            {/* Details */}
            <div className="p-4 space-y-3">
              <DetailRow label="Duration" value={`${session.duration} min`} />
              <DetailRow label="Format" value={session.type === 'online' ? 'Video call' : 'In-Person'} />
              <DetailRow label="Mentor" value={session.mentorName} />
              <DetailRow label="Slots left" value={`${session.availableSlots}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Booking Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(26,23,48,0.5)' }}>
          <div className="w-full max-w-[420px] rounded-2xl p-6 relative" style={{ background: '#fff' }}>
            <button onClick={() => setShowConfirmation(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-[#f9f8fd] transition-colors"
              style={{ color: '#9590b8' }}>
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: '#d1fae5' }}>
                <Sparkles className="w-7 h-7" style={{ color: '#059669' }} />
              </div>
              <h3 className="text-[20px] font-bold mb-1" style={{ color: '#1a1730' }}>
                Session Booked!
              </h3>
              <p className="text-[14px] mb-5" style={{ color: '#6b6885' }}>
                You're all set! Here are your session details.
              </p>

              <div className="w-full rounded-xl p-4 mb-5 space-y-2.5" style={{ background: '#f9f8fd' }}>
                <div className="flex items-center justify-between">
                  <span className="text-[12px]" style={{ color: '#9590b8' }}>Session</span>
                  <span className="text-[12px] font-semibold" style={{ color: '#1a1730' }}>{session.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px]" style={{ color: '#9590b8' }}>Date</span>
                  <span className="text-[12px] font-semibold" style={{ color: '#1a1730' }}>
                    {selectedDate ? formatFullDate(selectedDate) : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px]" style={{ color: '#9590b8' }}>Time</span>
                  <span className="text-[12px] font-semibold" style={{ color: '#1a1730' }}>
                    {selectedSlot?.time} ({session.duration} min)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px]" style={{ color: '#9590b8' }}>Mentor</span>
                  <span className="text-[12px] font-semibold" style={{ color: '#1a1730' }}>{session.mentorName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px]" style={{ color: '#9590b8' }}>Price</span>
                  <span className="text-[12px] font-bold" style={{ color: '#8e78fb' }}>
                    {session.price} {session.currency}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-5 px-4 py-3 rounded-xl w-full"
                style={{ background: '#ede9ff' }}>
                <Mail className="w-4 h-4 shrink-0" style={{ color: '#8e78fb' }} />
                <p className="text-[12px] text-left" style={{ color: '#6b6885' }}>
                  A <span className="font-semibold" style={{ color: '#8e78fb' }}>Google Meet link</span> will be sent to your email before the session. Keep an eye on your inbox!
                </p>
              </div>

              <button onClick={() => setShowConfirmation(false)}
                className="w-full h-11 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 cursor-pointer"
                style={{ background: '#8e78fb' }}>
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px]" style={{ color: '#9590b8' }}>{label}</span>
      <span className="text-[12px] font-semibold" style={{ color: '#46426a' }}>{value}</span>
    </div>
  )
}
