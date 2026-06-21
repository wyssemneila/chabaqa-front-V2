'use client'

import React, { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import { useAnalyticsDashboard } from '@/hooks/use-creator-analytics'
import {
  TrendingUp, TrendingDown, Users, DollarSign, BookOpen,
  Zap, Calendar, Trophy, Package, BarChart2, Star,
  ArrowUpRight, ArrowDownRight, Eye, MousePointerClick,
  UserPlus, Globe, MessageCircle, Share2, Bookmark,
} from 'lucide-react'

type Period = '7d' | '30d' | '3m' | '6m' | '1y'
type ContentType = 'all' | 'course' | 'session' | 'event' | 'challenge' | 'product' | 'post'
type SortKey = 'enrollments' | 'interactions' | 'revenue' | 'rating' | 'views'

const PERIODS: { id: Period; label: string }[] = [
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
  { id: '3m', label: '3M' },
  { id: '6m', label: '6M' },
  { id: '1y', label: '1Y' },
]

const CONTENT_TYPES: { id: ContentType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'course', label: 'Courses' },
  { id: 'session', label: 'Sessions' },
  { id: 'event', label: 'Events' },
  { id: 'challenge', label: 'Challenges' },
  { id: 'product', label: 'Products' },
  { id: 'post', label: 'Posts' },
]

const TYPE_ICON: Record<string, ReactNode> = {
  course: <BookOpen className="w-3.5 h-3.5" strokeWidth={1.7} />,
  challenge: <Trophy className="w-3.5 h-3.5" strokeWidth={1.7} />,
  session: <Calendar className="w-3.5 h-3.5" strokeWidth={1.7} />,
  event: <Zap className="w-3.5 h-3.5" strokeWidth={1.7} />,
  product: <Package className="w-3.5 h-3.5" strokeWidth={1.7} />,
  post: <Globe className="w-3.5 h-3.5" strokeWidth={1.7} />,
}

const TYPE_COLOR: Record<string, string> = {
  course: 'var(--p)',
  challenge: 'var(--orange)',
  session: 'var(--cyan)',
  event: 'var(--pink)',
  product: '#16a34a',
  post: '#64748b',
}

const KPI_ICONS: Record<string, ReactNode> = {
  revenue: <DollarSign className="w-4.5 h-4.5" />,
  views: <Eye className="w-4.5 h-4.5" />,
  members: <UserPlus className="w-4.5 h-4.5" />,
  enrollments: <BarChart2 className="w-4.5 h-4.5" />,
  interactions: <MousePointerClick className="w-4.5 h-4.5" />,
  engagement: <MousePointerClick className="w-4.5 h-4.5" />,
}

const HEALTH_ICONS: Record<string, ReactNode> = {
  users: <Users className="w-4 h-4" />,
  duration: <Eye className="w-4 h-4" />,
  interactions: <MousePointerClick className="w-4 h-4" />,
  completion: <Star className="w-4 h-4" />,
  sources: <Globe className="w-4 h-4" />,
}

const POST_ACTION_ICONS: Record<string, ReactNode> = {
  views: <Eye className="w-4 h-4" />,
  interactions: <MousePointerClick className="w-4 h-4" />,
  comments: <MessageCircle className="w-4 h-4" />,
  shares: <Share2 className="w-4 h-4" />,
  bookmarks: <Bookmark className="w-4 h-4" />,
}

