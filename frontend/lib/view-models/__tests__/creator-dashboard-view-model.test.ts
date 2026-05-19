import { toCreatorDashboardViewModel } from "@/lib/view-models/creator-dashboard-view-model"

describe("toCreatorDashboardViewModel", () => {
  it("marks an empty creator community as incomplete with a next action", () => {
    const vm = toCreatorDashboardViewModel({
      community: { id: "c1", slug: "motion", name: "Motion School" },
      posts: [],
      courses: [],
      products: [],
      sessions: [],
      challenges: [],
      events: [],
      bankConfigured: false,
    })

    expect(vm.setup.percent).toBeLessThan(100)
    expect(vm.setup.nextAction?.id).toBe("community-logo")
    expect(vm.contentCounts).toMatchObject({ posts: 0, courses: 0, products: 0 })
  })

  it("marks configured communities and first content as launch ready", () => {
    const vm = toCreatorDashboardViewModel({
      community: {
        id: "c1",
        slug: "motion",
        name: "Motion School",
        logoUrl: "/uploads/logo.png",
        coverUrl: "/uploads/cover.png",
        price: 49,
      },
      posts: [{ id: "p1" }],
      courses: [{ id: "course1" }],
      bankConfigured: true,
      paidOfferCount: 1,
      membersCount: 12,
      revenue: 120,
    })

    expect(vm.setup.percent).toBe(100)
    expect(vm.setup.nextAction).toBeUndefined()
    expect(vm.metrics.members).toBe(12)
    expect(vm.metrics.revenue).toBe(120)
  })
})
