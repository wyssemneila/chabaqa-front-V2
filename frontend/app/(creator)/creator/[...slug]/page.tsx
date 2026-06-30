import { CreatorFeaturePage } from '@/components/creator-dashboard/CreatorFeaturePage'

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  await params

  return <CreatorFeaturePage variant="fallback" />
}