function AreaChart({
  data, labels, color, height = 120, showDots = false, xLabels = 5, unit = '',
}: {
  data: number[]
  labels: string[]
  color: string
  height?: number
  showDots?: boolean
  xLabels?: number
  unit?: string
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  if (data.length < 2) {
    return (
      <div className="h-[156px] rounded-xl flex items-center justify-center text-[12px]" style={{ background: 'var(--bg)', color: 'var(--t3)' }}>
        No chart data yet
      </div>
    )
  }

  const W = 600
  const H = height
  const min = Math.min(...data) * 0.9
  const max = Math.max(...data) * 1.05
  const range = (max - min) || 1
  const x = (i: number) => (i / (data.length - 1)) * W
  const y = (v: number) => H - 4 - ((v - min) / range) * (H - 24)

  let lineD = `M${x(0).toFixed(1)},${y(data[0]).toFixed(1)}`
  for (let i = 1; i < data.length; i++) {
    const x0 = x(i - 1), y0 = y(data[i - 1])
    const x1 = x(i), y1 = y(data[i])
    const cx = (x0 + x1) / 2
    lineD += ` C${cx.toFixed(1)},${y0.toFixed(1)} ${cx.toFixed(1)},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`
  }

  const areaD = `${lineD} L${W},${H} L0,${H} Z`
  const gradId = `ag${color.replace(/[^a-zA-Z0-9]/g, '')}`
  const step = Math.max(1, Math.floor(data.length / xLabels))
  const xTickIdx = Array.from({ length: data.length }, (_, i) => i).filter((_, i) => i === 0 || i === data.length - 1 || i % step === 0)
  const tipPct = hoverIdx !== null ? Math.max(5, Math.min(95, (x(hoverIdx) / W) * 100)) : 0

  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = ((e.clientX - rect.left) / rect.width) * W
    let closest = 0
    let minDist = Infinity
    for (let i = 0; i < data.length; i++) {
      const dist = Math.abs(x(i) - mouseX)
      if (dist < minDist) {
        minDist = dist
        closest = i
      }
    }
    setHoverIdx(closest)
  }

  return (
    <div style={{ position: 'relative' }}>
      {hoverIdx !== null && (
        <div className="absolute pointer-events-none z-10 flex flex-col items-center" style={{ left: `${tipPct}%`, top: 0, transform: 'translateX(-50%)', transition: 'left .08s' }}>
          <div className="px-3 py-2 rounded-xl shadow-xl" style={{ background: 'var(--t1)', color: 'var(--white)', whiteSpace: 'nowrap', minWidth: 80, textAlign: 'center' }}>
            <p className="text-[11px] leading-none mb-1.5" style={{ opacity: .6 }}>{labels[hoverIdx]}</p>
            <p className="text-[14px] font-bold leading-none">
              {data[hoverIdx].toLocaleString()}{unit && <span className="text-[11px] font-normal ml-1 opacity-70">{unit}</span>}
            </p>
          </div>
          <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid var(--t1)' }} />
        </div>
      )}

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block', overflow: 'visible', cursor: 'crosshair' }} onMouseMove={handleMouseMove} onMouseLeave={() => setHoverIdx(null)}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map(f => (
          <line key={f} x1="0" y1={y(min + range * f).toFixed(1)} x2={W} y2={y(min + range * f).toFixed(1)} stroke="var(--bd)" strokeWidth="1" strokeDasharray="4,4" opacity="0.6" />
        ))}
        <path d={areaD} fill={`url(#${gradId})`} />
        <path d={lineD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {hoverIdx !== null && (
          <>
            <line x1={x(hoverIdx).toFixed(1)} y1="0" x2={x(hoverIdx).toFixed(1)} y2={H} stroke={color} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.55" />
            <circle cx={x(hoverIdx).toFixed(1)} cy={y(data[hoverIdx]).toFixed(1)} r="5" fill="var(--white)" stroke={color} strokeWidth="2.5" />
          </>
        )}
        {showDots && data.map((v, i) => (
          <circle key={i} cx={x(i).toFixed(1)} cy={y(v).toFixed(1)} r="3" fill="var(--white)" stroke={color} strokeWidth="2" />
        ))}
      </svg>
      <div className="flex justify-between mt-1 px-0">
        {xTickIdx.map(i => (
          <p key={i} className="text-[11px]" style={{ color: hoverIdx === i ? color : 'var(--t3)', fontWeight: hoverIdx === i ? 700 : 400, minWidth: 0, transition: 'color .1s' }}>{labels[i]}</p>
        ))}
      </div>
    </div>
  )
}

