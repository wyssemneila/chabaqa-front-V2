"use client"

import React from "react"
import { useCommunityGuard } from "@/hooks/use-community-guard"
import { PageShell, PageState } from "@/components/creator-dashboard"

export default function WhatsAppCampaignsPage() {
  const { guard } = useCommunityGuard()
  if (guard) return guard

  return (
    <PageShell>
      <PageState
        variant="coming-soon"
        title="WhatsApp Campaigns"
        description="WhatsApp automation is being finalized. Email campaigns are fully available now."
      />
    </PageShell>
  )
}
