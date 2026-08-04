import type React from "react"
import type { Metadata } from "next"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/app/providers/auth-provider"
import { ExtensionErrorGuard } from "./components/extension-error-guard"
import { noIndexRobots } from "@/lib/seo-config"

export const metadata: Metadata = {
  title: "Account Access",
  description:
    "Sign in or create a Chabaqa account to build, manage, and grow your community.",
  robots: noIndexRobots,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AuthProvider>
        <ExtensionErrorGuard />
        {children}
      </AuthProvider>
      <Toaster />
    </>
  )
}
