import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In",
  description: "Access your Chabaqa workspace and communities securely."
}

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
