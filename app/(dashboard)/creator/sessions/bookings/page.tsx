'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import {
  ArrowLeft, Video, Calendar, Clock, Search,
  CheckCircle2, XCircle, Loader2, Users,
  Inbox, Sparkles, ExternalLink, X,
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
function genMeetCode() {
  const r = () => Math.random().toString(36).slice(2,6)
  return `https://meet.google.com/${r().slice(0,3)}-${r()}-${r().slice(0,3)}`
}
function initials(name: string) {
  return name.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase()
}

// ─── Translations ─────────────────────────────────────────────────────────────
const TR = {
  en: {
    back:'Back to Sessions', title:'Booking List', subtitle:'Manage all your session bookings',
    totalBookings:'Total Bookings', pending:'Pending', confirmed:'Confirmed',
    all:'All', upcoming:'Upcoming', past:'Past',
    search:'Search by name, session…', results:'result',
    noBookings:'No bookings found',
    noDesc:'Bookings appear once students book your sessions',
    adjustFilters:'Try adjusting your filters',
    confirm:'Confirm', reject:'Reject', joinMeet:'Join Meet', recording:'Recording',
    min:'min',
    confirmBooking:'Confirm Booking', createMeetLink:'Create Meeting Link',
    generating:'Generating link…', successTitle:'Meeting Created!',
    successDesc:'Link is ready. Confirm to notify the student.',
    ok:'OK, Confirm Booking', cancel:'Cancel',
    statusAll:'All status', statusPending:'Pending', statusConfirmed:'Confirmed',
    statusCompleted:'Completed', statusRejected:'Rejected',
    filters:'Filters', statusFilter:'Status',
    labelFor:'for', labelOn:'on',
    pendingLabel:'Pending', confirmedLabel:'Confirmed', completedLabel:'Completed', rejectedLabel:'Rejected',
    tnd:'TND',
  },
  ar: {
    back:'العودة إلى الجلسات', title:'قائمة الحجوزات', subtitle:'إدارة جميع حجوزات جلساتك',
    totalBookings:'إجمالي الحجوزات', pending:'قيد الانتظار', confirmed:'مؤكدة',
    all:'الكل', upcoming:'القادمة', past:'السابقة',
    search:'بحث بالاسم أو الجلسة…', results:'نتيجة',
    noBookings:'لا توجد حجوزات',
    noDesc:'ستظهر الحجوزات بمجرد حجز الطلاب لجلساتك',
    adjustFilters:'حاول تعديل التصفية',
    confirm:'تأكيد', reject:'رفض', joinMeet:'الانضمام', recording:'التسجيل',
    min:'د',
    confirmBooking:'تأكيد الحجز', createMeetLink:'إنشاء رابط الاجتماع',
    generating:'جاري الإنشاء…', successTitle:'تم إنشاء الاجتماع!',
    successDesc:'الرابط جاهز. أكّد لإخطار الطالب.',
    ok:'موافق، تأكيد الحجز', cancel:'إلغاء',
    statusAll:'كل الحالات', statusPending:'قيد الانتظار', statusConfirmed:'مؤكدة',
    statusCompleted:'مكتملة', statusRejected:'مرفوضة',
    filters:'التصفية', statusFilter:'الحالة',
    labelFor:'لـ', labelOn:'في',
    pendingLabel:'قيد الانتظار', confirmedLabel:'مؤكد', completedLabel:'مكتمل', rejectedLabel:'مرفوض',
    tnd:'د.ت',
  },
}

// ─── Status config (design system colors only) ────────────────────────────────
const STATUS_COLORS = {
  pending:   { color:'var(--orange)', bg:'rgba(251,146,60,.12)', border:'rgba(251,146,60,.25)'  },
  confirmed: { color:'var(--p)',      bg:'var(--p2)',            border:'var(--p3)'              },
  completed: { color:'var(--cyan)',   bg:'rgba(34,211,238,.12)', border:'rgba(34,211,238,.25)'  },
  rejected:  { color:'var(--pink)',   bg:'rgba(236,72,153,.12)', border:'rgba(236,72,153,.25)'  },
}

