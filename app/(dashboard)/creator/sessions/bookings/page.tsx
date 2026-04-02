'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import {
  ArrowLeft, Video, Calendar, Clock, Search,
  CheckCircle2, XCircle, Loader2, Link2, ChevronDown,
  Check, AlertCircle, Users, Inbox,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Booking {
  _id: string; studentName: string; studentEmail: string
  sessionId: string; sessionTitle: string; duration: number
  price: number; date: string
  status: 'pending'|'confirmed'|'rejected'|'completed'
  meetLink?: string
}

// ─── Seed ─────────────────────────────────────────────────────────────────────
const SEED: Booking[] = [
  { _id:'bk1', studentName:'Mohamed Ismail',   studentEmail:'ismail@example.com',  sessionId:'s1', sessionTitle:'React Mastery 1-on-1', duration:60, price:80,  date: new Date(Date.now()+2*86400000).toISOString(),  status:'pending' },
  { _id:'bk2', studentName:'Sara Bouaziz',     studentEmail:'sara@example.com',    sessionId:'s1', sessionTitle:'React Mastery 1-on-1', duration:60, price:80,  date: new Date(Date.now()+4*86400000).toISOString(),  status:'confirmed', meetLink:'https://meet.google.com/abc-defg-hij' },
  { _id:'bk3', studentName:'Yassine Trabelsi', studentEmail:'yassine@example.com', sessionId:'s2', sessionTitle:'Career Coaching',       duration:30, price:50,  date: new Date(Date.now()-3*86400000).toISOString(),  status:'completed', meetLink:'https://meet.google.com/xyz-uvwx-yz' },
  { _id:'bk4', studentName:'Amina Khaled',     studentEmail:'amina@example.com',   sessionId:'s2', sessionTitle:'Career Coaching',       duration:30, price:50,  date: new Date(Date.now()+86400000).toISOString(),    status:'pending' },
  { _id:'bk5', studentName:'Omar Souissi',     studentEmail:'omar@example.com',    sessionId:'s3', sessionTitle:'UI/UX Deep Dive',       duration:90, price:120, date: new Date(Date.now()-7*86400000).toISOString(),  status:'rejected' },
  { _id:'bk6', studentName:'Lina Mansouri',    studentEmail:'lina@example.com',    sessionId:'s1', sessionTitle:'React Mastery 1-on-1', duration:60, price:80,  date: new Date(Date.now()+6*86400000).toISOString(),  status:'pending' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isUpcoming = (iso: string) => new Date(iso) > new Date()

function fmtDate(iso: string) {
  const d = new Date(iso)
  const today    = new Date(); today.setHours(0,0,0,0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1)
  const day      = new Date(d);  day.setHours(0,0,0,0)
  if (day.getTime() === today.getTime())    return 'Today'
  if (day.getTime() === tomorrow.getTime()) return 'Tomorrow'
  return d.toLocaleDateString('en-US',{ weekday:'short', month:'short', day:'numeric' })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US',{ hour:'numeric', minute:'2-digit', hour12:true })
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  pending:   { label:'Pending',   dot:'#f59e0b', bg:'#fffbeb', text:'#b45309' },
  confirmed: { label:'Confirmed', dot:'#10b981', bg:'#f0fdf4', text:'#15803d' },
  completed: { label:'Completed', dot:'var(--p)', bg:'var(--p2)', text:'var(--p)' },
  rejected:  { label:'Rejected',  dot:'#ef4444', bg:'#fef2f2', text:'#dc2626' },
}

// ─── Meet link card ───────────────────────────────────────────────────────────
function MeetCard({ onSave, onCancel }: { onSave:(l:string)=>void; onCancel:()=>void }) {
  const [link, setLink] = useState('')
  const [err,  setErr]  = useState('')
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus() }, [])

  const save = async () => {
    const v = link.trim()
    if (!v) { setErr('Enter a Google Meet link'); return }
    if (!v.startsWith('https://meet.google.com/')) { setErr('Must start with https://meet.google.com/'); return }
    setBusy(true)
    await new Promise(r => setTimeout(r, 350))
    onSave(v)
  }

  return (
    <div className="mt-4 rounded-2xl overflow-hidden"
      style={{ border:'1.5px solid var(--p)', background:'var(--p2)' }}>
      <div className="flex items-center gap-2.5 px-4 py-3 border-b" style={{ borderColor:'var(--p3)' }}>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background:'var(--p)' }}>
          <Video className="w-3 h-3 text-white" />
        </div>
        <span className="text-[12px] font-bold" style={{ color:'var(--p)' }}>Paste Google Meet Link</span>
      </div>
      <div className="p-4 space-y-2.5">
        <div className="relative">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color:'var(--t3)' }} />
          <input ref={ref} value={link} onChange={e=>{setLink(e.target.value);setErr('')}}
            placeholder="https://meet.google.com/xxx-xxxx-xxx"
            className="w-full h-9 pl-9 pr-3 rounded-xl border-2 text-[12px] focus:outline-none transition-colors"
            style={{
              borderColor: err ? '#fca5a5' : 'var(--bd)',
              background:'var(--white)', color:'var(--t1)',
            }}
            onFocus={e => { if(!err)(e.target as HTMLElement).style.borderColor='var(--p)' }}
            onBlur={e  => { if(!err)(e.target as HTMLElement).style.borderColor='var(--bd)' }}
          />
        </div>
        {err && <p className="text-[10px] flex items-center gap-1" style={{ color:'#dc2626' }}>
          <AlertCircle className="w-3 h-3 shrink-0" /> {err}
        </p>}
        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 h-8 rounded-xl text-[11px] font-semibold cursor-pointer transition-opacity hover:opacity-70"
            style={{ background:'var(--bg)', border:'1.5px solid var(--bd)', color:'var(--t2)' }}>
            Cancel
          </button>
          <button onClick={save} disabled={busy}
            className="flex-1 h-8 rounded-xl text-[11px] font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed hover:opacity-90"
            style={{ background:'var(--p)' }}>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3 h-3" /> Confirm</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Booking card ─────────────────────────────────────────────────────────────
