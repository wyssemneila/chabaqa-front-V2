import type { Metadata, Viewport } from "next"
import { CommunityHeader } from "@/app/(community)/components/community-header"
import { noIndexRobots } from "@/lib/seo-config"

export const metadata: Metadata = {
  title: {
    default: "Community Hub",
    template: "%s | Chabaqa"
  },
  description: "Your member space for learning, conversations, events, and community progress.",
  keywords: ["creator platform", "community", "business", "passion"],
  authors: [{ name: "Chabaqa" }],
  creator: "Chabaqa",
  openGraph: {
    type: "website",
    locale: "TN-216",
    title: "Community Hub | Chabaqa",
    description: "Your member space for learning, conversations, events, and community progress.",
    siteName: "Chabaqa"
  },
  twitter: {
    card: "summary_large_image",
    title: "Community Hub | Chabaqa",
    description: "Your member space for learning, conversations, events, and community progress."
  },
  robots: noIndexRobots,
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7fe" },
    { media: "(prefers-color-scheme: dark)", color: "#12111a" },
  ],
  viewportFit: "cover",
}

interface CreatorLayoutProps {
  children: React.ReactNode
  params: Promise<{ creator: string; feature: string }>
}

export default async function CreatorLayout({
  children,
  params
}: CreatorLayoutProps) {
  const { creator, feature } = await params

  // `/creator/dashboard` is an application dashboard route, not a community
  // route. Without this guard, the dynamic `[creator]/[feature]` match treats
  // `dashboard` as a community slug and issues requests for a nonexistent
  // community named `creator`.
  if (creator === "creator" && feature === "dashboard") {
    return <main className="min-h-screen">{children}</main>
  }

  return (
    <div className="community-theme min-h-screen bg-[var(--bg)] text-[var(--t1)]">
      <CommunityHeader currentCommunity={feature} creatorSlug={creator} />
      <main className="min-h-screen community-mobile-main">{children}</main>
    </div>
  )
}
