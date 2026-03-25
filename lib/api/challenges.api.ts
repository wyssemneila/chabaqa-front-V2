import { apiClient, ApiSuccessResponse, PaginatedResponse, PaginationParams } from './client';
import type { ApiGetOptions } from './client';
import type { Challenge, ChallengeParticipant, ChallengeUnlockedTasksResponse } from './types';
import { getDeviceInfo } from '@/lib/utils/device';

// ==========================================
// DTO Interfaces based on Backend
// ==========================================

export interface CreateChallengeResourceData {
  title: string;
  type: 'video' | 'article' | 'code' | 'tool' | 'pdf' | 'link';
  url: string;
  description?: string;
  order: number;
}

export interface CreateChallengeTaskResourceData {
  id?: string;
  title: string;
  type: 'video' | 'article' | 'code' | 'tool';
  url: string;
  description?: string;
}

export interface CreateChallengeTaskData {
  id?: string;
  day: number;
  title: string;
  description: string;
  deliverable: string;
  points: number;
  isActive?: boolean;
  instructions?: string;
  notes?: string;
  resources: CreateChallengeTaskResourceData[];
}

export interface CreateChallengeData {
  title: string;
  description: string;
  communitySlug: string;
  startDate: string;
  endDate: string;
  depositAmount?: number;
  maxParticipants?: number;
  completionReward?: number;
  topPerformerBonus?: number;
  streakBonus?: number;
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  duration?: string;
  thumbnail?: string;
  notes?: string;
  isActive?: boolean;
  sequentialProgression?: boolean;
  unlockMessage?: string;
  resources: CreateChallengeResourceData[];
  tasks: CreateChallengeTaskData[];
  participationFee?: number;
  currency?: 'USD' | 'EUR' | 'TND';
  depositRequired?: boolean;
  isPremium?: boolean;
  premiumFeatures?: {
    personalMentoring?: boolean;
    exclusiveResources?: boolean;
    priorityFeedback?: boolean;
    certificate?: boolean;
    liveSessions?: boolean;
    communityAccess?: boolean;
  };
  paymentOptions?: {
    allowInstallments?: boolean;
    installmentCount?: number;
    earlyBirdDiscount?: number;
    groupDiscount?: number;
    memberDiscount?: number;
  };
  freeTrialDays?: number;
  trialFeatures?: string[];
}

export interface UpdateChallengeData extends Partial<CreateChallengeData> {
  isActive?: boolean;
}

export interface ChallengeListParams extends PaginationParams {
  communitySlug?: string;
  category?: string;
  difficulty?: string;
  isActive?: boolean;
}

export interface JoinChallengeDto {
  challengeId: string;
}

export interface LeaveChallengeDto {
  challengeId: string;
}

export interface UpdateProgressDto {
  challengeId: string;
  taskId: string;
  status: 'completed' | 'in_progress' | 'not_started';
  submissionUrl?: string; // Optional, purely for frontend context if backend adds support later
}

export interface CreateChallengePostDto {
  content: string;
  images?: string[];
}

export interface CreateChallengeCommentDto {
  content: string;
}

export interface UpdateChallengePricingDto {
  participationFee?: number;
  currency?: string;
  depositAmount?: number;
  depositRequired?: boolean;
  isPremium?: boolean;
  completionReward?: number;
  topPerformerBonus?: number;
  streakBonus?: number;
  premiumFeatures?: any;
  paymentOptions?: any;
  freeTrialDays?: number;
  trialFeatures?: string[];
}

export interface CalculateChallengePriceDto {
  challengeId: string;
  userType?: 'early-bird' | 'group' | 'member';
}

export interface CheckChallengeAccessDto {
  challengeId: string;
  userId: string;
}

export interface UpdateChallengeSequentialProgressionDto {
  enabled: boolean;
  unlockMessage?: string;
}

// ==========================================
// Challenges API
// ==========================================

