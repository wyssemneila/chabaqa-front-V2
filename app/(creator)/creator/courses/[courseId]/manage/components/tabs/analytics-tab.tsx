"use client"

import { useEffect, useMemo, useState } from "react"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Coins, TrendingUp, BarChart3, Loader2 } from "lucide-react"
import { Course } from "@/lib/models"
import {
  creatorAnalyticsApi,
  type CourseAnalyticsDailyTrend,
  type CourseAnalyticsResponse,
} from "@/lib/api/creator-analytics.api"

interface AnalyticsTabProps {
  course: Course
  totalRevenue: number
}

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const emptyAnalytics: CourseAnalyticsResponse = {
  courseId: "",
  courseTitle: "",
  range: { from: "", to: "" },
  kpis: {
    enrollments: 0,
    revenue: 0,
    views: 0,
    starts: 0,
    completes: 0,
    completionRate: 0,
    avgWatchTimeSeconds: 0,
    totalWatchTimeSeconds: 0,
  },
  rates: {
    viewsToEnrollmentRate: 0,
    dropOffRate: 0,
    engagementScore: 0,
  },
  dailyTrend: [],
  meta: {
    completionSource: "progression",
    timezone: "UTC",
    currency: "TND",
  },
}

const formatTrendDate = (value: string): string => {
  if (!value) return "-"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString()
}

const formatRangeLabel = (from: string, to: string): string => {
  const fromDate = new Date(from)
  const toDate = new Date(to)
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return "Last 30 days"
  }
  return `${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`
}

const normalizeCourseAnalytics = (raw: any, fallbackCourseId: string): CourseAnalyticsResponse => {
  if (raw?.kpis && raw?.rates && raw?.range) {
    return {
      courseId: String(raw.courseId ?? fallbackCourseId ?? ""),
      courseTitle: String(raw.courseTitle ?? ""),
      range: {
        from: String(raw.range?.from ?? ""),
        to: String(raw.range?.to ?? ""),
      },
      kpis: {
        enrollments: toFiniteNumber(raw.kpis?.enrollments),
        revenue: toFiniteNumber(raw.kpis?.revenue),
        views: toFiniteNumber(raw.kpis?.views),
        starts: toFiniteNumber(raw.kpis?.starts),
        completes: toFiniteNumber(raw.kpis?.completes),
        completionRate: toFiniteNumber(raw.kpis?.completionRate),
        avgWatchTimeSeconds: toFiniteNumber(raw.kpis?.avgWatchTimeSeconds),
        totalWatchTimeSeconds: toFiniteNumber(raw.kpis?.totalWatchTimeSeconds),
      },
      rates: {
        viewsToEnrollmentRate: toFiniteNumber(raw.rates?.viewsToEnrollmentRate),
        dropOffRate: toFiniteNumber(raw.rates?.dropOffRate),
        engagementScore: toFiniteNumber(raw.rates?.engagementScore),
      },
      dailyTrend: Array.isArray(raw.dailyTrend)
        ? raw.dailyTrend.map((day: any) => ({
            date: String(day?.date ?? ""),
            views: toFiniteNumber(day?.views),
            starts: toFiniteNumber(day?.starts),
            completes: toFiniteNumber(day?.completes),
            watchTimeSeconds: toFiniteNumber(day?.watchTimeSeconds),
          }))
        : [],
      meta: {
        completionSource: "progression",
        timezone: String(raw.meta?.timezone ?? "UTC"),
        currency: String(raw.meta?.currency ?? "TND"),
      },
    }
  }

  const legacyDailyTrend = Array.isArray(raw?.dailyTrend)
    ? raw.dailyTrend.map((day: any) => ({
        date: String(day?.date ?? ""),
        views: toFiniteNumber(day?.views),
        starts: toFiniteNumber(day?.starts),
        completes: toFiniteNumber(day?.completes),
        watchTimeSeconds: toFiniteNumber(day?.watchTime ?? day?.watchTimeSeconds),
      }))
    : []

  const fallbackRevenue = toFiniteNumber(raw?.totalRevenue)
  const fallbackEnrollments = toFiniteNumber(raw?.enrollmentCount)

  return {
    ...emptyAnalytics,
    courseId: String(raw?.courseId ?? fallbackCourseId ?? ""),
    courseTitle: String(raw?.courseTitle ?? ""),
    kpis: {
      enrollments: fallbackEnrollments,
      revenue: fallbackRevenue,
      views: toFiniteNumber(raw?.views),
      starts: toFiniteNumber(raw?.starts),
      completes: toFiniteNumber(raw?.completes),
      completionRate: toFiniteNumber(raw?.completionRate),
      avgWatchTimeSeconds: toFiniteNumber(raw?.averageWatchTime),
      totalWatchTimeSeconds: legacyDailyTrend.reduce(
        (sum: number, day: CourseAnalyticsDailyTrend) => sum + day.watchTimeSeconds,
        0,
      ),
    },
    rates: {
      viewsToEnrollmentRate:
        toFiniteNumber(raw?.views) > 0 ? (fallbackEnrollments / toFiniteNumber(raw?.views)) * 100 : 0,
      dropOffRate:
        toFiniteNumber(raw?.completionRate) > 0 ? 100 - toFiniteNumber(raw?.completionRate) : 0,
      engagementScore: toFiniteNumber(raw?.views) > 0 ? (toFiniteNumber(raw?.starts) / toFiniteNumber(raw?.views)) * 100 : 0,
    },
    dailyTrend: legacyDailyTrend,
    meta: {
      completionSource: "progression",
      timezone: "UTC",
      currency: "TND",
    },
  }
}

