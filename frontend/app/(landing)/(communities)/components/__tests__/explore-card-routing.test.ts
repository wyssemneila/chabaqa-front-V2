import { resolveExploreCardRouting } from "@/app/(landing)/(communities)/components/explore-card-routing"
import type { Explore } from "@/lib/data-communities"

function makeExploreItem(overrides: Partial<Explore>): Explore {
  return {
    id: "item-1",
    type: "community",
    name: "Example",
    slug: "example-community",
    creator: "Jane Doe",
    creatorAvatar: "/avatar.png",
    description: "desc",
    category: "General",
    members: 10,
    rating: 4.8,
    tags: ["test"],
    verified: true,
    price: 0,
    priceType: "free",
    image: "/image.png",
    featured: false,
    link: "/example",
    ...overrides,
  }
}

describe("resolveExploreCardRouting", () => {
  test("routes community members to community app home", () => {
    const item = makeExploreItem({
      type: "community",
      slug: "alpha",
      creatorSlug: "creator-alpha",
      isMember: true,
    })

    const result = resolveExploreCardRouting(item, "Explore")

    expect(result.href).toBe("/creator-alpha/alpha/home")
    expect(result.ctaLabel).toBe("Explore")
  })

  test("routes non-member community cards to community overview", () => {
    const item = makeExploreItem({
      type: "community",
      slug: "alpha",
      isMember: false,
    })

    const result = resolveExploreCardRouting(item, "Explore")

    expect(result.href).toBe("/community/alpha")
    expect(result.ctaLabel).toBe("Join")
  })

  test("routes accessible course/challenge/product to direct content", () => {
    const course = resolveExploreCardRouting(
      makeExploreItem({
        type: "course",
        id: "course-1",
        creatorSlug: "creator-alpha",
        communitySlug: "alpha",
        isMember: true,
        hasContentAccess: true,
      }),
      "Start",
    )
    const challenge = resolveExploreCardRouting(
      makeExploreItem({
        type: "challenge",
        id: "challenge-1",
        creatorSlug: "creator-alpha",
        communitySlug: "alpha",
        isMember: true,
        hasContentAccess: true,
      }),
      "Join",
    )
    const product = resolveExploreCardRouting(
      makeExploreItem({
        type: "product",
        id: "product-1",
        creatorSlug: "creator-alpha",
        communitySlug: "alpha",
        isMember: true,
        hasContentAccess: true,
      }),
      "Buy",
    )

    expect(course.href).toBe("/creator-alpha/alpha/courses/course-1")
    expect(course.ctaLabel).toBe("Start")
    expect(challenge.href).toBe("/creator-alpha/alpha/challenges/challenge-1")
    expect(challenge.ctaLabel).toBe("Join")
    expect(product.href).toBe("/creator-alpha/alpha/products/product-1")
    expect(product.ctaLabel).toBe("Download")
  })

  test("routes member with locked product access to products listing", () => {
    const item = makeExploreItem({
      type: "product",
      id: "product-locked",
      creatorSlug: "creator-alpha",
      communitySlug: "alpha",
      isMember: true,
      hasContentAccess: false,
    })

    const result = resolveExploreCardRouting(item, "Buy")

    expect(result.href).toBe("/creator-alpha/alpha/products")
    expect(result.ctaLabel).toBe("Buy")
  })

  test("routes non-member product cards to community overview with Buy label", () => {
    const item = makeExploreItem({
      type: "product",
      id: "product-locked",
      creatorSlug: "creator-alpha",
      communitySlug: "alpha",
      isMember: false,
      hasContentAccess: false,
    })

    const result = resolveExploreCardRouting(item, "Buy")

    expect(result.href).toBe("/community/alpha")
    expect(result.ctaLabel).toBe("Buy")
  })

  test("routes non-member content cards to community overview", () => {
    const item = makeExploreItem({
      type: "course",
      id: "course-1",
      creatorSlug: "creator-alpha",
      communitySlug: "alpha",
      isMember: false,
      hasContentAccess: true,
    })

    const result = resolveExploreCardRouting(item, "Start")

    expect(result.href).toBe("/community/alpha")
    expect(result.ctaLabel).toBe("View Community")
  })

  test("routes accessible session/event to community tab pages", () => {
    const session = resolveExploreCardRouting(
      makeExploreItem({
        type: "oneToOne",
        id: "session-1",
        creatorSlug: "creator-alpha",
        communitySlug: "alpha",
        isMember: true,
        hasContentAccess: true,
      }),
      "Book",
    )
    const event = resolveExploreCardRouting(
      makeExploreItem({
        type: "event",
        id: "event-1",
        creatorSlug: "creator-alpha",
        communitySlug: "alpha",
        isMember: true,
        hasContentAccess: true,
      }),
      "Register",
    )

    expect(session.href).toBe("/creator-alpha/alpha/sessions?sessionId=session-1")
    expect(session.ctaLabel).toBe("Book")
    expect(event.href).toBe("/creator-alpha/alpha/events?eventId=event-1")
    expect(event.ctaLabel).toBe("Register")
  })

  test("prefers custom event id over mongoId for event tab routes", () => {
    const result = resolveExploreCardRouting(
      makeExploreItem({
        type: "event",
        id: "custom-event-id",
        mongoId: "mongo-event-id",
        creatorSlug: "creator-alpha",
        communitySlug: "alpha",
        isMember: true,
        hasContentAccess: true,
      }),
      "Register",
    )

    expect(result.href).toBe("/creator-alpha/alpha/events?eventId=custom-event-id")
  })

  test("falls back to /explore when critical routing data is missing", () => {
    const item = makeExploreItem({
      type: "course",
      id: "course-1",
      creatorSlug: "creator-alpha",
      communitySlug: undefined,
      isMember: true,
      hasContentAccess: true,
    })

    const result = resolveExploreCardRouting(item, "Start")

    expect(result.href).toBe("/explore")
    expect(result.ctaLabel).toBe("Start")
  })

  test("falls back to community overview when content id is missing for member session/event", () => {
    const session = resolveExploreCardRouting(
      makeExploreItem({
        type: "oneToOne",
        id: "",
        creatorSlug: "creator-alpha",
        communitySlug: "alpha",
        isMember: true,
        hasContentAccess: true,
      }),
      "Book",
    )
    const event = resolveExploreCardRouting(
      makeExploreItem({
        type: "event",
        id: "",
        creatorSlug: "creator-alpha",
        communitySlug: "alpha",
        isMember: true,
        hasContentAccess: true,
      }),
      "Register",
    )

    expect(session.href).toBe("/community/alpha")
    expect(event.href).toBe("/community/alpha")
  })
})
