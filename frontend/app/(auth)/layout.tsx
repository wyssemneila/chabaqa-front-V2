import type React from "react"
import type { Metadata } from "next"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/app/providers/auth-provider"
import { ExtensionErrorGuard } from "./components/extension-error-guard"

export const metadata: Metadata = {
  title: "Chabaqa - Turn your passion into buisness",
  description:
    "The ultimate platform for creators to build engaged communities, monetize their expertise, and scale their impact.",
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
