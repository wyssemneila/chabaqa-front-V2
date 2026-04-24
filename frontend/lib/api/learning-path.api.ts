import { apiClient } from './client'
import type { LearningPathResponse } from './types'

export const learningPathApi = {
  getRecommendations: async (params: {
    goals: string
    limit?: number
    communityId?: string
  }): Promise<LearningPathResponse> => {
    const response = await apiClient.post('/learning-path/recommendations', params)
    const payload: any = (response as any)?.data ?? response
    if (payload?.data && Array.isArray(payload.data.items)) return payload.data
    return payload
  },
}
