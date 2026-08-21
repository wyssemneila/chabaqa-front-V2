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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  Filter,
  Clock,
  Users,
  Sparkles
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
  isPaidCourse?: boolean
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
  const [featuredFilter, setFeaturedFilter] = useState(searchParams.get("featured") || "all")
  const [priceFilter, setPriceFilter] = useState(searchParams.get("price") || "all")
  const [sortValue, setSortValue] = useState(searchParams.get("sort") || "createdAt:desc")
  const [actionCourse, setActionCourse] = useState<Course | null>(null)
  const [actionType, setActionType] = useState<"reject" | "suspend" | null>(null)
  const [actionReason, setActionReason] = useState("")
  const [actionNotes, setActionNotes] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = 20

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    try {
      const filters: any = { page, limit }
      if (searchTerm) filters.searchTerm = searchTerm
      if (statusFilter && statusFilter !== "all") filters.status = statusFilter
      if (featuredFilter !== "all") filters.isFeatured = featuredFilter === "featured"
      if (priceFilter === "free") filters.maxPrice = 0
      if (priceFilter === "paid") filters.minPrice = 1
      const [sortBy, sortOrder] = sortValue.split(":")
      filters.sortBy = sortBy
      filters.sortOrder = sortOrder
      
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
  }, [featuredFilter, page, priceFilter, searchTerm, sortValue, statusFilter, t])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCourses()
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    updateQueryParam("status", value)
  }

  const updateQueryParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value === "all") {
      params.delete(key)
    } else {
      params.set(key, value)
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

  const openCourseAction = (course: Course, type: "reject" | "suspend") => {
    setActionCourse(course)
    setActionType(type)
    setActionReason("")
    setActionNotes("")
  }

  const submitCourseAction = async () => {
    if (!actionCourse || !actionType) return
    if (actionReason.trim().length < 3) {
      toast.error("Please add a clear reason.")
      return
    }

    setActionLoading(true)
    try {
      if (actionType === "reject") {
        await adminApi.content.rejectCourse(actionCourse.id, actionReason.trim(), actionNotes.trim() || undefined)
        toast.success("Course rejected.")
      } else {
        await adminApi.content.suspendCourse(actionCourse.id, actionReason.trim(), actionNotes.trim() || undefined)
        toast.success("Course suspended.")
      }
      setActionCourse(null)
      setActionType(null)
      fetchCourses()
    } catch (error) {
      toast.error(actionType === "reject" ? "Failed to reject course." : "Failed to suspend course.")
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string, isPublished: boolean) => {
    if (status === "suspended") {
      return <Badge variant="destructive">{t("status.suspended")}</Badge>
    }
    if (status === "rejected") {
      return <Badge variant="destructive">Rejected</Badge>
    }
    if (status === "pending") {
      return <Badge variant="outline" className="text-amber-600 border-amber-200">{t("status.pending")}</Badge>
    }
    if (status === "featured" || isPublished) {
      return <Badge className="bg-primary">{t("status.featured")}</Badge>
    }
    return <Badge variant="secondary">Draft</Badge>
  }

  const stats = {
    total: courses?.total || 0,
    pending: courses?.data.filter((course) => course.status === "pending").length || 0,
    enrollments: courses?.data.reduce((sum, course) => sum + course.enrollmentCount, 0) || 0,
    featured: courses?.data.filter((course) => course.isFeatured).length || 0,
  }

  return (
    <div className="space-y-8">
      <div className="admin-section-header">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {[
          { label: "Total courses", value: stats.total, icon: BookOpen },
          { label: "Pending review", value: stats.pending, icon: Clock },
          { label: "Page enrollments", value: stats.enrollments, icon: Users },
          { label: "Featured on page", value: stats.featured, icon: Sparkles },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label} className="admin-surface rounded-2xl border-0 shadow-none">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-2xl font-semibold">{item.value}</p>
                </div>
                <span className="admin-icon-chip h-10 w-10 rounded-xl">
                  <Icon className="h-5 w-5" />
                </span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
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

            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("filterByStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allStatuses")}</SelectItem>
                  <SelectItem value="pending">{t("status.pending")}</SelectItem>
                  <SelectItem value="approved">{t("status.approved")}</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="suspended">{t("status.suspended")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={featuredFilter} onValueChange={(value) => {
                setFeaturedFilter(value)
                updateQueryParam("featured", value)
              }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Featured" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All visibility</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="standard">Not featured</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priceFilter} onValueChange={(value) => {
                setPriceFilter(value)
                updateQueryParam("price", value)
              }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All prices</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortValue} onValueChange={(value) => {
                setSortValue(value)
                updateQueryParam("sort", value)
              }}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt:desc">Newest first</SelectItem>
                  <SelectItem value="createdAt:asc">Oldest first</SelectItem>
                  <SelectItem value="titre:asc">Title A-Z</SelectItem>
                  <SelectItem value="prix:desc">Price high-low</SelectItem>
                  <SelectItem value="prix:asc">Price low-high</SelectItem>
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
                              {course.sectionCount} sections - {course.chapterCount} chapters
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{course.creator.name}</p>
                          <p className="max-w-[220px] truncate text-muted-foreground">{course.creator.email || "No email"}</p>
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
                            {course.status === "pending" && (
                              <DropdownMenuItem onClick={() => openCourseAction(course, "reject")}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleFeature(course.id, !course.isFeatured)}>
                              <Star className="h-4 w-4 mr-2" />
                              {course.isFeatured ? t("actions.unfeature") : t("actions.feature")}
                            </DropdownMenuItem>
                            {course.status !== "suspended" && (
                              <DropdownMenuItem className="text-destructive" onClick={() => openCourseAction(course, "suspend")}>
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

      <Dialog open={!!actionType} onOpenChange={(open) => {
        if (!open && !actionLoading) {
          setActionCourse(null)
          setActionType(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionType === "reject" ? "Reject course" : "Suspend course"}</DialogTitle>
            <DialogDescription>
              {actionCourse?.title
                ? `This action will update "${actionCourse.title}" and save an audit log.`
                : "This action will update the course and save an audit log."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="course-action-reason">Reason</Label>
              <Textarea
                id="course-action-reason"
                value={actionReason}
                onChange={(event) => setActionReason(event.target.value)}
                placeholder="Add the moderation reason..."
                className="min-h-24"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-action-notes">Internal notes</Label>
              <Textarea
                id="course-action-notes"
                value={actionNotes}
                onChange={(event) => setActionNotes(event.target.value)}
                placeholder="Optional notes for the admin team..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={actionLoading} onClick={() => {
              setActionCourse(null)
              setActionType(null)
            }}>
              Cancel
            </Button>
            <Button variant={actionType === "suspend" ? "destructive" : "default"} disabled={actionLoading} onClick={submitCourseAction}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionType === "reject" ? "Reject course" : "Suspend course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
