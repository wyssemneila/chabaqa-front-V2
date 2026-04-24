"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import ProductPageContent from "@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/product-page-content"
import { productsCommunityApi, ProductWithDetails, ProductPurchase } from "@/lib/api/products-community.api"
import { getMe } from "@/lib/api/user.api"
import { useToast } from "@/components/ui/use-toast"
import { trackingApi } from "@/lib/api/tracking.api"

function normalizeId(value: any): string {
  if (!value) return ""

  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed || trimmed === "[object Object]") return ""
    const objectIdMatch = trimmed.match(/[a-fA-F0-9]{24}/)
    return objectIdMatch ? objectIdMatch[0] : trimmed
  }

  if (typeof value === "object") {
    const candidates = [value._id, value.id, value.creatorId, value.userId]
    for (const candidate of candidates) {
      const normalized = normalizeId(candidate)
      if (normalized) return normalized
    }
  }

  return ""
}

export default function ProductPage() {
  const params = useParams<{ creator: string; feature: string; productId: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const creator = params?.creator
  const feature = params?.feature
  const productId = params?.productId

  const [product, setProduct] = useState<ProductWithDetails | null>(null)
  const [purchase, setPurchase] = useState<ProductPurchase | null>(null)
  const [isCreator, setIsCreator] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasTrackedView, setHasTrackedView] = useState(false)

  useEffect(() => {
    if (!productId) return
    let active = true
    
    const load = async () => {
      setLoading(true)
      try {
        const productData = await productsCommunityApi.getProductDetail(String(productId))
        if (!active || !productData) return

        const [purchaseData, currentUser] = await Promise.all([
          productsCommunityApi.getUserPurchaseStatus(String(productId)),
          getMe().catch(() => null),
        ])
        if (!active) return

        const currentUserId = normalizeId(currentUser?._id || currentUser?.id)
        const creatorId = normalizeId(productData?.creator?.id || (productData as any)?.creator?._id || (productData as any)?.creatorId || (productData as any)?.creator)
        const creatorView = Boolean(currentUserId && creatorId && currentUserId === creatorId)
        const hasAccess =
          creatorView || Boolean(purchaseData) || Number(productData?.price || 0) === 0

        if (!hasAccess && creator && feature) {
          toast({
            title: "Grant access required",
            description: "Purchase this product first to open its details and files.",
          })
          router.replace(`/${creator}/${feature}/products?access=required`)
          return
        }

        setProduct(productData)
        setPurchase(purchaseData)
        setIsCreator(creatorView)
      } catch (error) {
        console.error('Failed to load product:', error)
        if (!active) return
        setProduct(null)
        setPurchase(null)
      } finally {
        if (!active) return
        setLoading(false)
      }
    }
    
    void load()
    return () => {
      active = false
    }
  }, [creator, feature, productId, router, toast])

  useEffect(() => {
    if (!product || hasTrackedView) return
    const trackingId = normalizeId((product as any)?._id || (product as any)?.id || productId)
    if (!trackingId) return
    setHasTrackedView(true)
    void trackingApi.trackView("product", trackingId, { source: "product_detail_page" }).catch(() => undefined)
  }, [hasTrackedView, product, productId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Product not found</h2>
          <p className="text-gray-600">The product you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        </div>
      </div>
    )
  }

  return (
    <ProductPageContent
      creatorSlug={String(creator || '')}
      slug={String(feature || '')}
      product={product}
      purchase={purchase}
      isCreator={isCreator}
    />
  )
}
