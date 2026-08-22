'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Play, CheckCircle2, Circle, ChevronLeft, ChevronRight, MessageSquare,
  Paperclip, FileText, Package, Link2, ImageIcon, Download, Send, Shield,
} from 'lucide-react'
import CourseCurriculum from './course-curriculum'
import type { CourseSection } from '@/lib/community-data'

interface Resource {
  id: string
  title: string
  type: 'pdf' | 'zip' | 'link' | 'image'
  url: string
  sizeLabel?: string
}

interface CurrentLesson {
  id: string
  title: string
  duration: string
  videoUrl: string
  sectionTitle: string
  resources: Resource[]
  done: boolean
}

interface Props {
  slug: string
  courseId: string
  sections: CourseSection[]
  current: CurrentLesson
  prevId?: string
  nextId?: string
  isAr: boolean
}

interface Comment {
  id: string
  author: string
  initials: string
  color: string
  isInstructor?: boolean
  text: string
  timeAgo: string
}

const DEMO_COMMENTS: Comment[] = [
  { id: '1', author: 'Ahmed Ben Ali', initials: 'AB', color: '#8e78fb', text: 'Great intro! Do you recommend AE 2024 or 2025 for beginners?', timeAgo: '2h ago' },
  { id: '2', author: 'Mohamed Trabelsi', initials: 'MT', color: '#f65887', isInstructor: true, text: 'Either is fine — 2024 has slightly better plugin support today, but 2025 is faster. Both do everything we cover in the course.', timeAgo: '1h ago' },
]

const RESOURCE_ICON: Record<Resource['type'], any> = {
  pdf: FileText, zip: Package, link: Link2, image: ImageIcon,
}

