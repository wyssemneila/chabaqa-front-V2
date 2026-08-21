"use client"

import { useEffect, useMemo, useState, use } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { BookOpen, LockKeyhole, Play } from "lucide-react"
import EnrollCourseDialog from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/components/EnrollCourseDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { coursesApi } from "@/lib/api/courses.api"
import { transformCourse } from "@/lib/api/courses-community.api"
import { tokenStorage } from "@/lib/token-storage"

type CourseOverviewPageProps = {
  params: Promise<{ creator: string; feature: string; courseId: string }>
}

export default function CourseOverviewPage({ params }: CourseOverviewPageProps) {
  const { creator, feature, courseId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [course, setCourse] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false)

  const overviewHref = `/${creator}/${feature}/courses/${courseId}/overview`
  const playerHref = `/${creator}/${feature}/courses/${courseId}`

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const rawCourse = await coursesApi.getCoursById(courseId)
        const normalizedCourse = rawCourse ? transformCourse(rawCourse) : null
        if (!active) return
        setCourse(normalizedCourse)

        if (!tokenStorage.isAuthenticated()) return
        const resolvedCourseId = String(normalizedCourse?.mongoId || courseId)
        const sessionRaw = await coursesApi.getCourseSession(resolvedCourseId)
        const session = sessionRaw?.data ?? sessionRaw
        if (active) setIsEnrolled(Boolean(session?.isEnrolled))
      } catch {
        if (active) setIsEnrolled(false)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void load()
    return () => { active = false }
  }, [courseId])

  const chapters = useMemo(() => (
    Array.isArray(course?.sections)
      ? course.sections.flatMap((section: any) => (section?.chapters || []).map((chapter: any) => ({ ...chapter, sectionTitle: section.title })))
      : []
  ), [course?.sections])

  const handlePrimaryAction = () => {
    if (!tokenStorage.isAuthenticated()) {
      router.push(`/signin?redirect=${encodeURIComponent(overviewHref)}&returnUrl=${encodeURIComponent(overviewHref)}`)
      return
    }
    if (isEnrolled) {
      router.push(playerHref)
      return
    }
    setIsEnrollDialogOpen(true)
  }

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">Loading course…</div>
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <Card className="mx-auto max-w-2xl"><CardContent className="p-6"><h1 className="text-lg font-semibold">Course not found</h1><Button asChild className="mt-4" variant="outline"><Link href={`/${creator}/${feature}/courses`}>View courses</Link></Button></CardContent></Card>
      </div>
    )
  }

  const price = Number(course.price ?? 0)
  const accessMessage = searchParams.get("access") === "required"

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:py-12">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="space-y-6">
          <div>
            <p className="text-sm font-semibold text-cyan-700">Course overview</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{course.title}</h1>
            {course.description && <p className="mt-3 max-w-3xl text-slate-600">{course.description}</p>}
          </div>

          <Card><CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2"><BookOpen className="h-5 w-5 text-cyan-600" /><h2 className="font-bold text-slate-950">Course curriculum</h2></div>
            <div className="space-y-3">
              {chapters.map((chapter: any, index: number) => {
                const isPreview = chapter.isPreview === true && chapter.isPaidChapter !== true
                return <div key={chapter.id || index} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  {isPreview ? <Play className="h-4 w-4 text-cyan-600" /> : <LockKeyhole className="h-4 w-4 text-slate-400" />}
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{index + 1}. {chapter.title}</p><p className="text-xs text-slate-500">{chapter.sectionTitle}</p></div>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${isPreview ? "bg-cyan-50 text-cyan-700" : "bg-slate-100 text-slate-600"}`}>{isPreview ? "Free preview after enrollment" : chapter.isPaidChapter ? "Purchase required" : "Locked — enroll to start"}</span>
                </div>
              })}
            </div>
          </CardContent></Card>
        </section>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Unlock this course</h2>
          <p className="mt-2 text-sm text-slate-600">{price > 0 ? `${price} ${course.currency || course.devise || "TND"}` : "Free"}</p>
          {accessMessage && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Enroll in this course to unlock the learning player and its preview lessons.</p>}
          <p className="mt-4 text-sm text-slate-600">Preview-labelled lessons become available after enrollment. Individually paid lessons can require a separate purchase.</p>
          <Button className="mt-5 w-full bg-cyan-600 hover:bg-cyan-700" onClick={handlePrimaryAction}>{isEnrolled ? "Continue learning" : tokenStorage.isAuthenticated() ? "Enroll to unlock" : "Sign in to enroll"}</Button>
        </aside>
      </div>
      <EnrollCourseDialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen} course={course} isEnrolled={isEnrolled} onEnrolled={() => router.push(playerHref)} />
    </main>
  )
}
