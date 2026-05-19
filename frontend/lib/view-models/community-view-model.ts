import { resolveImageUrl } from "@/lib/resolve-image-url"

export interface CommunityViewModel {
  id: string
  slug: string
  name: string
  logoUrl: string
  coverUrl: string
  thumbnailUrl: string
  membersCount: number
  primaryColor?: string
}

const asString = (value: unknown, fallback = ""): string =>
  typeof value === "string" && value.trim() ? value.trim() : fallback

const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

const fallbackLogo = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Community")}&size=256&background=8e78fb&color=ffffff&format=png`

const fallbackCover = (raw: any) => {
  const category = String(raw?.category || raw?.settings?.template || raw?.name || "").toLowerCase()
  if (category.includes("fitness")) return "/banners-community/community-3-fitness.png"
  if (category.includes("design") || category.includes("brand")) return "/banners-community/community-2-branding.png"
  if (category.includes("dev") || category.includes("tech")) return "/banners-community/community-4-dev.png"
  return "/banners-community/community-1-email-marketing.png"
}

export function toCommunityViewModel(raw: any): CommunityViewModel {
  const name = asString(raw?.name || raw?.nom, "Community")
  const membersCount = Math.max(
    asNumber(raw?.membersCount),
    asNumber(raw?.members),
    Array.isArray(raw?.members) ? raw.members.length : 0,
  )

  const logoUrl =
    resolveImageUrl(raw?.logoUrl) ||
    resolveImageUrl(raw?.logo) ||
    resolveImageUrl(raw?.settings?.logo) ||
    fallbackLogo(name)
  const coverUrl =
    resolveImageUrl(raw?.coverUrl) ||
    resolveImageUrl(raw?.coverImage) ||
    resolveImageUrl(raw?.image) ||
    resolveImageUrl(raw?.settings?.heroBackground) ||
    fallbackCover(raw)

  return {
    id: asString(raw?.id || raw?._id),
    slug: asString(raw?.slug),
    name,
    logoUrl,
    coverUrl,
    thumbnailUrl: resolveImageUrl(raw?.thumbnailUrl) || logoUrl || coverUrl,
    membersCount,
    primaryColor: asString(raw?.primaryColor || raw?.settings?.primaryColor, undefined as any),
  }
}
