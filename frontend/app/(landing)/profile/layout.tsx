import type React from "react"
import type { Metadata } from "next"
import { noIndexRobots } from "@/lib/seo-config"

export const metadata: Metadata = {
  title: "Your Profile",
  robots: noIndexRobots,
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children
}
