// ── Core ─────────────────────────────────────────────────────────────────────
export * from './core/client'
export * from './core/types'
export * from './core/error-parser'

// ── Auth ─────────────────────────────────────────────────────────────────────
export * from './auth.api'

// ── Community ─────────────────────────────────────────────────────────────────
export * from './community/communities.api'
export * from './community/community-access.api'
export * from './community/community-home.api'
export * from './community/community-invitations.api'
export * from './community/community-members.api'
export * from './community/community-page-content'
export * from './community/posts.api'

// ── Learning ─────────────────────────────────────────────────────────────────
export * from './learning/courses.api'
export * from './learning/courses-community.api'
export * from './learning/challenges.api'
export * from './learning/challenges-community.api'
export * from './learning/challenge-tracking'
export * from './learning/learning-path.api'
export * from './learning/progression.api'
export * from './learning/achievements.api'

// ── Commerce ─────────────────────────────────────────────────────────────────
export * from './commerce/payments.api'
export * from './commerce/products.api'
export * from './commerce/products-community.api'
export * from './commerce/subscription.api'
export * from './commerce/manual-payments'

// ── Events & Sessions ────────────────────────────────────────────────────────
export * from './events/events.api'
export * from './events/events-community.api'
export * from './events/sessions.api'
export * from './events/sessions-community.api'

// ── Media ────────────────────────────────────────────────────────────────────
export * from './media/media.api'
export * from './media/storage.api'
export * from './media/video-playback.api'
export * from './media/resources.api'

// ── Social ───────────────────────────────────────────────────────────────────
export * from './social/dm.api'
export * from './social/notifications.api'
export * from './social/live-support.api'
export * from './social/feedback.api'

// ── Admin ────────────────────────────────────────────────────────────────────
export * from './admin/admin-api'
export * from './admin/moderation.api'
export * from './admin/analytics.api'

// ── User ─────────────────────────────────────────────────────────────────────
export * from './user/user.api'
export * from './user/users.api'

// ── Creator ──────────────────────────────────────────────────────────────────
export * from './creator/creator-analytics.api'
export * from './creator/email-campaigns.api'
export * from './creator/affiliate.api'
export * from './creator/tracking.api'

// ── Integrations ─────────────────────────────────────────────────────────────
export * from './integrations/google-calendar.api'
export * from './integrations/ai.api'

// ── Re-export to avoid ambiguity ──────────────────────────────────────────────
export type { PaginationParams } from './core/client'

// ── Unified API object ────────────────────────────────────────────────────────
import { authApi }               from './auth.api'
import { usersApi }              from './user/users.api'
import { communitiesApi }        from './community/communities.api'
import { coursesApi }            from './learning/courses.api'
import { challengesApi }         from './learning/challenges.api'
import { sessionsApi }           from './events/sessions.api'
import { eventsApi }             from './events/events.api'
import { productsApi }           from './commerce/products.api'
import { postsApi }              from './community/posts.api'
import { paymentsApi }           from './commerce/payments.api'
import { subscriptionApi }       from './commerce/subscription.api'
import { analyticsApi }          from './admin/analytics.api'
import { creatorAnalyticsApi }   from './creator/creator-analytics.api'
import { notificationsApi }      from './social/notifications.api'
import { storageApi }            from './media/storage.api'
import { emailCampaignsApi }     from './creator/email-campaigns.api'
import { feedbackApi }           from './social/feedback.api'
import { aiApi }                 from './integrations/ai.api'
import { dmApi }                 from './social/dm.api'
import { liveSupportApi }        from './social/live-support.api'
import { learningPathApi }       from './learning/learning-path.api'
import { resourcesApi }          from './media/resources.api'
import { trackingApi }           from './creator/tracking.api'
import { affiliateApi }          from './creator/affiliate.api'
import { communityInvitationsApi } from './community/community-invitations.api'
import { communityMembersApi }   from './community/community-members.api'
import { communityAccessApi }    from './community/community-access.api'
import { moderationApi }         from './admin/moderation.api'

export const api = {
  auth:                authApi,
  users:               usersApi,
  communities:         communitiesApi,
  courses:             coursesApi,
  challenges:          challengesApi,
  sessions:            sessionsApi,
  events:              eventsApi,
  products:            productsApi,
  posts:               postsApi,
  payments:            paymentsApi,
  subscription:        subscriptionApi,
  analytics:           analyticsApi,
  creatorAnalytics:    creatorAnalyticsApi,
  notifications:       notificationsApi,
  storage:             storageApi,
  emailCampaigns:      emailCampaignsApi,
  feedback:            feedbackApi,
  ai:                  aiApi,
  dm:                  dmApi,
  liveSupport:         liveSupportApi,
  learningPath:        learningPathApi,
  resources:           resourcesApi,
  tracking:            trackingApi,
  affiliate:           affiliateApi,
  communityInvitations: communityInvitationsApi,
  communityMembers:    communityMembersApi,
  communityAccess:     communityAccessApi,
  moderation:          moderationApi,
}
