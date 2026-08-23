import { notFound } from 'next/navigation'
import { getCommunity } from '@/lib/community-data'
import SessionDetailClient from './session-detail-client'

interface Props { params: Promise<{ slug: string; sessionId: string }> }

export default async function SessionDetailPage({ params }: Props) {
  const { slug, sessionId } = await params
  const community = getCommunity(slug)
  if (!community) notFound()
  const session = community.sessions.find((s) => s.id === sessionId)
  if (!session) notFound()

  return <SessionDetailClient slug={slug} session={session} communityName={community.name} />
}
