'use client'

import Link from 'next/link'
import { Loader2, Plus } from 'lucide-react'
import { CreatorAiPageShell } from '@/components/creator-dashboard/creator-ai-page-shell'
import { AgentCard } from '@/components/ai/agent-card'
import { useCreatorCommunity } from '@/app/(creator)/creator/context/creator-community-context'
import { useAiAgents } from '@/hooks/creator-dashboard/use-ai-agents'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AiStaffPage() {
  const { selectedCommunityId, isLoading: communityLoading } = useCreatorCommunity()
  const { agents, loading, error } = useAiAgents(selectedCommunityId)

  return (
    <CreatorAiPageShell
      topbarTitle="AI Staff"
      title="AI staff members"
      description="Community-scoped assistants loaded from the live AI agents API."
    >
      {!selectedCommunityId && !communityLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>Select a community</CardTitle>
            <CardDescription>AI staff are configured per community.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button asChild>
              <Link href="/creator/ai/staff/new">
                <Plus className="h-4 w-4 mr-2" />
                New staff member
              </Link>
            </Button>
          </div>

          {error ? <Card><CardContent className="pt-6 text-sm text-red-700">{error}</CardContent></Card> : null}

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : agents.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No staff members yet</CardTitle>
                <CardDescription>Create an AI staff member for support, tutoring, sales, or community concierge tasks.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/creator/ai/staff/new">Create staff member</Link>
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
