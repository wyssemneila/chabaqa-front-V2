import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { getCommunity, LEVEL_CONFIG } from '@/lib/community-data'
import { BookOpen, Users, Clock, Star, Search } from 'lucide-react'

interface Props { params: Promise<{ slug: string }> }

export default async function CoursesPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  const tabs = ['All', 'In Progress', 'Completed', 'Not Started']

  return (
    <div className="w-full" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isAr ? 'الدورات' : 'Courses'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isAr ? 'تعلم مهارات جديدة مع دورات المجتمع' : 'Learn new skills with community courses'}
        </p>
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center justify-between mb-6 border-b border-gray-100">
        <div className="flex gap-6">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                i === 0
                  ? 'border-[#3AAFA9] text-[#3AAFA9]'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={isAr ? 'بحث...' : 'Search...'}
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#3AAFA9]"
          />
        </div>
      </div>

      {/* Course Rows */}
      <div className="bg-white rounded-xl divide-y divide-gray-100">
        {community.courses.map((course) => {
          const levelConf = LEVEL_CONFIG[course.level]
          return (
            <div key={course.id} className="flex gap-5 p-5">
              {/* Thumbnail */}
              <div className="relative flex-shrink-0 w-[200px] h-[140px] rounded-xl bg-gray-50 flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-gray-300" />
                <span className="absolute top-2 left-2 text-xs bg-white/90 text-gray-500 px-2 py-0.5 rounded">
                  {course.duration}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  {/* Level badge */}
                  <span className="text-xs font-medium" style={{ color: levelConf.color }}>
                    {isAr ? levelConf.labelAr : levelConf.label}
                  </span>
                  <h3 className="text-base font-semibold text-gray-900 mt-1 truncate">
                    {isAr ? course.titleAr : course.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>{course.instructor}</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {course.studentsCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" /> {course.lessonsCount} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> {course.rating}
                    </span>
                  </div>
                </div>

                {/* Bottom row */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3">
                    {course.price === 'free' ? (
                      <span className="text-sm font-medium text-green-600">Free</span>
                    ) : (
                      <span className="text-sm font-semibold text-gray-900">
                        {course.price} {course.currency || 'TND'}
                      </span>
                    )}
                    {course.enrolled && course.progress !== undefined && (
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#3AAFA9] rounded-full"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{course.progress}%</span>
                      </div>
                    )}
                  </div>
                  <button className="px-4 py-2 text-sm font-medium rounded-lg bg-[#3AAFA9] text-white">
                    {course.enrolled ? (isAr ? 'تابع' : 'Continue') : (isAr ? 'سجّل الآن' : 'Enroll Now')}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
