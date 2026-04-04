'use client'

import { useMemo, useState } from 'react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import {
  TrendingUp, TrendingDown, Users, DollarSign, BookOpen,
  Zap, Calendar, Trophy, Package, BarChart2, Star,
  ArrowUpRight, ArrowDownRight, Eye, MousePointerClick,
  UserPlus, UserMinus, Globe, Filter,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = '7d' | '30d' | '3m' | '6m' | '1y'
type ContentType = 'all' | 'courses' | 'sessions' | 'events' | 'challenges' | 'products'

// ─── Seeded RNG ───────────────────────────────────────────────────────────────
// Deterministic so charts don't flicker on re-render

function seededRng(seed: number) {
  let s = seed
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
}

// ─── Data Generation ──────────────────────────────────────────────────────────

function genTimeSeries(points: number, base: number, variance: number, trend: number, seed: number) {
  const rng = seededRng(seed)
  return Array.from({ length: points }, (_, i) => {
    const trendComponent = i * trend
    const noise = (rng() - 0.5) * variance
    return Math.max(0, Math.round(base + trendComponent + noise))
  })
}

function genLabels(period: Period): string[] {
  const today = new Date()
  const fmt = (d: Date, p: Period) => {
    if (p === '7d' || p === '30d') return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
    return d.toLocaleDateString('en-GB', { month: 'short', year: p === '1y' ? '2-digit' : undefined })
  }
  const config: Record<Period, { count: number; step: number }> = {
    '7d': { count: 7, step: 86400000 },
    '30d': { count: 10, step: 3 * 86400000 },
    '3m': { count: 12, step: 7 * 86400000 },
    '6m': { count: 12, step: 15 * 86400000 },
    '1y': { count: 12, step: 30 * 86400000 },
  }
  const { count, step } = config[period]
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today.getTime() - (count - 1 - i) * step)
    return fmt(d, period)
  })
}

type ChartDataset = { labels: string[]; revenue: number[]; members: number[]; enrollments: number[] }

function buildDataset(period: Period, contentType: ContentType): ChartDataset {
  const pts = genLabels(period).length
  const multiplier: Record<ContentType, number> = {
    all: 1, courses: 0.45, sessions: 0.2, events: 0.15, challenges: 0.1, products: 0.1,
  }
  const m = multiplier[contentType]
  const periodMult: Record<Period, number> = { '7d': 0.25, '30d': 1, '3m': 4.2, '6m': 8.5, '1y': 35 }
  const pm = periodMult[period]

  return {
    labels:      genLabels(period),
    revenue:     genTimeSeries(pts, 420 * m, 180 * m, 12 * m, 42),
    members:     genTimeSeries(pts, 18 * m, 8 * m, 1.5 * m, 77),
    enrollments: genTimeSeries(pts, 32 * m, 14 * m, 2 * m, 99),
  }
}

function sumSeries(arr: number[]) { return arr.reduce((a, b) => a + b, 0) }
function avgSeries(arr: number[]) { return Math.round(sumSeries(arr) / (arr.length || 1)) }

// ─── SVG Chart ────────────────────────────────────────────────────────────────

