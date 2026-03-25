import type React from "react"
import type { Metadata } from "next"
import CreatorClientLayout from "@/app/(creator)/creator/creator-client-layout"

export const metadata: Metadata = {
  title: "Chabaqa - Creator Dashboard",
  description: "Manage your creator content, analytics, and community",
  generator: "v0.dev",
}

import { AuthProvider } from "@/app/providers/auth-provider"
import { CommunityProvider } from "@/app/providers/community-context"
import { LiveSupportWidget } from "@/components/live-support/live-support-widget"

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
