import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Star } from "lucide-react"

interface CourseHeaderProps {
  creatorSlug: string
  slug: string
  course: any
  progress: number
  allChapters: any[]
  completedChaptersCount: number
  remainingChaptersCount: number
  /** Optional override for live progress (high-water mark from player) */
  currentChapterProgress?: number
}

export default function CourseHeader({ 
  creatorSlug, 
  slug, 
  course, 
  progress, 
  allChapters, 
  completedChaptersCount, 
  remainingChaptersCount,
  currentChapterProgress 
}: CourseHeaderProps) {
  const averageRating = Number(course?.averageRating || course?.rating || 0)
  const ratingCount = Number(course?.ratingCount || 0)

  // Use the specific chapter progress if available (High-Water Mark), otherwise fallback to general progress
  const displayProgress = typeof currentChapterProgress === 'number' ? currentChapterProgress : progress

  // Back link: prefer provided slug, fall back to course.communitySlug or creator-level courses
  const backHref = slug
    ? `/${creatorSlug}/${slug}/courses`
    : course?.communitySlug
      ? `/${creatorSlug}/${course.communitySlug}/courses`
      : `/${creatorSlug}/courses`

return (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-1 sm:space-y-0">
    <div className="flex items-center space-x-3 w-full sm:w-auto">
      <Button variant="ghost" size="icon" asChild>
        <Link href={backHref}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>
      <h1 className="text-base sm:text-lg font-bold truncate">{course.title}</h1>
    </div>

    {/* Progress & Info */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-muted-foreground w-full sm:w-auto">
      <div className="flex items-center truncate">
        <Star className="h-4 w-4 text-yellow-500 mr-1 fill-yellow-500" />
        {ratingCount > 0 ? `${averageRating.toFixed(1)} (${ratingCount} ${ratingCount === 1 ? 'review' : 'reviews'})` : "No reviews yet"}
      </div>
    </div>
  </div>
);

}