function AreaChart({
  data, labels, color, height = 120, showDots = false, xLabels = 5, unit = '',
}: {
  data: number[]; labels: string[]; color: string; height?: number
  showDots?: boolean; xLabels?: number; unit?: string
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  if (data.length < 2) return null
  const W = 600, H = height
  const min = Math.min(...data) * 0.9
  const max = Math.max(...data) * 1.05
  const range = (max - min) || 1

  const x = (i: number) => (i / (data.length - 1)) * W
  const y = (v: number) => H - 4 - ((v - min) / range) * (H - 24)

  let lineD = `M${x(0).toFixed(1)},${y(data[0]).toFixed(1)}`
  for (let i = 1; i < data.length; i++) {
    const x0 = x(i - 1), y0 = y(data[i - 1])
    const x1 = x(i),     y1 = y(data[i])
    const cx = (x0 + x1) / 2
    lineD += ` C${cx.toFixed(1)},${y0.toFixed(1)} ${cx.toFixed(1)},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`
  }
  const areaD = `${lineD} L${W},${H} L0,${H} Z`
  const gradId = `ag${color.replace(/[^a-zA-Z0-9]/g, '')}`

  const step = Math.max(1, Math.floor(data.length / xLabels))
  const xTickIdx = Array.from({ length: data.length }, (_, i) => i).filter((_, i) => i === 0 || i === data.length - 1 || i % step === 0)

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
    const mouseX = ((e.clientX - rect.left) / rect.width) * W
    let closest = 0, minDist = Infinity
    for (let i = 0; i < data.length; i++) {
      const dist = Math.abs(x(i) - mouseX)
      if (dist < minDist) { minDist = dist; closest = i }
    }
    setHoverIdx(closest)
  }

  // Tooltip x% — clamped so it doesn't bleed off edges
  const tipPct = hoverIdx !== null ? Math.max(5, Math.min(95, (x(hoverIdx) / W) * 100)) : 0

  return (
    <div style={{ position: 'relative' }}>
      {/* Hover tooltip */}
      {hoverIdx !== null && (
        <div className="absolute pointer-events-none z-10 flex flex-col items-center"
          style={{ left: `${tipPct}%`, top: 0, transform: 'translateX(-50%)', transition: 'left .08s' }}>
          <div className="px-3 py-2 rounded-xl shadow-xl"
            style={{ background: 'var(--t1)', color: 'var(--white)', whiteSpace: 'nowrap', minWidth: 80, textAlign: 'center' }}>
            <p className="text-[10px] leading-none mb-1.5" style={{ opacity: .6 }}>{labels[hoverIdx]}</p>
            <p className="text-[14px] font-bold leading-none">
              {data[hoverIdx].toLocaleString()}{unit && <span className="text-[10px] font-normal ml-1 opacity-70">{unit}</span>}
            </p>
          </div>
          <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid var(--t1)' }} />
        </div>
      )}

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}
        style={{ display: 'block', overflow: 'visible', cursor: 'crosshair', marginTop: hoverIdx !== null ? 0 : 0 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0"    />
          </linearGradient>
        </defs>
        {/* grid lines */}
        {[0.25, 0.5, 0.75].map(f => (
          <line key={f} x1="0" y1={y(min + range * f).toFixed(1)} x2={W} y2={y(min + range * f).toFixed(1)}
            stroke="var(--bd)" strokeWidth="1" strokeDasharray="4,4" opacity="0.6" />
        ))}
        <path d={areaD} fill={`url(#${gradId})`} />
        <path d={lineD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Hover guide */}
        {hoverIdx !== null && (
          <>
            <line
              x1={x(hoverIdx).toFixed(1)} y1="0"
              x2={x(hoverIdx).toFixed(1)} y2={H}
              stroke={color} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.55"
            />
            <circle
              cx={x(hoverIdx).toFixed(1)} cy={y(data[hoverIdx]).toFixed(1)} r="5"
              fill="var(--white)" stroke={color} strokeWidth="2.5"
            />
          </>
        )}
        {showDots && data.map((v, i) => (
          <circle key={i} cx={x(i).toFixed(1)} cy={y(v).toFixed(1)} r="3"
            fill="var(--white)" stroke={color} strokeWidth="2" />
        ))}
      </svg>
      {/* x-axis labels */}
      <div className="flex justify-between mt-1 px-0">
        {xTickIdx.map(i => (
          <p key={i} className="text-[10px]" style={{ color: hoverIdx === i ? color : 'var(--t3)', fontWeight: hoverIdx === i ? 700 : 400, minWidth: 0, transition: 'color .1s' }}>{labels[i]}</p>
        ))}
      </div>
    </div>
  )
}

// ─── Bar Chart (horizontal) ───────────────────────────────────────────────────

function HorizBar({ label, value, max, color, suffix = '' }: {
  label: string; value: number; max: number; color: string; suffix?: string
}) {
  const w = max === 0 ? 0 : Math.round((value / max) * 100)
  return (
    <div className="flex items-center gap-3">
      <p className="text-[12px] w-24 shrink-0" style={{ color: 'var(--t2)' }}>{label}</p>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bd)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${w}%`, background: color }} />
      </div>
      <p className="text-[12px] font-bold w-16 text-right shrink-0" style={{ color }}>
        {value.toLocaleString()}{suffix}
      </p>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, change, sub, color }: {
  icon: React.ReactNode; label: string; value: string
  change: number; sub: string; color: string
}) {
  const up = change >= 0
  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + '1a' }}>
          <div style={{ color }}>{icon}</div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold"
          style={up
            ? { background: 'rgba(74,222,128,.12)', color: '#16a34a' }
            : { background: 'rgba(239,68,68,.1)',   color: '#ef4444' }}>
          {up ? <ArrowUpRight className="w-3 h-3" strokeWidth={2.5} /> : <ArrowDownRight className="w-3 h-3" strokeWidth={2.5} />}
          {Math.abs(change)}%
        </div>
      </div>
      <p className="text-[24px] font-bold leading-tight" style={{ color: 'var(--t1)' }}>{value}</p>
      <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--t2)' }}>{label}</p>
      <p className="text-[11px] mt-0.5" style={{ color: 'var(--t3)' }}>{sub}</p>
    </div>
  )
}

// ─── Content Table ────────────────────────────────────────────────────────────

type SortKey = 'enrollments' | 'revenue' | 'rating' | 'views'

const CONTENT_ITEMS = [
  { id: 1, title: 'Motion Design Fundamentals',    type: 'course',    enrollments: 342, revenue: 6156, rating: 4.9, views: 1820 },
  { id: 2, title: '30-Day Body Challenge',          type: 'challenge', enrollments: 218, revenue: 2180, rating: 4.7, views: 940  },
  { id: 3, title: '1-on-1 Strategy Session',        type: 'session',   enrollments: 87,  revenue: 2610, rating: 5.0, views: 320  },
  { id: 4, title: 'Motion Pro — Advanced Concepts', type: 'course',    enrollments: 156, revenue: 4680, rating: 4.8, views: 890  },
  { id: 5, title: 'Annual Community Summit',        type: 'event',     enrollments: 480, revenue: 4800, rating: 4.6, views: 2100 },
  { id: 6, title: 'Branding Assets Pack',           type: 'product',   enrollments: 134, revenue: 1340, rating: 4.5, views: 610  },
  { id: 7, title: 'Composition Masterclass',        type: 'course',    enrollments: 98,  revenue: 2940, rating: 4.8, views: 540  },
  { id: 8, title: 'Weekly Q&A Sessions',            type: 'session',   enrollments: 62,  revenue: 1240, rating: 4.9, views: 280  },
  { id: 9, title: '14-Day Portfolio Challenge',     type: 'challenge', enrollments: 175, revenue: 0,    rating: 4.6, views: 730  },
  { id: 10, title: 'Design System Templates',       type: 'product',   enrollments: 89,  revenue: 890,  rating: 4.4, views: 420  },
]

const TYPE_ICON: Record<string, React.ReactNode> = {
  course:    <BookOpen    className="w-3.5 h-3.5" strokeWidth={1.7} />,
  challenge: <Trophy      className="w-3.5 h-3.5" strokeWidth={1.7} />,
  session:   <Calendar    className="w-3.5 h-3.5" strokeWidth={1.7} />,
  event:     <Zap         className="w-3.5 h-3.5" strokeWidth={1.7} />,
  product:   <Package     className="w-3.5 h-3.5" strokeWidth={1.7} />,
}

const TYPE_COLOR: Record<string, string> = {
  course: 'var(--p)', challenge: 'var(--orange)', session: 'var(--cyan)',
  event: 'var(--pink)', product: '#16a34a',
}

// ─── Period config ────────────────────────────────────────────────────────────

const PERIODS: { id: Period; label: string }[] = [
  { id: '7d', label: '7D' }, { id: '30d', label: '30D' },
  { id: '3m',  label: '3M' }, { id: '6m',  label: '6M' },
  { id: '1y',  label: '1Y' },
]

const CONTENT_TYPES: { id: ContentType; label: string }[] = [
  { id: 'all',        label: 'All'        },
  { id: 'courses',    label: 'Courses'    },
  { id: 'sessions',   label: 'Sessions'   },
  { id: 'events',     label: 'Events'     },
  { id: 'challenges', label: 'Challenges' },
  { id: 'products',   label: 'Products'   },
]

const REVENUE_BY_TYPE = [
  { label: 'Courses',    value: 13776, color: 'var(--p)'      },
  { label: 'Sessions',   value: 3850,  color: 'var(--cyan)'   },
  { label: 'Events',     value: 4800,  color: 'var(--pink)'   },
  { label: 'Challenges', value: 2180,  color: 'var(--orange)' },
  { label: 'Products',   value: 2230,  color: '#16a34a'       },
]

const MEMBER_SOURCES = [
  { label: 'Organic',     value: 48, color: 'var(--p)'      },
  { label: 'Affiliates',  value: 22, color: 'var(--orange)' },
  { label: 'Social',      value: 18, color: 'var(--cyan)'   },
  { label: 'Direct Link', value: 12, color: 'var(--pink)'   },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period,      setPeriod]      = useState<Period>('30d')
  const [contentType, setContentType] = useState<ContentType>('all')
  const [sortKey,     setSortKey]     = useState<SortKey>('revenue')

  const ds = useMemo(() => buildDataset(period, contentType), [period, contentType])

  const totalRevenue     = sumSeries(ds.revenue)
  const totalMembers     = sumSeries(ds.members)
  const totalEnrollments = sumSeries(ds.enrollments)
  const avgEngagement    = Math.round(62 * (contentType === 'all' ? 1 : 0.85) + Math.random() * 5)

  const prevRevenue     = Math.round(totalRevenue     * (0.75 + Math.random() * 0.3))
  const prevMembers     = Math.round(totalMembers     * (0.78 + Math.random() * 0.25))
  const prevEnrollments = Math.round(totalEnrollments * (0.8  + Math.random() * 0.2))
  const prevEngage      = Math.round(avgEngagement    * 0.9)

  const revChange  = Math.round(((totalRevenue     - prevRevenue)     / (prevRevenue     || 1)) * 100)
  const memChange  = Math.round(((totalMembers     - prevMembers)     / (prevMembers     || 1)) * 100)
  const enrChange  = Math.round(((totalEnrollments - prevEnrollments) / (prevEnrollments || 1)) * 100)
  const engChange  = Math.round(((avgEngagement    - prevEngage)      / (prevEngage      || 1)) * 100)

  const filteredContent = useMemo(() => {
    const items = contentType === 'all'
      ? CONTENT_ITEMS
      : CONTENT_ITEMS.filter(c => c.type === contentType.slice(0, -1)) // 'courses' → 'course'
    return [...items].sort((a, b) => b[sortKey] - a[sortKey])
  }, [contentType, sortKey])

  const maxRevByType = Math.max(...REVENUE_BY_TYPE.map(r => r.value))
  const maxSrc       = Math.max(...MEMBER_SOURCES.map(s => s.value))

  return (
    <>
      <style>{`
        @keyframes dashFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:var(--p3);border-radius:10px}
      `}</style>

      <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
        <DashSidebar />
        <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar title="Analytics" subtitle="Community, content and revenue insights" />

          <main className="p-7 flex-1" style={{ animation: 'dashFadeUp .4s ease both' }}>

            {/* ── Filter bar ── */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              {/* period */}
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                {PERIODS.map(p => (
                  <button key={p.id} onClick={() => setPeriod(p.id)}
                    className="h-7 px-3 rounded-lg text-[12px] font-semibold cursor-pointer transition-all"
                    style={period === p.id ? { background: 'var(--p)', color: '#fff' } : { color: 'var(--t3)' }}>
                    {p.label}
                  </button>
                ))}
              </div>

              {/* content type */}
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                {CONTENT_TYPES.map(c => (
                  <button key={c.id} onClick={() => setContentType(c.id)}
                    className="h-7 px-3 rounded-lg text-[12px] font-semibold cursor-pointer transition-all"
                    style={contentType === c.id ? { background: 'var(--p)', color: '#fff' } : { color: 'var(--t3)' }}>
                    {c.label}
                  </button>
                ))}
              </div>

              <p className="text-[12px] ml-auto" style={{ color: 'var(--t3)' }}>
                Showing data for <span className="font-semibold" style={{ color: 'var(--t2)' }}>
                  {PERIODS.find(p => p.id === period)?.label}
                </span> · <span className="font-semibold" style={{ color: 'var(--t2)' }}>
                  {CONTENT_TYPES.find(c => c.id === contentType)?.label}
                </span>
              </p>
            </div>

            {/* ── KPI row ── */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <KpiCard icon={<DollarSign className="w-4.5 h-4.5" />}      label="Total Revenue"    value={`${totalRevenue.toLocaleString()} TND`} change={revChange} sub="vs previous period" color="var(--p)" />
              <KpiCard icon={<UserPlus   className="w-4.5 h-4.5" />}      label="New Members"      value={totalMembers.toLocaleString()}           change={memChange} sub="joined this period"  color="var(--cyan)" />
              <KpiCard icon={<BarChart2  className="w-4.5 h-4.5" />}      label="Enrollments"      value={totalEnrollments.toLocaleString()}       change={enrChange} sub="across all content"  color="var(--orange)" />
              <KpiCard icon={<MousePointerClick className="w-4.5 h-4.5" />} label="Engagement Rate" value={`${avgEngagement}%`}                   change={engChange} sub="avg across community" color="var(--pink)" />
            </div>

            {/* ── Main chart row ── */}
            <div className="grid grid-cols-3 gap-4 mb-5">

              {/* Revenue chart — 2/3 width */}
              <div className="col-span-2 rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>Revenue Over Time</p>
                    <p className="text-[12px] mt-0.5" style={{ color: 'var(--t3)' }}>
                      Total: <span className="font-semibold" style={{ color: 'var(--p)' }}>{totalRevenue.toLocaleString()} TND</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[12px] font-semibold"
                    style={{ background: revChange >= 0 ? 'rgba(74,222,128,.12)' : 'rgba(239,68,68,.1)', color: revChange >= 0 ? '#16a34a' : '#ef4444' }}>
                    {revChange >= 0 ? <TrendingUp className="w-3.5 h-3.5" strokeWidth={2} /> : <TrendingDown className="w-3.5 h-3.5" strokeWidth={2} />}
                    {revChange >= 0 ? '+' : ''}{revChange}% vs prev
                  </div>
                </div>
                <AreaChart data={ds.revenue} labels={ds.labels} color="var(--p)" height={130} xLabels={6} unit="TND" />
              </div>

              {/* Members chart — 1/3 width */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                <div className="mb-4">
                  <p className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>New Members</p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--t3)' }}>
                    <span className="font-semibold" style={{ color: 'var(--cyan)' }}>{totalMembers.toLocaleString()}</span> this period
                  </p>
                </div>
                <AreaChart data={ds.members} labels={ds.labels} color="var(--cyan)" height={130} xLabels={4} showDots unit="members" />
              </div>
            </div>

            {/* ── Middle row ── */}
            <div className="grid grid-cols-3 gap-4 mb-5">

              {/* Revenue by content type */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                <p className="text-[14px] font-bold mb-1" style={{ color: 'var(--t1)' }}>Revenue by Type</p>
                <p className="text-[12px] mb-4" style={{ color: 'var(--t3)' }}>26,836 TND total</p>
                <div className="space-y-3">
                  {REVENUE_BY_TYPE.map(r => (
                    <HorizBar key={r.label} label={r.label} value={r.value} max={maxRevByType} color={r.color} suffix=" TND" />
                  ))}
                </div>
              </div>

              {/* Enrollments chart */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                <p className="text-[14px] font-bold mb-1" style={{ color: 'var(--t1)' }}>Enrollments</p>
                <p className="text-[12px] mb-4" style={{ color: 'var(--t3)' }}>
                  <span className="font-semibold" style={{ color: 'var(--orange)' }}>{totalEnrollments.toLocaleString()}</span> this period
                </p>
                <AreaChart data={ds.enrollments} labels={ds.labels} color="var(--orange)" height={130} xLabels={4} unit="enrollments" />
              </div>

              {/* Member sources */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                <p className="text-[14px] font-bold mb-1" style={{ color: 'var(--t1)' }}>Member Sources</p>
                <p className="text-[12px] mb-4" style={{ color: 'var(--t3)' }}>Where members come from</p>
                <div className="space-y-3">
                  {MEMBER_SOURCES.map(s => (
                    <HorizBar key={s.label} label={s.label} value={s.value} max={maxSrc} color={s.color} suffix="%" />
                  ))}
                </div>
                {/* donut-style legend */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {MEMBER_SOURCES.map(s => (
                    <div key={s.label} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                      <p className="text-[10px]" style={{ color: 'var(--t3)' }}>{s.label} {s.value}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Community health row ── */}
            <div className="grid grid-cols-4 gap-4 mb-5">
              {[
                { label: 'Active Members',    value: '1,087', sub: 'last 30 days',        color: '#16a34a',       icon: <Users className="w-4 h-4" />           },
                { label: 'Avg. Session Time', value: '18 min', sub: 'per visit',           color: 'var(--p)',      icon: <Eye className="w-4 h-4" />              },
                { label: 'Churn Rate',        value: '2.3%',  sub: 'monthly churn',        color: '#ef4444',       icon: <UserMinus className="w-4 h-4" />        },
                { label: 'Net Promoter',      value: '+67',   sub: 'NPS score',            color: 'var(--orange)', icon: <Star className="w-4 h-4" />             },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-4 flex items-center gap-3"
                  style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: s.color + '18' }}>
                    <div style={{ color: s.color }}>{s.icon}</div>
                  </div>
                  <div>
                    <p className="text-[18px] font-bold" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[11px] font-medium" style={{ color: 'var(--t2)' }}>{s.label}</p>
                    <p className="text-[10px]" style={{ color: 'var(--t3)' }}>{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Content performance table ── */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--bd)' }}>
                <div>
                  <p className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>Content Performance</p>
                  <p className="text-[12px]" style={{ color: 'var(--t3)' }}>{filteredContent.length} items</p>
                </div>
                {/* sort tabs */}
                <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
                  {(['revenue', 'enrollments', 'views', 'rating'] as SortKey[]).map(k => (
                    <button key={k} onClick={() => setSortKey(k)}
                      className="h-6 px-3 rounded-lg text-[11px] font-semibold cursor-pointer transition-all capitalize"
                      style={sortKey === k ? { background: 'var(--p)', color: '#fff' } : { color: 'var(--t3)' }}>
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              {/* table header */}
              <div className="grid px-5 py-2.5" style={{ gridTemplateColumns: '2fr 80px 100px 100px 80px 60px', borderBottom: '1px solid var(--bd)', background: 'var(--bg)' }}>
                {['Content', 'Type', 'Enrollments', 'Revenue', 'Views', 'Rating'].map(h => (
                  <p key={h} className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--t3)' }}>{h}</p>
                ))}
              </div>

              {/* rows */}
              {filteredContent.map((item, i) => (
                <div key={item.id}
                  className="grid px-5 py-3 items-center transition-colors cursor-pointer"
                  style={{ gridTemplateColumns: '2fr 80px 100px 100px 80px 60px', borderBottom: i < filteredContent.length - 1 ? '1px solid var(--bd)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>

                  <div>
                    <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--t1)' }}>{item.title}</p>
                  </div>

                  <div>
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full w-fit capitalize"
                      style={{ background: TYPE_COLOR[item.type] + '18', color: TYPE_COLOR[item.type] }}>
                      <span style={{ color: TYPE_COLOR[item.type] }}>{TYPE_ICON[item.type]}</span>
                      {item.type}
                    </span>
                  </div>

                  <p className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>{item.enrollments.toLocaleString()}</p>

                  <p className="text-[13px] font-semibold" style={{ color: item.revenue > 0 ? '#16a34a' : 'var(--t3)' }}>
                    {item.revenue > 0 ? `${item.revenue.toLocaleString()} TND` : 'Free'}
                  </p>

                  <p className="text-[13px]" style={{ color: 'var(--t3)' }}>{item.views.toLocaleString()}</p>

                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3" style={{ color: 'var(--orange)' }} fill="var(--orange)" strokeWidth={0} />
                    <p className="text-[12px] font-semibold" style={{ color: 'var(--t1)' }}>{item.rating.toFixed(1)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* bottom spacing */}
            <div className="h-6" />
          </main>
        </div>
      </div>
    </>
  )
}
