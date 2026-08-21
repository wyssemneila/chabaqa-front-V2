import { buildCommunityTheme, getContrastRatio } from "@/lib/community-theme"
import { normalizeCommunitySettings } from "@/lib/community-settings"
import {
  buildCommunityUpdatePayload,
  buildPageContentUpdatePayload,
  buildSettingsUpdatePayload,
  createCustomizeDraft,
  validateCustomizeDraft,
} from "../community-customize-model"

const community = {
  id: "community-1",
  slug: "creator-launch-studio",
  name: "Creator Launch Studio",
  description: "Short description",
  longDescription: "Long description",
  category: "Business",
  tags: ["launch", "creator"],
  logo: "https://cdn.example.com/logo.png",
  coverImage: "https://cdn.example.com/cover.png",
  price: 29,
  priceType: "monthly",
  type: "community",
  settings: {
    primaryColor: "#123456",
    secondaryColor: "#abcdef",
    template: "immersive",
    fontFamily: "Manrope",
    borderRadius: 18,
    backgroundStyle: "image",
    heroLayout: "media-left",
    enableParallax: true,
    heroBackground: "https://cdn.example.com/hero.png",
    gallery: ["https://cdn.example.com/one.png"],
    videoUrl: "https://youtube.com/watch?v=demo",
    customSections: [{ id: "section-1", type: "text", title: "Bonus", content: "Private resource", visible: true }],
  },
}

describe("community customize model", () => {
  it("normalizes underused settings for preview and public rendering", () => {
    const settings = normalizeCommunitySettings(community.settings as any, community.name)

    expect(settings.template).toBe("immersive")
    expect(settings.fontFamily).toBe("Manrope")
    expect(settings.borderRadius).toBe(18)
    expect(settings.backgroundStyle).toBe("image")
    expect(settings.heroLayout).toBe("media-left")
    expect(settings.enableParallax).toBe(true)
    expect(settings.gallery).toEqual(["https://cdn.example.com/one.png"])
    expect(settings.videoUrl).toBe("https://youtube.com/watch?v=demo")
    expect(settings.customSections).toHaveLength(1)
  })

  it("builds theme tokens with contrast, radius, font, and background", () => {
    const settings = normalizeCommunitySettings(community.settings as any, community.name)
    const theme = buildCommunityTheme(settings)

    expect(theme.primary).toBe("#123456")
    expect(theme.primaryText).toBe("#ffffff")
    expect(theme.radius).toBe("18px")
    expect(theme.radiusLg).toBe("26px")
    expect(theme.fontFamily).toContain("Manrope")
    expect(theme.pageBackground).toContain("radial-gradient")
  })

  it("normalizes the versioned Brand Studio configuration and keeps only safe typed sections", () => {
    const settings = normalizeCommunitySettings({
      ...community.settings,
      brand: {
        version: 2,
        colors: { accent: "#ff8800", text: "#101010" },
        typography: { headingFont: "Space Grotesk", scale: "spacious" },
        layout: { buttonStyle: "pill", sectionSpacing: "generous" },
        sections: [
          { id: "quote-1", type: "quote", title: "Member story", content: "A meaningful result", visible: true, order: 3 },
          { id: "unsafe", type: "script", title: "", content: "", visible: true },
        ],
      },
    } as any, community.name)

    expect(settings.brandVersion).toBe(2)
    expect(settings.accentColor).toBe("#ff8800")
    expect(settings.headingFont).toBe("Space Grotesk")
    expect(settings.buttonStyle).toBe("pill")
    expect(settings.sectionSpacing).toBe("generous")
    expect(settings.brandSections).toEqual([
      expect.objectContaining({ id: "quote-1", type: "quote", title: "Member story", order: 3 }),
    ])
    expect(getContrastRatio("#000000", "#ffffff")).toBeGreaterThanOrEqual(21)
  })

  it("maps draft values to existing backend save payloads", () => {
    const draft = createCustomizeDraft(community)
    draft.settings.primaryColor = "#000000"
    draft.settings.secondaryColor = "#ffffff"
    draft.settings.features = ["Workshops", "Templates"]
    draft.settings.benefits = ["Launch faster"]
    draft.pageContent.hero.customTitle = "Launch with clarity"
    draft.pageContent.overview.cards[0].title = "Weekly roadmap"
    draft.pageContent.benefits.benefits[0].title = "Accountability"
    draft.pageContent.isPublished = true

    expect(buildCommunityUpdatePayload(draft)).toMatchObject({
      name: "Creator Launch Studio",
      price: 29,
      priceType: "monthly",
      type: "community",
    })

    expect(buildSettingsUpdatePayload(draft)).toMatchObject({
      primaryColor: "#000000",
      secondaryColor: "#ffffff",
      features: ["Workshops", "Templates"],
      benefits: ["Launch faster"],
      template: "immersive",
      videoUrl: "https://youtube.com/watch?v=demo",
      brand: expect.objectContaining({
        version: 1,
        sections: [expect.objectContaining({ id: "section-1", type: "text", title: "Bonus" })],
      }),
    })

    expect(buildPageContentUpdatePayload(draft).hero).toMatchObject({
      customTitle: "Launch with clarity",
    })
  })

  it("validates colors and paid pricing before save", () => {
    const draft = createCustomizeDraft(community)
    draft.settings.primaryColor = "not-a-color"
    draft.priceType = "monthly"
    draft.price = -4

    expect(validateCustomizeDraft(draft)).toEqual(
      expect.arrayContaining([
        "Primary color must be a valid hex color.",
        "Paid communities need a valid non-negative price.",
      ]),
    )
  })
})
