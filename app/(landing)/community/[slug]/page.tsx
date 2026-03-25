import { notFound } from "next/navigation"
import { cookies, headers } from "next/headers"
import type { Metadata } from "next"
import { Footer } from "@/components/footer"
import { CommunityHero } from "./components/community-hero"
import { CommunityJoinCheckoutSection } from "./components/community-join-checkout-section"
import { CommunityOverview } from "./components/community-overview"
import { CommunityCTA } from "./components/community-cta"
import { CommunityWhyJoin } from "./components/community-why-join"
import { CommunityTestimonials } from "./components/community-testimonials"
import { CommunityContentSection } from "./components/community-content-section"
import {
  getCommunityPageContent,
  type PageContent,
} from "@/lib/api/community-page-content"
import { normalizeCommunitySettings } from "@/lib/community-settings"
import { buildCommunityTheme, getContentWidthClass } from "@/lib/community-theme"
import { cn } from "@/lib/utils"
import { generateAlternateLanguages, generateKeywords, generateTwitterMetadata } from "@/lib/seo-config"

const PUBLIC_COMMUNITY_DATA_REVALIDATE_SECONDS = 60
const OPTIONAL_COMMUNITY_FETCH_TIMEOUT_MS = 4500

// Resolve image URLs from API or absolute paths
function resolveImageUrl(raw?: string, apiBase?: string): string {
  const v = (raw || "").trim()
  if (!v) return ""
  
  // If it's already a full URL
  if (/^https?:\/\//i.test(v)) {
    // Force HTTPS for production
    if (v.startsWith('http://')) {
      // If it's an IP address, use the API domain instead
      if (/^http:\/\/\d+\.\d+\.\d+\.\d+/.test(v)) {
        const path = v.replace(/^http:\/\/[^/]+/, '');
        return `https://api.chabaqa.io${path}`;
      }
      return v.replace('http://', 'https://');
    }
    return v
  }
  
  if (v.startsWith("/")) return v
  if (!apiBase) return v
  
  const base = apiBase.replace(/\/api$/, "").replace('http://', 'https://').replace(/^https?:\/\/\d+\.\d+\.\d+\.\d+:\d+/, 'https://api.chabaqa.io')
  return `${base}/${v.replace(/^\/+/, "")}`
}

interface CommunityDetailsPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: CommunityDetailsPageProps): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug || "").trim()
  const readableSlug = slug.replace(/[-_]+/g, " ").trim()
  const normalizedName = readableSlug
    ? readableSlug
        .split(" ")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Community"
  const title = `${normalizedName} Community`
  const description = `Join ${normalizedName} on Chabaqa to access premium content, sessions, events, and creator resources.`
  const communityUrl = `https://chabaqa.io/community/${encodeURIComponent(slug)}`

  return {
    title,
    description,
    keywords: generateKeywords([`${normalizedName} community`, `${slug} community`, "join creator community"]),
    alternates: generateAlternateLanguages(`/community/${encodeURIComponent(slug)}`),
    openGraph: {
      title,
      description,
      url: communityUrl,
      type: "website",
      siteName: "Chabaqa",
    },
    twitter: generateTwitterMetadata(title, description),
  }
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function resolveMembersCount(community: any): number {
  const rawMembers = community?.members
  const rawMembersCount = asNumber(community?.membersCount, 0)
  const fromMembers =
    typeof rawMembers === "number"
      ? rawMembers
      : Array.isArray(rawMembers)
        ? rawMembers.length
        : typeof rawMembers === "object" && rawMembers !== null && typeof rawMembers.count === "number"
          ? rawMembers.count
          : 0

  return Math.max(rawMembersCount, fromMembers, 0)
}

function dedupeTextList(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of values) {
    const trimmed = value.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(trimmed)
  }
  return result
}

function normalizeDisplayText(value: unknown): string {
  if (typeof value !== "string") return ""
  const trimmed = value.trim()
  if (!trimmed) return ""

  if (!/%[0-9a-f]{2}/i.test(trimmed)) {
    return trimmed
  }

  try {
    return decodeURIComponent(trimmed)
  } catch {
    return trimmed
  }
}

function normalizePricing(community: any): { price: number; priceType: string } {
  const feesOfJoin = asNumber(community?.fees_of_join, 0)
  const directPrice = asNumber(community?.price, 0)
  const nestedPrice = asNumber(community?.pricing?.price, 0)
  const price = Math.max(feesOfJoin, directPrice, nestedPrice, 0)

  const rawPriceType =
    typeof community?.priceType === "string"
      ? community.priceType
      : typeof community?.pricing?.type === "string"
        ? community.pricing.type
        : typeof community?.pricing?.interval === "string"
          ? community.pricing.interval
          : "free"

  const normalizedType = rawPriceType.toLowerCase()
  const priceType = price <= 0 ? "free" : normalizedType || "one-time"

  return { price, priceType }
}

