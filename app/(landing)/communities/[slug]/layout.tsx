import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { Header } from '@/components/header'
import { getCommunity } from '@/lib/community-data'
import { CommunityLayoutClient } from './community-layout-client'

interface Props {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function CommunityLayout({ children, params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)

  if (!community) notFound()

  return (
    <>
      <Header />
      <CommunityLayoutClient community={community} locale={locale}>
        {children}
      </CommunityLayoutClient>
    </>
  )
}
