'use client'

import { useState } from 'react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import {
  Users, DollarSign, TrendingUp, RefreshCw,
  BookOpen, Calendar, Trophy, Zap, Package,
  Search, X, Star,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Subscription {
  id: string
  name: string
  email: string
  contentTitle: string
  contentType: 'course' | 'session' | 'event' | 'challenge' | 'product' | 'community'
  plan: string
  amount: number
  status: 'active' | 'cancelled' | 'expired'
  startDate: string
  renewalDate?: string
  paymentMethod: string
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

const SEED: Subscription[] = [
  { id: 's1',  name: 'Sarra Mansour',   email: 'sarra@gmail.com',       contentTitle: 'Motion Masters — Pro Plan',        contentType: 'community', plan: 'Pro Monthly',    amount: 49,  status: 'active',    startDate: '2026-03-01', renewalDate: '2026-05-01', paymentMethod: 'Visa •••• 4242' },
  { id: 's2',  name: 'Yassine Belhaj',  email: 'yassine@outlook.com',   contentTitle: 'Motion Design Fundamentals',       contentType: 'course',    plan: 'One-time',       amount: 120, status: 'active',    startDate: '2026-03-08', renewalDate: undefined,    paymentMethod: 'Mastercard •••• 8810' },
  { id: 's3',  name: 'Ines Trabelsi',   email: 'ines.t@gmail.com',      contentTitle: 'Motion Masters — Basic Plan',      contentType: 'community', plan: 'Basic Monthly',  amount: 29,  status: 'active',    startDate: '2026-02-15', renewalDate: '2026-05-15', paymentMethod: 'Visa •••• 1123' },
  { id: 's4',  name: 'Khalil Oueslati', email: 'khalil@proton.me',      contentTitle: '30-Day Body Challenge',            contentType: 'challenge', plan: 'One-time',       amount: 10,  status: 'active',    startDate: '2026-03-20', renewalDate: undefined,    paymentMethod: 'Visa •••• 7731' },
  { id: 's5',  name: 'Nour Ben Ali',    email: 'nour.benali@gmail.com', contentTitle: '1-on-1 Strategy Session',          contentType: 'session',   plan: 'One-time',       amount: 30,  status: 'active',    startDate: '2026-03-25', renewalDate: undefined,    paymentMethod: 'Mastercard •••• 5599' },
  { id: 's6',  name: 'Amira Chatti',    email: 'amira.c@gmail.com',     contentTitle: 'Motion Masters — Pro Plan',        contentType: 'community', plan: 'Pro Annual',     amount: 490, status: 'active',    startDate: '2026-01-10', renewalDate: '2027-01-10', paymentMethod: 'Visa •••• 3390' },
  { id: 's7',  name: 'Tarek Hamdi',     email: 'tarek.h@yahoo.com',     contentTitle: 'Annual Community Summit',          contentType: 'event',     plan: 'One-time',       amount: 25,  status: 'active',    startDate: '2026-03-28', renewalDate: undefined,    paymentMethod: 'Visa •••• 6621' },
  { id: 's8',  name: 'Rania Ferjani',   email: 'rania.f@gmail.com',     contentTitle: 'Branding Assets Pack',             contentType: 'product',   plan: 'One-time',       amount: 15,  status: 'active',    startDate: '2026-04-01', renewalDate: undefined,    paymentMethod: 'Mastercard •••• 4401' },
  { id: 's9',  name: 'Malek Sassi',     email: 'malek.s@gmail.com',     contentTitle: 'Motion Masters — Basic Plan',      contentType: 'community', plan: 'Basic Monthly',  amount: 29,  status: 'cancelled', startDate: '2026-01-05', renewalDate: undefined,    paymentMethod: 'Visa •••• 9912' },
  { id: 's10', name: 'Dorra Rekik',     email: 'dorra.r@outlook.com',   contentTitle: 'Motion Pro — Advanced Concepts',   contentType: 'course',    plan: 'One-time',       amount: 60,  status: 'active',    startDate: '2026-04-02', renewalDate: undefined,    paymentMethod: 'Visa •••• 2234' },
  { id: 's11', name: 'Bilel Gharbi',    email: 'bilel.g@gmail.com',     contentTitle: 'Motion Masters — Pro Plan',        contentType: 'community', plan: 'Pro Monthly',    amount: 49,  status: 'expired',   startDate: '2025-12-01', renewalDate: undefined,    paymentMethod: 'Mastercard •••• 7780' },
  { id: 's12', name: 'Syrine Mrad',     email: 'syrine.m@gmail.com',    contentTitle: '14-Day Portfolio Challenge',       contentType: 'challenge', plan: 'One-time',       amount: 0,   status: 'active',    startDate: '2026-04-03', renewalDate: undefined,    paymentMethod: 'Free' },
]

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = ['all', 'active', 'cancelled', 'expired'] as const

const STATUS_META: Record<Subscription['status'], { label: string; bg: string; color: string; border: string }> = {
  active:    { label: 'Active',    bg: 'rgba(74,222,128,.12)',  color: '#16a34a',       border: 'rgba(74,222,128,.3)'  },
  cancelled: { label: 'Cancelled', bg: 'rgba(239,68,68,.1)',    color: '#ef4444',       border: 'rgba(239,68,68,.25)'  },
  expired:   { label: 'Expired',   bg: 'var(--bg)',              color: 'var(--t3)',     border: 'var(--bd)'            },
}

const TYPE_META: Record<Subscription['contentType'], { icon: React.ReactNode; color: string }> = {
  community: { icon: <Users     className="w-3.5 h-3.5" strokeWidth={1.7} />, color: 'var(--p)'      },
  course:    { icon: <BookOpen  className="w-3.5 h-3.5" strokeWidth={1.7} />, color: 'var(--cyan)'   },
  session:   { icon: <Calendar  className="w-3.5 h-3.5" strokeWidth={1.7} />, color: 'var(--orange)' },
  event:     { icon: <Zap       className="w-3.5 h-3.5" strokeWidth={1.7} />, color: 'var(--pink)'   },
  challenge: { icon: <Trophy    className="w-3.5 h-3.5" strokeWidth={1.7} />, color: 'var(--orange)' },
  product:   { icon: <Package   className="w-3.5 h-3.5" strokeWidth={1.7} />, color: '#16a34a'       },
}

const AVATAR_COLORS = ['var(--p)', 'var(--cyan)', 'var(--orange)', 'var(--pink)', '#8b5cf6', '#14b8a6', '#f59e0b']
const initials = (n: string) => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string
}) {
  return (
    <div className="rounded-2xl p-5 flex gap-4 items-start"
      style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: color + '1a' }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div>
        <p className="text-[24px] font-bold leading-tight" style={{ color: 'var(--t1)' }}>{value}</p>
        <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--t2)' }}>{label}</p>
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--t3)' }}>{sub}</p>
      </div>
    </div>
  )
}

