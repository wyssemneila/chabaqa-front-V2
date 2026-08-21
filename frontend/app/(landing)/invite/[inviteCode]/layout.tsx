import type React from "react"
import type { Metadata } from "next"
import { noIndexRobots } from "@/lib/seo-config"

export const metadata: Metadata = {
  title: "Join a Community",
  robots: noIndexRobots,
}

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return children
}