// ─── Avatar colors ─────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['var(--p)', 'var(--pink)', 'var(--cyan)', 'var(--orange)']
function avatarColor(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % 4] }

// ─── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ booking, t, onConfirmed, onClose }: {
  booking: Booking
  t: typeof TR['en']
  onConfirmed: (id:string, link:string) => void
  onClose: () => void
}) {
  const [step, setStep] = useState<'idle'|'generating'|'success'>('idle')
  const [meetLink, setMeetLink] = useState('')

  const generate = async () => {
    setStep('generating')
    await new Promise(r => setTimeout(r, 1400))
    setMeetLink(genMeetCode())
    setStep('success')
  }

  const doConfirm = () => { onConfirmed(booking._id, meetLink); onClose() }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,.45)', backdropFilter:'blur(4px)', animation:'modalIn .2s ease both' }}>
      <div className="w-full max-w-[420px] rounded-[20px] overflow-hidden shadow-2xl"
        style={{ background:'var(--white)', border:'1px solid var(--bd)', animation:'cardIn .25s ease both' }}>

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-start justify-between"
          style={{ borderBottom:'1px solid var(--bd)' }}>
          <div>
            <p className="text-[15px] font-bold" style={{ color:'var(--t1)' }}>{t.confirmBooking}</p>
            <p className="text-[12px] mt-0.5 flex items-center gap-1.5" style={{ color:'var(--t3)' }}>
              <Video className="w-3.5 h-3.5 shrink-0" strokeWidth={1.7} />
              {booking.sessionTitle}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-colors hover:opacity-70"
            style={{ background:'var(--bg)', border:'1px solid var(--bd)' }}>
            <X className="w-4 h-4" style={{ color:'var(--t3)' }} />
          </button>
        </div>

        {/* Student + date info */}
        <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom:'1px solid var(--bd)' }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-[12px] font-black text-white"
            style={{ background: avatarColor(booking.studentName) }}>
            {initials(booking.studentName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold" style={{ color:'var(--t1)' }}>{booking.studentName}</p>
            <p className="text-[11px]" style={{ color:'var(--t3)' }}>{booking.studentEmail}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[12px] font-bold" style={{ color:'var(--t1)' }}>{fmtDate(booking.date)}</p>
            <p className="text-[11px]" style={{ color:'var(--t3)' }}>{fmtTime(booking.date)} · {booking.duration} {t.min}</p>
          </div>
        </div>

        {/* Meet link section */}
        <div className="px-6 py-5">
          {step === 'idle' && (
            <button onClick={generate}
              className="w-full h-12 rounded-2xl text-[13px] font-bold text-white flex items-center justify-center gap-2.5 cursor-pointer transition-opacity hover:opacity-90"
              style={{ background:'linear-gradient(135deg,var(--p) 0%,#6c52f0 100%)' }}>
              <Sparkles className="w-4 h-4" strokeWidth={1.8} />
              {t.createMeetLink}
            </button>
          )}

          {step === 'generating' && (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background:'var(--p2)' }}>
                <Loader2 className="w-6 h-6 animate-spin" style={{ color:'var(--p)' }} />
              </div>
              <p className="text-[13px] font-semibold" style={{ color:'var(--t2)' }}>{t.generating}</p>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-4">
              {/* Success banner */}
              <div className="rounded-2xl p-4 flex items-start gap-3"
                style={{ background:'var(--p2)', border:'1px solid var(--p3)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background:'var(--p)' }}>
                  <CheckCircle2 className="w-4.5 h-4.5 text-white" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold" style={{ color:'var(--p)' }}>{t.successTitle}</p>
                  <p className="text-[11px] mt-0.5" style={{ color:'var(--t3)' }}>{t.successDesc}</p>
                  {/* link chip */}
                  <div className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                    style={{ background:'var(--white)', border:'1px solid var(--p3)' }}>
                    <Video className="w-3 h-3 shrink-0" style={{ color:'var(--p)' }} strokeWidth={1.8} />
                    <span className="text-[10px] font-mono truncate" style={{ color:'var(--t2)' }}>{meetLink}</span>
                    <a href={meetLink} target="_blank" rel="noopener noreferrer" className="ml-auto shrink-0">
                      <ExternalLink className="w-3 h-3" style={{ color:'var(--p)' }} />
                    </a>
                  </div>
                  {/* session + date context */}
                  <div className="mt-2 flex items-center gap-3 text-[10px]" style={{ color:'var(--t3)' }}>
                    <span className="flex items-center gap-1"><Video className="w-2.5 h-2.5" strokeWidth={1.8} />{booking.sessionTitle}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5" strokeWidth={1.8} />{fmtDate(booking.date)}, {fmtTime(booking.date)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5">
                <button onClick={onClose}
                  className="flex-1 h-10 rounded-xl text-[12px] font-semibold cursor-pointer hover:opacity-70 transition-opacity"
                  style={{ background:'var(--bg)', border:'1px solid var(--bd)', color:'var(--t2)' }}>
                  {t.cancel}
                </button>
                <button onClick={doConfirm}
                  className="flex-[2] h-10 rounded-xl text-[12px] font-bold text-white cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  style={{ background:'var(--p)' }}>
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                  {t.ok}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Booking Card ─────────────────────────────────────────────────────────────
function BookingCard({ b, t, onConfirmClick, onReject }: {
  b: Booking; t: typeof TR['en']
  onConfirmClick: (b: Booking) => void
  onReject: (id:string) => void
}) {
  const [rejecting, setRejecting] = useState(false)
  const cfg = STATUS_COLORS[b.status]
  const statusLabel = { pending:t.pendingLabel, confirmed:t.confirmedLabel, completed:t.completedLabel, rejected:t.rejectedLabel }[b.status]

  const doReject = async () => {
    setRejecting(true)
    await new Promise(r => setTimeout(r, 350))
    onReject(b._id)
  }

  return (
    <div className="rounded-[16px] transition-all duration-200 overflow-hidden"
      style={{ background:'var(--white)', border:'1px solid var(--bd)' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow='0 6px 24px rgba(0,0,0,.07)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow='none'}>

      <div className="flex items-stretch">
        {/* Left accent bar */}
        <div className="w-[3px] shrink-0" style={{ background: cfg.color }} />

        <div className="flex-1 px-4 py-3.5">
          <div className="flex items-start gap-3">

            {/* Avatar */}
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-[12px] font-black text-white select-none"
              style={{ background: avatarColor(b.studentName) }}>
              {initials(b.studentName)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">

              {/* Top row: name + status */}
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <p className="text-[13px] font-bold leading-none" style={{ color:'var(--t1)' }}>{b.studentName}</p>
                  <p className="text-[11px] mt-0.5" style={{ color:'var(--t3)' }}>{b.studentEmail}</p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0"
                  style={{ background: cfg.bg, color: cfg.color, border:`1px solid ${cfg.border}` }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                  {statusLabel}
                </span>
              </div>

              {/* Meta row */}
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                  style={{ background:'var(--p2)', border:'1px solid var(--p3)' }}>
                  <Video className="w-3 h-3 shrink-0" style={{ color:'var(--p)' }} strokeWidth={1.8} />
                  <span className="text-[11px] font-semibold" style={{ color:'var(--p)' }}>{b.sessionTitle}</span>
                </div>
                <span className="flex items-center gap-1 text-[11px]" style={{ color:'var(--t3)' }}>
                  <Clock className="w-3 h-3" strokeWidth={1.7} />
                  {b.duration} {t.min}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color:'var(--t2)' }}>
                  <Calendar className="w-3 h-3" strokeWidth={1.7} />
                  {fmtDate(b.date)}, {fmtTime(b.date)}
                </span>
                {b.price > 0 && (
                  <span className="text-[11px] font-black ml-auto" style={{ color:'var(--p)' }}>
                    {b.price} {t.tnd}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {b.status === 'pending' && <>
                  <button onClick={() => onConfirmClick(b)}
                    className="h-8 px-4 rounded-xl text-[11px] font-bold text-white flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ background:'var(--p)' }}>
                    <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} /> {t.confirm}
                  </button>
                  <button onClick={doReject} disabled={rejecting}
                    className="h-8 px-3.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer hover:opacity-70 disabled:cursor-not-allowed transition-opacity"
                    style={{ background:'var(--bg)', border:'1px solid var(--bd)', color:'var(--t2)' }}>
                    {rejecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><XCircle className="w-3.5 h-3.5" strokeWidth={1.8} /> {t.reject}</>}
                  </button>
                </>}

                {b.status === 'confirmed' && <>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" style={{ color:'var(--p)' }} strokeWidth={2} />
                    <span className="text-[11px] font-semibold" style={{ color:'var(--p)' }}>{t.confirmedLabel}</span>
                  </div>
                  {b.meetLink && (
                    <a href={b.meetLink} target="_blank" rel="noopener noreferrer"
                      className="h-8 px-3.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ background:'var(--p2)', color:'var(--p)', border:'1px solid var(--p3)' }}>
                      <Video className="w-3.5 h-3.5" strokeWidth={1.8} /> {t.joinMeet}
                    </a>
                  )}
                </>}

                {b.status === 'completed' && <>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" style={{ color:'var(--cyan)' }} strokeWidth={2} />
                    <span className="text-[11px] font-semibold" style={{ color:'var(--cyan)' }}>{t.completedLabel}</span>
                  </div>
                  {b.meetLink && (
                    <a href={b.meetLink} target="_blank" rel="noopener noreferrer"
                      className="h-8 px-3.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ background:'rgba(34,211,238,.12)', color:'var(--cyan)', border:'1px solid rgba(34,211,238,.25)' }}>
                      <Video className="w-3.5 h-3.5" strokeWidth={1.8} /> {t.recording}
                    </a>
                  )}
                </>}

                {b.status === 'rejected' && (
                  <div className="flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" style={{ color:'var(--pink)' }} strokeWidth={1.8} />
                    <span className="text-[11px] font-semibold" style={{ color:'var(--pink)' }}>{t.rejectedLabel}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const router = useRouter()
  const { lang } = useDashPrefs()
  const t = TR[lang]

  const [bookings,     setBookings]     = useState<Booking[]>([])
  const [loading,      setLoading]      = useState(true)
  const [view,         setView]         = useState<'all'|'upcoming'|'past'>('all')
  const [statusFilter, setStatusFilter] = useState<'all'|Booking['status']>('all')
  const [search,       setSearch]       = useState('')
  const [modal,        setModal]        = useState<Booking|null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('chabaqa_mock_bookings')
      const data = raw ? JSON.parse(raw) : null
      if (data?.length) { setBookings(data) }
      else { localStorage.setItem('chabaqa_mock_bookings', JSON.stringify(SEED)); setBookings(SEED) }
    } catch { setBookings(SEED) }
    finally { setLoading(false) }
  }, [])

  const persist = (updated: Booking[]) => {
    setBookings(updated)
    localStorage.setItem('chabaqa_mock_bookings', JSON.stringify(updated))
  }
  const handleConfirmed = (id: string, meetLink: string) =>
    persist(bookings.map(b => b._id===id ? {...b, status:'confirmed', meetLink} : b))
  const handleReject = (id: string) =>
    persist(bookings.map(b => b._id===id ? {...b, status:'rejected'} : b))

  // Stats
  const total     = bookings.length
  const pending   = bookings.filter(b => b.status==='pending').length
  const confirmed = bookings.filter(b => b.status==='confirmed').length

  // Filtered list
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
      if (a.status==='pending' && b.status!=='pending') return -1
      if (b.status==='pending' && a.status!=='pending') return 1
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

  const VIEWS = [
    { id:'all',      label: t.all      },
    { id:'upcoming', label: t.upcoming },
    { id:'past',     label: t.past     },
  ] as const

  const STATUS_OPTS: { value:'all'|Booking['status']; label:string }[] = [
    { value:'all',       label: t.statusAll       },
    { value:'pending',   label: t.statusPending   },
    { value:'confirmed', label: t.statusConfirmed },
    { value:'completed', label: t.statusCompleted },
    { value:'rejected',  label: t.statusRejected  },
  ]

  return (
    <>
      <style>{`
        @keyframes dashFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes modalIn    { from{opacity:0}                             to{opacity:1}                        }
        @keyframes cardIn     { from{opacity:0;transform:scale(.96) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:var(--p3);border-radius:10px}
      `}</style>

      <div className="flex min-h-screen" style={{ background:'var(--bg)' }}>
        <DashSidebar />

        <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar title={t.title} subtitle={t.subtitle} />

          <main className="flex-1 flex gap-6 p-7" style={{ animation:'dashFadeUp .4s ease both' }}>

            {/* ── Left sidebar panel ──────────────────────────────── */}
            <aside className="w-[240px] shrink-0 flex flex-col gap-4">

              {/* Back */}
              <button onClick={() => router.push('/creator/sessions')}
                className="flex items-center gap-2 text-[12px] font-medium cursor-pointer hover:opacity-60 transition-opacity w-fit"
                style={{ color:'var(--t3)' }}>
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} /> {t.back}
              </button>

              {/* Stat cards */}
              <div className="space-y-3">
                {/* Total */}
                <div className="rounded-[16px] p-4 relative overflow-hidden"
                  style={{ background:'linear-gradient(135deg,var(--p) 0%,#6c52f0 100%)' }}>
                  <div className="absolute top-[-20px] right-[-20px] w-[80px] h-[80px] rounded-full opacity-[.15]"
                    style={{ background:'#fff' }} />
                  <p className="text-[11px] font-semibold text-white opacity-70 mb-1">{t.totalBookings}</p>
                  <p className="text-[32px] font-black text-white leading-none">{total}</p>
                  <div className="mt-2 flex items-center gap-1 text-white opacity-60">
                    <Users className="w-3 h-3" strokeWidth={1.8} />
                    <span className="text-[10px]">{bookings.filter(b=>isUpcoming(b.date)).length} {t.upcoming.toLowerCase()}</span>
                  </div>
                </div>

                {/* Pending */}
                <div className="rounded-[16px] p-4 relative overflow-hidden"
                  style={{ background:'rgba(236,72,153,.1)', border:'1px solid rgba(236,72,153,.2)' }}>
                  <div className="absolute top-[-20px] right-[-20px] w-[70px] h-[70px] rounded-full opacity-[.15]"
                    style={{ background:'var(--pink)' }} />
                  <p className="text-[11px] font-semibold mb-1" style={{ color:'var(--pink)', opacity:.8 }}>{t.pending}</p>
                  <p className="text-[32px] font-black leading-none" style={{ color:'var(--pink)' }}>{pending}</p>
                  <p className="text-[10px] mt-2 opacity-60" style={{ color:'var(--pink)' }}>{t.statusPending}</p>
                </div>

                {/* Confirmed */}
                <div className="rounded-[16px] p-4 relative overflow-hidden"
                  style={{ background:'rgba(34,211,238,.1)', border:'1px solid rgba(34,211,238,.2)' }}>
                  <div className="absolute top-[-20px] right-[-20px] w-[70px] h-[70px] rounded-full opacity-[.15]"
                    style={{ background:'var(--cyan)' }} />
                  <p className="text-[11px] font-semibold mb-1" style={{ color:'var(--cyan)', opacity:.8 }}>{t.confirmed}</p>
                  <p className="text-[32px] font-black leading-none" style={{ color:'var(--cyan)' }}>{confirmed}</p>
                  <p className="text-[10px] mt-2 opacity-60" style={{ color:'var(--cyan)' }}>{t.statusConfirmed}</p>
                </div>
              </div>

              {/* Filters panel */}
              <div className="rounded-[16px] p-4 space-y-3"
                style={{ background:'var(--white)', border:'1px solid var(--bd)' }}>
                <p className="text-[11px] font-bold uppercase tracking-[.06em]" style={{ color:'var(--t3)' }}>{t.filters}</p>

                {/* View tabs */}
                <div className="flex flex-col gap-1">
                  {VIEWS.map(v => (
                    <button key={v.id} onClick={() => setView(v.id)}
                      className="w-full h-8 px-3 rounded-xl text-[12px] font-semibold text-left cursor-pointer transition-all"
                      style={{
                        background: view===v.id ? 'var(--p2)' : 'transparent',
                        color: view===v.id ? 'var(--p)' : 'var(--t2)',
                        border: view===v.id ? '1px solid var(--p3)' : '1px solid transparent',
                      }}>
                      {v.label}
                    </button>
                  ))}
                </div>

                <div style={{ height:'1px', background:'var(--bd)' }} />

                {/* Status filter */}
                <p className="text-[10px] font-semibold" style={{ color:'var(--t3)' }}>{t.statusFilter}</p>
                <div className="flex flex-col gap-1">
                  {STATUS_OPTS.map(o => (
                    <button key={o.value} onClick={() => setStatusFilter(o.value)}
                      className="w-full h-8 px-3 rounded-xl text-[12px] font-semibold text-left cursor-pointer transition-all flex items-center gap-2"
                      style={{
                        background: statusFilter===o.value ? 'var(--p2)' : 'transparent',
                        color: statusFilter===o.value ? 'var(--p)' : 'var(--t2)',
                        border: statusFilter===o.value ? '1px solid var(--p3)' : '1px solid transparent',
                      }}>
                      {o.value !== 'all' && (
                        <span className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: STATUS_COLORS[o.value as Booking['status']]?.color ?? 'var(--t3)' }} />
                      )}
                      {o.label}
                      <span className="ml-auto text-[10px] font-bold rounded-full px-1.5"
                        style={{ background:'var(--bg)', color:'var(--t3)' }}>
                        {o.value==='all' ? bookings.length : bookings.filter(b=>b.status===o.value).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* ── Right main panel ─────────────────────────────────── */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">

              {/* Search bar */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color:'var(--t3)' }} strokeWidth={1.8} />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder={t.search}
                    className="w-full h-10 pl-10 pr-4 rounded-2xl border text-[12px] focus:outline-none transition-colors"
                    style={{ background:'var(--white)', borderColor:'var(--bd)', color:'var(--t1)' }}
                    onFocus={e => (e.target as HTMLElement).style.borderColor='var(--p)'}
                    onBlur={e  => (e.target as HTMLElement).style.borderColor='var(--bd)'}
                  />
                </div>
                <div className="text-[11px] font-semibold shrink-0 px-3 h-10 flex items-center rounded-2xl"
                  style={{ background:'var(--white)', border:'1px solid var(--bd)', color:'var(--t3)' }}>
                  {visible.length} {t.results}{visible.length!==1 && lang==='en' ? 's' : ''}
                </div>
              </div>

              {/* List */}
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color:'var(--p)' }} />
                </div>
              ) : visible.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center rounded-[20px] py-20 text-center"
                  style={{ background:'var(--white)', border:'1.5px dashed var(--bd)' }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background:'var(--p2)' }}>
                    <Inbox className="w-7 h-7" style={{ color:'var(--p)' }} strokeWidth={1.6} />
                  </div>
                  <p className="text-[14px] font-bold" style={{ color:'var(--t1)' }}>{t.noBookings}</p>
                  <p className="text-[12px] mt-1.5 max-w-[240px]" style={{ color:'var(--t3)' }}>
                    {search || statusFilter!=='all' ? t.adjustFilters : t.noDesc}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {visible.map(b => (
                    <BookingCard
                      key={b._id} b={b} t={t}
                      onConfirmClick={setModal}
                      onReject={handleReject}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* ── Confirm modal ─────────────────────────────────────────── */}
      {modal && (
        <ConfirmModal
          booking={modal} t={t}
          onConfirmed={handleConfirmed}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
