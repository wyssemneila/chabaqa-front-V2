import { apiClient } from '@/lib/api/client'
import { paymentsApi } from '@/lib/api/payments.api'

jest.mock('@/lib/api/client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}))

describe('paymentsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('posts payout requests with their required community context', async () => {
    ;(apiClient.post as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 'payout-1' },
    })

    const payload = {
      amount: 250,
      method: 'bank_transfer' as const,
      communityId: 'community-1',
    }

    await paymentsApi.requestPayout(payload)

    expect(apiClient.post).toHaveBeenCalledWith('/payouts', payload)
  })
})
