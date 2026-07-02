'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreatorAiPageShell } from '@/components/creator-dashboard/creator-ai-page-shell'
import { useCreatorCommunity } from '@/app/(creator)/creator/context/creator-community-context'
import { useAiAgents } from '@/hooks/creator-dashboard/use-ai-agents'
import type { AiAgentSurface, AiAgentTone, AiAgentType } from '@/lib/api/ai-agents.api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

const AGENT_TYPES: { value: AiAgentType; label: string }[] = [
  { value: 'concierge', label: 'Concierge' },
  { value: 'tutor', label: 'Tutor' },
  { value: 'challenge_coach', label: 'Challenge coach' },
  { value: 'support', label: 'Support' },
  { value: 'sales', label: 'Sales' },
]

const TONES: { value: AiAgentTone; label: string }[] = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'professional', label: 'Professional' },
  { value: 'direct', label: 'Direct' },
  { value: 'coach', label: 'Coach' },
]

const SURFACES: { value: AiAgentSurface; label: string }[] = [
  { value: 'community', label: 'Community' },
  { value: 'course', label: 'Course' },
  { value: 'challenge', label: 'Challenge' },
  { value: 'checkout', label: 'Checkout' },
  { value: 'support', label: 'Support' },
]

export default function NewAiStaffPage() {
  const router = useRouter()
  const { selectedCommunityId, isLoading: communityLoading } = useCreatorCommunity()
  const { createAgent } = useAiAgents(selectedCommunityId)
  const [type, setType] = useState<AiAgentType>('support')
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [tone, setTone] = useState<AiAgentTone>('friendly')
  const [surfaces, setSurfaces] = useState<AiAgentSurface[]>(['community'])
  const [saving, setSaving] = useState(false)

  const toggleSurface = (surface: AiAgentSurface) => {
    setSurfaces((prev) =>
      prev.includes(surface) ? prev.filter((item) => item !== surface) : [...prev, surface],
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedCommunityId || !name.trim()) return
    setSaving(true)
    try {
      const created = await createAgent({
        type,
        name: name.trim(),
        bio: bio.trim() || undefined,
        tone,
        enabledSurfaces: surfaces.length ? surfaces : ['community'],
        languages: ['en'],
      })
      toast.success('AI staff member created')
      router.push(`/creator/ai/staff/${created._id}`)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create AI staff member')
    } finally {
      setSaving(false)
    }
  }

  return (
    <CreatorAiPageShell
      topbarTitle="New AI Staff"
      title="Create AI staff member"
      description="Configure a community assistant with a role, tone, and enabled surfaces."
    >
      {!selectedCommunityId && !communityLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>Select a community</CardTitle>
            <CardDescription>Choose a community before creating AI staff.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Assistant blueprint</CardTitle>
            <CardDescription>These settings are saved through the live AI agents API.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="agent-type">Role</Label>
                <Select value={type} onValueChange={(value) => setType(value as AiAgentType)}>
                  <SelectTrigger id="agent-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENT_TYPES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-name">Name</Label>
                <Input id="agent-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Community Support Assistant" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-bio">Bio</Label>
                <Textarea id="agent-bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="What should this assistant help with?" rows={4} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-tone">Tone</Label>
                <Select value={tone} onValueChange={(value) => setTone(value as AiAgentTone)}>
                  <SelectTrigger id="agent-tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Enabled surfaces</Label>
                <div className="flex flex-wrap gap-2">
                  {SURFACES.map((surface) => {
                    const selected = surfaces.includes(surface.value)
                    return (
                      <Button
                        key={surface.value}
                        type="button"
                        size="sm"
                        variant={selected ? 'default' : 'outline'}
                        onClick={() => toggleSurface(surface.value)}
                      >
                        {surface.label}
                      </Button>
                    )
                  })}
                </div>
              </div>

              <Button type="submit" disabled={saving || !name.trim()}>
                {saving ? 'Creating…' : 'Create staff member'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </CreatorAiPageShell>
  )
}
