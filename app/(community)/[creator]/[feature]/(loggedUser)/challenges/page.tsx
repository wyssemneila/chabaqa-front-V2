import { notFound } from "next/navigation"
import ChallengesPageContent from '@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/components/challenges-page-content'
import { challengesCommunityApi } from "@/lib/api/challenges-community.api"

export default async function ChallengesPage({ 
  params 
}: { 
  params: Promise<{ creator: string; feature: string }> 
}) {
  const { creator, feature } = await params
  
  try {
    const data = await challengesCommunityApi.getChallengesPageData(feature)
    
    if (!data.community) {
      notFound()
    }

    return (
      <ChallengesPageContent 
        creatorSlug={creator} 
        slug={feature} 
        community={data.community} 
        allChallenges={data.challenges} 
      />
    )
  } catch (error) {
    console.error('Error loading challenges page:', error)
    notFound()
  }
}