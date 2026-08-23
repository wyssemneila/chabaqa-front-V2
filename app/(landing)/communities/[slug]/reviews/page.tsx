import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { getCommunity } from '@/lib/community-data'
import ReviewsClient from './reviews-client'

interface Props { params: Promise<{ slug: string }> }

export default async function ReviewsPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()

  return (
    <ReviewsClient
      community={community}
      locale={locale}
    />
  )
}
