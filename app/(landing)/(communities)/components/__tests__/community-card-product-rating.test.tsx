import React from "react"
import { render, screen } from "@testing-library/react"
import { CommunityCard } from "@/app/(landing)/(communities)/components/community-card"
import type { Explore } from "@/lib/data-communities"

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}))

function makeExploreItem(overrides: Partial<Explore>): Explore {
  return {
    id: "item-1",
    type: "product",
    name: "Example Product",
    slug: "example-product",
    creator: "Jane Doe",
    creatorAvatar: "/avatar.png",
    description: "desc",
    category: "General",
    members: 10,
    rating: 4.8,
    ratingCount: 24,
    tags: ["test"],
    verified: true,
    price: 29,
    priceType: "paid",
    image: "/image.png",
    featured: false,
    link: "/example",
    ...overrides,
  }
}

describe("CommunityCard product rating display", () => {
  test("shows avg + count for product cards", () => {
    render(<CommunityCard community={makeExploreItem({ rating: 4.6, ratingCount: 23 })} viewMode="grid" />)
    expect(screen.getByText("4.6 (23)")).toBeInTheDocument()
  })

  test("shows New when product has no ratings", () => {
    render(<CommunityCard community={makeExploreItem({ rating: 0, ratingCount: 0 })} viewMode="list" />)
    expect(screen.getByText("New")).toBeInTheDocument()
  })
})
