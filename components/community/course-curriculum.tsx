'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, PlayCircle, CheckCircle2, Lock, Eye } from 'lucide-react'
import type { CourseSection } from '@/lib/community-data'

interface Props {
  slug: string
  courseId: string
  sections: CourseSection[]
  isAr: boolean
  currentChapterId?: string
  compact?: boolean
}

export default function CourseCurriculum({ slug, courseId, sections, isAr, currentChapterId, compact }: Props) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    sections.forEach((s, i) => { initial[s.id] = i === 0 || s.chapters.some((c) => c.id === currentChapterId) })
    return initial
  })

  const toggle = (id: string) => setOpenSections((p) => ({ ...p, [id]: !p[id] }))

  return (
    <div className="space-y-1.5">
      {sections.map((s, sIdx) => {
        const open = openSections[s.id]
        const doneCount = s.chapters.filter((c) => c.done).length
        return (
          <div key={s.id} className="rounded-xl overflow-hidden border" style={{ borderColor: '#e8e4ff' }}>
            <button onClick={() => toggle(s.id)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-[#fafafd]">
              {open
                ? <ChevronDown className="w-3.5 h-3.5" style={{ color: '#9590b8' }} />
                : <ChevronRight className="w-3.5 h-3.5" style={{ color: '#9590b8' }} />}
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold truncate" style={{ color: '#1a1730' }}>
                  {isAr && s.titleAr ? s.titleAr : s.title}
                </p>
                <p className="text-[10.5px] mt-0.5" style={{ color: '#9590b8' }}>
                  {doneCount}/{s.chapters.length} {isAr ? 'مكتملة' : 'complete'}
                </p>
              </div>
            </button>

            {open && (
              <div className="border-t" style={{ borderColor: '#eceaf4' }}>
                {s.chapters.map((c, cIdx) => {
                  const isCurrent = currentChapterId === c.id
                  const StatusIcon = c.done ? CheckCircle2 : c.isPaid ? Lock : PlayCircle
                  const statusColor = c.done ? '#22c55e' : c.isPaid ? '#9590b8' : '#8e78fb'
                  return (
                    <Link key={c.id}
                          href={`/communities/${slug}/courses/${courseId}/lessons/${c.id}`}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-[12.5px] transition-colors"
                          style={{
                            background: isCurrent ? '#ede9ff' : 'transparent',
                            borderInlineStart: isCurrent ? '3px solid #8e78fb' : '3px solid transparent',
                          }}>
                      <StatusIcon className="w-4 h-4 flex-shrink-0" style={{ color: statusColor }} strokeWidth={2} />
                      <span className="flex-1 min-w-0 truncate" style={{ color: isCurrent ? '#8e78fb' : '#46426a', fontWeight: isCurrent ? 600 : 400 }}>
                        {isAr && c.titleAr ? c.titleAr : c.title}
                      </span>
                      {c.isPreview && (
                        <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1"
                              style={{ background: '#d1fae5', color: '#10b981' }}>
                          <Eye className="w-2.5 h-2.5" /> {isAr ? 'معاينة' : 'Preview'}
                        </span>
                      )}
                      <span className="text-[10.5px] flex-shrink-0" style={{ color: '#9590b8' }}>{c.duration}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
