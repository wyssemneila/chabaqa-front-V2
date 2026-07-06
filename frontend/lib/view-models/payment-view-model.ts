export type PaymentStatus = "paid" | "pending" | "failed" | "cancelled" | "requires_action"
export type PaymentProvider = "stripe"

export interface PaymentViewModel {
  success: boolean
  status: PaymentStatus
  provider?: PaymentProvider
  orderId?: string
  targetId?: string
  fulfillmentStatus?: string
  actionRequired?: string
  message?: string
  [key: string]: any
}

const normalizeStatus = (value: unknown): PaymentStatus => {
  const status = String(value || "").toLowerCase()
  if (["paid", "success", "succeeded", "complete", "completed", "active", "trialing"].includes(status)) return "paid"
  if (["paid_action_required", "requires_action", "requires_booking"].includes(status)) return "requires_action"
  if (["failed", "failure", "error", "rejected", "unpaid", "past_due", "incomplete_expired"].includes(status)) return "failed"
  if (["cancelled", "canceled", "expired"].includes(status)) return "cancelled"
  return "pending"
}

export function toPaymentViewModel(response: any): PaymentViewModel {
  const payload = response?.data || response || {}
  const status = normalizeStatus(payload.status)

  // Transport/API success means the status endpoint responded; it does not mean the
  // payment is settled. Only terminal paid/action-required statuses unlock UX.
  const settledSuccess = status === "paid" || status === "requires_action"

  return {
    ...payload,
    success: settledSuccess,
    status,
    provider: payload.provider,
    orderId: payload.orderId ? String(payload.orderId) : undefined,
    targetId: payload.targetId ? String(payload.targetId) : undefined,
    fulfillmentStatus: payload.fulfillmentStatus,
    actionRequired: payload.actionRequired || payload.action,
    message: payload.message,
  }
}
