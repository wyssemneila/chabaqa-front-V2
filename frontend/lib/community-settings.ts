import type { CommunitySettings } from "@/lib/api/types"
import { resolveImageUrl } from "@/lib/resolve-image-url"

export type NormalizedCommunitySettings = {
  primaryColor: string
  secondaryColor: string
  welcomeMessage: string
  features: string[]
  benefits: string[]
  headerStyle: "default" | "centered" | "minimal"
  contentWidth: "narrow" | "normal" | "wide" | "full"
  showStats: boolean
  showHero: boolean
  showFeatures: boolean
  showBenefits: boolean
  showTestimonials: boolean
  showPosts: boolean
  customDomain: string
  headerScripts: string
  logo: string
  heroBackground: string
  socialLinks: NonNullable<CommunitySettings["socialLinks"]>
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
    features: Array.isArray(settings.features)
      ? settings.features.filter((item) => typeof item === "string" && item.trim() !== "")
      : [],
    benefits: Array.isArray(settings.benefits)
      ? settings.benefits.filter((item) => typeof item === "string" && item.trim() !== "")
      : [],
    headerStyle:
      settings.headerStyle === "centered" || settings.headerStyle === "minimal"
        ? settings.headerStyle
        : "default",
    contentWidth:
      settings.contentWidth === "narrow" ||
      settings.contentWidth === "wide" ||
      settings.contentWidth === "full"
        ? settings.contentWidth
        : "normal",
    showStats: settings.showStats ?? true,
    showHero: settings.showHero ?? true,
    showFeatures: settings.showFeatures ?? true,
    showBenefits: settings.showBenefits ?? true,
    showTestimonials: settings.showTestimonials ?? true,
    showPosts: settings.showPosts ?? true,
    customDomain: (settings.customDomain || "").trim().toLowerCase(),
    headerScripts: settings.headerScripts || "",
    logo: resolveImageUrl(settings.logo) || "",
    heroBackground: resolveImageUrl(settings.heroBackground) || "",
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
  }
}

export function isValidCustomDomain(value: string): boolean {
  if (!value) return true
  const hostname = value.trim().toLowerCase()
  return /^(?!:\/\/)(?!.*\/)(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(
    hostname,
  )
}
