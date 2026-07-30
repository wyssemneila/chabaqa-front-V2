import { buildPaymentRetryHref } from '@/lib/payment-retry'

describe('buildPaymentRetryHref', () => {
  it('uses scope-specific query context', () => {
    expect(buildPaymentRetryHref('product', 'product-1', null, null)).toBe('/dashboard?paymentScope=product&paymentTarget=product-1')
    expect(buildPaymentRetryHref('chapter', 'chapter-1', 'course-1', null)).toBe('/dashboard?courseId=course-1&chapterId=chapter-1')
    expect(buildPaymentRetryHref('subscription', null, null, 'pro')).toBe('/creator/billing')
  })
})
