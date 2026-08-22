'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Send, Trophy, Sparkles, Upload, Link2, Heart, Reply, Shield, MessageSquare,
  FileText, Package, ImageIcon, Video, Users2, Calendar, ExternalLink, Download, Zap, Award,
  CheckCircle2, ArrowRight,
} from 'lucide-react'
import VideoPlayer from './video-player'
import type { StepContentType, StepResource } from '@/lib/community-data'

interface Step {
  order: number
  title: string
  description: string
  contentType: StepContentType
  points: number
  done: boolean
  videoUrl?: string
  meetUrl?: string
  meetTime?: string
  resources?: StepResource[]
}

interface Props {
  slug: string
  challengeId: string
  step: Step
  totalSteps: number
  earnedSoFar: number
  totalPoints: number
  nextStepIndex?: number
  isAr: boolean
}

interface Reply {
  id: string; author: string; initials: string; color: string
  isInstructor?: boolean; text: string; timeAgo: string; likes: number; liked?: boolean
}
interface Comment extends Reply { replies: Reply[] }

const DEMO_COMMENTS: Comment[] = [
  {
    id: '1', author: 'Sara Chebbi', initials: 'SC', color: '#47c7ea',
    text: 'Should the character face left or right for the walk cycle? Does it matter for the challenge?',
    timeAgo: '3h ago', likes: 4,
    replies: [
      {
        id: '1-1', author: 'Mohamed Trabelsi', initials: 'MT', color: '#f65887', isInstructor: true,
        text: "Doesn't matter — pick whichever feels most natural. Just be consistent through the cycle.",
        timeAgo: '2h ago', likes: 9, liked: true,
      },
    ],
  },
]

const RESOURCE_ICON: Record<StepResource['type'], any> = {
  pdf: FileText, zip: Package, link: Link2, image: ImageIcon, video: Video,
}

