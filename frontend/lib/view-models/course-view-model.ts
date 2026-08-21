import { resolveImageUrl } from "@/lib/resolve-image-url"

export interface CourseViewModel {
  id: string
  title: string
  slug?: string
  thumbnailUrl: string
}

export function toCourseViewModel(raw: any): CourseViewModel {
  const title = String(raw?.title || raw?.titre || raw?.name || "Course")
  return {
    id: String(raw?.id || raw?._id || ""),
    title,
    slug: raw?.slug,
    thumbnailUrl:
      resolveImageUrl(raw?.thumbnailUrl) ||
      resolveImageUrl(raw?.thumbnail) ||
      resolveImageUrl(raw?.image) ||
      "/placeholder.svg?height=1080&width=1920&query=course+thumbnail",
  }
}
