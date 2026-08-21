"use client"

import { useParams } from "next/navigation"
import { CommunitySettingsPage } from "@/components/creator-dashboard/community-settings/community-settings-page"

export default function Page() {
  const params = useParams<{ slug?: string }>()
  const slug = typeof params?.slug === "string" ? params.slug : ""

  return <CommunitySettingsPage slug={slug} />
}
