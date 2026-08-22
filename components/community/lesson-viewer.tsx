'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, Circle, ChevronLeft, ChevronRight, MessageSquare,
  Paperclip, FileText, Package, Link2, ImageIcon, Download, Send, Shield, Heart, Reply,
} from 'lucide-react'
import CourseCurriculum from './course-curriculum'
import VideoPlayer from './video-player'
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
  description?: string
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

interface Reply {
  id: string
  author: string
  initials: string
  color: string
  isInstructor?: boolean
  text: string
  timeAgo: string
  likes: number
  liked?: boolean
}

interface Comment extends Reply {
  replies: Reply[]
}

const DEMO_COMMENTS: Comment[] = [
  {
    id: '1', author: 'Ahmed Ben Ali', initials: 'AB', color: '#8e78fb',
    text: 'Great intro! Do you recommend AE 2024 or 2025 for beginners?',
    timeAgo: '2h ago', likes: 3,
    replies: [
      {
        id: '1-1', author: 'Mohamed Trabelsi', initials: 'MT', color: '#f65887',
        isInstructor: true,
        text: 'Either is fine — 2024 has slightly better plugin support today, but 2025 is faster. Both do everything we cover in the course.',
        timeAgo: '1h ago', likes: 8, liked: true,
      },
      {
        id: '1-2', author: 'Sara Chebbi', initials: 'SC', color: '#47c7ea',
        text: 'Second the 2024 vote — smoother for me on an older laptop.',
        timeAgo: '45m ago', likes: 1,
      },
    ],
  },
  {
    id: '2', author: 'Yassine Sdiri', initials: 'YS', color: '#ff9b28',
    text: 'The pace is perfect. Loving the workspace setup tips.',
    timeAgo: '5h ago', likes: 5, liked: true,
    replies: [],
  },
]

const RESOURCE_ICON: Record<Resource['type'], any> = {
  pdf: FileText, zip: Package, link: Link2, image: ImageIcon,
}

