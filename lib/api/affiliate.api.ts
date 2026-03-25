import { apiClient } from './client'

export type AffiliateProgramScopeType = 'community' | 'creator' | 'content'
export type AffiliateProgramStatus = 'active' | 'paused'
export type AffiliatePartnerStatus = 'pending' | 'approved' | 'rejected' | 'paused'
export type AffiliateConversionStatus = 'pending' | 'approved' | 'paid' | 'reversed'
export type AffiliatePayoutStatus = 'pending' | 'approved' | 'paid' | 'failed' | 'cancelled'
export type AffiliatePayoutMethod = 'bank_transfer' | 'paypal' | 'stripe'

export interface AffiliateProgram {
  _id: string
  creatorId: string
  communityId?: string
  scopeType: AffiliateProgramScopeType
  scopeContentType?: string
  scopeContentId?: string
  commissionPercent: number
  cookieWindowDays: number
  holdDays: number
  status: AffiliateProgramStatus
  createdAt?: string
  updatedAt?: string
}

export interface AffiliatePartner {
  _id: string
  programId: string
  partnerUserId: string | { _id?: string; id?: string; name?: string; email?: string }
  status: AffiliatePartnerStatus
  approvedAt?: string
  approvedBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface AffiliateLink {
  _id: string
  programId: string
  partnerUserId: string
  code: string
  targetPath: string
  targetContentType?: string
  targetContentId?: string
  communityId?: string
  creatorId?: string
  createdAt?: string
  updatedAt?: string
}

export interface AffiliateBalance {
  approvedBalanceDT: number
  pendingDT: number
  paidDT: number
  reversedDT?: number
}

export interface AffiliatePayoutRequest {
  _id: string
  partnerUserId: string
  amountDT: number
  currency: string
  method: AffiliatePayoutMethod
  status: AffiliatePayoutStatus
  reference: string
  metadata?: Record<string, any>
  requestedAt?: string
  processedAt?: string
  adminNotes?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreatorAffiliateStats {
  clicks: number
  conversions: number
  totalCommissionDT: number
  totalRevenueDT: number
  topPartners: Array<{
    partnerUserId: string
    name?: string
    email?: string
    commissionDT: number
    conversions: number
  }>
}

export interface PartnerAffiliateStats {
  clicks: number
  totalConversions: number
  totalCommissionDT: number
  conversions: Record<string, { count: number; totalDT: number }>
}

const extractData = <T>(value: any): T => {
  if (value && typeof value === 'object' && 'data' in value && value.data !== undefined) {
    return value.data as T
  }
  return value as T
}

const toQuery = (input?: Record<string, any>) => {
  if (!input) return undefined
  return Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined && v !== null && v !== ''))
}

export const affiliateApi = {
  creator: {
    createProgram: async (payload: {
      communityId?: string
      scopeType: AffiliateProgramScopeType
      scopeContentType?: string
      scopeContentId?: string
      commissionPercent: number
      cookieWindowDays?: number
      holdDays?: number
    }): Promise<AffiliateProgram> => extractData(await apiClient.post('/affiliate/creator/programs', payload)),

    listPrograms: async (): Promise<AffiliateProgram[]> => extractData(await apiClient.get('/affiliate/creator/programs')),

    updateProgram: async (
      programId: string,
      payload: Partial<Pick<AffiliateProgram, 'commissionPercent' | 'cookieWindowDays' | 'holdDays' | 'status'>>,
    ): Promise<AffiliateProgram> => extractData(await apiClient.patch(`/affiliate/creator/programs/${programId}`, payload)),

    invitePartner: async (
      programId: string,
      payload: { userId?: string; email?: string },
    ): Promise<AffiliatePartner> => extractData(await apiClient.post(`/affiliate/creator/programs/${programId}/partners`, payload)),

    listPartners: async (programId?: string): Promise<AffiliatePartner[]> =>
      extractData(await apiClient.get('/affiliate/creator/partners', toQuery({ programId }))),

    updatePartnerStatus: async (
      partnerId: string,
      status: 'approved' | 'rejected' | 'paused',
    ): Promise<AffiliatePartner> => extractData(await apiClient.patch(`/affiliate/creator/partners/${partnerId}`, { status })),

    createLink: async (payload: {
      programId: string
      partnerUserId?: string
      targetPath: string
      targetContentType?: string
      targetContentId?: string
      communityId?: string
    }): Promise<AffiliateLink> => extractData(await apiClient.post('/affiliate/creator/links', payload)),

    listStats: async (): Promise<CreatorAffiliateStats> => extractData(await apiClient.get('/affiliate/creator/stats')),
  },

  affiliate: {
    myPrograms: async (): Promise<any[]> => extractData(await apiClient.get('/affiliate/me/programs')),

    myLinks: async (): Promise<AffiliateLink[]> => extractData(await apiClient.get('/affiliate/me/links')),

    createMyLink: async (payload: {
      programId: string
      targetPath: string
      targetContentType?: string
      targetContentId?: string
      communityId?: string
    }): Promise<AffiliateLink> => extractData(await apiClient.post('/affiliate/me/links', payload)),

    myStats: async (params?: { from?: string; to?: string }): Promise<PartnerAffiliateStats> =>
      extractData(await apiClient.get('/affiliate/me/stats', toQuery(params))),

    myBalance: async (): Promise<AffiliateBalance> => extractData(await apiClient.get('/affiliate/me/balance')),

    myPayouts: async (): Promise<AffiliatePayoutRequest[]> => extractData(await apiClient.get('/affiliate/me/payouts')),

    requestPayout: async (payload: {
      amountDT: number
      method: AffiliatePayoutMethod
      metadata?: Record<string, any>
    }): Promise<AffiliatePayoutRequest> => extractData(await apiClient.post('/affiliate/me/payouts', payload)),
  },

  admin: {
    listPayouts: async (status?: AffiliatePayoutStatus): Promise<AffiliatePayoutRequest[]> =>
      extractData(await apiClient.get('/admin/affiliate/payouts', toQuery({ status }))),

    approvePayout: async (payoutId: string, adminNotes?: string): Promise<AffiliatePayoutRequest> =>
      extractData(await apiClient.post(`/admin/affiliate/payouts/${payoutId}/approve`, { adminNotes })),

    markPaid: async (payoutId: string, adminNotes?: string): Promise<AffiliatePayoutRequest> =>
      extractData(await apiClient.post(`/admin/affiliate/payouts/${payoutId}/mark-paid`, { adminNotes })),
  },
}
