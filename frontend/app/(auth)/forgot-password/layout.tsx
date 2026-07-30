import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your Chabaqa account password securely.",
}

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
