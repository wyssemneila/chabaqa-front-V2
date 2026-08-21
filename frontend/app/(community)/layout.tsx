import type React from "react"
import type { Metadata } from "next"
import dynamic from "next/dynamic"
import { AuthProvider } from "@/app/providers/auth-provider"
import { CommunityProvider } from "@/app/providers/community-context"
import { SocketProvider } from "@/lib/socket-context"
import { Toaster } from "@/components/ui/toaster"
import { ExtensionErrorGuard } from "@/app/(auth)/components/extension-error-guard"
import { noIndexRobots } from "@/lib/seo-config"

const LiveSupportWidget = dynamic(
  () => import("@/components/live-support/live-support-widget").then(mod => ({ default: mod.LiveSupportWidget })),
  { loading: () => null }
)

export const metadata: Metadata = {
  title: "Community Hub",
  description:
    "Learn, connect, and participate in the communities you belong to on Chabaqa.",
  robots: noIndexRobots,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <SocketProvider>
        <CommunityProvider>
          <ExtensionErrorGuard />
          {children}
          <LiveSupportWidget />
          <Toaster />
        </CommunityProvider>
      </SocketProvider>
    </AuthProvider>
  )
}
