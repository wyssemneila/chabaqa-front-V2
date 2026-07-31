"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { BookOpen, Check, ChevronDown, ChevronRight, Clock3, FileText, LockKeyhole, Play, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { coursesApi } from "@/lib/api/courses.api"
import { idsMatch, resolveCourseRouteId } from "@/lib/utils/course-id"

type SessionChapter = {
  chapterId: string
  isCompleted: boolean
  canAccess: boolean
  lockCode?: string
  needsPayment?: boolean
  chapterPrice?: number
  accessSource?: "preview" | "chapter_purchase" | "staff"
}

interface CourseDetailsSidebarProps {
  selectedCourse: string | null
  allCourses: any[]
  userEnrollments: any[]
  getCoursePricing: (course: any) => any
  creatorSlug: string
  slug: string
  onEnroll: (courseId: string) => void
}

const formatDuration = (seconds: unknown) => {
  const minutes = Math.round(Number(seconds || 0) / 60)
  return minutes > 0 ? `${minutes} min` : "Lesson"
}

export default function CourseDetailsSidebar({
  selectedCourse, allCourses, userEnrollments, creatorSlug, slug, onEnroll,
}: CourseDetailsSidebarProps) {
  const [sessionChapters, setSessionChapters] = useState<SessionChapter[] | null>(null)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  const course = useMemo(
    () => allCourses.find((candidate) => idsMatch(candidate, selectedCourse)),
    [allCourses, selectedCourse],
  )
  const routeCourseId = resolveCourseRouteId(course ?? selectedCourse)
  const isEnrolled = Boolean(course && userEnrollments.some((entry) => idsMatch(entry?.courseId, course)))
  const playerHref = `/${creatorSlug}/${slug}/courses/${routeCourseId}`

  useEffect(() => {
    let active = true
    setSessionChapters(null)
    if (!course || !isEnrolled || !routeCourseId) return

    void coursesApi.getCourseSession(routeCourseId)
      .then((raw) => {
        const data = raw?.data ?? raw
        if (active && Array.isArray(data?.chapters)) setSessionChapters(data.chapters)
      })
      .catch(() => active && setSessionChapters([]))
    return () => { active = false }
  }, [course?.id, course?.mongoId, isEnrolled, routeCourseId])

  useEffect(() => {
    if (!course?.sections?.length) return
    setOpenSections((previous) => {
      if (Object.keys(previous).length) return previous
      const firstIncomplete = course.sections.find((section: any) =>
        section.chapters?.some((chapter: any) => !sessionChapters?.find((item) => item.chapterId === String(chapter.id))?.isCompleted),
      )
      return { [String((firstIncomplete || course.sections[0]).id)]: true }
    })
  }, [course?.id, sessionChapters])

  if (!selectedCourse) {
    return <Card className="border border-slate-200/80 bg-white shadow-sm"><CardContent className="py-10 text-center"><BookOpen className="mx-auto mb-3 h-9 w-9 text-[#2ab7dc]" /><p className="font-semibold text-slate-900">Choose a course</p><p className="mt-1 text-sm text-slate-500">Select a course to see its learning plan.</p></CardContent></Card>
  }
  if (!course) return null

  const getStatus = (chapter: any) => {
    const session = sessionChapters?.find((item) => item.chapterId === String(chapter.id))
    if (session?.isCompleted) return { label: "Completed", tone: "complete", icon: Check }
    if (session?.needsPayment || (chapter.isPaidChapter && session && !session.canAccess && session.lockCode === "payment_required")) return { label: `${session.chapterPrice ?? chapter.price ?? 0} TND · Unlock`, tone: "paid", icon: LockKeyhole }
    if (session && !session.canAccess) return { label: "Finish previous lesson", tone: "locked", icon: LockKeyhole }
    if (session?.accessSource === "chapter_purchase") return { label: "Purchased", tone: "purchased", icon: Play }
    if (session?.canAccess || (!isEnrolled && chapter.isPreview)) return { label: chapter.isPreview ? "Free preview" : "Start lesson", tone: "ready", icon: Play }
    if (chapter.isPaidChapter) return { label: `${chapter.price || 0} TND · Unlock`, tone: "paid", icon: LockKeyhole }
    return { label: "Enroll to continue", tone: "locked", icon: LockKeyhole }
  }

  const allChapters = course.sections.flatMap((section: any) => section.chapters || [])
  const completed = sessionChapters?.filter((chapter) => chapter.isCompleted).length ?? 0
  const nextChapter = allChapters.find((chapter: any) => !sessionChapters?.find((item) => item.chapterId === String(chapter.id))?.isCompleted) || allChapters[0]
  const nextStatus = nextChapter ? getStatus(nextChapter) : null
  const resources = Array.isArray(course.ressources) ? course.ressources : []

  return (
    <aside className="space-y-4">
      <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-[0_12px_32px_-22px_rgba(15,23,42,0.35)]">
        <CardContent className="p-0">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-[#2ab7dc]" /><h2 className="font-bold text-slate-950">Learning plan</h2></div><span className="text-xs font-semibold text-slate-500">{completed} / {allChapters.length} complete</span></div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#2ab7dc] transition-all" style={{ width: `${allChapters.length ? (completed / allChapters.length) * 100 : 0}%` }} /></div>
          </div>

          <div className="max-h-[520px] overflow-y-auto p-3">
            {course.sections.map((section: any, sectionIndex: number) => {
              const expanded = Boolean(openSections[String(section.id)])
              return <div key={section.id} className="mb-2 last:mb-0">
                <button type="button" onClick={() => setOpenSections((prev) => ({ ...prev, [String(section.id)]: !expanded }))} className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left hover:bg-slate-50">
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? "rotate-0" : "-rotate-90"}`} /><span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">{sectionIndex + 1}. {section.title}</span><span className="text-xs font-medium text-slate-500">{section.chapters.length}</span>
                </button>
                {expanded && <div className="space-y-1 pb-1 pt-1">
                  {section.chapters.map((chapter: any, index: number) => {
                    const status = getStatus(chapter); const Icon = status.icon
                    const canOpen = status.tone === "complete" || status.tone === "ready" || status.tone === "purchased"
                    const href = canOpen || status.tone === "paid" ? playerHref : undefined
                    const rowClass = `flex items-center gap-2 rounded-xl px-2 py-2 transition-colors ${status.tone === "paid" ? "bg-amber-50/65 hover:bg-amber-50" : href ? "hover:bg-cyan-50/50" : ""}`
                    const lessonRow = <>
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${status.tone === "complete" ? "bg-emerald-100 text-emerald-600" : status.tone === "paid" ? "bg-amber-100 text-amber-700" : status.tone === "ready" || status.tone === "purchased" ? "bg-cyan-50 text-[#159fc5]" : "bg-slate-100 text-slate-400"}`}><Icon className="h-3.5 w-3.5" /></div>
                      <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-800">{index + 1}. {chapter.title}</p><p className={`mt-0.5 text-[11px] font-medium ${status.tone === "paid" ? "text-amber-700" : status.tone === "complete" ? "text-emerald-600" : "text-slate-500"}`}>{status.label}</p></div>
                      <span className="whitespace-nowrap text-[11px] text-slate-400"><Clock3 className="mr-0.5 inline h-3 w-3" />{formatDuration(chapter.duration)}</span>
                      {href && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />}
                    </>
                    return href ? <Link key={chapter.id} href={href} className={rowClass} aria-label={`Open ${chapter.title}`}>{lessonRow}</Link> : <div key={chapter.id} className={rowClass}>{lessonRow}</div>
                  })}
                </div>}
              </div>
            })}
          </div>
          {nextChapter && <div className="border-t border-slate-100 p-4">{isEnrolled ? <Button asChild className="h-10 w-full rounded-xl bg-[#2ab7dc] font-semibold text-white hover:bg-[#159fc5]"><Link href={playerHref}>{nextStatus?.tone === "paid" ? "Unlock next lesson" : "Continue learning"}</Link></Button> : <Button onClick={() => onEnroll(routeCourseId)} className="h-10 w-full rounded-xl bg-[#2ab7dc] font-semibold text-white hover:bg-[#159fc5]">Start this course</Button>}</div>}
        </CardContent>
      </Card>

      <Card className="border border-slate-200/80 bg-white shadow-sm"><CardContent className="p-5"><div className="mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#2ab7dc]" /><h2 className="font-bold text-slate-950">You&apos;ll learn</h2></div>{Array.isArray(course.learningObjectives) && course.learningObjectives.length ? <ul className="space-y-2.5">{course.learningObjectives.map((objective: string, index: number) => <li key={index} className="flex gap-2 text-sm leading-5 text-slate-600"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#20b788]" />{objective}</li>)}</ul> : <p className="text-sm leading-5 text-slate-500">The creator has not added learning outcomes yet.</p>}</CardContent></Card>

      <Card className="border border-slate-200/80 bg-white shadow-sm"><CardContent className="p-5"><div className="mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-[#2ab7dc]" /><h2 className="font-bold text-slate-950">Course resources</h2></div>{resources.length ? <div className="space-y-2">{resources.map((resource: any, index: number) => <a key={resource.id || index} href={resource.url || "#"} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition-colors hover:border-cyan-200 hover:bg-cyan-50/40"><FileText className="h-4 w-4 text-[#2ab7dc]" /><span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">{resource.titre || resource.title || "Resource"}</span><span className="text-xs font-semibold text-[#159fc5]">Open</span></a>)}</div> : <p className="text-sm leading-5 text-slate-500">No downloadable resources have been added yet.</p>}</CardContent></Card>
    </aside>
  )
}
