import { Suspense } from "react"
import { notFound } from "next/navigation"
import EventsPageContent from "@/app/(community)/[creator]/[feature]/(loggedUser)/events/components/events-page-content"
import { eventsCommunityApi } from "@/lib/api/events-community.api"

function EventsListSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border p-4">
            <div className="h-36 animate-pulse rounded-lg bg-muted" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}

async function EventsContent({
  slug,
  initialEventId,
}: {
  slug: string
  initialEventId?: string
}) {
  try {
    const data = await eventsCommunityApi.getEventsPageData(slug)
    
    if (!data.community) {
      notFound()
    }

    return (
      <EventsPageContent 
        availableEvents={data.events}
        myTickets={data.userRegistrations}
        communitySlug={slug}
        initialEventId={initialEventId}
      />
    )
  } catch (error) {
    console.error('Error loading events page:', error)
    notFound()
  }
}

export default async function EventsPage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ feature: string }>
  searchParams: Promise<{ eventId?: string }>
}) {
  const { feature } = await params
  const { eventId } = await searchParams
  
  return (
    <Suspense fallback={<EventsListSkeleton />}>
      <EventsContent
        slug={feature}
        initialEventId={typeof eventId === "string" ? eventId : undefined}
      />
    </Suspense>
  )
}
