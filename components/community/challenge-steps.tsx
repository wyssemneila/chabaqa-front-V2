'use client'

import Link from 'next/link'
import { CheckCircle2, Circle, ChevronRight, Lock } from 'lucide-react'

interface Step {
  order: number
  title: string
  description: string
  done: boolean
}

interface Props {
  slug: string
  challengeId: string
  steps: Step[]
  locked?: boolean
  isAr: boolean
  currentIndex?: number
}

export default function ChallengeSteps({ slug, challengeId, steps, locked, isAr, currentIndex }: Props) {
  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const isCurrent = currentIndex === i
        const StatusIcon = step.done ? CheckCircle2 : locked ? Lock : Circle
        const iconColor = step.done ? '#22c55e' : locked ? '#9590b8' : '#c4b8fd'

        const Wrap: any = locked ? 'div' : Link
        const wrapProps: any = locked
          ? {}
          : { href: `/communities/${slug}/challenges/${challengeId}/steps/${i}` }

        return (
          <Wrap key={step.order} {...wrapProps}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${locked ? 'opacity-70 cursor-not-allowed' : 'hover:border-[#22c55e] cursor-pointer'}`}
                style={{
                  borderColor: isCurrent ? '#22c55e' : '#e8e4ff',
                  background: isCurrent ? '#dcfce7' : step.done ? '#f0fdf4' : '#fff',
                }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 relative"
                 style={{
                   background: step.done ? '#22c55e' : locked ? '#f3f4f6' : '#ede9ff',
                   color: step.done ? '#fff' : iconColor,
                 }}>
              {step.done ? <CheckCircle2 className="w-4 h-4" /> : locked ? <Lock className="w-3.5 h-3.5" /> : <span className="text-[12px] font-bold">{step.order}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold" style={{ color: '#1a1730' }}>
                {step.title}
              </p>
              <p className="text-[12px] mt-0.5 line-clamp-2" style={{ color: '#9590b8' }}>
                {step.description || (isAr ? 'لا يوجد وصف' : 'No description')}
              </p>
            </div>
            {!locked && (
              <ChevronRight className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: '#9590b8' }} />
            )}
          </Wrap>
        )
      })}
    </div>
  )
}
