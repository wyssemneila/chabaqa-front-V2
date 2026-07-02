'use client'

import Link from 'next/link'
import { Bot, Database, Loader2, Plus, RefreshCw } from 'lucide-react'
import { CreatorAiPageShell } from '@/components/creator-dashboard/creator-ai-page-shell'
import { AgentCard } from '@/components/ai/agent-card'
import { useCreatorCommunity } from '@/app/(creator)/creator/context/creator-community-context'
import { useAiAgents } from '@/hooks/creator-dashboard/use-ai-agents'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function CreatorAiOverviewPage() {
  const { selectedCommunityId, selectedCommunity, isLoading: communityLoading } = useCreatorCommunity()
  const { agents, knowledgeStatus, loading, error, refresh, reindexKnowledge } = useAiAgents(selectedCommunityId)

  const activeAgents = agents.filter((agent) => agent.status === 'active').length
  const totalConversations = agents.reduce((sum, agent) => sum + Number(agent.stats?.conversations || 0), 0)

  return (
    <CreatorAiPageShell
      topbarTitle="Chabaqa AI"
      topbarSubtitle={selectedCommunity?.name || selectedCommunity?.nom || 'AI workspace'}
      title="AI workspace overview"
      description="Live AI staff and knowledge status for the selected community. All metrics below come from the production AI agents API."
    >
      {!selectedCommunityId && !communityLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>Select a community</CardTitle>
            <CardDescription>Choose a community before managing AI staff or knowledge sources.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void refresh()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button type="button" variant="outline" onClick={() => void reindexKnowledge()} disabled={!selectedCommunityId || loading}>
              <Database className="h-4 w-4 mr-2" />
              Reindex knowledge
            </Button>
            <Button asChild>
              <Link href="/creator/ai/staff/new">
                <Plus className="h-4 w-4 mr-2" />
                New AI staff member
              </Link>
            </Button>
          </div>

          {error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6 text-sm text-red-800">{error}</CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold">{loading ? '—' : activeAgents}</p>
                <p className="text-sm text-muted-foreground">Active agents</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold">{loading ? '—' : totalConversations}</p>
                <p className="text-sm text-muted-foreground">Total conversations</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold">{loading ? '—' : knowledgeStatus?.count ?? 0}</p>
                <p className="text-sm text-muted-foreground">Indexed knowledge items</p>
              </CardContent>
            </Card>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : agents.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  No AI staff yet
                </CardTitle>
                <CardDescription>Create your first community-scoped AI staff member to answer members with citations.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/creator/ai/staff/new">Create AI staff member</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {agents.map((agent) => (
                <AgentCard key={agent._id} agent={agent} />
              ))}
            </div>
          )}
        </div>
      )}
    </CreatorAiPageShell>
  )
}
