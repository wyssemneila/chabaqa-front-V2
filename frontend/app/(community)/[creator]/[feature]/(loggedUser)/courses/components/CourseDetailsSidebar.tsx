import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, 
  Award, 
  FileText, 
  Download, 
  Coins, 
  Lock, 
  CheckCircle, 
  PlayCircle, 
  LinkIcon
} from "lucide-react"
import Link from "next/link"
import { idsMatch, resolveCourseRouteId } from "@/lib/utils/course-id"

function normalizeCourseId(value: unknown): string {
  if (!value) return ""
  if (typeof value === "string") return value
  if (typeof value === "object") {
    const maybeRecord = value as Record<string, unknown>
    const nestedId = maybeRecord._id ?? maybeRecord.id ?? maybeRecord.courseId
    if (typeof nestedId === "string") return nestedId
    if (typeof nestedId === "object" && nestedId) {
      const nestedRecord = nestedId as Record<string, unknown>
      if (typeof nestedRecord._id === "string") return nestedRecord._id
      if (typeof nestedRecord.id === "string") return nestedRecord.id
    }
  }
  return String(value)
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

export default function CourseDetailsSidebar({
  selectedCourse,
  allCourses,
  userEnrollments,
  getCoursePricing,
  creatorSlug,
  slug,
  onEnroll
}: CourseDetailsSidebarProps) {
  if (!selectedCourse) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="text-center py-8">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold mb-2">Select a Course</h3>
            <p className="text-sm text-muted-foreground">
              Click on any course to view its content and details
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const course = allCourses.find((c) => idsMatch(c, selectedCourse))
  const routeCourseId = resolveCourseRouteId(course ?? selectedCourse)
  const isEnrolled = userEnrollments.some((e) => idsMatch(e?.courseId, course ?? selectedCourse))
  const pricing = course ? getCoursePricing(course) : null

  if (!course) return null

  return (
    <div className="space-y-6">
      {isEnrolled && (
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <Button className="w-full" asChild>
              <Link href={`/${creatorSlug}/${slug}/courses/${routeCourseId}`}>
                <PlayCircle className="h-4 w-4 mr-2" />
                Continue
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-courses-500" />
            Course Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {course.sections.map((section: any) => (
            <div key={section.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{section.title}</h4>
                <Badge variant="secondary" className="text-xs">
                  {section.chapters.length} chapters
                </Badge>
              </div>
              <div className="space-y-1 ml-4">
                {section.chapters.map((chapter: any) => (
                  <div key={chapter.id} className="flex items-center space-x-2 text-sm py-1">
                    {isEnrolled || chapter.isPreview ? (
                      <PlayCircle className="h-4 w-4 text-courses-500" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span
                      className={isEnrolled || chapter.isPreview ? "" : "text-muted-foreground"}
                    >
                      {chapter.title}
                    </span>
                    {chapter.isPreview && (
                      <Badge variant="outline" className="text-xs">
                        Preview
                      </Badge>
                    )}
                    {chapter.price && chapter.price > 0 && !isEnrolled && (
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                        {chapter.price} TND
                      </Badge>
                    )}
                    {chapter.duration && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {Math.floor(chapter.duration / 60)}
                        {chapter.duration % 60 > 0 && `:${(chapter.duration % 60).toString().padStart(2, "0")}`}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Award className="h-5 w-5 mr-2 text-yellow-500" />
            What You&apos;ll Learn
          </CardTitle>
        </CardHeader>
        <CardContent>
          {course.learningObjectives && course.learningObjectives.length > 0 ? (
            <ul className="space-y-3">
              {course.learningObjectives.map((objective: string, index: number) => (
                <li key={index} className="flex items-start text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-3">
              {[
                "Master the core concepts and advanced techniques",
                "Build real-world projects from scratch",
                "Best practices and industry standards",
                "Troubleshooting and debugging skills"
              ].map((objective, index) => (
                <li key={index} className="flex items-start text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <FileText className="h-5 w-5 mr-2 text-blue-500" />
            Course Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {course.ressources && course.ressources.length > 0 ? (
            <div className="space-y-3">
              {course.ressources.map((resource: any, index: number) => (
                <div key={resource.id || index} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-8 w-8 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                      {resource.type === 'video' ? <PlayCircle className="h-4 w-4 text-blue-600" /> : 
                       resource.type === 'link' ? <LinkIcon className="h-4 w-4 text-blue-600" /> :
                       <FileText className="h-4 w-4 text-blue-600" />}
                    </div>
                    <span className="text-sm font-medium truncate">
                      {resource.titre || resource.title || `Resource ${index + 1}`}
                    </span>
                  </div>
                  {resource.url && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild disabled={!isEnrolled}>
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        {resource.type === 'link' || resource.type === 'lien' ? 
                          <Link className="h-4 w-4" href={""} /> : 
                          <Download className="h-4 w-4" />
                        }
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Source Code</span>
                    <span className="text-xs text-muted-foreground">Complete project files</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8" disabled={!isEnrolled}>
                  Download
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Course Slides</span>
                    <span className="text-xs text-muted-foreground">PDF presentation decks</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8" disabled={!isEnrolled}>
                  View
                </Button>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md bg-yellow-50 flex items-center justify-center flex-shrink-0">
                    <Award className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Certificate</span>
                    <span className="text-xs text-muted-foreground">Upon completion</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8" disabled={!isEnrolled}>
                  View
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {pricing && pricing.type === "freemium" && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Coins className="h-5 w-5 mr-2 text-blue-500" />
              Premium Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              This course includes {pricing.paidChapters} premium chapters with advanced content.
            </p>
            <div className="space-y-2">
              {course.sections
                .flatMap((s: any) => s.chapters)
                .filter((c: any) => c.price && c.price > 0)
                .slice(0, 3)
                .map((chapter: any) => (
                  <div key={chapter.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <Lock className="h-3 w-3 mr-2 text-orange-500" />
                      {chapter.title}
                    </span>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700">
                      {chapter.price} TND
                    </Badge>
                  </div>
                ))}
            </div>
            {!isEnrolled && (
              <Button
                size="sm"
                className="w-full mt-4"
                onClick={() => onEnroll(routeCourseId)}
              >
                Unlock Premium Content
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
