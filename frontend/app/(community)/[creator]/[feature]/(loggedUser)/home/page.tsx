import CommunityHomeClient from "./community-home-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface CommunityHomePageProps {
  params: Promise<{ creator?: string; feature: string }>
}

export default async function CommunityHomePage({ params }: CommunityHomePageProps) {
  const resolvedParams = await params

  return <CommunityHomeClient params={resolvedParams} />
}
