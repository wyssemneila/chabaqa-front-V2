import type React from "react"
import type { Metadata } from "next"
import dynamic from "next/dynamic"
import CreatorClientLayout from "@/app/(creator)/creator/creator-client-layout"
import { noIndexRobots } from "@/lib/seo-config"

export const metadata: Metadata = {
  title: "Creator Studio",
  description: "Manage your content, community, audience, analytics, and revenue from Chabaqa Creator Studio.",
  robots: noIndexRobots,
}

import { AuthProvider } from "@/app/providers/auth-provider"
import { CommunityProvider } from "@/app/providers/community-context"
import { CreatorCommunityProvider } from "@/app/(creator)/creator/context/creator-community-context"
import { SocketProvider } from "@/lib/socket-context"

const LiveSupportWidget = dynamic(
  () => import("@/components/live-support/live-support-widget").then(mod => ({ default: mod.LiveSupportWidget })),
  { loading: () => null }
)

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SocketProvider>
        <CommunityProvider>
          <CreatorCommunityProvider>
            <CreatorClientLayout>
              {children}
            </CreatorClientLayout>
            <LiveSupportWidget />
          </CreatorCommunityProvider>
        </CommunityProvider>
      </SocketProvider>
    </AuthProvider>
  )
}
