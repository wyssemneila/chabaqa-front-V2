import type {
  BenefitItem,
  CommunityPageContentUpdate,
  OverviewCard,
  PageContent,
  Testimonial,
} from "@/lib/api/community-page-content"
import type { Community, CommunitySettings } from "@/lib/api/types"
import {
  normalizeCommunitySettings,
  type NormalizedCommunitySettings,
} from "@/lib/community-settings"

export type CommunityCustomizeDraft = {
  id: string
  slug: string
  name: string
  description: string
  longDescription: string
  category: string
  tags: string[]
  logo: string
  coverImage: string
  price: number
  priceType: "free" | "one-time" | "monthly" | "yearly"
  type: "community" | "course" | "challenge" | "event" | "oneToOne" | "product"
  settings: NormalizedCommunitySettings
  pageContent: EditablePageContent
}

export type EditablePageContent = {
  hero: PageContent["hero"]
  overview: PageContent["overview"]
  benefits: PageContent["benefits"]
  testimonials: PageContent["testimonials"]
  cta: PageContent["cta"]
  isPublished: boolean
  version: number
}

export const HEX_COLOR_RE = /^#([0-9a-f]{6}|[0-9a-f]{3})$/i

const DEFAULT_AVATAR_URL =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80"

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function asTags(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === "string" ? item : String((item as any)?.name || "")))
    .map((item) => item.trim())
    .filter(Boolean)
}

export function makeCustomizeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export function getCommunityEntityId(community: Partial<Community> | any): string {
  const raw = community?._id || community?.id
  return raw && typeof raw.toString === "function" ? raw.toString() : ""
}

function syncOrder<T extends { order: number }>(items: T[]): T[] {
  return items.map((item, index) => ({ ...item, order: index }))
}

function sanitizeList(values: string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean)
}

function withDefaultCards(name: string, settings: NormalizedCommunitySettings): OverviewCard[] {
  const source =
    settings.features.length > 0
      ? settings.features
      : ["Live sessions", "Resource library", "Member discussions"]

  return source.slice(0, 6).map((title, index) => ({
    id: makeCustomizeId("overview"),
    title,
    description:
      index === 0
        ? `Focused experiences and guided learning inside ${name}.`
        : "A practical way for members to learn, apply, and keep momentum.",
    icon: index === 0 ? "Sparkles" : index === 1 ? "BookOpen" : "Users",
    iconColor: index % 2 === 0 ? settings.primaryColor : settings.secondaryColor,
    order: index,
    visible: true,
  }))
}

function withDefaultBenefits(settings: NormalizedCommunitySettings): BenefitItem[] {
  const source =
    settings.benefits.length > 0
      ? settings.benefits
      : ["Clear roadmap", "Creator feedback", "Accountability with peers"]

  return source.slice(0, 8).map((title, index) => ({
    id: makeCustomizeId("benefit"),
    title,
    description: "Designed to turn attention into progress with support at each step.",
    icon: index === 0 ? "Target" : index === 1 ? "MessageCircle" : "CheckCircle",
    iconColor: index % 2 === 0 ? settings.primaryColor : settings.secondaryColor,
    order: index,
    visible: true,
  }))
}

