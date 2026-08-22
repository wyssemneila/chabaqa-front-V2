'use client'

import Link from 'next/link'
import { CheckCircle2, Lock, Play, Video, FileText, Users2, Zap, ChevronRight } from 'lucide-react'
import type { StepContentType } from '@/lib/community-data'

interface Step {
  order: number
  title: string
  description: string
  contentType: StepContentType
  points: number
  done: boolean
  resourceCount?: number
  meetTime?: string
}

interface Props {
  slug: string
  challengeId: string
  steps: Step[]
  challengeLocked?: boolean  // upcoming challenge — all locked
  isAr: boolean
}

const TYPE_CONFIG: Record<StepContentType, { icon: any; label: string; labelAr: string; color: string; bg: string }> = {
  video: { icon: Video,    label: 'Video',   labelAr: 'فيديو',   color: '#8e78fb', bg: '#ede9ff' },
  meet:  { icon: Users2,   label: 'Meeting', labelAr: 'اجتماع',  color: '#47c7ea', bg: '#e4f8fd' },
  file:  { icon: FileText, label: 'Files',   labelAr: 'ملفات',   color: '#ff9b28', bg: '#fff3e4' },
  text:  { icon: Zap,      label: 'Task',    labelAr: 'مهمة',    color: '#f65887', bg: '#ffe4ee' },
}

export default function ChallengeSteps({ slug, challengeId, steps, challengeLocked, isAr }: Props) {
  // Progressive unlock: only steps up to and including first-not-done are open
  const firstUndoneIdx = steps.findIndex((s) => !s.done)
  const currentUnlockIdx = firstUndoneIdx === -1 ? steps.length - 1 : firstUndoneIdx

  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const cfg = TYPE_CONFIG[step.contentType]
        const Icon = cfg.icon

        const isLocked = challengeLocked || i > currentUnlockIdx
        const isCurrent = !isLocked && i === currentUnlockIdx && !step.done
        const isDone = step.done

        const Wrap: any = isLocked ? 'div' : Link
        const wrapProps: any = isLocked
          ? {}
          : { href: `/communities/${slug}/challenges/${challengeId}/steps/${i}` }

        return (
          <Wrap key={step.order} {...wrapProps}
                className={`group rounded-2xl border p-4 flex gap-4 transition-all ${isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md hover:scale-[1.005] cursor-pointer'}`}
                style={{
                  borderColor: isDone ? '#86efac' : isCurrent ? '#22c55e' : '#e8e4ff',
                  background: isDone ? '#f0fdf4' : isCurrent ? '#dcfce7' : '#fff',
                  borderWidth: isCurrent ? 2 : 1,
                }}>
            {/* Left: number badge + content-type icon */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center relative"
                   style={{
                     background: isDone ? '#22c55e' : isLocked ? '#f3f4f6' : cfg.bg,
                     color: isDone ? '#fff' : isLocked ? '#9590b8' : cfg.color,
                   }}>
                {isDone
                  ? <CheckCircle2 className="w-5 h-5" />
                  : isLocked
                    ? <Lock className="w-4 h-4" />
                    : <span className="text-[13px] font-bold">{step.order}</span>}
              </div>
              <div className="text-[9px] font-semibold uppercase tracking-wider"
                   style={{ color: isLocked ? '#9590b8' : cfg.color }}>
                <Icon className="w-3 h-3 mx-auto" />
              </div>
            </div>

            {/* Middle: title + description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="text-[13.5px] font-bold" style={{ color: '#1a1730' }}>
                  {step.title}
                </p>
                <span className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ background: cfg.bg, color: cfg.color }}>
                  <Icon className="w-2.5 h-2.5" /> {isAr ? cfg.labelAr : cfg.label}
                </span>
              </div>
              <p className="text-[12px] line-clamp-2 leading-relaxed" style={{ color: '#6b6885' }}>
                {step.description}
              </p>
              {step.contentType === 'meet' && step.meetTime && (
                <p className="text-[11px] mt-1.5 font-medium" style={{ color: '#47c7ea' }}>
                  📅 {step.meetTime}
                </p>
              )}
            </div>

            {/* Right: points + chevron */}
            <div className="flex flex-col items-end justify-between flex-shrink-0 gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold"
                    style={{
                      background: isDone ? '#22c55e' : '#fef3c7',
                      color: isDone ? '#fff' : '#d97706',
                    }}>
                <Zap className="w-2.5 h-2.5" fill={isDone ? '#fff' : '#d97706'} />
                {isDone ? '+' : ''}{step.points} {isAr ? 'نقاط' : 'pts'}
              </span>
              {!isLocked && (
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                              style={{ color: isCurrent ? '#22c55e' : '#9590b8' }} />
              )}
            </div>
          </Wrap>
        )
      })}
    </div>
  )
}
