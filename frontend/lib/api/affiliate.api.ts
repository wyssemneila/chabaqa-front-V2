import { apiClient } from './client'

export type AffiliateProgramScopeType = 'community' | 'creator' | 'content'
export type AffiliateProgramStatus = 'active' | 'paused'
export type AffiliateAttributionModel = 'last_click' | 'first_click'
export type AffiliatePartnerStatus = 'pending' | 'approved' | 'rejected' | 'paused'
export type AffiliateConversionStatus = 'pending' | 'approved' | 'paid' | 'reversed'
export type AffiliatePayoutStatus = 'pending' | 'approved' | 'paid' | 'failed' | 'cancelled'
export type AffiliatePayoutMethod = 'bank_transfer' | 'paypal' | 'stripe'
export type AffiliateMarketingInterval = 'daily' | 'weekly' | 'monthly'
export type AffiliateTemplateChannel = 'email' | 'message' | 'social' | 'in_app'

export interface AffiliateProgram {
  _id: string
  id?: string
  creatorId: string
  communityId?: string
  name?: string
  description?: string
  scopeType: AffiliateProgramScopeType
  scopeContentType?: string
  scopeContentId?: string
  commissionPercent: number
  cookieWindowDays: number
  holdDays: number
  attributionModel?: AffiliateAttributionModel
  autoApprovePartners?: boolean
  terms?: string
  status: AffiliateProgramStatus
  createdAt?: string
  updatedAt?: string
}

export interface AffiliatePartner {
  _id: string
  id?: string
  programId: string
  partnerUserId: string | { _id?: string; id?: string; name?: string; email?: string; avatar?: string }
  user?: { _id?: string; id?: string; name?: string; fullName?: string; email?: string; avatar?: string; avatarUrl?: string }
  email?: string
  inviteEmail?: string
  displayName?: string
  tags?: string[]
  customCommissionPercent?: number
  couponCode?: string
  source?: string
  notes?: string
  status: AffiliatePartnerStatus
  linkCount?: number
  linksCount?: number
  approvedAt?: string
  approvedBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface AffiliateLink {
  _id: string
  id?: string
  programId: string
  partnerUserId: string
  code: string
  url?: string
  fullUrl?: string
  label?: string
  targetPath: string
  targetContentType?: string
  targetContentId?: string
  communityId?: string
  creatorId?: string
  campaignName?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmTerm?: string
  utmContent?: string
  tags?: string[]
  isArchived?: boolean
  clickCount?: number
  lastClickedAt?: string
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
  topPartners: AffiliatePartnerPerformance[]
}

export interface PartnerAffiliateStats {
  clicks: number
  totalConversions: number
  totalCommissionDT: number
  conversions: Record<string, { count: number; totalDT: number }>
}

export interface AffiliateMarketingQuery {
  communityId?: string
  programId?: string
  partnerUserId?: string
  from?: string
  to?: string
  days?: string | number
  interval?: AffiliateMarketingInterval
  limit?: string | number
  includeTemplates?: boolean | string
}

export interface AffiliateMarketingSummary {
  clicks: number
  uniqueVisitors: number
  botClicks: number
  conversions: number
  allConversions: number
  totalRevenueDT: number
  totalCreatorNetDT: number
  totalCommissionDT: number
  pendingCommissionDT: number
  approvedCommissionDT: number
  paidCommissionDT: number
  reversedCommissionDT: number
  pendingConversions: number
  approvedConversions: number
  paidConversions: number
  reversedConversions: number
  programCount: number
  activeProgramCount: number
  partnerCount: number
  activePartnerCount: number
  pendingPartnerCount: number
  linkCount: number
  averageLagHours: number
  conversionRatePct: number
  visitorConversionRatePct: number
  revenuePerClickDT: number
  commissionPerClickDT: number
  averageOrderDT: number
  averageCommissionDT: number
  approvalRatePct: number
  reversalRatePct: number
}

export interface AffiliateFunnelStep {
  key: string
  label: string
  value: number
  rateFromPreviousPct: number
  rate?: number
  dropOffRate?: number
}

export interface AffiliateTimeSeriesPoint {
  bucket: string
  date?: string
  clicks: number
  uniqueVisitors: number
  conversions: number
  revenueDT: number
  commissionDT: number
  commission?: number
  conversionRatePct: number
}

export interface AffiliatePartnerPerformance {
  partnerUserId: string
  label?: string
  name?: string
  email?: string
  avatar?: string
  clicks: number
  uniqueVisitors: number
  conversions: number
  revenueDT: number
  commissionDT: number
  conversionRatePct: number
  revenuePerClickDT: number
  commissionPerClickDT: number
}

export interface AffiliateLinkPerformance {
  linkCode: string
  code?: string
  label?: string
  fullUrl?: string
  targetPath?: string
  targetContentType?: string
  targetContentId?: string
  campaignName?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  clicks: number
  uniqueVisitors: number
  conversions: number
  revenueDT: number
  commissionDT: number
  conversionRatePct: number
  revenuePerClickDT: number
  commissionPerClickDT: number
}

export interface AffiliateDimensionBreakdown {
  label: string
  source?: string
  device?: string
  contentType?: string
  clicks: number
  uniqueVisitors: number
  conversions: number
  revenueDT: number
  commissionDT: number
  conversionRatePct: number
  revenuePerClickDT: number
  commissionPerClickDT: number
}

export interface AffiliateMergeField {
  key: string
  token: string
  label: string
  type: string
  source: string
  sample?: string | number | boolean
}

export interface AffiliateMergeFieldGroup {
  key: string
  label: string
  fields: AffiliateMergeField[]
}

export interface AffiliateMarketingTemplate {
  id: string
  name?: string
  title: string
  description?: string
  category: string
  icon: string
  goal: string
  channel?: AffiliateTemplateChannel
  channels: AffiliateTemplateChannel[]
  audienceSegment: string
  subject?: string
  content: string
  ctaLabel: string
  recommendedVariables: string[]
  recommendedFilters: Record<string, any>
  variables: string[]
  requiredFields?: string[]
  renderedPreview: {
    subject?: string
    content: string
  }
}

export interface AffiliateInsight {
  severity: 'critical' | 'high' | 'medium' | 'positive' | string
  type: string
  title: string
  description: string
  action: string
}

export interface AffiliateMarketingResponse {
  generatedAt: string
  timezone?: string
  filters?: Record<string, any>
  query: AffiliateMarketingQuery & { from?: string; to?: string }
  summary: AffiliateMarketingSummary
  programs: Array<AffiliateProgram & { id: string }>
  funnels: AffiliateFunnelStep[]
  timeSeries: AffiliateTimeSeriesPoint[]
  leaderboards: {
    partners: AffiliatePartnerPerformance[]
    links: AffiliateLinkPerformance[]
  }
  breakdowns: {
    sources: AffiliateDimensionBreakdown[]
    devices: AffiliateDimensionBreakdown[]
    contentTypes: AffiliateDimensionBreakdown[]
  }
  payoutHealth: {
    pendingCommissionDT: number
    approvedCommissionDT: number
    paidCommissionDT: number
    reversedCommissionDT: number
    pendingConversions: number
    approvedConversions: number
    nextReleases: Array<{
      conversionId: string
      partnerUserId: string
      commissionDT: number
      holdUntil: string
      contentType?: string
      contentId?: string
    }>
  }
  linkBuilder: {
    targetTypes: Array<{ value: string; label: string }>
    utmPresets: Array<{ label: string; utmMedium: string; utmSource: string }>
    attributionModels: Array<{ value: AffiliateAttributionModel; label: string }>
    recommendedProgramId?: string
    recommendedPartnerUserId?: string
    recentLinks: Array<{
      id: string
      code: string
      label?: string
      targetPath?: string
      clicks: number
      lastClickedAt?: string
    }>
  }
  mergeFields: AffiliateMergeFieldGroup[]
  templates: AffiliateMarketingTemplate[]
  insights: AffiliateInsight[]
}

export interface AffiliateCommissionPreview {
  amountDT: number
  creatorNetDT: number
  commissionPercent: number
  commissionDT: number
  creatorKeepsDT: number
  currency: string
  holdDays: number
  cookieWindowDays: number
  attributionModel: AffiliateAttributionModel
}

const extractData = <T>(value: any): T => {
  if (value && typeof value === 'object' && 'data' in value && value.data !== undefined) {
    return extractData<T>(value.data)
  }
  return value as T
}

const toQuery = (input?: Record<string, any>) => {
  if (!input) return undefined
  return Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  )
}

