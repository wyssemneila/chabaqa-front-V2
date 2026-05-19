"use client"

import { useEffect, useState } from "react"
import { CreatorCoursesTabs } from "./components/creator-courses-tabs"
import { CreatorCoursesPerformance } from "./components/creator-courses-performance"
import { api, apiClient } from "@/lib/api"
import { useCommunityGuard } from "@/hooks/use-community-guard"
import {
  ModuleEmptyState,
  ModulePage,
} from "@/components/creator-dashboard"
import { BookOpen, Coins, Plus, Rocket, Users } from "lucide-react"

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
  const [searchQuery, setSearchQuery] = useState("")
  const [reloadKey, setReloadKey] = useState(0)
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
  }, [selectedCommunityId, selectedCommunity, reloadKey])

  // Community guard
  if (guard) return guard

  return (
    <ModulePage
      title="Courses"
      description={`Create and manage educational content for ${selectedCommunity?.name || "this community"}.`}
      primaryAction={{ label: "Create Course", href: "/creator/courses/new", icon: Plus }}
      metrics={[
        { title: "Courses", value: courses.length, icon: BookOpen, color: "courses" },
        { title: "Published", value: courses.filter((course) => course.isPublished).length, icon: Rocket, color: "success" },
        { title: "Enrollments", value: courses.reduce((sum, course) => sum + Number(course.students || course.enrollments || course.membersCount || 0), 0), icon: Users, color: "primary" },
        { title: "Revenue", value: revenue == null ? "..." : `${revenue.toLocaleString()} TND`, icon: Coins, color: "success" },
      ]}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search courses..."
      dataFreshnessLabel="Courses and revenue refresh when you switch communities or retry."
      density="compact"
      loading={loading}
      error={error}
      onRetry={() => {
        setError(null)
        setReloadKey((key) => key + 1)
      }}
      emptyState={!loading && !error && courses.length === 0 ? <ModuleEmptyState module="courses" /> : null}
    >
      <CreatorCoursesTabs allCourses={courses} onDeleted={handleDeleted} searchQuery={searchQuery} />
      {topCourses.length > 0 && <CreatorCoursesPerformance topCourses={topCourses} />}
    </ModulePage>
  )
}
