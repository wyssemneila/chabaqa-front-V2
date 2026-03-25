import { notFound } from "next/navigation"
import SessionsPageContent from '@/app/(community)/[creator]/[feature]/(loggedUser)/sessions/components/SessionsPageContent'
import { sessionsCommunityApi } from "@/lib/api/sessions-community.api"

export default async function SessionsPage({ 
  params 
}: { 
  params: Promise<{ feature: string }> 
}) {
  const { feature } = await params

  try {
    const data = await sessionsCommunityApi.getSessionsPageData(feature)
    
    if (!data.community) {
      notFound()
    }

    return (
      <SessionsPageContent 
        slug={feature} 
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