export default function LessonViewer({ slug, courseId, sections, current, prevId, nextId, isAr }: Props) {
  const [tab, setTab] = useState<'comments' | 'resources'>('comments')
  const [done, setDone] = useState(current.done)
  const [comments, setComments] = useState<Comment[]>(DEMO_COMMENTS)
  const [draft, setDraft] = useState('')
  const [replyOpen, setReplyOpen] = useState<string | null>(null)
  const [replyDraft, setReplyDraft] = useState('')

  const totalChapters = useMemo(() => sections.reduce((n, s) => n + s.chapters.length, 0), [sections])
  const doneChapters = useMemo(() => sections.reduce((n, s) => n + s.chapters.filter((c) => c.done).length, 0), [sections])

  const postComment = () => {
    if (!draft.trim()) return
    setComments([
      {
        id: String(Date.now()), author: 'You', initials: 'YO', color: '#47c7ea',
        text: draft, timeAgo: 'now', likes: 0, replies: [],
      },
      ...comments,
    ])
    setDraft('')
  }

  const postReply = (commentId: string) => {
    if (!replyDraft.trim()) return
    setComments(comments.map((c) =>
      c.id === commentId
        ? { ...c, replies: [...c.replies, {
            id: String(Date.now()), author: 'You', initials: 'YO', color: '#47c7ea',
            text: replyDraft, timeAgo: 'now', likes: 0,
          }] }
        : c,
    ))
    setReplyDraft('')
    setReplyOpen(null)
  }

  const toggleLike = (commentId: string, replyId?: string) => {
    setComments(comments.map((c) => {
      if (replyId) {
        if (c.id !== commentId) return c
        return {
          ...c,
          replies: c.replies.map((r) =>
            r.id === replyId
              ? { ...r, liked: !r.liked, likes: r.likes + (r.liked ? -1 : 1) }
              : r,
          ),
        }
      }
      if (c.id !== commentId) return c
      return { ...c, liked: !c.liked, likes: c.likes + (c.liked ? -1 : 1) }
    }))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
      {/* ── LEFT — video + tabs ── */}
      <div className="space-y-4 min-w-0">
        {/* Real video player */}
        <VideoPlayer src={current.videoUrl || '/videos/test.mp4'} />

        {/* Lesson header + description + actions */}
        <div className="rounded-2xl border p-4" style={{ borderColor: '#e8e4ff', background: '#fff' }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#9590b8' }}>
            {current.sectionTitle}
          </p>
          <h1 className="text-[18px] font-bold" style={{ color: '#1a1730' }}>{current.title}</h1>

          {current.description && (
            <p className="text-[13px] leading-relaxed mt-2" style={{ color: '#46426a' }}>
              {current.description}
            </p>
          )}

          {/* Action row — minimalist */}
          <div className="mt-4 pt-3 flex items-center gap-1.5 flex-wrap border-t" style={{ borderColor: '#f0edfa' }}>
            {/* Previous — icon+text minimal */}
            {prevId ? (
              <Link href={`/communities/${slug}/courses/${courseId}/lessons/${prevId}`}
                    className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[12px] font-medium transition-colors hover:bg-[#f6f5fb]"
                    style={{ color: '#46426a' }}>
                <ChevronLeft className="w-3.5 h-3.5" />
                {isAr ? 'السابق' : 'Previous'}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[12px] font-medium opacity-30"
                    style={{ color: '#46426a' }}>
                <ChevronLeft className="w-3.5 h-3.5" />
                {isAr ? 'السابق' : 'Previous'}
              </span>
            )}

            {/* Next — minimalist purple text */}
            {nextId ? (
              <Link href={`/communities/${slug}/courses/${courseId}/lessons/${nextId}`}
                    className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[12px] font-semibold transition-colors hover:bg-[#ede9ff]"
                    style={{ color: '#8e78fb' }}>
                {isAr ? 'التالي' : 'Next'}
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[12px] font-semibold opacity-30"
                    style={{ color: '#8e78fb' }}>
                {isAr ? 'انتهت' : 'End'}
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            )}

            <div className="flex-1" />

            {/* Mark complete — right, FLAT solid green */}
            <button onClick={() => setDone(!done)}
                    className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[12px] font-semibold transition-colors"
                    style={{
                      background: done ? '#22c55e' : '#fff',
                      color: done ? '#fff' : '#16a34a',
                      border: `1.5px solid ${done ? '#22c55e' : '#86efac'}`,
                    }}>
              {done
                ? <><CheckCircle2 className="w-3.5 h-3.5" /> {isAr ? 'مكتمل' : 'Completed'}</>
                : <><Circle className="w-3.5 h-3.5" /> {isAr ? 'وضع علامة اكتمال' : 'Mark as complete'}</>}
            </button>
          </div>
        </div>

        {/* Tabs — Comments + Resources */}
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
              <div className="flex items-start gap-2 mb-5">
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
              <div className="space-y-5">
                {comments.map((c) => (
                  <CommentBlock key={c.id} comment={c}
                                isAr={isAr}
                                onLike={() => toggleLike(c.id)}
                                onReplyToggle={() => { setReplyOpen(replyOpen === c.id ? null : c.id); setReplyDraft('') }}
                                onReplyLike={(rid) => toggleLike(c.id, rid)}
                                replyOpen={replyOpen === c.id}
                                replyDraft={replyDraft}
                                setReplyDraft={setReplyDraft}
                                onReplySubmit={() => postReply(c.id)} />
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

function CommentBlock({ comment, isAr, onLike, onReplyToggle, onReplyLike, replyOpen, replyDraft, setReplyDraft, onReplySubmit }:
  { comment: Comment; isAr: boolean; onLike: () => void; onReplyToggle: () => void
    onReplyLike: (rid: string) => void; replyOpen: boolean; replyDraft: string
    setReplyDraft: (v: string) => void; onReplySubmit: () => void }) {
  return (
    <div>
      <CommentRow author={comment.author} initials={comment.initials} color={comment.color}
                  isInstructor={comment.isInstructor} text={comment.text} timeAgo={comment.timeAgo}
                  likes={comment.likes} liked={comment.liked}
                  isAr={isAr} onLike={onLike} onReply={onReplyToggle} showReply />

      {/* Reply composer */}
      {replyOpen && (
        <div className="ms-11 mt-2 flex items-start gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
               style={{ background: '#47c7ea' }}>YO</div>
          <div className="flex-1">
            <textarea value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)}
                      placeholder={isAr ? 'اكتب ردك…' : 'Write a reply…'}
                      rows={2}
                      autoFocus
                      className="w-full px-3 py-2 rounded-xl text-[12.5px] outline-none resize-none border"
                      style={{ background: '#fafafd', borderColor: '#e8e4ff', color: '#1a1730' }} />
            <div className="flex justify-end mt-1">
              <button onClick={onReplySubmit} disabled={!replyDraft.trim()}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-semibold text-white disabled:opacity-40"
                      style={{ background: '#8e78fb' }}>
                <Send className="w-3 h-3" /> {isAr ? 'رد' : 'Reply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="ms-11 mt-3 space-y-3 border-l-2 pl-3" style={{ borderColor: '#eceaf4' }}>
          {comment.replies.map((r) => (
            <CommentRow key={r.id}
                        author={r.author} initials={r.initials} color={r.color}
                        isInstructor={r.isInstructor} text={r.text} timeAgo={r.timeAgo}
                        likes={r.likes} liked={r.liked}
                        isAr={isAr} onLike={() => onReplyLike(r.id)} small />
          ))}
        </div>
      )}
    </div>
  )
}

function CommentRow({ author, initials, color, isInstructor, text, timeAgo, likes, liked, isAr, onLike, onReply, showReply, small }:
  { author: string; initials: string; color: string; isInstructor?: boolean; text: string
    timeAgo: string; likes: number; liked?: boolean; isAr: boolean
    onLike: () => void; onReply?: () => void; showReply?: boolean; small?: boolean }) {
  const avSize = small ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-[12px]'
  return (
    <div className="flex items-start gap-2">
      <div className={`${avSize} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
           style={{ background: color }}>{initials}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <span className="text-[13px] font-semibold" style={{ color: '#1a1730' }}>{author}</span>
          {isInstructor && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold"
                  style={{ background: '#ffe4ee', color: '#f65887' }}>
              <Shield className="w-2.5 h-2.5" /> {isAr ? 'المدرس' : 'Instructor'}
            </span>
          )}
          <span className="text-[11px]" style={{ color: '#9590b8' }}>· {timeAgo}</span>
        </div>
        <p className="text-[13px] leading-relaxed" style={{ color: '#46426a' }}>{text}</p>

        <div className="flex items-center gap-3 mt-1.5">
          <button onClick={onLike}
                  className="inline-flex items-center gap-1 text-[11.5px] transition-colors"
                  style={{ color: liked ? '#f65887' : '#9590b8' }}>
            <Heart className="w-3.5 h-3.5" fill={liked ? '#f65887' : 'none'} />
            <span className="font-semibold">{likes}</span>
          </button>
          {showReply && onReply && (
            <button onClick={onReply}
                    className="inline-flex items-center gap-1 text-[11.5px] transition-colors hover:text-[#8e78fb]"
                    style={{ color: '#9590b8' }}>
              <Reply className="w-3.5 h-3.5" />
              <span className="font-semibold">{isAr ? 'رد' : 'Reply'}</span>
            </button>
          )}
        </div>
      </div>
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
