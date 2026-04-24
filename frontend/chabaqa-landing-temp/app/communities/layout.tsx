import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Communities - Chabaqa",
  description:
    "Discover amazing communities on Chabaqa. Join thousands of creators and learners in communities that match your interests and goals.",
}

export default function CommunitiesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
