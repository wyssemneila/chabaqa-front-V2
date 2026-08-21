import { Injectable } from '@nestjs/common';
import { NotificationType } from '@/domains/communication/notification/notification-types';

/**
 * Computes the deep-link URL that a push notification should open.
 * Falls back to '/creator/notifications' when no specific route can be derived.
 */
@Injectable()
export class NotificationRoutingService {
  resolveUrl(type: string, data?: Record<string, any>): string {
    if (data?.url && typeof data.url === 'string') {
      return data.url;
    }

    switch (type) {
      case NotificationType.POST_MENTION:
      case NotificationType.COMMENT_MENTION:
        if (data?.communityId && data?.postId) {
          return `/creator/communities/${data.communityId}/posts/${data.postId}`;
        }
        break;

      case NotificationType.NEW_DM_MESSAGE:
        if (data?.conversationId) {
          return `/creator/messages/${data.conversationId}`;
        }
        break;

      case NotificationType.EVENT_REMINDER:
      case NotificationType.EVENT_CREATED:
        if (data?.eventId) {
          return `/creator/events/${data.eventId}`;
        }
        break;

      case NotificationType.NEW_COMMUNITY_MEMBER:
      case NotificationType.MEMBER_JOINED:
        if (data?.communityId) {
          return `/creator/communities/${data.communityId}/members`;
        }
        break;

      case NotificationType.COURSE_CREATED:
      case NotificationType.COURSE_ENROLLED:
      case 'new_course':
        if (data?.courseId) {
          return `/creator/courses/${data.courseId}/manage`;
        }
        break;

      case NotificationType.CHALLENGE_CREATED:
      case NotificationType.CHALLENGE_COMPLETED:
        if (data?.challengeId) {
          return `/creator/challenges/${data.challengeId}/manage`;
        }
        break;

      case NotificationType.PRODUCT_PURCHASED:
        if (data?.productId) {
          return `/creator/products/${data.productId}/manage`;
        }
        break;

      case NotificationType.PAYMENT_RECEIVED:
        return '/creator/monetization/payouts';

      case 'manual_payment_approved':
        if (data?.contentType && data?.contentId) {
          const contentType = String(data.contentType).toLowerCase();
          if (contentType === 'course') return `/creator/courses/${data.contentId}/manage`;
          if (contentType === 'challenge') return `/creator/challenges/${data.contentId}/manage`;
          if (contentType === 'session') return `/creator/sessions/${data.contentId}/edit`;
          if (contentType === 'event') return `/creator/events/${data.contentId}`;
          if (contentType === 'product') return `/creator/products/${data.contentId}/manage`;
        }
        return '/creator/billing';

      case NotificationType.ANALYTICS_UPDATE:
        return '/creator/analytics';
    }

    return '/creator/notifications';
  }
}
