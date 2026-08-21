import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle, Star } from "lucide-react"

interface ProductHeaderProps {
  creatorSlug: string
  slug: string
  product: any
  isPurchased: boolean
  averageRating?: number
  ratingCount?: number
  salesCount?: number
}

export default function ProductHeader({
  creatorSlug,
  slug,
  product,
  isPurchased,
  averageRating,
  ratingCount,
  salesCount,
}: ProductHeaderProps) {
  const normalizedRating = Number(averageRating ?? product?.rating ?? 0)
  const normalizedRatingCount = Number(ratingCount ?? product?.ratingCount ?? 0)
  const normalizedSales = Number(salesCount ?? product?.sales ?? 0)

  return (
    <div className="mb-5 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur sm:mb-6 sm:p-5">
      {/* Back Button and Title Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0 h-9 w-9 sm:h-10 sm:w-10">
          <Link href={`/${creatorSlug}/${slug}/products`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold leading-tight sm:text-xl lg:text-2xl">
            {product.title}
          </h1>
          
          {/* Product Meta Info - Responsive Layout */}
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground sm:text-sm">
            <span className="shrink-0">{product.category}</span>
            <span className="hidden sm:inline">•</span>
            <span className="shrink-0">{product.files?.length || 0} files</span>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center shrink-0">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 mr-1" />
              <span className="whitespace-nowrap">
                {normalizedRatingCount > 0
                  ? `${normalizedRating.toFixed(1)} (${normalizedRatingCount} ${normalizedRatingCount === 1 ? "review" : "reviews"})`
                  : "New"}
              </span>
            </div>
            <span className="hidden sm:inline">•</span>
            <span className="shrink-0">{normalizedSales} sales</span>
          </div>
        </div>
      </div>

      {/* Purchase Status - Mobile: Below title, Desktop: Right side */}
      {isPurchased && (
        <div className="mt-3 inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 sm:mt-4 sm:text-sm">
          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1 sm:mr-2" />
          <span>Purchased</span>
        </div>
      )}
    </div>
  )
}
