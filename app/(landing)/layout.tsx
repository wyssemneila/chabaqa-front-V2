import type React from "react"
import type { Metadata } from "next"
import { AuthProvider } from "../providers/auth-provider"
import { LiveSupportWidget } from "@/components/live-support/live-support-widget"
import { generateAlternateLanguages } from "@/lib/seo-config"
import { getTranslations } from "next-intl/server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing")
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: generateAlternateLanguages(""),
    icons: {
      icon: "/favicon.ico",
      apple: "/favicon.ico",
      shortcut: "/favicon.ico",
    },
  }
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
