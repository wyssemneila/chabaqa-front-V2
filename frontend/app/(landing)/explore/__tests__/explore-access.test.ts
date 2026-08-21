import {
  buildExploreAccessSnapshot,
  createEmptyExploreAccessSnapshot,
  enrichExploreItemsWithAccess,
} from "@/app/(landing)/explore/explore-access"
import type { Explore } from "@/lib/data-communities"

function makeExploreItem(overrides: Partial<Explore>): Explore {
  return {
    id: "item-1",
    type: "course",
    name: "Example",
    slug: "example-item",
    creator: "Jane Doe",
    creatorAvatar: "/avatar.png",
    description: "desc",
    category: "General",
    members: 10,
    rating: 4.2,
    tags: ["tag"],
    verified: false,
    price: 100,
    priceType: "paid",
    image: "/img.png",
    featured: false,
    link: "/example",
    communitySlug: "alpha",
    ...overrides,
  }
}

describe("explore access enrichment", () => {
  test("computes non-community membership by communitySlug, not content id", () => {
    const snapshot = buildExploreAccessSnapshot({
      joinedCommunities: {
        data: [{ id: "community-1", slug: "alpha" }],
      },
    })

    const item = makeExploreItem({
      id: "community-1",
      communitySlug: "beta",
      type: "course",
    })

    const [enriched] = enrichExploreItemsWithAccess([item], snapshot)

    expect(enriched.isMember).toBe(false)
    expect(enriched.hasContentAccess).toBe(false)
  })

  test("computes non-community membership by communityId when slug is missing/mismatched", () => {
    const snapshot = buildExploreAccessSnapshot({
      joinedCommunities: {
        data: [{ id: "community-42", slug: "alpha" }],
      },
    })

    const item = makeExploreItem({
      id: "course-42",
      type: "course",
      communityId: "community-42",
      communitySlug: "different-slug",
    })

    const [enriched] = enrichExploreItemsWithAccess([item], snapshot)

    expect(enriched.isMember).toBe(true)
  })

  test("enforces strict access gating by content type", () => {
    const snapshot = buildExploreAccessSnapshot({
      joinedCommunities: {
        data: [{ id: "community-alpha", slug: "alpha" }],
      },
      courseEnrollments: {
        enrollments: [{ courseId: "course-1" }],
      },
      challengeParticipations: {
        data: { participations: [{ challengeId: "challenge-1" }] },
      },
      productPurchases: {
        products: [{ productId: "product-1" }],
      },
      sessionBookings: {
        bookings: [{ sessionId: "session-1" }],
      },
      eventRegistrations: {
        events: [{ id: "event-1" }],
      },
    })

    const items: Explore[] = [
      makeExploreItem({ type: "course", id: "course-1" }),
      makeExploreItem({ type: "course", id: "course-locked" }),
      makeExploreItem({ type: "challenge", id: "challenge-1" }),
      makeExploreItem({ type: "product", id: "product-1" }),
      makeExploreItem({ type: "oneToOne", id: "session-1" }),
      makeExploreItem({ type: "event", id: "event-1" }),
    ]

    const enriched = enrichExploreItemsWithAccess(items, snapshot)

    expect(enriched[0].isMember).toBe(true)
    expect(enriched[0].hasContentAccess).toBe(true)

    expect(enriched[1].isMember).toBe(true)
    expect(enriched[1].hasContentAccess).toBe(false)

    expect(enriched[2].hasContentAccess).toBe(true)
    expect(enriched[3].hasContentAccess).toBe(true)
    expect(enriched[4].hasContentAccess).toBe(true)
    expect(enriched[5].hasContentAccess).toBe(true)
  })

  test("returns safe defaults when snapshot is empty", () => {
    const items: Explore[] = [
      makeExploreItem({ type: "community", id: "community-1", slug: "alpha" }),
      makeExploreItem({ type: "course", id: "course-1", communitySlug: "alpha" }),
    ]

    const enriched = enrichExploreItemsWithAccess(
      items,
      createEmptyExploreAccessSnapshot(),
    )

    expect(enriched[0].isMember).toBe(false)
    expect(enriched[0].hasContentAccess).toBeUndefined()
    expect(enriched[1].isMember).toBe(false)
    expect(enriched[1].hasContentAccess).toBe(false)
  })
})
