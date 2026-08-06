import type { CommunityBrandConfig, CommunityBrandSection, CommunitySettings } from "@/lib/api/types"
import { resolveImageUrl } from "@/lib/resolve-image-url"

export type NormalizedCommunitySettings = {
  brandVersion: number
  brandStatus: "draft" | "published"
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
  accentColor: string
  pageTextColor: string
  mutedTextColor: string
  surfaceColor: string
  borderColor: string
  headingFont: string
  bodyFont: string
  typeScale: "compact" | "comfortable" | "spacious"
  buttonStyle: "rounded" | "pill" | "square"
  cardDensity: "compact" | "comfortable"
  sectionSpacing: "compact" | "normal" | "generous"
  stickyHeader: boolean
  navigationCtaLabel: string
  navigationCtaUrl: string
  footerText: string
  favicon: string
  wordmark: string
  tagline: string
  ogImage: string
  canonicalUrl: string
  noIndex: boolean
  brandSections: CommunityBrandSection[]
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

function normalizeHex(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim())
    ? value.trim()
    : fallback
}

function normalizeBrandSections(value: unknown): CommunityBrandSection[] {
  if (!Array.isArray(value)) return []
  const types = ["text", "image", "video", "quote", "stats", "cta", "link"] as const
  return value.slice(0, 20).flatMap((item, index) => {
    if (!item || typeof item !== "object") return []
    const section = item as Record<string, unknown>
    const type = typeof section.type === "string" && types.includes(section.type as (typeof types)[number])
      ? section.type as CommunityBrandSection["type"]
      : "text"
    const title = typeof section.title === "string" ? section.title.trim().slice(0, 160) : ""
    const content = typeof section.content === "string" ? section.content.trim().slice(0, 4000) : ""
    if (!title && !content) return []
    return [{
      id: typeof section.id === "string" && section.id.trim() ? section.id.trim().slice(0, 100) : `section-${index + 1}`,
      type,
      title: title || `Section ${index + 1}`,
      content,
      visible: section.visible !== false,
      order: normalizeNumber(section.order, index, 0, 100),
    }]
  }).sort((a, b) => a.order - b.order)
}

export function normalizeCommunitySettings(
  rawSettings: CommunitySettings | null | undefined,
  communityName = "Community",
): NormalizedCommunitySettings {
  const settings = rawSettings || {}
  const brand = (settings.brand || {}) as CommunityBrandConfig
  const colors = brand.colors || {}
  const typography = brand.typography || {}
  const layout = brand.layout || {}
  const navigation = brand.navigation || {}
  const seo = brand.seo || {}
  const identity = brand.identity || {}

  return {
    brandVersion: normalizeNumber(brand.version, 1, 1, 100),
    brandStatus: brand.status === "draft" ? "draft" : "published",
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
    accentColor: normalizeHex(colors.accent, settings.secondaryColor || "#f48fb1"),
    pageTextColor: normalizeHex(colors.text, "#111827"),
    mutedTextColor: normalizeHex(colors.mutedText, "#4b5563"),
    surfaceColor: normalizeHex(colors.surface, "#ffffff"),
    borderColor: normalizeHex(colors.border, "#e5e7eb"),
    headingFont: typeof typography.headingFont === "string" && typography.headingFont.trim() ? typography.headingFont.trim() : (typeof settings.fontFamily === "string" ? settings.fontFamily : "Inter"),
    bodyFont: typeof typography.bodyFont === "string" && typography.bodyFont.trim() ? typography.bodyFont.trim() : (typeof settings.fontFamily === "string" ? settings.fontFamily : "Inter"),
    typeScale: normalizeChoice(typography.scale, ["compact", "comfortable", "spacious"] as const, "comfortable"),
    buttonStyle: normalizeChoice(layout.buttonStyle, ["rounded", "pill", "square"] as const, "rounded"),
    cardDensity: normalizeChoice(layout.cardDensity, ["compact", "comfortable"] as const, "comfortable"),
    sectionSpacing: normalizeChoice(layout.sectionSpacing, ["compact", "normal", "generous"] as const, "normal"),
    stickyHeader: navigation.sticky ?? false,
    navigationCtaLabel: typeof navigation.ctaLabel === "string" ? navigation.ctaLabel.trim().slice(0, 80) : "",
    navigationCtaUrl: typeof navigation.ctaUrl === "string" ? navigation.ctaUrl.trim().slice(0, 1000) : "",
    footerText: typeof navigation.footerText === "string" ? navigation.footerText.trim().slice(0, 280) : "",
    favicon: resolveImageUrl(identity.favicon) || "",
    wordmark: typeof identity.wordmark === "string" ? identity.wordmark.trim().slice(0, 120) : "",
    tagline: typeof identity.tagline === "string" ? identity.tagline.trim().slice(0, 240) : "",
    ogImage: resolveImageUrl(seo.ogImage) || "",
    canonicalUrl: typeof seo.canonicalUrl === "string" ? seo.canonicalUrl.trim().slice(0, 1000) : "",
    noIndex: seo.noIndex === true,
    brandSections: normalizeBrandSections(brand.sections || settings.customSections),
  }
}
