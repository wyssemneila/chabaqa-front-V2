/**
 * Custom hooks for admin data fetching with SWR caching
 * 
 * These hooks provide automatic caching, revalidation, and error handling
 * for admin dashboard data.
 */

import useSWR, { SWRConfiguration } from 'swr'
import { adminApi } from '@/lib/api/admin-api'

// Default SWR configuration for admin data
const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  errorRetryCount: 3,
  errorRetryInterval: 5000
}

// Cache time configurations for different data types
const CACHE_TIMES = {
  // Fast-changing data (1 minute)
  realtime: 60 * 1000,
  // Moderate-changing data (5 minutes)
  moderate: 5 * 60 * 1000,
  // Slow-changing data (15 minutes)
  slow: 15 * 60 * 1000,
  // Static data (1 hour)
  static: 60 * 60 * 1000
}

/**
 * Hook for fetching dashboard metrics
 * Cache time: 1 minute (realtime data)
 */
export function useDashboardMetrics() {
  return useSWR(
    'admin/dashboard/metrics',
    async () => {
      const [users, communities, content, revenue] = await Promise.all([
        adminApi.users.getAnalytics(),
        adminApi.communities.getAnalytics(),
        adminApi.contentModeration.getQueueStats(),
        adminApi.financial.getRevenueDashboard({ period: 'month' })
      ])
      return {
        users: users?.data || users,
        communities: communities?.data || communities,
        content: content?.data || content,
        revenue: revenue?.data || revenue
      }
    },
    {
      ...defaultConfig,
      refreshInterval: CACHE_TIMES.realtime
    }
  )
}

/**
 * Hook for fetching user list with filters
 * Cache time: 5 minutes (moderate data)
 */
export function useUsers(filters?: any) {
  const key = filters ? ['admin/users', filters] : 'admin/users'
  
  return useSWR(
    key,
    async () => {
      const response = await adminApi.users.getUsers(filters)
      return response?.data || response
    },
    {
      ...defaultConfig,
      refreshInterval: CACHE_TIMES.moderate
    }
  )
}

/**
 * Hook for fetching user details
 * Cache time: 5 minutes (moderate data)
 */
export function useUserDetails(userId: string | null) {
  return useSWR(
    userId ? `admin/users/${userId}` : null,
    async () => {
      if (!userId) return null
      const response = await adminApi.users.getUserDetails(userId)
      return response?.data || response
    },
    {
      ...defaultConfig,
      refreshInterval: CACHE_TIMES.moderate
    }
  )
}

/**
 * Hook for fetching communities list
 * Cache time: 5 minutes (moderate data)
 */
export function useCommunities(filters?: any) {
  const key = filters ? ['admin/communities', filters] : 'admin/communities'
  
  return useSWR(
    key,
    async () => {
      const response = await adminApi.communities.getCommunities(filters)
      return response?.data || response
    },
    {
      ...defaultConfig,
      refreshInterval: CACHE_TIMES.moderate
    }
  )
}

/**
 * Hook for fetching pending community approvals
 * Cache time: 1 minute (realtime data)
 */
export function usePendingCommunities() {
  return useSWR(
    'admin/communities/pending',
    async () => {
      const response = await adminApi.communities.getPendingApprovals()
      return response?.data || response
    },
    {
      ...defaultConfig,
      refreshInterval: CACHE_TIMES.realtime
    }
  )
}

/**
 * Hook for fetching community details
 * Cache time: 5 minutes (moderate data)
 */
export function useCommunityDetails(communityId: string | null) {
  return useSWR(
    communityId ? `admin/communities/${communityId}` : null,
    async () => {
      if (!communityId) return null
      const response = await adminApi.communities.getCommunityDetails(communityId)
      return response?.data || response
    },
    {
      ...defaultConfig,
      refreshInterval: CACHE_TIMES.moderate
    }
  )
}

/**
 * Hook for fetching content moderation queue
 * Cache time: 1 minute (realtime data)
 */
export function useModerationQueue(filters?: any) {
  const key = filters ? ['admin/moderation/queue', filters] : 'admin/moderation/queue'
  
  return useSWR(
    key,
    async () => {
      const response = await adminApi.contentModeration.getQueue(filters)
      return response?.data || response
    },
    {
      ...defaultConfig,
      refreshInterval: CACHE_TIMES.realtime
    }
  )
}

/**
 * Hook for fetching content details
 * Cache time: 5 minutes (moderate data)
 */
export function useContentDetails(contentId: string | null) {
  return useSWR(
    contentId ? `admin/moderation/content/${contentId}` : null,
    async () => {
      if (!contentId) return null
      const response = await adminApi.contentModeration.getContentDetails(contentId)
      return response?.data || response
    },
    {
      ...defaultConfig,
      refreshInterval: CACHE_TIMES.moderate
    }
  )
}

/**
 * Hook for fetching financial dashboard data
 * Cache time: 5 minutes (moderate data)
 */
