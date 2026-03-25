import { apiClient, ApiSuccessResponse } from './client';
import type { DashboardAnalytics, RevenueAnalytics } from './types';

export interface AnalyticsParams {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'year';
}

// Analytics API
export const analyticsApi = {
  // Get dashboard analytics
  getDashboard: async (params?: AnalyticsParams): Promise<ApiSuccessResponse<DashboardAnalytics>> => {
    return apiClient.get<ApiSuccessResponse<DashboardAnalytics>>('/analytics/dashboard', params);
  },

  // Get revenue analytics
  getRevenue: async (params?: AnalyticsParams): Promise<ApiSuccessResponse<RevenueAnalytics[]>> => {
    return apiClient.get<ApiSuccessResponse<RevenueAnalytics[]>>('/analytics/revenue', params);
  },

  // Get members analytics
  getMembers: async (params?: AnalyticsParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/analytics/members', params);
  },

  // Get engagement analytics
  getEngagement: async (params?: AnalyticsParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/analytics/engagement', params);
  },

  // Get course analytics
  getCourseAnalytics: async (courseId: string, params?: AnalyticsParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>(`/analytics/courses/${courseId}`, params);
  },

  // Get challenge analytics
  getChallengeAnalytics: async (challengeId: string, params?: AnalyticsParams): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>(`/analytics/challenges/${challengeId}`, params);
  },
};
