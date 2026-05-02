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
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-extrabold" style={{ color: 'var(--t1)' }}>
          {isAr ? 'الكورسات' : 'Courses'}
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>
          {isAr ? 'تعلم واتقن مهاراتك مع كورسات المجتمع' : 'Learn and master your skills with community courses'}
        </p>
      </div>

      {/* Stats */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {[
          { value: community.courses.length, label: isAr ? 'كورس' : 'Total', color: 'var(--p)' },
          { value: community.courses.filter(c => c.enrolled).length, label: isAr ? 'مسجل' : 'Enrolled', color: 'var(--cyan)' },
          { value: community.courses.reduce((a, c) => a + c.studentsCount, 0), label: isAr ? 'طالب' : 'Students', color: 'var(--orange)' },
          { value: community.courses.filter(c => c.price === 'free').length, label: isAr ? 'مجاني' : 'Free', color: '#10b981' },
        ].map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5 px-4 py-3 rounded-2xl flex-shrink-0" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
            <span className="text-lg font-extrabold" style={{ color: s.color }}>{s.value}</span>
            <span className="text-[10px]" style={{ color: 'var(--t3)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      {community.courses.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
          <BookOpen className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--p3)' }} strokeWidth={1.5} />
          <p className="text-sm font-semibold" style={{ color: 'var(--t2)' }}>{isAr ? 'لا توجد كورسات بعد' : 'No courses yet'}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--t3)' }}>{isAr ? 'ترقبوا قريباً' : 'Check back soon'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {community.courses.map(course => {
            const level = LEVEL_CONFIG[course.level]
            return (
              <article
                key={course.id}
                className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_16px_48px_rgba(142,120,251,.18)] cursor-pointer"
                style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}
              >
                <div className="relative h-40 flex items-center justify-center flex-shrink-0" style={{ background: 'var(--p2)' }}>
                  <BookOpen className="w-10 h-10" style={{ color: 'var(--p)' }} strokeWidth={1.3} />
                  {course.enrolled && (
                    <div className="absolute top-2.5 start-2.5 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold" style={{ background: 'var(--p)', color: '#fff' }}>
                      <CheckCircle className="w-3 h-3" strokeWidth={2} />
                      {isAr ? 'مسجل' : 'Enrolled'}
                    </div>
                  )}
                  <span className="absolute top-2.5 end-2.5 text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: 'var(--white)', color: course.price === 'free' ? '#10b981' : 'var(--t1)' }}>
                    {course.price === 'free' ? (isAr ? 'مجاني' : 'Free') : `${course.price} ${course.currency}`}
                  </span>
                </div>
                <div className="flex flex-col flex-1 p-4 gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full self-start" style={{ background: level.bg, color: level.color }}>
                    {isAr ? level.labelAr : level.label}
                  </span>
                  <h3 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-[var(--p)] transition-colors" style={{ color: 'var(--t1)' }}>
                    {isAr ? course.titleAr : course.title}
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] mt-auto" style={{ color: 'var(--t3)' }}>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" strokeWidth={1.7} />{course.studentsCount}</span>
                    <span className="flex items-center gap-1"><Play className="w-3 h-3" strokeWidth={1.7} />{course.lessonsCount} {isAr ? 'درس' : 'lessons'}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" strokeWidth={1.7} />{course.duration}</span>
                  </div>
                  {course.enrolled && course.progress !== undefined && (
                    <div className="mt-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-medium" style={{ color: 'var(--t3)' }}>{isAr ? 'التقدم' : 'Progress'}</span>
                        <span className="text-[10px] font-bold" style={{ color: 'var(--p)' }}>{course.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--bg)' }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${course.progress}%`, background: 'var(--p)' }} />
                      </div>
                    </div>
                  )}
                  <button
                    className="mt-2 w-full py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                    style={course.enrolled ? { background: 'var(--p2)', color: 'var(--p)' } : { background: 'var(--p)', color: '#fff' }}
                  >
                    {course.enrolled ? (isAr ? 'تابع' : 'Continue') : (isAr ? 'انضم' : 'Enroll Now')}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  )
}
