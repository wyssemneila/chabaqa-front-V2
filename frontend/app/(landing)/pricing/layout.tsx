import type React from "react"
import type { Metadata } from "next"
import {
  generateAlternateLanguages,
  generateKeywords,
  generateOGMetadata,
  generateRobotsMetadata,
  generateTwitterMetadata,
} from "@/lib/seo-config"

const title = "Pricing for Creator Communities"
const description =
  "Compare Chabaqa pricing plans for building, growing, and monetizing creator communities with courses, products, events, sessions, and analytics."

export const metadata: Metadata = {
  title,
  description,
  keywords: generateKeywords([
    "chabaqa pricing",
    "creator platform pricing",
    "community platform plans",
    "online course platform pricing",
  ]),
  alternates: generateAlternateLanguages("/pricing"),
  openGraph: generateOGMetadata(title, description, "/pricing"),
  twitter: generateTwitterMetadata(title, description),
  robots: generateRobotsMetadata(true, true),
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
