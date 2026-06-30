import type { CommunitySettings } from "@/lib/api/types"
import { resolveImageUrl } from "@/lib/resolve-image-url"

export type NormalizedCommunitySettings = {
  primaryColor: string
  secondaryColor: string
  welcomeMessage: string
  features: string[]
  benefits: string[]
  template: "modern" | "editorial" | "minimal" | "immersive"
  fontFamily: string
  borderRadius: number
  backgroundStyle: "solid" | "soft" | "gradient" | "image"
  heroLayout: "centered" | "split" | "media-left" | "media-right"
  headerStyle: "default" | "centered" | "minimal"
  contentWidth: "narrow" | "normal" | "wide" | "full"
  visibility: "public" | "private"
  allowInvites: boolean
  showStats: boolean
  showHero: boolean
  showFeatures: boolean
  showBenefits: boolean
  showTestimonials: boolean
  showPosts: boolean
  enableParallax: boolean
  logo: string
  heroBackground: string
  gallery: string[]
  videoUrl: string
  socialLinks: NonNullable<CommunitySettings["socialLinks"]>
  customSections: Array<{
    id?: string
    type?: string
    title?: string
    content?: string
    visible?: boolean
    [key: string]: unknown
  }>
  metaTitle: string
  metaDescription: string
}

function normalizeChoice<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback
}

function normalizeNumber(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

function normalizeStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim() !== "").map((item) => item.trim())
    : []
}

export function normalizeCommunitySettings(
  rawSettings: CommunitySettings | null | undefined,
  communityName = "Community",
): NormalizedCommunitySettings {
  const settings = rawSettings || {}

  return {
    primaryColor: settings.primaryColor || "#8e78fb",
    secondaryColor: settings.secondaryColor || "#f48fb1",
    welcomeMessage: settings.welcomeMessage || `Bienvenue dans ${communityName} !`,
    features: normalizeStringList(settings.features),
    benefits: normalizeStringList(settings.benefits),
    template: normalizeChoice(settings.template, ["modern", "editorial", "minimal", "immersive"] as const, "modern"),
    fontFamily: typeof settings.fontFamily === "string" && settings.fontFamily.trim() ? settings.fontFamily.trim() : "Inter",
    borderRadius: normalizeNumber(settings.borderRadius, 12, 0, 32),
    backgroundStyle: normalizeChoice(settings.backgroundStyle, ["solid", "soft", "gradient", "image"] as const, "gradient"),
    heroLayout: normalizeChoice(settings.heroLayout, ["centered", "split", "media-left", "media-right"] as const, "centered"),
    headerStyle: normalizeChoice(settings.headerStyle, ["default", "centered", "minimal"] as const, "default"),
    contentWidth: normalizeChoice(settings.contentWidth, ["narrow", "normal", "wide", "full"] as const, "normal"),
    visibility: normalizeChoice(settings.visibility, ["public", "private"] as const, "public"),
    allowInvites: settings.allowInvites ?? true,
    showStats: settings.showStats ?? true,
    showHero: settings.showHero ?? true,
    showFeatures: settings.showFeatures ?? true,
    showBenefits: settings.showBenefits ?? true,
    showTestimonials: settings.showTestimonials ?? true,
    showPosts: settings.showPosts ?? true,
    enableParallax: settings.enableParallax ?? false,
    logo: resolveImageUrl(settings.logo) || "",
    heroBackground: resolveImageUrl(settings.heroBackground) || "",
    gallery: normalizeStringList(settings.gallery).map((item) => resolveImageUrl(item) || item),
    videoUrl: typeof settings.videoUrl === "string" ? settings.videoUrl.trim() : "",
    socialLinks: {
      twitter: settings.socialLinks?.twitter || "",
      instagram: settings.socialLinks?.instagram || "",
      linkedin: settings.socialLinks?.linkedin || "",
      discord: settings.socialLinks?.discord || "",
      behance: settings.socialLinks?.behance || "",
      github: settings.socialLinks?.github || "",
      facebook: settings.socialLinks?.facebook || "",
      youtube: settings.socialLinks?.youtube || "",
      tiktok: settings.socialLinks?.tiktok || "",
      website: settings.socialLinks?.website || "",
    },
    customSections: Array.isArray(settings.customSections)
      ? settings.customSections.filter((item) => item && typeof item === "object")
      : [],
    metaTitle: typeof settings.metaTitle === "string" ? settings.metaTitle : "",
    metaDescription: typeof settings.metaDescription === "string" ? settings.metaDescription : "",
  }
}
