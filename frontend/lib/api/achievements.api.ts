import { apiClient } from './client';
import type { AchievementResponse, UserAchievementResponse, AchievementWithProgress } from './types';

export interface GetAchievementsParams {
  communitySlug?: string;
}

export interface GetUserAchievementsParams {
  communitySlug: string;
}

export const achievementsApi = {
  /**
   * Get all achievements for a community
   */
  async getAchievements(params?: GetAchievementsParams): Promise<AchievementResponse[]> {
    const res = await apiClient.get<{ success: boolean; message?: string; data: AchievementResponse[] }>('/achievements', params);
    return res.data;
  },

  /**
   * Get user's achievements with progress for a community
   */
  async getUserAchievements(params: GetUserAchievementsParams): Promise<AchievementWithProgress[]> {
    const res = await apiClient.get<{ success: boolean; message?: string; data: AchievementWithProgress[] }>('/achievements/user', params);
    return res.data;
  },

  /**
   * Manually check for new achievements
   */
  async checkAchievements(params: GetUserAchievementsParams): Promise<UserAchievementResponse[]> {
    const res = await apiClient.post<{ success: boolean; message?: string; data: UserAchievementResponse[] }>('/achievements/check', params);
    return res.data;
  },
};