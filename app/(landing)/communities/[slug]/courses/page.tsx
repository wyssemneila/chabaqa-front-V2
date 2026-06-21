import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { BookOpen, Search, Users, Clock, Star } from 'lucide-react'
import { getCommunity, LEVEL_CONFIG } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

export default async function CoursesPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  const tabs = [
    { key: 'all', label: isAr ? 'الكل' : 'All' },
    { key: 'in-progress', label: isAr ? 'قيد التقدم' : 'In Progress' },
    { key: 'completed', label: isAr ? 'مكتمل' : 'Completed' },
    { key: 'not-started', label: isAr ? 'لم يبدأ' : 'Not Started' },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {isAr ? 'الدورات' : 'Courses'}
        </h1>
        <p className="text-[13px] text-gray-500 mt-1">
          {isAr ? `دورات ${community.nameAr}` : `${community.name} courses`}
        </p>
      </div>

      {/* Filter tabs + search */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-100">
        <div className="flex gap-6">
          {tabs.map((tab, i) => (
            <button
              key={tab.key}
              className={`pb-3 text-[13px] font-medium border-b-2 transition-colors ${
                i === 0
                  ? 'border-[#3AAFA9] text-[#3AAFA9]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={isAr ? 'بحث...' : 'Search...'}
            className="pl-9 pr-4 py-2 text-[13px] rounded-lg border border-gray-200 bg-white text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 w-[200px]"
          />
        </div>
      </div>

      {/* Courses grid */}
      {community.courses.length === 0 ? (
        <div className="rounded-xl border border-gray-100 p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">
            {isAr ? 'لا توجد دورات بعد' : 'No courses yet'}
          </p>
          <p className="text-[13px] text-gray-500">
            {isAr ? 'ترقبوا قريباً' : 'Check back soon'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {community.courses.map((course) => {
            const level = LEVEL_CONFIG[course.level]
            return (
              <div key={course.id} className="rounded-xl border border-gray-100 overflow-hidden">
                {/* Thumbnail */}
                <div className="relative h-[140px] bg-gray-50 flex items-center justify-center">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
                  )}
                  <span className="absolute top-3 left-3 text-[11px] font-medium bg-white/90 text-gray-700 px-2 py-0.5 rounded">
                    {course.lessonsCount} {isAr ? 'درس' : 'lessons'}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col gap-2">
                  <h3 className="text-[14px] font-semibold text-gray-900 line-clamp-2">
                    {isAr ? course.titleAr : course.title}
                  </h3>

                  <div className="flex items-center gap-3 text-[12px] text-gray-500">
                    <span>{course.instructor}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>{isAr ? level.labelAr : level.label}</span>
                  </div>

                  <div className="flex items-center gap-3 text-[12px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {course.studentsCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {course.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" />
                      {course.rating}
                    </span>
                  </div>

                  {/* Progress bar */}
                  {course.enrolled && course.progress !== undefined && (
                    <div className="mt-1">
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#3AAFA9]"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">{course.progress}% {isAr ? 'مكتمل' : 'complete'}</p>
                    </div>
                  )}

                  {/* Price + CTA */}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[13px] font-semibold text-gray-900">
                      {course.price === 'free'
                        ? (isAr ? 'مجاني' : 'Free')
                        : `${course.price} ${course.currency || 'TND'}`}
                    </span>
                    <button
                      className={`text-[12px] font-medium px-3 py-1.5 rounded-lg ${
                        course.enrolled
                          ? 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                          : 'bg-[#3AAFA9] text-white'
                      }`}
                    >
                      {course.enrolled
                        ? (isAr ? 'متابعة' : 'Continue')
                        : (isAr ? 'سجّل الآن' : 'Enroll Now')}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
