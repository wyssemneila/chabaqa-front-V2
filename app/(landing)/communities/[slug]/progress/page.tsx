import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { Trophy, BookOpen, Zap, Calendar } from 'lucide-react'
import { getCommunity } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

export default async function ProgressPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  // Mock leaderboard data from members
  const leaderboard = community.members.slice(0, 10).map((m, i) => ({
    ...m,
    points: Math.max(1200 - i * 120, 50),
    rank: i + 1,
  }))

  // Mock progress stats
  const stats = [
    { label: isAr ? 'الدورات' : 'Courses', value: community.courses.filter(c => c.enrolled).length, total: community.courses.length, icon: BookOpen },
    { label: isAr ? 'التحديات' : 'Challenges', value: community.challenges.filter(c => c.progress !== undefined).length, total: community.challenges.length, icon: Zap },
    { label: isAr ? 'الجلسات' : 'Sessions', value: community.sessions.filter(s => s.booked).length, total: community.sessions.length, icon: Calendar },
  ]

  // Overall progress
  const totalEnrolled = community.courses.filter(c => c.enrolled).length
  const totalCourses = community.courses.length
  const overallPercent = totalCourses > 0 ? Math.round((totalEnrolled / totalCourses) * 100) : 0

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {isAr ? 'المتصدرين' : 'Leaderboards'}
        </h1>
        <p className="text-[13px] text-gray-500 mt-1">
          {isAr ? `ترتيب أعضاء ${community.nameAr}` : `${community.name} member rankings`}
        </p>
      </div>

      {/* Progress ring + stats */}
      <div className="rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-8">
          {/* SVG Progress ring */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none" stroke="#3AAFA9" strokeWidth="8"
                strokeDasharray={`${overallPercent * 2.64} ${264 - overallPercent * 2.64}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-900">{overallPercent}%</span>
            </div>
          </div>

          {/* By-type bars */}
          <div className="flex-1 flex flex-col gap-3">
            {stats.map((stat) => {
              const Icon = stat.icon
              const pct = stat.total > 0 ? Math.round((stat.value / stat.total) * 100) : 0
              return (
                <div key={stat.label} className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-gray-400" />
                  <span className="text-[12px] text-gray-600 w-20">{stat.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-[#3AAFA9]" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[12px] text-gray-500 w-12 text-right">{stat.value}/{stat.total}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="rounded-xl border border-gray-100 divide-y divide-gray-100">
        <div className="px-5 py-3 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-gray-900">
            {isAr ? 'الترتيب' : 'Rankings'}
          </h2>
          <span className="text-[12px] text-gray-400">
            {isAr ? 'النقاط' : 'Points'}
          </span>
        </div>
        {leaderboard.map((member) => (
          <div key={member.id} className="px-5 py-3 flex items-center gap-3">
            <span className={`text-[13px] font-bold w-6 ${
              member.rank <= 3 ? 'text-[#3AAFA9]' : 'text-gray-400'
            }`}>
              {member.rank}
            </span>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold"
              style={{ background: member.color }}
            >
              {member.initials}
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-gray-900">{member.name}</p>
              <p className="text-[11px] text-gray-400">@{member.handle}</p>
            </div>
            <span className="text-[13px] font-semibold text-gray-700">{member.points}</span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-gray-100 p-5">
        <h2 className="text-[14px] font-semibold text-gray-900 mb-4">
          {isAr ? 'النشاط الأخير' : 'Recent Activity'}
        </h2>
        <div className="flex flex-col gap-4">
          {community.courses.filter(c => c.enrolled).slice(0, 4).map((course, i) => (
            <div key={course.id} className="flex items-start gap-3">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-[#3AAFA9] mt-1.5" />
                {i < 3 && <div className="absolute top-3 left-[3px] w-0.5 h-6 bg-gray-100" />}
              </div>
              <div>
                <p className="text-[13px] text-gray-700">
                  {isAr ? 'بدأ دورة' : 'Started course'}: {isAr ? course.titleAr : course.title}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {course.progress !== undefined ? `${course.progress}% ${isAr ? 'مكتمل' : 'complete'}` : (isAr ? 'للتو' : 'Just now')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
