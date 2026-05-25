import { Suspense } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ExplorePageClient } from "./explore-page-client"
import { communitiesApi, coursesApi, challengesApi, productsApi, sessionsApi, eventsApi } from "@/lib/api"
import type { Community, Course, Challenge, Product, Session, Event } from "@/lib/api/types"
import type { ExploreItem } from "@/lib/explore-data"
import { computeEventStartAt } from "@/lib/utils/event-time"
import type { Metadata } from "next"
import {
  generateAlternateLanguages,
  generateKeywords,
  generateOGMetadata,
  generateTwitterMetadata,
} from "@/lib/seo-config"

const EXPLORE_FETCH_TIMEOUT_MS = 7000
const EXPLORE_LIST_FETCH_OPTIONS = { cache: "no-store" as const }

export const dynamic = "force-dynamic"
export const revalidate = 0
export const metadata: Metadata = {
  title: "Explore Communities, Courses, Events and Sessions",
  description:
    "Discover top communities, courses, challenges, products, events, and 1-to-1 sessions on Chabaqa.",
  keywords: generateKeywords([
    "explore creators",
    "discover communities",
    "find online courses",
    "book coaching sessions",
    "creator marketplace",
  ]),
  alternates: generateAlternateLanguages("/explore"),
  openGraph: generateOGMetadata(
    "Explore Communities, Courses, Events and Sessions",
    "Discover top communities, courses, challenges, products, events, and 1-to-1 sessions on Chabaqa.",
    "/explore",
  ),
  twitter: generateTwitterMetadata(
    "Explore Communities, Courses, Events and Sessions",
    "Discover top communities, courses, challenges, products, events, and 1-to-1 sessions on Chabaqa.",
  ),
}

// Resolve image url safely (absolute or local placeholder)
function resolveImageUrl(value?: string): string {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  const v = (value || "").trim()
  if (!v) return "/placeholder.svg"

  // absolute http(s) - force HTTPS for production
  if (/^https?:\/\//i.test(v)) {
    // If it's HTTP, convert to HTTPS
    if (v.startsWith('http://')) {
      // If it's an IP address, use the API domain instead
      if (/^http:\/\/\d+\.\d+\.\d+\.\d+/.test(v)) {
        const path = v.replace(/^http:\/\/[^/]+/, '')
        return `https://api.chabaqa.io${path}`
      }
      return v.replace('http://', 'https://')
    }
    return v
  }

  // static or public root path
  if (v.startsWith("/")) return v

  // common uploads path from backend - ensure HTTPS in production
  if (v.startsWith("uploads") || v.startsWith("storage") || v.startsWith("images")) {
    const baseUrl = apiBase.replace(/\/api$/, "")
    // Force HTTPS and replace IP with domain
    const secureBaseUrl = baseUrl
      .replace('http://', 'https://')
      .replace(/^https?:\/\/\d+\.\d+\.\d+\.\d+:\d+/, 'https://api.chabaqa.io')
    return `${secureBaseUrl}/${v.replace(/^\/+/, "")}`
  }

  // invalid (like "600x400"): fallback
  return "/placeholder.svg"
}

// Map priceType from API to Explore format
const mapPriceType = (type: string): "free" | "paid" | "monthly" | "yearly" | "hourly" => {
  if (type === "one-time") return "paid"
  if (type === "free" || type === "monthly" || type === "yearly" || type === "hourly") return type as any
  return "paid" // default fallback
}

function normalizePrice(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return 0
}

function normalizeCount(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  if (Array.isArray(value)) return value.length
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>
    const keys = [
      "count",
      "total",
      "totalCount",
      "length",
      "membersCount",
      "participantCount",
      "participantsCount",
      "attendeesCount",
      "bookingsCount",
      "enrollmentCount",
      "salesCount",
    ]

    for (const key of keys) {
      const maybe = record[key]
      if (typeof maybe === "number" && Number.isFinite(maybe)) return maybe
      if (typeof maybe === "string") {
        const parsed = Number(maybe)
        if (Number.isFinite(parsed)) return parsed
      }
    }

    if (Array.isArray(record.items)) return record.items.length
    if (Array.isArray(record.results)) return record.results.length
    if (Array.isArray(record.data)) return record.data.length
  }
  return fallback
}

function maxCount(...values: unknown[]): number {
  return values.reduce<number>((max, value) => {
    const count = normalizeCount(value, 0)
    return Math.max(max, count)
  }, 0)
}

