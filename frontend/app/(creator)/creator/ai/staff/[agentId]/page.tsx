'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Trash2 } from 'lucide-react'
import { CreatorAiPageShell } from '@/components/creator-dashboard/creator-ai-page-shell'
import { useCreatorCommunity } from '@/app/(creator)/creator/context/creator-community-context'
import { useAiAgents } from '@/hooks/creator-dashboard/use-ai-agents'
import { aiAgentsApi, type AiAgentTone } from '@/lib/api/ai-agents.api'
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

const TONES: { value: AiAgentTone; label: string }[] = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'professional', label: 'Professional' },
  { value: 'direct', label: 'Direct' },
  { value: 'coach', label: 'Coach' },
]

export default function AiStaffDetailPage() {
  const router = useRouter()
  const params = useParams<{ agentId?: string }>()
  const agentId = typeof params?.agentId === 'string' ? params.agentId : ''
  const { selectedCommunityId, isLoading: communityLoading } = useCreatorCommunity()
  const { agents, loading, updateAgent, removeAgent } = useAiAgents(selectedCommunityId)

  const agent = useMemo(() => agents.find((item) => item._id === agentId) || null, [agents, agentId])

  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [tone, setTone] = useState<AiAgentTone>('friendly')
  const [status, setStatus] = useState<'active' | 'paused'>('active')
  const [chatMessage, setChatMessage] = useState('')
  const [chatAnswer, setChatAnswer] = useState('')
  const [chatting, setChatting] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!agent) return
    setName(agent.name)
    setBio(agent.bio || '')
    setTone(agent.tone)
    setStatus(agent.status)
  }, [agent])

  const handleSave = async () => {
    if (!agentId) return
    setSaving(true)
    try {
      await updateAgent(agentId, {
        name: name.trim(),
        bio: bio.trim() || undefined,
        tone,
        status,
      })
      toast.success('AI staff member updated')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update AI staff member')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!agentId) return
    setSaving(true)
    try {
      await removeAgent(agentId)
      toast.success('AI staff member removed')
      router.push('/creator/ai/staff')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to remove AI staff member')
    } finally {
      setSaving(false)
    }
  }

  const handleTestChat = async () => {
    if (!selectedCommunityId || !agentId || !chatMessage.trim()) return
    setChatting(true)
    setChatAnswer('')
    try {
      const result = await aiAgentsApi.chat(selectedCommunityId, agentId, chatMessage.trim())
      setChatAnswer(result.answer)
    } catch (error: any) {
      toast.error(error?.message || 'Test chat failed')
    } finally {
      setChatting(false)
    }
  }

  return (
    <CreatorAiPageShell
      topbarTitle="Configure AI Staff"
      title={agent?.name || 'AI staff member'}
      description="Edit assistant settings or run a test chat against the live AI agents endpoint."
    >
      {!selectedCommunityId && !communityLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>Select a community</CardTitle>
            <CardDescription>Choose a community before configuring AI staff.</CardDescription>
          </CardHeader>
        </Card>
      ) : loading && !agent ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !agent ? (
        <Card>
          <CardHeader>
            <CardTitle>Staff member not found</CardTitle>
            <CardDescription>This agent is not available for the selected community.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/creator/ai/staff">Back to AI staff</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle>Assistant settings</CardTitle>
              <CardDescription>
                {agent.stats?.conversations || 0} conversations · last active{' '}
                {agent.stats?.lastActiveAt ? new Date(agent.stats.lastActiveAt).toLocaleString() : 'not yet'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-bio">Bio</Label>
                <Textarea id="edit-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-tone">Tone</Label>
                  <Select value={tone} onValueChange={(value) => setTone(value as AiAgentTone)}>
                    <SelectTrigger id="edit-tone">
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
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={status} onValueChange={(value) => setStatus(value as 'active' | 'paused')}>
                    <SelectTrigger id="edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => void handleSave()} disabled={saving}>
                  Save changes
                </Button>
                <Button type="button" variant="destructive" onClick={() => void handleDelete()} disabled={saving}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test chat</CardTitle>
              <CardDescription>Send a message to this agent using the production chat endpoint.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask the assistant something members would ask…"
                rows={4}
              />
              <Button type="button" onClick={() => void handleTestChat()} disabled={chatting || !chatMessage.trim()}>
                {chatting ? 'Sending…' : 'Send test message'}
              </Button>
              {chatAnswer ? (
                <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-wrap">
                  {chatAnswer}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
    </CreatorAiPageShell>
  )
}
