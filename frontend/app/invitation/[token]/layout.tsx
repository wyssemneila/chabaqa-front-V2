import type React from "react"
import type { Metadata } from "next"
import { noIndexRobots } from "@/lib/seo-config"

export const metadata: Metadata = {
  title: "Invitation | Chabaqa",
  robots: noIndexRobots,
}

export default function InvitationLayout({ children }: { children: React.ReactNode }) {
  return children
}
