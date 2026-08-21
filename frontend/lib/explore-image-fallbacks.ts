import type { ExploreItem } from "@/lib/explore-data"

type FallbackImageItem = Pick<ExploreItem, "title"> & {
  category?: string
  type?: string
}

const TYPE_FALLBACKS: Record<string, string> = {
  community: "/placeholder.svg",
  course: "/online-course-interface-with-lessons-and-progress.jpg",
  challenge: "/skill-challenge-interface-with-progress.jpg",
  product: "/product-catalog-interface-with-filters.jpg",
  session: "/consultation-meeting.jpg",
  oneToOne: "/consultation-meeting.jpg",
  event: "/event-management-interface-with-calendar-and-rsvps.jpg",
}

const CATEGORY_FALLBACKS: Record<string, string> = {
  business: "/banners-community/community-1-email-marketing.png",
  creative: "/banners-community/community-2-branding.png",
  education: "/online-course-interface-with-lessons-and-progress.jpg",
  fitness: "/banners-community/community-3-fitness.png",
  language: "/community-discussion-interface-with-posts-and-comm.jpg",
  technology: "/banners-community/community-4-dev.png",
}

const TITLE_FALLBACKS: Array<[RegExp, string]> = [
  [/\b(motion|school|course|academy|learn|learning)\b/i, "/online-course-interface-with-lessons-and-progress.jpg"],
  [/\b(accessibility|ux|ui|design|brand|creative)\b/i, "/banners-community/community-2-branding.png"],
  [/\b(fitness|growth|runner|wellness|health|sport)\b/i, "/banners-community/community-3-fitness.png"],
  [/\b(dev|developer|code|cloud|mobile|data|ai|product|tech)\b/i, "/banners-community/community-4-dev.png"],
  [/\b(marketing|email|content|copy|creator)\b/i, "/banners-community/community-1-email-marketing.png"],
]

const AVATAR_FALLBACKS = [
  "/professional-avatar.png",
  "/professional-woman-avatar.png",
  "/professional-man-avatar.png",
  "/placeholder-user.jpg",
]

function stableIndex(value: string, length: number): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash % length
}

export function getExploreImageFallback(item: FallbackImageItem): string {
  for (const [pattern, fallback] of TITLE_FALLBACKS) {
    if (pattern.test(item.title)) return fallback
  }

  const category = (item.category || "").toLowerCase()
  const type = item.type || "community"
  return CATEGORY_FALLBACKS[category] || TYPE_FALLBACKS[type] || TYPE_FALLBACKS.community
}

export function getExploreAvatarFallback(item: Pick<ExploreItem, "creator" | "creatorInitials">): string {
  return AVATAR_FALLBACKS[stableIndex(item.creator || item.creatorInitials || "creator", AVATAR_FALLBACKS.length)]
}
