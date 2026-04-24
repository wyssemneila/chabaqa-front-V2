"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { localizeHref, stripLocaleFromPath } from "@/lib/i18n/client"
import { adminApi } from "@/lib/api/admin-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Search, 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Star,
  AlertCircle,
  Loader2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react"
import { toast } from "sonner"

interface Course {
  id: string
  title: string
  description: string
  thumbnail?: string
  status: string
  creator: { id: string; name: string; email: string }
  community: { id: string; name: string }
  price: number
  currency: string
  enrollmentCount: number
  sectionCount: number
  chapterCount: number
  isPublished: boolean
  category?: string
  level?: string
  isFeatured: boolean
  createdAt: string
}

interface PaginatedCourses {
  data: Course[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export default function CoursesManagementPage() {
  const t = useTranslations("admin.content.courses")
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const internalPath = stripLocaleFromPath(pathname)

  const [courses, setCourses] = useState<PaginatedCourses | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all")

  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = 20

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    try {
      const filters: any = { page, limit }
      if (searchTerm) filters.searchTerm = searchTerm
      if (statusFilter && statusFilter !== "all") filters.status = statusFilter
      
      const response = await adminApi.content.getCourses(filters)
      if (response.success) {
        setCourses(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error)
      toast.error(t("fetchError"))
    } finally {
      setLoading(false)
    }
  }, [page, searchTerm, statusFilter, t])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCourses()
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    const params = new URLSearchParams(searchParams)
    if (value === "all") {
      params.delete("status")
    } else {
      params.set("status", value)
    }
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleApprove = async (courseId: string) => {
    try {
      await adminApi.content.approveCourse(courseId)
      toast.success(t("approveSuccess"))
      fetchCourses()
    } catch (error) {
      toast.error(t("approveError"))
    }
  }

  const handleFeature = async (courseId: string, featured: boolean) => {
    try {
      await adminApi.content.featureCourse(courseId, featured)
      toast.success(featured ? t("featureSuccess") : t("unfeatureSuccess"))
      fetchCourses()
    } catch (error) {
      toast.error(t("featureError"))
    }
  }

  const getStatusBadge = (status: string, isPublished: boolean) => {
    if (!isPublished || status === "suspended") {
      return <Badge variant="destructive">{t("status.suspended")}</Badge>
    }
    if (status === "pending") {
      return <Badge variant="outline" className="text-amber-600 border-amber-200">{t("status.pending")}</Badge>
    }
    if (status === "featured") {
      return <Badge className="bg-primary">{t("status.featured")}</Badge>
    }
    return <Badge variant="secondary">{t("status.approved")}</Badge>
  }

  return (
    <div className="space-y-8">
      <div className="admin-section-header">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
        </div>
      </div>

      <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </form>

            <div className="flex gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("filterByStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allStatuses")}</SelectItem>
                  <SelectItem value="pending">{t("status.pending")}</SelectItem>
                  <SelectItem value="approved">{t("status.approved")}</SelectItem>
                  <SelectItem value="featured">{t("status.featured")}</SelectItem>
                  <SelectItem value="suspended">{t("status.suspended")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="admin-table-shell border-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : courses?.data.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center text-center p-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">{t("noCourses")}</h3>
              <p className="text-muted-foreground">{t("noCoursesDescription")}</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.course")}</TableHead>
                    <TableHead>{t("table.creator")}</TableHead>
                    <TableHead>{t("table.community")}</TableHead>
                    <TableHead>{t("table.price")}</TableHead>
                    <TableHead>{t("table.enrollments")}</TableHead>
                    <TableHead>{t("table.status")}</TableHead>
                    <TableHead className="w-[100px]">{t("table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses?.data.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {course.thumbnail && (
                            <img 
                              src={course.thumbnail} 
                              alt={course.title}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <Link 
                              href={localizeHref(pathname, `/admin/content/courses/${course.id}`)}
                              className="font-medium hover:underline"
                            >
                              {course.title}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {course.sectionCount} sections • {course.chapterCount} chapters
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{course.creator.name}</p>
                          <p className="text-muted-foreground">{course.creator.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{course.community.name}</TableCell>
                      <TableCell>
                        {course.price > 0 ? (
                          <span className="font-medium">{course.price} {course.currency}</span>
                        ) : (
                          <Badge variant="outline">{t("free")}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{course.enrollmentCount}</TableCell>
                      <TableCell>{getStatusBadge(course.status, course.isPublished)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={localizeHref(pathname, `/admin/content/courses/${course.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                {t("actions.view")}
                              </Link>
                            </DropdownMenuItem>
                            {course.status === "pending" && (
                              <DropdownMenuItem onClick={() => handleApprove(course.id)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {t("actions.approve")}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleFeature(course.id, !course.isFeatured)}>
                              <Star className="h-4 w-4 mr-2" />
                              {course.isFeatured ? t("actions.unfeature") : t("actions.feature")}
                            </DropdownMenuItem>
                            {course.status !== "suspended" && (
                              <DropdownMenuItem className="text-destructive">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                {t("actions.suspend")}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {courses && courses.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {t("showing")} {(page - 1) * limit + 1} - {Math.min(page * limit, courses.total)} {t("of")} {courses.total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!courses.hasPrevPage}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams)
                        params.set("page", (page - 1).toString())
                        router.push(`${pathname}?${params.toString()}`)
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!courses.hasNextPage}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams)
                        params.set("page", (page + 1).toString())
                        router.push(`${pathname}?${params.toString()}`)
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
