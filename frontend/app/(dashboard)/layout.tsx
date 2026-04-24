import type { Metadata } from "next"
import dynamic from "next/dynamic"
import { AuthProvider } from "@/app/providers/auth-provider"

const LiveSupportWidget = dynamic(
  () => import("@/components/live-support/live-support-widget").then(mod => ({ default: mod.LiveSupportWidget })),
  { loading: () => null }
)

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
