import { apiClient } from './client'

export const manualPaymentsApi = {
    getPendingPayments: async (params?: { communityId?: string }) => {
        const searchParams = new URLSearchParams()
        if (params?.communityId) searchParams.set('communityId', params.communityId)
        const qs = searchParams.toString()
        return apiClient.get(`/payment/manual/pending${qs ? `?${qs}` : ''}`)
    },

    getHistory: async (params?: { status?: string; page?: number; limit?: number; communityId?: string }) => {
        const searchParams = new URLSearchParams()
        if (params?.status) searchParams.set('status', params.status)
        if (typeof params?.page === 'number') searchParams.set('page', String(params.page))
        if (typeof params?.limit === 'number') searchParams.set('limit', String(params.limit))
        if (params?.communityId) searchParams.set('communityId', params.communityId)
        const qs = searchParams.toString()
        return apiClient.get(`/payment/manual/history${qs ? `?${qs}` : ''}`)
    },

    verifyPayment: async (orderId: string, action: 'approve' | 'reject') => {
        return apiClient.post(`/payment/manual/verify/${orderId}`, { action })
    },
}
