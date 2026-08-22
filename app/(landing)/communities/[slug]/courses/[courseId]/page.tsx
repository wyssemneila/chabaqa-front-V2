import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { getCommunity, LEVEL_CONFIG } from '@/lib/community-data'
import CourseCurriculum from '@/components/community/course-curriculum'
import {
  ArrowLeft, Play, Users, Clock, BookOpen, Star, CheckCircle2, ListChecks, Award, Info,
} from 'lucide-react'

interface Props { params: Promise<{ slug: string; courseId: string }> }

export default async function CourseDetailPage({ params }: Props) {
  const { slug, courseId } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const course = community.courses.find((c) => c.id === courseId)
  if (!course) notFound()
  const isAr = locale === 'ar'

  const level = LEVEL_CONFIG[course.level]
  const totalChapters = (course.sections || []).reduce((n, s) => n + s.chapters.length, 0)
  const doneChapters = (course.sections || []).reduce(
    (n, s) => n + s.chapters.filter((c) => c.done).length, 0,
  )
  const progressPct = totalChapters ? Math.round((doneChapters / totalChapters) * 100) : (course.progress || 0)

  const firstUndone = course.sections?.flatMap((s) => s.chapters).find((c) => !c.done)
  const startId = firstUndone?.id || course.sections?.[0]?.chapters?.[0]?.id

  const title = isAr ? course.titleAr : course.title
  const description = isAr && course.descriptionAr ? course.descriptionAr : course.description
  const objectives = (isAr && course.objectivesAr) ? course.objectivesAr : (course.objectives || [])
  const requirements = (isAr && course.requirementsAr) ? course.requirementsAr : (course.requirements || [])

  return (
    <div className="w-full" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Back */}
      <Link href={`/communities/${slug}/courses`}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-4 transition-colors hover:text-[#8e78fb]"
            style={{ color: '#46426a' }}>
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
        {isAr ? 'العودة للدورات' : 'Back to courses'}
      </Link>

      {/* Compact header — no banner */}
      <div className="rounded-2xl border p-5 mb-4" style={{ borderColor: '#e8e4ff', background: '#fff' }}>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold"
                    style={{ background: level.bg, color: level.color }}>
                {isAr ? level.labelAr : level.label}
              </span>
              <span className="text-[11px]" style={{ color: '#9590b8' }}>
                {course.price === 'free' ? (isAr ? 'مجاني' : 'Free') : `${course.price} ${course.currency || 'TND'}`}
              </span>
            </div>
            <h1 className="text-[22px] font-bold leading-tight" style={{ color: '#1a1730' }}>{title}</h1>
            <p className="text-[13px] mt-1" style={{ color: '#9590b8' }}>
              {isAr ? 'بواسطة' : 'By'}{' '}
              <span className="font-semibold" style={{ color: '#46426a' }}>{course.instructor}</span>
            </p>
          </div>

          {startId && (
            <Link href={`/communities/${slug}/courses/${course.id}/lessons/${startId}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white shrink-0 transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(to right, #8e78fb, #a08cff)' }}>
              <Play className="w-4 h-4" fill="#fff" />
              {course.enrolled
                ? (progressPct > 0 ? (isAr ? 'تابع التعلم' : 'Continue learning') : (isAr ? 'ابدأ الدورة' : 'Start course'))
                : (isAr ? 'سجّل الآن' : 'Enroll now')}
            </Link>
          )}
        </div>

        {/* Progress bar */}
        {course.enrolled && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11.5px] font-medium" style={{ color: '#46426a' }}>
                {isAr ? 'تقدمك' : 'Your progress'}
              </span>
              <span className="text-[11.5px] font-semibold" style={{ color: '#8e78fb' }}>
                {doneChapters}/{totalChapters} · {progressPct}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#ede9ff' }}>
              <div className="h-full rounded-full transition-all"
                   style={{ width: `${progressPct}%`, background: 'linear-gradient(to right, #8e78fb, #a08cff)' }} />
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="mt-4 flex flex-wrap gap-2">
          <StatChip icon={<Users className="w-3 h-3" />} value={course.studentsCount} label={isAr ? 'مسجل' : 'Enrolled'} />
          <StatChip icon={<BookOpen className="w-3 h-3" />} value={totalChapters || course.lessonsCount} label={isAr ? 'فصل' : 'Chapters'} />
          <StatChip icon={<Clock className="w-3 h-3" />} value={course.duration} />
          <StatChip icon={<Star className="w-3 h-3" iconColor="#f59e0b" />} value={course.rating.toFixed(1)} label={`(${course.studentsCount})`} />
        </div>
      </div>

      {/* Two-column body — CURRICULUM is the star */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        {/* LEFT — MAIN — Curriculum */}
        <div className="rounded-2xl p-5 shadow-lg relative overflow-hidden border"
             style={{ background: '#fff', borderColor: '#e8e4ff' }}>
          {/* subtle purple glow */}
          <div className="absolute -right-16 -top-16 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
               style={{ background: '#8e78fb' }} />

          <div className="flex items-center gap-2 mb-5 relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                 style={{ background: '#8e78fb' }}>
              <BookOpen className="w-4.5 h-4.5" style={{ color: '#fff' }} />
            </div>
            <div className="flex-1">
              <h2 className="text-[17px] font-bold leading-tight" style={{ color: '#1a1730' }}>
                {isAr ? 'المنهج الدراسي' : 'Curriculum'}
              </h2>
              <p className="text-[11.5px]" style={{ color: '#9590b8' }}>
                {course.sections?.length || 0} {isAr ? 'أقسام' : 'sections'} · {totalChapters} {isAr ? 'فصل' : 'chapters'} · {course.duration}
              </p>
            </div>
          </div>

          <div className="relative">
            <CourseCurriculum
              slug={slug}
              courseId={course.id}
              sections={course.sections || []}
              isAr={isAr} />
          </div>
        </div>

        {/* RIGHT — Muted info sidebar (visually secondary) */}
        <div className="space-y-3 lg:sticky lg:top-4 lg:self-start">
          {description && (
            <MutedCard title={isAr ? 'حول الدورة' : 'About'} icon={<Info className="w-3.5 h-3.5" />}>
              <p className="text-[12px] leading-relaxed" style={{ color: '#6b6885' }}>{description}</p>
            </MutedCard>
          )}

          {objectives.length > 0 && (
            <MutedCard title={isAr ? 'ما ستتعلمه' : "What you'll learn"} icon={<Award className="w-3.5 h-3.5" />}>
              <ul className="space-y-1.5">
                {objectives.map((o, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px]" style={{ color: '#6b6885' }}>
                    <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: '#9590b8' }} />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </MutedCard>
          )}

          {requirements.length > 0 && (
            <MutedCard title={isAr ? 'المتطلبات' : 'Requirements'} icon={<ListChecks className="w-3.5 h-3.5" />}>
              <ul className="space-y-1">
                {requirements.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px]" style={{ color: '#6b6885' }}>
                    <span className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#9590b8' }} />
                    {r}
                  </li>
                ))}
              </ul>
            </MutedCard>
          )}
        </div>
      </div>
    </div>
  )
}

function StatChip({ icon, value, label, iconColor }:
  { icon: React.ReactNode; value: string | number; label?: string; iconColor?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-medium"
          style={{ background: 'rgba(142,120,251,0.1)', color: '#8e78fb' }}>
      <span style={{ color: iconColor || '#8e78fb' }}>{icon}</span>
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
