import { ProductHeader } from "./components/product-header"
import { ProductTabs } from "./components/product-tabs"
import { ProductFormProvider } from "./components/product-form-context"
import { Button } from "@/components/ui/button"
import { ShoppingBag, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api"
import { notFound } from "next/navigation"
import { Loader2 } from "lucide-react"

type Props = {
  params: { productId: string }
}

export default async function CreatorProductPage({ params }: Props) {
  try {
    const response = await api.products.getById(params.productId)
    const product = response.data
    
    if (!product) {
      notFound()
    }

    return (
      <ProductFormProvider product={product}>
        <div className="max-w-6xl mx-auto space-y-8 p-5">
          <ProductHeader />
          <ProductTabs />
        </div>
      </ProductFormProvider>
    )
  } catch (error) {
    console.error('Failed to fetch product:', error)
    
    return (
      <div className="text-center py-12">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Product not found</h3>
        <p className="text-gray-600 mb-4">This product may have been deleted or you don't have access to it.</p>
        <Button asChild className="mt-4">
          <Link href="/creator/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </Button>
      </div>
    )
  }
}