import type React from "react"
import type { Metadata } from "next"
import dynamic from "next/dynamic"
import { AuthProvider } from "../providers/auth-provider"
import { generateAlternateLanguages } from "@/lib/seo-config"

const LiveSupportWidget = dynamic(
  () => import("@/components/live-support/live-support-widget").then(mod => ({ default: mod.LiveSupportWidget })),
  { loading: () => null }
)

export const metadata: Metadata = {
  title: "The Creator Community Platform",
  description:
    "Build, engage, and monetize your community with courses, memberships, events, coaching, challenges, and digital products.",
  alternates: generateAlternateLanguages(""),
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
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
