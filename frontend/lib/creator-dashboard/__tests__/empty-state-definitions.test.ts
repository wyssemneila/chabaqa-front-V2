import { CREATOR_EMPTY_STATE_DEFINITIONS } from "@/lib/creator-dashboard/empty-state-definitions"

describe("creator empty state definitions", () => {
  it("keeps domain empty states in one reusable source of truth", () => {
    expect(CREATOR_EMPTY_STATE_DEFINITIONS.courses).toMatchObject({
      title: "No courses yet",
      action: {
        label: "Use Mini Course Template",
        href: "/creator/courses/new?template=mini-course",
      },
    })

    expect(CREATOR_EMPTY_STATE_DEFINITIONS.products.action?.label).toBe("Use Digital Download Template")
    expect(CREATOR_EMPTY_STATE_DEFINITIONS.sessions.tips?.length).toBeGreaterThan(0)
  })

  it("defines shared operational fallback states", () => {
    expect(CREATOR_EMPTY_STATE_DEFINITIONS.noResults.title).toBe("No results found")
    expect(CREATOR_EMPTY_STATE_DEFINITIONS.noPermission.title).toBe("Access restricted")
    expect(CREATOR_EMPTY_STATE_DEFINITIONS.error.description).toContain("try again")
  })
})