export const challengesApi = {
  // -------------------------------------------------------------------------
  // CRUD Operations
  // -------------------------------------------------------------------------

  // Get all challenges
  getAll: async (
    params?: ChallengeListParams,
    options?: ApiGetOptions,
  ): Promise<PaginatedResponse<Challenge>> => {
    return apiClient.get<PaginatedResponse<Challenge>>('/challenges', params, options);
  },

  // Create challenge
  create: async (data: CreateChallengeData): Promise<ApiSuccessResponse<Challenge>> => {
    return apiClient.post<ApiSuccessResponse<Challenge>>('/challenges', data);
  },

  // Get challenge by ID
  getById: async (id: string): Promise<ApiSuccessResponse<Challenge>> => {
    return apiClient.get<ApiSuccessResponse<Challenge>>(`/challenges/${id}`);
  },

  // Update challenge
  update: async (id: string, data: UpdateChallengeData): Promise<ApiSuccessResponse<Challenge>> => {
    return apiClient.patch<ApiSuccessResponse<Challenge>>(`/challenges/${id}`, data);
  },

  updateTasks: async (id: string, tasks: CreateChallengeTaskData[]): Promise<ApiSuccessResponse<Challenge>> => {
    return apiClient.put<ApiSuccessResponse<Challenge>>(`/challenges/${id}/tasks`, { tasks });
  },

  publish: async (id: string): Promise<ApiSuccessResponse<Challenge>> => {
    return apiClient.post<ApiSuccessResponse<Challenge>>(`/challenges/${id}/publish`, {});
  },

  // Delete challenge
  delete: async (id: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.delete<ApiSuccessResponse<void>>(`/challenges/${id}`);
  },

  // Get challenges by community
  getByCommunity: async (slug: string): Promise<ApiSuccessResponse<Challenge[]>> => {
    return apiClient.get<ApiSuccessResponse<Challenge[]>>(`/challenges/community/${slug}`);
  },

  // Get challenges by user (participated + created)
  getChallengesByUser: async (userId: string, params?: { page?: number; limit?: number; type?: 'participated' | 'created' | 'all'; communityId?: string }): Promise<any> => {
    return apiClient.get(`/challenges/by-user/${userId}`, params);
  },

  getByCreator: async (userId: string, params?: { page?: number; limit?: number; communityId?: string }): Promise<any> => {
    return apiClient.get(`/challenges/by-user/${userId}`, { ...(params || {}), type: 'created' });
  },

  // Get free challenges
  getFreeChallenges: async (params?: ChallengeListParams): Promise<PaginatedResponse<Challenge>> => {
    return apiClient.get<PaginatedResponse<Challenge>>('/challenges/free', params);
  },

  // Get premium challenges
  getPremiumChallenges: async (params?: ChallengeListParams): Promise<PaginatedResponse<Challenge>> => {
    return apiClient.get<PaginatedResponse<Challenge>>('/challenges/premium', params);
  },

  // -------------------------------------------------------------------------
  // Participation
  // -------------------------------------------------------------------------

  // Join challenge
  join: async (challengeId: string): Promise<ApiSuccessResponse<Challenge>> => {
    return apiClient.post<ApiSuccessResponse<Challenge>>('/challenges/join', { challengeId });
  },

  initStripePayment: async (challengeId: string, promoCode?: string): Promise<any> => {
    const endpoint = promoCode
      ? `/payment/stripe-link/init/challenge?promoCode=${encodeURIComponent(promoCode)}`
      : `/payment/stripe-link/init/challenge`;

    return apiClient.post<any>(endpoint, { challengeId });
  },

  // Leave challenge
  leave: async (challengeId: string): Promise<ApiSuccessResponse<Challenge>> => {
    return apiClient.post<ApiSuccessResponse<Challenge>>('/challenges/leave', { challengeId });
  },

  // Get user participations
  getMyParticipations: async (params?: { communitySlug?: string; status?: string }): Promise<any> => {
    return apiClient.get('/challenges/user/my-participations', params);
  },

  // Get leaderboard
  getLeaderboard: async (id: string, limit: number = 50): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>(`/challenges/${id}/leaderboard`, { limit });
  },

  // -------------------------------------------------------------------------
  // Progress & Tasks
  // -------------------------------------------------------------------------

  // Update progress
  updateProgress: async (data: UpdateProgressDto): Promise<ApiSuccessResponse<Challenge>> => {
    return apiClient.patch<ApiSuccessResponse<Challenge>>('/challenges/progress', data);
  },

  // Update progress with sequential verification
  updateProgressSequential: async (data: UpdateProgressDto): Promise<ApiSuccessResponse<Challenge>> => {
    return apiClient.patch<ApiSuccessResponse<Challenge>>('/challenges/progress/sequential', data);
  },

  // Get unlocked tasks
  getUnlockedTasks: async (id: string): Promise<ApiSuccessResponse<ChallengeUnlockedTasksResponse>> => {
    return apiClient.get<ApiSuccessResponse<ChallengeUnlockedTasksResponse>>(`/challenges/${id}/unlocked-tasks`);
  },

  // Check task access
  checkTaskAccess: async (id: string, taskId: string): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>(`/challenges/${id}/tasks/${taskId}/access`);
  },

  // Unlock task manually (Creator only)
  unlockTaskManually: async (id: string, taskId: string, userId: string): Promise<ApiSuccessResponse<{ message: string }>> => {
    return apiClient.post<ApiSuccessResponse<{ message: string }>>(`/challenges/${id}/tasks/${taskId}/unlock`, { userId });
  },

  // Toggle sequential progression (Creator only)
  updateSequentialProgression: async (id: string, data: UpdateChallengeSequentialProgressionDto): Promise<ApiSuccessResponse<Challenge>> => {
    return apiClient.patch<ApiSuccessResponse<Challenge>>(`/challenges/${id}/sequential-progression`, data);
  },

  // -------------------------------------------------------------------------
  // Tracking & Analytics
  // -------------------------------------------------------------------------

  trackView: async (id: string): Promise<void> => {
    return apiClient.post(`/challenges/${id}/track/view`, { metadata: getDeviceInfo() });
  },

  trackStart: async (id: string): Promise<void> => {
    return apiClient.post(`/challenges/${id}/track/start`, { metadata: getDeviceInfo() });
  },

  trackComplete: async (id: string): Promise<void> => {
    return apiClient.post(`/challenges/${id}/track/complete`, { metadata: getDeviceInfo() });
  },

  trackLike: async (id: string): Promise<void> => {
    return apiClient.post(`/challenges/${id}/track/like`, { metadata: getDeviceInfo() });
  },

  trackShare: async (id: string): Promise<void> => {
    return apiClient.post(`/challenges/${id}/track/share`, { metadata: getDeviceInfo() });
  },

  addBookmark: async (id: string, bookmarkId: string): Promise<void> => {
    return apiClient.post(`/challenges/${id}/track/bookmark`, { bookmarkId });
  },

  removeBookmark: async (id: string, bookmarkId: string): Promise<void> => {
    return apiClient.delete(`/challenges/${id}/track/bookmark/${bookmarkId}`);
  },

  addRating: async (id: string, rating: number, review?: string): Promise<void> => {
    return apiClient.post(`/challenges/${id}/track/rating`, { rating, review });
  },

  // Get user progress details
  getUserProgress: async (id: string): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>(`/challenges/${id}/track/progress`);
  },

  // Get basic stats
  getStats: async (id: string): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>(`/challenges/${id}/track/stats`);
  },

  // Get detailed analytics (Creator only)
  getAnalytics: async (id: string, from?: string, to?: string): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>(`/challenges/${id}/analytics`, { from, to });
  },

  // -------------------------------------------------------------------------
  // Posts & Comments
  // -------------------------------------------------------------------------

  createPost: async (challengeId: string, data: CreateChallengePostDto): Promise<ApiSuccessResponse<Challenge>> => {
    return apiClient.post<ApiSuccessResponse<Challenge>>(`/challenges/${challengeId}/posts`, data);
  },

  commentPost: async (challengeId: string, postId: string, data: CreateChallengeCommentDto): Promise<ApiSuccessResponse<Challenge>> => {
    return apiClient.post<ApiSuccessResponse<Challenge>>(`/challenges/${challengeId}/posts/${postId}/comments`, data);
  },

  getAllSubmissions: async (id: string): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>(`/challenges/${id}/submissions/all`);
  },

  getSubmissions: async (id: string): Promise<ApiSuccessResponse<any[]>> => {
    return apiClient.get<ApiSuccessResponse<any[]>>(`/challenges/${id}/submissions`);
  },

  // -------------------------------------------------------------------------
  // Pricing
  // -------------------------------------------------------------------------

  updatePricing: async (id: string, data: UpdateChallengePricingDto): Promise<ApiSuccessResponse<Challenge>> => {
    return apiClient.patch<ApiSuccessResponse<Challenge>>(`/challenges/${id}/pricing`, data);
  },

  calculatePrice: async (data: CalculateChallengePriceDto): Promise<ApiSuccessResponse<any>> => {
    return apiClient.post<ApiSuccessResponse<any>>('/challenges/calculate-price', data);
  },

  checkAccess: async (data: CheckChallengeAccessDto): Promise<ApiSuccessResponse<any>> => {
    return apiClient.post<ApiSuccessResponse<any>>('/challenges/check-access', data);
  },

  getRewardEligibility: async (id: string): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>(`/challenges/${id}/rewards/eligibility`);
  },

  distributeRewards: async (
    id: string,
    data: { idempotencyKey: string; payouts?: Array<{ userId: string; rewardType: 'completion' | 'top_performer' | 'streak'; amount: number }> },
  ): Promise<ApiSuccessResponse<any>> => {
    return apiClient.post<ApiSuccessResponse<any>>(`/challenges/${id}/rewards/distribute`, data);
  },
};
