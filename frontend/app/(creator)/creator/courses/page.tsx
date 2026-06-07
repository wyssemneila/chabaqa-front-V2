'use client'

import { useState } from 'react'
import Link from 'next/link'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import { CourseCard } from '@/components/courses/course-card'
import { BookOpen, Plus, RefreshCw, Users, Zap } from 'lucide-react'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import { useCreatorCoursesPage } from '@/hooks/creator-dashboard/use-creator-dashboard-data'

const TR = {
  en: {
    pageTitle: 'Courses', pageSub: 'Manage your online courses',
    heading: 'Your Courses', loading: 'Loading…',
    count: (n: number) => `${n} course${n !== 1 ? 's' : ''} created`,
    createCourse: 'Create Course', totalCourses: 'Total Courses',
    active: 'Active', totalEnrollments: 'Total Enrollments',
    allCourses: 'All Courses', all: 'All', inactive: 'Inactive',
    noCourses: 'No courses yet', noCoursesDesc: 'Create your first course and start sharing your knowledge.',
    noFiltered: (tab: string) => `No ${tab} courses`,
    switchTab: 'Switch the tab to see all your courses.',
    createFirst: 'Create your first course', retry: 'retry',
  },
  ar: {
    pageTitle: 'الدورات', pageSub: 'إدارة دوراتك التعليمية',
    heading: 'دوراتك', loading: 'جاري التحميل…',
    count: (n: number) => `${n} دورة تم إنشاؤها`,
    createCourse: 'إنشاء دورة', totalCourses: 'إجمالي الدورات',
    active: 'نشط', totalEnrollments: 'إجمالي التسجيلات',
    allCourses: 'جميع الدورات', all: 'الكل', inactive: 'غير نشط',
    noCourses: 'لا توجد دورات بعد', noCoursesDesc: 'أنشئ أول دورة وابدأ في مشاركة معرفتك.',
    noFiltered: (tab: string) => `لا توجد دورات ${tab}`,
    switchTab: 'قم بتبديل التبويب لرؤية جميع دوراتك.',
    createFirst: 'أنشئ دورتك الأولى', retry: 'إعادة المحاولة',
  },
}

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
  const { lang } = useDashPrefs()
  const t = TR[lang]
  const [tab,     setTab]     = useState<'all'|'active'|'inactive'>('all')
  const { data: courses, loading, error, refetch: load } = useCreatorCoursesPage()

  const totalCourses    = courses.length
  const activeCourses   = courses.filter(c => c.isPublished).length
  const totalEnrollment = courses.reduce((sum, c) => sum + (c.enrollmentsCount ?? 0), 0)

  const STATS = [
    { label: t.totalCourses,     value: totalCourses,    icon: BookOpen, color:'var(--p)',    bg:'var(--p2)' },
    { label: t.active,           value: activeCourses,   icon: Zap,      color:'var(--pink)', bg:'rgba(236,72,153,.1)' },
    { label: t.totalEnrollments, value: totalEnrollment, icon: Users,    color:'var(--cyan)', bg:'rgba(34,211,238,.12)' },
  ]

  const TABS: { key: 'all'|'active'|'inactive'; label: string }[] = [
    { key:'all',      label: t.all      },
    { key:'active',   label: t.active   },
    { key:'inactive', label: t.inactive },
  ]

  const filtered = courses.filter(c => {
    if (tab === 'active')   return c.isPublished
    if (tab === 'inactive') return !c.isPublished
    return true
  })

  const tabCounts = {
    all:      courses.length,
    active:   activeCourses,
    inactive: courses.length - activeCourses,
  }

  return (
    <>
      <style>{`
        @keyframes dashFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:var(--p3);border-radius:10px}
      `}</style>

      <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
        <DashSidebar />
        <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar title={t.pageTitle} subtitle={t.pageSub} />

          <main id="main-content" className="p-7 flex-1 space-y-6" style={{ animation: 'dashFadeUp .4s ease both' }}>

            {/* ── HEADER ── */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[20px] font-black" style={{ color: 'var(--t1)' }}>{t.heading}</h2>
                <p className="text-[13px] mt-0.5" style={{ color: 'var(--t3)' }}>
                  {loading ? t.loading : t.count(totalCourses)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={load}
                  className="p-2.5 rounded-xl cursor-pointer transition-all"
                  style={{ border: '1.5px solid var(--bd)', background: 'transparent', color: 'var(--t3)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--p2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                  <RefreshCw className="w-4 h-4" />
                </button>
                <Link href="/creator/courses/create"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90"
                  style={{ background: 'var(--p)', boxShadow: '0 4px 14px rgba(142,120,251,.4)' }}>
                  <Plus className="w-4 h-4" /> {t.createCourse}
                </Link>
              </div>
            </div>

            {/* ── STATS ROW ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {STATS.map(s => (
                <div key={s.label} className="rounded-2xl p-5 flex items-center gap-4"
                  style={{ background: 'var(--white)', border: '1px solid var(--bd)', boxShadow: '0 2px 8px rgba(0,0,0,.03)' }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: s.bg }}>
                    <s.icon className="w-6 h-6" style={{ color: s.color }} />
                  </div>
                  <div>
                    <p className="text-[24px] font-black leading-none" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[12px] font-semibold mt-0.5" style={{ color: 'var(--t3)' }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── COURSES GRID ── */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[15px] font-bold" style={{ color: 'var(--t1)' }}>{t.allCourses}</h3>
                <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                  {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer transition-all"
                      style={{
                        background: tab === t.key ? 'var(--p)' : 'transparent',
                        color:      tab === t.key ? '#fff'     : 'var(--t3)',
                      }}>
                      {t.label}
                      <span className="text-[11px] w-5 h-5 rounded-full flex items-center justify-center font-bold"
                        style={{
                          background: tab === t.key ? 'rgba(255,255,255,.25)' : 'var(--bg)',
                          color: tab === t.key ? '#fff' : 'var(--t3)',
                        }}>
                        {tabCounts[t.key]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl text-sm"
                  style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b83232' }}>
                  {error} — <button onClick={load} className="font-semibold underline cursor-pointer">{t.retry}</button>
                </div>
              )}

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl flex flex-col items-center justify-center py-20 text-center"
                  style={{ background: 'var(--white)', border: '1.5px dashed var(--bd)' }}>
                  <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
                    style={{ background: 'var(--p2)' }}>
                    <BookOpen className="w-8 h-8" style={{ color: 'var(--p)' }} />
                  </div>
                  <h3 className="text-[16px] font-bold mb-1.5" style={{ color: 'var(--t1)' }}>
                    {tab === 'all' ? t.noCourses : t.noFiltered(tab)}
                  </h3>
                  <p className="text-[13px] mb-6 max-w-xs" style={{ color: 'var(--t2)' }}>
                    {tab === 'all' ? t.noCoursesDesc : t.switchTab}
                  </p>
                  {tab === 'all' && (
                    <Link href="/creator/courses/create"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-bold text-white hover:opacity-90"
                      style={{ background: 'var(--p)', boxShadow: '0 4px 14px rgba(142,120,251,.35)' }}>
                      <Plus className="w-4 h-4" /> {t.createFirst}
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filtered.map((c, i) => (
                    <CourseCard key={(c._id ?? c.id ?? i)} course={c} />
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
