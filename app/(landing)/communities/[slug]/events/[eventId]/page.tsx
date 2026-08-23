import { notFound } from 'next/navigation'
import { getCommunity } from '@/lib/community-data'
import EventDetailClient from './event-detail-client'

interface Props { params: Promise<{ slug: string; eventId: string }> }

export default async function EventDetailPage({ params }: Props) {
  const { slug, eventId } = await params
  const community = getCommunity(slug)
  if (!community) notFound()
  const event = community.events.find((e) => e.id === eventId)
  if (!event) notFound()

  return <EventDetailClient slug={slug} event={event} communityName={community.name} communityCreator={community.creatorName} />
}
