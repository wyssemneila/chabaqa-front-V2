import { toCommunityViewModel, type CommunityViewModel } from "./community-view-model"

export type RecommendationType = "course_chapter" | "event" | "session" | "challenge" | "post" | "product"
export type RecommendationStatus = "available" | "in_progress" | "locked" | "completed"

export interface RecommendationItem {
  id: string
  type: RecommendationType
  title: string
  description?: string
  href: string
  priority: number
  status?: RecommendationStatus
}

export interface ActivityItem {
  id: string
  type: RecommendationType
  title: string
  description?: string
  href: string
  createdAt?: string
}

export interface MemberHomeViewModel {
  community: CommunityViewModel
  continueItem?: RecommendationItem
  recommendations: RecommendationItem[]
  recentActivity: ActivityItem[]
  stats: {
    totalMembers: number
    activeToday: number
    postsThisWeek: number
  }
}

const asArray = <T = any>(value: unknown): T[] => Array.isArray(value) ? value as T[] : []
const firstText = (...values: unknown[]) => values.find((value) => typeof value === "string" && value.trim()) as string | undefined
const idOf = (value: any) => String(value?.id || value?._id || "")

export function toMemberHomeViewModel(data: any, basePath: string): MemberHomeViewModel {
  const community = toCommunityViewModel(data?.community || {})
  const courses = asArray(data?.courses)
  const challenges = asArray(data?.activeChallenges)
  const posts = asArray(data?.posts)
  const events = asArray(data?.events)
  const sessions = asArray(data?.sessions)
  const products = asArray(data?.products)

  const recommendations: RecommendationItem[] = []
  const firstCourse = courses[0]
  if (firstCourse) {
    recommendations.push({
      id: `course-${idOf(firstCourse)}`,
      type: "course_chapter",
      title: firstText(firstCourse.title, firstCourse.titre, "Continue learning") || "Continue learning",
      description: firstText(firstCourse.description, "Pick up the next available lesson."),
      href: `${basePath}/courses/${encodeURIComponent(idOf(firstCourse))}`,
      priority: 10,
      status: "in_progress",
    })
  }

  const nextScheduled = [...events.map((item) => ({ ...item, __type: "event" })), ...sessions.map((item) => ({ ...item, __type: "session" }))]
    .filter((item) => idOf(item))
    .sort((a, b) => new Date(a.startDate || a.date || a.createdAt || 0).getTime() - new Date(b.startDate || b.date || b.createdAt || 0).getTime())[0]
  if (nextScheduled) {
    recommendations.push({
      id: `${nextScheduled.__type}-${idOf(nextScheduled)}`,
      type: nextScheduled.__type === "session" ? "session" : "event",
      title: firstText(nextScheduled.title, nextScheduled.name, nextScheduled.__type === "session" ? "Upcoming session" : "Upcoming event") || "Upcoming item",
      description: firstText(nextScheduled.description, "Reserve time for this scheduled community item."),
      href: `${basePath}/${nextScheduled.__type === "session" ? "sessions" : "events"}/${encodeURIComponent(idOf(nextScheduled))}`,
      priority: 20,
      status: "available",
    })
  }

  const firstChallenge = challenges[0]
  if (firstChallenge) {
    recommendations.push({
      id: `challenge-${idOf(firstChallenge)}`,
      type: "challenge",
      title: firstText(firstChallenge.title, firstChallenge.name, "Join the active challenge") || "Join the active challenge",
      description: firstText(firstChallenge.description, "Take part before the deadline."),
      href: `${basePath}/challenges`,
      priority: 30,
      status: "available",
    })
  }

  const pinnedOrPopularPost = posts.find((post: any) => post?.isPinned) || posts[0]
  if (pinnedOrPopularPost) {
    recommendations.push({
      id: `post-${idOf(pinnedOrPopularPost)}`,
      type: "post",
      title: firstText(pinnedOrPopularPost.title, "Read the latest community post") || "Read the latest community post",
      description: firstText(pinnedOrPopularPost.content, "Catch up with what members are discussing."),
      href: `${basePath}/home?post=${encodeURIComponent(idOf(pinnedOrPopularPost))}`,
      priority: 40,
      status: "available",
    })
  }

  const firstProduct = products[0]
  if (firstProduct) {
    recommendations.push({
      id: `product-${idOf(firstProduct)}`,
      type: "product",
      title: firstText(firstProduct.title, firstProduct.name, "Explore a resource") || "Explore a resource",
      description: firstText(firstProduct.description, "Check the latest member resource."),
      href: `${basePath}/products/${encodeURIComponent(idOf(firstProduct))}`,
      priority: 50,
      status: "available",
    })
  }

  const recentActivity: ActivityItem[] = [
    ...posts.slice(0, 3).map((post: any) => ({
      id: `post-${idOf(post)}`,
      type: "post" as const,
      title: firstText(post.title, "New post") || "New post",
      description: firstText(post.content),
      href: `${basePath}/home?post=${encodeURIComponent(idOf(post))}`,
      createdAt: post.createdAt,
    })),
    ...courses.slice(0, 2).map((course: any) => ({
      id: `course-${idOf(course)}`,
      type: "course_chapter" as const,
      title: firstText(course.title, course.titre, "Course available") || "Course available",
      description: firstText(course.description),
      href: `${basePath}/courses/${encodeURIComponent(idOf(course))}`,
      createdAt: course.createdAt,
    })),
  ].filter((item) => item.id.split("-").slice(1).join("-"))

  const sortedRecommendations = recommendations.sort((a, b) => a.priority - b.priority)

  return {
    community,
    continueItem: sortedRecommendations[0],
    recommendations: sortedRecommendations.slice(0, 5),
    recentActivity: recentActivity.slice(0, 5),
    stats: {
      totalMembers: Number(data?.stats?.totalMembers ?? community.membersCount ?? 0),
      activeToday: Number(data?.stats?.activeToday ?? 0),
      postsThisWeek: Number(data?.stats?.postsThisWeek ?? 0),
    },
  }
}
