import type { Metadata, Viewport } from "next"
import { CommunityHeader } from "@/app/(community)/components/community-header"
import { noIndexRobots } from "@/lib/seo-config"

export const metadata: Metadata = {
  title: {
    default: "Community",
    template: "%s | Chabaqa"
  },
  description: "A full-featured creator platform for building and managing communities",
  keywords: ["creator platform", "community", "business", "passion"],
  authors: [{ name: "Chabaqa" }],
  creator: "Chabaqa",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Chabaqa - Community Platform for Creators",
    description: "A full-featured creator platform for building and managing communities",
    siteName: "Chabaqa"
  },
  twitter: {
    card: "summary_large_image",
    title: "Chabaqa - Community Platform for Creators",
    description: "A full-featured creator platform for building and managing communities"
  },
  robots: noIndexRobots,
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
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

  return (
    <>
      <CommunityHeader currentCommunity={feature} creatorSlug={creator} />
      <main className="min-h-screen community-mobile-main">{children}</main>
    </>
  )
}
