import { apiClient } from './client'
import type { Resource } from './types'

export const resourcesApi = {
  getById: async (id: string): Promise<Resource> => {
    const response = await apiClient.get(`/resources/${encodeURIComponent(id)}`)
    const payload: any = (response as any)?.data ?? response
    if (payload?.data) return payload.data as Resource
    return payload as Resource
  },
}
