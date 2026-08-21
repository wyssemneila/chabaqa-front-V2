import { Suspense } from "react"
import { notFound } from "next/navigation"
import ChallengesPageContent from '@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/components/challenges-page-content'
import { challengesCommunityApi } from "@/lib/api/challenges-community.api"

function ChallengesListSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border p-4">
            <div className="h-36 animate-pulse rounded-lg bg-muted" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}

async function ChallengesContent({
  creatorSlug,
  slug,
}: {
  creatorSlug: string
  slug: string
}) {
  try {
    const data = await challengesCommunityApi.getChallengesPageData(slug)
    
    if (!data.community) {
      notFound()
    }

    return (
      <ChallengesPageContent 
        creatorSlug={creatorSlug} 
        slug={slug} 
        community={data.community} 
        allChallenges={data.challenges} 
      />
    )
  } catch (error) {
    console.error('Error loading challenges page:', error)
    notFound()
  }
}

export default async function ChallengesPage({ 
  params 
}: { 
  params: Promise<{ creator: string; feature: string }> 
}) {
  const { creator, feature } = await params
  
  return (
    <Suspense fallback={<ChallengesListSkeleton />}>
      <ChallengesContent creatorSlug={creator} slug={feature} />
    </Suspense>
  )
}