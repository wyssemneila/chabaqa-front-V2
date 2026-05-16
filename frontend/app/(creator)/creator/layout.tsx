import type React from "react"
import type { Metadata } from "next"
import dynamic from "next/dynamic"
import CreatorClientLayout from "@/app/(creator)/creator/creator-client-layout"
import { noIndexRobots } from "@/lib/seo-config"

export const metadata: Metadata = {
  title: "Chabaqa - Creator Dashboard",
  description: "Manage your creator content, analytics, and community",
  robots: noIndexRobots,
}

import { AuthProvider } from "@/app/providers/auth-provider"
import { CommunityProvider } from "@/app/providers/community-context"

const LiveSupportWidget = dynamic(
  () => import("@/components/live-support/live-support-widget").then(mod => ({ default: mod.LiveSupportWidget })),
  { loading: () => null }
)

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CommunityProvider>
        <CreatorClientLayout>
          {children}
        </CreatorClientLayout>
        <LiveSupportWidget />
      </CommunityProvider>
    </AuthProvider>
  )
}