export default function LessonViewer({ slug, courseId, sections, current, prevId, nextId, isAr }: Props) {
  const [tab, setTab] = useState<'comments' | 'resources'>('comments')
  const [done, setDone] = useState(current.done)
  const [comments, setComments] = useState<Comment[]>(DEMO_COMMENTS)
  const [draft, setDraft] = useState('')

  const totalChapters = useMemo(() => sections.reduce((n, s) => n + s.chapters.length, 0), [sections])
  const doneChapters = useMemo(() => sections.reduce((n, s) => n + s.chapters.filter((c) => c.done).length, 0), [sections])

  const postComment = () => {
    if (!draft.trim()) return
    setComments([{ id: String(Date.now()), author: 'You', initials: 'YO', color: '#47c7ea', text: draft, timeAgo: 'now' }, ...comments])
    setDraft('')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
      {/* ── LEFT — video + tabs ── */}
      <div className="space-y-4 min-w-0">
        {/* Video */}
        <div className="rounded-2xl overflow-hidden relative"
             style={{ aspectRatio: '16 / 9', background: 'linear-gradient(135deg, #1a1730 0%, #3d3570 100%)' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <button className="w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-md transition-transform hover:scale-105"
                    style={{ background: 'rgba(255,255,255,.25)' }}>
              <Play className="w-6 h-6 text-white ml-0.5" fill="#fff" />
            </button>
          </div>
          <div className="absolute bottom-3 left-4 text-white text-[11px] opacity-80">
            {current.duration}
          </div>
        </div>

        {/* Lesson header + actions */}
        <div className="rounded-2xl border p-4" style={{ borderColor: '#e8e4ff', background: '#fff' }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#9590b8' }}>
            {current.sectionTitle}
          </p>
          <h1 className="text-[18px] font-bold" style={{ color: '#1a1730' }}>{current.title}</h1>

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            {prevId ? (
              <Link href={`/communities/${slug}/courses/${courseId}/lessons/${prevId}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold"
                    style={{ background: '#f6f5fb', color: '#46426a', border: '1px solid #eceaf4' }}>
                <ChevronLeft className="w-3.5 h-3.5" />
                {isAr ? 'السابق' : 'Previous'}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold opacity-40"
                    style={{ background: '#f6f5fb', color: '#46426a', border: '1px solid #eceaf4' }}>
                <ChevronLeft className="w-3.5 h-3.5" />
                {isAr ? 'السابق' : 'Previous'}
              </span>
            )}

            <button onClick={() => setDone(!done)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold transition-colors"
                    style={{
                      background: done ? '#dcfce7' : '#fff',
                      color: done ? '#16a34a' : '#46426a',
                      border: `1px solid ${done ? '#86efac' : '#eceaf4'}`,
                    }}>
              {done
                ? <><CheckCircle2 className="w-3.5 h-3.5" /> {isAr ? 'مكتمل' : 'Completed'}</>
                : <><Circle className="w-3.5 h-3.5" /> {isAr ? 'وضع علامة اكتمال' : 'Mark as complete'}</>}
            </button>

            <div className="flex-1" />

            {nextId ? (
              <Link href={`/communities/${slug}/courses/${courseId}/lessons/${nextId}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold text-white"
                    style={{ background: '#8e78fb' }}>
                {isAr ? 'إكمال ومتابعة' : 'Complete & continue'}
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold text-white opacity-60"
                    style={{ background: '#8e78fb' }}>
                {isAr ? 'انتهت الدورة' : 'End of course'}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#e8e4ff', background: '#fff' }}>
          <div className="flex border-b" style={{ borderColor: '#e8e4ff' }}>
            <TabButton active={tab === 'comments'} onClick={() => setTab('comments')}
                       icon={<MessageSquare className="w-3.5 h-3.5" />}
                       label={isAr ? 'التعليقات' : 'Comments'} count={comments.length} />
            <TabButton active={tab === 'resources'} onClick={() => setTab('resources')}
                       icon={<Paperclip className="w-3.5 h-3.5" />}
                       label={isAr ? 'الموارد' : 'Resources'} count={current.resources.length} />
          </div>

          {tab === 'comments' && (
            <div className="p-4">
              {/* Composer */}
              <div className="flex items-start gap-2 mb-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
                     style={{ background: '#47c7ea' }}>YO</div>
                <div className="flex-1">
                  <textarea value={draft} onChange={(e) => setDraft(e.target.value)}
                            placeholder={isAr ? 'اسأل المدرس أو المجتمع…' : 'Ask the instructor or community…'}
                            rows={2}
                            className="w-full px-3 py-2 rounded-xl text-[13px] outline-none resize-none border"
                            style={{ background: '#fafafd', borderColor: '#e8e4ff', color: '#1a1730' }} />
                  <div className="flex justify-end mt-2">
                    <button onClick={postComment} disabled={!draft.trim()}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white disabled:opacity-40"
                            style={{ background: '#8e78fb' }}>
                      <Send className="w-3 h-3" /> {isAr ? 'نشر' : 'Post'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Comment list */}
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
                         style={{ background: c.color }}>{c.initials}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[13px] font-semibold" style={{ color: '#1a1730' }}>{c.author}</span>
                        {c.isInstructor && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold"
                                style={{ background: '#ffe4ee', color: '#f65887' }}>
                            <Shield className="w-2.5 h-2.5" /> {isAr ? 'المدرس' : 'Instructor'}
                          </span>
                        )}
                        <span className="text-[11px]" style={{ color: '#9590b8' }}>· {c.timeAgo}</span>
                      </div>
                      <p className="text-[13px] leading-relaxed" style={{ color: '#46426a' }}>{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'resources' && (
            <div className="p-4">
              {current.resources.length === 0 ? (
                <p className="text-[13px] text-center py-6" style={{ color: '#9590b8' }}>
                  {isAr ? 'لا توجد موارد لهذا الدرس.' : 'No resources for this lesson.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {current.resources.map((r) => {
                    const Icon = RESOURCE_ICON[r.type]
                    return (
                      <a key={r.id} href={r.url}
                         className="flex items-center gap-3 p-3 rounded-xl border transition-colors hover:border-[#8e78fb]"
                         style={{ borderColor: '#e8e4ff', background: '#fff' }}>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                             style={{ background: '#ede9ff', color: '#8e78fb' }}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold truncate" style={{ color: '#1a1730' }}>{r.title}</p>
                          {r.sizeLabel && <p className="text-[11px]" style={{ color: '#9590b8' }}>{r.sizeLabel}</p>}
                        </div>
                        <Download className="w-4 h-4 flex-shrink-0" style={{ color: '#9590b8' }} />
                      </a>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT — chapter sidebar ── */}
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <div className="rounded-2xl border" style={{ borderColor: '#e8e4ff', background: '#fff' }}>
          <div className="p-3 border-b" style={{ borderColor: '#e8e4ff' }}>
            <p className="text-[12px] font-semibold" style={{ color: '#1a1730' }}>
              {isAr ? 'محتوى الدورة' : 'Course content'}
            </p>
            <p className="text-[11px]" style={{ color: '#9590b8' }}>
              {doneChapters}/{totalChapters} {isAr ? 'مكتملة' : 'complete'}
            </p>
            <div className="w-full h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: '#ede9ff' }}>
              <div className="h-full rounded-full"
                   style={{ width: `${totalChapters ? (doneChapters / totalChapters) * 100 : 0}%`, background: '#8e78fb' }} />
            </div>
          </div>
          <div className="p-2 max-h-[70vh] overflow-y-auto">
            <CourseCurriculum
              slug={slug}
              courseId={courseId}
              sections={sections}
              isAr={isAr}
              currentChapterId={current.id}
              compact />
          </div>
        </div>
      </aside>
    </div>
  )
}

function TabButton({ active, onClick, icon, label, count }:
  { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count: number }) {
  return (
    <button onClick={onClick}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 text-[13px] font-semibold transition-colors relative"
            style={{ color: active ? '#8e78fb' : '#9590b8' }}>
      {icon} {label}
      <span className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: active ? '#ede9ff' : '#f6f5fb', color: active ? '#8e78fb' : '#9590b8' }}>
        {count}
      </span>
      {active && (
        <span className="absolute left-0 right-0 bottom-0 h-[2px] rounded-t"
              style={{ background: '#8e78fb' }} />
      )}
    </button>
  )
}
