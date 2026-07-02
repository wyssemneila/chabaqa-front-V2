'use client'

import { useCallback, useEffect, useState } from 'react'
import { aiAgentsApi, type AiAgent, type AiAgentPayload } from '@/lib/api/ai-agents.api'

export function useAiAgents(communityId: string | null) {
  const [agents, setAgents] = useState<AiAgent[]>([])
  const [knowledgeStatus, setKnowledgeStatus] = useState<{ count: number; status: string; updatedAt: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!communityId) {
      setAgents([])
      setKnowledgeStatus(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      const [nextAgents, nextKnowledge] = await Promise.all([
        aiAgentsApi.list(communityId),
        aiAgentsApi.getKnowledgeStatus(communityId).catch(() => null),
      ])
      setAgents(Array.isArray(nextAgents) ? nextAgents : [])
      setKnowledgeStatus(nextKnowledge)
    } catch (err: any) {
      setAgents([])
      setKnowledgeStatus(null)
      setError(err?.message || 'Unable to load AI staff')
    } finally {
      setLoading(false)
    }
  }, [communityId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const createAgent = useCallback(
    async (payload: AiAgentPayload) => {
      if (!communityId) throw new Error('Select a community first')
      const created = await aiAgentsApi.create(communityId, payload)
      await refresh()
      return created
    },
    [communityId, refresh],
  )

  const updateAgent = useCallback(
    async (agentId: string, payload: Partial<AiAgentPayload> & { status?: 'active' | 'paused' }) => {
      if (!communityId) throw new Error('Select a community first')
      const updated = await aiAgentsApi.update(communityId, agentId, payload)
      await refresh()
      return updated
    },
    [communityId, refresh],
  )

  const removeAgent = useCallback(
    async (agentId: string) => {
      if (!communityId) throw new Error('Select a community first')
      await aiAgentsApi.remove(communityId, agentId)
      await refresh()
    },
    [communityId, refresh],
  )

  const reindexKnowledge = useCallback(async () => {
    if (!communityId) throw new Error('Select a community first')
    const result = await aiAgentsApi.reindexKnowledge(communityId)
    await refresh()
    return result
  }, [communityId, refresh])

  return {
    agents,
    knowledgeStatus,
    loading,
    error,
    refresh,
    createAgent,
    updateAgent,
    removeAgent,
    reindexKnowledge,
  }
}
