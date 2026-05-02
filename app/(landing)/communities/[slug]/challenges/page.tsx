import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { Zap, Calendar, Users, Clock, Trophy, Target } from 'lucide-react'
import { getCommunity, LEVEL_CONFIG } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

const STATUS_CONFIG = {
  upcoming: { label: 'Upcoming', labelAr: 'قادم',  color: '#f59e0b', bg: '#fef3c7', dot: '#f59e0b' },
  active:   { label: 'Active',   labelAr: 'جارٍ',  color: '#10b981', bg: '#d1fae5', dot: '#10b981' },
  ended:    { label: 'Ended',    labelAr: 'منتهٍ', color: '#9ca3af', bg: '#f3f4f6', dot: '#9ca3af' },
}

export default async function ChallengesPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  const activeChallenge = community.challenges.find(c => c.status === 'active')

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--t1)' }}>
          {isAr ? 'التحديات' : 'Challenges'}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>
          {isAr ? 'تحدَّ نفسك وطوّر مهاراتك مع التحديات' : 'Push your limits and grow your skills'}
        </p>
      </div>

      {/* Active challenge spotlight */}
      {activeChallenge && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--p) 0%, #a78bfa 100%)', boxShadow: '0 12px 40px rgba(142,120,251,.35)' }}>
          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,.2)', backdropFilter: 'blur(10px)' }}>
              <Zap className="w-7 h-7 text-white" strokeWidth={1.7} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,.25)', color: '#fff' }}>
                  {isAr ? '🔴 جارٍ الآن' : '🔴 Live Now'}
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-white leading-tight mb-1">
                {isAr ? activeChallenge.titleAr : activeChallenge.title}
              </h2>
              <p className="text-xs text-white/70 mb-3 line-clamp-1">
                {isAr ? activeChallenge.descriptionAr : activeChallenge.description}
              </p>
              {activeChallenge.progress !== undefined && (
                <>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-white/70">{isAr ? 'تقدمك' : 'Your progress'}</span>
                    <span className="text-[10px] font-black text-white">{activeChallenge.progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,.25)' }}>
                    <div className="h-2 rounded-full" style={{ width: `${activeChallenge.progress}%`, background: '#fff' }} />
                  </div>
                </>
              )}
            </div>
            <button className="flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
              style={{ background: '#fff', color: 'var(--p)' }}>
              {isAr ? 'تابع التحدي' : 'Continue'}
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { value: community.challenges.length, label: isAr ? 'تحدي' : 'Total', color: 'var(--p)', bg: 'var(--p2)', icon: <Target className="w-4 h-4" strokeWidth={1.7} /> },
          { value: community.challenges.filter(c => c.status === 'active').length, label: isAr ? 'نشط' : 'Active', color: '#10b981', bg: '#d1fae5', icon: <Zap className="w-4 h-4" strokeWidth={1.7} /> },
          { value: community.challenges.filter(c => c.status === 'upcoming').length, label: isAr ? 'قادم' : 'Upcoming', color: '#f59e0b', bg: '#fef3c7', icon: <Calendar className="w-4 h-4" strokeWidth={1.7} /> },
          { value: community.challenges.reduce((a, c) => a + c.participantsCount, 0), label: isAr ? 'مشارك' : 'Participants', color: 'var(--orange, #ff9b28)', bg: '#fff4e5', icon: <Users className="w-4 h-4" strokeWidth={1.7} /> },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <p className="text-lg font-extrabold leading-none" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--t3)' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Challenge list */}
      {community.challenges.length === 0 ? (
        <div className="rounded-2xl p-14 text-center" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--p2)' }}>
            <Zap className="w-8 h-8" style={{ color: 'var(--p)' }} strokeWidth={1.3} />
          </div>
          <p className="text-base font-bold mb-1" style={{ color: 'var(--t1)' }}>
            {isAr ? 'لا توجد تحديات بعد' : 'No challenges yet'}
          </p>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>
            {isAr ? 'ترقبوا قريباً' : 'Coming soon'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {community.challenges.map(challenge => {
            const status = STATUS_CONFIG[challenge.status]
            const lvl = LEVEL_CONFIG[challenge.difficulty]
            return (
              <article key={challenge.id}
                className="group rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_8px_32px_rgba(142,120,251,.12)]"
                style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                <div className="p-5 flex items-start gap-4">

                  {/* Icon */}
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110" style={{ background: 'var(--p2)' }}>
                    <Zap className="w-5 h-5" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: status.bg, color: status.color }}>
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: status.dot }} />
                        {isAr ? status.labelAr : status.label}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: lvl.bg, color: lvl.color }}>
                        {isAr ? lvl.labelAr : lvl.label}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold mb-1 group-hover:text-[var(--p)] transition-colors" style={{ color: 'var(--t1)' }}>
                      {isAr ? challenge.titleAr : challenge.title}
                    </h3>
                    <p className="text-xs leading-relaxed line-clamp-2 mb-3" style={{ color: 'var(--t2)' }}>
                      {isAr ? challenge.descriptionAr : challenge.description}
                    </p>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-[11px]" style={{ color: 'var(--t3)' }}>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" strokeWidth={1.7} />{challenge.duration}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" strokeWidth={1.7} />{challenge.participantsCount} {isAr ? 'مشارك' : 'participants'}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" strokeWidth={1.7} />{challenge.startDate}</span>
                    </div>

                    {/* Progress */}
                    {challenge.status === 'active' && challenge.progress !== undefined && (
                      <div className="mt-3">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px]" style={{ color: 'var(--t3)' }}>{isAr ? 'تقدمك' : 'Your progress'}</span>
                          <span className="text-[10px] font-black" style={{ color: 'var(--p)' }}>{challenge.progress}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
                          <div className="h-2 rounded-full" style={{ width: `${challenge.progress}%`, background: 'linear-gradient(90deg, var(--p), #a78bfa)' }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <button className="flex-shrink-0 self-start px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-95"
                    style={challenge.status === 'ended'
                      ? { background: 'var(--bg)', color: 'var(--t3)', border: '1px solid var(--bd)' }
                      : { background: 'var(--p)', color: '#fff' }
                    }>
                    {challenge.status === 'active' ? (isAr ? 'تابع' : 'Continue')
                      : challenge.status === 'upcoming' ? (isAr ? 'انضم' : 'Join')
                      : (isAr ? 'منتهٍ' : 'Ended')}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