export function buildDefaultPageContent(
  community: Partial<Community> | any,
  settings: NormalizedCommunitySettings,
): EditablePageContent {
  const name = asText(community?.name, "Community")
  const description = asText(community?.longDescription || community?.description, "")

  return {
    hero: {
      customTitle: name,
      customSubtitle: description,
      customBanner: settings.heroBackground || asText(community?.coverImage || community?.image, ""),
      ctaButtonText: asNumber(community?.price, 0) > 0 ? "Join now" : "Join free",
      showMemberCount: true,
      showRating: true,
      showCreator: true,
    },
    overview: {
      title: "What members get",
      subtitle: "A clear overview of the experience people will find when they join.",
      visible: true,
      cards: withDefaultCards(name, settings),
    },
    benefits: {
      titlePrefix: "Why join",
      titleSuffix: name,
      subtitle: settings.welcomeMessage,
      visible: true,
      ctaTitle: "Ready to start?",
      ctaSubtitle: "Join the community and get access to the full experience.",
      benefits: withDefaultBenefits(settings),
    },
    testimonials: {
      title: "Loved by members",
      subtitle: "Add quotes from members to make the landing page feel credible.",
      visible: true,
      showRatings: true,
      testimonials: [],
    },
    cta: {
      title: `Join ${name}`,
      subtitle: description || "Start with the community today.",
      buttonText: asNumber(community?.price, 0) > 0 ? "Join now" : "Join free",
      visible: true,
      customBackground: "",
    },
    isPublished: false,
    version: 1,
  }
}

function normalizePageContentDraft(
  community: Partial<Community> | any,
  settings: NormalizedCommunitySettings,
  content?: PageContent | null,
): EditablePageContent {
  const fallback = buildDefaultPageContent(community, settings)
  if (!content) return fallback

  return {
    hero: {
      ...fallback.hero,
      ...(content.hero || {}),
      customTitle: asText(content.hero?.customTitle, fallback.hero.customTitle),
      customSubtitle: asText(content.hero?.customSubtitle, fallback.hero.customSubtitle),
      customBanner: asText(content.hero?.customBanner, fallback.hero.customBanner || ""),
      ctaButtonText: asText(content.hero?.ctaButtonText, fallback.hero.ctaButtonText),
      showMemberCount: content.hero?.showMemberCount ?? true,
      showRating: content.hero?.showRating ?? true,
      showCreator: content.hero?.showCreator ?? true,
    },
    overview: {
      ...fallback.overview,
      ...(content.overview || {}),
      cards: syncOrder([...(content.overview?.cards || fallback.overview.cards)]),
      visible: content.overview?.visible ?? true,
    },
    benefits: {
      ...fallback.benefits,
      ...(content.benefits || {}),
      benefits: syncOrder([...(content.benefits?.benefits || fallback.benefits.benefits)]),
      visible: content.benefits?.visible ?? true,
    },
    testimonials: {
      ...fallback.testimonials,
      ...(content.testimonials || {}),
      testimonials: syncOrder([...(content.testimonials?.testimonials || [])]),
      visible: content.testimonials?.visible ?? true,
      showRatings: content.testimonials?.showRatings ?? true,
    },
    cta: {
      ...fallback.cta,
      ...(content.cta || {}),
      customBackground: asText(content.cta?.customBackground, ""),
      visible: content.cta?.visible ?? true,
    },
    isPublished: content.isPublished ?? false,
    version: content.version || 1,
  }
}

export function createCustomizeDraft(
  community: Partial<Community> | any,
  pageContent?: PageContent | null,
): CommunityCustomizeDraft {
  const name = asText(community?.name, "Community")
  const settings = normalizeCommunitySettings(community?.settings as CommunitySettings | undefined, name)
  const logo = asText(community?.logo || community?.logoUrl || settings.logo, "")
  const coverImage = asText(community?.coverImage || community?.coverUrl || community?.image || settings.heroBackground, "")

  return {
    id: getCommunityEntityId(community),
    slug: asText(community?.slug, ""),
    name,
    description: asText(community?.description, ""),
    longDescription: asText(community?.longDescription, ""),
    category: asText(community?.category, ""),
    tags: asTags(community?.tags),
    logo,
    coverImage,
    price: asNumber(community?.price ?? community?.fees_of_join, 0),
    priceType: (["free", "one-time", "monthly", "yearly"].includes(community?.priceType)
      ? community.priceType
      : asNumber(community?.price ?? community?.fees_of_join, 0) > 0
        ? "one-time"
        : "free") as CommunityCustomizeDraft["priceType"],
    type: (["community", "course", "challenge", "event", "oneToOne", "product"].includes(community?.type)
      ? community.type
      : "community") as CommunityCustomizeDraft["type"],
    settings: {
      ...settings,
      logo: settings.logo || logo,
      heroBackground: settings.heroBackground || coverImage,
    },
    pageContent: normalizePageContentDraft(community, settings, pageContent),
  }
}

