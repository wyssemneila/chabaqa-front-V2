import type React from "react"
import type { Metadata } from "next"
import { noIndexRobots } from "@/lib/seo-config"

export const metadata: Metadata = {
  title: "Mock Checkout | Chabaqa",
  robots: noIndexRobots,
}

export default function KonnectMockCheckoutLayout({ children }: { children: React.ReactNode }) {
  return children
}
