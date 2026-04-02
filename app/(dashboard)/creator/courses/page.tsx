'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import DashIcon    from '@/components/creator-dashboard/DashIcon'
import { CourseCard, type CourseCardData } from '@/components/courses/course-card'
import { BookOpen, Plus, RefreshCw } from 'lucide-react'

// skeleton card for loading state
function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
      <div className="aspect-video" style={{ background: 'var(--bg)' }} />
      <div className="p-5 space-y-3">
        <div className="h-4 rounded-lg w-3/4" style={{ background: 'var(--bg)' }} />
        <div className="h-3 rounded-lg w-full"  style={{ background: 'var(--bg)' }} />
        <div className="h-3 rounded-lg w-2/3"   style={{ background: 'var(--bg)' }} />
        <div className="flex gap-2 pt-2">
          <div className="h-8 rounded-lg flex-1" style={{ background: 'var(--bg)' }} />
          <div className="h-8 rounded-lg flex-1" style={{ background: 'var(--bg)' }} />
        </div>
      </div>
    </div>
  )
}

export default function CoursesPage() {
  const [courses,  setCourses]  = useState<CourseCardData[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  const load = () => {
    setLoading(true); setError('')
    // ── Mock: load courses from localStorage only (no real API) ──────────────
    try {
      const stored = localStorage.getItem('chabaqa_mock_courses')
      const list: CourseCardData[] = stored ? JSON.parse(stored) : []

      const last = localStorage.getItem('chabaqa_last_course')
      if (last) {
        const parsed = JSON.parse(last)
        if (parsed.id && !list.some(c => (c._id ?? c.id) === parsed.id)) {
          list.unshift({
            _id: parsed.id, title: parsed.title, thumbnail: parsed.thumbnail,
            level: parsed.level, duration: parsed.duration, priceType: parsed.priceType,
            price: parsed.price, isPublished: parsed.isPublished,
            sectionsCount: parsed.sectionsCount, chaptersCount: parsed.chaptersCount,
          })
          localStorage.setItem('chabaqa_mock_courses', JSON.stringify(list))
          localStorage.removeItem('chabaqa_last_course')
        }
      }
      setCourses(list)
    } catch {
      setError('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <>
      <style>{`
        @keyframes dashFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--p3); border-radius: 10px; }
      `}</style>

      <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
        <DashSidebar />
        <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar title="Courses" subtitle="Manage your online courses" />

          <main className="p-7 flex-1" style={{ animation: 'dashFadeUp .4s ease both' }}>

            {/* header row */}
            <div className="flex items-center justify-between mb-7">
              <div>
                <h2 className="text-[18px] font-bold" style={{ color: 'var(--t1)' }}>Your Courses</h2>
                <p className="text-[13px] mt-0.5" style={{ color: 'var(--t3)' }}>
                  {loading ? 'Loading…' : `${courses.length} course${courses.length !== 1 ? 's' : ''} created`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={load}
                  className="p-2 rounded-xl transition-all cursor-pointer"
                  style={{ border: '1.5px solid var(--bd)', background: 'transparent', color: 'var(--t3)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--p2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <Link
                  href="/creator/courses/create"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: 'var(--p)', boxShadow: '0 4px 12px rgba(142,120,251,.35)' }}
                >
                  <Plus className="w-4 h-4" />
                  Create Course
                </Link>
              </div>
            </div>

            {/* error */}
            {error && (
              <div className="mb-6 px-4 py-3 rounded-xl text-sm" style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b83232' }}>
                {error} —{' '}
                <button onClick={load} className="font-semibold underline cursor-pointer">retry</button>
              </div>
            )}

            {/* loading skeleton */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* empty state */}
            {!loading && courses.length === 0 && !error && (
              <div
                className="rounded-2xl flex flex-col items-center justify-center py-20 text-center"
                style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--p2)' }}>
                  <BookOpen className="w-8 h-8" style={{ color: 'var(--p)' }} />
                </div>
                <h3 className="text-[15px] font-semibold mb-2" style={{ color: 'var(--t1)' }}>No courses yet</h3>
                <p className="text-[13px] mb-5 max-w-xs" style={{ color: 'var(--t3)' }}>
                  Create your first course and start sharing your knowledge with your community.
                </p>
                <Link
                  href="/creator/courses/create"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: 'var(--p)' }}
                >
                  <Plus className="w-4 h-4" />
                  Create your first course
                </Link>
              </div>
            )}

            {/* course grid */}
            {!loading && courses.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {courses.map((c, i) => (
                  <CourseCard key={(c._id ?? c.id ?? i)} course={c} />
                ))}
              </div>
            )}

          </main>
        </div>
      </div>
    </>
  )
}
