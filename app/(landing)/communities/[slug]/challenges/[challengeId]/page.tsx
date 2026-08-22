import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { getCommunity, LEVEL_CONFIG } from '@/lib/community-data'
import ChallengeSteps from '@/components/community/challenge-steps'
import {
  ArrowLeft, Users, Calendar, Trophy, Info, ListChecks, Zap, Clock,
} from 'lucide-react'

interface Props { params: Promise<{ slug: string; challengeId: string }> }

const STATUS_CONFIG = {
  active:   { label: 'Active',   labelAr: 'نشط',    bg: '#dcfce7', color: '#16a34a' },
  upcoming: { label: 'Upcoming', labelAr: 'قادم',    bg: '#fff3e4', color: '#ff9b28' },
  ended:    { label: 'Ended',    labelAr: 'انتهى',   bg: '#f3f4f6', color: '#9590b8' },
} as const

export default async function ChallengeDetailPage({ params }: Props) {
  const { slug, challengeId } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const challenge = community.challenges.find((c) => c.id === challengeId)
  if (!challenge) notFound()
  const isAr = locale === 'ar'

  const diff = LEVEL_CONFIG[challenge.difficulty]
  const status = STATUS_CONFIG[challenge.status]
  const title = isAr ? challenge.titleAr : challenge.title
  const description = isAr ? challenge.descriptionAr : challenge.description
  const reward = isAr && challenge.rewardAr ? challenge.rewardAr : challenge.reward

  const steps = challenge.steps || []
  const doneCount = steps.filter((s) => s.done).length
  const progressPct = steps.length ? Math.round((doneCount / steps.length) * 100) : (challenge.progress || 0)

  const firstUndone = steps.find((s) => !s.done)
  const nextStepIndex = firstUndone ? firstUndone.order - 1 : 0

  return (
    <div className="w-full" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Back */}
      <Link href={`/communities/${slug}/challenges`}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-4 transition-colors hover:text-[#8e78fb]"
            style={{ color: '#46426a' }}>
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
        {isAr ? 'العودة للتحديات' : 'Back to challenges'}
      </Link>

      {/* Header */}
      <div className="rounded-2xl border p-5 mb-4" style={{ borderColor: '#e8e4ff', background: '#fff' }}>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold"
                    style={{ background: status.bg, color: status.color }}>
                {isAr ? status.labelAr : status.label}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold"
                    style={{ background: diff.bg, color: diff.color }}>
                {isAr ? diff.labelAr : diff.label}
              </span>
              <span className="text-[11px]" style={{ color: '#9590b8' }}>
                {challenge.startDate}{challenge.endDate ? ` → ${challenge.endDate}` : ''}
              </span>
            </div>
            <h1 className="text-[22px] font-bold leading-tight" style={{ color: '#1a1730' }}>{title}</h1>
            <p className="text-[13px] mt-1 leading-relaxed" style={{ color: '#46426a' }}>{description}</p>
          </div>

          {/* CTA */}
          {challenge.status === 'active' && steps[nextStepIndex] && (
            <Link href={`/communities/${slug}/challenges/${challenge.id}/steps/${nextStepIndex}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white shrink-0 transition-opacity hover:opacity-90"
                  style={{ background: '#22c55e' }}>
              <Zap className="w-4 h-4" fill="#fff" />
              {challenge.joined
                ? (progressPct > 0 ? (isAr ? 'تابع' : 'Continue') : (isAr ? 'ابدأ الآن' : 'Start now'))
                : (isAr ? 'انضم للتحدي' : 'Join challenge')}
            </Link>
          )}
          {challenge.status === 'upcoming' && (
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold shrink-0"
                  style={{ background: '#fff3e4', color: '#ff9b28' }}>
              <Clock className="w-4 h-4" /> {isAr ? 'قريباً' : 'Starts soon'}
            </span>
          )}
        </div>

        {/* Progress */}
        {challenge.joined && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11.5px] font-medium" style={{ color: '#46426a' }}>
                {isAr ? 'تقدمك' : 'Your progress'}
              </span>
              <span className="text-[11.5px] font-semibold" style={{ color: '#22c55e' }}>
                {doneCount}/{steps.length} · {progressPct}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#dcfce7' }}>
              <div className="h-full rounded-full transition-all"
                   style={{ width: `${progressPct}%`, background: '#22c55e' }} />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-4 flex flex-wrap gap-2">
          <StatChip icon={<Calendar className="w-3 h-3" />} value={challenge.duration} />
          <StatChip icon={<Users className="w-3 h-3" />} value={`${challenge.participantsCount}`} label={isAr ? 'مشارك' : 'joined'} />
          <StatChip icon={<ListChecks className="w-3 h-3" />} value={`${steps.length}`} label={isAr ? 'خطوات' : 'steps'} />
        </div>
      </div>

      {/* Two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* MAIN — Steps */}
        <div className="rounded-2xl p-5 shadow-lg relative overflow-hidden"
             style={{ background: '#fff', border: '2px solid #22c55e' }}>
          <div className="absolute -right-16 -top-16 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
               style={{ background: '#22c55e' }} />
          <div className="flex items-center gap-2 mb-5 relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                 style={{ background: '#22c55e' }}>
              <ListChecks className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-[17px] font-bold leading-tight" style={{ color: '#1a1730' }}>
                {isAr ? 'خطوات التحدي' : 'Challenge steps'}
              </h2>
              <p className="text-[11.5px]" style={{ color: '#9590b8' }}>
                {steps.length} {isAr ? 'خطوات' : 'steps'} · {challenge.duration}
              </p>
            </div>
          </div>

          <ChallengeSteps
            slug={slug}
            challengeId={challenge.id}
            steps={steps.map((s) => ({
              order: s.order,
              title: isAr && s.titleAr ? s.titleAr : s.title,
              description: isAr && s.descriptionAr ? s.descriptionAr : s.description,
              done: !!s.done,
            }))}
            locked={challenge.status === 'upcoming'}
            isAr={isAr} />
        </div>

        {/* SIDEBAR */}
        <div className="space-y-3 lg:sticky lg:top-4 lg:self-start">
          <MutedCard title={isAr ? 'حول التحدي' : 'About'} icon={<Info className="w-3.5 h-3.5" />}>
            <p className="text-[12px] leading-relaxed" style={{ color: '#6b6885' }}>{description}</p>
          </MutedCard>

          {reward && (
            <MutedCard title={isAr ? 'الجائزة' : 'Reward'} icon={<Trophy className="w-3.5 h-3.5" />}>
              <p className="text-[12px]" style={{ color: '#6b6885' }}>{reward}</p>
            </MutedCard>
          )}

          <MutedCard title={isAr ? 'الجدول الزمني' : 'Timeline'} icon={<Calendar className="w-3.5 h-3.5" />}>
            <p className="text-[12px]" style={{ color: '#6b6885' }}>
              <span className="font-semibold" style={{ color: '#46426a' }}>{isAr ? 'يبدأ:' : 'Starts:'}</span> {challenge.startDate}
            </p>
            {challenge.endDate && (
              <p className="text-[12px] mt-1" style={{ color: '#6b6885' }}>
                <span className="font-semibold" style={{ color: '#46426a' }}>{isAr ? 'ينتهي:' : 'Ends:'}</span> {challenge.endDate}
              </p>
            )}
          </MutedCard>
        </div>
      </div>
    </div>
  )
}

function StatChip({ icon, value, label, iconColor }:
  { icon: React.ReactNode; value: string | number; label?: string; iconColor?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-medium"
          style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a' }}>
      <span style={{ color: iconColor || '#16a34a' }}>{icon}</span>
      <span className="font-bold">{value}</span>
      {label && <span className="opacity-75">{label}</span>}
    </span>
  )
}

function MutedCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-3" style={{ background: '#f6f5fb' }}>
      <div className="flex items-center gap-1.5 mb-2">
        <span style={{ color: '#9590b8' }}>{icon}</span>
        <h3 className="text-[11.5px] font-bold uppercase tracking-wider" style={{ color: '#9590b8' }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}
