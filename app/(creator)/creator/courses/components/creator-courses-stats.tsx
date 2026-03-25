"use client"

import { MetricCard } from "@/components/ui/metric-card"
import { BookOpen, Eye, Users, Coins } from "lucide-react"
import { Course } from "@/lib/models" // Make sure this type is properly defined

interface CreatorCoursesStatsProps {
  allCourses: Course[]
  revenue?: number | null
}

export function CreatorCoursesStats({ allCourses, revenue }: CreatorCoursesStatsProps) {
  const totalCourses = allCourses.length
  const publishedCourses = allCourses.filter((c: any) => c.isPublished).length
  const totalEnrollments = allCourses.reduce((acc: number, c: any) => acc + (Array.isArray(c.enrollments) ? c.enrollments.length : (c.enrolledCount ?? 0)), 0)
  const stats = [
    {
      title: "Total Courses",
      value: totalCourses,
      icon: BookOpen,
      color: "courses" as const,
    },
    {
      title: "Published Courses",
      value: publishedCourses,
      icon: Eye,
      color: "success" as const,
    },
    {
      title: "Total Enrollments",
      value: totalEnrollments,
      icon: Users,
      color: "primary" as const,
    },
    {
      title: "Course Revenue",
      value: typeof revenue === "number" && Number.isFinite(revenue)
        ? `${Number(revenue).toLocaleString()} TND`
        : "N/A",
      icon: Coins,
      color: "success" as const,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <MetricCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
        />
      ))}
    </div>
  )
}
