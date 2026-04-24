"use client"

import { useEffect, useState } from "react"
import { CreatorCoursesHeader } from "./components/creator-courses-header"
import { CreatorCoursesStats } from "./components/creator-courses-stats"
import { CreatorCoursesSearch } from "./components/creator-courses-search"
import { CreatorCoursesTabs } from "./components/creator-courses-tabs"
import { CreatorCoursesPerformance } from "./components/creator-courses-performance"
import { api, apiClient } from "@/lib/api"
import { useCommunityGuard } from "@/hooks/use-community-guard"
import {
  PageShell,
  PageHeader,
  PageState,
  ModuleEmptyState,
  TOAST_MESSAGES,
} from "@/components/creator-dashboard"

export default function CreatorCoursesPage() {
  const {
    guard,
    selectedCommunity,
    selectedCommunityId,
    isLoading: communityLoading,
  } = useCommunityGuard()

  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [topCourses, setTopCourses] = useState<any[]>([])
  const [revenue, setRevenue] = useState<number | null>(null)

  const handleDeleted = (courseId: string) => {
    setCourses((prev) => prev.filter((c) => String(c._id || c.mongoId || c.id) !== String(courseId)))
  }

  useEffect(() => {
    if (!selectedCommunityId) return

    const load = async () => {
      setLoading(true)
      setError(null)
      setRevenue(null)
      setTopCourses([])
      try {
        const me = await api.auth.me().catch(() => null as any)
        const user = me?.data || (me as any)?.user || null
        if (!user) {
          setCourses([])
          return
        }

        const res = await apiClient.get<any>(`/cours/user/created`, { limit: 100, communityId: selectedCommunityId }).catch(() => null as any)
        const list = res?.data?.courses || res?.courses || res?.data || []
        setCourses(Array.isArray(list) ? list : [])

        // Top courses from analytics
        const now = new Date()
        const to = now.toISOString()
        const from = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString()
        const topAgg = await api.creatorAnalytics.getCourses({ from, to, communityId: selectedCommunityId }).catch(() => null as any)

        const raw = topAgg?.data?.byCourse || topAgg?.byCourse || topAgg?.data?.items || topAgg?.items || []
        const byCourse = Array.isArray(raw) ? raw : []
        setTopCourses(
          byCourse.slice(0, 3).map((x: any) => ({
            id: x.contentId || x._id || x.id,
            title: x.title || x.name || `Course ${String((x.contentId || x._id || x.id || '')).slice(-6)}`,
            enrollments: Number(x.enrollments ?? x.completes ?? x.starts ?? 0),
            revenue: Number(x.revenue ?? 0),
            rating: Number(x.avgRating ?? 0),
          })),
        )

        const totalRevenue = byCourse.reduce((sum: number, item: any) => sum + Number(item.revenue ?? 0), 0)
        setRevenue(Number.isFinite(totalRevenue) ? totalRevenue : null)
      } catch (e: any) {
        setError(e?.message || "Failed to load courses")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedCommunityId, selectedCommunity])

  // Community guard
  if (guard) return guard

  if (loading) return <PageState variant="loading" compact />

  if (error) {
    return <PageState variant="error" description={error} onRetry={() => { setError(null); setLoading(true) }} />
  }

  if (courses.length === 0) {
    return (
      <PageShell>
        <PageHeader
          title="Courses"
          breadcrumbs={[{ label: "Dashboard", href: "/creator/dashboard" }, { label: "Courses" }]}
        />
        <ModuleEmptyState module="courses" />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <CreatorCoursesHeader />
      <CreatorCoursesStats allCourses={courses} revenue={revenue} />
      <CreatorCoursesSearch />
      <CreatorCoursesTabs allCourses={courses} onDeleted={handleDeleted} />
      {topCourses.length > 0 && <CreatorCoursesPerformance topCourses={topCourses} />}
    </PageShell>
  )
}