export function AnalyticsTab({ course, totalRevenue }: AnalyticsTabProps) {
  const [analytics, setAnalytics] = useState<CourseAnalyticsResponse>(emptyAnalytics)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await creatorAnalyticsApi.getCourseAnalytics(String(course.id))
        const raw = (response as any)?.data ?? response

        if ((raw as any)?.error) {
          throw new Error(String((raw as any).error))
        }

        setAnalytics(normalizeCourseAnalytics(raw, String(course.id || "")))
      } catch (err: any) {
        console.error("Failed to fetch analytics:", err)
        setAnalytics(normalizeCourseAnalytics({}, String(course.id || "")))
        setError(err?.message || "Failed to load analytics data")
      } finally {
        setLoading(false)
      }
    }

    if (course?.id) {
      void fetchAnalytics()
    }
  }, [course.id])

  const metrics = useMemo(() => {
    const revenue = analytics.kpis.revenue > 0 ? analytics.kpis.revenue : toFiniteNumber(totalRevenue)
    return {
      revenue,
      avgWatchTimeMinutes: analytics.kpis.avgWatchTimeSeconds / 60,
      totalWatchTimeHours: analytics.kpis.totalWatchTimeSeconds / 3600,
      revenuePerEnrollment: analytics.kpis.enrollments > 0 ? revenue / analytics.kpis.enrollments : 0,
    }
  }, [analytics, totalRevenue])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading analytics...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <EnhancedCard>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>We could not load full analytics right now.</p>
              <p className="text-sm mt-2">Showing available course metrics. You can refresh to try again.</p>
            </div>
          </CardContent>
        </EnhancedCard>
      )}

      <p className="text-sm text-muted-foreground">Period: {formatRangeLabel(analytics.range.from, analytics.range.to)}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <EnhancedCard>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.kpis.enrollments}</p>
                <p className="text-sm text-muted-foreground">Total Enrollments</p>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Coins className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.revenue.toFixed(2)} {analytics.meta.currency}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.kpis.completionRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.rates.engagementScore.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Engagement Score</p>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <EnhancedCard>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{analytics.kpis.views}</p>
              <p className="text-sm text-muted-foreground">Total Views</p>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{analytics.kpis.starts}</p>
              <p className="text-sm text-muted-foreground">Course Starts</p>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{metrics.avgWatchTimeMinutes.toFixed(0)}m</p>
              <p className="text-sm text-muted-foreground">Avg. Watch Time</p>
            </div>
          </CardContent>
        </EnhancedCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnhancedCard>
          <CardHeader>
            <CardTitle>Daily Engagement Trends</CardTitle>
            <CardDescription>Recent 7-day activity for this course</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.dailyTrend.length > 0 ? (
              <div className="space-y-3">
                {analytics.dailyTrend.slice(-7).map((day, index) => (
                  <div key={`${day.date}-${index}`} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{formatTrendDate(day.date)}</span>
                    <div className="flex items-center space-x-4 text-sm">
                      <span>{day.views} views</span>
                      <span>{day.starts} starts</span>
                      <span>{day.completes} completes</span>
                      {day.watchTimeSeconds > 0 && <span>{Math.round(day.watchTimeSeconds / 60)}m watched</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                <p>No trend data yet. Activity will appear once learners interact with this course.</p>
              </div>
            )}
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardHeader>
            <CardTitle>Course Performance Snapshot</CardTitle>
            <CardDescription>Core conversion and retention indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Views to Enrollment Rate</span>
                <span className="text-sm font-medium">{analytics.rates.viewsToEnrollmentRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Student Drop-off Rate</span>
                <span className="text-sm font-medium">{analytics.rates.dropOffRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Revenue per Enrollment</span>
                <span className="text-sm font-medium">{metrics.revenuePerEnrollment.toFixed(2)} {analytics.meta.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Watch Time</span>
                <span className="text-sm font-medium">{metrics.totalWatchTimeHours.toFixed(1)}h</span>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>
      </div>
    </div>
  )
}
