import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { getCommunity, LEVEL_CONFIG } from '@/lib/community-data'
import { Zap, Users, Calendar, Trophy, Play, Lock, Clock, CheckCircle2 } from 'lucide-react'

interface Props { params: Promise<{ slug: string }> }

const STATUS_CONFIG = {
  active:   { label: 'Active',   labelAr: 'نشط',    bg: '#dcfce7', color: '#16a34a' },
  upcoming: { label: 'Upcoming', labelAr: 'قادم',    bg: '#fff3e4', color: '#ff9b28' },
  ended:    { label: 'Ended',    labelAr: 'انتهى',   bg: '#f3f4f6', color: '#9590b8' },
} as const

export default async function ChallengesPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  const active   = community.challenges.filter((c) => c.status === 'active')
  const upcoming = community.challenges.filter((c) => c.status === 'upcoming')
  const ended    = community.challenges.filter((c) => c.status === 'ended')

  const sections: { key: 'active' | 'upcoming' | 'ended'; label: string; labelAr: string; items: typeof community.challenges }[] = [
    { key: 'active',   label: 'Active',   labelAr: 'نشط',   items: active },
    { key: 'upcoming', label: 'Upcoming', labelAr: 'قادم',   items: upcoming },
    { key: 'ended',    label: 'Ended',    labelAr: 'انتهى',  items: ended },
  ]

  return (
    <div className="w-full space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {sections.map((section) => (
        <section key={section.key}>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full" style={{ background: STATUS_CONFIG[section.key].color }} />
            <h2 className="text-[15px] font-bold" style={{ color: '#1a1730' }}>
              {isAr ? section.labelAr : section.label}
            </h2>
            <span className="text-[12px]" style={{ color: '#9590b8' }}>
              ({section.items.length})
            </span>
          </div>

          {section.items.length === 0 ? (
            <p className="text-[13px] py-6 text-center rounded-xl"
               style={{ color: '#9590b8', background: '#fafafd', border: '1px dashed #e8e4ff' }}>
              {isAr ? 'لا شيء هنا حالياً' : 'Nothing here yet'}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.items.map((challenge) => {
                const diff = LEVEL_CONFIG[challenge.difficulty]
                const status = STATUS_CONFIG[challenge.status]
                const locked = challenge.status === 'ended'

                const CardWrap: any = locked ? 'div' : Link
                const wrapProps: any = locked
                  ? {}
                  : { href: `/communities/${slug}/challenges/${challenge.id}` }

                return (
                  <CardWrap key={challenge.id} {...wrapProps}
                            className={`group rounded-2xl overflow-hidden border bg-white flex flex-col ${locked ? 'opacity-70' : 'transition-all hover:shadow-xl hover:scale-[1.015]'}`}
                            style={{ borderColor: '#e8e4ff', cursor: locked ? 'not-allowed' : 'pointer' }}>
                    {/* Cover */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden"
                         style={{
                           background:
                             challenge.status === 'active'
                               ? 'linear-gradient(135deg, #22c55e 0%, #86efac 55%, #47c7ea 130%)'
                             : challenge.status === 'upcoming'
                               ? 'linear-gradient(135deg, #ff9b28 0%, #ffd48a 55%, #f65887 130%)'
                               : 'linear-gradient(135deg, #9590b8 0%, #d4ccff 55%, #b8b2e0 130%)',
                         }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        {locked ? (
                          <div className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md"
                               style={{ background: 'rgba(0,0,0,.45)' }}>
                            <Lock className="w-6 h-6 text-white" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md transition-transform group-hover:scale-110"
                               style={{ background: 'rgba(255,255,255,.25)' }}>
                            <Zap className="w-6 h-6 text-white" fill="#fff" />
                          </div>
                        )}
                      </div>

                      {/* Status badge */}
                      <span className="absolute top-3 right-3 text-[11px] font-bold px-2 py-1 rounded-md shadow-md"
                            style={{ background: status.bg, color: status.color }}>
                        {isAr ? status.labelAr : status.label}
                      </span>

                      {/* Difficulty pill */}
                      <span className="absolute bottom-3 left-3 text-[10.5px] font-semibold px-2 py-1 rounded-full shadow-md"
                            style={{ background: 'rgba(255,255,255,.95)', color: diff.color }}>
                        {isAr ? diff.labelAr : diff.label}
                      </span>

                      {/* Joined ribbon */}
                      {challenge.joined && !locked && (
                        <span className="absolute top-3 left-3 text-[11px] font-semibold px-2 py-1 rounded-md text-white shadow-md"
                              style={{ background: 'rgba(0,0,0,.55)' }}>
                          ✓ {isAr ? 'مشارك' : 'Joined'}
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="p-3.5 flex-1 flex flex-col gap-2">
                      <h3 className="text-[14px] font-bold line-clamp-2 leading-snug"
                          style={{ color: '#1a1730' }}>
                        {isAr ? challenge.titleAr : challenge.title}
                      </h3>
                      <p className="text-[12px] line-clamp-2" style={{ color: '#9590b8' }}>
                        {isAr ? challenge.descriptionAr : challenge.description}
                      </p>

                      {/* Meta chips */}
                      <div className="flex flex-wrap gap-1.5 mt-auto">
                        <ChipStat icon={<Calendar className="w-3 h-3" />} value={challenge.duration} />
                        <ChipStat icon={<Users className="w-3 h-3" />} value={`${challenge.participantsCount}`} />
                        {challenge.reward && (
                          <ChipStat icon={<Trophy className="w-3 h-3" iconColor="#f59e0b" />} value={isAr ? 'جائزة' : 'Reward'} />
                        )}
                      </div>

                      {/* Progress if joined */}
                      {challenge.joined && challenge.progress !== undefined && (
                        <div className="mt-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px]" style={{ color: '#9590b8' }}>
                              {isAr ? 'التقدم' : 'Progress'}
                            </span>
                            <span className="text-[10px] font-semibold" style={{ color: '#8e78fb' }}>
                              {challenge.progress}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#ede9ff' }}>
                            <div className="h-full rounded-full"
                                 style={{ width: `${challenge.progress}%`, background: '#8e78fb' }} />
                          </div>
                        </div>
                      )}

                      {/* CTA */}
                      {locked ? (
                        <div className="w-full mt-2 py-2 text-[12px] font-semibold rounded-lg text-center flex items-center justify-center gap-1.5"
                             style={{ background: '#f3f4f6', color: '#9590b8' }}>
                          <Lock className="w-3 h-3" /> {isAr ? 'مغلق' : 'Locked'}
                        </div>
                      ) : (
                        <div className="w-full mt-2 py-2 text-[12px] font-semibold rounded-lg text-white text-center flex items-center justify-center gap-1.5 transition-opacity group-hover:opacity-90"
                             style={{ background: challenge.status === 'active' ? '#22c55e' : '#ff9b28' }}>
                          {challenge.status === 'active'
                            ? (challenge.joined
                                ? (<><Play className="w-3 h-3" fill="#fff" /> {isAr ? 'تابع' : 'Continue'}</>)
                                : (<><Zap className="w-3 h-3" /> {isAr ? 'انضم الآن' : 'Join now'}</>))
                            : (<><Clock className="w-3 h-3" /> {isAr ? 'قريباً' : 'Coming soon'}</>)}
                        </div>
                      )}
                    </div>
                  </CardWrap>
                )
              })}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}

function ChipStat({ icon, value, iconColor }:
  { icon: React.ReactNode; value: string; iconColor?: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-medium"
          style={{ background: 'rgba(142,120,251,0.1)', color: '#8e78fb' }}>
      <span style={{ color: iconColor || '#8e78fb' }}>{icon}</span>
      {value}
    </span>
  )
}
