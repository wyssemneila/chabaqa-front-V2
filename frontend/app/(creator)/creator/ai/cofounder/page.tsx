'use client'

import { useState } from 'react'
import { CreatorAiPageShell } from '@/components/creator-dashboard/creator-ai-page-shell'
import { useCreatorCommunity } from '@/app/(creator)/creator/context/creator-community-context'
import { aiCofounderApi } from '@/lib/api/ai-agents.api'
import {
  IOSCard,
  IOSCardContent,
  IOSCardDescription,
  IOSCardHeader,
  IOSCardTitle,
  IOSInput,
  IOSLabel,
  IOSTextarea,
  IOSButton,
  IOSText,
  IOSBadge,
} from '@/components/ui/ios'
import { toast } from 'sonner'
import {
  CofounderBuildResult,
  CofounderFixFunnelResult,
  CofounderGrowResult,
  CofounderRawResult,
} from '@/components/ai/cofounder-result-cards'

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
      description="Run cofounder workflows to draft a community, grow an existing one, or fix your funnel. Results are parsed into reviewable cards — copy any block to use it elsewhere."
    >
      <div className="space-y-6">
        <IOSCard>
          <IOSCardHeader>
            <IOSCardTitle className="text-[22px]">Build a new community draft</IOSCardTitle>
            <IOSCardDescription>
              Use this before you have a community selected to generate positioning and launch ideas.
            </IOSCardDescription>
          </IOSCardHeader>
          <IOSCardContent>
            <form className="space-y-4" onSubmit={handleBuildCommunity}>
              <div>
                <IOSLabel htmlFor="niche">Niche</IOSLabel>
                <IOSInput
                  id="niche"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g. Product design for founders"
                  required
                  clearable
                  onClear={() => setNiche('')}
                />
              </div>
              <div>
                <IOSLabel htmlFor="audience">Audience</IOSLabel>
                <IOSInput
                  id="audience"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="Who is this for?"
                  required
                  clearable
                  onClear={() => setAudience('')}
                />
              </div>
              <div>
                <IOSLabel htmlFor="promise">Promise</IOSLabel>
                <IOSTextarea
                  id="promise"
                  value={promise}
                  onChange={(e) => setPromise(e.target.value)}
                  placeholder="What outcome do members get?"
                  rows={4}
                  required
                />
              </div>
              <div>
                <IOSLabel htmlFor="price">Optional price (TND)</IOSLabel>
                <IOSInput
                  id="price"
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <IOSButton type="submit" disabled={loadingAction === 'build'}>
                {loadingAction === 'build' ? 'Generating…' : 'Generate community draft'}
              </IOSButton>
            </form>
          </IOSCardContent>
        </IOSCard>

        <IOSCard>
          <IOSCardHeader>
            <IOSCardTitle className="text-[22px]">Improve an existing community</IOSCardTitle>
            <IOSCardDescription>
              {selectedCommunityId
                ? 'These actions use the currently selected community from the creator workspace.'
                : 'Select a community in the creator context to run growth and funnel fixes.'}
            </IOSCardDescription>
          </IOSCardHeader>
          <IOSCardContent className="flex flex-wrap gap-2">
            <IOSButton
              type="button"
              onClick={() => void handleGrow()}
              disabled={!selectedCommunityId || loadingAction === 'grow'}
            >
              {loadingAction === 'grow' ? 'Running…' : 'Grow community'}
            </IOSButton>
            <IOSButton
              type="button"
              variant="outline"
              onClick={() => void handleFixFunnel()}
              disabled={!selectedCommunityId || loadingAction === 'funnel'}
            >
              {loadingAction === 'funnel' ? 'Running…' : 'Fix funnel'}
            </IOSButton>
          </IOSCardContent>
        </IOSCard>

        {buildResult != null ? (
          <section className="space-y-3">
            <IOSText size="title3" weight="semibold">Build community result</IOSText>
            <CofounderBuildResult data={buildResult} />
            <CofounderRawResult data={buildResult} label="Developer view (raw JSON)" />
          </section>
        ) : null}
        {growResult != null ? (
          <section className="space-y-3">
            <IOSText size="title3" weight="semibold">Grow community result</IOSText>
            <CofounderGrowResult data={growResult} />
            <CofounderRawResult data={growResult} label="Developer view (raw JSON)" />
          </section>
        ) : null}
        {funnelResult != null ? (
          <section className="space-y-3">
            <IOSText size="title3" weight="semibold">Fix funnel result</IOSText>
            <CofounderFixFunnelResult data={funnelResult} />
            <CofounderRawResult data={funnelResult} label="Developer view (raw JSON)" />
          </section>
        ) : null}

        {!selectedCommunityId && !communityLoading ? (
          <IOSCard>
            <IOSCardContent className="pt-6">
              <div className="flex items-center gap-2">
                <IOSBadge variant="outline" size="md">Community required</IOSBadge>
              </div>
              <IOSText size="footnote" color="secondary" className="mt-2 block">
                Community-specific cofounder actions are disabled until a community is selected.
              </IOSText>
            </IOSCardContent>
          </IOSCard>
        ) : null}
      </div>
    </CreatorAiPageShell>
  )
}