function normalizePageContent(
  content: PageContent | null,
  assetBase: string,
): PageContent | null {
  if (!content) {
    return null
  }

  const mapAsset = (value?: string) => (value ? resolveImageUrl(value, assetBase) : value)

  return {
    ...content,
    hero: content.hero
      ? {
          ...content.hero,
          customBanner: mapAsset(content.hero.customBanner) || "",
        }
      : content.hero,
    overview: content.overview ? { ...content.overview } : content.overview,
    benefits: content.benefits ? { ...content.benefits } : content.benefits,
    testimonials: content.testimonials
      ? {
          ...content.testimonials,
          testimonials: (content.testimonials.testimonials || []).map((testimonial) => ({
            ...testimonial,
            avatar: mapAsset(testimonial.avatar) || testimonial.avatar,
          })),
        }
      : content.testimonials,
    cta: content.cta
      ? {
          ...content.cta,
          customBackground: mapAsset(content.cta.customBackground) || "",
        }
      : content.cta,
  }
}

function withTimeoutFallback<T>(promise: Promise<T>, timeoutMs: number, fallbackValue: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve(fallbackValue)
    }, timeoutMs)

    promise
      .then((value) => {
        clearTimeout(timeoutId)
        resolve(value)
      })
      .catch(() => {
        clearTimeout(timeoutId)
        resolve(fallbackValue)
      })
  })
}

type LatestCommunityPost = {
  id: string
  title: string
  excerpt?: string
  content?: string
  createdAt?: string
  authorName?: string
}

async function fetchLatestCommunityPosts(
  apiBase: string,
  communityId: string,
): Promise<LatestCommunityPost[]> {
  try {
    const res = await fetch(`${apiBase}/posts/community/${communityId}?page=1&limit=6`, {
      method: "GET",
      cache: "force-cache",
      next: {
        revalidate: PUBLIC_COMMUNITY_DATA_REVALIDATE_SECONDS,
      },
    })

    if (!res.ok) {
      return []
    }

    const json = await res.json()
    const postsContainer = json?.data?.posts || json?.data || []
    const posts = Array.isArray(postsContainer) ? postsContainer : postsContainer?.posts || []

    return posts.map((post: any) => ({
      id: String(post?.id || ""),
      title: String(post?.title || "Untitled post"),
      excerpt: String(post?.excerpt || ""),
      content: String(post?.content || ""),
      createdAt: typeof post?.createdAt === "string" ? post.createdAt : "",
      authorName: String(post?.author?.name || ""),
    }))
  } catch {
    return []
  }
}

type CommunityRatingsSnapshot = {
  averageRating: number
  ratingCount: number
}

async function fetchCommunityRatings(
  apiBase: string,
  communityId: string,
): Promise<CommunityRatingsSnapshot | null> {
  if (!communityId) {
    return null
  }
  try {
    const endpoints = [
      `${apiBase}/feedback/Community/${communityId}/stats`,
      `${apiBase}/feedback/community/${communityId}/stats`,
    ]

    for (const endpoint of endpoints) {
      const res = await fetch(endpoint, {
        method: "GET",
        cache: "force-cache",
        next: {
          revalidate: PUBLIC_COMMUNITY_DATA_REVALIDATE_SECONDS,
        },
      })

      if (!res.ok) {
        continue
      }

      const json = await res.json()
      const payload = json?.data && typeof json.data === "object" ? json.data : json
      const averageRating = asNumber(payload?.averageRating, 0)
      const ratingCount = asNumber(payload?.ratingCount, 0)

      return {
        averageRating,
        ratingCount,
      }
    }

    return null
  } catch {
    return null
  }
}

