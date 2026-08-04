import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  
  // In a real app, you'd fetch the challenge data here
  // For now, we'll use generic metadata
  return {
    title: "Join This Challenge",
    description: "Join a focused Chabaqa challenge with guided milestones, practical resources, and a supportive community.",
    openGraph: {
      title: "Join This Challenge | Chabaqa",
      description: "Join a focused Chabaqa challenge with guided milestones, practical resources, and a supportive community.",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Join This Challenge | Chabaqa",
      description: "Join a focused Chabaqa challenge with guided milestones, practical resources, and a supportive community.",
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
