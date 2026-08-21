import { toPaymentViewModel } from "@/lib/view-models/payment-view-model"

describe("toPaymentViewModel", () => {
  it("normalizes wrapped paid Stripe responses", () => {
    expect(
      toPaymentViewModel({
        success: true,
        data: { status: "succeeded", provider: "stripe", orderId: "abc" },
      }),
    ).toEqual(expect.objectContaining({ success: true, status: "paid", provider: "stripe", orderId: "abc" }))
  })

  it("normalizes action-required session responses", () => {
    expect(toPaymentViewModel({ data: { status: "paid_action_required", action: "choose_session_slot" } })).toEqual(
      expect.objectContaining({
        success: true,
        status: "requires_action",
        actionRequired: "choose_session_slot",
      }),
    )
  })
})
