import type { NormalizedCommunitySettings } from "@/lib/community-settings"

export type CommunityThemeTokens = {
  primary: string
  secondary: string
  primaryText: string
  secondaryText: string
  gradient: string
  softPrimary: string
  softSecondary: string
  mutedBorder: string
}

function normalizeHexColor(value: string | undefined, fallback: string): string {
  const color = (value || "").trim()
  return /^#([0-9a-f]{6}|[0-9a-f]{3})$/i.test(color) ? color : fallback
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "")
  const full = normalized.length === 3 ? normalized.split("").map((c) => c + c).join("") : normalized
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function textOnColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? "#111827" : "#ffffff"
}

export function buildCommunityTheme(settings: NormalizedCommunitySettings): CommunityThemeTokens {
  const primary = normalizeHexColor(settings.primaryColor, "#8e78fb")
  const secondary = normalizeHexColor(settings.secondaryColor, "#f48fb1")
  return {
    primary,
    secondary,
    primaryText: textOnColor(primary),
    secondaryText: textOnColor(secondary),
    gradient: `linear-gradient(90deg, ${primary}, ${secondary})`,
    softPrimary: rgba(primary, 0.1),
    softSecondary: rgba(secondary, 0.12),
    mutedBorder: rgba(primary, 0.24),
  }
}

export function getContentWidthClass(
  width: NormalizedCommunitySettings["contentWidth"],
): string {
  if (width === "narrow") return "max-w-4xl"
  if (width === "wide") return "max-w-[90rem]"
  if (width === "full") return "max-w-none"
  return "max-w-7xl"
}
