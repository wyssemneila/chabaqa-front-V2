import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { Zap, Calendar, Users, Clock } from 'lucide-react'
import { getCommunity, LEVEL_CONFIG } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

const STATUS_CONFIG = {
  upcoming: { label: 'Upcoming', labelAr: 'قادم',  color: '#f59e0b', bg: '#fef3c7' },
  active:   { label: 'Active',   labelAr: 'نشط',   color: '#10b981', bg: '#d1fae5' },
  ended:    { label: 'Ended',    labelAr: 'منتهي', color: '#9ca3af', bg: '#f3f4f6' },
}

export default async function ChallengesPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-extrabold" style={{ color: 'var(--t1)' }}>{isAr ? 'التحديات' : 'Challenges'}</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>{isAr ? 'تحدَّ نفسك وطوّر مهاراتك' : 'Challenge yourself and grow your skills'}</p>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {[
          { value: community.challenges.length, label: isAr ? 'تحدي' : 'Total', color: 'var(--p)' },
          { value: community.challenges.filter(c => c.status === 'active').length, label: isAr ? 'نشط' : 'Active', color: '#10b981' },
          { value: community.challenges.filter(c => c.status === 'upcoming').length, label: isAr ? 'قادم' : 'Upcoming', color: '#f59e0b' },
          { value: community.challenges.reduce((a, c) => a + c.participantsCount, 0), label: isAr ? 'مشارك' : 'Participants', color: 'var(--orange)' },
        ].map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5 px-4 py-3 rounded-2xl flex-shrink-0" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
            <span className="text-lg font-extrabold" style={{ color: s.color }}>{s.value}</span>
            <span className="text-[10px]" style={{ color: 'var(--t3)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {community.challenges.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
          <Zap className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--p3)' }} strokeWidth={1.5} />
          <p className="text-sm font-semibold" style={{ color: 'var(--t2)' }}>{isAr ? 'لا توجد تحديات بعد' : 'No challenges yet'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {community.challenges.map(challenge => {
            const status = STATUS_CONFIG[challenge.status]
            const level = LEVEL_CONFIG[challenge.difficulty]
            return (
              <article key={challenge.id} className="group rounded-2xl p-5 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(142,120,251,.12)] cursor-pointer" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--p2)' }}>
                    <Zap className="w-5 h-5" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: status.bg, color: status.color }}>{isAr ? status.labelAr : status.label}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: level.bg, color: level.color }}>{isAr ? level.labelAr : level.label}</span>
                    </div>
                    <h3 className="text-sm font-bold mb-1 group-hover:text-[var(--p)] transition-colors" style={{ color: 'var(--t1)' }}>{isAr ? challenge.titleAr : challenge.title}</h3>
                    <p className="text-xs leading-relaxed line-clamp-2 mb-3" style={{ color: 'var(--t2)' }}>{isAr ? challenge.descriptionAr : challenge.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-[11px]" style={{ color: 'var(--t3)' }}>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" strokeWidth={1.7} />{challenge.duration}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" strokeWidth={1.7} />{challenge.participantsCount} {isAr ? 'مشارك' : 'participants'}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" strokeWidth={1.7} />{challenge.startDate}</span>
                    </div>
                    {challenge.progress !== undefined && challenge.status === 'active' && (
                      <div className="mt-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px]" style={{ color: 'var(--t3)' }}>{isAr ? 'تقدمك' : 'Your progress'}</span>
                          <span className="text-[10px] font-bold" style={{ color: 'var(--p)' }}>{challenge.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--bg)' }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${challenge.progress}%`, background: 'var(--p)' }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <button className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80 self-start" style={{ background: 'var(--p)', color: '#fff' }}>
                    {challenge.status === 'active' ? (isAr ? 'تابع' : 'Continue') : (isAr ? 'انضم' : 'Join')}
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
