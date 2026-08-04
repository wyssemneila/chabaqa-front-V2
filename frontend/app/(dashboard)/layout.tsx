import type { Metadata } from "next"
import { AuthProvider } from "@/app/providers/auth-provider"
import { LiveSupportWidget } from "@/components/live-support/live-support-widget"

export const metadata: Metadata = {
  title: {
    default: "Workspace",
    template: "%s | Chabaqa",
  },
  description: "Manage your Chabaqa account, communities, memberships, and creator activity from one secure workspace.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      {children}
      <LiveSupportWidget />
    </AuthProvider>
  )
}
