import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { getCommunity, isCurrentUserOwner, LEVEL_CONFIG } from '@/lib/community-data'
import { BookOpen, Users, Clock, Play, Award, Plus, Pencil, Eye } from 'lucide-react'

interface Props { params: Promise<{ slug: string }> }

export default async function CoursesPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'
  const isAdmin = isCurrentUserOwner(community)

  const tabs = [
    { label: 'All', labelAr: 'الكل', count: community.courses.length },
    { label: 'Free', labelAr: 'مجاني', count: community.courses.filter(c => c.price === 'free').length },
    { label: 'Paid', labelAr: 'مدفوع', count: community.courses.filter(c => c.price !== 'free').length },
  ]

  return (
    <div className="w-full" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#1a1730' }}>
          {community.name} {isAr ? 'الدورات' : 'Courses'}
        </h1>
        <p className="mt-1 text-[14px]" style={{ color: '#9590b8' }}>
          {isAr ? 'تعلم مهارات جديدة مع دورات احترافية' : 'Learn new skills with professional courses'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 mb-6 border-b" style={{ borderColor: '#e8e4ff' }}>
        {tabs.map((tab, i) => (
          <button key={tab.label}
                  className="pb-3 text-sm font-medium border-b-2 transition-colors"
                  style={{
                    borderColor: i === 0 ? '#8e78fb' : 'transparent',
                    color: i === 0 ? '#1a1730' : '#9590b8',
                  }}>
            {isAr ? tab.labelAr : tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {community.courses.map((course) => {
          const level = LEVEL_CONFIG[course.level]
          const totalChapters = course.sections?.reduce((n, s) => n + s.chapters.length, 0) || course.lessonsCount
          const isFree = course.price === 'free'
          const priceLabel = isFree ? (isAr ? 'مجاني' : 'Free') : `${course.price} ${course.currency || 'TND'}`

          return (
            <div key={course.id} className="group rounded-2xl overflow-hidden border bg-white flex flex-col transition-all hover:shadow-xl hover:scale-[1.015]"
                 style={{ borderColor: '#e8e4ff' }}>
              <Link href={`/communities/${slug}/courses/${course.id}`}>
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
                  {course.banner ? (
                    <img src={course.banner} alt={course.title}
                         className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"
                         style={{ background: 'linear-gradient(135deg, #8e78fb 0%, #a08cff 55%, #f65887 130%)' }}>
                      <div className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md"
                           style={{ background: 'rgba(255,255,255,.25)' }}>
                        <Play className="w-6 h-6 text-white ml-0.5" fill="#fff" />
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 pointer-events-none"
                       style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.25) 0%, transparent 30%, transparent 70%, rgba(0,0,0,.3) 100%)' }} />
                  <span className="absolute top-3 right-3 text-[11px] font-bold px-2 py-1 rounded-md text-white shadow-md"
                        style={{ background: isFree ? 'linear-gradient(to right, #10b981, #22c55e)' : 'linear-gradient(to right, #8e78fb, #a08cff)' }}>
                    {priceLabel}
                  </span>
                  {course.enrolled && (
                    <span className="absolute top-3 left-3 text-[11px] font-semibold px-2 py-1 rounded-md text-white shadow-md"
                          style={{ background: 'rgba(0,0,0,.55)' }}>
                      ✓ {isAr ? 'مسجّل' : 'Enrolled'}
                    </span>
                  )}
                  <span className="absolute bottom-3 left-3 text-[10.5px] font-semibold px-2 py-1 rounded-full shadow-md"
                        style={{ background: 'rgba(255,255,255,.95)', color: level.color }}>
                    {isAr ? level.labelAr : level.label}
                  </span>
                </div>
              </Link>

              <div className="p-3.5 flex-1 flex flex-col gap-2">
                <Link href={`/communities/${slug}/courses/${course.id}`}>
                  <h3 className="text-[14px] font-bold line-clamp-2 leading-snug group-hover:text-[#8e78fb] transition-colors"
                      style={{ color: '#1a1730' }}>
                    {isAr ? course.titleAr : course.title}
                  </h3>
                </Link>

                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                       style={{ background: '#8e78fb' }}>
                    {course.instructor.split(' ').map(w => w[0]).slice(0, 2).join('')}
                  </div>
                  <p className="text-[11.5px] truncate" style={{ color: '#9590b8' }}>
                    {isAr ? 'بواسطة' : 'by'}{' '}
                    <span className="font-semibold" style={{ color: '#46426a' }}>{course.instructor}</span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-auto">
                  <StatBadge icon={<BookOpen className="w-3 h-3" />} value={`${totalChapters}`} label={isAr ? 'فصل' : 'ch'} />
                  <StatBadge icon={<Clock className="w-3 h-3" />} value={course.duration} />
                  <StatBadge icon={<Users className="w-3 h-3" />} value={`${course.studentsCount}`} />
                  <StatBadge icon={<Award className="w-3 h-3" iconColor="#f59e0b" />} value={course.rating.toFixed(1)} />
                </div>

                {course.enrolled && course.progress !== undefined && (
                  <div className="mt-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px]" style={{ color: '#9590b8' }}>{isAr ? 'التقدم' : 'Progress'}</span>
                      <span className="text-[10px] font-semibold" style={{ color: '#8e78fb' }}>{course.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#ede9ff' }}>
                      <div className="h-full rounded-full" style={{ width: `${course.progress}%`, background: '#8e78fb' }} />
                    </div>
                  </div>
                )}

                {/* CTA: Admin vs User */}
                {isAdmin ? (
                  <div className="flex gap-2 mt-2">
                    <button className="flex-1 py-2 text-[12px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors hover:bg-[#f9f7ff]"
                            style={{ border: '1px solid #e8e4ff', color: '#46426a' }}>
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <Link href={`/communities/${slug}/courses/${course.id}`}
                          className="flex-1 py-2 text-[12px] font-semibold rounded-lg text-white flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90"
                          style={{ background: '#8e78fb' }}>
                      <Eye className="w-3 h-3" /> View as User
                    </Link>
                  </div>
                ) : (
                  <Link href={`/communities/${slug}/courses/${course.id}`}
                        className="w-full mt-2 py-2 text-[12px] font-semibold rounded-lg text-white text-center transition-opacity group-hover:opacity-90 block"
                        style={{ background: 'linear-gradient(to right, #8e78fb, #a08cff)' }}>
                    {course.enrolled ? (isAr ? 'تابع' : 'Continue') : (isAr ? 'سجّل الآن' : 'Enroll now')}
                  </Link>
                )}
              </div>
            </div>
          )
        })}

        {/* +New Course card (admin only) */}
        {isAdmin && (
          <button className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 min-h-[280px] transition-colors hover:bg-[#f9f7ff] cursor-pointer"
                  style={{ borderColor: '#d8d5e8', color: '#9590b8' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#ede9ff' }}>
              <Plus className="w-5 h-5" style={{ color: '#8e78fb' }} />
            </div>
            <span className="text-[14px] font-medium" style={{ color: '#8e78fb' }}>
              {isAr ? '+ دورة جديدة' : '+ New course'}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}

function StatBadge({ icon, value, label, iconColor }:
  { icon: React.ReactNode; value: string; label?: string; iconColor?: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-medium"
          style={{ background: 'rgba(142,120,251,0.1)', color: '#8e78fb' }}>
      <span style={{ color: iconColor || '#8e78fb' }}>{icon}</span>
      {value}{label ? ` ${label}` : ''}
    </span>
  )
}
