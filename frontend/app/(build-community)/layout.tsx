import type React from "react"
import type { Metadata } from "next"
import dynamic from "next/dynamic"
import { AuthProvider } from "../providers/auth-provider"
import { noIndexRobots } from "@/lib/seo-config"

const LiveSupportWidget = dynamic(
  () => import("@/components/live-support/live-support-widget").then(mod => ({ default: mod.LiveSupportWidget })),
  { loading: () => null }
)

export const metadata: Metadata = {
  title: "Create Your Community",
  description: "Launch a polished, branded community with Chabaqa's guided setup experience.",
  keywords: ["community", "build", "create", "social", "platform"],
  robots: noIndexRobots,
}

export default function BuildCommunityLayout({
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
