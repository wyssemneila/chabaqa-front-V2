
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BookOpen, Eye, Edit, Trash2, MoreHorizontal, Star, Users, PlayCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface CourseCardProps {
  course: any
  onDeleted?: (courseId: string) => void
}

export function CourseCard({ course, onDeleted }: CourseCardProps) {
  const { toast } = useToast()
  const id = course.id || course._id
  const deleteId = course._id || course.mongoId || course.id
  const sectionsCount: number = Array.isArray(course.sections) ? course.sections.length : (course.sectionsCount ?? 0)
  const chaptersTotal: number = Array.isArray(course.sections)
    ? course.sections.reduce((acc: number, s: any) => acc + (Array.isArray(s.chapitres) ? s.chapitres.length : (Array.isArray(s.chapters) ? s.chapters.length : 0)), 0)
    : (course.chaptersCount ?? 0)

  const priceNumber: number = typeof (course.prix || course.price) === 'number'
    ? (course.prix || course.price)
    : (course.priceType === 'free' ? 0 : Number((course.prix || course.price) ?? 0))

  const enrollmentsCount: number = Array.isArray(course.enrollments) ? course.enrollments.length : (course.enrolledCount ?? 0)

  const resolvedCourse = {
    ...course,
    id,
    title: course.titre || course.title || 'Untitled Course',
    thumbnail: course.thumbnail || course.image || course.coverImage,
    price: priceNumber,
    sections: Array.isArray(course.sections) ? course.sections : Array.from({ length: sectionsCount }, () => ({ chapitres: [], chapters: [] })),
    enrollments: Array.isArray(course.enrollments) ? course.enrollments : Array.from({ length: enrollmentsCount }),
  }

  const totalChapters = chaptersTotal
  const pricing = getCoursePricing(resolvedCourse)

  function getCoursePricing(course: any) {
    const coursePrice = course.prix || course.price || 0
    if (coursePrice === 0) {
      const flatChapters = (Array.isArray(course.sections) ? course.sections : []).flatMap((s: any) => Array.isArray(s.chapitres) ? s.chapitres : (Array.isArray(s.chapters) ? s.chapters : []))
      const paidChapters = flatChapters.filter((c: any) => (c?.prix || c?.price || 0) > 0)
      if (paidChapters.length > 0) {
        return { type: "freemium", basePrice: 0, paidChapters: paidChapters.length }
      }
      return { type: "free", basePrice: 0 }
    }
    return { type: "paid", basePrice: coursePrice }
  }

  const handleDelete = async () => {
    if (!deleteId) {
      toast({ title: 'Delete failed', description: 'Missing course id.', variant: 'destructive' as any })
      return
    }
    const ok = typeof window !== 'undefined' ? window.confirm('Delete this course permanently?') : false
    if (!ok) return
    try {
      await api.courses.delete(String(deleteId))
      toast({ title: 'Course deleted' })
      onDeleted?.(String(deleteId))
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message || 'Unable to delete course.', variant: 'destructive' as any })
    }
  }

  return (
    <EnhancedCard key={resolvedCourse.id} hover className="overflow-hidden">
      <div className="relative w-full aspect-video overflow-hidden">
        <Image
          src={resolvedCourse.thumbnail || "/placeholder.svg?height=1080&width=1920&query=course+thumbnail"}
          alt={resolvedCourse.title || 'Course thumbnail'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute top-3 left-3">
          <StatusBadge status={resolvedCourse.isPublished ? "published" : "draft"} />
        </div>
        <div className="absolute bottom-3 left-3">
          {pricing.type === "free" ? (
            <Badge className="bg-green-500 text-white">Free</Badge>
          ) : pricing.type === "freemium" ? (
            <Badge className="bg-blue-500 text-white">Free + Premium</Badge>
          ) : (
            <Badge className="bg-courses-500 text-white">{resolvedCourse.price} TND</Badge>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-white/20 hover:bg-white/30 border-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/creator/courses/${resolvedCourse.id}/manage`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Course
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/creator/courses/${resolvedCourse.id}/manage`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Course
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Course
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardHeader>
        <CardTitle className="line-clamp-2">{resolvedCourse.title}</CardTitle>
        <CardDescription className="line-clamp-2 text-sm">
          {resolvedCourse.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex items-center justify-end pt-2">
        <Button size="sm" asChild>
          <Link href={`/creator/courses/${resolvedCourse.id}/manage`}>
            <Edit className="h-4 w-4 mr-1" />
            Manage
          </Link>
        </Button>
      </CardContent>
    </EnhancedCard>
  )
}
