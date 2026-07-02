'use client'

import { useState } from 'react'
import { CreatorAiPageShell } from '@/components/creator-dashboard/creator-ai-page-shell'
import { useCreatorCommunity } from '@/app/(creator)/creator/context/creator-community-context'
import { aiCofounderApi } from '@/lib/api/ai-agents.api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

function ResultPanel({ title, data }: { title: string; data: unknown }) {
  if (data == null) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100 whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </pre>
      </CardContent>
    </Card>
  )
}

export default function AiCofounderPage() {
  const { selectedCommunityId, selectedCommunity, isLoading: communityLoading } = useCreatorCommunity()
  const [niche, setNiche] = useState('')
  const [audience, setAudience] = useState('')
  const [promise, setPromise] = useState('')
  const [price, setPrice] = useState('')
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [buildResult, setBuildResult] = useState<unknown>(null)
  const [growResult, setGrowResult] = useState<unknown>(null)
  const [funnelResult, setFunnelResult] = useState<unknown>(null)

  const runAction = async (key: string, action: () => Promise<unknown>) => {
    setLoadingAction(key)
    try {
      const result = await action()
      return result
    } catch (error: any) {
      toast.error(error?.message || 'AI cofounder request failed')
      return null
    } finally {
      setLoadingAction(null)
    }
  }

  const handleBuildCommunity = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!niche.trim() || !audience.trim() || !promise.trim()) return
    const result = await runAction('build', () =>
      aiCofounderApi.buildCommunity({
        niche: niche.trim(),
        audience: audience.trim(),
        promise: promise.trim(),
        price: price ? Number(price) : undefined,
        currency: 'TND',
      }),
    )
    if (result) {
      setBuildResult(result)
      toast.success('Community draft generated')
    }
  }

  const handleGrow = async () => {
    if (!selectedCommunityId) {
      toast.error('Select a community first')
      return
    }
    const result = await runAction('grow', () => aiCofounderApi.growCommunity(selectedCommunityId))
    if (result) {
      setGrowResult(result)
      toast.success('Growth recommendations generated')
    }
  }

  const handleFixFunnel = async () => {
    if (!selectedCommunityId) {
      toast.error('Select a community first')
      return
    }
    const result = await runAction('funnel', () => aiCofounderApi.fixFunnel(selectedCommunityId))
    if (result) {
      setFunnelResult(result)
      toast.success('Funnel recommendations generated')
    }
  }

  return (
    <CreatorAiPageShell
      topbarTitle="AI Cofounder"
      topbarSubtitle={selectedCommunity?.name || selectedCommunity?.nom || 'Community growth tools'}
      title="AI cofounder actions"
      description="Run live cofounder workflows against the production AI cofounder API. Results are shown exactly as returned by the backend."
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Build a new community draft</CardTitle>
            <CardDescription>Use this before you have a community selected to generate positioning and launch ideas.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleBuildCommunity}>
              <div className="space-y-2">
                <Label htmlFor="niche">Niche</Label>
                <Input id="niche" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="e.g. Product design for founders" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">Audience</Label>
                <Input id="audience" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Who is this for?" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promise">Promise</Label>
                <Textarea id="promise" value={promise} onChange={(e) => setPromise(e.target.value)} placeholder="What outcome do members get?" rows={4} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Optional price (TND)</Label>
                <Input id="price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
              <Button type="submit" disabled={loadingAction === 'build'}>
                {loadingAction === 'build' ? 'Generating…' : 'Generate community draft'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Improve an existing community</CardTitle>
            <CardDescription>
              {selectedCommunityId
                ? 'These actions use the currently selected community from the creator workspace.'
                : 'Select a community in the creator context to run growth and funnel fixes.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void handleGrow()} disabled={!selectedCommunityId || loadingAction === 'grow'}>
              {loadingAction === 'grow' ? 'Running…' : 'Grow community'}
            </Button>
            <Button type="button" variant="outline" onClick={() => void handleFixFunnel()} disabled={!selectedCommunityId || loadingAction === 'funnel'}>
              {loadingAction === 'funnel' ? 'Running…' : 'Fix funnel'}
            </Button>
          </CardContent>
        </Card>

        <ResultPanel title="Build community result" data={buildResult} />
        <ResultPanel title="Grow community result" data={growResult} />
        <ResultPanel title="Fix funnel result" data={funnelResult} />

        {!selectedCommunityId && !communityLoading ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Community-specific cofounder actions are disabled until a community is selected.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </CreatorAiPageShell>
  )
}
