
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Star } from "lucide-react"

interface CourseLegacy {
  id: string
  title: string
  price: number
  enrollments: Array<any>
}

type TopCourse = { id: string; title: string; enrollments: number; revenue?: number; rating?: number }

interface CreatorCoursesPerformanceProps {
  allCourses?: CourseLegacy[]
  topCourses?: TopCourse[]
}

export function CreatorCoursesPerformance({ allCourses = [], topCourses = [] }: CreatorCoursesPerformanceProps) {
  const toFiniteNumber = (value: unknown): number | undefined => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  const items: TopCourse[] = topCourses.length > 0
    ? topCourses
    : (allCourses || []).slice(0,3).map((c) => ({
        id: c.id,
        title: c.title,
        enrollments: Array.isArray(c.enrollments) ? c.enrollments.length : 0,
        revenue: c.price * (Array.isArray(c.enrollments) ? c.enrollments.length : 0),
      }))

  if (items.length === 0) return null

  return (
    <EnhancedCard variant="glass" className="bg-gradient-to-r from-courses-50 to-blue-50 border-courses-200">
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-courses-600" />
          Course Performance Overview
        </CardTitle>
        <CardDescription>Your most popular courses this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((course, index) => (
            <div key={course.id} className="flex items-center space-x-4 p-4 bg-white/50 rounded-lg">
              <div className="flex-shrink-0">
                <Badge
                  variant="secondary"
                  className={`w-8 h-8 rounded-full p-0 flex items-center justify-center ${
                    index === 0
                      ? "bg-yellow-100 text-yellow-800"
                      : index === 1
                        ? "bg-gray-100 text-gray-800"
                        : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {index + 1}
                </Badge>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{course.title}</h4>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                  <span>{course.enrollments} enrollments</span>
                  <span>${Number(course.revenue ?? 0).toLocaleString()} revenue</span>
                  {typeof toFiniteNumber(course.rating) === "number" && (
                    <div className="flex items-center">
                      <Star className="h-3 w-3 mr-1 text-yellow-500" />
                      {toFiniteNumber(course.rating)?.toFixed(1)} rating
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </EnhancedCard>
  )
}
