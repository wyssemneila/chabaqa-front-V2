import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { Trophy, Users, Calendar, Flame } from 'lucide-react'
import { getCommunity } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

export default async function ChallengesPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  const activeChallenge = community.challenges.find(c => c.status === 'active')
  const otherChallenges = community.challenges.filter(c => c !== activeChallenge)

  const difficultyLabel = (d: string) => {
    if (isAr) {
      return d === 'beginner' ? 'مبتدئ' : d === 'intermediate' ? 'متوسط' : 'متقدم'
    }
    return d.charAt(0).toUpperCase() + d.slice(1)
  }

  const statusLabel = (s: string) => {
    if (isAr) {
      return s === 'active' ? 'نشط' : s === 'upcoming' ? 'قادم' : 'انتهى'
    }
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {isAr ? 'التحديات' : 'Challenges'}
        </h1>
        <p className="text-[13px] text-gray-500 mt-1">
          {isAr ? `تحديات ${community.nameAr}` : `${community.name} challenges`}
        </p>
      </div>

      {community.challenges.length === 0 ? (
        <div className="rounded-xl border border-gray-100 p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">
            {isAr ? 'لا توجد تحديات بعد' : 'No challenges yet'}
          </p>
          <p className="text-[13px] text-gray-500">
            {isAr ? 'ترقبوا قريباً' : 'Check back soon'}
          </p>
        </div>
      ) : (
        <>
          {/* Featured active challenge */}
          {activeChallenge && (
            <div className="rounded-xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-[#3AAFA9] animate-pulse" />
                <span className="text-[12px] font-medium text-[#3AAFA9]">
                  {isAr ? 'نشط الآن' : 'Active Now'}
                </span>
              </div>

              <h2 className="text-lg font-bold text-gray-900 mb-1">
                {isAr ? activeChallenge.titleAr : activeChallenge.title}
              </h2>
              <p className="text-[13px] text-gray-600 mb-4">
                {isAr ? activeChallenge.descriptionAr : activeChallenge.description}
              </p>

              <div className="flex items-center gap-4 text-[12px] text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {activeChallenge.participantsCount} {isAr ? 'مشارك' : 'participants'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {activeChallenge.duration}
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  {difficultyLabel(activeChallenge.difficulty)}
                </span>
              </div>

              {/* Progress bar */}
              {activeChallenge.progress !== undefined && (
                <div>
                  <div className="flex items-center justify-between text-[12px] text-gray-500 mb-1.5">
                    <span>{isAr ? 'التقدم' : 'Progress'}</span>
                    <span>{activeChallenge.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#3AAFA9]"
                      style={{ width: `${activeChallenge.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {!activeChallenge.progress && (
                <button className="mt-2 text-[13px] font-medium px-4 py-2 rounded-lg bg-[#3AAFA9] text-white">
                  {isAr ? 'انضم للتحدي' : 'Join Challenge'}
                </button>
              )}
            </div>
          )}

          {/* Other challenges */}
          {otherChallenges.length > 0 && (
            <div className="rounded-xl border border-gray-100 divide-y divide-gray-100">
              {otherChallenges.map((challenge) => (
                <div key={challenge.id} className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[14px] font-semibold text-gray-900">
                        {isAr ? challenge.titleAr : challenge.title}
                      </h3>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                        challenge.status === 'upcoming'
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-gray-50 text-gray-400'
                      }`}>
                        {statusLabel(challenge.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[12px] text-gray-500">
                      <span>{difficultyLabel(challenge.difficulty)}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span>{challenge.duration}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span>{challenge.participantsCount} {isAr ? 'مشارك' : 'participants'}</span>
                    </div>
                  </div>
                  <button className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                    {challenge.status === 'upcoming'
                      ? (isAr ? 'تذكير' : 'Remind me')
                      : (isAr ? 'عرض' : 'View')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