// ─── Subscription Row ─────────────────────────────────────────────────────────

const STATUS_LABELS_AR: Record<Subscription['status'], string> = {
  active:    'نشط',
  cancelled: 'ملغى',
  expired:   'منتهي',
}

function SubRow({ sub, idx, lang }: { sub: Subscription; idx: number; lang: string }) {
  const st  = STATUS_META[sub.status]
  const tm  = TYPE_META[sub.contentType]

  return (
    <div className="grid items-center px-5 py-3.5 transition-colors cursor-pointer"
      style={{
        gridTemplateColumns: '2.5fr 2fr 90px 90px 110px 100px',
        borderBottom: '1px solid var(--bd)',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>

      {/* subscriber */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-[11px] font-bold text-white"
          style={{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}>
          {initials(sub.name)}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--t1)' }}>{sub.name}</p>
          <p className="text-[11px] truncate" style={{ color: 'var(--t3)' }}>{sub.email}</p>
        </div>
      </div>

      {/* content */}
      <div className="min-w-0 pr-2">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span style={{ color: tm.color }}>{tm.icon}</span>
          <p className="text-[13px] font-medium truncate" style={{ color: 'var(--t1)' }}>{sub.contentTitle}</p>
        </div>
        <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{sub.plan}</p>
      </div>

      {/* amount */}
      <p className="text-[13px] font-bold" style={{ color: sub.amount > 0 ? '#16a34a' : 'var(--t3)' }}>
        {sub.amount > 0 ? `${sub.amount} TND` : 'Free'}
      </p>

      {/* status */}
      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border w-fit"
        style={{ background: st.bg, color: st.color, borderColor: st.border }}>
        {lang === 'ar' ? STATUS_LABELS_AR[sub.status] : st.label}
      </span>

      {/* date */}
      <div>
        <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{lang === 'ar' ? 'منذ' : 'Since'} {sub.startDate}</p>
        {sub.renewalDate && (
          <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{lang === 'ar' ? 'يتجدد' : 'Renews'} {sub.renewalDate}</p>
        )}
      </div>

      {/* payment */}
      <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{sub.paymentMethod}</p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SubscriptionsPage() {
  const { lang } = useDashPrefs()
  const [tab,    setTab]    = useState<typeof TABS[number]>('all')
  const [search, setSearch] = useState('')

  const filtered = SEED
    .filter(s => tab === 'all' || s.status === tab)
    .filter(s => !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.contentTitle.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
    )

  const active    = SEED.filter(s => s.status === 'active')
  const mrr       = active.filter(s => s.plan.includes('Monthly')).reduce((a, s) => a + s.amount, 0)
  const totalSubs = SEED.filter(s => s.status === 'active').length
  const totalRev  = SEED.reduce((a, s) => a + s.amount, 0)
  const avgAmount = Math.round(SEED.filter(s => s.amount > 0).reduce((a, s) => a + s.amount, 0) / (SEED.filter(s => s.amount > 0).length || 1))

  const tabCount = (t: string) => t === 'all' ? SEED.length : SEED.filter(s => s.status === t).length

  return (
    <>
      <style>{`
        @keyframes dashFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:var(--p3);border-radius:10px}
      `}</style>

      <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
        <DashSidebar />
        <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar
            title={lang === 'ar' ? 'الاشتراكات' : 'Subscriptions'}
            subtitle={lang === 'ar' ? 'تتبع كل مشترك ودفعة وتجديد' : 'Track every subscriber, payment and renewal'}
          />

          <main id="main-content" className="p-7 flex-1" style={{ animation: 'dashFadeUp .4s ease both' }}>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
              <KpiCard icon={<RefreshCw   className="w-5 h-5" />} label={lang === 'ar' ? 'الإيرادات الشهرية'  : 'Monthly Recurring'}   value={`${mrr} TND`}       sub={lang === 'ar' ? 'من الخطط النشطة'               : 'MRR from active plans'}                                                              color="var(--p)"      />
              <KpiCard icon={<Users       className="w-5 h-5" />} label={lang === 'ar' ? 'المشتركون النشطون' : 'Active Subscribers'}   value={String(totalSubs)}  sub={`${SEED.filter(s=>s.status==='cancelled').length} ${lang === 'ar' ? 'ملغى' : 'cancelled'}`}                                                color="var(--cyan)"   />
              <KpiCard icon={<DollarSign  className="w-5 h-5" />} label={lang === 'ar' ? 'إجمالي المحصّل'    : 'Total Collected'}      value={`${totalRev} TND`}  sub={lang === 'ar' ? 'منذ البداية'                   : 'all time'}                                                                          color="#16a34a"       />
              <KpiCard icon={<TrendingUp  className="w-5 h-5" />} label={lang === 'ar' ? 'متوسط قيمة الطلب'  : 'Avg. Order Value'}     value={`${avgAmount} TND`} sub={lang === 'ar' ? 'لكل اشتراك مدفوع'             : 'per paid subscription'}                                                             color="var(--orange)" />
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                {TABS.map(t => {
                  const tabLabel: Record<typeof t, string> = {
                    all:       lang === 'ar' ? 'الكل'    : 'All',
                    active:    lang === 'ar' ? 'نشط'     : 'Active',
                    cancelled: lang === 'ar' ? 'ملغى'    : 'Cancelled',
                    expired:   lang === 'ar' ? 'منتهي'   : 'Expired',
                  }
                  return (
                    <button key={t} onClick={() => setTab(t)}
                      className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[12px] font-semibold cursor-pointer transition-all"
                      style={tab === t ? { background: 'var(--p)', color: '#fff' } : { color: 'var(--t3)' }}>
                      {tabLabel[t]}
                      <span className="text-[11px] px-1.5 py-0.5 rounded-full"
                        style={tab === t ? { background: 'rgba(255,255,255,.25)', color: '#fff' } : { background: 'var(--bg)', color: 'var(--t3)' }}>
                        {tabCount(t)}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center gap-2 flex-1 min-w-[180px] h-9 px-3 rounded-xl ml-auto"
                style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                <Search className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--t3)' }} strokeWidth={1.7} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={lang === 'ar' ? 'ابحث بالاسم أو البريد أو المحتوى…' : 'Search by name, email or content…'}
                  className="flex-1 bg-transparent text-[13px] outline-none" style={{ color: 'var(--t1)' }} />
                {search && (
                  <button onClick={() => setSearch('')} style={{ color: 'var(--t3)' }}><X className="w-3.5 h-3.5" /></button>
                )}
              </div>

              <p className="text-[12px] font-medium shrink-0" style={{ color: 'var(--t3)' }}>
                {filtered.length} {lang === 'ar' ? 'نتيجة' : filtered.length !== 1 ? 'results' : 'result'}
              </p>
            </div>

            {/* Table */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
              {/* header */}
              <div className="grid px-5 py-3"
                style={{ gridTemplateColumns: '2.5fr 2fr 90px 90px 110px 100px', borderBottom: '1px solid var(--bd)', background: 'var(--bg)' }}>
                {([
                  lang === 'ar' ? 'المشترك'  : 'Subscriber',
                  lang === 'ar' ? 'المحتوى'  : 'Content',
                  lang === 'ar' ? 'المبلغ'   : 'Amount',
                  lang === 'ar' ? 'الحالة'   : 'Status',
                  lang === 'ar' ? 'التواريخ' : 'Dates',
                  lang === 'ar' ? 'الدفع'    : 'Payment',
                ] as string[]).map(h => (
                  <p key={h} className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--t3)' }}>{h}</p>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-3 text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--p2)' }}>
                    <Users className="w-7 h-7" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
                  </div>
                  <p className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>{lang === 'ar' ? 'لا توجد اشتراكات' : 'No subscriptions yet'}</p>
                  <p className="text-[12px]" style={{ color: 'var(--t2)' }}>{lang === 'ar' ? 'ستظهر الاشتراكات هنا عند انضمام الأعضاء' : 'Subscriptions will appear here when members join'}</p>
                </div>
              ) : (
                filtered.map((s, i) => <SubRow key={s.id} sub={s} idx={i} lang={lang} />)
              )}
            </div>

            <div className="h-6" />
          </main>
        </div>
      </div>
    </>
  )
}