export default function ChallengeStepView({ slug, challengeId, step, totalSteps, earnedSoFar, totalPoints, nextStepIndex, isAr }: Props) {
  const [tab, setTab] = useState<'content' | 'submit' | 'comments'>('content')
  const [submitted, setSubmitted] = useState(step.done)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
      {/* ── LEFT — content + tabs ── */}
      <div className="space-y-4 min-w-0">
        {/* Step header (points + step index) */}
        <div className="rounded-2xl p-5 border"
             style={{ background: 'linear-gradient(135deg, #f8f5ff 0%, #ede9ff 100%)', borderColor: '#e8e4ff' }}>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#7c6ff5' }}>
              {isAr ? `الخطوة ${step.order} من ${totalSteps}` : `Step ${step.order} of ${totalSteps}`}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold"
                  style={{ background: '#fef3c7', color: '#d97706' }}>
              <Zap className="w-2.5 h-2.5" fill="#d97706" />
              +{step.points} {isAr ? 'نقاط' : 'pts'}
            </span>
          </div>
          <h1 className="text-[20px] font-bold" style={{ color: '#1a1730' }}>{step.title}</h1>
          <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: '#46426a' }}>{step.description}</p>
        </div>

        {/* Tab bar */}
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#e8e4ff', background: '#fff' }}>
          <div className="flex border-b" style={{ borderColor: '#e8e4ff' }}>
            <TabButton active={tab === 'content'} onClick={() => setTab('content')}
                       icon={<ContentTabIcon type={step.contentType} />}
                       label={isAr ? 'المحتوى' : 'Content'} />
            <TabButton active={tab === 'submit'} onClick={() => setTab('submit')}
                       icon={submitted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                       label={isAr ? 'إرسال العمل' : 'Submit work'}
                       highlight={submitted ? '#8e78fb' : undefined} />
            <TabButton active={tab === 'comments'} onClick={() => setTab('comments')}
                       icon={<MessageSquare className="w-3.5 h-3.5" />}
                       label={isAr ? 'التعليقات' : 'Comments'} count={DEMO_COMMENTS.length} />
          </div>

          <div className="p-4">
            {tab === 'content' && <ContentPanel step={step} isAr={isAr} />}
            {tab === 'submit' && <SubmitPanel submitted={submitted} onSubmit={() => setSubmitted(true)}
                                              nextHref={nextStepIndex !== undefined ? `/communities/${slug}/challenges/${challengeId}/steps/${nextStepIndex}` : undefined}
                                              backHref={`/communities/${slug}/challenges/${challengeId}`}
                                              isAr={isAr} points={step.points} />}
            {tab === 'comments' && <CommentsPanel isAr={isAr} />}
          </div>
        </div>
      </div>

      {/* ── RIGHT — Points/progress + step context ── */}
      <aside className="lg:sticky lg:top-4 lg:self-start space-y-3">
        {/* Big points card */}
        <div className="rounded-2xl p-5 text-center"
             style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}>
          <div className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center"
               style={{ background: '#f59e0b' }}>
            <Award className="w-6 h-6 text-white" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#92400e' }}>
            {isAr ? 'نقاطك حتى الآن' : 'Points collected'}
          </p>
          <p className="text-[26px] font-black leading-tight" style={{ color: '#78350f' }}>
            {earnedSoFar}
            <span className="text-[13px] font-semibold opacity-70"> / {totalPoints}</span>
          </p>
          <p className="text-[10px] mt-1" style={{ color: '#92400e' }}>
            {isAr ? `+${step.points} نقاط لإكمال هذه الخطوة` : `+${step.points} pts on complete`}
          </p>
        </div>

        {/* Content type card */}
        <div className="rounded-2xl border p-4" style={{ borderColor: '#e8e4ff', background: '#fff' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#9590b8' }}>
            {isAr ? 'نوع المحتوى' : 'Content type'}
          </p>
          <ContentTypeBadge type={step.contentType} isAr={isAr} />
          {step.resources && step.resources.length > 0 && (
            <p className="text-[11px] mt-2" style={{ color: '#6b6885' }}>
              {step.resources.length} {isAr ? 'ملفات مرفقة' : 'attached files'}
            </p>
          )}
        </div>

        <Link href={`/communities/${slug}/challenges/${challengeId}`}
              className="block text-center py-2 rounded-xl text-[12px] font-semibold border transition-colors hover:bg-[#f6f5fb]"
              style={{ borderColor: '#e8e4ff', color: '#46426a' }}>
          ← {isAr ? 'كل الخطوات' : 'All steps'}
        </Link>
      </aside>
    </div>
  )
}

/* ─── CONTENT PANEL ────────────────────────────────────── */