function HorizBar({ label, value, max, color, suffix = '' }: {
  label: string
  value: number
  max: number
  color: string
  suffix?: string
}) {
  const w = max === 0 ? 0 : Math.round((value / max) * 100)
  return (
    <div className="flex items-center gap-3">
      <p className="text-[12px] w-24 shrink-0 truncate" title={label} style={{ color: 'var(--t2)' }}>{label}</p>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bd)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${w}%`, background: color }} />
      </div>
      <p className="text-[12px] font-bold w-16 text-right shrink-0" style={{ color }}>
        {value.toLocaleString()}{suffix}
      </p>
    </div>
  )
}

function KpiCard({ icon, label, value, change, sub, color, loading }: {
  icon: ReactNode
  label: string
  value: string
  change: number
  sub: string
  color: string
  loading?: boolean
}) {
  const up = change >= 0
  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + '1a' }}>
          <div style={{ color }}>{icon}</div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold" style={up ? { background: 'rgba(74,222,128,.12)', color: '#16a34a' } : { background: 'rgba(239,68,68,.1)', color: '#ef4444' }}>
          {up ? <ArrowUpRight className="w-3 h-3" strokeWidth={1.7} /> : <ArrowDownRight className="w-3 h-3" strokeWidth={1.7} />}
          {Math.abs(change)}%
        </div>
      </div>
      <p className="text-[24px] font-bold leading-tight" style={{ color: 'var(--t1)' }}>{loading ? '...' : value}</p>
      <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--t2)' }}>{label}</p>
      <p className="text-[11px] mt-0.5" style={{ color: 'var(--t2)' }}>{sub}</p>
    </div>
  )
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const [contentType, setContentType] = useState<ContentType>('all')
  const [sortKey, setSortKey] = useState<SortKey>('revenue')
  const dashboardQuery = useAnalyticsDashboard(period, contentType)
  const dashboard = dashboardQuery.data?.data
  const isPostView = contentType === 'post'
  const currency = dashboard?.currency || 'TND'
  const labels = dashboard?.timeSeries.labels || []
  const revenue = dashboard?.timeSeries.revenue || []
  const views = dashboard?.timeSeries.views || []
  const members = dashboard?.timeSeries.members || []
  const enrollments = dashboard?.timeSeries.enrollments || []
  const interactions = dashboard?.timeSeries.interactions || []
  const kpis = dashboard?.kpis || []
  const totalRevenue = kpis.find(k => k.id === 'revenue')?.value || 0
  const totalViews = kpis.find(k => k.id === 'views')?.value || views.reduce((sum, value) => sum + value, 0)
  const totalMembers = kpis.find(k => k.id === 'members')?.value || 0
  const totalEnrollments = kpis.find(k => k.id === 'enrollments')?.value || 0
  const totalInteractions = kpis.find(k => k.id === 'interactions')?.value || interactions.reduce((sum, value) => sum + value, 0)
  const revenueChange = kpis.find(k => k.id === 'revenue')?.change || 0
  const viewsChange = kpis.find(k => k.id === 'views')?.change || 0
  const primaryChart = isPostView
    ? { title: 'Post Views Over Time', total: totalViews, label: 'views', data: views, color: 'var(--p)', unit: 'views', change: viewsChange }
    : { title: 'Revenue Over Time', total: totalRevenue, label: currency, data: revenue, color: 'var(--p)', unit: currency, change: revenueChange }
  const activityChart = isPostView
    ? { title: 'Post Interactions', total: totalInteractions, label: 'this period', data: interactions, unit: 'actions' }
    : { title: 'Enrollments', total: totalEnrollments, label: 'this period', data: enrollments, unit: 'starts' }

  useEffect(() => {
    if (contentType === 'post' && (sortKey === 'revenue' || sortKey === 'enrollments')) {
      setSortKey('views')
    }
  }, [contentType, sortKey])

  const filteredContent = useMemo(() => {
    const items = dashboard?.contentPerformance || []
    const scoped = contentType === 'all' ? items : items.filter(item => item.type === contentType)
    return [...scoped].sort((a, b) => Number(b[sortKey] || 0) - Number(a[sortKey] || 0))
  }, [dashboard?.contentPerformance, contentType, sortKey])

  const maxRevByType = Math.max(0, ...(dashboard?.revenueByType || []).map(r => r.value))
  const maxSrc = Math.max(0, ...(dashboard?.memberSources || []).map(s => s.value))
  const postCount = isPostView ? filteredContent.length : 0
  const topPost = isPostView ? filteredContent[0] : null
  const postEngagementRate = totalViews > 0 ? Number(((totalInteractions / totalViews) * 100).toFixed(1)) : 0
  const avgViewsPerPost = postCount > 0 ? Math.round(totalViews / postCount) : 0
  const avgInteractionsPerPost = postCount > 0 ? Math.round(totalInteractions / postCount) : 0
  const maxPostInteractions = Math.max(0, ...filteredContent.map(item => Number(item.interactions || item.enrollments || 0)))
  const postActionSummary = [
    { id: 'views', label: 'Views', value: totalViews, color: 'var(--p)', suffix: '' },
    { id: 'interactions', label: 'Interactions', value: totalInteractions, color: 'var(--orange)', suffix: '' },
    { id: 'comments', label: 'Engagement Rate', value: postEngagementRate, color: 'var(--pink)', suffix: '%' },
    { id: 'bookmarks', label: 'Avg. Views / Post', value: avgViewsPerPost, color: 'var(--cyan)', suffix: '' },
  ]

  return (
    <>
      <style>{`
        @keyframes dashFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:var(--p3);border-radius:10px}
      `}</style>

      <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
        <DashSidebar />
        <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar title="Analytics" subtitle="Community, content and revenue insights" />

          <main id="main-content" className="p-7 flex-1" style={{ animation: 'dashFadeUp .4s ease both' }}>
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                {PERIODS.map(p => (
                  <button key={p.id} onClick={() => setPeriod(p.id)} className="h-7 px-3 rounded-lg text-[12px] font-semibold cursor-pointer transition-all" style={period === p.id ? { background: 'var(--p)', color: '#fff' } : { color: 'var(--t3)' }}>
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                {CONTENT_TYPES.map(c => (
                  <button key={c.id} onClick={() => setContentType(c.id)} className="h-7 px-3 rounded-lg text-[12px] font-semibold cursor-pointer transition-all" style={contentType === c.id ? { background: 'var(--p)', color: '#fff' } : { color: 'var(--t3)' }}>
                    {c.label}
                  </button>
                ))}
              </div>

              <p className="text-[12px] ml-auto" style={{ color: 'var(--t3)' }}>
                Showing data for <span className="font-semibold" style={{ color: 'var(--t2)' }}>{PERIODS.find(p => p.id === period)?.label}</span> / <span className="font-semibold" style={{ color: 'var(--t2)' }}>{CONTENT_TYPES.find(c => c.id === contentType)?.label}</span>
              </p>
            </div>

            {dashboardQuery.isError && (
              <div className="rounded-2xl p-4 mb-5 text-[13px] font-semibold" style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.18)', color: '#ef4444' }}>
                Analytics could not be loaded. Please refresh after signing in again.
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {(kpis.length ? kpis : [
                { id: 'revenue', label: 'Total Revenue', formattedValue: `0 ${currency}`, change: 0, sub: 'vs previous period', color: 'var(--p)', iconKey: 'revenue' },
                { id: 'members', label: 'Active Members', formattedValue: '0', change: 0, sub: 'unique tracked users', color: 'var(--cyan)', iconKey: 'members' },
                { id: 'enrollments', label: 'Enrollments', formattedValue: '0', change: 0, sub: 'starts, bookings and registrations', color: 'var(--orange)', iconKey: 'enrollments' },
                { id: 'engagement', label: 'Engagement Rate', formattedValue: '0%', change: 0, sub: 'avg across community', color: 'var(--pink)', iconKey: 'engagement' },
              ]).map(kpi => (
                <KpiCard key={kpi.id} icon={KPI_ICONS[kpi.iconKey] || <BarChart2 className="w-4.5 h-4.5" />} label={kpi.label} value={kpi.formattedValue} change={kpi.change} sub={kpi.sub} color={kpi.color} loading={dashboardQuery.isLoading} />
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <div className="col-span-2 rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                  <p className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>{primaryChart.title}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--t2)' }}>
                      Total: <span className="font-semibold" style={{ color: 'var(--p)' }}>{primaryChart.total.toLocaleString()} {primaryChart.label}</span>
                  </p>
                </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[12px] font-semibold" style={{ background: primaryChart.change >= 0 ? 'rgba(74,222,128,.12)' : 'rgba(239,68,68,.1)', color: primaryChart.change >= 0 ? '#16a34a' : '#ef4444' }}>
                    {primaryChart.change >= 0 ? <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.7} /> : <TrendingDown className="w-3.5 h-3.5" strokeWidth={1.7} />}
                    {primaryChart.change >= 0 ? '+' : ''}{primaryChart.change}% vs prev
                  </div>
                </div>
                <AreaChart data={primaryChart.data} labels={labels} color={primaryChart.color} height={130} xLabels={6} unit={primaryChart.unit} />
              </div>

              <div className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                <div className="mb-4">
                  <p className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>Active Members</p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--t2)' }}>
                    <span className="font-semibold" style={{ color: 'var(--cyan)' }}>{totalMembers.toLocaleString()}</span> unique users
                  </p>
                </div>
                <AreaChart data={members} labels={labels} color="var(--cyan)" height={130} xLabels={4} showDots unit="users" />
              </div>
            </div>

            {isPostView ? (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">
                <div className="xl:col-span-2 rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>Post Engagement Analytics</p>
                      <p className="text-[12px] mt-0.5" style={{ color: 'var(--t3)' }}>{postCount} tracked posts in this period</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[22px] font-bold leading-none" style={{ color: 'var(--p)' }}>{postEngagementRate}%</p>
                      <p className="text-[11px] mt-1" style={{ color: 'var(--t3)' }}>interaction rate</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                    {postActionSummary.map(action => (
                      <div key={action.id} className="rounded-xl p-3" style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: action.color + '18', color: action.color }}>
                            {POST_ACTION_ICONS[action.id] || <BarChart2 className="w-4 h-4" />}
                          </div>
                          <p className="text-[11px] font-semibold" style={{ color: 'var(--t2)' }}>{action.label}</p>
                        </div>
                        <p className="text-[18px] font-bold" style={{ color: action.color }}>
                          {action.value.toLocaleString()}{action.suffix}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div>
                      <p className="text-[12px] font-bold mb-3" style={{ color: 'var(--t1)' }}>Top Posts by Views</p>
                      <div className="space-y-3">
                        {filteredContent.slice(0, 5).map(post => (
                          <HorizBar key={post.id} label={post.title} value={post.views} max={Math.max(0, ...filteredContent.map(item => item.views))} color="var(--p)" suffix=" views" />
                        ))}
                        {filteredContent.length === 0 && <p className="text-[12px]" style={{ color: 'var(--t3)' }}>No post views tracked yet.</p>}
                      </div>
                    </div>

                    <div>
                      <p className="text-[12px] font-bold mb-3" style={{ color: 'var(--t1)' }}>Top Posts by Interaction</p>
                      <div className="space-y-3">
                        {filteredContent.slice(0, 5).map(post => (
                          <HorizBar key={post.id} label={post.title} value={Number(post.interactions || post.enrollments || 0)} max={maxPostInteractions} color="var(--orange)" suffix=" actions" />
                        ))}
                        {filteredContent.length === 0 && <p className="text-[12px]" style={{ color: 'var(--t3)' }}>No post interactions tracked yet.</p>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                  <p className="text-[14px] font-bold mb-1" style={{ color: 'var(--t1)' }}>Best Performing Post</p>
                  <p className="text-[12px] mb-4" style={{ color: 'var(--t3)' }}>Ranked by current sort</p>
                  {topPost ? (
                    <div>
                      <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
                        <p className="text-[15px] font-bold leading-snug" style={{ color: 'var(--t1)' }}>{topPost.title}</p>
                        <p className="text-[12px] mt-2" style={{ color: 'var(--t3)' }}>
                          {topPost.views.toLocaleString()} views / {Number(topPost.interactions || topPost.enrollments || 0).toLocaleString()} interactions
                        </p>
                      </div>
                      <div className="space-y-3">
                        <HorizBar label="Views" value={topPost.views} max={Math.max(topPost.views, 1)} color="var(--p)" />
                        <HorizBar label="Interactions" value={Number(topPost.interactions || topPost.enrollments || 0)} max={Math.max(Number(topPost.interactions || topPost.enrollments || 0), 1)} color="var(--orange)" />
                        <HorizBar label="Engagement" value={Math.round(topPost.engagementRate || 0)} max={100} color="var(--pink)" suffix="%" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[12px]" style={{ color: 'var(--t3)' }}>No tracked post performance yet.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <div className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                  <p className="text-[14px] font-bold mb-1" style={{ color: 'var(--t1)' }}>Revenue by Type</p>
                  <p className="text-[12px] mb-4" style={{ color: 'var(--t3)' }}>{totalRevenue.toLocaleString()} {currency} total</p>
                  <div className="space-y-3">
                    {(dashboard?.revenueByType || []).length ? dashboard!.revenueByType.map(r => (
                      <HorizBar key={r.type} label={r.label} value={r.value} max={maxRevByType} color={r.color} suffix={` ${currency}`} />
                    )) : <p className="text-[12px]" style={{ color: 'var(--t3)' }}>No paid revenue tracked yet.</p>}
                  </div>
                </div>

              <div className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                <p className="text-[14px] font-bold mb-1" style={{ color: 'var(--t1)' }}>{activityChart.title}</p>
                <p className="text-[12px] mb-4" style={{ color: 'var(--t3)' }}>
                  <span className="font-semibold" style={{ color: 'var(--orange)' }}>{activityChart.total.toLocaleString()}</span> {activityChart.label}
                </p>
                <AreaChart data={activityChart.data} labels={labels} color="var(--orange)" height={130} xLabels={4} unit={activityChart.unit} />
              </div>

              <div className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                <p className="text-[14px] font-bold mb-1" style={{ color: 'var(--t1)' }}>Member Sources</p>
                <p className="text-[12px] mb-4" style={{ color: 'var(--t3)' }}>Where members come from</p>
                <div className="space-y-3">
                  {(dashboard?.memberSources || []).length ? dashboard!.memberSources.map(s => (
                    <HorizBar key={s.channel} label={s.label} value={s.value} max={maxSrc} color={s.color} suffix="%" />
                  )) : <p className="text-[12px]" style={{ color: 'var(--t3)' }}>No attribution data yet.</p>}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(dashboard?.memberSources || []).map(s => (
                    <div key={s.channel} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                      <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{s.label} {s.value}%</p>
                    </div>
                  ))}
                </div>
              </div>
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              {(dashboard?.communityHealth || []).map(s => (
                <div key={s.id} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.color + '18' }}>
                    <div style={{ color: s.color }}>{HEALTH_ICONS[s.iconKey] || <Users className="w-4 h-4" />}</div>
                  </div>
                  <div>
                    <p className="text-[18px] font-bold" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[11px] font-medium" style={{ color: 'var(--t2)' }}>{s.label}</p>
                    <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--bd)' }}>
                <div>
                  <p className="text-[14px] font-bold" style={{ color: 'var(--t1)' }}>Content Performance</p>
                  <p className="text-[12px]" style={{ color: 'var(--t3)' }}>{filteredContent.length} items</p>
                </div>
                <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
                  {(isPostView ? (['views', 'interactions', 'rating'] as SortKey[]) : (['revenue', 'enrollments', 'views', 'rating'] as SortKey[])).map(k => (
                    <button key={k} onClick={() => setSortKey(k)} className="h-6 px-3 rounded-lg text-[11px] font-semibold cursor-pointer transition-all capitalize" style={sortKey === k ? { background: 'var(--p)', color: '#fff' } : { color: 'var(--t3)' }}>
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid px-5 py-2.5" style={{ gridTemplateColumns: '2fr 80px 100px 100px 80px 60px', borderBottom: '1px solid var(--bd)', background: 'var(--bg)' }}>
                {['Content', 'Type', isPostView ? 'Interactions' : 'Enrollments', 'Revenue', 'Views', 'Rating'].map(h => (
                  <p key={h} className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--t3)' }}>{h}</p>
                ))}
              </div>

              {filteredContent.length ? filteredContent.map((item, i) => (
                <div key={`${item.type}-${item.id}`} className="grid px-5 py-3 items-center transition-colors cursor-pointer" style={{ gridTemplateColumns: '2fr 80px 100px 100px 80px 60px', borderBottom: i < filteredContent.length - 1 ? '1px solid var(--bd)' : 'none' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div>
                    <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--t1)' }}>{item.title}</p>
                  </div>
                  <div>
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full w-fit capitalize" style={{ background: (TYPE_COLOR[item.type] || 'var(--p)') + '18', color: TYPE_COLOR[item.type] || 'var(--p)' }}>
                      <span style={{ color: TYPE_COLOR[item.type] || 'var(--p)' }}>{TYPE_ICON[item.type]}</span>
                      {item.type}
                    </span>
                  </div>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>{(isPostView ? (item.interactions || item.enrollments) : item.enrollments).toLocaleString()}</p>
                  <p className="text-[13px] font-semibold" style={{ color: item.revenue > 0 ? '#16a34a' : 'var(--t3)' }}>
                    {item.revenue > 0 ? `${item.revenue.toLocaleString()} ${currency}` : 'Free'}
                  </p>
                  <p className="text-[13px]" style={{ color: 'var(--t3)' }}>{item.views.toLocaleString()}</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3" style={{ color: 'var(--orange)' }} fill="var(--orange)" strokeWidth={0} />
                    <p className="text-[12px] font-semibold" style={{ color: 'var(--t1)' }}>{item.rating.toFixed(1)}</p>
                  </div>
                </div>
              )) : (
                <div className="px-5 py-8 text-center text-[12px]" style={{ color: 'var(--t3)' }}>
                  No tracked content performance yet.
                </div>
              )}
            </div>

            <div className="h-6" />
          </main>
        </div>
      </div>
    </>
  )
}
