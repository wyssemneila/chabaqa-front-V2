import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import ProductPageContent from "@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/product-page-content"

jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}))

jest.mock("@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/product-header", () => ({
  __esModule: true,
  default: () => <div>HEADER</div>,
}))
jest.mock("@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/product-preview", () => ({
  __esModule: true,
  default: () => <div>PREVIEW</div>,
}))
jest.mock("@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/product-overview", () => ({
  __esModule: true,
  default: () => <div>OVERVIEW</div>,
}))
jest.mock("@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/product-files", () => ({
  __esModule: true,
  default: () => <div>FILES</div>,
}))
jest.mock("@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/product-license", () => ({
  __esModule: true,
  default: () => <div>LICENSE</div>,
}))
jest.mock("@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/product-reviews", () => ({
  __esModule: true,
  default: () => <div>PRODUCT_REVIEWS_CONTENT</div>,
}))
jest.mock("@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/purchase-card", () => ({
  __esModule: true,
  default: () => <div>PURCHASE_CARD</div>,
}))
jest.mock("@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/creator-info", () => ({
  __esModule: true,
  default: () => <div>CREATOR_INFO</div>,
}))
jest.mock("@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/product-details", () => ({
  __esModule: true,
  default: () => <div>PRODUCT_DETAILS</div>,
}))

describe("ProductPageContent tabs", () => {
  test("renders Review tab and removes Community tab", () => {
    render(
      <ProductPageContent
        creatorSlug="creator"
        slug="community"
        product={{ id: "prod-1", _id: "mongo-1", title: "Test Product" }}
        purchase={null}
      />,
    )

    expect(screen.getByRole("tab", { name: "Review" })).toBeInTheDocument()
    expect(screen.queryByRole("tab", { name: "Community" })).not.toBeInTheDocument()

    const reviewTab = screen.getByRole("tab", { name: "Review" })
    fireEvent.mouseDown(reviewTab)
    fireEvent.click(reviewTab)
    expect(screen.getByText("PRODUCT_REVIEWS_CONTENT")).toBeInTheDocument()
  })
})
