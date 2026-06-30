"use client"

import { useParams } from "next/navigation"
import { CommunityCustomizePage } from "@/components/creator-dashboard/community-customize/community-customize-page"

export default function Page() {
  const params = useParams<{ slug?: string }>()
  const slug = typeof params?.slug === "string" ? params.slug : ""

  return <CommunityCustomizePage slug={slug} />
}
