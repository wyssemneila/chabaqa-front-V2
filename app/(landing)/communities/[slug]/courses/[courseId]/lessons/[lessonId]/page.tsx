import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getCommunity } from '@/lib/community-data'
import LessonViewer from '@/components/community/lesson-viewer'

interface Props { params: Promise<{ slug: string; courseId: string; lessonId: string }> }

export default async function LessonPage({ params }: Props) {
  const { slug, courseId, lessonId } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const course = community.courses.find((c) => c.id === courseId)
  if (!course || !course.sections) notFound()

  const isAr = locale === 'ar'

  // Flatten to find current + prev + next
  const flat = course.sections.flatMap((s) =>
    s.chapters.map((c) => ({ ...c, sectionId: s.id, sectionTitle: s.title, sectionTitleAr: s.titleAr })),
  )
  const idx = flat.findIndex((c) => c.id === lessonId)
  if (idx < 0) notFound()
  const current = flat[idx]
  const prev = flat[idx - 1] || null
  const next = flat[idx + 1] || null

  return (
    <div className="w-full" dir={isAr ? 'rtl' : 'ltr'}>
      <Link href={`/communities/${slug}/courses/${courseId}`}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-3 transition-colors"
            style={{ color: '#46426a' }}>
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
        {isAr && course.titleAr ? course.titleAr : course.title}
      </Link>

      <LessonViewer
        slug={slug}
        courseId={courseId}
        sections={course.sections}
        current={{
          id: current.id,
          title: isAr && current.titleAr ? current.titleAr : current.title,
          duration: current.duration,
          videoUrl: current.videoUrl || '',
          sectionTitle: isAr && current.sectionTitleAr ? current.sectionTitleAr : current.sectionTitle,
          description: isAr && current.descriptionAr ? current.descriptionAr : (current.description || ''),
          resources: current.resources || [],
          done: !!current.done,
        }}
        prevId={prev?.id}
        nextId={next?.id}
        isAr={isAr}
      />
    </div>
  )
}
