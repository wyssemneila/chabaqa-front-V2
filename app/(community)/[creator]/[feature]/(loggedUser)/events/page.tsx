import { notFound } from "next/navigation"
import EventsPageContent from "@/app/(community)/[creator]/[feature]/(loggedUser)/events/components/events-page-content"
import { eventsCommunityApi } from "@/lib/api/events/events-community.api"

export default async function EventsPage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ feature: string }>
  searchParams: Promise<{ eventId?: string }>
}) {
  const { feature } = await params
  const { eventId } = await searchParams
  
  try {
    const data = await eventsCommunityApi.getEventsPageData(feature)
    
    if (!data.community) {
      notFound()
    }

  return (
    <EventsPageContent 
        availableEvents={data.events}
        myTickets={data.userRegistrations}
        communitySlug={feature}
        initialEventId={typeof eventId === "string" ? eventId : undefined}
    />
    )
  } catch (error) {
    console.error('Error loading events page:', error)
    notFound()
  }
}
