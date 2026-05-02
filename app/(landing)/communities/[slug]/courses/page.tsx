import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { BookOpen, Play, Clock, Users, Star, CheckCircle, Lock } from 'lucide-react'
import { getCommunity, LEVEL_CONFIG } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

export default async function CoursesPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  const enrolled = community.courses.filter(c => c.enrolled)
  const free = community.courses.filter(c => c.price === 'free')

  return (
    <div className="flex flex-col gap-6">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--t1)' }}>
            {isAr ? 'الكورسات' : 'Courses'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>
            {isAr ? 'تعلّم وطوّر مهاراتك مع كورسات المجتمع' : 'Learn and level up with community courses'}
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { value: community.courses.length, label: isAr ? 'كورس' : 'Total Courses', color: 'var(--p)', bg: 'var(--p2)', icon: <BookOpen className="w-4 h-4" strokeWidth={1.7} /> },
          { value: enrolled.length, label: isAr ? 'مسجل فيه' : 'Enrolled', color: '#10b981', bg: '#d1fae5', icon: <CheckCircle className="w-4 h-4" strokeWidth={1.7} /> },
          { value: community.courses.reduce((a, c) => a + c.studentsCount, 0), label: isAr ? 'طالب' : 'Students', color: 'var(--orange, #ff9b28)', bg: '#fff4e5', icon: <Users className="w-4 h-4" strokeWidth={1.7} /> },
          { value: free.length, label: isAr ? 'مجاني' : 'Free', color: 'var(--cyan, #47c7ea)', bg: '#e0f7fc', icon: <Star className="w-4 h-4" strokeWidth={1.7} /> },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <p className="text-lg font-extrabold leading-none" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--t3)' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Courses grid */}
      {community.courses.length === 0 ? (
        <div className="rounded-2xl p-14 text-center" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--p2)' }}>
            <BookOpen className="w-8 h-8" style={{ color: 'var(--p)' }} strokeWidth={1.3} />
          </div>
          <p className="text-base font-bold mb-1" style={{ color: 'var(--t1)' }}>
            {isAr ? 'لا توجد كورسات بعد' : 'No courses yet'}
          </p>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>
            {isAr ? 'ترقبوا قريباً' : 'Check back soon'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {community.courses.map(course => {
            const lvl = LEVEL_CONFIG[course.level]
            const isFree = course.price === 'free'
            return (
              <article key={course.id}
                className="group flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(142,120,251,.15)]"
                style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>

                {/* Thumbnail */}
                <div className="relative flex items-center justify-center overflow-hidden" style={{ height: 156, background: `linear-gradient(135deg, ${community.avatarColor}22, var(--p2))` }}>
                  <BookOpen className="w-12 h-12 opacity-40" style={{ color: 'var(--p)' }} strokeWidth={1.2} />

                  {/* Top badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: lvl.bg, color: lvl.color }}>
                      {isAr ? lvl.labelAr : lvl.label}
                    </span>
                    {course.enrolled && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: 'var(--p)', color: '#fff' }}>
                        <CheckCircle className="w-3 h-3" strokeWidth={2} />
                        {isAr ? 'مسجل' : 'Enrolled'}
                      </span>
                    )}
                  </div>

                  {/* Price badge */}
                  <span className="absolute top-3 right-3 text-[10px] font-extrabold px-2.5 py-1 rounded-full"
                    style={isFree
                      ? { background: '#10b981', color: '#fff' }
                      : { background: 'var(--white)', color: 'var(--t1)', border: '1px solid var(--bd)' }
                    }>
                    {isFree ? (isAr ? 'مجاني' : 'Free') : `${course.price} ${course.currency ?? ''}`}
                  </span>

                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: 'rgba(0,0,0,.18)' }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--p)', boxShadow: '0 8px 24px rgba(142,120,251,.5)' }}>
                      <Play className="w-5 h-5 text-white ml-0.5" strokeWidth={2} />
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="flex flex-col flex-1 p-5 gap-3">
                  <h3 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-[var(--p)] transition-colors" style={{ color: 'var(--t1)' }}>
                    {isAr ? course.titleAr : course.title}
                  </h3>

                  {/* Instructor + rating */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs truncate" style={{ color: 'var(--t3)' }}>{course.instructor}</p>
                    <div className="flex items-center gap-1">
                      <svg viewBox="0 0 24 24" fill="#ff9b28" width="12" height="12"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      <span className="text-[11px] font-bold" style={{ color: 'var(--t2)' }}>{course.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--t3)' }}>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" strokeWidth={1.7} />{course.studentsCount}</span>
                    <span className="flex items-center gap-1"><Play className="w-3 h-3" strokeWidth={1.7} />{course.lessonsCount} {isAr ? 'درس' : 'lessons'}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" strokeWidth={1.7} />{course.duration}</span>
                  </div>

                  {/* Progress bar */}
                  {course.enrolled && course.progress !== undefined && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px]" style={{ color: 'var(--t3)' }}>{isAr ? 'تقدمك' : 'Progress'}</span>
                        <span className="text-[10px] font-black" style={{ color: 'var(--p)' }}>{course.progress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
                        <div className="h-2 rounded-full transition-all" style={{ width: `${course.progress}%`, background: 'linear-gradient(90deg, var(--p), #a78bfa)' }} />
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <button className="mt-auto w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-95"
                    style={course.enrolled
                      ? { background: 'var(--p2)', color: 'var(--p)' }
                      : isFree
                        ? { background: 'var(--p)', color: '#fff' }
                        : { background: 'var(--t1)', color: '#fff' }
                    }>
                    {course.enrolled
                      ? (isAr ? '▶ تابع الكورس' : '▶ Continue')
                      : isFree
                        ? (isAr ? 'التحق مجاناً' : 'Enroll Free')
                        : (isAr ? 'اشترِ الكورس' : 'Buy Course')
                    }
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