function sumTicketSold(tickets: unknown): number {
  if (!Array.isArray(tickets)) return 0
  return tickets.reduce((sum, ticket) => sum + normalizeCount((ticket as any)?.sold, 0), 0)
}

function resolveEntityId(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed || undefined
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value)
  }

  if (!value || typeof value !== "object") return undefined
  const record = value as Record<string, unknown>
  return (
    resolveEntityId(record.id) ||
    resolveEntityId(record._id) ||
    resolveEntityId(record.mongoId) ||
    resolveEntityId(record.value)
  )
}

function resolveCreatorSlug(source: any, creatorName: string): string | undefined {
  const raw = (
    source?.creatorSlug ||
    source?.creator?.slug ||
    source?.creator?.username ||
    source?.creator?.handle ||
    source?.creator?.name ||
    creatorName
  )

  if (typeof raw !== "string") return undefined
  const trimmed = raw.trim()
  return trimmed || undefined
}

// Transform API Community to Explore format
function transformCommunityToExplore(community: Community): ExploreItem {
  const primaryImage = resolveImageUrl(
    (community as any).coverImage || (community as any).banner || community.image || (community as any).logo,
  )

  const avatar = resolveImageUrl(
    (community as any).creatorAvatar ||
      community.creator?.avatar ||
      (community as any).creator?.profile_picture ||
      (community as any).creator?.photo_profil,
  )

  const creatorName = community.creator?.name || (community as any).creator || 'Unknown'
  const membersCount = maxCount((community as any).membersCount, (community as any).members)
  const communityId = String((community as any)._id || community.id)

  return {
    id: communityId,
    type: "community",
    category: (community.category as any) || 'business',
    title: community.name,
    desc: community.description || '',
    creator: creatorName,
    creatorInitials: creatorName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
    creatorAvatar: avatar,
    creatorColor: '#8e78fb',
    banner: primaryImage,
    price: normalizePrice((community as any).price) > 0 ? normalizePrice((community as any).price) : 'free',
    currency: 'TND',
    members: membersCount,
    rating: (community as any).averageRating || community.rating || 0,
    ratingCount: normalizeCount((community as any).ratingCount, 0),
    verified: Boolean((community as any).verified ?? (community as any).isVerified ?? false),
    featured: Boolean((community as any).featured),
    url: `/community/${communityId}`,
    slug: (community as any).slug || communityId,
    mongoId: communityId,
    creatorSlug: resolveCreatorSlug(community, creatorName),
  }
}

// Transform API Course to Explore format
async function transformCourseToExplore(course: Course): Promise<ExploreItem> {
  const image = resolveImageUrl(course.thumbnail || (course as any).image)
  const avatar = resolveImageUrl((course as any).creator?.avatar || (course as any).creatorAvatar)

  const courseTitle = course.title || (course as any).titre || (course as any).name || 'Untitled Course'
  const creatorName = (course as any).creator?.name || (course as any).creatorName || 'Unknown'
  const enrollmentCount = maxCount(
    (course as any).enrollmentCount,
    (course as any).inscriptions,
    (course as any).participants,
    (course as any).enrollments,
    (course as any).students,
    (course as any).studentsCount,
  )
  const courseId = String((course as any).id || (course as any)._id || "").trim()

  return {
    id: courseId,
    type: "course",
    category: (course as any).category || 'education',
    title: courseTitle,
    desc: course.description || '',
    creator: creatorName,
    creatorInitials: creatorName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
    creatorAvatar: avatar,
    creatorColor: '#47c7ea',
    banner: image,
    price: normalizePrice((course as any).price || (course as any).prix) > 0 ? normalizePrice((course as any).price || (course as any).prix) : 'free',
    currency: 'TND',
    members: enrollmentCount,
    rating: (course as any).averageRating || course.rating || 0,
    ratingCount: normalizeCount((course as any).ratingCount, 0),
    verified: false, // set from verifiedCommunitySlugs after transform
    featured: (course as any).featured || false,
    url: `/course/${courseId}`,
    slug: courseId,
    mongoId: courseId,
    communitySlug: (course as any).communitySlug || '',
    communityId: String((course as any).communityId || (course as any).community?.id || ''),
    creatorSlug: resolveCreatorSlug(course, creatorName),
  }
}

