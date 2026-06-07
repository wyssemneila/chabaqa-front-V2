import type { Metadata } from "next"
import { AuthProvider } from "@/app/providers/auth-provider"
import { LiveSupportWidget } from "@/components/live-support/live-support-widget"
import { getTranslations } from "next-intl/server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard")
  return {
    title: {
      default: t("metaTitle"),
      template: t("metaTemplate"),
    },
    description: t("metaDesc"),
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
