import { toMemberHomeViewModel } from "@/lib/view-models/member-home-view-model"

describe("toMemberHomeViewModel", () => {
  it("prioritizes learning before scheduled items, challenges, posts, and products", () => {
    const vm = toMemberHomeViewModel(
      {
        community: { id: "c1", slug: "motion", name: "Motion School" },
        courses: [{ id: "course1", title: "Motion Basics" }],
        sessions: [{ id: "session1", title: "Office Hours", startDate: "2026-06-01" }],
        activeChallenges: [{ id: "challenge1", title: "7 Day Sprint" }],
        posts: [{ id: "post1", title: "Welcome" }],
        products: [{ id: "product1", title: "Template Pack" }],
        stats: { totalMembers: 8, activeToday: 2, postsThisWeek: 3 },
      },
      "/creator/community",
    )

    expect(vm.continueItem?.type).toBe("course_chapter")
    expect(vm.recommendations.map((item) => item.type)).toEqual([
      "course_chapter",
      "session",
      "challenge",
      "post",
      "product",
    ])
    expect(vm.stats.postsThisWeek).toBe(3)
  })

  it("still produces useful recommendations from posts only", () => {
    const vm = toMemberHomeViewModel(
      {
        community: { id: "c1", slug: "motion", name: "Motion School" },
        posts: [{ id: "post1", title: "Pinned", isPinned: true }],
      },
      "/creator/community",
    )

    expect(vm.continueItem?.type).toBe("post")
    expect(vm.recentActivity[0]?.href).toContain("post=post1")
  })
})