export function cloneCustomizeDraft(draft: CommunityCustomizeDraft): CommunityCustomizeDraft {
  return JSON.parse(JSON.stringify(draft)) as CommunityCustomizeDraft
}

export function serializeCustomizeDraft(draft: CommunityCustomizeDraft) {
  return {
    ...draft,
    tags: sanitizeList(draft.tags),
    settings: {
      ...draft.settings,
      features: sanitizeList(draft.settings.features),
      benefits: sanitizeList(draft.settings.benefits),
      gallery: sanitizeList(draft.settings.gallery),
    },
  }
}

export function buildCommunityUpdatePayload(draft: CommunityCustomizeDraft) {
  return {
    name: draft.name.trim(),
    description: draft.description.trim(),
    longDescription: draft.longDescription.trim(),
    category: draft.category.trim(),
    tags: sanitizeList(draft.tags),
    logo: draft.logo.trim(),
    coverImage: draft.coverImage.trim(),
    price: draft.priceType === "free" ? 0 : Number(draft.price) || 0,
    priceType: draft.priceType,
    type: draft.type,
  }
}

export function buildSettingsUpdatePayload(draft: CommunityCustomizeDraft) {
  const settings = draft.settings
  return {
    primaryColor: settings.primaryColor.trim(),
    secondaryColor: settings.secondaryColor.trim(),
    welcomeMessage: settings.welcomeMessage.trim(),
    features: sanitizeList(settings.features),
    benefits: sanitizeList(settings.benefits),
    template: settings.template,
    fontFamily: settings.fontFamily.trim(),
    borderRadius: Number(settings.borderRadius) || 0,
    backgroundStyle: settings.backgroundStyle,
    heroLayout: settings.heroLayout,
    headerStyle: settings.headerStyle,
    contentWidth: settings.contentWidth,
    visibility: settings.visibility,
    allowInvites: settings.allowInvites,
    showStats: settings.showStats,
    showHero: settings.showHero,
    showFeatures: settings.showFeatures,
    showBenefits: settings.showBenefits,
    showTestimonials: settings.showTestimonials,
    showPosts: settings.showPosts,
    enableParallax: settings.enableParallax,
    logo: settings.logo.trim() || draft.logo.trim(),
    heroBackground: settings.heroBackground.trim() || draft.coverImage.trim(),
    gallery: sanitizeList(settings.gallery),
    videoUrl: settings.videoUrl.trim(),
    socialLinks: settings.socialLinks,
    customSections: settings.customSections,
    metaTitle: settings.metaTitle.trim(),
    metaDescription: settings.metaDescription.trim(),
  }
}

function cleanOptionalUrl(value?: string) {
  const trimmed = (value || "").trim()
  return trimmed ? trimmed : undefined
}

function sanitizeOverviewCard(card: OverviewCard, order: number): OverviewCard {
  return {
    ...card,
    id: card.id || makeCustomizeId("overview"),
    title: card.title.trim(),
    description: card.description.trim(),
    icon: card.icon.trim() || "Sparkles",
    iconColor: card.iconColor.trim(),
    order,
    visible: card.visible !== false,
  }
}

function sanitizeBenefitItem(item: BenefitItem, order: number): BenefitItem {
  return {
    ...item,
    id: item.id || makeCustomizeId("benefit"),
    title: item.title.trim(),
    description: item.description.trim(),
    icon: item.icon.trim() || "CheckCircle",
    iconColor: item.iconColor.trim(),
    order,
    visible: item.visible !== false,
  }
}

