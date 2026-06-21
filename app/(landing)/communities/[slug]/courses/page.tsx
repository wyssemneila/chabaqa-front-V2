import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { BookOpen, Play, Clock, Users, CheckCircle } from 'lucide-react'
import { getCommunity, LEVEL_CONFIG } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

export default async function CoursesPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  return (
    <div className="flex flex-col gap-5">

      {/* Courses grid */}
      {community.courses.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--p2)' }}>
            <BookOpen className="w-7 h-7" style={{ color: 'var(--p)' }} strokeWidth={1.3} />
          </div>
          <p className="text-base font-bold mb-1" style={{ color: 'var(--t1)' }}>
            {isAr ? 'لا توجد كورسات بعد' : 'No courses yet'}
          </p>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>
            {isAr ? 'ترقبوا قريباً' : 'Check back soon'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {community.courses.map(course => {
            const lvl = LEVEL_CONFIG[course.level]
            const isFree = course.price === 'free'
            return (
              <article key={course.id}
                className="group flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-shadow duration-200 hover:shadow-md"
                style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>

                {/* Thumbnail */}
                <div className="relative flex items-center justify-center overflow-hidden" style={{ height: 140, background: `linear-gradient(135deg, ${community.avatarColor}22, var(--p2))` }}>
                  <BookOpen className="w-10 h-10 opacity-40" style={{ color: 'var(--p)' }} strokeWidth={1.2} />

                  {/* Top badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: lvl.bg, color: lvl.color }}>
                      {isAr ? lvl.labelAr : lvl.label}
                    </span>
                    {course.enrolled && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'var(--p)', color: '#fff' }}>
                        <CheckCircle className="w-3 h-3" strokeWidth={2} />
                        {isAr ? 'مسجل' : 'Enrolled'}
                      </span>
                    )}
                  </div>

                  {/* Price badge */}
                  <span className="absolute top-3 right-3 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={isFree
                      ? { background: '#10b981', color: '#fff' }
                      : { background: 'var(--white)', color: 'var(--t1)', border: '1px solid var(--bd)' }
                    }>
                    {isFree ? (isAr ? 'مجاني' : 'Free') : `${course.price} ${course.currency ?? ''}`}
                  </span>

                  {/* Play overlay on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: 'rgba(0,0,0,.18)' }}>
                    <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'var(--p)', boxShadow: '0 6px 20px rgba(142,120,251,.5)' }}>
                      <Play className="w-5 h-5 text-white ml-0.5" strokeWidth={2} />
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="flex flex-col flex-1 p-5 gap-3">
                  <h3 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-[var(--p)] transition-colors" style={{ color: 'var(--t1)' }}>
                    {isAr ? course.titleAr : course.title}
                  </h3>

                  {/* Instructor */}
                  <p className="text-xs truncate" style={{ color: 'var(--t3)' }}>{course.instructor}</p>

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
                        <span className="text-[11px]" style={{ color: 'var(--t3)' }}>{isAr ? 'تقدمك' : 'Progress'}</span>
                        <span className="text-[11px] font-semibold" style={{ color: 'var(--p)' }}>{course.progress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
                        <div className="h-2 rounded-full transition-all" style={{ width: `${course.progress}%`, background: 'linear-gradient(90deg, var(--p), #a78bfa)' }} />
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <button className="mt-auto w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
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
