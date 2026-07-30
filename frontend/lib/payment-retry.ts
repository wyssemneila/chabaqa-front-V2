export function buildPaymentRetryHref(scope: string | null, id: string | null, courseId: string | null, tier: string | null) {
  if (scope === 'subscription') return '/creator/billing'
  if (scope === 'chapter' && courseId) return `/dashboard?courseId=${encodeURIComponent(courseId)}${id ? `&chapterId=${encodeURIComponent(id)}` : ''}`
  if (scope && id) return `/dashboard?paymentScope=${encodeURIComponent(scope)}&paymentTarget=${encodeURIComponent(id)}`
  if (tier) return `/pricing?plan=${encodeURIComponent(tier)}`
  return '/dashboard'
}
