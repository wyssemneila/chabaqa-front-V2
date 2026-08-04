import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create Your Account",
  description: "Create your Chabaqa account and start building meaningful communities.",
}

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
