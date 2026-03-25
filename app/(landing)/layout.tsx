import type React from "react"
import type { Metadata } from "next"
import { AuthProvider } from "../providers/auth-provider"
import { LiveSupportWidget } from "@/components/live-support/live-support-widget"
import { generateAlternateLanguages } from "@/lib/seo-config"

export const metadata: Metadata = {
  title: "Chabaqa - Turn your passion into business",
  description:
    "Build and monetize your community with courses, sessions, events, challenges, and digital products on Chabaqa.",
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