function BookingCard({ b, onConfirm, onReject }: {
  b: Booking
  onConfirm: (id:string, link:string) => void
  onReject:  (id:string) => void
}) {
  const [meetOpen,  setMeetOpen]  = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const cfg = STATUS_CFG[b.status]
  const up  = isUpcoming(b.date)

  const doReject = async () => {
    setRejecting(true)
    await new Promise(r => setTimeout(r, 300))
    onReject(b._id)
  }

  return (
    <div className="group rounded-2xl overflow-hidden transition-shadow duration-200"
      style={{ background:'var(--white)', border:'1px solid var(--bd)' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow='0 8px 32px rgba(0,0,0,.07)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow='none'}>

      <div className="flex items-stretch">
        {/* colored left accent */}
        <div className="w-1 shrink-0 rounded-l-2xl" style={{ background: cfg.dot }} />

        <div className="flex-1 p-4">
          <div className="flex items-start gap-3">

            {/* avatar */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-[12px] font-black text-white select-none"
              style={{ background:'var(--p)' }}>
              {b.studentName.charAt(0).toUpperCase()}
            </div>

            {/* main info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="text-[13px] font-bold leading-none" style={{ color:'var(--t1)' }}>{b.studentName}</p>
                  <p className="text-[11px] mt-0.5" style={{ color:'var(--t3)' }}>{b.studentEmail}</p>
                </div>
                {/* status pill */}
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0"
                  style={{ background: cfg.bg, color: cfg.text }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                  {cfg.label}
                </span>
              </div>

              {/* session + date row */}
              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                  style={{ background:'var(--bg)', border:'1px solid var(--bd)' }}>
                  <Video className="w-3 h-3 shrink-0" style={{ color:'var(--p)' }} />
                  <span className="text-[11px] font-semibold" style={{ color:'var(--t1)' }}>{b.sessionTitle}</span>
                </div>
                <div className="flex items-center gap-1" style={{ color:'var(--t3)' }}>
                  <Clock className="w-3 h-3" />
                  <span className="text-[11px]">{b.duration} min</span>
                </div>
                <div className="flex items-center gap-1" style={{ color:'var(--t3)' }}>
                  <Calendar className="w-3 h-3" />
                  <span className="text-[11px] font-semibold" style={{ color: up ? 'var(--t1)' : 'var(--t3)' }}>
                    {fmtDate(b.date)}, {fmtTime(b.date)}
                  </span>
                </div>
                {b.price > 0 && (
                  <span className="text-[11px] font-black" style={{ color:'var(--p)' }}>
                    {b.price} TND
                  </span>
                )}
              </div>

              {/* actions */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {b.status === 'pending' && <>
                  <button onClick={() => setMeetOpen(v=>!v)}
                    className="h-7 px-3.5 rounded-xl text-[11px] font-bold text-white flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ background:'var(--p)' }}>
                    <Check className="w-3 h-3" /> Confirm
                  </button>
                  <button onClick={doReject} disabled={rejecting}
                    className="h-7 px-3 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer hover:opacity-70 disabled:cursor-not-allowed transition-opacity"
                    style={{ background:'var(--bg)', border:'1.5px solid var(--bd)', color:'var(--t2)' }}>
                    {rejecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <><XCircle className="w-3 h-3" /> Reject</>}
                  </button>
                </>}

                {b.status === 'confirmed' && <>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" style={{ color:'#10b981' }} />
                    <span className="text-[11px] font-semibold" style={{ color:'#10b981' }}>Confirmed</span>
                  </div>
                  {b.meetLink && (
                    <a href={b.meetLink} target="_blank" rel="noopener noreferrer"
                      className="h-7 px-3.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ background:'#f0fdf4', color:'#15803d', border:'1.5px solid #bbf7d0' }}>
                      <Video className="w-3 h-3" /> Join Meet
                    </a>
                  )}
                </>}

                {b.status === 'completed' && <>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" style={{ color:'var(--p)' }} />
                    <span className="text-[11px] font-semibold" style={{ color:'var(--p)' }}>Completed</span>
                  </div>
                  {b.meetLink && (
                    <a href={b.meetLink} target="_blank" rel="noopener noreferrer"
                      className="h-7 px-3.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer hover:opacity-90"
                      style={{ background:'var(--p2)', color:'var(--p)', border:'1.5px solid var(--p3)' }}>
                      <Video className="w-3 h-3" /> Recording
                    </a>
                  )}
                </>}

                {b.status === 'rejected' && (
                  <div className="flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" style={{ color:'#ef4444' }} />
                    <span className="text-[11px] font-semibold" style={{ color:'#ef4444' }}>Rejected</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* meet card */}
          {meetOpen && b.status === 'pending' && (
            <MeetCard
              onSave={link => { setMeetOpen(false); onConfirm(b._id, link) }}
              onCancel={() => setMeetOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const router = useRouter()
  const [bookings,      setBookings]      = useState<Booking[]>([])
  const [loading,       setLoading]       = useState(true)
  const [view,          setView]          = useState<'all'|'upcoming'|'past'>('all')
  const [statusFilter,  setStatusFilter]  = useState<'all'|Booking['status']>('all')
  const [search,        setSearch]        = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('chabaqa_mock_bookings')
      const data = raw ? JSON.parse(raw) : null
      if (data && data.length > 0) { setBookings(data) }
      else { localStorage.setItem('chabaqa_mock_bookings', JSON.stringify(SEED)); setBookings(SEED) }
    } catch { setBookings(SEED) }
    finally { setLoading(false) }
  }, [])

  const persist = (updated: Booking[]) => {
    setBookings(updated)
    localStorage.setItem('chabaqa_mock_bookings', JSON.stringify(updated))
  }
  const handleConfirm = (id: string, meetLink: string) =>
    persist(bookings.map(b => b._id===id ? {...b, status:'confirmed', meetLink} : b))
  const handleReject = (id: string) =>
    persist(bookings.map(b => b._id===id ? {...b, status:'rejected'} : b))

  // stats
  const total     = bookings.length
  const pending   = bookings.filter(b => b.status==='pending').length
  const confirmed = bookings.filter(b => b.status==='confirmed').length
  const completed = bookings.filter(b => b.status==='completed').length
  const rejected  = bookings.filter(b => b.status==='rejected').length
  const upcoming  = bookings.filter(b => isUpcoming(b.date)).length
  const past      = bookings.filter(b => !isUpcoming(b.date)).length

  // filtered list
  const visible = bookings
    .filter(b => {
      if (view==='upcoming' && !isUpcoming(b.date)) return false
      if (view==='past'     &&  isUpcoming(b.date)) return false
      if (statusFilter!=='all' && b.status!==statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return b.studentName.toLowerCase().includes(q)
          || b.studentEmail.toLowerCase().includes(q)
          || b.sessionTitle.toLowerCase().includes(q)
      }
      return true
    })
    .sort((a, b) => {
      // pending first, then by date
      if (a.status==='pending' && b.status!=='pending') return -1
      if (b.status==='pending' && a.status!=='pending') return 1
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

  const STAT_PILLS = [
    { label:'Total',     value:total,     color:'var(--t1)' },
    { label:'Pending',   value:pending,   color:'#b45309'  },
    { label:'Confirmed', value:confirmed, color:'#15803d'  },
    { label:'Completed', value:completed, color:'var(--p)' },
    { label:'Rejected',  value:rejected,  color:'#dc2626'  },
    { label:'Upcoming',  value:upcoming,  color:'var(--orange)' },
    { label:'Past',      value:past,      color:'var(--t3)' },
  ]

  const VIEWS = [
    { id:'all',      label:'All' },
    { id:'upcoming', label:'Upcoming' },
    { id:'past',     label:'Past' },
  ] as const

  const STATUS_OPTS: { value:'all'|Booking['status']; label:string }[] = [
    { value:'all',       label:'All status' },
    { value:'pending',   label:'Pending' },
    { value:'confirmed', label:'Confirmed' },
    { value:'completed', label:'Completed' },
    { value:'rejected',  label:'Rejected' },
  ]

  return (
    <>
      <style>{`
        @keyframes dashFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:var(--p3);border-radius:10px}
      `}</style>

      <div className="flex min-h-screen" style={{ background:'var(--bg)' }}>
        <DashSidebar />
        <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar title="Booking List" subtitle="All your session bookings in one place" />

          <main className="p-7 flex-1" style={{ animation:'dashFadeUp .4s ease both' }}>

            {/* breadcrumb */}
            <button onClick={() => router.push('/creator/sessions')}
              className="flex items-center gap-1.5 text-[12px] font-medium mb-6 cursor-pointer hover:opacity-60 transition-opacity"
              style={{ color:'var(--t3)' }}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sessions
            </button>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color:'var(--p)' }} />
              </div>
            ) : (
              <div className="space-y-5 max-w-4xl">

                {/* stats row */}
                <div className="flex items-center gap-3 p-4 rounded-2xl flex-wrap"
                  style={{ background:'var(--white)', border:'1px solid var(--bd)' }}>
                  {STAT_PILLS.map((s, i) => (
                    <div key={s.label} className="flex items-baseline gap-1.5">
                      {i > 0 && <span className="w-px h-4 mx-1" style={{ background:'var(--bd)', display:'inline-block' }} />}
                      <span className="text-[20px] font-black leading-none" style={{ color: s.color }}>{s.value}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color:'var(--t3)' }}>{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* toolbar */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* view tabs */}
                  <div className="flex items-center p-1 rounded-xl gap-0.5" style={{ background:'var(--white)', border:'1px solid var(--bd)' }}>
                    {VIEWS.map(v => (
                      <button key={v.id} onClick={() => setView(v.id)}
                        className="h-7 px-3.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all"
                        style={{
                          background: view===v.id ? 'var(--p)' : 'transparent',
                          color: view===v.id ? '#fff' : 'var(--t3)',
                        }}>
                        {v.label}
                      </button>
                    ))}
                  </div>

                  {/* status */}
                  <div className="relative">
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                      className="h-9 pl-3 pr-8 rounded-xl border text-[11px] font-semibold appearance-none cursor-pointer focus:outline-none"
                      style={{ background:'var(--white)', borderColor:'var(--bd)', color:'var(--t1)' }}>
                      {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color:'var(--t3)' }} />
                  </div>

                  {/* search */}
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color:'var(--t3)' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Search by name, email or session…"
                      className="w-full h-9 pl-9 pr-4 rounded-xl border text-[12px] focus:outline-none transition-colors"
                      style={{ background:'var(--white)', borderColor:'var(--bd)', color:'var(--t1)' }}
                      onFocus={e => (e.target as HTMLElement).style.borderColor='var(--p)'}
                      onBlur={e  => (e.target as HTMLElement).style.borderColor='var(--bd)'}
                    />
                  </div>

                  <span className="text-[11px] ml-auto" style={{ color:'var(--t3)' }}>
                    {visible.length} result{visible.length!==1?'s':''}
                  </span>
                </div>

                {/* list */}
                {visible.length === 0 ? (
                  <div className="rounded-2xl flex flex-col items-center justify-center py-20 text-center"
                    style={{ background:'var(--white)', border:'1.5px dashed var(--bd)' }}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                      style={{ background:'var(--p2)' }}>
                      <Inbox className="w-6 h-6" style={{ color:'var(--p)' }} />
                    </div>
                    <p className="text-[13px] font-bold" style={{ color:'var(--t1)' }}>No bookings found</p>
                    <p className="text-[12px] mt-1" style={{ color:'var(--t3)' }}>
                      {search || statusFilter!=='all' ? 'Try adjusting your filters' : 'Bookings show up once students book your sessions'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {visible.map(b => (
                      <BookingCard key={b._id} b={b} onConfirm={handleConfirm} onReject={handleReject} />
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
