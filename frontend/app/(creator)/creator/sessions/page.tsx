'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import {
  Clock, Plus, RefreshCw, Globe, Lock, Calendar,
  Users, Video, BookOpen, Activity, ChevronRight,
  ExternalLink, Zap,
} from 'lucide-react'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import { useCreatorSessionsPage } from '@/hooks/creator-dashboard/use-creator-dashboard-data'

const TR = {
  en: {
    title: 'Your Sessions', sub: (s: number, b: number) => `${s} sessions · ${b} bookings`,
    loading: 'Loading…', bookingList: 'Booking List', createSession: 'Create Session',
    totalSessions: 'Total Sessions', active: 'Active', totalBookings: 'Total Bookings',
    integrations: 'Integrations', gcalTitle: 'Google Calendar', gcalDesc: 'Sync your session slots automatically',
    gmeetTitle: 'Google Meet', gmeetDesc: 'Auto-generate Meet links for sessions',
    connect: 'Connect', disconnect: 'Disconnect', open: 'Open', connected: 'Connected',
    allSessions: 'All Sessions', all: 'All', inactive: 'Inactive',
    noSessions: 'No sessions yet', noSessionsDesc: 'Create your first 1-on-1 coaching session and start booking with students.',
    createFirst: 'Create your first session', upcoming: 'Upcoming Sessions',
    noUpcoming: 'No upcoming confirmed sessions', join: 'Join', pending: 'Pending',
    manage: 'Manage', free: 'Free', days: 'days', slots: 'slots/wk',
    live: 'Live', draft: 'Draft', viewAll: 'View all',
    upcomingNoMeet: 'No upcoming confirmed sessions', joinBtn: 'Join', pendingBadge: 'Pending',
    noSessionsAlt: 'No sessions',
  },
  ar: {
    title: 'جلساتك', sub: (s: number, b: number) => `${s} جلسات · ${b} حجوزات`,
    loading: 'جاري التحميل…', bookingList: 'قائمة الحجوزات', createSession: 'إنشاء جلسة',
    totalSessions: 'إجمالي الجلسات', active: 'نشط', totalBookings: 'إجمالي الحجوزات',
    integrations: 'التكاملات', gcalTitle: 'Google Calendar', gcalDesc: 'مزامنة فتحات جلساتك تلقائياً',
    gmeetTitle: 'Google Meet', gmeetDesc: 'إنشاء روابط Meet تلقائياً للجلسات',
    connect: 'ربط', disconnect: 'فصل', open: 'فتح', connected: 'متصل',
    allSessions: 'جميع الجلسات', all: 'الكل', inactive: 'غير نشط',
    noSessions: 'لا توجد جلسات بعد', noSessionsDesc: 'أنشئ أول جلسة تدريب فردية وابدأ في الحجز مع الطلاب.',
    createFirst: 'أنشئ جلستك الأولى', upcoming: 'الجلسات القادمة',
    noUpcoming: 'لا توجد جلسات قادمة مؤكدة', join: 'انضم', pending: 'معلّق',
    manage: 'إدارة', free: 'مجاني', days: 'أيام', slots: 'فتحة/أسبوع',
    live: 'مباشر', draft: 'مسودة', viewAll: 'عرض الكل',
    upcomingNoMeet: 'لا توجد جلسات قادمة مؤكدة', joinBtn: 'انضم', pendingBadge: 'معلّق',
    noSessionsAlt: 'لا توجد جلسات',
  },
}

// ─── types ────────────────────────────────────────────────────────────────────
interface SessionCard {
  _id: string; title: string; banner?: string; duration: number
  priceType: 'free'|'paid'; price?: number; isPublished: boolean
  availabilityDays: number; totalSlots: number
}
interface Booking {
  _id: string; studentName: string; studentEmail: string
  sessionId: string; sessionTitle: string; duration: number
  price: number; date: string
  status: 'pending'|'confirmed'|'rejected'|'completed'
  meetLink?: string
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US',{ weekday:'short', month:'short', day:'numeric' })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US',{ hour:'numeric', minute:'2-digit' })
}

// ─── skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse" style={{ background:'var(--white)', border:'1px solid var(--bd)' }}>
      <div className="aspect-video" style={{ background:'var(--bg)' }} />
      <div className="p-5 space-y-3">
        <div className="h-4 rounded-lg w-3/4" style={{ background:'var(--bg)' }} />
        <div className="h-3 rounded-lg w-full" style={{ background:'var(--bg)' }} />
        <div className="h-8 rounded-lg mt-2" style={{ background:'var(--bg)' }} />
      </div>
    </div>
  )
}

