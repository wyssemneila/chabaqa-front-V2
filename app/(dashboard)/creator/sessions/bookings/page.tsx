'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import {
  ArrowLeft, Calendar, Clock, CheckCircle2, XCircle,
  Loader2, Link2, ChevronDown, Users, Check,
  Video, AlertCircle, Search, Filter,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Booking {
  _id: string
  studentName: string
  studentEmail: string
  sessionId: string
  sessionTitle: string
  duration: number
  price: number
  date: string
  status: 'pending' | 'confirmed' | 'rejected' | 'completed'
  meetLink?: string
}

// ─── Seed mock data ───────────────────────────────────────────────────────────
const SEED: Booking[] = [
  {
    _id: 'bk1',
    studentName: 'Mohamed Ismail',
    studentEmail: 'ismail@example.com',
    sessionId: 's1',
    sessionTitle: 'React Mastery 1-on-1',
    duration: 60,
    price: 80,
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  },
  {
    _id: 'bk2',
    studentName: 'Sara Bouaziz',
    studentEmail: 'sara@example.com',
    sessionId: 's1',
    sessionTitle: 'React Mastery 1-on-1',
    duration: 60,
    price: 80,
    date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'confirmed',
    meetLink: 'https://meet.google.com/abc-defg-hij',
  },
  {
    _id: 'bk3',
    studentName: 'Yassine Trabelsi',
    studentEmail: 'yassine@example.com',
    sessionId: 's2',
    sessionTitle: 'Career Coaching',
    duration: 30,
    price: 50,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    meetLink: 'https://meet.google.com/xyz-uvwx-yz',
  },
  {
    _id: 'bk4',
    studentName: 'Amina Khaled',
    studentEmail: 'amina@example.com',
    sessionId: 's2',
    sessionTitle: 'Career Coaching',
    duration: 30,
    price: 50,
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  },
  {
    _id: 'bk5',
    studentName: 'Omar Souissi',
    studentEmail: 'omar@example.com',
    sessionId: 's3',
    sessionTitle: 'UI/UX Deep Dive',
    duration: 90,
    price: 120,
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'rejected',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
function fmtTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}
function isUpcoming(iso: string) {
  return new Date(iso) > new Date()
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Booking['status'] }) {
  const map: Record<Booking['status'], { label: string; bg: string; color: string }> = {
    pending:   { label: 'Pending',   bg: '#fff7ed', color: '#ea580c' },
    confirmed: { label: 'Confirmed', bg: '#f0fdf4', color: '#16a34a' },
    rejected:  { label: 'Rejected',  bg: '#fef2f2', color: '#dc2626' },
    completed: { label: 'Completed', bg: 'var(--p2)', color: 'var(--p)' },
  }
  const s = map[status]
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

// ─── Inline Meet card ─────────────────────────────────────────────────────────
function MeetCard({
  bookingId,
  onSave,
  onCancel,
}: {
  bookingId: string
  onSave: (meetLink: string) => void
  onCancel: () => void
}) {
  const [link, setLink] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSave = async () => {
    const trimmed = link.trim()
    if (!trimmed) { setErr('Please enter a Google Meet link'); return }
    if (!trimmed.startsWith('https://meet.google.com/')) {
      setErr('Must be a valid Google Meet link (https://meet.google.com/…)')
      return
    }
    setSaving(true)
    await new Promise(r => setTimeout(r, 400))
    onSave(trimmed)
  }

  return (
    <div className="mt-3 rounded-2xl overflow-hidden"
      style={{ border: '1.5px solid var(--p)', background: 'var(--p2)' }}>
      <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: 'var(--p3)' }}>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--p)' }}>
          <Video className="w-3 h-3 text-white" />
        </div>
        <p className="text-[12px] font-bold" style={{ color: 'var(--p)' }}>Add Google Meet Link</p>
      </div>
      <div className="p-4 space-y-3">
        <div className="relative">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--t3)' }} />
          <input
            ref={inputRef}
            value={link}
            onChange={e => { setLink(e.target.value); setErr('') }}
            placeholder="https://meet.google.com/xxx-xxxx-xxx"
            className="w-full h-9 pl-9 pr-3 rounded-xl border-2 text-[12px] transition-colors focus:outline-none"
            style={{
              borderColor: err ? '#fca5a5' : 'var(--bd)',
              background: 'var(--white)',
              color: 'var(--t1)',
            }}
            onFocus={e => { if (!err) (e.target as HTMLElement).style.borderColor = 'var(--p)' }}
            onBlur={e => { if (!err) (e.target as HTMLElement).style.borderColor = 'var(--bd)' }}
          />
        </div>
        {err && (
          <p className="text-[10px] flex items-center gap-1" style={{ color: '#dc2626' }}>
            <AlertCircle className="w-3 h-3" /> {err}
          </p>
        )}
        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 h-8 rounded-xl text-[11px] font-semibold cursor-pointer transition-opacity hover:opacity-70"
            style={{ background: 'var(--bg)', border: '1.5px solid var(--bd)', color: 'var(--t2)' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 h-8 rounded-xl text-[11px] font-bold text-white cursor-pointer disabled:cursor-not-allowed transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5"
            style={{ background: 'var(--p)' }}>
            {saving
              ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>
              : <><Check className="w-3 h-3" /> Confirm & Save</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Booking Row ──────────────────────────────────────────────────────────────
function BookingRow({
  booking,
  onConfirm,
  onReject,
}: {
  booking: Booking
  onConfirm: (id: string, meetLink: string) => void
  onReject: (id: string) => void
}) {
  const [showMeetCard, setShowMeetCard] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const upcoming = isUpcoming(booking.date)

  const handleReject = async () => {
    setRejecting(true)
    await new Promise(r => setTimeout(r, 300))
    onReject(booking._id)
  }

  return (
    <div className="rounded-2xl p-4 transition-all duration-200"
      style={{ border: '1px solid var(--bd)', background: 'var(--white)' }}>
      {/* main row */}
      <div className="flex items-start gap-4">
        {/* avatar */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-[13px] font-bold text-white"
          style={{ background: 'var(--p)' }}>
          {booking.studentName.charAt(0).toUpperCase()}
        </div>

        {/* content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-[13px] font-bold leading-tight" style={{ color: 'var(--t1)' }}>
                {booking.studentName}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--t3)' }}>
                {booking.studentEmail}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: upcoming ? '#f0fdf4' : 'var(--bg)', color: upcoming ? '#16a34a' : 'var(--t3)' }}>
                {upcoming ? 'Upcoming' : 'Past'}
              </span>
              <StatusBadge status={booking.status} />
            </div>
          </div>

          {/* session info row */}
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded flex items-center justify-center"
                style={{ background: 'var(--p2)' }}>
                <Video className="w-2.5 h-2.5" style={{ color: 'var(--p)' }} />
              </div>
              <span className="text-[11px] font-semibold" style={{ color: 'var(--t1)' }}>
                {booking.sessionTitle}
              </span>
            </div>
            <div className="flex items-center gap-1" style={{ color: 'var(--t3)' }}>
              <Clock className="w-3 h-3" />
              <span className="text-[11px]">{booking.duration} min</span>
            </div>
            <div className="flex items-center gap-1" style={{ color: 'var(--t3)' }}>
              <Calendar className="w-3 h-3" />
              <span className="text-[11px]">{fmtDate(booking.date)} · {fmtTime(booking.date)}</span>
            </div>
            {booking.price > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg"
                style={{ background: 'var(--bg)', color: 'var(--t1)', border: '1px solid var(--bd)' }}>
                {booking.price} TND
              </span>
            )}
          </div>

          {/* actions */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {booking.status === 'pending' && (
              <>
                <button
                  onClick={() => setShowMeetCard(prev => !prev)}
                  className="h-7 px-3 rounded-xl text-[11px] font-bold text-white flex items-center gap-1.5 cursor-pointer transition-opacity hover:opacity-90"
                  style={{ background: 'var(--p)' }}>
                  <Check className="w-3 h-3" /> Confirm
                </button>
                <button
                  onClick={handleReject}
                  disabled={rejecting}
                  className="h-7 px-3 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-opacity hover:opacity-70 disabled:cursor-not-allowed"
                  style={{ background: 'var(--bg)', border: '1.5px solid var(--bd)', color: 'var(--t2)' }}>
                  {rejecting
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <><XCircle className="w-3 h-3" /> Reject</>
                  }
                </button>
              </>
            )}

            {booking.status === 'confirmed' && (
              <>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" style={{ color: '#16a34a' }} />
                  <span className="text-[11px] font-semibold" style={{ color: '#16a34a' }}>Confirmed</span>
                </div>
                {booking.meetLink && (
                  <a
                    href={booking.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-7 px-3 rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-opacity hover:opacity-90"
                    style={{ background: '#f0fdf4', color: '#16a34a', border: '1.5px solid #bbf7d0' }}>
                    <Video className="w-3 h-3" /> Join Meet
                  </a>
                )}
              </>
            )}

            {booking.status === 'completed' && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--p)' }} />
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--p)' }}>Completed</span>
                </div>
                {booking.meetLink && (
                  <a
                    href={booking.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-7 px-3 rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-opacity hover:opacity-90"
                    style={{ background: 'var(--p2)', color: 'var(--p)', border: '1.5px solid var(--p3)' }}>
                    <Video className="w-3 h-3" /> Recording
                  </a>
                )}
              </div>
            )}

            {booking.status === 'rejected' && (
              <div className="flex items-center gap-1.5">
                <XCircle className="w-4 h-4" style={{ color: '#dc2626' }} />
                <span className="text-[11px] font-semibold" style={{ color: '#dc2626' }}>Rejected</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* meet card */}
      {showMeetCard && booking.status === 'pending' && (
        <MeetCard
          bookingId={booking._id}
          onSave={(meetLink) => {
            setShowMeetCard(false)
            onConfirm(booking._id, meetLink)
          }}
          onCancel={() => setShowMeetCard(false)}
        />
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'upcoming' | 'past'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | Booking['status']>('all')
  const [search, setSearch] = useState('')

  // Load / seed
  useEffect(() => {
    try {
      const stored = localStorage.getItem('chabaqa_mock_bookings')
      if (stored) {
        setBookings(JSON.parse(stored))
      } else {
        localStorage.setItem('chabaqa_mock_bookings', JSON.stringify(SEED))
        setBookings(SEED)
      }
    } catch {
      setBookings(SEED)
    } finally {
      setLoading(false)
    }
  }, [])

  const persist = (updated: Booking[]) => {
    setBookings(updated)
    localStorage.setItem('chabaqa_mock_bookings', JSON.stringify(updated))
  }

  const handleConfirm = (id: string, meetLink: string) => {
    persist(bookings.map(b => b._id === id ? { ...b, status: 'confirmed', meetLink } : b))
  }

  const handleReject = (id: string) => {
    persist(bookings.map(b => b._id === id ? { ...b, status: 'rejected' } : b))
  }

  // Stats
  const total     = bookings.length
  const pending   = bookings.filter(b => b.status === 'pending').length
  const confirmed = bookings.filter(b => b.status === 'confirmed').length
  const completed = bookings.filter(b => b.status === 'completed').length
  const cancelled = bookings.filter(b => b.status === 'rejected').length
  const upcoming  = bookings.filter(b => isUpcoming(b.date)).length
  const past      = bookings.filter(b => !isUpcoming(b.date)).length

  // Filtered list
  const filtered = bookings.filter(b => {
    if (tab === 'upcoming' && !isUpcoming(b.date)) return false
    if (tab === 'past'     && isUpcoming(b.date))  return false
    if (statusFilter !== 'all' && b.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (
        !b.studentName.toLowerCase().includes(q) &&
        !b.studentEmail.toLowerCase().includes(q) &&
        !b.sessionTitle.toLowerCase().includes(q)
      ) return false
    }
    return true
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const STATS = [
    { label: 'Total',     value: total,     color: 'var(--p)' },
    { label: 'Pending',   value: pending,   color: '#ea580c' },
    { label: 'Confirmed', value: confirmed, color: '#16a34a' },
    { label: 'Completed', value: completed, color: 'var(--cyan)' },
    { label: 'Cancelled', value: cancelled, color: '#dc2626' },
    { label: 'Upcoming',  value: upcoming,  color: 'var(--orange)' },
    { label: 'Past',      value: past,      color: 'var(--t3)' },
  ]

  const TABS = [
    { id: 'all',      label: 'All' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past',     label: 'Past' },
  ] as const

  const STATUS_OPTIONS: { value: 'all' | Booking['status']; label: string }[] = [
    { value: 'all',       label: 'All Status' },
    { value: 'pending',   label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'rejected',  label: 'Rejected' },
  ]

  return (
    <>
      <style>{`
        @keyframes dashFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:var(--p3);border-radius:10px}
      `}</style>

      <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
        <DashSidebar />
        <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar title="Booking List" subtitle="Manage all your session bookings" />

          <main className="p-7 flex-1 max-w-5xl" style={{ animation: 'dashFadeUp .4s ease both' }}>

            {/* back */}
            <div className="flex items-center gap-2 mb-6">
              <button onClick={() => router.push('/creator/sessions')}
                className="flex items-center gap-1.5 text-sm font-medium cursor-pointer hover:opacity-70 transition-opacity"
                style={{ color: 'var(--t3)' }}>
                <ArrowLeft className="w-4 h-4" /> Sessions
              </button>
              <span style={{ color: 'var(--bd)' }}>/</span>
              <span className="text-sm font-medium" style={{ color: 'var(--t1)' }}>All Bookings</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--p)' }} />
              </div>
            ) : (
              <div className="space-y-5">

                {/* stats strip */}
                <div className="grid grid-cols-7 gap-3">
                  {STATS.map(s => (
                    <div key={s.label} className="rounded-2xl px-3 py-3 text-center"
                      style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                      <p className="text-[22px] font-black leading-none" style={{ color: s.color }}>
                        {s.value}
                      </p>
                      <p className="text-[9px] font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--t3)' }}>
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* filters row */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* tabs */}
                  <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                    {TABS.map(t => (
                      <button key={t.id} onClick={() => setTab(t.id)}
                        className="h-7 px-4 rounded-lg text-[11px] font-bold cursor-pointer transition-all"
                        style={{
                          background: tab === t.id ? 'var(--p)' : 'transparent',
                          color: tab === t.id ? '#fff' : 'var(--t2)',
                        }}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* status dropdown */}
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--t3)' }} />
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                      className="h-9 pl-9 pr-8 rounded-xl border text-[11px] font-semibold appearance-none cursor-pointer focus:outline-none"
                      style={{ background: 'var(--white)', borderColor: 'var(--bd)', color: 'var(--t1)' }}>
                      {STATUS_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: 'var(--t3)' }} />
                  </div>

                  {/* search */}
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--t3)' }} />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search student or session…"
                      className="w-full h-9 pl-9 pr-4 rounded-xl border text-[12px] focus:outline-none transition-colors"
                      style={{ background: 'var(--white)', borderColor: 'var(--bd)', color: 'var(--t1)' }}
                      onFocus={e => (e.target as HTMLElement).style.borderColor = 'var(--p)'}
                      onBlur={e => (e.target as HTMLElement).style.borderColor = 'var(--bd)'}
                    />
                  </div>

                  <p className="text-[11px] ml-auto" style={{ color: 'var(--t3)' }}>
                    {filtered.length} booking{filtered.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* booking list */}
                {filtered.length === 0 ? (
                  <div className="rounded-2xl flex flex-col items-center justify-center py-16 text-center"
                    style={{ border: '1.5px dashed var(--bd)', background: 'var(--white)' }}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                      style={{ background: 'var(--p2)' }}>
                      <Users className="w-6 h-6" style={{ color: 'var(--p)' }} />
                    </div>
                    <p className="text-sm font-bold" style={{ color: 'var(--t1)' }}>No bookings found</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--t3)' }}>
                      {search || statusFilter !== 'all' ? 'Try changing your filters' : 'Bookings will appear here once students book your sessions'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filtered.map(b => (
                      <BookingRow
                        key={b._id}
                        booking={b}
                        onConfirm={handleConfirm}
                        onReject={handleReject}
                      />
                    ))}
                  </div>
                )}

              </div>
            )}
          </main>
        </div>
      </div>
    </>
  )
}
