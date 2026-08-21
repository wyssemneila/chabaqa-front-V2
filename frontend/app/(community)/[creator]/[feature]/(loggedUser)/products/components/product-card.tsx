"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { Star, Users, Download, CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ProductWithDetails } from "@/lib/api/products-community.api"
import { resolveImageUrl } from "@/lib/resolve-image-url"
import { useProductPurchaseFlow } from "@/lib/hooks/use-product-purchase-flow"
import { getUserProfileHref } from "@/lib/profile-handle"
import { PaymentProviderModal } from "@/components/payment-provider-modal"

interface ProductCardProps {
  creatorSlug: string
  product: ProductWithDetails
  isPurchased: boolean
  isSelected: boolean
  onSelect: () => void
  slug: string
}

export default function ProductCard({
  creatorSlug,
  product,
  isPurchased,
  isSelected,
  onSelect,
  slug
}: ProductCardProps) {
  const { toast } = useToast()
  const {
    isStripeLoading,
    initStripePayment,
    paymentModal,
  } = useProductPurchaseFlow()

  const productDetails = product;
  const isFreeProduct = Number(productDetails.price || 0) === 0
  const globalDownloads = (productDetails.files || []).reduce(
    (sum, file) => sum + Number(file?.downloadCount || 0),
    0,
  )
  const rawThumbnail =
    (Array.isArray(productDetails.images) && productDetails.images.length > 0 ? productDetails.images[0] : "") ||
    (productDetails as any).thumbnail ||
    ""
  const productImageSrc =
    resolveImageUrl(rawThumbnail) ||
    rawThumbnail ||
    "/placeholder.svg?height=1080&width=1920&query=digital-product"
  const fileTypes = [...new Set((productDetails.files || []).map((f: any) => f.type))]
  const openProductHref = `/${creatorSlug}/${slug}/products/${productDetails.id}${isPurchased ? "?tab=files" : ""}`
  const ratingCount = Number(productDetails.ratingCount || 0)
  const creatorProfileHref = getUserProfileHref({
    username: (productDetails.creator as any)?.username,
    name: productDetails.creator?.name || "Creator",
  })

  const handleStripePayment = () => {
    initStripePayment(
      String(productDetails.id || productDetails._id || ""),
    )
  }

  return (
    <>
      <PaymentProviderModal
        open={paymentModal.isOpen}
        onOpenChange={paymentModal.close}
        onSelect={paymentModal.handleSelect}
        isLoading={paymentModal.isLoading}
        error={paymentModal.error}
      />
    <Card
      className={`border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all cursor-pointer ${
        isSelected ? "ring-2 ring-primary-500" : ""
      }`}
      onClick={onSelect}
    >
      <div className="flex flex-col md:flex-row">
        <div className="relative w-full md:w-80 aspect-video">
          <Image
            src={productImageSrc}
            alt={productDetails.title}
            fill
            className="object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
            sizes="(max-width: 768px) 100vw, 320px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
          <div className="absolute top-3 right-3">
            {isPurchased ? (
              <Badge className="bg-green-500 text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Owned
              </Badge>
            ) : isFreeProduct ? (
              <Badge className="bg-blue-500 text-white">Free</Badge>
            ) : (
              <Badge variant="secondary" className="bg-white/90">
                {productDetails.price || 0} TND
              </Badge>
            )}
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl font-semibold mb-2">{productDetails.title}</h3>
              <p className="text-muted-foreground line-clamp-2">{productDetails.description}</p>
            </div>
            <div className="flex items-center text-sm text-muted-foreground ml-4">
              <Star className="h-4 w-4 text-yellow-500 mr-1" />
              <span>
                {Number(productDetails.rating || 0).toFixed(1)} ({ratingCount})
              </span>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 text-sm text-muted-foreground mb-4">
            <Badge variant="outline" className="text-xs">
              {productDetails.category}
            </Badge>
            {fileTypes.map((type, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {String(type)}
              </Badge>
            ))}
            <div className="flex items-center ml-auto">
              <Users className="h-4 w-4 mr-1" />
              {productDetails.sales || 0} sales • {globalDownloads} downloads
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link
              href={creatorProfileHref}
              className="flex items-center space-x-2 hover:opacity-90 transition-opacity"
              onClick={(event) => event.stopPropagation()}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={productDetails.creator?.avatar || "/placeholder.svg"} />
                <AvatarFallback>
                  {(productDetails.creator?.name || 'Creator')
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground hover:underline">{productDetails.creator?.name || 'Creator'}</span>
            </Link>

            <div className="flex items-center space-x-2">
              {(isPurchased || isFreeProduct) ? (
                <Button size="sm" asChild>
                  <Link href={openProductHref} onClick={(event) => event.stopPropagation()}>
                    <Download className="h-4 w-4 mr-1" />
                    {isPurchased ? "Open Files" : "Open Product"}
                  </Link>
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation()
                    void handleStripePayment()
                  }}
                  disabled={isStripeLoading}
                >
                  {isStripeLoading ? "Redirecting..." : `Buy - ${productDetails.price || 0} TND`}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
    </>
  )
}
