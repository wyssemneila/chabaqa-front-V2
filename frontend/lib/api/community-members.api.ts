import { apiClient, ApiSuccessResponse } from './client'

export interface CommunityMentionMember {
  id: string
  username: string
  firstName: string
  lastName?: string
  avatar?: string
}

export const communityMembersApi = {
  searchMembersForMention: async (
    communityId: string,
    q: string,
    limit: number = 8,
  ): Promise<CommunityMentionMember[]> => {
    const response = await apiClient.get<ApiSuccessResponse<CommunityMentionMember[]>>(
      `/communities/${communityId}/members/search`,
      { q, limit },
    )
    return response?.data || []
  },
}