function sanitizeTestimonial(item: Testimonial, order: number): Testimonial {
  return {
    ...item,
    id: item.id || makeCustomizeId("testimonial"),
    name: item.name.trim(),
    role: item.role.trim(),
    avatar: item.avatar.trim() || DEFAULT_AVATAR_URL,
    rating: Math.min(5, Math.max(1, Number(item.rating) || 5)),
    content: item.content.trim(),
    order,
    visible: item.visible !== false,
    createdAt: item.createdAt || new Date().toISOString(),
  }
}

export function buildPageContentUpdatePayload(
  draft: CommunityCustomizeDraft,
): CommunityPageContentUpdate {
  const page = draft.pageContent
  const hero = {
    customTitle: page.hero.customTitle?.trim(),
    customSubtitle: page.hero.customSubtitle?.trim(),
    ...("customBanner" in page.hero
      ? { customBanner: cleanOptionalUrl(page.hero.customBanner) }
      : {}),
    ctaButtonText: page.hero.ctaButtonText.trim(),
    showMemberCount: page.hero.showMemberCount,
    showRating: page.hero.showRating,
    showCreator: page.hero.showCreator,
  }

  return {
    hero,
    overview: {
      ...page.overview,
      title: page.overview.title.trim(),
      subtitle: page.overview.subtitle.trim(),
      visible: page.overview.visible,
      cards: page.overview.cards
        .filter((card) => card.title.trim() && card.description.trim())
        .map(sanitizeOverviewCard),
    },
    benefits: {
      ...page.benefits,
      titlePrefix: page.benefits.titlePrefix.trim(),
      titleSuffix: page.benefits.titleSuffix?.trim(),
      subtitle: page.benefits.subtitle?.trim(),
      ctaTitle: page.benefits.ctaTitle.trim(),
      ctaSubtitle: page.benefits.ctaSubtitle.trim(),
      visible: page.benefits.visible,
      benefits: page.benefits.benefits
        .filter((item) => item.title.trim() && item.description.trim())
        .map(sanitizeBenefitItem),
    },
    testimonials: {
      ...page.testimonials,
      title: page.testimonials.title.trim(),
      subtitle: page.testimonials.subtitle.trim(),
      visible: page.testimonials.visible,
      showRatings: page.testimonials.showRatings,
      testimonials: page.testimonials.testimonials
        .filter((item) => item.name.trim() && item.content.trim())
        .map(sanitizeTestimonial),
    },
    cta: {
      title: page.cta.title.trim(),
      subtitle: page.cta.subtitle.trim(),
      buttonText: page.cta.buttonText.trim(),
      visible: page.cta.visible,
      customBackground: cleanOptionalUrl(page.cta.customBackground),
    },
  }
}

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_RE.test(value.trim())
}

export function validateCustomizeDraft(draft: CommunityCustomizeDraft): string[] {
  const errors: string[] = []
  if (!draft.name.trim()) errors.push("Community name is required.")
  if (!isValidHexColor(draft.settings.primaryColor)) errors.push("Primary color must be a valid hex color.")
  if (!isValidHexColor(draft.settings.secondaryColor)) errors.push("Secondary color must be a valid hex color.")
  if (draft.priceType !== "free" && (!Number.isFinite(Number(draft.price)) || Number(draft.price) < 0)) {
    errors.push("Paid communities need a valid non-negative price.")
  }

  draft.pageContent.overview.cards.forEach((card, index) => {
    if (card.iconColor && !isValidHexColor(card.iconColor)) {
      errors.push(`Overview card ${index + 1} needs a valid icon color.`)
    }
  })

  draft.pageContent.benefits.benefits.forEach((benefit, index) => {
    if (benefit.iconColor && !isValidHexColor(benefit.iconColor)) {
      errors.push(`Benefit ${index + 1} needs a valid icon color.`)
    }
  })

  return errors
}
