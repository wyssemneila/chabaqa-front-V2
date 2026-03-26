import type React from "react"
import type { Metadata } from "next"
import { AuthProvider } from "@/app/providers/auth-provider"
import { CommunityProvider } from "@/app/providers/community-context"
import { SocketProvider } from "@/app/providers/socket-provider"
import { Toaster } from "@/components/ui/toaster"
import { LiveSupportWidget } from "@/components/live-support/live-support-widget"
import { ExtensionErrorGuard } from "@/app/(auth)/components/extension-error-guard"

export const metadata: Metadata = {
  title: "Chabaqa - Turn your passion into buisness",
  description:
    "The ultimate platform for creators to build engaged communities, monetize their expertise, and scale their impact.",
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
