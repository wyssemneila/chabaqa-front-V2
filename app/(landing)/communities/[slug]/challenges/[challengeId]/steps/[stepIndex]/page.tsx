import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getCommunity } from '@/lib/community-data'
import ChallengeStepView from '@/components/community/challenge-step-view'

interface Props { params: Promise<{ slug: string; challengeId: string; stepIndex: string }> }

export default async function ChallengeStepPage({ params }: Props) {
  const { slug, challengeId, stepIndex } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const challenge = community.challenges.find((c) => c.id === challengeId)
  if (!challenge || !challenge.steps) notFound()

  const idx = parseInt(stepIndex, 10)
  const step = challenge.steps[idx]
  if (!step) notFound()

  const isAr = locale === 'ar'
  const total = challenge.steps.length

  return (
    <div className="w-full" dir={isAr ? 'rtl' : 'ltr'}>
      <Link href={`/communities/${slug}/challenges/${challengeId}`}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-3 transition-colors hover:text-[#22c55e]"
            style={{ color: '#46426a' }}>
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
        {isAr && challenge.titleAr ? challenge.titleAr : challenge.title}
      </Link>

      <ChallengeStepView
        slug={slug}
        challengeId={challengeId}
        steps={challenge.steps.map((s) => ({
          order: s.order,
          title: isAr && s.titleAr ? s.titleAr : s.title,
          description: isAr && s.descriptionAr ? s.descriptionAr : s.description,
          done: !!s.done,
        }))}
        currentIndex={idx}
        total={total}
        isAr={isAr}
      />
    </div>
  )
}
