"use client"

import React from "react"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProductHeader from "@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/product-header"
import ProductPreview from "@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/product-preview"
import ProductOverview from "@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/product-overview"
import ProductFiles from "@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/product-files"
import ProductLicense from "@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/product-license"
import ProductReviews from "@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/product-reviews"
import PurchaseCard from "@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/purchase-card"
import CreatorInfo from "@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/creator-info"
import ProductDetails from "@/app/(community)/[creator]/[feature]/(loggedUser)/products/[productId]/components/product-details"
import { productsApi } from "@/lib/api/products.api"
import { useToast } from "@/components/ui/use-toast"

interface ProductPageContentProps {
  creatorSlug: string
  slug: string
  product: any
  purchase: any
  isCreator?: boolean
}

export default function ProductPageContent({ creatorSlug, slug, product, purchase, isCreator = false }: ProductPageContentProps) {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const requestedTab = searchParams.get("tab")
  const tabFromQuery = requestedTab === "files" || requestedTab === "license" || requestedTab === "review"
    ? requestedTab
    : null

  const [activeTab, setActiveTab] = useState(tabFromQuery || "overview")
  const [downloadProgress, setDownloadProgress] = useState<{[key: string]: number}>({})
  const [localDownloadsCount, setLocalDownloadsCount] = useState<number>(() =>
    (product?.files || []).reduce(
      (sum: number, file: any) => sum + Number(file?.downloadCount || 0),
      0,
    ),
  )
  const [headerReviewStats, setHeaderReviewStats] = useState(() => ({
    averageRating: Number(product?.rating || 0),
    ratingCount: Number(product?.ratingCount || 0),
  }))

  const isPurchased = Boolean(purchase)
  const hasAccess = isPurchased || Number(product?.price || 0) === 0 || isCreator
  const headerSalesCount = Number(product?.sales ?? 0)

  useEffect(() => {
    if (tabFromQuery && tabFromQuery !== activeTab) {
      setActiveTab(tabFromQuery)
    }
  }, [activeTab, tabFromQuery])

  const handleDownload = async (fileId: string) => {
    try {
      setDownloadProgress((prev) => ({ ...prev, [fileId]: 10 }))
      const response = await productsApi.downloadFile(
        String(product?.id || product?._id || ''),
        fileId,
      )
      const data = (response as any)?.data || response
      const url = data?.downloadUrl || data?.url
      if (!url) {
        throw new Error('Download URL missing')
      }
      setDownloadProgress((prev) => ({ ...prev, [fileId]: 100 }))
      if (typeof window !== 'undefined') {
        const link = document.createElement('a')
        link.href = url
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        document.body.appendChild(link)
        link.click()
        link.remove()
      }
      setLocalDownloadsCount((prev) => prev + 1)
      window.setTimeout(() => {
        setDownloadProgress((prev) => {
          const next = { ...prev }
          delete next[fileId]
          return next
        })
      }, 1200)
    } catch (error: any) {
      setDownloadProgress((prev) => {
        const next = { ...prev }
        delete next[fileId]
        return next
      })
      toast({
        title: 'Download failed',
        description: error?.message || 'Unable to download product',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-gray-50 to-slate-100/60">
      <div className="container mx-auto max-w-7xl px-4 pb-12 pt-24 sm:pb-16 sm:pt-28">
        <ProductHeader 
          creatorSlug={creatorSlug}
          slug={slug}
          product={product}
          isPurchased={isPurchased}
          averageRating={headerReviewStats.averageRating}
          ratingCount={headerReviewStats.ratingCount}
          salesCount={headerSalesCount}
        />
        
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
          <div className="space-y-6 min-w-0">
            <ProductPreview product={product} />
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                <TabsTrigger value="overview" className="min-w-24">Overview</TabsTrigger>
                <TabsTrigger value="files" className="min-w-20">Files</TabsTrigger>
                <TabsTrigger value="license" className="min-w-24">License</TabsTrigger>
                <TabsTrigger value="review" className="min-w-24">Review</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-5 sm:mt-6">
                <ProductOverview product={product} />
              </TabsContent>

              <TabsContent value="files" className="mt-5 sm:mt-6">
                <ProductFiles 
                  product={product}
                  isPurchased={hasAccess}
                  downloadProgress={downloadProgress}
                  onDownload={handleDownload}
                />
              </TabsContent>

              <TabsContent value="license" className="mt-5 sm:mt-6">
                <ProductLicense product={product} />
              </TabsContent>

              <TabsContent value="review" className="mt-5 sm:mt-6">
                <ProductReviews
                  productId={String(product?.id || '')}
                  productMongoId={String(product?._id || '')}
                  onStatsChange={setHeaderReviewStats}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6 w-full lg:w-[320px] xl:w-[360px] lg:sticky lg:top-24">
            <PurchaseCard 
              product={product}
              purchase={purchase}
              isPurchased={isPurchased}
              hasAccess={hasAccess}
              totalDownloads={localDownloadsCount}
              onOpenFiles={() => setActiveTab("files")}
            />
            
            <CreatorInfo product={product} />
            
            <ProductDetails product={product} />
          </div>
        </div>
      </div>
    </div>
  )
}
