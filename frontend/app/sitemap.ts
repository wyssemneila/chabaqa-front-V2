import { MetadataRoute } from "next"
import { getAllBlogPosts } from "@/lib/blog-content"
import { getSiteUrl } from "@/lib/seo-config"

type SitemapEntry = MetadataRoute.Sitemap[number]

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
const PUBLIC_DYNAMIC_TIMEOUT_MS = 3000

function entry(
  path: string,
  options: Pick<SitemapEntry, "changeFrequency" | "priority"> & { lastModified?: Date | string },
): SitemapEntry {
  const siteUrl = getSiteUrl()
  const normalizedPath = path === "/" ? "" : `/${path.replace(/^\/+/, "").replace(/\/+$/, "")}`
  return {
    url: `${siteUrl}${normalizedPath}`,
    lastModified: options.lastModified || new Date(),
    changeFrequency: options.changeFrequency,
    priority: options.priority,
  }
}

async function fetchJsonWithTimeout(url: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PUBLIC_DYNAMIC_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 },
      signal: controller.signal,
    })
    if (!response.ok) return null
    return response.json().catch(() => null)
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function extractArray(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.communities)) return payload.communities
  if (Array.isArray(payload?.data?.communities)) return payload.data.communities
  return []
}

function isPublicCommunity(community: any): boolean {
  const status = String(community?.status || community?.visibility || "").toLowerCase()
  const explicitPublic = community?.isPublic === true || community?.public === true
  const notPrivate = status ? status === "public" : true
  return explicitPublic || notPrivate
}

async function getPublicCommunityEntries(): Promise<SitemapEntry[]> {
  const payload = await fetchJsonWithTimeout(`${API_BASE_URL}/community-aff-crea-join/public/all`)
  return extractArray(payload)
    .filter(isPublicCommunity)
    .map((community) => String(community?.slug || community?.id || community?._id || "").trim())
    .filter(Boolean)
    .map((slug) =>
      entry(`/community/${encodeURIComponent(slug)}`, {
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      }),
    )
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: SitemapEntry[] = [
    entry("/", { changeFrequency: "daily", priority: 1 }),
    entry("/pricing", { changeFrequency: "weekly", priority: 0.9 }),
    entry("/faq", { changeFrequency: "weekly", priority: 0.9 }),
    entry("/blogs", { changeFrequency: "daily", priority: 0.9 }),
    entry("/explore", { changeFrequency: "daily", priority: 0.8 }),
    entry("/terms-of-service", { changeFrequency: "monthly", priority: 0.5 }),
    entry("/privacy-policy", { changeFrequency: "monthly", priority: 0.5 }),
  ]

  const blogPosts = getAllBlogPosts().map((post) =>
    entry(`/blogs/${post.id}`, {
      lastModified: post.lastModified || post.date,
      changeFrequency: "weekly",
      priority: post.featured ? 0.8 : 0.7,
    }),
  )

  const publicCommunities = await getPublicCommunityEntries()

  return [...staticPages, ...blogPosts, ...publicCommunities]
}
