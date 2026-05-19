import { resolveImageUrl } from "@/lib/resolve-image-url"

describe("resolveImageUrl", () => {
  it("keeps uploaded media on the same origin so Next and nginx can proxy it", () => {
    expect(resolveImageUrl("/uploads/image/banner.png")).toBe("/uploads/image/banner.png")
    expect(resolveImageUrl("uploads/image/banner.png")).toBe("/uploads/image/banner.png")
    expect(resolveImageUrl("https://api.chabaqa.io/uploads/image/banner.png")).toBe("/uploads/image/banner.png")
    expect(resolveImageUrl("http://51.254.132.77:3000/uploads/image/banner.png")).toBe("/uploads/image/banner.png")
  })

  it("keeps local public assets local", () => {
    expect(resolveImageUrl("/logo_chabaqa.png")).toBe("/logo_chabaqa.png")
    expect(resolveImageUrl("/banners-community/community-1-email-marketing.png")).toBe(
      "/banners-community/community-1-email-marketing.png",
    )
  })
})
