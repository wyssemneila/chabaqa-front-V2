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
  radius: string
  radiusLg: string
  fontFamily: string
  pageBackground: string
  surfaceBackground: string
  text: string
  mutedText: string
  border: string
  headingFont: string
  sectionSpacing: string
  buttonRadius: string
}

export function normalizeHexColor(value: string | undefined, fallback: string): string {
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

function fontStack(fontFamily: string): string {
  const normalized = fontFamily.trim().toLowerCase()
  if (normalized === "serif") return "Georgia, Cambria, 'Times New Roman', Times, serif"
  if (normalized === "mono") return "'SFMono-Regular', Consolas, 'Liberation Mono', monospace"
  if (normalized === "system") return "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  if (normalized === "poppins") return "Poppins, Inter, system-ui, sans-serif"
  if (normalized === "manrope") return "Manrope, Inter, system-ui, sans-serif"
  if (normalized === "space grotesk") return "'Space Grotesk', Inter, system-ui, sans-serif"
  return `${fontFamily || "Inter"}, Inter, system-ui, sans-serif`
}

export function buildCommunityTheme(settings: NormalizedCommunitySettings): CommunityThemeTokens {
  const primary = normalizeHexColor(settings.primaryColor, "#8e78fb")
  const secondary = normalizeHexColor(settings.secondaryColor, "#f48fb1")
  const accent = normalizeHexColor(settings.accentColor, secondary)
  const radiusPx = Math.min(32, Math.max(0, Number(settings.borderRadius) || 0))
  const heroImage = settings.heroBackground ? `, url("${settings.heroBackground}")` : ""
  const pageBackground =
    settings.template === "editorial"
      ? `linear-gradient(180deg, #ffffff 0%, ${rgba(primary, 0.06)} 46%, #ffffff 100%)`
      : settings.template === "immersive"
        ? `radial-gradient(circle at 20% 0%, ${rgba(primary, 0.16)}, transparent 32%), radial-gradient(circle at 82% 8%, ${rgba(secondary, 0.18)}, transparent 34%), #ffffff`
        : settings.backgroundStyle === "solid"
      ? "#ffffff"
      : settings.backgroundStyle === "soft"
        ? `linear-gradient(180deg, #ffffff 0%, ${rgba(primary, 0.08)} 42%, ${rgba(secondary, 0.09)} 100%)`
        : settings.backgroundStyle === "image" && settings.heroBackground
          ? `linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.96))${heroImage}`
          : `linear-gradient(180deg, ${rgba(primary, 0.11)} 0%, #ffffff 28%, ${rgba(secondary, 0.08)} 100%)`

  return {
    primary,
    secondary,
    primaryText: textOnColor(primary),
    secondaryText: textOnColor(secondary),
    gradient: `linear-gradient(90deg, ${primary}, ${accent})`,
    softPrimary: rgba(primary, 0.1),
    softSecondary: rgba(secondary, 0.12),
    mutedBorder: rgba(primary, 0.24),
    radius: `${radiusPx}px`,
    radiusLg: `${Math.max(radiusPx + 8, radiusPx)}px`,
    fontFamily: fontStack(settings.fontFamily),
    pageBackground,
    surfaceBackground:
      settings.template === "minimal"
        ? "#ffffff"
        : settings.template === "editorial"
          ? `linear-gradient(180deg, #ffffff 0%, ${rgba(secondary, 0.08)} 100%)`
          : settings.template === "immersive"
            ? `linear-gradient(135deg, ${rgba(primary, 0.12)} 0%, #ffffff 50%, ${rgba(secondary, 0.14)} 100%)`
          : `linear-gradient(165deg, #ffffff 0%, ${rgba(primary, 0.07)} 100%)`,
    text: normalizeHexColor(settings.pageTextColor, "#111827"),
    mutedText: normalizeHexColor(settings.mutedTextColor, "#4b5563"),
    border: normalizeHexColor(settings.borderColor, rgba(primary, 0.24)),
    headingFont: fontStack(settings.headingFont),
    sectionSpacing: settings.sectionSpacing === "compact" ? "2.5rem" : settings.sectionSpacing === "generous" ? "5rem" : "3.5rem",
    buttonRadius: settings.buttonStyle === "pill" ? "9999px" : settings.buttonStyle === "square" ? "0px" : `${radiusPx}px`,
  }
}

/** WCAG contrast ratio for creator-side guidance. */
export function getContrastRatio(foreground: string, background: string): number {
  const luminance = (hex: string) => {
    const { r, g, b } = hexToRgb(normalizeHexColor(hex, "#ffffff"))
    return [r, g, b].map((channel) => {
      const normalized = channel / 255
      return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4)
    }).reduce((value, channel, index) => value + channel * [0.2126, 0.7152, 0.0722][index], 0)
  }
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (light + 0.05) / (dark + 0.05)
}

export function getContentWidthClass(
  width: NormalizedCommunitySettings["contentWidth"],
): string {
  if (width === "narrow") return "max-w-4xl"
  if (width === "wide") return "max-w-[90rem]"
  if (width === "full") return "max-w-none"
  return "max-w-7xl"
}