// Transform API Challenge to Explore format
async function transformChallengeToExplore(challenge: Challenge): Promise<ExploreItem> {
  const image = resolveImageUrl(challenge.thumbnail || (challenge as any).image)
  const avatar = resolveImageUrl((challenge as any).creator?.avatar || (challenge as any).creatorAvatar)

  const creatorName = (challenge as any).creator?.name || (challenge as any).creatorName || 'Unknown'
  const participantCount = maxCount(
    challenge.participantCount,
    (challenge as any).participantsCount,
    challenge.participants,
    (challenge as any).participants,
    (challenge as any).members,
  )

  return {
    id: challenge.id,
    type: "challenge",
    category: (challenge.category as any) || 'fitness',
    title: challenge.title,
    desc: challenge.description || '',
    creator: creatorName,
    creatorInitials: creatorName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
    creatorAvatar: avatar,
    creatorColor: '#ff9b28',
    banner: image,
    price: normalizePrice((challenge as any).pricing?.participationFee) > 0 ? normalizePrice((challenge as any).pricing?.participationFee) : 'free',
    currency: 'TND',
    members: participantCount,
    rating: (challenge as any).averageRating || (challenge as any).rating || 0,
    ratingCount: normalizeCount((challenge as any).ratingCount, 0),
    verified: false, // set from verifiedCommunitySlugs after transform
    featured: (challenge as any).featured || false,
    url: `/challenge/${challenge.id}`,
    slug: challenge.id,
    mongoId: challenge.id,
    communitySlug: (challenge as any).communitySlug || (challenge as any).community?.slug || '',
    communityId: String((challenge as any).communityId || (challenge as any).community?.id || ''),
    creatorSlug: resolveCreatorSlug(challenge, creatorName),
  }
}

// Transform API Product to Explore format
async function transformProductToExplore(product: Product): Promise<ExploreItem> {
  const image = resolveImageUrl((product as any).images?.[0] || product.thumbnail)
  const avatar = resolveImageUrl((product as any).creator?.avatar || (product as any).creatorAvatar)

  const creatorName = (product as any).creator?.name || (product as any).creatorName || 'Unknown'
  const salesCount = maxCount(
    (product as any).sales,
    product.salesCount,
    (product as any).ordersCount,
    (product as any).purchasesCount,
    (product as any).purchases,
    (product as any).buyers,
  )

  return {
    id: product.id,
    type: "product",
    category: (product as any).category || 'creative',
    title: (product as any).title || product.name,
    desc: product.description || '',
    creator: creatorName,
    creatorInitials: creatorName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
    creatorAvatar: avatar,
    creatorColor: '#8e78fb',
    banner: image,
    price: normalizePrice((product as any).price || product.price),
    currency: 'TND',
    members: salesCount,
    rating: normalizePrice((product as any).averageRating ?? product.rating),
    ratingCount: normalizeCount((product as any).ratingCount, 0),
    verified: false, // set from verifiedCommunitySlugs after transform
    featured: (product as any).featured || false,
    url: `/product/${product.id}`,
    slug: product.id,
    mongoId: product.id,
    communitySlug: (product as any).communitySlug || (product as any).community?.slug || '',
    communityId: String((product as any).communityId || (product as any).community?.id || ''),
    creatorSlug: resolveCreatorSlug(product, creatorName),
  }
}

// Transform API Session to Explore format
async function transformSessionToExplore(session: Session): Promise<ExploreItem> {
  const image = resolveImageUrl(
    (session as any).thumbnail || (session as any).coverImage || (session as any).image,
  )
  const avatar = resolveImageUrl((session as any).creator?.avatar || (session as any).creatorAvatar)

  const creatorName = (session as any).creator?.name || (session as any).creatorName || 'Unknown'
  const bookingCount = maxCount(
    (session as any).bookedSlots,
    (session as any).bookingsCount,
    (session as any).bookings,
    (session as any).participants,
    (session as any).attendees,
    (session as any).totalBookings,
  )

  return {
    id: session.id,
    type: "session",
    category: (session as any).category || 'business',
    title: session.title,
    desc: session.description || '',
    creator: creatorName,
    creatorInitials: creatorName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
    creatorAvatar: avatar,
    creatorColor: '#f65887',
    banner: image,
    price: normalizePrice((session as any).price),
    currency: 'TND',
    members: bookingCount,
    rating: (session as any).averageRating || (session as any).rating || 0,
    ratingCount: normalizeCount((session as any).ratingCount, 0),
    verified: false, // set from verifiedCommunitySlugs after transform
    featured: (session as any).featured || false,
    url: `/session/${session.id}`,
    slug: session.id,
    mongoId: session.id,
    communitySlug: (session as any).communitySlug || (session as any).community?.slug || '',
    communityId: String((session as any).communityId || (session as any).community?.id || ''),
    creatorSlug: resolveCreatorSlug(session, creatorName),
  }
}

