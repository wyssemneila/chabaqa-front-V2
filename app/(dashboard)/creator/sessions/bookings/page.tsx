'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Search, ChevronDown,
  CalendarDays, TrendingUp, CheckCircle2,
  Inbox, Moon, Sun, Globe,
} from 'lucide-react'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import BookingCard, { type Booking } from '@/components/creator-dashboard/bookings/BookingCard'

// ─── Seed data ────────────────────────────────────────────────────────────────
const SEED: Booking[] = [
  {
    _id: 'bk1', studentName: 'Omar Souissi',     studentEmail: 'omar@example.com',
    initials: 'OS', avatarColor: '#F97316',
    sessionTitle: 'UI/UX Deep Dive',       duration: '90 min',
    date: 'Fri, Mar 27, 2:58 PM',          status: 'rejected',  price: '120 TND',
  },
  {
    _id: 'bk2', studentName: 'Yassine Trabelsi', studentEmail: 'yassine@example.com',
    initials: 'YT', avatarColor: '#EC4899',
    sessionTitle: 'Career Coaching',       duration: '30 min',
    date: 'Tue, Mar 31, 2:58 PM',          status: 'completed', price: '50 TND',
    meetLink: 'https://meet.google.com/xyz-uvwx-yz',
  },
  {
    _id: 'bk3', studentName: 'Amina Khaled',     studentEmail: 'amina@example.com',
    initials: 'AK', avatarColor: '#EF4444',
    sessionTitle: 'Career Coaching',       duration: '30 min',
    date: 'Tomorrow, 2:58 PM',             status: 'confirmed', price: '50 TND',
    meetLink: 'https://meet.google.com/amn-bcde-fgh',
  },
  {
    _id: 'bk4', studentName: 'Mohamed Ismail',   studentEmail: 'ismail@example.com',
    initials: 'MI', avatarColor: '#EF4444',
    sessionTitle: 'React Mastery 1-on-1', duration: '60 min',
    date: 'Sun, Apr 5, 2:58 PM',           status: 'rejected',  price: '80 TND',
  },
  {
    _id: 'bk5', studentName: 'Sara Bouaziz',     studentEmail: 'sara@example.com',
    initials: 'SB', avatarColor: '#8B5CF6',
    sessionTitle: 'Product Thinking 101', duration: '45 min',
    date: 'Mon, Apr 7, 10:00 AM',          status: 'confirmed', price: '90 TND',
    meetLink: 'https://meet.google.com/prd-think-101',
  },
  {
    _id: 'bk6', studentName: 'Khalil Mansour',   studentEmail: 'khalil@example.com',
    initials: 'KM', avatarColor: '#0EA5E9',
    sessionTitle: 'JavaScript Bootcamp', duration: '120 min',
    date: 'Wed, Apr 9, 3:00 PM',           status: 'pending',   price: '150 TND',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
type View   = 'all' | 'upcoming' | 'past'
type Status = 'all' | 'confirmed' | 'completed' | 'rejected' | 'pending'

const UPCOMING_DATES = ['Tomorrow', 'Apr 5', 'Apr 7', 'Apr 9']
const isUpcoming = (d: string) => UPCOMING_DATES.some(k => d.includes(k))

const PJS = { fontFamily: "'Plus Jakarta Sans', sans-serif" }

// ─── Page ────────────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const router          = useRouter()
  const { dark, lang, toggleDark, toggleLang } = useDashPrefs()

  const [bookings,  setBookings]  = useState<Booking[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [view,      setView]      = useState<View>('all')
  const [status,    setStatus]    = useState<Status>('all')

  // load
  useEffect(() => {
    try {
      const raw  = localStorage.getItem('chabaqa_bookings_v3')
      const data = raw ? JSON.parse(raw) : null
      if (data?.length) setBookings(data)
      else { localStorage.setItem('chabaqa_bookings_v3', JSON.stringify(SEED)); setBookings(SEED) }
    } catch { setBookings(SEED) }
    finally   { setLoading(false) }
  }, [])

  // ── filter ────────────────────────────────────────────────────────────────
  const visible = bookings.filter(b => {
    if (view === 'upcoming' && !isUpcoming(b.date)) return false
    if (view === 'past'     &&  isUpcoming(b.date)) return false
    if (status !== 'all' && b.status !== status)    return false
    if (search) {
      const q = search.toLowerCase()
      return b.studentName.toLowerCase().includes(q) || b.sessionTitle.toLowerCase().includes(q)
    }
    return true
  })

  // ── KPI counts ─────────────────────────────────────────────────────────────
  const total     = bookings.length
  const upcoming  = bookings.filter(b => isUpcoming(b.date)).length
  const confirmed = bookings.filter(b => b.status === 'confirmed').length

  const STATS = [
    { label: lang === 'ar' ? 'الإجمالي' : 'Total',     value: total,     Icon: CalendarDays  },
    { label: lang === 'ar' ? 'القادمة'  : 'Upcoming',  value: upcoming,  Icon: TrendingUp    },
    { label: lang === 'ar' ? 'مؤكدة'   : 'Confirmed', value: confirmed, Icon: CheckCircle2  },
  ]

  const VIEW_CHIPS: { id: View; label: string }[] = [
    { id: 'all',      label: lang === 'ar' ? 'الكل'    : 'All'      },
    { id: 'upcoming', label: lang === 'ar' ? 'القادمة' : 'Upcoming' },
    { id: 'past',     label: lang === 'ar' ? 'السابقة' : 'Past'     },
  ]

  const STATUS_OPTS: { value: Status; label: string }[] = [
    { value: 'all',       label: lang === 'ar' ? 'كل الحالات' : 'All Status'  },
    { value: 'confirmed', label: lang === 'ar' ? 'مؤكدة'      : 'Confirmed'   },
    { value: 'completed', label: lang === 'ar' ? 'مكتملة'     : 'Completed'   },
    { value: 'rejected',  label: lang === 'ar' ? 'مرفوضة'     : 'Rejected'    },
    { value: 'pending',   label: lang === 'ar' ? 'انتظار'     : 'Pending'     },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes cardIn   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pageIn   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar { width: 5px }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px }
      `}</style>

      <div className="min-h-screen bg-slate-50" style={PJS}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-4">

            {/* Left: back + title */}
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => router.push('/creator/sessions')}
                className="flex items-center gap-1.5 text-[12px] font-medium text-slate-400
                           hover:text-slate-700 transition-colors cursor-pointer shrink-0">
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.7} />
                {lang === 'ar' ? 'رجوع' : 'Back'}
              </button>
              <div className="w-px h-4 bg-slate-200 shrink-0" />
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-slate-900 leading-tight">
                  {lang === 'ar' ? 'قائمة الحجوزات' : 'Booking List'}
                </p>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  {lang === 'ar' ? 'إدارة حجوزات جلساتك' : 'Manage your session bookings'}
                </p>
              </div>
            </div>

            {/* Right: lang + dark toggle */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={toggleLang}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white
                           text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
                <Globe className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.7} />
                {lang === 'ar' ? 'EN' : 'AR'}
              </button>
              <button
                onClick={toggleDark}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center
                           text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer">
                {dark
                  ? <Sun className="w-4 h-4" strokeWidth={1.7} />
                  : <Moon className="w-4 h-4" strokeWidth={1.7} />
                }
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-6 py-6 space-y-4" style={{ animation: 'pageIn .35s ease both' }}>

          {/* ── Stats row ─────────────────────────────────────────────────── */}
          {!loading && (
            <div className="flex items-center gap-3">
              {STATS.map(s => (
                <div key={s.label}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200">
                  <s.Icon className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.7} />
                  <span className="text-[12px] font-medium text-slate-500">{s.label}</span>
                  <span className="text-[16px] font-bold text-slate-900 leading-none">{s.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Toolbar ───────────────────────────────────────────────────── */}
          {!loading && (
            <div className="flex items-center gap-2.5 flex-wrap">

              {/* Search */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" strokeWidth={1.7} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={lang === 'ar' ? 'بحث بالاسم أو الجلسة…' : 'Search by name or session…'}
                  style={PJS}
                  className="w-full h-9 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-[13px]
                             text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2
                             focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                />
              </div>

              {/* View chips */}
              <div className="flex items-center gap-0.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
                {VIEW_CHIPS.map(c => (
                  <button key={c.id} onClick={() => setView(c.id)}
                    style={PJS}
                    className={`h-7 px-3.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
                      view === c.id
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}>
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Status dropdown */}
              <div className="relative">
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as Status)}
                  style={PJS}
                  className="h-9 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold
                             text-slate-600 appearance-none cursor-pointer focus:outline-none focus:ring-2
                             focus:ring-indigo-500/20 focus:border-indigo-400 transition-all">
                  {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Result count */}
              <div className="px-3 h-9 flex items-center rounded-xl bg-white border border-slate-200
                              text-[12px] font-semibold text-slate-500 shrink-0"
                style={PJS}>
                {visible.length} {lang === 'ar' ? 'نتيجة' : `result${visible.length !== 1 ? 's' : ''}`}
              </div>
            </div>
          )}

          {/* ── Cards list ────────────────────────────────────────────────── */}
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin" />
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl
                            border border-dashed border-slate-200">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Inbox className="w-7 h-7 text-slate-400" strokeWidth={1.6} />
              </div>
              <p className="text-[14px] font-bold text-slate-700">
                {lang === 'ar' ? 'لا توجد حجوزات' : 'No bookings found'}
              </p>
              <p className="text-[12px] text-slate-400 mt-1.5 text-center max-w-[240px]">
                {search || status !== 'all'
                  ? (lang === 'ar' ? 'حاول تعديل التصفية' : 'Try adjusting your filters')
                  : (lang === 'ar' ? 'ستظهر الحجوزات بمجرد حجز الطلاب لجلساتك' : 'Bookings appear once students book your sessions')}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {visible.map((b, i) => (
                <BookingCard key={b._id} booking={b} index={i} />
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  )
}
