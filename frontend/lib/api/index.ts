// Export all API modules
export * from "./client";
export * from "./types";
export * from "./analytics.api";
export * from "./auth.api";
export * from "./challenges.api";
export * from "./challenges-community.api";
export * from "./communities.api";
export * from "./community-home.api";
export * from "./courses.api";
export * from "./courses-community.api";
export * from "./creator-analytics.api";
export * from "./creator-integrations.api";
export * from "./creator-writing.api";
export * from "./email-campaigns.api";
export * from "./events.api";
export * from "./events-community.api";
export * from "./notifications.api";
export * from "./payments.api";
export * from "./posts.api";
export * from "./products.api";
export * from "./products-community.api";
export * from "./sessions.api";
export * from "./sessions-community.api";
export * from "./storage.api";
export * from "./subscription.api";
export * from "./users.api";
export * from "./user.api";
export * from "./progression.api";
export * from "./learning-path.api";
export * from "./resources.api";
export * from "./achievements.api";
export * from "./community-page-content";
export * from "./community-members.api";
export * from "./feedback.api";
export * from "./dm.api";
export * from "./live-support.api";
export * from "./ai.api";
export * from "./tracking.api";
export * from "./affiliate.api";
export * from "./community-access.api";
export type {
  ModerationAction,
  ModerationStatus,
  ModerationItem,
  ModerationReport,
  ModerationQueueFilters,
  ModerationQueueResponse,
  ModerationActivityLog,
  ModerationStats,
  PinnedPost,
} from "./moderation.api";
export { moderationApi } from "./moderation.api";

// Re-export to avoid ambiguity
export type { PaginationParams } from "./client";

// Export API instances for easy access
import { authApi } from "./auth.api";
import { usersApi } from "./users.api";
import { communitiesApi } from "./communities.api";
import { coursesApi } from "./courses.api";
import { challengesApi } from "./challenges.api";
import { sessionsApi } from "./sessions.api";
import { eventsApi } from "./events.api";
import { productsApi } from "./products.api";
import { postsApi } from "./posts.api";
import { paymentsApi } from "./payments.api";
import { subscriptionApi } from "./subscription.api";
import { analyticsApi } from "./analytics.api";
import { creatorAnalyticsApi } from "./creator-analytics.api";
import { notificationsApi } from "./notifications.api";
import { storageApi } from "./storage.api";
import { emailCampaignsApi } from "./email-campaigns.api";
import { feedbackApi } from "./feedback.api";
import { aiApi } from "./ai.api";
import { dmApi } from "./dm.api";
import { liveSupportApi } from "./live-support.api";
import { learningPathApi } from "./learning-path.api";
import { resourcesApi } from "./resources.api";
import { trackingApi } from "./tracking.api";
import { affiliateApi } from "./affiliate.api";
import { communityInvitationsApi } from "./community-invitations.api";
import { communityMembersApi } from "./community-members.api";
import { communityAccessApi } from "./community-access.api";
import { moderationApi } from "./moderation.api";

export const api = {
  auth: authApi,
  users: usersApi,
  communities: communitiesApi,
  courses: coursesApi,
  challenges: challengesApi,
  sessions: sessionsApi,
  events: eventsApi,
  products: productsApi,
  posts: postsApi,
  payments: paymentsApi,
  subscription: subscriptionApi,
  analytics: analyticsApi,
  creatorAnalytics: creatorAnalyticsApi,
  notifications: notificationsApi,
  storage: storageApi,
  emailCampaigns: emailCampaignsApi,
  feedback: feedbackApi,
  ai: aiApi,
  dm: dmApi,
  liveSupport: liveSupportApi,
  learningPath: learningPathApi,
  resources: resourcesApi,
  tracking: trackingApi,
  affiliate: affiliateApi,
  communityInvitations: communityInvitationsApi,
  communityMembers: communityMembersApi,
  communityAccess: communityAccessApi,
  moderation: moderationApi,
};
