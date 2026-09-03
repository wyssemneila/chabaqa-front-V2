'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import { Users, CheckCircle2, PlayCircle, ArrowRight } from 'lucide-react'
import { COURSES, STUDENTS, seededRng } from './_components/data'

function hashStr(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

interface CourseStat {
  id: string; title: string; hue: number
  enrolled: number; completed: number; completionRate: number
  avgWatch: number; chapters: number
}

function courseStats(): CourseStat[] {
  return COURSES.map(c => {
    const rng = seededRng(hashStr(c.id + 'stats'))
    const completionRate = Math.round(18 + rng() * 55)              // 18–73%
    const completed = Math.round((c.enrolled * completionRate) / 100)
    const avgWatch = Math.round(40 + rng() * 50)                    // 40–90%
    return { id: c.id, title: c.title, hue: c.hue, enrolled: c.enrolled, completed, completionRate, avgWatch, chapters: c.chapters.length }
  })
}

export default function ReportsIndexPage() {
  const stats = useMemo(courseStats, [])
  const totalStudents = STUDENTS.length
  const totalEnrolled = stats.reduce((s, c) => s + c.enrolled, 0)
  const avgCompletion = Math.round(stats.reduce((s, c) => s + c.completionRate, 0) / stats.length)

  return (
    <>
      <style>{`
        @keyframes dashFadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
        <DashSidebar />
        <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar title="Reports" subtitle="See exactly how members watch and complete your courses" />

          <main id="main-content" className="p-7 flex-1" style={{ animation: 'dashFadeUp .4s ease both' }}>

            {/* ── Top KPIs ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <KpiCard icon={<Users className="w-4 h-4" strokeWidth={1.7} />} color="#8e78fb" value={totalEnrolled.toLocaleString()} label="Total enrollments" />
              <KpiCard icon={<CheckCircle2 className="w-4 h-4" strokeWidth={1.7} />} color="#22c55e" value={`${avgCompletion}%`} label="Avg. completion rate" />
              <KpiCard icon={<PlayCircle className="w-4 h-4" strokeWidth={1.7} />} color="#f59e0b" value={String(totalStudents)} label="Active learners" />
            </div>

            <p className="text-[13px] font-semibold mb-3" style={{ color: 'var(--t1)' }}>Courses</p>

            {/* ── Course cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {stats.map(c => (
                <Link
                  key={c.id}
                  href={`/creator/reports/${c.id}`}
                  className="group rounded-2xl p-5 transition-all hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--p)]"
                  style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white font-bold"
                      style={{ background: `hsl(${c.hue} 70% 60%)` }}>
                      {c.title.split(' ').slice(0, 2).map(w => w[0]).join('')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold leading-snug truncate" style={{ color: 'var(--t1)' }}>{c.title}</p>
                      <p className="text-[12px] mt-0.5" style={{ color: 'var(--t3)' }}>{c.chapters} chapters · {c.enrolled} enrolled</p>
                    </div>
                    <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--t3)' }} />
                  </div>

                  {/* completion bar */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium" style={{ color: 'var(--t2)' }}>Completion</span>
                    <span className="text-[12px] font-bold" style={{ color: c.completionRate >= 50 ? '#16a34a' : '#f59e0b' }}>{c.completionRate}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: 'var(--bd)' }}>
                    <div className="h-full rounded-full" style={{ width: `${c.completionRate}%`, background: c.completionRate >= 50 ? '#22c55e' : '#f59e0b' }} />
                  </div>

                  <div className="flex items-center gap-4 text-[11px]" style={{ color: 'var(--t2)' }}>
                    <span><b style={{ color: 'var(--t1)' }}>{c.completed}</b> completed</span>
                    <span><b style={{ color: 'var(--t1)' }}>{c.avgWatch}%</b> avg watched</span>
                  </div>
                </Link>
              ))}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: color + '1a', color }}>{icon}</div>
      <p className="text-[24px] font-bold leading-tight" style={{ color: 'var(--t1)' }}>{value}</p>
      <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--t2)' }}>{label}</p>
    </div>
  )
}
