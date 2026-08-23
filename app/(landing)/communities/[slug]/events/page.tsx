import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { getCommunity } from '@/lib/community-data'
import EventsClient from './events-client'

interface Props { params: Promise<{ slug: string }> }

export default async function EventsPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()

  return <EventsClient slug={slug} events={community.events} communityName={community.name} locale={locale} />
}
