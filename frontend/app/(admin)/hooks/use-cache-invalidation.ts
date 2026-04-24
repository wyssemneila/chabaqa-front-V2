/**
 * Cache invalidation utilities for admin dashboard
 * 
 * These utilities help invalidate cached data after mutations
 * to ensure the UI stays in sync with the backend.
 */

import { mutate } from 'swr'

/**
 * Invalidate all dashboard metrics cache
 */
export function invalidateDashboardMetrics() {
  return mutate('admin/dashboard/metrics')
}

/**
 * Invalidate users cache
 */
export function invalidateUsers(filters?: any) {
  if (filters) {
    return mutate(['admin/users', filters])
  }
  // Invalidate all user-related cache keys
  return mutate(
    (key) => typeof key === 'string' && key.startsWith('admin/users'),
    undefined,
    { revalidate: true }
  )
}

/**
 * Invalidate specific user details cache
 */
export function invalidateUserDetails(userId: string) {
  return mutate(`admin/users/${userId}`)
}

/**
 * Invalidate communities cache
 */
export function invalidateCommunities(filters?: any) {
  if (filters) {
    return mutate(['admin/communities', filters])
  }
  // Invalidate all community-related cache keys
  return mutate(
    (key) => typeof key === 'string' && key.startsWith('admin/communities'),
    undefined,
    { revalidate: true }
  )
}

/**
 * Invalidate pending communities cache
 */
export function invalidatePendingCommunities() {
  return mutate('admin/communities/pending')
}

/**
 * Invalidate specific community details cache
 */
export function invalidateCommunityDetails(communityId: string) {
  return mutate(`admin/communities/${communityId}`)
}

/**
 * Invalidate moderation queue cache
 */
export function invalidateModerationQueue(filters?: any) {
  if (filters) {
    return mutate(['admin/moderation/queue', filters])
  }
  // Invalidate all moderation-related cache keys
  return mutate(
    (key) => typeof key === 'string' && key.startsWith('admin/moderation'),
    undefined,
    { revalidate: true }
  )
}

/**
 * Invalidate specific content details cache
 */
export function invalidateContentDetails(contentId: string) {
  return mutate(`admin/moderation/content/${contentId}`)
}

/**
 * Invalidate financial dashboard cache
 */
export function invalidateFinancialDashboard(period?: 'week' | 'month' | 'year') {
  if (period) {
    return mutate(['admin/financial/dashboard', period])
  }
  // Invalidate all financial dashboard cache keys
  return mutate(
    (key) => Array.isArray(key) && key[0] === 'admin/financial/dashboard',
    undefined,
    { revalidate: true }
  )
}

/**
 * Invalidate subscriptions cache
 */
export function invalidateSubscriptions(filters?: any) {
  if (filters) {
    return mutate(['admin/financial/subscriptions', filters])
  }
  // Invalidate all subscription-related cache keys
  return mutate(
    (key) => typeof key === 'string' && key.startsWith('admin/financial/subscriptions'),
    undefined,
    { revalidate: true }
  )
}

/**
 * Invalidate transactions cache
 */
export function invalidateTransactions(filters?: any) {
  if (filters) {
    return mutate(['admin/financial/transactions', filters])
  }
  // Invalidate all transaction-related cache keys
  return mutate(
    (key) => typeof key === 'string' && key.startsWith('admin/financial/transactions'),
    undefined,
    { revalidate: true }
  )
}

/**
 * Invalidate payouts cache
 */
export function invalidatePayouts(filters?: any) {
  if (filters) {
    return mutate(['admin/financial/payouts', filters])
  }
  // Invalidate all payout-related cache keys
  return mutate(
    (key) => typeof key === 'string' && key.startsWith('admin/financial/payouts'),
    undefined,
    { revalidate: true }
  )
}

/**
 * Invalidate analytics dashboard cache
 */
export function invalidateAnalyticsDashboard(period?: any) {
  if (period) {
    return mutate(['admin/analytics/dashboard', period])
  }
  // Invalidate all analytics dashboard cache keys
  return mutate(
    (key) => Array.isArray(key) && key[0] === 'admin/analytics/dashboard',
    undefined,
    { revalidate: true }
  )
}

/**
 * Invalidate audit logs cache
 */
export function invalidateAuditLogs(filters?: any) {
  if (filters) {
    return mutate(['admin/security/audit-logs', filters])
  }
  // Invalidate all audit log cache keys
  return mutate(
    (key) => typeof key === 'string' && key.startsWith('admin/security/audit-logs'),
    undefined,
    { revalidate: true }
  )
}

/**
 * Invalidate security events cache
 */
export function invalidateSecurityEvents(filters?: any) {
  if (filters) {
    return mutate(['admin/security/events', filters])
  }
  // Invalidate all security event cache keys
  return mutate(
    (key) => typeof key === 'string' && key.startsWith('admin/security/events'),
    undefined,
    { revalidate: true }
  )
}

/**
 * Invalidate email campaigns cache
 */
export function invalidateEmailCampaigns() {
  return mutate('admin/communication/campaigns')
}

/**
 * Invalidate specific campaign details cache
 */
export function invalidateCampaignDetails(campaignId: string) {
  return mutate(`admin/communication/campaigns/${campaignId}`)
}

/**
 * Invalidate email templates cache
 */
export function invalidateEmailTemplates() {
  return mutate('admin/communication/templates')
}

/**
 * Invalidate all admin cache
 * Use with caution - this will revalidate all cached data
 */
export function invalidateAllAdminCache() {
  return mutate(
    (key) => {
      if (typeof key === 'string') {
        return key.startsWith('admin/')
      }
      if (Array.isArray(key)) {
        return typeof key[0] === 'string' && key[0].startsWith('admin/')
      }
      return false
    },
    undefined,
    { revalidate: true }
  )
}
