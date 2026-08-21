import Image from "next/image"
import { Card } from "@/components/ui/card"
import { resolveImageUrl } from "@/lib/resolve-image-url"

interface ProductPreviewProps {
  product: any
}

export default function ProductPreview({ product }: ProductPreviewProps) {
  const rawThumbnail =
    (Array.isArray(product?.images) && product.images.length > 0 ? product.images[0] : "") || product?.thumbnail || ""
  const previewImageSrc =
    resolveImageUrl(rawThumbnail) || rawThumbnail || "/placeholder.svg?height=400&width=600&query=digital-product"

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="aspect-video bg-white flex items-center justify-center p-6 sm:p-8">
        <Image
          src={previewImageSrc}
          alt={product.title}
          width={600}
          height={400}
          className="max-h-full max-w-full rounded-lg object-contain"
        />
      </div>
    </Card>
  )
}
