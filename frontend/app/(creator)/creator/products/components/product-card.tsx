"use client"

import Link from "next/link"
import Image from "next/image"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import {
  Package,
  Box,
  Tag,
  Coins,
  Star,
  TrendingUp,
  Edit,
  Eye,
  Trash2,
  MoreHorizontal,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { resolveImageUrl } from "@/lib/resolve-image-url"

export function ProductCard({ product }: { product: any }) {
  const pricing = getProductPricing(product)
  const rawThumbnail =
    (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : "") || product.thumbnail || ""
  const productImageSrc =
    resolveImageUrl(rawThumbnail) || rawThumbnail || "/placeholder.svg?height=1080&width=1920&query=product"

  return (
    <EnhancedCard key={product.id} hover className="overflow-hidden">
      <div className="relative w-full aspect-video overflow-hidden">
        <Image
          src={productImageSrc}
          alt={product.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute top-3 left-3">
          <StatusBadge status={product.isPublished ? "published" : "draft"} />
        </div>
        <div className="absolute top-3 right-3">
          {pricing.type === "free" ? (
            <Badge className="bg-green-500 text-white">Free</Badge>
          ) : pricing.type === "freemium" ? (
            <Badge className="bg-blue-500 text-white">Free + Premium</Badge>
          ) : (
            <Badge className="bg-primary-500 text-white">{product.price} TND</Badge>
          )}
          {product.type === "physical" && (
            <Badge variant="secondary" className="ml-2">
              <Package className="h-3 w-3 mr-1" />
              Physical
            </Badge>
          )}
          {product.type === "digital" && (
            <Badge variant="secondary" className="ml-2">
              <Box className="h-3 w-3 mr-1" />
              Digital
            </Badge>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-white/20 hover:bg-white/30 border-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/creator/products/${product.id}/manage`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Product
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/creator/products/${product.id}/manage`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Manage Product
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardHeader>
        <CardTitle className="line-clamp-2">{product.title}</CardTitle>
        <CardDescription className="line-clamp-3">{product.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Tag className="h-4 w-4 mr-2" />
            <div>
              <div className="font-medium text-foreground">{product.category}</div>
              <div>Category</div>
            </div>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Coins className="h-4 w-4 mr-2" />
            <div>
              <div className="font-medium text-foreground">{product.sales}</div>
              <div>Sales</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-muted-foreground">
            {product.type === "physical" ? (
              <>
                <Package className="h-4 w-4 mr-2" />
                <div>
                  <div className="font-medium text-foreground">{product.inventory}</div>
                  <div>In Stock</div>
                </div>
              </>
            ) : (
              <>
                <Box className="h-4 w-4 mr-2" />
                <div>
                  <div className="font-medium text-foreground">Digital</div>
                  <div>Delivery</div>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center text-muted-foreground">
            <Star className="h-4 w-4 mr-2" />
            <div>
              <div className="font-medium text-foreground">
                {product.rating ? product.rating : "No ratings"}
              </div>
              <div>Rating</div>
            </div>
          </div>
        </div>

        {pricing.type === "freemium" && (
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm font-medium text-blue-800">Freemium Product</div>
            <div className="text-xs text-blue-600 mt-1">
              {pricing.paidVariants} premium variants available
            </div>
          </div>
        )}

        {product.variants.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-800">
              {product.variants.length} Variant{product.variants.length > 1 ? "s" : ""}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              From {Math.min(...product.variants.map((v: any) => v.price))} TND
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            {product.type === "physical" && (
              <Badge variant="outline" className="text-xs">
                Shipping
              </Badge>
            )}
            {product.type === "digital" && (
              <Badge variant="outline" className="text-xs">
                Instant Delivery
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/creator/products/${product.id}/analytics`}>
                <TrendingUp className="h-4 w-4 mr-1" />
                Analytics
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={`/creator/products/${product.id}/manage`}>
                <Edit className="h-4 w-4 mr-1" />
                Manage
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </EnhancedCard>
  )
}

function getProductPricing(product: any) {
  if (product.price === 0) {
    const paidVariants = product.variants.filter((v: any) => v.price && v.price > 0)
    if (paidVariants.length > 0) {
      return { type: "freemium", basePrice: 0, paidVariants: paidVariants.length }
    }
    return { type: "free", basePrice: 0 }
  }
  return { type: "paid", basePrice: product.price }
}
