'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Inbox } from 'lucide-react'
import DashSidebar  from '@/components/creator-dashboard/DashSidebar'
import DashTopbar   from '@/components/creator-dashboard/DashTopbar'
import KPIBar       from '@/components/creator-dashboard/bookings/KPIBar'
import FilterBar    from '@/components/creator-dashboard/bookings/FilterBar'
import BookingCard, { type Booking } from '@/components/creator-dashboard/bookings/BookingCard'
import ConfirmModal from '@/components/creator-dashboard/bookings/ConfirmModal'

// ─── Seed ────────────────────────────────────────────────────────────────────
const SEED: Booking[] = [
  {
    _id:'bk1', studentName:'Omar Souissi',     studentEmail:'omar@example.com',
    initials:'OS', avatarColor:'#F97316',
    sessionTitle:'UI/UX Deep Dive',       duration:'90 min',
    date:'Fri, Mar 27, 2:58 PM',          status:'rejected',  price:'120 TND',
  },
  {
    _id:'bk2', studentName:'Yassine Trabelsi', studentEmail:'yassine@example.com',
    initials:'YT', avatarColor:'#EC4899',
    sessionTitle:'Career Coaching',       duration:'30 min',
    date:'Tue, Mar 31, 2:58 PM',          status:'completed', price:'50 TND',
    meetLink:'https://meet.google.com/xyz-uvwx-yz',
  },
  {
    _id:'bk3', studentName:'Amina Khaled',     studentEmail:'amina@example.com',
    initials:'AK', avatarColor:'#EF4444',
    sessionTitle:'Career Coaching',       duration:'30 min',
    date:'Tomorrow, 2:58 PM',             status:'confirmed', price:'50 TND',
    meetLink:'https://meet.google.com/amn-bcde-fgh',
  },
  {
    _id:'bk4', studentName:'Mohamed Ismail',   studentEmail:'ismail@example.com',
    initials:'MI', avatarColor:'#EF4444',
    sessionTitle:'React Mastery 1-on-1', duration:'60 min',
    date:'Sun, Apr 5, 2:58 PM',           status:'rejected',  price:'80 TND',
  },
  {
    _id:'bk5', studentName:'Sara Bouaziz',     studentEmail:'sara@example.com',
    initials:'SB', avatarColor:'#8B5CF6',
    sessionTitle:'Product Thinking 101', duration:'45 min',
    date:'Mon, Apr 7, 10:00 AM',          status:'confirmed', price:'90 TND',
    meetLink:'https://meet.google.com/prd-think-101',
  },
  {
    _id:'bk6', studentName:'Khalil Mansour',   studentEmail:'khalil@example.com',
    initials:'KM', avatarColor:'#0EA5E9',
    sessionTitle:'JavaScript Bootcamp', duration:'120 min',
    date:'Wed, Apr 9, 3:00 PM',           status:'pending',   price:'150 TND',
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
const isUpcoming = (d: string) =>
  d.startsWith('Tomorrow') ||
  ['Apr 5','Apr 7','Apr 9'].some(k => d.includes(k))   // simple for mock data

type Status = 'all'|'confirmed'|'completed'|'rejected'|'pending'
type Sort   = 'date'|'price'|'status'
type View   = 'all'|'upcoming'|'past'

const PRICE_VAL = (p:string) => parseFloat(p.replace(/[^0-9.]/g,'')) || 0
const STATUS_ORDER = { pending:0, confirmed:1, completed:2, rejected:3 }

// ─── Page ────────────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const router = useRouter()

  const [bookings,  setBookings]  = useState<Booking[]>([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState<Booking|null>(null)

  const [search,    setSearch]    = useState('')
  const [view,      setView]      = useState<View>('all')
  const [status,    setStatus]    = useState<Status>('all')
  const [sort,      setSort]      = useState<Sort>('date')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('chabaqa_bookings_v2')
      const data = raw ? JSON.parse(raw) : null
      if (data?.length) setBookings(data)
      else { localStorage.setItem('chabaqa_bookings_v2', JSON.stringify(SEED)); setBookings(SEED) }
    } catch { setBookings(SEED) }
    finally   { setLoading(false) }
  }, [])

  const persist = (next: Booking[]) => {
    setBookings(next)
    localStorage.setItem('chabaqa_bookings_v2', JSON.stringify(next))
  }

  const handleConfirmed = (id:string, meetLink:string) =>
    persist(bookings.map(b => b._id===id ? {...b, status:'confirmed', meetLink} : b))
  const handleReject = (id:string) =>
    persist(bookings.map(b => b._id===id ? {...b, status:'rejected'} : b))

  // ── Filter + sort ──────────────────────────────────────────────────────────
  const visible = bookings
    .filter(b => {
      if (view==='upcoming' && !isUpcoming(b.date)) return false
      if (view==='past'     &&  isUpcoming(b.date)) return false
      if (status!=='all' && b.status!==status) return false
      if (search) {
        const q = search.toLowerCase()
        return b.studentName.toLowerCase().includes(q) || b.sessionTitle.toLowerCase().includes(q)
      }
      return true
    })
    .sort((a, b) => {
      if (sort==='price')  return PRICE_VAL(b.price) - PRICE_VAL(a.price)
      if (sort==='status') return STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      // date: pending first, then chronological
      if (a.status==='pending' && b.status!=='pending') return -1
      if (b.status==='pending' && a.status!=='pending') return 1
      return 0
    })

  // ── KPI counts ─────────────────────────────────────────────────────────────
  const total     = bookings.length
  const pending   = bookings.filter(b => b.status==='pending').length
  const confirmed = bookings.filter(b => b.status==='confirmed').length

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
        @keyframes slideUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0}                             to{opacity:1}                        }
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:10px}
      `}</style>

      <div className="flex min-h-screen bg-slate-50">
        <DashSidebar />

        <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar title="Booking List" subtitle="Manage your sessions" />

          {/* KPI row */}
          {!loading && <KPIBar total={total} pending={pending} confirmed={confirmed} />}

          {/* Filter bar */}
          {!loading && (
            <FilterBar
              search={search}   setSearch={setSearch}
              view={view}       setView={setView}
              status={status}   setStatus={setStatus}
              sort={sort}       setSort={setSort}
              count={visible.length}
            />
          )}

          {/* Back nav */}
          <div className="px-7 pt-5 pb-2">
            <button onClick={() => router.push('/creator/sessions')}
              className="flex items-center gap-1.5 text-[12px] font-medium text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              style={{ fontFamily:"'DM Sans',sans-serif" }}>
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} /> Back to Sessions
            </button>
          </div>

          {/* List */}
          <main className="flex-1 px-7 pb-10">
            {loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-500 animate-spin" />
              </div>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-slate-200 bg-white mt-2">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Inbox className="w-7 h-7 text-slate-400" strokeWidth={1.6} />
                </div>
                <p className="text-[14px] font-semibold text-slate-700"
                  style={{ fontFamily:"'Sora',sans-serif" }}>
                  No bookings found
                </p>
                <p className="text-[12px] text-slate-400 mt-1.5 max-w-[240px] text-center"
                  style={{ fontFamily:"'DM Sans',sans-serif" }}>
                  {search || status!=='all' ? 'Try adjusting your filters' : 'Bookings appear once students book your sessions'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 mt-2">
                {visible.map((b, i) => (
                  <BookingCard
                    key={b._id}
                    booking={b}
                    index={i}
                    onConfirmClick={setModal}
                    onReject={handleReject}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {modal && (
        <ConfirmModal
          booking={{ ...modal, duration: modal.duration, date: modal.date }}
          onConfirmed={handleConfirmed}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
