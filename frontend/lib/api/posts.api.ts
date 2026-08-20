import { apiClient, ApiSuccessResponse, PaginationParams } from '../core/client';
import type { Post, PostComment, PostLink, PostShareMeta, PostShareMethod, PostStats } from '../core/types';

export interface CreatePostData {
  title?: string;
  content: string;
  communityId: string;
  thumbnail?: string;
  excerpt?: string;
  tags?: string[];
  images?: string[];
  videos?: string[];
  links?: PostLink[];
}

export interface UpdatePostData extends Partial<CreatePostData> { }

export interface CreateCommentData {
  content: string;
  parentId?: string;
}

export interface ReactPostData {
  emoji: string;
}

export interface SharePostData {
  method?: PostShareMethod;
  targetUrl?: string;
}

export interface NormalizedPostListResponse<T = Post> {
  posts: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

export const normalizePostListResponse = <T = Post>(
  response: any,
  fallback: { page?: number; limit?: number } = {},
): NormalizedPostListResponse<T> => {
  const fallbackPage = fallback.page ?? DEFAULT_PAGE;
  const fallbackLimit = fallback.limit ?? DEFAULT_LIMIT;

  const postsSource =
    response?.data?.posts
    || response?.data?.items
    || response?.posts
    || response?.items
    || response?.data
    || response
    || [];

  const posts = Array.isArray(postsSource) ? postsSource : [];

  const paginationSource =
    response?.data?.pagination
    || response?.pagination
    || {};

  const page = Number(paginationSource?.page ?? fallbackPage) || fallbackPage;
  const limit = Number(paginationSource?.limit ?? fallbackLimit) || fallbackLimit;
  const total = Number(paginationSource?.total ?? posts.length) || posts.length;
  const totalPages = Number(paginationSource?.totalPages ?? Math.max(1, Math.ceil(total / Math.max(limit, 1)))) || 1;

  return {
    posts: posts as T[],
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

// Posts API
export const postsApi = {
  // Get all posts

  getAll: async (params?: PaginationParams): Promise<NormalizedPostListResponse<Post>> => {
    const response = await apiClient.get<any>('/posts', params);
    return normalizePostListResponse<Post>(response, params);
  },

  // Create post
  create: async (data: CreatePostData): Promise<ApiSuccessResponse<Post>> => {
    return apiClient.post<ApiSuccessResponse<Post>>('/posts', data);
  },

  // Get post by ID
  getById: async (id: string): Promise<ApiSuccessResponse<Post>> => {
    return apiClient.get<ApiSuccessResponse<Post>>(`/posts/${id}`);
  },

  // Update post
  update: async (id: string, data: UpdatePostData): Promise<ApiSuccessResponse<Post>> => {
    return apiClient.patch<ApiSuccessResponse<Post>>(`/posts/${id}`, data);
  },

  // Delete post
  delete: async (id: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.delete<ApiSuccessResponse<void>>(`/posts/${id}`);
  },

  // Get posts by community
  getByCommunity: async (
    communityId: string,
    params?: PaginationParams & { userId?: string },
  ): Promise<NormalizedPostListResponse<Post>> => {
    const response = await apiClient.get<any>(`/posts/community/${communityId}`, params);
    return normalizePostListResponse<Post>(response, params);
  },

  // Like post
  like: async (id: string): Promise<ApiSuccessResponse<PostStats>> => {
    return apiClient.post<ApiSuccessResponse<PostStats>>(`/posts/${id}/like`);
  },

  // Unlike post
  unlike: async (id: string): Promise<ApiSuccessResponse<PostStats>> => {
    return apiClient.post<ApiSuccessResponse<PostStats>>(`/posts/${id}/unlike`);
  },

  // React with emoji (toggle)
  react: async (id: string, data: ReactPostData): Promise<ApiSuccessResponse<Post>> => {
    return apiClient.post<ApiSuccessResponse<Post>>(`/posts/${id}/react`, data);
  },

  // Pin post (creator only)
  pinPost: async (id: string): Promise<ApiSuccessResponse<Post>> => {
    return apiClient.patch<ApiSuccessResponse<Post>>(`/posts/${id}/pin`);
  },

  // Unpin post (creator only)
  unpinPost: async (id: string): Promise<ApiSuccessResponse<Post>> => {
    return apiClient.patch<ApiSuccessResponse<Post>>(`/posts/${id}/unpin`);
  },

  // Share post
  share: async (id: string, data?: SharePostData): Promise<ApiSuccessResponse<PostStats>> => {
    return apiClient.post<ApiSuccessResponse<PostStats>>(`/posts/${id}/share`, data);
  },

  // Get share metadata for post
  getShareMeta: async (id: string): Promise<ApiSuccessResponse<PostShareMeta>> => {
    return apiClient.get<ApiSuccessResponse<PostShareMeta>>(`/posts/${id}/share`);
  },

  // Get comments
  getComments: async (id: string, params?: PaginationParams): Promise<ApiSuccessResponse<PostComment[]>> => {
    return apiClient.get<ApiSuccessResponse<PostComment[]>>(`/posts/${id}/comments`, params);
  },

  // Create comment
  createComment: async (id: string, data: CreateCommentData): Promise<ApiSuccessResponse<PostComment>> => {
    return apiClient.post<ApiSuccessResponse<PostComment>>(`/posts/${id}/comments`, data);
  },

  // Update comment
  updateComment: async (postId: string, commentId: string, data: CreateCommentData): Promise<ApiSuccessResponse<PostComment>> => {
    return apiClient.patch<ApiSuccessResponse<PostComment>>(`/posts/${postId}/comments/${commentId}`, data);
  },

  // Delete comment
  deleteComment: async (postId: string, commentId: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/posts/${postId}/comments/${commentId}`);
  },

  // Get posts by user (creator)
  getByCreator: async (
    userId: string,
    params?: PaginationParams & { communityId?: string; currentUserId?: string },
  ): Promise<NormalizedPostListResponse<Post>> => {
    const response = await apiClient.get<any>(`/posts/user/${userId}`, params);
    return normalizePostListResponse<Post>(response, params);
  },

  // Bookmark post
  bookmark: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>(`/posts/${id}/bookmark`);
  },

  // Unbookmark post
  unbookmark: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/posts/${id}/bookmark`);
  },

  // Get bookmarked posts for current user
  getBookmarks: async (params?: PaginationParams): Promise<NormalizedPostListResponse<Post>> => {
    const response = await apiClient.get<any>('/posts/user/bookmarks', params);
    return normalizePostListResponse<Post>(response, params);
  },

  // Get post stats
  getStats: async (id: string, params?: { userId?: string }): Promise<ApiSuccessResponse<PostStats>> => {
    return apiClient.get<ApiSuccessResponse<PostStats>>(`/posts/${id}/stats`, params);
  },
};

