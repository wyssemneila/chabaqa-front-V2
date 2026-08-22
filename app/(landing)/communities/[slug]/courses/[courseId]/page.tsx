import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { getCommunity, LEVEL_CONFIG } from '@/lib/community-data'
import CourseCurriculum from '@/components/community/course-curriculum'
import {
  ArrowLeft, Play, Users, Clock, BookOpen, Star, CheckCircle2, ListChecks, Award,
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
    (n, s) => n + s.chapters.filter((c) => c.done).length, 0
  )
  const progressPct = totalChapters ? Math.round((doneChapters / totalChapters) * 100) : (course.progress || 0)

  // First not-done chapter for the Continue CTA
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
            className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-4 transition-colors"
            style={{ color: '#46426a' }}>
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
        {isAr ? 'العودة للدورات' : 'Back to courses'}
      </Link>

      {/* Header card */}
      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: '#e8e4ff', background: '#fff' }}>
        {/* Banner */}
        <div className="h-40 relative"
             style={{ background: `linear-gradient(135deg, #8e78fb 0%, #a08cff 55%, #f65887 130%)` }}>
          <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full blur-3xl opacity-40"
               style={{ background: '#47c7ea' }} />
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="flex items-start gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-[22px] font-bold" style={{ color: '#1a1730' }}>{title}</h1>
              <p className="text-[13px] mt-1" style={{ color: '#9590b8' }}>
                {isAr ? 'بواسطة' : 'By'} <span className="font-semibold" style={{ color: '#46426a' }}>{course.instructor}</span>
                <span className="mx-2">·</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                      style={{ background: level.bg, color: level.color }}>
                  {isAr ? level.labelAr : level.label}
                </span>
              </p>
            </div>

            {startId && (
              <Link href={`/communities/${slug}/courses/${course.id}/lessons/${startId}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white shrink-0"
                    style={{ background: '#8e78fb' }}>
                <Play className="w-4 h-4" />
                {course.enrolled
                  ? (progressPct > 0 ? (isAr ? 'تابع التعلم' : 'Continue learning') : (isAr ? 'ابدأ الدورة' : 'Start course'))
                  : (isAr ? 'سجّل الآن' : 'Enroll now')}
              </Link>
            )}
          </div>

          {/* Progress bar for enrolled */}
          {course.enrolled && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-medium" style={{ color: '#46426a' }}>
                  {isAr ? 'تقدمك' : 'Your progress'}
                </span>
                <span className="text-[12px] font-semibold" style={{ color: '#8e78fb' }}>
                  {doneChapters}/{totalChapters} · {progressPct}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#ede9ff' }}>
                <div className="h-full rounded-full transition-all"
                     style={{ width: `${progressPct}%`, background: '#8e78fb' }} />
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2">
            <Stat icon={<Users className="w-3.5 h-3.5" />} label={isAr ? 'مسجل' : 'Enrolled'} value={course.studentsCount} />
            <Stat icon={<BookOpen className="w-3.5 h-3.5" />} label={isAr ? 'فصول' : 'Chapters'} value={totalChapters || course.lessonsCount} />
            <Stat icon={<Clock className="w-3.5 h-3.5" />} label={isAr ? 'المدة' : 'Duration'} value={course.duration} />
            <Stat icon={<Star className="w-3.5 h-3.5" />} label={isAr ? 'تقييم' : 'Rating'} value={course.rating.toFixed(1)} />
          </div>
        </div>
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* LEFT — Main content */}
        <div className="lg:col-span-2 space-y-4">
          {description && (
            <Card title={isAr ? 'حول هذه الدورة' : 'About this course'} icon={<BookOpen className="w-4 h-4" />}>
              <p className="text-[13.5px] leading-relaxed" style={{ color: '#46426a' }}>{description}</p>
            </Card>
          )}

          {objectives.length > 0 && (
            <Card title={isAr ? 'ما ستتعلمه' : "What you'll learn"} icon={<Award className="w-4 h-4" />}>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {objectives.map((o, i) => (
                  <div key={i} className="flex items-start gap-2 text-[13px]" style={{ color: '#46426a' }}>
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#8e78fb' }} />
                    <span>{o}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {requirements.length > 0 && (
            <Card title={isAr ? 'المتطلبات' : 'Requirements'} icon={<ListChecks className="w-4 h-4" />}>
              <ul className="space-y-2">
                {requirements.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px]" style={{ color: '#46426a' }}>
                    <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: '#8e78fb' }} />
                    {r}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* RIGHT — Curriculum */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border p-4 lg:sticky lg:top-4"
               style={{ borderColor: '#e8e4ff', background: '#fff' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-semibold" style={{ color: '#1a1730' }}>
                {isAr ? 'المنهج' : 'Curriculum'}
              </p>
              <span className="text-[11px]" style={{ color: '#9590b8' }}>
                {totalChapters} {isAr ? 'فصل' : 'chapters'}
              </span>
            </div>
            <CourseCurriculum
              slug={slug}
              courseId={course.id}
              sections={course.sections || []}
              isAr={isAr} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: '#e8e4ff', background: '#fafafd' }}>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider mb-1" style={{ color: '#9590b8' }}>
        <span style={{ color: '#8e78fb' }}>{icon}</span>
        {label}
      </div>
      <p className="text-[16px] font-bold" style={{ color: '#1a1730' }}>{value}</p>
    </div>
  )
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: '#e8e4ff', background: '#fff' }}>
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color: '#8e78fb' }}>{icon}</span>
        <h3 className="text-[14px] font-semibold" style={{ color: '#1a1730' }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}
