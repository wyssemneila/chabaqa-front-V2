import { toCommunityViewModel } from "@/lib/view-models/community-view-model"

describe("toCommunityViewModel", () => {
  it("uses normalized backend media fields first", () => {
    expect(
      toCommunityViewModel({
        id: "1",
        slug: "fitness",
        name: "Fitness",
        logoUrl: "/logo.png",
        coverUrl: "/cover.png",
        thumbnailUrl: "/thumb.png",
        membersCount: 12,
        settings: { primaryColor: "#111111" },
      }),
    ).toEqual(
      expect.objectContaining({
        id: "1",
        slug: "fitness",
        name: "Fitness",
        logoUrl: "/logo.png",
        coverUrl: "/cover.png",
        thumbnailUrl: "/thumb.png",
        membersCount: 12,
        primaryColor: "#111111",
      }),
    )
  })

  it("maps legacy community media fields", () => {
    const vm = toCommunityViewModel({
      _id: "2",
      slug: "legacy",
      name: "Legacy",
      logo: "/uploads/image/logo.png",
      image: "/uploads/image/cover.png",
      members: [1, 2],
    })

    expect(vm.logoUrl).toBe("/uploads/image/logo.png")
    expect(vm.coverUrl).toBe("/uploads/image/cover.png")
    expect(vm.thumbnailUrl).toBe(vm.logoUrl)
    expect(vm.membersCount).toBe(2)
  })
})