function ContentPanel({ step, isAr }: { step: Step; isAr: boolean }) {
  return (
    <div className="space-y-3">
      {step.contentType === 'video' && (
        <>
          <VideoPlayer src={step.videoUrl || '/videos/test.mp4'} />
          {step.resources && step.resources.length > 0 && (
            <ResourceList resources={step.resources} isAr={isAr} title={isAr ? 'موارد الفيديو' : 'Video resources'} />
          )}
        </>
      )}

      {step.contentType === 'meet' && (
        <div className="rounded-2xl p-6 relative overflow-hidden"
             style={{ background: 'linear-gradient(135deg, #e4f8fd 0%, #f8f5ff 100%)', border: '1px solid #86e4fd' }}>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                 style={{ background: 'linear-gradient(135deg, #47c7ea 0%, #86e4fd 100%)' }}>
              <Users2 className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#47c7ea' }}>
                {isAr ? 'اجتماع مباشر' : 'Live meeting'}
              </p>
              <h3 className="text-[16px] font-bold" style={{ color: '#1a1730' }}>
                {isAr ? 'انضم للاجتماع عبر Google Meet' : 'Join the Google Meet'}
              </h3>
              {step.meetTime && (
                <p className="text-[13px] mt-1.5 font-semibold flex items-center gap-1.5" style={{ color: '#47c7ea' }}>
                  <Calendar className="w-3.5 h-3.5" /> {step.meetTime}
                </p>
              )}
            </div>
          </div>
          <a href={step.meetUrl || '#'} target="_blank" rel="noopener noreferrer"
             className="mt-4 w-full py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90"
             style={{ background: 'linear-gradient(135deg, #47c7ea 0%, #86e4fd 100%)' }}>
            <Users2 className="w-4 h-4" /> {isAr ? 'انضم للاجتماع' : 'Join meeting'}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {step.contentType === 'file' && step.resources && (
        <ResourceList resources={step.resources} isAr={isAr} title={isAr ? 'ملفات هذه الخطوة' : 'Files for this step'} />
      )}

      {step.contentType === 'text' && (
        <div className="rounded-2xl border p-6"
             style={{ borderColor: '#e8e4ff', background: 'linear-gradient(135deg, #ffe4ee 0%, #fff 100%)' }}>
          <div className="w-12 h-12 rounded-2xl mb-3 flex items-center justify-center"
               style={{ background: '#f65887' }}>
            <Zap className="w-6 h-6 text-white" fill="#fff" />
          </div>
          <h3 className="text-[15px] font-bold" style={{ color: '#1a1730' }}>
            {isAr ? 'مهمة عملية' : 'Hands-on task'}
          </h3>
          <p className="text-[13px] mt-1 leading-relaxed" style={{ color: '#46426a' }}>
            {isAr ? 'اقرأ الوصف أعلاه واذهب إلى تبويب "إرسال العمل" لرفع نتيجتك.' : 'Read the description above then switch to the "Submit work" tab to upload your result.'}
          </p>
        </div>
      )}
    </div>
  )
}

/* ─── SUBMIT PANEL ────────────────────────────────────── */

function SubmitPanel({ submitted, onSubmit, backHref, nextHref, isAr, points }:
  { submitted: boolean; onSubmit: () => void; backHref: string; nextHref?: string; isAr: boolean; points: number }) {
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [linkUrl, setLinkUrl] = useState('')

  const canSubmit = text.trim() || file || linkUrl.trim()

  if (submitted) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
             style={{ background: 'linear-gradient(135deg, #8e78fb 0%, #7c6ff5 100%)' }}>
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-[17px] font-bold mb-1" style={{ color: '#7c6ff5' }}>
          {isAr ? 'رائع! تم استلام عملك' : 'Nice work! Submission received'}
        </h3>
        <p className="text-[13px] mb-4" style={{ color: '#6c52f0' }}>
          {isAr ? `لقد ربحت +${points} نقاط!` : `You just earned +${points} points!`}
        </p>
        {nextHref ? (
          <Link href={nextHref}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white"
                style={{ background: '#8e78fb' }}>
            {isAr ? 'الخطوة التالية' : 'Next step'}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <Link href={backHref}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white"
                style={{ background: '#8e78fb' }}>
            <Trophy className="w-3.5 h-3.5" />
            {isAr ? 'إنهاء التحدي' : 'Finish challenge'}
          </Link>
        )}
      </div>
    )
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  return (
    <div>
      <p className="text-[12px] mb-3" style={{ color: '#9590b8' }}>
        {isAr ? 'أضف نص و/أو ملف و/أو رابط لعرض عملك:' : 'Add notes, a file, and/or a link to show your work:'}
      </p>

      <textarea value={text} onChange={(e) => setText(e.target.value)}
                placeholder={isAr ? 'اكتب ملاحظاتك…' : 'Write your notes…'}
                rows={4}
                className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none border mb-3 focus:border-[#8e78fb]"
                style={{ background: '#fafafd', borderColor: '#e8e4ff', color: '#1a1730' }} />

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <label className="rounded-xl border-2 border-dashed p-4 flex flex-col items-center gap-1.5 cursor-pointer transition-colors hover:border-[#8e78fb]"
               style={{ borderColor: file ? '#8e78fb' : '#e8e4ff', background: file ? '#f8f5ff' : '#fafafd' }}>
          <input type="file" className="hidden" onChange={handleFile} />
          <div className="w-9 h-9 rounded-full flex items-center justify-center"
               style={{ background: file ? '#8e78fb' : '#ede9ff', color: file ? '#fff' : '#8e78fb' }}>
            {file ? <CheckCircle2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
          </div>
          <p className="text-[12px] font-semibold" style={{ color: '#1a1730' }}>
            {file ? file.name.slice(0, 22) : (isAr ? 'ارفع ملف' : 'Upload file')}
          </p>
          <p className="text-[10.5px]" style={{ color: '#9590b8' }}>
            {file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'MP4, PDF, ZIP…'}
          </p>
        </label>

        <div className="rounded-xl border-2 border-dashed p-4 flex flex-col gap-1.5"
             style={{ borderColor: linkUrl ? '#8e78fb' : '#e8e4ff', background: linkUrl ? '#f8f5ff' : '#fafafd' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center mx-auto"
               style={{ background: linkUrl ? '#8e78fb' : '#ede9ff', color: linkUrl ? '#fff' : '#8e78fb' }}>
            <Link2 className="w-4 h-4" />
          </div>
          <p className="text-[12px] font-semibold text-center" style={{ color: '#1a1730' }}>
            {isAr ? 'أضف رابط' : 'Add a link'}
          </p>
          <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)}
                 placeholder="https://…"
                 className="w-full px-2 py-1.5 rounded-lg text-[11.5px] outline-none border text-center"
                 style={{ background: '#fff', borderColor: '#e8e4ff', color: '#1a1730' }} />
        </div>
      </div>

      <button onClick={onSubmit} disabled={!canSubmit}
              className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-40 transition-opacity"
              style={{ background: '#8e78fb' }}>
        <Send className="w-3.5 h-3.5" />
        {isAr ? `أرسل واحصل على +${points} نقاط` : `Submit and earn +${points} pts`}
      </button>
    </div>
  )
}

/* ─── COMMENTS PANEL ────────────────────────────────────── */

function CommentsPanel({ isAr }: { isAr: boolean }) {
  const [comments, setComments] = useState<Comment[]>(DEMO_COMMENTS)
  const [draft, setDraft] = useState('')
  const [replyOpen, setReplyOpen] = useState<string | null>(null)
  const [replyDraft, setReplyDraft] = useState('')

  const post = () => {
    if (!draft.trim()) return
    setComments([{ id: String(Date.now()), author: 'You', initials: 'YO', color: '#47c7ea',
      text: draft, timeAgo: 'now', likes: 0, replies: [] }, ...comments])
    setDraft('')
  }
  const postReply = (cid: string) => {
    if (!replyDraft.trim()) return
    setComments(comments.map((c) => c.id === cid
      ? { ...c, replies: [...c.replies, { id: String(Date.now()), author: 'You', initials: 'YO', color: '#47c7ea',
          text: replyDraft, timeAgo: 'now', likes: 0 }] }
      : c))
    setReplyDraft(''); setReplyOpen(null)
  }
  const toggleLike = (cid: string, rid?: string) => {
    setComments(comments.map((c) => {
      if (rid) {
        if (c.id !== cid) return c
        return { ...c, replies: c.replies.map((r) => r.id === rid
          ? { ...r, liked: !r.liked, likes: r.likes + (r.liked ? -1 : 1) } : r) }
      }
      if (c.id !== cid) return c
      return { ...c, liked: !c.liked, likes: c.likes + (c.liked ? -1 : 1) }
    }))
  }

  return (
    <div>
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
            <button onClick={post} disabled={!draft.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white disabled:opacity-40"
                    style={{ background: '#8e78fb' }}>
              <Send className="w-3 h-3" /> {isAr ? 'نشر' : 'Post'}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {comments.map((c) => (
          <div key={c.id}>
            <CommentRow author={c.author} initials={c.initials} color={c.color}
                        isInstructor={c.isInstructor} text={c.text} timeAgo={c.timeAgo}
                        likes={c.likes} liked={c.liked} isAr={isAr}
                        onLike={() => toggleLike(c.id)}
                        onReply={() => { setReplyOpen(replyOpen === c.id ? null : c.id); setReplyDraft('') }}
                        showReply />

            {replyOpen === c.id && (
              <div className="ms-11 mt-2 flex items-start gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                     style={{ background: '#47c7ea' }}>YO</div>
                <div className="flex-1">
                  <textarea value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)}
                            placeholder={isAr ? 'اكتب ردك…' : 'Write a reply…'}
                            rows={2} autoFocus
                            className="w-full px-3 py-2 rounded-xl text-[12.5px] outline-none resize-none border"
                            style={{ background: '#fafafd', borderColor: '#e8e4ff', color: '#1a1730' }} />
                  <div className="flex justify-end mt-1">
                    <button onClick={() => postReply(c.id)} disabled={!replyDraft.trim()}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-semibold text-white disabled:opacity-40"
                            style={{ background: '#8e78fb' }}>
                      <Send className="w-3 h-3" /> {isAr ? 'رد' : 'Reply'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {c.replies.length > 0 && (
              <div className="ms-11 mt-3 space-y-3 border-l-2 pl-3" style={{ borderColor: '#eceaf4' }}>
                {c.replies.map((r) => (
                  <CommentRow key={r.id} author={r.author} initials={r.initials} color={r.color}
                              isInstructor={r.isInstructor} text={r.text} timeAgo={r.timeAgo}
                              likes={r.likes} liked={r.liked} isAr={isAr}
                              onLike={() => toggleLike(c.id, r.id)} small />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function CommentRow({ author, initials, color, isInstructor, text, timeAgo, likes, liked, isAr, onLike, onReply, showReply, small }:
  { author: string; initials: string; color: string; isInstructor?: boolean; text: string
    timeAgo: string; likes: number; liked?: boolean; isAr: boolean
    onLike: () => void; onReply?: () => void; showReply?: boolean; small?: boolean }) {
  const av = small ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-[12px]'
  return (
    <div className="flex items-start gap-2">
      <div className={`${av} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
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

/* ─── Resource list ────────────────────────────────────── */

function ResourceList({ resources, title, isAr }: { resources: StepResource[]; title: string; isAr: boolean }) {
  return (
    <div>
      <p className="text-[11.5px] font-bold uppercase tracking-wider mb-2" style={{ color: '#9590b8' }}>{title}</p>
      <div className="space-y-2">
        {resources.map((r) => {
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
    </div>
  )
}

/* ─── Helper atoms ────────────────────────────────────── */

const CONTENT_CFG: Record<StepContentType, { icon: any; label: string; labelAr: string; color: string; bg: string }> = {
  video: { icon: Video,    label: 'Video',   labelAr: 'فيديو',   color: '#8e78fb', bg: '#ede9ff' },
  meet:  { icon: Users2,   label: 'Meeting', labelAr: 'اجتماع',  color: '#47c7ea', bg: '#e4f8fd' },
  file:  { icon: FileText, label: 'Files',   labelAr: 'ملفات',   color: '#ff9b28', bg: '#fff3e4' },
  text:  { icon: Zap,      label: 'Task',    labelAr: 'مهمة',    color: '#f65887', bg: '#ffe4ee' },
}

function ContentTabIcon({ type }: { type: StepContentType }) {
  const Icon = CONTENT_CFG[type].icon
  return <Icon className="w-3.5 h-3.5" />
}

function ContentTypeBadge({ type, isAr }: { type: StepContentType; isAr: boolean }) {
  const cfg = CONTENT_CFG[type]
  const Icon = cfg.icon
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold"
          style={{ background: cfg.bg, color: cfg.color }}>
      <Icon className="w-3.5 h-3.5" />
      {isAr ? cfg.labelAr : cfg.label}
    </span>
  )
}

function TabButton({ active, onClick, icon, label, count, highlight }:
  { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count?: number; highlight?: string }) {
  const color = active ? '#8e78fb' : (highlight || '#9590b8')
  return (
    <button onClick={onClick}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-[13px] font-semibold transition-colors relative"
            style={{ color }}>
      {icon} {label}
      {count !== undefined && (
        <span className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: active ? '#ede9ff' : '#f6f5fb', color: active ? '#7c6ff5' : '#9590b8' }}>
          {count}
        </span>
      )}
      {active && (
        <span className="absolute left-0 right-0 bottom-0 h-[2px] rounded-t"
              style={{ background: '#8e78fb' }} />
      )}
    </button>
  )
}
