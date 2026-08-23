import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { getCommunity } from '@/lib/community-data'
import SessionsClient from './sessions-client'

interface Props { params: Promise<{ slug: string }> }

export default async function SessionsPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()

  return <SessionsClient slug={slug} sessions={community.sessions} communityName={community.name} locale={locale} />
}