export default async function CommunityDetailsPage({ params }: CommunityDetailsPageProps) {
  // Extract slug from params (params must be awaited in Next.js 15)
  const { slug } = await params
  
  let community = null
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  const hdrs = await headers()
  const cookieHeader = hdrs.get("cookie") || ""
  const authHeader = hdrs.get("authorization") || ""
  const jar = await cookies()
  const cookieToken =
    jar.get("accessToken")?.value ||
    jar.get("token")?.value ||
    jar.get("jwt")?.value ||
    jar.get("authToken")?.value ||
    null

  const authValue = authHeader && authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader
    : (cookieToken ? `Bearer ${cookieToken}` : "")
  const requestHeaders: Record<string, string> = {
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    ...(authValue ? { Authorization: authValue } : {}),
  }

  try {
    let res = await fetch(`${apiBase}/community-aff-crea-join/${slug}`, {
      method: "GET",
      headers: requestHeaders,
      // Force server-side fetch
      cache: "no-store",
    })

    if (!res.ok) {
      // Fallback for deployments exposing community details on /communities/:slug only
      res = await fetch(`${apiBase}/communities/${slug}`, {
        method: "GET",
        headers: requestHeaders,
        cache: "no-store",
      })
    }

    if (!res.ok) {
      throw new Error(`Failed community fetch: ${res.status}`)
    }
    const json = await res.json()
    community = json?.data || json
  } catch (error) {
    console.error("Failed to fetch community:", error)
    notFound()
  }

  if (!community) {
    notFound()
  }

  // Type-safe way to handle the community data with proper serialization
  const rawCreator = (community as any)?.creator || (community as any)?.createur || null
  const creatorObject = rawCreator && typeof rawCreator === "object" ? rawCreator : null
  const creatorNameFallback =
    typeof rawCreator === "string"
      ? rawCreator
      : String((community as any)?.creatorName || (community as any)?.createurName || "").trim()

  // Normalize members: backend may send number, membersCount, array, or object with count
  const normalizedMembers = resolveMembersCount(community)

  const apiBaseForImages = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  const creatorAvatarRaw =
    ((community as any)?.creatorAvatar as string | undefined) ||
    ((creatorObject as any)?.avatar as string | undefined) ||
    ((creatorObject as any)?.profile_picture as string | undefined) ||
    ((creatorObject as any)?.photo_profil as string | undefined) ||
    ((creatorObject as any)?.photo as string | undefined)
  const { price, priceType } = normalizePricing(community)
  const rawRating = asNumber((community as any)?.averageRating ?? (community as any)?.rating, 0)
  const rawRatingCount = asNumber((community as any)?.ratingCount, 0)
  const communityId = String((community as any)?._id || community?.id || "")
  const normalizedSettings = normalizeCommunitySettings(
    (community as any)?.settings,
    String((community as any)?.name || "Community"),
  )
  const [ratingsSnapshot, rawPageContent, latestPosts] = await Promise.all([
    withTimeoutFallback(
      fetchCommunityRatings(apiBase, communityId),
      OPTIONAL_COMMUNITY_FETCH_TIMEOUT_MS,
      null,
    ),
    withTimeoutFallback(
      getCommunityPageContent(slug),
      OPTIONAL_COMMUNITY_FETCH_TIMEOUT_MS,
      null,
    ),
    normalizedSettings.showPosts
      ? withTimeoutFallback(
          fetchLatestCommunityPosts(apiBase, communityId),
          OPTIONAL_COMMUNITY_FETCH_TIMEOUT_MS,
          [] as LatestCommunityPost[],
        )
      : Promise.resolve([] as LatestCommunityPost[]),
  ])
  const rating = ratingsSnapshot ? ratingsSnapshot.averageRating : rawRating
  const ratingCount = ratingsSnapshot ? ratingsSnapshot.ratingCount : rawRatingCount
  const themeTokens = buildCommunityTheme(normalizedSettings)
  const contentWidthClass = getContentWidthClass(normalizedSettings.contentWidth)

  const communityData = {
    ...community,
    creator:
      creatorObject || creatorNameFallback
        ? {
            id: String((creatorObject as any)?._id || creatorObject?.id || ""),
            name: String((creatorObject as any)?.name || creatorNameFallback || "Unknown Creator"),
            avatar: resolveImageUrl(creatorAvatarRaw, apiBaseForImages) || undefined,
            verified: Boolean((creatorObject as any)?.verified),
          }
        : null,
    // Ensure ID is a string
    id: String((community as any)?._id || community.id || ""),
    // Membership flag if provided by backend
    isMember: Boolean((community as any)?.isMember),
    // Normalize category if backend returns an object
    category:
      typeof (community as any).category === "string"
        ? community.category
        : String((community as any).category?.name || ""),
    // Ensure tags are strings
    tags: Array.isArray(community.tags)
      ? community.tags.map((t: any) =>
          typeof t === "string" ? t : String(t?.name || t?._id || ""),
        )
      : [],
    // Use normalized members count so we never render [object Object]
    members: normalizedMembers,
    // Ensure pricing fields are always present and consistent
    price,
    priceType,
    fees_of_join: asNumber((community as any)?.fees_of_join, 0),
    pricing: (community as any)?.pricing
      ? {
          ...(community as any).pricing,
          price: asNumber((community as any).pricing?.price, price),
        }
      : { price },
    // Ensure rating is always numeric
    rating,
    ratingCount,
    // Normalize main image/cover
    coverImage: resolveImageUrl(
      (community as any).coverImage || (community as any).banner || (community as any).image || (community as any).logo,
      apiBaseForImages,
    ),
    image: resolveImageUrl(
      (community as any).coverImage || (community as any).image || (community as any).logo,
      apiBaseForImages,
    ),
    description: normalizeDisplayText((community as any).description),
    longDescription: normalizeDisplayText((community as any).longDescription),
    settings: normalizedSettings,
    isPrivate:
      typeof (community as any)?.isPrivate === "boolean"
        ? Boolean((community as any).isPrivate)
        : (community as any)?.settings?.visibility === "private",
  }

  // Only pass a plain serializable payload to client components
  const checkoutCommunityData = {
    id: communityData.id,
    slug,
    name: String((communityData as any).name || ""),
    description: String((communityData as any).description || ""),
    longDescription: String((communityData as any).longDescription || ""),
    logo: String((communityData as any).logo || ""),
    image: String((communityData as any).image || ""),
    category: String((communityData as any).category || ""),
    members: asNumber((communityData as any).members, 0),
    rating: asNumber((communityData as any).rating, 0),
    price: asNumber((communityData as any).price, 0),
    fees_of_join: asNumber((communityData as any).fees_of_join, 0),
    priceType: String((communityData as any).priceType || "free"),
    currency: String((communityData as any).currency || "TND"),
    pricing: {
      price: asNumber((communityData as any).pricing?.price, asNumber((communityData as any).price, 0)),
      currency: String((communityData as any).pricing?.currency || (communityData as any).currency || "TND"),
    },
    creator: (communityData as any).creator
      ? {
          id: String((communityData as any).creator.id || ""),
          name: String((communityData as any).creator.name || ""),
          avatar: String((communityData as any).creator.avatar || ""),
          verified: Boolean((communityData as any).creator.verified),
        }
      : null,
    creatorBankDetails: {
      ownerName: String((communityData as any)?.creatorBankDetails?.ownerName || ""),
      bankName: String((communityData as any)?.creatorBankDetails?.bankName || ""),
      rib: String((communityData as any)?.creatorBankDetails?.rib || ""),
    },
    isPrivate: Boolean((communityData as any).isPrivate),
  }

  const formatMembers = (count: number) => (count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count))

  const pageContent = normalizePageContent(rawPageContent, apiBaseForImages)

  const overviewContent =
    pageContent?.overview && pageContent.overview.visible !== false ? pageContent.overview : null
  const benefitsContent =
    pageContent?.benefits && pageContent.benefits.visible !== false ? pageContent.benefits : null
  const testimonialsContent =
    pageContent?.testimonials && pageContent.testimonials.visible !== false
      ? pageContent.testimonials
      : null
  const ctaContent =
    pageContent?.cta && pageContent.cta.visible !== false ? pageContent.cta : null

  const pageContentFeatures = (overviewContent?.cards || [])
    .filter((card) => card.visible !== false && typeof card.title === "string")
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((card) => card.title)
  const effectiveFeatures = dedupeTextList(
    normalizedSettings.features.length > 0 ? normalizedSettings.features : pageContentFeatures,
  )

  const pageContentBenefits = (benefitsContent?.benefits || [])
    .filter((benefit) => benefit.visible !== false && typeof benefit.title === "string")
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((benefit) => benefit.title)
  const effectiveBenefits = dedupeTextList(
    normalizedSettings.benefits.length > 0 ? normalizedSettings.benefits : pageContentBenefits,
  )

  const effectiveWelcomeMessage =
    normalizedSettings.welcomeMessage?.trim() || benefitsContent?.subtitle || ""

  const hasCustomContent = Boolean(pageContent)
  const shouldRenderOverview =
    normalizedSettings.showFeatures &&
    (effectiveFeatures.length > 0 || Boolean(overviewContent) || !hasCustomContent)
  const shouldRenderBenefits =
    normalizedSettings.showBenefits &&
    (effectiveBenefits.length > 0 || Boolean(benefitsContent) || !hasCustomContent)
  const shouldRenderTestimonials =
    normalizedSettings.showTestimonials &&
    (Boolean(testimonialsContent) || !hasCustomContent)
  const shouldRenderCTA = Boolean(ctaContent) || !hasCustomContent
  const shouldRenderPosts = normalizedSettings.showPosts

  const overviewTitle = overviewContent?.title || "Community Overview"
  const overviewSubtitle =
    overviewContent?.subtitle || "Everything you need to succeed is included in this community."

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(180deg, ${themeTokens.softPrimary} 0%, #ffffff 22%, #ffffff 100%)`,
      }}
    >
      <main className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute -top-28 left-[-8%] h-80 w-80 rounded-full blur-3xl"
            style={{ backgroundColor: themeTokens.softPrimary, opacity: 0.4 }}
          />
          <div
            className="absolute top-[24%] right-[-10%] h-96 w-96 rounded-full blur-3xl"
            style={{ backgroundColor: themeTokens.softSecondary, opacity: 0.35 }}
          />
          <div
            className="absolute bottom-[12%] left-[18%] h-72 w-72 rounded-full blur-3xl"
            style={{ backgroundColor: themeTokens.softPrimary, opacity: 0.26 }}
          />
        </div>
        {normalizedSettings.showHero && (
          <CommunityHero
            community={{
              ...communityData,
              slug,
            }}
            heroContent={pageContent?.hero || null}
            themeTokens={themeTokens}
            contentWidthClass={contentWidthClass}
            headerStyle={normalizedSettings.headerStyle}
            showStats={normalizedSettings.showStats}
          />
        )}

        {!communityData.isMember && !communityData.isPrivate && (
          <CommunityJoinCheckoutSection
            community={checkoutCommunityData}
            themeTokens={themeTokens}
          />
        )}

        <CommunityContentSection
          community={{
            name: communityData.name,
            description: communityData.description,
            longDescription: communityData.longDescription,
            category: communityData.category,
            tags: communityData.tags,
          }}
          welcomeMessage={normalizedSettings.welcomeMessage}
          themeTokens={themeTokens}
          contentWidthClass={contentWidthClass}
        />

        {shouldRenderOverview && (
        <section className={cn("mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12", contentWidthClass)}>
          <div
            className="overflow-hidden rounded-3xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8"
            style={{ backgroundColor: themeTokens.softPrimary }}
          >
            <div className="text-center max-w-3xl mx-auto mb-12">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
                  {overviewTitle}
                </h2>
                <p className="mt-3 text-sm sm:text-base text-gray-600 font-light">{overviewSubtitle}</p>
            </div>
              <CommunityOverview
                community={communityData}
                overviewContent={overviewContent}
                settingsFeatures={effectiveFeatures}
                themeTokens={themeTokens}
              />
          </div>
        </section>
        )}

        {shouldRenderBenefits && (
          <CommunityWhyJoin
            community={{ name: communityData.name, slug }}
            benefitsContent={benefitsContent}
            settingsBenefits={effectiveBenefits}
            welcomeMessage={effectiveWelcomeMessage}
            themeTokens={themeTokens}
            contentWidthClass={contentWidthClass}
          />
        )}
        {shouldRenderTestimonials && (
          <CommunityTestimonials
            community={{ name: communityData.name, category: communityData.category }}
            testimonialsContent={testimonialsContent}
            themeTokens={themeTokens}
            contentWidthClass={contentWidthClass}
          />
        )}
        {shouldRenderPosts && (
          <section className={cn("mx-auto px-4 sm:px-6 lg:px-8 py-12", contentWidthClass)}>
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                Latest Posts
              </h2>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                Recent updates from the community.
              </p>
            </div>
            {latestPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {latestPosts.map((post) => (
                  <article
                    key={post.id}
                    className="rounded-xl border bg-white p-4 shadow-sm"
                    style={{
                      borderColor: themeTokens.mutedBorder,
                      background: `linear-gradient(165deg, #ffffff 0%, ${themeTokens.softPrimary} 100%)`,
                    }}
                  >
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{post.title}</h3>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                      {post.excerpt || post.content || "No content preview available."}
                    </p>
                    <div className="mt-4 text-xs text-gray-500 flex items-center justify-between gap-2">
                      <span>{post.authorName || "Unknown author"}</span>
                      <span>
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ""}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div
                className="rounded-xl border border-dashed p-8 text-center text-gray-500"
                style={{ borderColor: themeTokens.mutedBorder, backgroundColor: themeTokens.softPrimary }}
              >
                No posts yet.
              </div>
            )}
          </section>
        )}
        {shouldRenderCTA && (
          <CommunityCTA
            community={{
              name: communityData.name,
              slug,
              members: communityData.members || 0,
              isMember: Boolean(communityData.isMember),
              isPrivate: Boolean(communityData.isPrivate),
            }}
            formatMembers={formatMembers}
            ctaContent={ctaContent}
            themeTokens={themeTokens}
            contentWidthClass={contentWidthClass}
          />
        )}
      </main>

      <Footer />
    </div>
  )
}
