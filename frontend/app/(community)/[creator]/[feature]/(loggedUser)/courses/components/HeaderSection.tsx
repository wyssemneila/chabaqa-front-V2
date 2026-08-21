import { BookOpen } from "lucide-react"

interface HeaderSectionProps {
  allCourses: any[]
  userEnrollments: any[]
}

export default function HeaderSection({ allCourses, userEnrollments }: HeaderSectionProps) {
  const getCompletedChaptersCount = (enrollment: any): number => {
    if (Array.isArray(enrollment?.progress)) {
      return enrollment.progress.filter((p: any) => p?.isCompleted).length
    }
    if (Array.isArray(enrollment?.progression)) {
      return enrollment.progression.filter((p: any) => p?.isCompleted).length
    }
    if (Array.isArray(enrollment?.completedChapters)) {
      return enrollment.completedChapters.length
    }
    return 0
  }

  const completedChapters = userEnrollments.reduce(
    (acc, e) => acc + getCompletedChaptersCount(e),
    0
  )

  const matchCourse = (c: any, e: any) => {
    const eid = typeof e?.courseId === 'string' ? e.courseId : (e?.courseId?._id ?? e?.courseId?.id ?? '')
    return c?.id === eid || c?.mongoId === eid
  }

  const avgProgress = Math.round(
    userEnrollments.reduce((acc, e) => {
      const course = allCourses.find((c) => matchCourse(c, e))
      if (!course) return acc
      const totalChapters = course.sections.reduce((sAcc: any, s: any) => sAcc + s.chapters.length, 0)
      if (!totalChapters) return acc

      // Prefer detailed completion info, fallback to numeric progress percentage if provided
      const completed = getCompletedChaptersCount(e)
      if (completed > 0) {
        return acc + (completed / totalChapters) * 100
      }

      const numericProgress = typeof e?.progress === 'number' ? e.progress : undefined
      return acc + (numericProgress ?? 0)
    }, 0) / (userEnrollments.length || 1)
  )

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-courses-500 to-blue-500 rounded-xl p-4 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
        {/* Background circles */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>

        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Learning Hub</h1>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-courses-100 text-sm md:ml-4 mt-2 md:mt-0">
          Master new skills with our comprehensive course library
        </p>

        {/* Stats horizontal */}
        <div className="flex space-x-6 mt-4 md:mt-0">
          <div className="text-center">
            <div className="text-xl font-bold">{allCourses.length}</div>
            <div className="text-courses-100 text-xs">Total Courses</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{userEnrollments.length}</div>
            <div className="text-courses-100 text-xs">Enrolled</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{completedChapters}</div>
            <div className="text-courses-100 text-xs">Completed Chapters</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{avgProgress}%</div>
            <div className="text-courses-100 text-xs">Avg Progress</div>
          </div>
        </div>
      </div>
    </div>
  )
}
