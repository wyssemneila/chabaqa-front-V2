import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Recover Your Password",
  description: "Securely recover access to your Chabaqa account.",
}

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
