import { Suspense } from "react"
import { notFound } from "next/navigation"
import SessionsPageContent from '@/app/(community)/[creator]/[feature]/(loggedUser)/sessions/components/SessionsPageContent'
import { sessionsCommunityApi } from "@/lib/api/sessions-community.api"

function SessionsListSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
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

async function SessionsContent({ slug }: { slug: string }) {
  try {
    const data = await sessionsCommunityApi.getSessionsPageData(slug)
    
    if (!data.community) {
      notFound()
    }

    return (
      <SessionsPageContent 
        slug={slug} 
        community={data.community}
        sessions={data.sessions}
        userBookings={data.userBookings}
      />
    )
  } catch (error) {
    console.error('Error loading sessions page:', error)
    notFound()
  }
}

export default async function SessionsPage({ 
  params 
}: { 
  params: Promise<{ feature: string }> 
}) {
  const { feature } = await params

  return (
    <Suspense fallback={<SessionsListSkeleton />}>
      <SessionsContent slug={feature} />
    </Suspense>
  )
}