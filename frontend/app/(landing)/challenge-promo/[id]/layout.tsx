import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  
  // In a real app, you'd fetch the challenge data here
  // For now, we'll use generic metadata
  return {
    title: "Join Challenge - Chabaqa",
    description: "Transform your life with this amazing challenge. Join thousands of participants achieving their goals.",
    openGraph: {
      title: "Join Challenge - Chabaqa",
      description: "Transform your life with this amazing challenge. Join thousands of participants achieving their goals.",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Join Challenge - Chabaqa",
      description: "Transform your life with this amazing challenge. Join thousands of participants achieving their goals.",
    },
  }
}

export default function ChallengePromoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
