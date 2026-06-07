import { notFound } from 'next/navigation'
import { CreatorFeaturePage } from '@/components/creator-dashboard/CreatorFeaturePage'

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await params
  if (slug.includes('manual-payments')) {
    notFound()
  }

  return <CreatorFeaturePage variant="fallback" />
}
