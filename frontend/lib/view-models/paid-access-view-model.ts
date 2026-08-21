export type PaidAccessState =
  | "locked"
  | "payment_required"
  | "processing"
  | "success"
  | "failed"
  | "access_granted"
  | "requires_action"

export type PaidAccessTargetType = "community" | "course" | "chapter" | "session" | "event" | "product" | "challenge"

export interface PaidAccessViewModel {
  state: PaidAccessState
  targetType: PaidAccessTargetType
  targetId: string
  title: string
  price?: number
  message: string
  primaryAction?: {
    label: string
    href?: string
    action?: string
  }
}

const normalizeState = (raw: any): PaidAccessState => {
  const value = String(raw?.state || raw?.status || raw?.lockCode || "").toLowerCase()
  if (["paid", "success", "completed"].includes(value)) return "success"
  if (["access_granted", "can_access", "unlocked"].includes(value) || raw?.canAccess === true) return "access_granted"
  if (["payment_required", "needs_payment", "paid_locked"].includes(value) || raw?.needsPayment === true) return "payment_required"
  if (["requires_action", "paid_action_required", "requires_booking"].includes(value)) return "requires_action"
  if (["processing", "pending"].includes(value)) return "processing"
  if (["failed", "cancelled", "canceled", "error"].includes(value)) return "failed"
  return "locked"
}

const defaultMessage = (state: PaidAccessState, targetType: PaidAccessTargetType) => {
  if (state === "access_granted" || state === "success") return `Your ${targetType} access is ready.`
  if (state === "payment_required") return `Complete payment to unlock this ${targetType}.`
  if (state === "requires_action") return "One more step is required to finish access."
  if (state === "processing") return "Payment is processing. Access will update shortly."
  if (state === "failed") return "Payment could not be completed. Please try again."
  return `This ${targetType} is locked.`
}

export function toPaidAccessViewModel(raw: any): PaidAccessViewModel {
  const state = normalizeState(raw)
  const targetType = String(raw?.targetType || raw?.scope || raw?.type || "community") as PaidAccessTargetType
  const retryHref = raw?.retryUrl || raw?.checkoutUrl
  const openHref = raw?.redirectUrl || raw?.href
  return {
    state,
    targetType,
    targetId: String(raw?.targetId || raw?.id || ""),
    title: String(raw?.title || raw?.name || targetType),
    price: Number.isFinite(Number(raw?.price)) ? Number(raw?.price) : undefined,
    message: String(raw?.message || defaultMessage(state, targetType)),
    primaryAction:
      state === "failed"
        ? { label: "Try Again", href: retryHref, action: retryHref ? undefined : "retry_payment" }
        : state === "payment_required"
          ? { label: "Continue to Payment", href: retryHref, action: retryHref ? undefined : "start_payment" }
          : state === "requires_action"
            ? { label: raw?.actionLabel || "Complete Setup", href: openHref, action: raw?.actionRequired || raw?.action }
            : state === "access_granted" || state === "success"
              ? { label: "Open", href: openHref }
              : undefined,
  }
}
