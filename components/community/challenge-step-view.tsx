'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, CheckCircle2, Send, Trophy, Sparkles, Upload, Link2, X,
} from 'lucide-react'

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
  currentIndex: number
  total: number
  isAr: boolean
}

export default function ChallengeStepView({ slug, challengeId, steps, currentIndex, total, isAr }: Props) {
  const step = steps[currentIndex]
  const [submission, setSubmission] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitted, setSubmitted] = useState(step.done)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  const handleSubmit = () => {
    if (!submission.trim() && !file && !linkUrl.trim()) return
    setSubmitted(true)
  }

  const prevHref = currentIndex > 0
    ? `/communities/${slug}/challenges/${challengeId}/steps/${currentIndex - 1}`
    : null
  const nextHref = currentIndex < total - 1
    ? `/communities/${slug}/challenges/${challengeId}/steps/${currentIndex + 1}`
    : null

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Step indicator dots */}
      <div className="flex items-center justify-center gap-2 py-3">
        {steps.map((s, i) => {
          const isDone = s.done || (i < currentIndex && submitted)
          const isActive = i === currentIndex
          return (
            <div key={i}
                 className="flex items-center flex-shrink-0"
                 style={{ flex: i < steps.length - 1 ? 1 : 0, maxWidth: 60 }}>
              <div className={`rounded-full flex items-center justify-center transition-all flex-shrink-0 ${isActive ? 'w-8 h-8' : 'w-6 h-6'}`}
                   style={{
                     background: isDone ? '#22c55e' : isActive ? '#22c55e' : '#eceaf4',
                     color: isDone || isActive ? '#fff' : '#9590b8',
                     boxShadow: isActive ? '0 0 0 4px rgba(34,197,94,.2)' : 'none',
                   }}>
                {isDone
                  ? <CheckCircle2 className="w-4 h-4" />
                  : <span className="text-[11px] font-bold">{s.order}</span>}
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-1"
                     style={{ background: isDone ? '#22c55e' : '#eceaf4' }} />
              )}
            </div>
          )
        })}
      </div>

      <p className="text-center text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9590b8' }}>
        {isAr ? `الخطوة ${currentIndex + 1} من ${total}` : `Step ${currentIndex + 1} of ${total}`}
      </p>

      {/* Instruction card */}
      <div className="rounded-2xl border p-6" style={{ borderColor: '#e8e4ff', background: '#fff' }}>
        <h1 className="text-[22px] font-bold" style={{ color: '#1a1730' }}>{step.title}</h1>
        <p className="text-[14px] leading-relaxed mt-3" style={{ color: '#46426a' }}>{step.description}</p>
      </div>

      {/* Submission card */}
      {!submitted ? (
        <div className="rounded-2xl border p-5" style={{ borderColor: '#e8e4ff', background: '#fff' }}>
          <h2 className="text-[15px] font-bold mb-1 flex items-center gap-2" style={{ color: '#1a1730' }}>
            <Send className="w-4 h-4" style={{ color: '#22c55e' }} />
            {isAr ? 'أرسل عملك' : 'Submit your work'}
          </h2>
          <p className="text-[12px] mb-4" style={{ color: '#9590b8' }}>
            {isAr ? 'أضف نصاً وملفاً و/أو رابطاً لعرض تقدمك.' : 'Add a note, a file and/or a link to show your progress.'}
          </p>

          {/* Text */}
          <textarea value={submission} onChange={(e) => setSubmission(e.target.value)}
                    placeholder={isAr ? 'اكتب ملاحظاتك…' : 'Write your notes…'}
                    rows={4}
                    className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none border mb-3 focus:border-[#22c55e]"
                    style={{ background: '#fafafd', borderColor: '#e8e4ff', color: '#1a1730' }} />

          {/* Grid: file + link */}
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            {/* File upload */}
            <label className="rounded-xl border-2 border-dashed p-4 flex flex-col items-center gap-1.5 cursor-pointer transition-colors hover:border-[#22c55e]"
                   style={{ borderColor: file ? '#22c55e' : '#e8e4ff', background: file ? '#f0fdf4' : '#fafafd' }}>
              <input type="file" className="hidden" onChange={handleFile} />
              <div className="w-9 h-9 rounded-full flex items-center justify-center"
                   style={{ background: file ? '#22c55e' : '#ede9ff', color: file ? '#fff' : '#8e78fb' }}>
                {file ? <CheckCircle2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
              </div>
              <p className="text-[12px] font-semibold" style={{ color: '#1a1730' }}>
                {file ? file.name.slice(0, 22) : (isAr ? 'ارفع ملف' : 'Upload file')}
              </p>
              <p className="text-[10.5px]" style={{ color: '#9590b8' }}>
                {file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : (isAr ? 'MP4, PDF, ZIP…' : 'MP4, PDF, ZIP…')}
              </p>
              {file && (
                <button type="button" onClick={(e) => { e.preventDefault(); setFile(null) }}
                        className="text-[11px] font-medium" style={{ color: '#ef4444' }}>
                  {isAr ? 'إزالة' : 'Remove'}
                </button>
              )}
            </label>

            {/* Link */}
            <div className="rounded-xl border-2 border-dashed p-4 flex flex-col gap-1.5"
                 style={{ borderColor: linkUrl ? '#22c55e' : '#e8e4ff', background: linkUrl ? '#f0fdf4' : '#fafafd' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center mx-auto"
                   style={{ background: linkUrl ? '#22c55e' : '#ede9ff', color: linkUrl ? '#fff' : '#8e78fb' }}>
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

          <button onClick={handleSubmit}
                  disabled={!submission.trim() && !file && !linkUrl.trim()}
                  className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-40 transition-opacity"
                  style={{ background: '#22c55e' }}>
            <Send className="w-3.5 h-3.5" />
            {isAr ? 'أرسل عملك' : 'Submit work'}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl p-6 text-center"
             style={{ background: 'linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)', border: '2px solid #22c55e' }}>
          <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
               style={{ background: '#22c55e' }}>
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-[16px] font-bold mb-1" style={{ color: '#16a34a' }}>
            {isAr ? 'رائع! تم استلام عملك' : 'Nice work! Submission received'}
          </h3>
          <p className="text-[12.5px]" style={{ color: '#15803d' }}>
            {isAr ? 'يمكنك الآن الانتقال للخطوة التالية.' : 'You can move on to the next step.'}
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="rounded-2xl border p-3 flex items-center gap-1.5 flex-wrap"
           style={{ borderColor: '#e8e4ff', background: '#fff' }}>
        {prevHref ? (
          <Link href={prevHref}
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

        {nextHref ? (
          <Link href={nextHref}
                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[12px] font-semibold transition-colors hover:bg-[#dcfce7]"
                style={{ color: '#16a34a' }}>
            {isAr ? 'التالي' : 'Next step'}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <Link href={`/communities/${slug}/challenges/${challengeId}`}
                className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-[12px] font-semibold text-white"
                style={{ background: '#22c55e' }}>
            <Trophy className="w-3.5 h-3.5" />
            {isAr ? 'إنهاء التحدي' : 'Finish challenge'}
          </Link>
        )}
      </div>
    </div>
  )
}
