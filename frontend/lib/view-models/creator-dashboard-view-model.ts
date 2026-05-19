import { toCommunityViewModel, type CommunityViewModel } from "./community-view-model"

export type SetupItemStatus = "completed" | "in-progress" | "not-started" | "skipped"

export interface SetupItem {
  id: string
  title: string
  description: string
  status: SetupItemStatus
  actionLabel: string
  actionUrl: string
  isRequired?: boolean
  estimatedMinutes?: number
}

export interface CreatorDashboardViewModel {
  community: CommunityViewModel
  setup: {
    percent: number
    nextAction?: SetupItem
    items: SetupItem[]
  }
  metrics: {
    members: number
    activeMembers: number
    postsThisWeek: number
    revenue: number
    courseCompletionRate?: number
    churnRiskCount?: number
  }
  contentCounts: {
    posts: number
    courses: number
    sessions: number
    products: number
    challenges: number
    events: number
  }
}

const hasUsableMedia = (value: unknown) => {
  const text = typeof value === "string" ? value.trim() : ""
  return Boolean(text && !/placeholder|ui-avatars/i.test(text))
}

const hasPrice = (community: any, paidOfferCount: number) => {
  const price = Number(community?.fees_of_join ?? community?.price ?? community?.settings?.price ?? 0)
  const priceType = String(community?.priceType ?? community?.settings?.priceType ?? "").toLowerCase()
  return paidOfferCount > 0 || price > 0 || ["paid", "one-time", "subscription"].includes(priceType)
}

export function toCreatorDashboardViewModel(input: {
  community: any
  posts?: any[]
  courses?: any[]
  sessions?: any[]
  products?: any[]
  challenges?: any[]
  events?: any[]
  membersCount?: number
  activeMembers?: number
  postsThisWeek?: number
  revenue?: number
  paidOfferCount?: number
  bankConfigured?: boolean | null
  courseCompletionRate?: number
  churnRiskCount?: number
}): CreatorDashboardViewModel {
  const community = toCommunityViewModel(input.community || {})
  const posts = input.posts || []
  const courses = input.courses || []
  const sessions = input.sessions || []
  const products = input.products || []
  const challenges = input.challenges || []
  const events = input.events || []
  const contentCount = posts.length + courses.length + sessions.length + products.length + challenges.length + events.length
  const paidOfferCount = Number(input.paidOfferCount || 0)

  const rawCommunity = input.community || {}
  const setupItems: SetupItem[] = [
    {
      id: "community-logo",
      title: "Upload community logo",
      description: "Use a recognizable logo so members trust the space instantly.",
      status: hasUsableMedia(rawCommunity.logoUrl || rawCommunity.logo || rawCommunity.settings?.logo) ? "completed" : "not-started",
      actionLabel: "Customize",
      actionUrl: rawCommunity.slug ? `/creator/community/${rawCommunity.slug}/customize` : "/creator/customize",
      isRequired: true,
      estimatedMinutes: 3,
    },
    {
      id: "community-cover",
      title: "Upload community cover",
      description: "Add a branded cover image for the public page and member header.",
      status: hasUsableMedia(rawCommunity.coverUrl || rawCommunity.coverImage || rawCommunity.photo_de_couverture || rawCommunity.settings?.heroBackground) ? "completed" : "not-started",
      actionLabel: "Customize",
      actionUrl: rawCommunity.slug ? `/creator/community/${rawCommunity.slug}/customize` : "/creator/customize",
      isRequired: true,
      estimatedMinutes: 4,
    },
    {
      id: "pricing",
      title: "Configure pricing",
      description: "Decide whether members join free, pay once, or subscribe.",
      status: hasPrice(rawCommunity, paidOfferCount) ? "completed" : "not-started",
      actionLabel: "Set Pricing",
      actionUrl: "/creator/monetization/subscriptions",
      isRequired: true,
      estimatedMinutes: 5,
    },
    {
      id: "first-post",
      title: "Publish first post",
      description: "Welcome new members with a short update or pinned introduction.",
      status: posts.length > 0 ? "completed" : "not-started",
      actionLabel: "Write Post",
      actionUrl: "/creator/posts?create=1",
      isRequired: true,
      estimatedMinutes: 3,
    },
    {
      id: "first-offer",
      title: "Create first offer",
      description: "Add a course, session, product, challenge, or event members can use.",
      status: contentCount - posts.length > 0 ? "completed" : "not-started",
      actionLabel: "Create Offer",
      actionUrl: "/creator/courses/new",
      isRequired: true,
      estimatedMinutes: 10,
    },
    {
      id: "payouts",
      title: "Set up payouts",
      description: "Connect payout details before paid members start buying.",
      status: input.bankConfigured === true ? "completed" : input.bankConfigured === null ? "in-progress" : "not-started",
      actionLabel: "Set Up",
      actionUrl: "/creator/monetization/payouts",
      estimatedMinutes: 5,
    },
  ]

  const completed = setupItems.filter((item) => item.status === "completed").length

  return {
    community,
    setup: {
      percent: Math.round((completed / setupItems.length) * 100),
      nextAction: setupItems.find((item) => item.status !== "completed"),
      items: setupItems,
    },
    metrics: {
      members: Number(input.membersCount ?? community.membersCount ?? 0),
      activeMembers: Number(input.activeMembers ?? 0),
      postsThisWeek: Number(input.postsThisWeek ?? 0),
      revenue: Number(input.revenue ?? 0),
      courseCompletionRate: input.courseCompletionRate,
      churnRiskCount: input.churnRiskCount,
    },
    contentCounts: {
      posts: posts.length,
      courses: courses.length,
      sessions: sessions.length,
      products: products.length,
      challenges: challenges.length,
      events: events.length,
    },
  }
}
