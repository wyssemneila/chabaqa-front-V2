import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Create a new password for your Chabaqa account.",
}

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
