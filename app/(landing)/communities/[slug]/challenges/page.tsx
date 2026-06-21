import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { getCommunity, LEVEL_CONFIG } from '@/lib/community-data'
import { Zap, Users, Calendar, Clock, Trophy, Tag } from 'lucide-react'

interface Props { params: Promise<{ slug: string }> }

const STATUS_CONFIG = {
  active:   { label: 'Active',   labelAr: 'نشط',    bg: '#ede9ff', color: '#8e78fb' },
  upcoming: { label: 'Upcoming', labelAr: 'قادم',    bg: '#fff3e4', color: '#ff9b28' },
  ended:    { label: 'Ended',    labelAr: 'انتهى',   bg: '#f3f4f6', color: '#9590b8' },
}

export default async function ChallengesPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  return (
    <div className="w-full" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Challenge Cards — vertical with 16:9 thumbnail */}
      <div className="flex flex-col gap-5">
        {community.challenges.map((challenge) => {
          const statusConf = STATUS_CONFIG[challenge.status]
          const diffConf = LEVEL_CONFIG[challenge.difficulty]

          return (
            <div key={challenge.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid #e8e4ff', background: '#fff' }}>

              {/* Thumbnail — 16:9 */}
              <div className="w-full h-[200px] relative" style={{ background: challenge.status === 'active' ? '#fff3e4' : '#f7f7fe' }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(142,120,251,0.1)' }}>
                    <Zap className="w-6 h-6" style={{ color: '#c4b8fd' }} />
                  </div>
                </div>
                {/* Status badge */}
                <span className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-md"
                  style={{ background: statusConf.bg, color: statusConf.color }}>
                  {isAr ? statusConf.labelAr : statusConf.label}
                </span>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-bold" style={{ color: '#1a1730' }}>
                  {isAr ? challenge.titleAr : challenge.title}
                </h3>
                <p className="text-sm mt-1.5 leading-relaxed" style={{ color: '#9590b8' }}>
                  {isAr ? challenge.descriptionAr : challenge.description}
                </p>

                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#46426a' }}>
                    <Calendar className="w-4 h-4" style={{ color: '#9590b8' }} />
                    <div>
                      <span className="font-semibold">{challenge.startDate}</span>
                      <p className="text-xs" style={{ color: '#9590b8' }}>{isAr ? 'تاريخ البدء' : 'Start Date'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#46426a' }}>
                    <Clock className="w-4 h-4" style={{ color: '#9590b8' }} />
                    <div>
                      <span className="font-semibold">{challenge.duration}</span>
                      <p className="text-xs" style={{ color: '#9590b8' }}>{isAr ? 'المدة' : 'Duration'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#46426a' }}>
                    <Users className="w-4 h-4" style={{ color: '#9590b8' }} />
                    <div>
                      <span className="font-semibold">{challenge.participantsCount}</span>
                      <p className="text-xs" style={{ color: '#9590b8' }}>{isAr ? 'المشاركين' : 'Participants'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#46426a' }}>
                    <Trophy className="w-4 h-4" style={{ color: '#9590b8' }} />
                    <div>
                      <span className="font-semibold">{challenge.deposit || 50} TND</span>
                      <p className="text-xs" style={{ color: '#9590b8' }}>{isAr ? 'التأمين' : 'Deposit'}</p>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-xs px-3 py-1 rounded-full" style={{ border: '1px solid #e8e4ff', color: '#46426a' }}>
                    {isAr ? diffConf.labelAr : diffConf.label}
                  </span>
                  {challenge.tags?.map(tag => (
                    <span key={String(tag)} className="text-xs px-3 py-1 rounded-full" style={{ border: '1px solid #e8e4ff', color: '#46426a' }}>
                      {String(tag)}
                    </span>
                  ))}
                </div>

                {/* Progress bar if active */}
                {challenge.status === 'active' && challenge.progress !== undefined && (
                  <div className="mt-4">
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#ede9ff' }}>
                      <div className="h-full rounded-full" style={{ width: `${challenge.progress}%`, background: '#8e78fb' }} />
                    </div>
                    <p className="text-xs mt-1" style={{ color: '#9590b8' }}>{challenge.progress}% {isAr ? 'مكتمل' : 'complete'}</p>
                  </div>
                )}

                {/* Divider */}
                <div className="my-4" style={{ borderTop: '1px solid #e8e4ff' }} />

                {/* Reward + CTA */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Trophy className="w-4 h-4" style={{ color: '#ff9b28' }} />
                    <span className="text-sm font-semibold" style={{ color: '#ff9b28' }}>
                      ${challenge.reward || 25} {isAr ? 'مكافأة' : 'reward'}
                    </span>
                  </div>
                  <button
                    className="px-5 py-2.5 text-sm font-semibold rounded-lg text-white"
                    style={{ background: challenge.status === 'ended' ? '#9590b8' : '#ff9b28' }}
                  >
                    {challenge.status === 'ended'
                      ? (isAr ? 'عرض النتائج' : 'View Recap')
                      : (isAr ? 'انضم للتحدي' : 'Join Challenge')}
                    {challenge.status !== 'ended' && ' →'}
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
