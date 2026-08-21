import { apiClient } from './client'
import type { Resource } from './types'

export const resourcesApi = {
  getById: async (id: string): Promise<Resource> => {
    const response = await apiClient.get<unknown>(`/resources/${encodeURIComponent(id)}`)
    const root = response && typeof response === 'object' ? response as Record<string, unknown> : {}
    const payload = root.data ?? response
    const payloadRecord = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {}
    if (payloadRecord.data) return payloadRecord.data as Resource
    return payload as Resource
  },
}