// Transform API Event to Explore format
async function transformEventToExplore(event: Event): Promise<ExploreItem> {
  const image = resolveImageUrl(event.thumbnail || event.image)
  const avatar = resolveImageUrl((event as any).creator?.avatar || (event as any).creatorAvatar)

  const creatorName = (event as any).creator?.name || (event as any).creatorName || 'Unknown'
  const ticketSoldCount = sumTicketSold((event as any).tickets)
  const attendeeCount = maxCount(
    event.currentAttendees,
    event.attendeesCount,
    (event as any).totalAttendees,
    event.attendees,
    (event as any).registrationsCount,
    (event as any).participants,
    ticketSoldCount,
  )

  return {
    id: event.id,
    type: "event",
    category: (event.category as any) || 'business',
    title: event.title,
    desc: event.description || '',
    creator: creatorName,
    creatorInitials: creatorName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
    creatorAvatar: avatar,
    creatorColor: '#8e78fb',
    banner: image,
    price: normalizePrice((event as any).price) > 0 ? normalizePrice((event as any).price) : 'free',
    currency: 'TND',
    members: attendeeCount,
    rating: (event as any).averageRating || (event as any).rating || 0,
    ratingCount: normalizeCount((event as any).ratingCount, 0),
    verified: false, // set from verifiedCommunitySlugs after transform
    featured: (event as any).featured || false,
    url: `/event/${event.id}`,
    slug: event.id,
    mongoId: event.id,
    communitySlug: (event as any).communitySlug || (event as any).community?.slug || '',
    communityId: String((event as any).communityId || (event as any).community?.id || ''),
    creatorSlug: resolveCreatorSlug(event, creatorName),
  }
}

