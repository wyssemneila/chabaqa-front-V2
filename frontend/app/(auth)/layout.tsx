import type React from "react"
import type { Metadata } from "next"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/app/providers/auth-provider"
import { ExtensionErrorGuard } from "./components/extension-error-guard"
import { noIndexRobots } from "@/lib/seo-config"

export const metadata: Metadata = {
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