export function useFinancialDashboard(period: 'week' | 'month' | 'year' = 'month') {
  return useSWR(
    ['admin/financial/dashboard', period],
    async () => {
      const [dashboard, revenueByType, topCreators, growth] = await Promise.all([
        adminApi.financial.getRevenueDashboard({ period }),
        adminApi.financial.getRevenueByContentType({ period }),
        adminApi.financial.getTopCreators({ period }, 10),
        adminApi.financial.getRevenueGrowth({ period })
      ])
      return {
        metrics: dashboard?.data || dashboard,
        revenueByType: revenueByType?.data || revenueByType || [],
        topCreators: topCreators?.data || topCreators || [],
        revenueGrowth: growth?.data || growth || []
      }
    },
    {
      ...defaultConfig,
      refreshInterval: CACHE_TIMES.moderate
    }
  )
}

/**
 * Hook for fetching subscriptions list
 * Cache time: 5 minutes (moderate data)
 */
export function useSubscriptions(filters?: any) {
  const key = filters ? ['admin/financial/subscriptions', filters] : 'admin/financial/subscriptions'
  
  return useSWR(
    key,
    async () => {
      const response = await adminApi.financial.getSubscriptions(filters)
      return response?.data || response
    },
    {
      ...defaultConfig,
      refreshInterval: CACHE_TIMES.moderate
    }
  )
}

/**
 * Hook for fetching transactions list
 * Cache time: 5 minutes (moderate data)
 */
export function useTransactions(filters?: any) {
  const key = filters ? ['admin/financial/transactions', filters] : 'admin/financial/transactions'
  
  return useSWR(
    key,
    async () => {
      const response = await adminApi.financial.getTransactions(filters)
      return response?.data || response
    },
    {
      ...defaultConfig,
      refreshInterval: CACHE_TIMES.moderate
    }
  )
}

/**
 * Hook for fetching payouts list
 * Cache time: 5 minutes (moderate data)
 */
export function usePayouts(filters?: any) {
  const key = filters ? ['admin/financial/payouts', filters] : 'admin/financial/payouts'
  
  return useSWR(
    key,
    async () => {
      const response = await adminApi.financial.getPayouts(filters)
      return response?.data || response
    },
    {
      ...defaultConfig,
      refreshInterval: CACHE_TIMES.moderate
    }
  )
}

/**
 * Hook for fetching analytics dashboard data
 * Cache time: 5 minutes (moderate data)
 */
export function useAnalyticsDashboard(period: any) {
  return useSWR(
    ['admin/analytics/dashboard', period],
    async () => {
      const [dashboard, alerts] = await Promise.all([
        adminApi.analytics.getDashboard(period),
        adminApi.analytics.getAlerts().catch(() => ({ data: [] }))
      ])
      return {
        dashboard: dashboard?.data || dashboard,
        alerts: alerts?.data || alerts || []
      }
    },
    {
      ...defaultConfig,
      refreshInterval: CACHE_TIMES.moderate
    }
  )
}

/**
 * Hook for fetching audit logs
 * Cache time: 15 minutes (slow-changing data)
 */
export function useAuditLogs(filters?: any) {
  const key = filters ? ['admin/security/audit-logs', filters] : 'admin/security/audit-logs'
  
  return useSWR(
    key,
    async () => {
      const response = await adminApi.security.getAuditLogs(filters)
      return response?.data || response
    },
    {
      ...defaultConfig,
      refreshInterval: CACHE_TIMES.slow
    }
  )
}

/**
 * Hook for fetching security events
 * Cache time: 1 minute (realtime data)
 */
export function useSecurityEvents(filters?: any) {
  const key = filters ? ['admin/security/events', filters] : 'admin/security/events'
  
  return useSWR(
    key,
    async () => {
      const response = await adminApi.security.getSecurityEvents(filters)
      return response?.data || response
    },
    {
      ...defaultConfig,
      refreshInterval: CACHE_TIMES.realtime
    }
  )
}

/**
 * Hook for fetching email campaigns
 * Cache time: 5 minutes (moderate data)
 */
export function useEmailCampaigns() {
  return useSWR(
    'admin/communication/campaigns',
    async () => {
      const response = await adminApi.communication.getEmailCampaigns()
      return response?.data || response
    },
    {
      ...defaultConfig,
      refreshInterval: CACHE_TIMES.moderate
    }
  )
}

/**
 * Hook for fetching campaign details
 * Cache time: 5 minutes (moderate data)
 */
export function useCampaignDetails(campaignId: string | null) {
  return useSWR(
    campaignId ? `admin/communication/campaigns/${campaignId}` : null,
    async () => {
      if (!campaignId) return null
      const response = await adminApi.communication.getEmailCampaignById(campaignId)
      return response?.data || response
    },
    {
      ...defaultConfig,
      refreshInterval: CACHE_TIMES.moderate
    }
  )
}

/**
 * Hook for fetching email templates
 * Cache time: 15 minutes (slow-changing data)
 */
export function useEmailTemplates() {
  return useSWR(
    'admin/communication/templates',
    async () => {
      const response = await adminApi.communication.getEmailTemplates()
      return response?.data || response
    },
    {
      ...defaultConfig,
      refreshInterval: CACHE_TIMES.slow
    }
  )
}
