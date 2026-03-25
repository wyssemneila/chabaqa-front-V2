"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import { localizeHref, stripLocaleFromPath } from "@/lib/i18n/client"
import { adminApi } from "@/lib/api/admin-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  BookOpen, 
  Users, 
  CheckCircle, 
  XCircle, 
  Star,
  AlertCircle,
  Loader2,
  Calendar,
  DollarSign,
  Layers,
  PlayCircle,
  FileText
} from "lucide-react"
import { toast } from "sonner"

interface Course {
  id: string
  title: string
  description: string
  thumbnail?: string
  status: string
  creator: { id: string; name: string; email: string; avatar?: string }
  community: { id: string; name: string; slug: string }
  price: number
  currency: string
  isPaidCourse: boolean
  enrollmentCount: number
  sectionCount: number
  chapterCount: number
  isPublished: boolean
  category?: string
  level?: string
  sequentialProgression: boolean
  averageRating: number
  ratingCount: number
  isFeatured: boolean
  createdAt: string
  updatedAt: string
  sections: Array<{
    id: string
    title: string
    description?: string
    order: number
    chapters: Array<{
      id: string
      title: string
      content: string
      videoUrl?: string
      duration?: number
      order: number
      isPreview: boolean
      isPaidChapter: boolean
      prix?: number
      notes?: string
    }>
  }>
  resources: Array<{
    id: string
    title: string
    type: string
    url: string
    description: string
    order: number
  }>
  learningObjectives?: string[]
  requirements?: string[]
  notes?: string
}

export default function CourseDetailPage() {
  const t = useTranslations("admin.content.courses.detail")
  const params = useParams()
  const pathname = usePathname()
  const courseId = params.id as string
  const internalPath = stripLocaleFromPath(pathname)

  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await adminApi.content.getCourseById(courseId)
        if (response.success) {
          setCourse(response.data)
        }
      } catch (error) {
        console.error("Failed to fetch course:", error)
        toast.error(t("fetchError"))
      } finally {
        setLoading(false)
      }
    }

    fetchCourse()
  }, [courseId, t])

  const handleApprove = async () => {
    try {
      await adminApi.content.approveCourse(courseId)
      toast.success(t("approveSuccess"))
      const response = await adminApi.content.getCourseById(courseId)
      if (response.success) setCourse(response.data)
    } catch (error) {
      toast.error(t("approveError"))
    }
  }

  const handleFeature = async () => {
    try {
      const newFeatured = !course?.isFeatured
      await adminApi.content.featureCourse(courseId, newFeatured)
      toast.success(newFeatured ? t("featureSuccess") : t("unfeatureSuccess"))
      const response = await adminApi.content.getCourseById(courseId)
      if (response.success) setCourse(response.data)
    } catch (error) {
      toast.error(t("featureError"))
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center p-8">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">{t("notFound")}</h3>
        <p className="text-muted-foreground">{t("notFoundDescription")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="admin-section-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={localizeHref(pathname, "/admin/content/courses")}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {course.status === "pending" && (
            <Button onClick={handleApprove}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {t("actions.approve")}
            </Button>
          )}
          <Button variant={course.isFeatured ? "default" : "outline"} onClick={handleFeature}>
            <Star className="h-4 w-4 mr-2" />
            {course.isFeatured ? t("actions.unfeature") : t("actions.feature")}
          </Button>
          {course.status !== "suspended" && (
            <Button variant="destructive">
              <AlertCircle className="h-4 w-4 mr-2" />
              {t("actions.suspend")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
            {course.thumbnail && (
              <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                <img 
                  src={course.thumbnail} 
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader>
              <CardTitle>{t("overview.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{course.description}</p>
              
              <div className="flex flex-wrap gap-2">
                {course.category && (
                  <Badge variant="secondary">{course.category}</Badge>
                )}
                {course.level && (
                  <Badge variant="outline">{course.level}</Badge>
                )}
                <Badge variant={course.isPublished ? "default" : "destructive"}>
                  {course.isPublished ? t("overview.published") : t("overview.draft")}
                </Badge>
                {course.isFeatured && (
                  <Badge className="bg-primary">{t("overview.featured")}</Badge>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {course.price > 0 
                      ? `${course.price} ${course.currency}` 
                      : t("overview.free")
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <span>{course.sectionCount} {t("overview.sections")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 text-muted-foreground" />
                  <span>{course.chapterCount} {t("overview.chapters")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <span>{course.averageRating.toFixed(1)} ({course.ratingCount} {t("overview.ratings")})</span>
                </div>
              </div>

              {course.learningObjectives && course.learningObjectives.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">{t("overview.learningObjectives")}</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {course.learningObjectives.map((objective, index) => (
                        <li key={index}>{objective}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {course.requirements && course.requirements.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">{t("overview.requirements")}</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {course.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="sections" className="w-full">
            <TabsList>
              <TabsTrigger value="sections">{t("tabs.sections")}</TabsTrigger>
              <TabsTrigger value="resources">{t("tabs.resources")}</TabsTrigger>
            </TabsList>
            <TabsContent value="sections">
              <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
                <CardHeader>
                  <CardTitle>{t("sections.title")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {course.sections.map((section, index) => (
                    <div key={section.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <h4 className="font-medium">{section.title}</h4>
                        <span className="text-sm text-muted-foreground">
                          ({section.chapters.length} {t("sections.chapters")})
                        </span>
                      </div>
                      {section.description && (
                        <p className="text-sm text-muted-foreground mb-3">{section.description}</p>
                      )}
                      <div className="space-y-2">
                        {section.chapters.map((chapter, chapterIndex) => (
                          <div key={chapter.id} className="flex items-center gap-3 text-sm pl-4 py-2 bg-muted/50 rounded">
                            <PlayCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="flex-1">{chapterIndex + 1}. {chapter.title}</span>
                            {chapter.isPreview && (
                              <Badge variant="outline" className="text-xs">{t("sections.preview")}</Badge>
                            )}
                            {chapter.duration && (
                              <span className="text-xs text-muted-foreground">{Math.round(chapter.duration / 60)}m</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="resources">
              <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
                <CardHeader>
                  <CardTitle>{t("resources.title")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {course.resources.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">{t("resources.empty")}</p>
                  ) : (
                    <div className="space-y-2">
                      {course.resources.map((resource) => (
                        <div key={resource.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="font-medium">{resource.title}</p>
                            <p className="text-sm text-muted-foreground">{resource.type} • {resource.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
            <CardHeader>
              <CardTitle>{t("creator.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {course.creator.avatar ? (
                  <img 
                    src={course.creator.avatar} 
                    alt={course.creator.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-medium text-primary">
                      {course.creator.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium">{course.creator.name}</p>
                  <p className="text-sm text-muted-foreground">{course.creator.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
            <CardHeader>
              <CardTitle>{t("community.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{course.community.name}</p>
                  <Link 
                    href={localizeHref(pathname, `/admin/communities/${course.community.id}`)}
                    className="text-sm text-primary hover:underline"
                  >
                    {t("community.viewCommunity")}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
            <CardHeader>
              <CardTitle>{t("stats.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{t("stats.enrollments")}</span>
                </div>
                <span className="font-medium">{course.enrollmentCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{t("stats.created")}</span>
                </div>
                <span className="font-medium">
                  {new Date(course.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{t("stats.updated")}</span>
                </div>
                <span className="font-medium">
                  {new Date(course.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" asChild>
            <Link href={localizeHref(pathname, `/admin/content/courses/${courseId}/enrollments`)}>
              <Users className="h-4 w-4 mr-2" />
              {t("viewEnrollments")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
