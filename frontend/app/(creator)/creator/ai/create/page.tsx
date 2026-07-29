'use client'

import { CreatorAiPageShell } from '@/components/creator-dashboard/creator-ai-page-shell'
import { CreateWithAiForm } from '@/components/ai/create-with-ai-form'
import { useCreatorCommunity } from '@/app/(creator)/creator/context/creator-community-context'

export default function AiCreatePage() {
  const { selectedCommunity } = useCreatorCommunity()
  return (
    <CreatorAiPageShell
      topbarTitle="Create with AI"
      topbarSubtitle={selectedCommunity?.name || selectedCommunity?.nom || 'Draft in seconds, review before publish'}
      title="Create with AI"
      description="Describe what you want to build and the AI Cofounder drafts a reviewable version — content, landing copy, launch campaign, and a checklist. Nothing publishes without your approval."
    >
      <CreateWithAiForm />
    </CreatorAiPageShell>
  )
}