const normalizeProgram = (program: any): AffiliateProgram => ({
  ...program,
  _id: String(program?._id || program?.id || ''),
})

const normalizeList = <T>(value: any): T[] => {
  const data = extractData<any>(value)
  if (Array.isArray(data)) return data as T[]
  if (Array.isArray(data?.items)) return data.items as T[]
  if (Array.isArray(data?.docs)) return data.docs as T[]
  if (Array.isArray(data?.results)) return data.results as T[]
  return []
}

export const affiliateApi = {
  creator: {
    createProgram: async (payload: {
      communityId?: string
      name?: string
      description?: string
      scopeType: AffiliateProgramScopeType
      scopeContentType?: string
      scopeContentId?: string
      commissionPercent: number
      cookieWindowDays?: number
      holdDays?: number
      attributionModel?: AffiliateAttributionModel
      autoApprovePartners?: boolean
      terms?: string
    }): Promise<AffiliateProgram> => normalizeProgram(extractData(await apiClient.post('/affiliate/creator/programs', payload))),

    listPrograms: async (): Promise<AffiliateProgram[]> =>
      normalizeList<any>(await apiClient.get('/affiliate/creator/programs')).map(normalizeProgram),

    updateProgram: async (
      programId: string,
      payload: Partial<Pick<AffiliateProgram, 'name' | 'description' | 'commissionPercent' | 'cookieWindowDays' | 'holdDays' | 'status' | 'attributionModel' | 'autoApprovePartners' | 'terms'>>,
    ): Promise<AffiliateProgram> => normalizeProgram(extractData(await apiClient.patch(`/affiliate/creator/programs/${programId}`, payload))),

    invitePartner: async (
      programIdOrPayload:
        | string
        | ({
            programId: string
          } & {
            userId?: string
            email?: string
            displayName?: string
            tags?: string[]
            customCommissionPercent?: number
            couponCode?: string
            source?: string
            notes?: string
          }),
      payload?: {
        userId?: string
        email?: string
        displayName?: string
        tags?: string[]
        customCommissionPercent?: number
        couponCode?: string
        source?: string
        notes?: string
      },
    ): Promise<AffiliatePartner> => {
      const programId = typeof programIdOrPayload === 'string' ? programIdOrPayload : programIdOrPayload.programId
      const body = typeof programIdOrPayload === 'string' ? payload : { ...programIdOrPayload }
      if (body && 'programId' in body) delete (body as any).programId
      return extractData(await apiClient.post(`/affiliate/creator/programs/${programId}/partners`, body))
    },

    listPartners: async (programId?: string): Promise<AffiliatePartner[]> =>
      normalizeList(await apiClient.get('/affiliate/creator/partners', toQuery({ programId }))),

    updatePartnerStatus: async (
      partnerId: string,
      statusOrPayload: 'approved' | 'rejected' | 'paused' | Partial<AffiliatePartner>,
    ): Promise<AffiliatePartner> => {
      const payload = typeof statusOrPayload === 'string' ? { status: statusOrPayload } : statusOrPayload
      return extractData(await apiClient.patch(`/affiliate/creator/partners/${partnerId}`, payload))
    },

    createLink: async (payload: {
      programId: string
      partnerId?: string
      partnerUserId?: string
      targetPath: string
      targetType?: string
      targetId?: string
      targetContentType?: string
      targetContentId?: string
      communityId?: string
      label?: string
      campaignName?: string
      utmSource?: string
      utmMedium?: string
      utmCampaign?: string
      utmTerm?: string
      utmContent?: string
      tags?: string[]
    }): Promise<AffiliateLink> => {
      const {
        partnerId,
        targetType,
        targetId,
        ...rest
      } = payload
      const body = {
        ...rest,
        partnerUserId: payload.partnerUserId || partnerId,
        targetContentType: payload.targetContentType || (targetType && targetType !== 'community' && targetType !== 'custom' ? targetType : undefined),
        targetContentId: payload.targetContentId || targetId,
      }
      return extractData(await apiClient.post('/affiliate/creator/links', toQuery(body)))
    },

    listStats: async (params?: AffiliateMarketingQuery): Promise<CreatorAffiliateStats> =>
      extractData(await apiClient.get('/affiliate/creator/stats', toQuery(params))),

    getMarketing: async (params?: AffiliateMarketingQuery): Promise<AffiliateMarketingResponse> =>
      extractData(await apiClient.get('/affiliate/creator/marketing', toQuery(params))),

    previewCommission: async (payload: {
      programId?: string
      commissionPercent?: number
      amountDT: number
      creatorNetDT?: number
    }): Promise<AffiliateCommissionPreview> =>
      extractData(await apiClient.post('/affiliate/creator/commission-preview', payload)),

    listPayouts: async (params?: { status?: AffiliatePayoutStatus; limit?: number | string }): Promise<AffiliatePayoutRequest[]> =>
      normalizeList(await apiClient.get('/admin/affiliate/payouts', toQuery(params))),

    approvePayout: async (payoutId: string, adminNotes?: string): Promise<AffiliatePayoutRequest> =>
      extractData(await apiClient.post(`/admin/affiliate/payouts/${payoutId}/approve`, { adminNotes })),

    markPayoutPaid: async (payoutId: string, adminNotes?: string): Promise<AffiliatePayoutRequest> =>
      extractData(await apiClient.post(`/admin/affiliate/payouts/${payoutId}/mark-paid`, { adminNotes })),
  },

  affiliate: {
    myPrograms: async (): Promise<any[]> => extractData(await apiClient.get('/affiliate/me/programs')),

    myLinks: async (): Promise<AffiliateLink[]> => normalizeList(await apiClient.get('/affiliate/me/links')),

    createMyLink: async (payload: {
      programId: string
      targetPath: string
      targetContentType?: string
      targetContentId?: string
      communityId?: string
      label?: string
      campaignName?: string
      utmSource?: string
      utmMedium?: string
      utmCampaign?: string
      utmTerm?: string
      utmContent?: string
      tags?: string[]
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
      normalizeList(await apiClient.get('/admin/affiliate/payouts', toQuery({ status }))),

    approvePayout: async (payoutId: string, adminNotes?: string): Promise<AffiliatePayoutRequest> =>
      extractData(await apiClient.post(`/admin/affiliate/payouts/${payoutId}/approve`, { adminNotes })),

    markPaid: async (payoutId: string, adminNotes?: string): Promise<AffiliatePayoutRequest> =>
      extractData(await apiClient.post(`/admin/affiliate/payouts/${payoutId}/mark-paid`, { adminNotes })),
  },
}
