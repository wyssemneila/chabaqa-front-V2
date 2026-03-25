"use client"

import { useCommunityGuard } from "@/hooks/use-community-guard"
import { PageShell, PageState } from "@/components/creator-dashboard"

export default function MessageCampaignsPage() {
  const { guard } = useCommunityGuard()
  if (guard) return guard

  return (
    <PageShell>
      <PageState
        variant="coming-soon"
        title="SMS Campaigns"
        description="SMS messaging tools are being finalized. Email campaigns are fully available now."
      />
    </PageShell>
  )
}
