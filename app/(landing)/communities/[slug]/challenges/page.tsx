import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { getCommunity, LEVEL_CONFIG } from '@/lib/community-data'
import { Zap, Users, Calendar, Clock } from 'lucide-react'

interface Props { params: Promise<{ slug: string }> }

const STATUS_CONFIG = {
  active:   { label: 'Active',   labelAr: 'نشط',    color: '#10b981' },
  upcoming: { label: 'Upcoming', labelAr: 'قادم',    color: '#f59e0b' },
  ended:    { label: 'Ended',    labelAr: 'انتهى',   color: '#9ca3af' },
}

export default async function ChallengesPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  return (
    <div className="w-full" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isAr ? 'التحديات' : 'Challenges'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isAr ? 'تحدّ نفسك وتعلم مهارات جديدة' : 'Challenge yourself and learn new skills'}
        </p>
      </div>

      {/* Challenge Rows */}
      <div className="bg-white rounded-xl divide-y divide-gray-100">
        {community.challenges.map((challenge) => {
          const statusConf = STATUS_CONFIG[challenge.status]
          const diffConf = LEVEL_CONFIG[challenge.difficulty]
          return (
            <div key={challenge.id} className="flex gap-5 p-5">
              {/* Thumbnail */}
              <div className="flex-shrink-0 w-[200px] h-[140px] rounded-xl bg-gray-50 flex items-center justify-center">
                <Zap className="w-10 h-10 text-gray-300" />
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  {/* Status badge */}
                  <span className="text-xs font-medium" style={{ color: statusConf.color }}>
                    {isAr ? statusConf.labelAr : statusConf.label}
                  </span>
                  <h3 className="text-base font-semibold text-gray-900 mt-1 truncate">
                    {isAr ? challenge.titleAr : challenge.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {isAr ? challenge.descriptionAr : challenge.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {challenge.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {challenge.participantsCount} participants
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {challenge.startDate}
                    </span>
                    <span className="text-xs" style={{ color: diffConf.color }}>
                      {isAr ? diffConf.labelAr : diffConf.label}
                    </span>
                  </div>
                </div>

                {/* Bottom row */}
                <div className="flex items-center justify-between mt-3">
                  {challenge.status === 'active' && challenge.progress !== undefined ? (
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#3AAFA9] rounded-full"
                          style={{ width: `${challenge.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{challenge.progress}%</span>
                    </div>
                  ) : (
                    <div />
                  )}
                  <button className="px-4 py-2 text-sm font-medium rounded-lg bg-[#3AAFA9] text-white">
                    {challenge.status === 'ended'
                      ? (isAr ? 'عرض النتائج' : 'View Results')
                      : (isAr ? 'انضم للتحدي' : 'Join Challenge')}
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
