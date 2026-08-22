import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { getCommunity, LEVEL_CONFIG } from '@/lib/community-data'
import { BookOpen, Users, Clock, Star, Search, Play, ImageIcon } from 'lucide-react'

interface Props { params: Promise<{ slug: string }> }

export default async function CoursesPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  const tabs = [
    { label: 'All', labelAr: 'الكل', count: community.courses.length },
    { label: 'My Courses', labelAr: 'دوراتي', count: community.courses.filter(c => c.enrolled).length },
    { label: 'Free', labelAr: 'مجاني', count: community.courses.filter(c => c.price === 'free').length },
    { label: 'Paid', labelAr: 'مدفوع', count: community.courses.filter(c => c.price !== 'free').length },
    { label: 'Available', labelAr: 'متاح', count: community.courses.filter(c => !c.enrolled).length },
  ]

  return (
    <div className="w-full" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Tabs */}
      <div className="flex items-center gap-6 mb-6 border-b" style={{ borderColor: '#e8e4ff' }}>
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            className="pb-3 text-sm font-medium border-b-2 transition-colors"
            style={{
              borderColor: i === 0 ? '#8e78fb' : 'transparent',
              color: i === 0 ? '#1a1730' : '#9590b8',
            }}
          >
            {isAr ? tab.labelAr : tab.label} ({tab.count})
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9590b8' }} />
            <input
              type="text"
              placeholder={isAr ? 'بحث في الدورات...' : 'Search courses...'}
              className="pl-9 pr-4 py-2 text-sm rounded-lg bg-white focus:outline-none"
              style={{ border: '1px solid #e8e4ff' }}
            />
          </div>
        </div>
      </div>

      {/* Course Cards */}
      <div className="flex flex-col gap-5">
        {community.courses.map((course) => {
          const levelConf = LEVEL_CONFIG[course.level]
          const chaptersTotal = course.lessonsCount
          const chaptersDone = course.progress !== undefined ? Math.round((course.progress / 100) * chaptersTotal) : 0

          return (
            <div key={course.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid #e8e4ff', background: '#fff' }}>
              <div className="flex">
                {/* Thumbnail — 16:9 */}
                <div className="relative flex-shrink-0 w-[280px] h-[158px] rounded-l-xl overflow-hidden" style={{ background: '#f7f7fe' }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(142,120,251,0.1)' }}>
                      <BookOpen className="w-6 h-6" style={{ color: '#c4b8fd' }} />
                    </div>
                  </div>
                  {course.enrolled && (
                    <span className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-md text-white" style={{ background: '#8e78fb' }}>
                      ✓ {isAr ? 'مسجّل' : 'Enrolled'}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold truncate" style={{ color: '#1a1730' }}>
                          {isAr ? course.titleAr : course.title}
                        </h3>
                        <p className="text-sm mt-1 line-clamp-2" style={{ color: '#9590b8' }}>
                          {isAr
                            ? 'كورس شامل يأخذك من الصفر الكامل لعالم الموشن جرافيكس والانيميشن.'
                            : `A comprehensive course by ${course.instructor}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-semibold" style={{ color: '#1a1730' }}>{course.rating}</span>
                        <span className="text-xs" style={{ color: '#9590b8' }}>({course.studentsCount})</span>
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-4 mt-3 text-sm" style={{ color: '#9590b8' }}>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" /> {course.sections || 2} {isAr ? 'أقسام' : 'sections'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {chaptersTotal} {isAr ? 'فصول' : 'chapters'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {course.studentsCount} {isAr ? 'طالب' : 'students'}
                      </span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ border: '1px solid #e8e4ff', color: '#46426a' }}>
                        {isAr ? levelConf.labelAr : levelConf.label}
                      </span>
                    </div>
                  </div>

                  {/* Progress + CTA */}
                  {course.enrolled && course.progress !== undefined && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium" style={{ color: '#46426a' }}>
                          {isAr ? 'تقدمك' : 'Your Progress'}
                        </span>
                        <span className="text-xs" style={{ color: '#9590b8' }}>
                          {chaptersDone}/{chaptersTotal} {isAr ? 'فصول' : 'chapters'}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#ede9ff' }}>
                        <div className="h-full rounded-full" style={{ width: `${course.progress}%`, background: '#8e78fb' }} />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4">
                    {/* Instructor */}
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ background: '#8e78fb' }}>
                        MT
                      </div>
                      <span className="text-sm" style={{ color: '#46426a' }}>{course.instructor}</span>
                    </div>

                    {/* CTA */}
                    <Link href={`/communities/${slug}/courses/${course.id}`}
                          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg text-white transition-opacity hover:opacity-90"
                          style={{ background: '#8e78fb' }}>
                      <Play className="w-3.5 h-3.5" />
                      {course.enrolled ? (isAr ? 'تابع' : 'Continue') : (isAr ? 'سجّل الآن' : 'Enroll Now')}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
