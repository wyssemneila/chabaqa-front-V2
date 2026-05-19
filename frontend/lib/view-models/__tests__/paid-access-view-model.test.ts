import { toPaidAccessViewModel } from "@/lib/view-models/paid-access-view-model"

describe("toPaidAccessViewModel", () => {
  it("maps payment required access to a checkout action", () => {
    expect(
      toPaidAccessViewModel({
        status: "payment_required",
        targetType: "course",
        targetId: "course1",
        title: "Motion Course",
        checkoutUrl: "/checkout",
      }),
    ).toMatchObject({
      state: "payment_required",
      targetType: "course",
      primaryAction: { label: "Continue to Payment", href: "/checkout" },
    })
  })

  it("maps failed payment to retry UI", () => {
    expect(toPaidAccessViewModel({ status: "failed", targetType: "community", retryUrl: "/retry" })).toMatchObject({
      state: "failed",
      message: "Payment could not be completed. Please try again.",
      primaryAction: { label: "Try Again", href: "/retry" },
    })
  })

  it("maps granted access from canAccess", () => {
    expect(toPaidAccessViewModel({ canAccess: true, targetType: "product", redirectUrl: "/products/p1" })).toMatchObject({
      state: "access_granted",
      primaryAction: { label: "Open", href: "/products/p1" },
    })
  })
})
