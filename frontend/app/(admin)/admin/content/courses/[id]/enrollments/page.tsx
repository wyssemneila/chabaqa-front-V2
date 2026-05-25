"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ChevronLeft, ChevronRight, GraduationCap, Loader2, UserRound } from "lucide-react"
import { toast } from "sonner"
import { adminApi } from "@/lib/api/admin-api"
import { localizeHref } from "@/lib/i18n/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Enrollment {
  id: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  enrolledAt?: string
  completedAt?: string
  isActive: boolean
  progress: number
}

interface PaginatedEnrollments {
  data: Enrollment[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export default function CourseEnrollmentsPage() {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = params.id as string
  const page = Number(searchParams.get("page") || "1")
  const limit = 20

  const [enrollments, setEnrollments] = useState<PaginatedEnrollments | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchEnrollments = useCallback(async () => {
    setLoading(true)
    try {
      const response = await adminApi.content.getCourseEnrollments(courseId, { page, limit })
      if (response.success) {
        setEnrollments(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch course enrollments:", error)
      toast.error("Failed to load course enrollments.")
    } finally {
      setLoading(false)
    }
  }, [courseId, page])

  useEffect(() => {
    fetchEnrollments()
  }, [fetchEnrollments])

  const goToPage = (nextPage: number) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set("page", String(nextPage))
    router.push(`${pathname}?${nextParams.toString()}`)
  }

  return (
    <div className="space-y-8">
      <div className="admin-section-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={localizeHref(pathname, `/admin/content/courses/${courseId}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Course enrollments</h1>
            <p className="mt-2 text-muted-foreground">Review learners, progress, and completion status.</p>
          </div>
        </div>
      </div>

      <Card className="admin-surface rounded-3xl border-0 shadow-none">
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total enrollments</p>
            <p className="mt-1 text-3xl font-semibold">{enrollments?.total || 0}</p>
          </div>
          <span className="admin-icon-chip h-12 w-12 rounded-2xl">
            <GraduationCap className="h-6 w-6" />
          </span>
        </CardContent>
      </Card>

      <Card className="admin-table-shell border-0">
        <CardHeader>
          <CardTitle>Learners</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !enrollments || enrollments.data.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
              <UserRound className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No enrollments yet</h3>
              <p className="text-muted-foreground">This course has no learners to review.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Learner</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.data.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={enrollment.user.avatar} alt={enrollment.user.name} />
                            <AvatarFallback>{(enrollment.user.name || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{enrollment.user.name || "Unknown learner"}</p>
                            <p className="text-sm text-muted-foreground">{enrollment.user.email || "No email"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{Math.round(enrollment.progress || 0)}%</TableCell>
                      <TableCell>
                        <Badge variant={enrollment.isActive ? "secondary" : "outline"}>
                          {enrollment.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell>
                        {enrollment.completedAt ? new Date(enrollment.completedAt).toLocaleDateString() : "Not completed"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {enrollments.totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-6 py-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1} - {Math.min(page * limit, enrollments.total)} of {enrollments.total}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={!enrollments.hasPrevPage} onClick={() => goToPage(page - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={!enrollments.hasNextPage} onClick={() => goToPage(page + 1)}>
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
