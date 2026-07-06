import { apiClient } from '@/lib/api/client'
import {
  createSubscriptionIdempotencyKey,
  normalizeInvoiceList,
  PlanTier,
  subscriptionApi,
} from '../subscription.api'

jest.mock('@/lib/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}))

describe('subscriptionApi hardening helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('normalizes nested invoice envelopes once at the API boundary', () => {
    const invoice = { id: 'inv_1', total: 42 }

    expect(normalizeInvoiceList({ data: { data: { invoices: [invoice], total: 1 } } })).toEqual(
      expect.objectContaining({
        success: true,
        data: [invoice],
        pagination: expect.objectContaining({ total: 1 }),
      }),
    )
    expect(normalizeInvoiceList({ data: [invoice] }).data).toEqual([invoice])
  })

  it('sends idempotency keys for subscription checkout init', async () => {
    ;(apiClient.post as jest.Mock).mockResolvedValue({ checkoutUrl: 'https://checkout.test' })

    await subscriptionApi.initStripePayment(PlanTier.PRO, 'year')

    expect(apiClient.post).toHaveBeenCalledWith('/payment/stripe-link/init/subscription', {
      tier: PlanTier.PRO,
      interval: 'year',
      idempotencyKey: expect.stringMatching(/^subscription:stripe:pro:year:/),
    })
    expect(apiClient.post).toHaveBeenCalledTimes(1)
  })

  it('creates provider-scoped subscription idempotency keys', () => {
    expect(createSubscriptionIdempotencyKey('stripe', PlanTier.GROWTH, 'month')).toMatch(
      /^subscription:stripe:growth:month:/,
    )
  })
})
