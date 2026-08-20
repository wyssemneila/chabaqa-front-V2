import type React from "react"
import type { Metadata } from "next"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/app/providers/auth-provider"
import { ExtensionErrorGuard } from "./components/extension-error-guard"
import { getTranslations } from "next-intl/server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common")
  return {
    title: {
      default: t("brand"),
      template: `%s | ${t("brand")}`,
    },
    description: "Build and monetize your community with courses, sessions, events, and more on Chabaqa.",
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div>
        <AuthProvider>
          <ExtensionErrorGuard />
          {children}
        </AuthProvider>
        <Toaster />
      </div>
    </>
  )
}
