import { notFound } from 'next/navigation'
import { getCommunity } from '@/lib/community-data'
import ProductDetailClient from './product-detail-client'

interface Props { params: Promise<{ slug: string; productId: string }> }

export default async function ProductDetailPage({ params }: Props) {
  const { slug, productId } = await params
  const community = getCommunity(slug)
  if (!community) notFound()
  const product = community.products.find((p) => p.id === productId)
  if (!product) notFound()

  return <ProductDetailClient slug={slug} product={product} communityCreator={community.creatorName} />
}
