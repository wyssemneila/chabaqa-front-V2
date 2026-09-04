'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import { ArrowLeft, Users, CheckCircle2, PlayCircle, Clock, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { HeatmapBar, HeatmapLegend } from '../_components/Heatmap'
import { getCourse, STUDENTS, watchStatsFor, seededRng, fmtDuration } from '../_components/data'

function hashStr(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

const SEGMENTS = 96

export default function CourseReportPage() {
  const params = useParams()
  const courseId = String(params.courseId || '')
  const course = getCourse(courseId)
  const [chapterIdx, setChapterIdx] = useState(0)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  // Reset to the first page whenever the chapter or the search changes.
  useEffect(() => { setPage(0) }, [chapterIdx, query])

  const model = useMemo(() => {
    if (!course) return null
    const chapter = course.chapters[chapterIdx]

    // Per-student watch stats for the selected chapter.
    const rows = STUDENTS.map(s => ({ student: s, stats: watchStatsFor(s.id, chapter.id, SEGMENTS) }))
      .sort((a, b) => b.stats.percent - a.stats.percent)

    // Aggregate heatmap: average watch-count per segment across all students.
    const agg = new Array(SEGMENTS).fill(0)
    rows.forEach(r => r.stats.segments.forEach((v, i) => { agg[i] += v }))
    const aggAvg = agg.map(v => v / rows.length)

    // Chapter drop-off funnel (declining reach across chapters).
    const rng = seededRng(hashStr(course.id + 'funnel'))
    let reach = 100
    const funnel = course.chapters.map((ch, i) => {
      if (i > 0) reach = Math.max(12, reach - (6 + rng() * 22))
      return { title: ch.title, idx: i, reach: Math.round(reach) }
    })

    const avgWatch = Math.round(rows.reduce((s, r) => s + r.stats.percent, 0) / rows.length)
    const completionRate = funnel[funnel.length - 1].reach

    return { chapter, rows, aggAvg, funnel, avgWatch, completionRate }
  }, [course, chapterIdx])

  if (!course) return notFound()
  const m = model!

  const completed = Math.round((course.enrolled * m.completionRate) / 100)

  // Search + paginate the member list (scales past thousands of members).
  const q = query.trim().toLowerCase()
  const filtered = q ? m.rows.filter(r => r.student.name.toLowerCase().includes(q)) : m.rows
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const curPage = Math.min(page, pageCount - 1)
  const paged = filtered.slice(curPage * PAGE_SIZE, curPage * PAGE_SIZE + PAGE_SIZE)

  return (
    <>
      <style>{`
        @keyframes dashFadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .rowcard:hover .rowpop { opacity:1; transform:translateY(0); pointer-events:auto }
      `}</style>

      <DashTopbar title="Course Report" subtitle={course.title} />

          <main id="main-content" className="p-7 flex-1" style={{ animation: 'dashFadeUp .4s ease both' }}>

            <Link href="/creator/reports" className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-5 transition-opacity hover:opacity-70" style={{ color: 'var(--t2)' }}>
              <ArrowLeft className="w-4 h-4" /> All reports
            </Link>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Kpi icon={<Users className="w-4 h-4" strokeWidth={1.7} />} color="#8e78fb" value={course.enrolled.toLocaleString()} label="Enrolled" />
              <Kpi icon={<CheckCircle2 className="w-4 h-4" strokeWidth={1.7} />} color="#22c55e" value={String(completed)} label="Completed" />
              <Kpi icon={<PlayCircle className="w-4 h-4" strokeWidth={1.7} />} color="#f59e0b" value={`${m.completionRate}%`} label="Completion rate" />
              <Kpi icon={<Clock className="w-4 h-4" strokeWidth={1.7} />} color="#0ea5e9" value={`${m.avgWatch}%`} label="Avg. watched (this chapter)" />
            </div>

            {/* ── Chapter drop-off funnel ── */}
            <div className="rounded-2xl p-5 mb-6" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
              <p className="text-[13px] font-semibold mb-1" style={{ color: 'var(--t1)' }}>Chapter drop-off</p>
              <p className="text-[12px] mb-4" style={{ color: 'var(--t3)' }}>Where members stop — click a chapter to inspect its video heatmap.</p>
              <div className="flex flex-col gap-2">
                {m.funnel.map(f => {
                  const active = f.idx === chapterIdx
                  return (
                    <button key={f.idx} onClick={() => setChapterIdx(f.idx)} className="flex items-center gap-3 text-left group focus:outline-none">
                      <span className="text-[12px] w-6 shrink-0 font-bold" style={{ color: active ? 'var(--p)' : 'var(--t3)' }}>{f.idx + 1}</span>
                      <span className="text-[12px] w-52 shrink-0 truncate" style={{ color: active ? 'var(--t1)' : 'var(--t2)', fontWeight: active ? 600 : 400 }}>{f.title}</span>
                      <span className="flex-1 h-6 rounded-lg overflow-hidden" style={{ background: 'var(--bd)', outline: active ? '2px solid var(--p)' : 'none', outlineOffset: 1 }}>
                        <span className="h-full flex items-center justify-end px-2 rounded-lg transition-all" style={{ width: `${f.reach}%`, background: f.reach >= 50 ? '#22c55e' : f.reach >= 30 ? '#f59e0b' : '#ef4444', minWidth: 34 }}>
                          <span className="text-[11px] font-bold text-white">{f.reach}%</span>
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Video heatmap for selected chapter ── */}
            <div className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
              <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>
                    Video heatmap — Ch. {chapterIdx + 1}: {m.chapter.title}
                  </p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--t3)' }}>Length {fmtDuration(m.chapter.durationSec)} · hover the bar to see each second</p>
                </div>
                <HeatmapLegend />
              </div>

              {/* aggregate */}
              <div className="mb-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--t3)' }}>Everyone combined</p>
                <HeatmapBar segments={m.aggAvg.map(aggScale)} durationSec={m.chapter.durationSec} height={30} />
              </div>

              {/* per student — search + paginate */}
              <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t3)' }}>
                  By member ({filtered.length.toLocaleString()})
                </p>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--t3)' }} />
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Find a member…"
                    className="h-9 pl-8 pr-3 rounded-lg text-[13px] w-[220px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--p)]"
                    style={{ background: 'var(--bg)', border: '1px solid var(--bd)', color: 'var(--t1)' }}
                  />
                </div>
              </div>

              {filtered.length === 0 ? (
                <p className="text-[13px] py-8 text-center" style={{ color: 'var(--t3)' }}>No member matches “{query}”.</p>
              ) : (
              <div className="flex flex-col gap-2.5">
                {paged.map(({ student, stats }) => (
                  <div key={student.id} className="rowcard relative flex items-center gap-3">
                    {/* avatar + name */}
                    <div className="flex items-center gap-2 w-44 shrink-0 min-w-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ background: `hsl(${student.hue} 65% 58%)` }}>
                        {student.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-[12px] truncate" style={{ color: 'var(--t1)' }}>{student.name}</span>
                    </div>
                    {/* bar */}
                    <div className="flex-1 min-w-0">
                      <HeatmapBar segments={stats.segments} durationSec={m.chapter.durationSec} height={22} />
                    </div>
                    {/* percent */}
                    <span className="text-[12px] font-bold w-11 text-right shrink-0" style={{ color: stats.percent >= 80 ? '#16a34a' : stats.percent >= 40 ? '#f59e0b' : '#ef4444' }}>
                      {stats.percent}%
                    </span>

                    {/* hover popover: exit + rewatch spots */}
                    <div className="rowpop absolute right-14 top-full mt-1 z-20 rounded-xl p-3 text-[11px] shadow-xl transition-all opacity-0 -translate-y-1"
                      style={{ background: 'var(--white)', border: '1px solid var(--bd)', minWidth: 180, color: 'var(--t2)' }}>
                      <p className="font-semibold mb-1" style={{ color: 'var(--t1)' }}>{student.name}</p>
                      <p>Watched <b style={{ color: 'var(--t1)' }}>{stats.percent}%</b> · exited at <b style={{ color: 'var(--t1)' }}>{fmtDuration(Math.round((stats.exitPct / 100) * m.chapter.durationSec))}</b></p>
                      {stats.rewatchSpots.length > 0 ? (
                        <p className="mt-1">Rewatched: {stats.rewatchSpots.map(s => `${fmtDuration(Math.round((s.atPct / 100) * m.chapter.durationSec))} (${s.times}×)`).join(', ')}</p>
                      ) : (
                        <p className="mt-1" style={{ color: 'var(--t3)' }}>No rewatched sections</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              )}

              {/* pagination */}
              {filtered.length > PAGE_SIZE && (
                <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid var(--bd)' }}>
                  <span className="text-[12px]" style={{ color: 'var(--t3)' }}>
                    Showing {curPage * PAGE_SIZE + 1}–{Math.min((curPage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={curPage === 0}
                      className="h-8 px-2.5 rounded-lg text-[12px] font-medium flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ border: '1px solid var(--bd)', background: 'var(--white)', color: 'var(--t2)' }}>
                      <ChevronLeft className="w-3.5 h-3.5" /> Prev
                    </button>
                    <span className="text-[12px] font-medium px-2" style={{ color: 'var(--t2)' }}>Page {curPage + 1} of {pageCount}</span>
                    <button
                      onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                      disabled={curPage >= pageCount - 1}
                      className="h-8 px-2.5 rounded-lg text-[12px] font-medium flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ border: '1px solid var(--bd)', background: 'var(--white)', color: 'var(--t2)' }}>
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </main>
    </>
  )
}

// Aggregate average watch-count → a 0..4 scale that maps onto the same colours.
function aggScale(avg: number): number {
  if (avg < 0.2) return 0
  if (avg < 1.05) return 1
  if (avg < 1.6) return 2
  if (avg < 2.2) return 3
  return 4
}

function Kpi({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5" style={{ background: color + '1a', color }}>{icon}</div>
      <p className="text-[20px] font-bold leading-tight" style={{ color: 'var(--t1)' }}>{value}</p>
      <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--t2)' }}>{label}</p>
    </div>
  )
}
