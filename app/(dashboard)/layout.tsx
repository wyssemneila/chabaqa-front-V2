import type { Metadata } from "next"
import { AuthProvider } from "@/app/providers/auth-provider"
import { LiveSupportWidget } from "@/components/live-support/live-support-widget"

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s | Chabaqa",
  },
  description: "Chabaqa dashboard for creators and members.",
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
