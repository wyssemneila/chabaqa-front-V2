import { apiClient, ApiSuccessResponse } from './client';

export interface FeedbackUser {
  _id: string;
  name: string;
  avatar?: string;
}

export interface Feedback {
  _id: string;
  relatedTo: string;
  relatedModel: string;
  rating: number;
  comment?: string;
  user: FeedbackUser;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackStats {
  averageRating: number;
  ratingCount: number;
  distribution: Record<number, number>;
}

export interface CreateFeedbackData {
  relatedTo: string;
  relatedModel: 'Community' | 'Cours' | 'Challenge' | 'Event' | 'Product' | 'Session';
  rating: number;
  comment?: string;
}

// Export alias for backward compatibility
export type CreateFeedbackDto = CreateFeedbackData;

export interface UpdateFeedbackData {
  rating: number;
  comment?: string;
}

/**
 * Feedback API Service
 */
export const feedbackApi = {
  unwrap: <T>(response: any): T => {
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as ApiSuccessResponse<T>).data;
    }
    return response as T;
  },
  /**
   * Create new feedback
   */
  create: async (data: CreateFeedbackData): Promise<Feedback> => {
    const response = await apiClient.post<ApiSuccessResponse<Feedback> | Feedback>('/feedback', data);
    return feedbackApi.unwrap<Feedback>(response);
  },

  /**
   * Update existing feedback
   */
  update: async (feedbackId: string, data: UpdateFeedbackData): Promise<Feedback> => {
    const response = await apiClient.put<ApiSuccessResponse<Feedback> | Feedback>(`/feedback/${feedbackId}`, data);
    return feedbackApi.unwrap<Feedback>(response);
  },

  /**
   * Get all feedback for an item
   */
  getByRelated: async (relatedModel: string, relatedTo: string): Promise<Feedback[]> => {
    const response = await apiClient.get<ApiSuccessResponse<Feedback[]> | Feedback[]>(`/feedback/${relatedModel}/${relatedTo}`);
    return feedbackApi.unwrap<Feedback[]>(response);
  },

  /**
   * Get current user's feedback for an item
   */
  getMyFeedback: async (relatedModel: string, relatedTo: string): Promise<Feedback | null> => {
    try {
      const response = await apiClient.get<ApiSuccessResponse<Feedback> | Feedback>(`/feedback/${relatedModel}/${relatedTo}/my`);
      return feedbackApi.unwrap<Feedback>(response);
    } catch {
      return null;
    }
  },

  /**
   * Get feedback statistics for an item
   */
  getStats: async (relatedModel: string, relatedTo: string): Promise<FeedbackStats> => {
    const response = await apiClient.get<ApiSuccessResponse<FeedbackStats> | FeedbackStats>(`/feedback/${relatedModel}/${relatedTo}/stats`);
    return feedbackApi.unwrap<FeedbackStats>(response);
  },
};