// ─── session card ─────────────────────────────────────────────────────────────
function SessionCardUI({ session, t }: { session: SessionCard; t: typeof TR['en'] }) {
  const dur = session.duration >= 60 ? `${session.duration/60}h` : `${session.duration}min`
  return (
    <div className="rounded-2xl overflow-hidden flex flex-col transition-all duration-200 group"
      style={{ background:'var(--white)', border:'1px solid var(--bd)', boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow='0 8px 32px rgba(0,0,0,.07)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow='0 2px 8px rgba(0,0,0,.04)'}>
      <div className="relative aspect-video overflow-hidden" style={{ background:'var(--bg)' }}>
        {session.banner
          ? <img src={session.banner} alt={session.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
          : <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-10 h-10 opacity-20" style={{ color:'var(--t3)' }} />
            </div>}
        <span className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
          style={{ background:'var(--p)', color:'#fff' }}>
          <Clock className="w-3 h-3" /> {dur}
        </span>
        <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold"
          style={{
            background: session.isPublished ? 'rgba(16,185,129,.15)' : 'rgba(0,0,0,.4)',
            color: session.isPublished ? '#10b981' : '#fff',
            backdropFilter:'blur(4px)',
          }}>
          {session.isPublished ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
          {session.isPublished ? t.live : t.draft}
        </span>
      </div>
      <div className="flex flex-col flex-1 p-5">
        <h3 className="text-[14px] font-bold leading-snug mb-3 line-clamp-2" style={{ color:'var(--t1)' }}>{session.title}</h3>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color:'var(--t3)' }}>
            <Calendar className="w-3 h-3" /> {session.availabilityDays} {t.days}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color:'var(--t3)' }}>
            <Clock className="w-3 h-3" /> {session.totalSlots} {t.slots}
          </span>
        </div>
        <div className="flex items-center justify-between pt-3.5 border-t mt-auto" style={{ borderColor:'var(--bd)' }}>
          <span className="text-[13px] font-bold" style={{ color:'var(--p)' }}>
            {session.priceType==='free' ? t.free : `${session.price ?? 0} TND`}
          </span>
          <Link href={`/creator/sessions/${session._id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-white transition-all hover:opacity-90"
            style={{ background:'var(--p)', boxShadow:'0 2px 8px rgba(142,120,251,.3)' }}>
            {t.manage}
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── integration button card ──────────────────────────────────────────────────
function IntegrationCard({
  icon: Icon, title, desc, connectedKey, accentColor,
  labelConnect = 'Connect', labelDisconnect = 'Disconnect', labelOpen = 'Open', labelConnected = 'Connected',
}: {
  icon: any; title: string; desc: string; connectedKey: string; accentColor: string
  labelConnect?: string; labelDisconnect?: string; labelOpen?: string; labelConnected?: string
}) {
  const [on, setOn] = useState(false)
  useEffect(() => { setOn(localStorage.getItem(connectedKey) === 'true') }, [connectedKey])
  const toggle = () => { const next = !on; localStorage.setItem(connectedKey, String(next)); setOn(next) }
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl"
      style={{ background:'var(--white)', border: on ? `1.5px solid ${accentColor}40` : '1px solid var(--bd)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: on ? `${accentColor}15` : 'var(--bg)' }}>
        <Icon className="w-5 h-5" style={{ color: on ? accentColor : 'var(--t3)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-bold" style={{ color:'var(--t1)' }}>{title}</p>
          {on && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ background:`${accentColor}15`, color: accentColor }}>{labelConnected}</span>
          )}
        </div>
        <p className="text-[11px] mt-0.5" style={{ color:'var(--t3)' }}>{desc}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {on && (
          <button onClick={() => window.open('#')}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-[11px] font-bold cursor-pointer transition-all hover:opacity-80"
            style={{ background:'var(--bg)', border:'1.5px solid var(--bd)', color:'var(--t2)' }}>
            <ExternalLink className="w-3 h-3" /> {labelOpen}
          </button>
        )}
        <button onClick={toggle}
          className="h-8 px-4 rounded-xl text-[11px] font-bold cursor-pointer transition-all hover:opacity-90"
          style={on
            ? { background:'var(--bg)', border:'1.5px solid var(--bd)', color:'var(--t3)' }
            : { background: accentColor, color:'#fff', boxShadow:`0 3px 10px ${accentColor}45` }
          }>
          {on ? labelDisconnect : labelConnect}
        </button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
export default function SessionsPage() {
  const { lang } = useDashPrefs()
  const t = TR[lang]
  const [tab,      setTab]      = useState<'all'|'active'|'inactive'>('all')
  const { sessions, bookings, loading, error, refetch: load } = useCreatorSessionsPage()

  const totalSessions  = sessions.length
  const activeSessions = sessions.filter(s => s.isPublished).length
  const totalBookings  = bookings.length

  const now = Date.now()
  const upcoming = bookings
    .filter(b => (b.status==='confirmed'||b.status==='pending') && new Date(b.date).getTime() > now)
    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0,5)

  const filtered = sessions.filter(s => {
    if (tab==='active')   return s.isPublished
    if (tab==='inactive') return !s.isPublished
    return true
  })

  const STATS = [
    { label: t.totalSessions, value: totalSessions,  icon: BookOpen, color:'var(--p)',    bg:'var(--p2)' },
    { label: t.active,        value: activeSessions, icon: Zap,      color:'var(--pink)', bg:'rgba(236,72,153,.1)' },
    { label: t.totalBookings, value: totalBookings,  icon: Users,    color:'var(--cyan)', bg:'rgba(34,211,238,.12)' },
  ]

  const TABS: { key: 'all'|'active'|'inactive'; label: string; count: number }[] = [
    { key:'all',      label: t.all,      count: totalSessions },
    { key:'active',   label: t.active,   count: activeSessions },
    { key:'inactive', label: t.inactive, count: totalSessions - activeSessions },
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
        <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar title={lang === 'ar' ? 'إدارة الجلسات' : 'Session Manager'} subtitle={lang === 'ar' ? 'إدارة جلسات التدريب الفردية' : 'Manage your 1-on-1 mentoring sessions'} />

          <main id="main-content" className="p-7 flex-1 space-y-6" style={{ animation:'dashFadeUp .4s ease both' }}>

            {/* ── HEADER ── */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[20px] font-black" style={{ color:'var(--t1)' }}>{t.title}</h2>
                <p className="text-[13px] mt-0.5" style={{ color:'var(--t3)' }}>
                  {loading ? t.loading : t.sub(totalSessions, totalBookings)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={load}
                  className="p-2.5 rounded-xl cursor-pointer transition-all"
                  style={{ border:'1.5px solid var(--bd)', background:'transparent', color:'var(--t3)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='var(--p2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='transparent'}>
                  <RefreshCw className="w-4 h-4" />
                </button>
                <Link href="/creator/sessions/bookings"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all hover:opacity-80"
                  style={{ background:'var(--white)', color:'var(--t1)', border:'1.5px solid var(--bd)' }}>
                  <Users className="w-4 h-4" /> {t.bookingList}
                </Link>
                <Link href="/creator/sessions/create"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90"
                  style={{ background:'var(--p)', boxShadow:'0 4px 14px rgba(142,120,251,.4)' }}>
                  <Plus className="w-4 h-4" /> {t.createSession}
                </Link>
              </div>
            </div>

            {/* ── STATS ROW ── */}
            {error && !loading && (
              <div className="px-4 py-3 rounded-xl text-sm"
                style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412' }}>
                Could not load all live session data. <button onClick={load} className="font-bold underline">Retry</button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {STATS.map(s => (
                <div key={s.label} className="rounded-2xl p-5 flex items-center gap-4"
                  style={{ background:'var(--white)', border:'1px solid var(--bd)', boxShadow:'0 2px 8px rgba(0,0,0,.03)' }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: s.bg }}>
                    <s.icon className="w-6 h-6" style={{ color: s.color }} />
                  </div>
                  <div>
                    <p className="text-[28px] font-black leading-none" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[12px] font-semibold mt-0.5" style={{ color:'var(--t2)' }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── INTEGRATIONS (above grid) ── */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color:'var(--t3)' }}>{t.integrations}</p>
              <div className="grid grid-cols-2 gap-3">
                <IntegrationCard
                  icon={Calendar} title={t.gcalTitle} desc={t.gcalDesc}
                  connectedKey="chabaqa_gcal_connected" accentColor="#10b981"
                  labelConnect={t.connect} labelDisconnect={t.disconnect} labelOpen={t.open} labelConnected={t.connected}
                />
                <IntegrationCard
                  icon={Video} title={t.gmeetTitle} desc={t.gmeetDesc}
                  connectedKey="chabaqa_gmeet_connected" accentColor="#4285F4"
                  labelConnect={t.connect} labelDisconnect={t.disconnect} labelOpen={t.open} labelConnected={t.connected}
                />
              </div>
            </div>

            {/* ── SESSIONS GRID ── */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[15px] font-bold" style={{ color:'var(--t1)' }}>{t.allSessions}</h3>
                <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background:'var(--white)', border:'1px solid var(--bd)' }}>
                  {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer transition-all"
                      style={{
                        background: tab===t.key ? 'var(--p)' : 'transparent',
                        color:      tab===t.key ? '#fff'     : 'var(--t3)',
                      }}>
                      {t.label}
                      <span className="text-[11px] w-5 h-5 rounded-full flex items-center justify-center font-bold"
                        style={{
                          background: tab===t.key ? 'rgba(255,255,255,.25)' : 'var(--bg)',
                          color: tab===t.key ? '#fff' : 'var(--t3)',
                        }}>
                        {t.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {[1,2,3].map(i => <SkeletonCard key={i} />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl flex flex-col items-center justify-center py-20 text-center"
                  style={{ background:'var(--white)', border:'1.5px dashed var(--bd)' }}>
                  <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4" style={{ background:'var(--p2)' }}>
                    <Calendar className="w-8 h-8" style={{ color:'var(--p)' }} />
                  </div>
                  <h3 className="text-[16px] font-bold mb-1.5" style={{ color:'var(--t1)' }}>{t.noSessions}</h3>
                  <p className="text-[13px] mb-6 max-w-xs" style={{ color:'var(--t2)' }}>{t.noSessionsDesc}</p>
                  <Link href="/creator/sessions/create"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-bold text-white hover:opacity-90"
                    style={{ background:'var(--p)', boxShadow:'0 4px 14px rgba(142,120,251,.35)' }}>
                    <Plus className="w-4 h-4" /> {t.createFirst}
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filtered.map(s => <SessionCardUI key={s._id} session={s} t={t} />)}
                </div>
              )}
            </div>

            {/* ── UPCOMING ── */}
            <div className="rounded-2xl overflow-hidden" style={{ background:'var(--white)', border:'1px solid var(--bd)' }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor:'var(--bd)' }}>
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-bold" style={{ color:'var(--t1)' }}>{t.upcoming}</p>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background:'var(--p2)', color:'var(--p)' }}>{upcoming.length}</span>
                </div>
                <Link href="/creator/sessions/bookings"
                  className="flex items-center gap-1 text-[12px] font-bold" style={{ color:'var(--p)' }}>
                  {t.viewAll} <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              {upcoming.length === 0 ? (
                <div className="flex items-center gap-3 px-5 py-5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background:'var(--p2)' }}>
                    <Calendar className="w-4 h-4" style={{ color:'var(--p)' }} />
                  </div>
                  <p className="text-[13px]" style={{ color:'var(--t2)' }}>{t.noUpcoming}</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor:'var(--bd)' }}>
                  {upcoming.map(b => (
                    <div key={b._id} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[11px] font-black"
                        style={{ background:'var(--p2)', color:'var(--p)' }}>
                        {initials(b.studentName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold truncate" style={{ color:'var(--t1)' }}>{b.studentName}</p>
                        <p className="text-[11px] truncate" style={{ color:'var(--t3)' }}>{b.sessionTitle}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[12px] font-semibold" style={{ color:'var(--t1)' }}>{fmtDate(b.date)}</p>
                        <p className="text-[11px]" style={{ color:'var(--t3)' }}>{fmtTime(b.date)}</p>
                      </div>
                      {b.meetLink ? (
                        <a href={b.meetLink} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 hover:opacity-90"
                          style={{ background:'var(--p)', color:'#fff', boxShadow:'0 2px 8px rgba(142,120,251,.3)' }}>
                          <Video className="w-3 h-3" /> {t.joinBtn}
                        </a>
                      ) : (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
                          style={{ background:'rgba(251,146,60,.12)', color:'var(--orange)' }}>
                          {t.pendingBadge}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </main>
        </div>
      </div>
    </>
  )
}
