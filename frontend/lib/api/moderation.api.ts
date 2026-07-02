/**
 * Moderation API Client
 *
 * Provides community-level moderation operations leveraging existing post APIs.
 * Some endpoints are placeholders waiting for backend alignment.
 */

import { apiClient, ApiSuccessResponse, PaginationParams } from './client';
import type { Post, PostComment } from './types';

// ── Types ──────────────────────────────────────────────────────────────────

export type ModerationStatus = 'pending' | 'approved' | 'hidden' | 'deleted';
export type ModerationAction = 'approve' | 'hide' | 'delete' | 'restore';
export type ContentType = 'post' | 'comment';

export interface ModerationItem {
  id: string;
  contentType: ContentType;
  contentId: string;
  communityId: string;
  status: ModerationStatus;
  reason?: string;
  reportCount: number;
  reports?: ModerationReport[];
  content: Post | PostComment;
  createdAt: string;
  updatedAt: string;
  moderatedBy?: string;
  moderatedAt?: string;
}

export interface ModerationReport {
  id: string;
  reporterId: string;
  reporterName?: string;
  reason: string;
  description?: string;
  createdAt: string;
}

export interface ModerationQueueFilters extends PaginationParams {
  status?: ModerationStatus;
  contentType?: ContentType;
  sortBy?: 'createdAt' | 'reportCount' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ModerationQueueResponse {
  items: ModerationItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    pending: number;
    approved: number;
    hidden: number;
    deleted: number;
  };
}

export interface ModerationActivityLog {
  id: string;
  moderatorId: string;
  moderatorName?: string;
  action: ModerationAction;
  contentType: ContentType;
  contentId: string;
  reason?: string;
  timestamp: string;
}

export interface PinnedPost extends Post {
  pinnedAt: string;
  pinnedBy?: string;
}

export interface ModerationStats {
  totalPending: number;
  totalReviewed: number;
  avgResponseTime: number;
  escalations: number;
  pinnedPosts: number;
}

// ── Normalize helpers ──────────────────────────────────────────────────────

function normalizeModerationQueueResponse(
  response: any,
  fallback: { page?: number; limit?: number } = {},
): ModerationQueueResponse {
  const items = response?.data?.items || response?.items || [];
  const pagination = response?.data?.pagination || response?.pagination || {};
  const stats = response?.data?.stats || response?.stats || {
    pending: 0,
    approved: 0,
    hidden: 0,
    deleted: 0,
  };

  return {
    items: Array.isArray(items) ? items : [],
    pagination: {
      page: pagination?.page ?? fallback.page ?? 1,
      limit: pagination?.limit ?? fallback.limit ?? 10,
      total: pagination?.total ?? items.length,
      totalPages: pagination?.totalPages ?? Math.max(1, Math.ceil((pagination?.total ?? items.length) / (pagination?.limit ?? 10))),
    },
    stats,
  };
}

// ── API Client ─────────────────────────────────────────────────────────────

export const moderationApi = {
  getQueue: async (
    communityId: string,
    filters?: ModerationQueueFilters,
  ): Promise<ModerationQueueResponse> => {
    const response = await apiClient.get<any>(
      `/communities/${communityId}/moderation/queue`,
      filters,
    );
    return normalizeModerationQueueResponse(response, filters);
  },

  moderatePost: async (
    postId: string,
    action: ModerationAction,
    reason?: string,
  ): Promise<ApiSuccessResponse<Post>> => {
    switch (action) {
      case 'hide':
        return apiClient.patch<ApiSuccessResponse<Post>>(`/posts/${postId}/hide`, { reason });
      case 'delete':
        return apiClient.delete<ApiSuccessResponse<Post>>(`/posts/${postId}`);
      case 'restore':
        return apiClient.patch<ApiSuccessResponse<Post>>(`/posts/${postId}/restore`, { reason });
      case 'approve':
        return apiClient.patch<ApiSuccessResponse<Post>>(`/posts/${postId}/approve`, { reason });
      default:
        throw new Error(`Unknown moderation action: ${action}`);
    }
  },

  pinPost: async (postId: string): Promise<ApiSuccessResponse<Post>> => {
    return apiClient.patch<ApiSuccessResponse<Post>>(`/posts/${postId}/pin`);
  },

  unpinPost: async (postId: string): Promise<ApiSuccessResponse<Post>> => {
    return apiClient.patch<ApiSuccessResponse<Post>>(`/posts/${postId}/unpin`);
  },

  getPinnedPosts: async (communityId: string): Promise<PinnedPost[]> => {
    try {
      const response = await apiClient.get<ApiSuccessResponse<PinnedPost[]>>(
        `/posts/community/${communityId}`,
        { isPinned: true, limit: 50 },
      );
      const data = (response as any)?.data ?? response;
      const posts = Array.isArray(data) ? data : (data?.posts ?? []);
      return posts.filter((p: any) => p.isPinned);
    } catch {
      return [];
    }
  },

  deleteComment: async (
    postId: string,
    commentId: string,
    reason?: string,
  ): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(
      `/posts/${postId}/comments/${commentId}`,
    );
  },

  getActivityLog: async (
    communityId: string,
    params?: PaginationParams,
  ): Promise<ModerationActivityLog[]> => {
    const response = await apiClient.get<any>(
      `/communities/${communityId}/moderation/activity`,
      params,
    );
    const data = response?.data ?? response;
    return data?.items ?? data ?? [];
  },

  getFlaggedUsers: async (communityId: string) => {
    const response = await apiClient.get<any>(`/communities/${communityId}/moderation/flagged-users`);
    const data = response?.data ?? response;
    return data?.items ?? [];
  },

  getStats: async (communityId: string): Promise<ModerationStats> => {
    const response = await apiClient.get<any>(
      `/communities/${communityId}/moderation/stats`,
    );
    return response?.data ?? response;
  },

  reportContent: async (
    contentType: ContentType,
    contentId: string,
    reason: string,
    description?: string,
  ): Promise<{ success: boolean; message: string }> => {
    const endpoint = contentType === 'post'
      ? `/posts/${contentId}/report`
      : `/posts/comments/${contentId}/report`;

    return apiClient.post<{ success: boolean; message: string }>(endpoint, {
      reason,
      description,
    });
  },
};

export default moderationApi;