function shouldIncludeExploreEvent(event: any, now: Date): boolean {
  if (!event || event.isActive === false || event.isPublished === false) {
    return false
  }

  const startAt = computeEventStartAt(event.startDate, event.startTime, event.timezone)
  if (!startAt) {
    return false
  }

  return startAt >= now
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`${label} request timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    promise
      .then((value) => {
        clearTimeout(timeoutId)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timeoutId)
        reject(error)
      })
  })
}

async function ExploreContent() {
  const allExploreItems: ExploreItem[] = []
  const featuredItems: ExploreItem[] = []

  try {
    // Fetch all content types in parallel
    const [
      communitiesRes,
      coursesRes,
      challengesRes,
      productsRes,
      sessionsRes,
      eventsRes,
    ] = await Promise.allSettled([
      withTimeout(
        communitiesApi.getAll({ limit: 50 }, EXPLORE_LIST_FETCH_OPTIONS),
        EXPLORE_FETCH_TIMEOUT_MS,
        "communities",
      ),
      withTimeout(
        coursesApi.getAll({ limit: 50 }, EXPLORE_LIST_FETCH_OPTIONS),
        EXPLORE_FETCH_TIMEOUT_MS,
        "courses",
      ),
      withTimeout(
        challengesApi.getAll({ limit: 50 }, EXPLORE_LIST_FETCH_OPTIONS),
        EXPLORE_FETCH_TIMEOUT_MS,
        "challenges",
      ),
      withTimeout(
        productsApi.getAll({ limit: 50 }, EXPLORE_LIST_FETCH_OPTIONS),
        EXPLORE_FETCH_TIMEOUT_MS,
        "products",
      ),
      withTimeout(
        sessionsApi.getAll({ limit: 50 }, EXPLORE_LIST_FETCH_OPTIONS),
        EXPLORE_FETCH_TIMEOUT_MS,
        "sessions",
      ),
      withTimeout(
        eventsApi.getAll(
          { limit: 50, isActive: true, isPublished: true },
          EXPLORE_LIST_FETCH_OPTIONS,
        ),
        EXPLORE_FETCH_TIMEOUT_MS,
        "events",
      ),
    ])

    // Helper to extract array from various response formats
    const extractArray = (response: any): any[] => {
      if (response?.data && Array.isArray(response.data)) return response.data
      if (response?.data?.courses && Array.isArray(response.data.courses)) return response.data.courses
      if (response?.data?.challenges && Array.isArray(response.data.challenges)) return response.data.challenges
      if (response?.data?.products && Array.isArray(response.data.products)) return response.data.products
      if (response?.data?.sessions && Array.isArray(response.data.sessions)) return response.data.sessions
      if (response?.data?.events && Array.isArray(response.data.events)) return response.data.events
      if (response?.data?.communities && Array.isArray(response.data.communities)) return response.data.communities
      if (Array.isArray(response)) return response
      if (response?.data?.data && Array.isArray(response.data.data)) return response.data.data
      if (response?.data?.data?.courses && Array.isArray(response.data.data.courses)) return response.data.data.courses
      if (response?.data?.data?.communities && Array.isArray(response.data.data.communities)) return response.data.data.communities
      return []
    }

    // Build a set of verified community slugs (admin-granted verification)
    const verifiedCommunitySlugs = new Set<string>()

    // Transform communities
    if (communitiesRes.status === 'fulfilled') {
      const data = extractArray(communitiesRes.value)
      for (const c of data) {
        const isV = Boolean((c as any).verified ?? (c as any).isVerified)
        if (isV) {
          const slug = String((c as any).slug || '').trim().toLowerCase()
          const id = String((c as any)._id || (c as any).id || '').trim()
          if (slug) verifiedCommunitySlugs.add(slug)
          if (id) verifiedCommunitySlugs.add(id)
        }
      }
      const communities = data.map(transformCommunityToExplore)
      allExploreItems.push(...communities)
      featuredItems.push(...communities.filter(c => c.featured))
    }

    // Transform courses
    if (coursesRes.status === 'fulfilled') {
      const data = extractArray(coursesRes.value)
      const courses = (await Promise.all(data.map(transformCourseToExplore))).map(c => ({
        ...c,
        verified: verifiedCommunitySlugs.has((c.communitySlug || '').toLowerCase()) || verifiedCommunitySlugs.has(c.communityId || ''),
      }))
      allExploreItems.push(...courses)
      featuredItems.push(...courses.filter(c => c.featured))
    }

    // Transform challenges
    if (challengesRes.status === 'fulfilled') {
      const data = extractArray(challengesRes.value)
      const challenges = (await Promise.all(data.map(transformChallengeToExplore))).map(c => ({
        ...c,
        verified: verifiedCommunitySlugs.has((c.communitySlug || '').toLowerCase()) || verifiedCommunitySlugs.has(c.communityId || ''),
      }))
      allExploreItems.push(...challenges)
      featuredItems.push(...challenges.filter(c => c.featured))
    }

    // Transform products
    if (productsRes.status === 'fulfilled') {
      const data = extractArray(productsRes.value)
      const products = (await Promise.all(data.map(transformProductToExplore))).map(c => ({
        ...c,
        verified: verifiedCommunitySlugs.has((c.communitySlug || '').toLowerCase()) || verifiedCommunitySlugs.has(c.communityId || ''),
      }))
      allExploreItems.push(...products)
      featuredItems.push(...products.filter(c => c.featured))
    }

    // Transform sessions
    if (sessionsRes.status === 'fulfilled') {
      const data = extractArray(sessionsRes.value)
      const sessions = (await Promise.all(data.map(transformSessionToExplore))).map(c => ({
        ...c,
        verified: verifiedCommunitySlugs.has((c.communitySlug || '').toLowerCase()) || verifiedCommunitySlugs.has(c.communityId || ''),
      }))
      allExploreItems.push(...sessions)
      featuredItems.push(...sessions.filter(c => c.featured))
    }

    // Transform events
    if (eventsRes.status === 'fulfilled') {
      const data = extractArray(eventsRes.value)
      const now = new Date()
      const events = (await Promise.all(
        data
          .filter((event: any) => shouldIncludeExploreEvent(event, now))
          .map(transformEventToExplore),
      )).map(c => ({
        ...c,
        verified: verifiedCommunitySlugs.has((c.communitySlug || '').toLowerCase()) || verifiedCommunitySlugs.has(c.communityId || ''),
      }))
      allExploreItems.push(...events)
      featuredItems.push(...events.filter(c => c.featured))
    }
  } catch {
    // Keep page usable if one fetch path throws unexpectedly.
  }

  return <ExplorePageClient items={allExploreItems} featured={featuredItems} />
}

function ExploreGridSkeleton() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border p-4">
            <div className="h-40 animate-pulse rounded-lg bg-muted" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="mt-auto flex items-center gap-2 pt-2">
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CommunitiesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-14">
        <Suspense fallback={<ExploreGridSkeleton />}>
          <ExploreContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
