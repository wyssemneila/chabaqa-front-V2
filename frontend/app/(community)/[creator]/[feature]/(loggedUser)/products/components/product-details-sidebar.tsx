import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Codesandbox, FileText, Coins, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ProductWithDetails,
  ProductPurchase,
  isProductOwnedByUser,
} from "@/lib/api/products-community.api"
import { getFileTypeIcon } from "@/lib/utilsmedia"
import Link from "next/link"

interface ProductDetailsSidebarProps {
  creatorSlug: string
  slug: string
  selectedProduct: string | null
  allProducts: ProductWithDetails[]
  userPurchases: ProductPurchase[]
}

export default function ProductDetailsSidebar({
  creatorSlug,
  slug,
  selectedProduct,
  allProducts,
  userPurchases
}: ProductDetailsSidebarProps) {
  if (!selectedProduct) {
    return (
      <Card className="border-0 shadow-sm sticky top-6">
        <CardContent className="text-center py-8">
          <Codesandbox className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold mb-2">Select a Product</h3>
          <p className="text-sm text-muted-foreground">
            Click on any product to view details and download options
          </p>
        </CardContent>
      </Card>
    )
  }

  const product = allProducts.find((p) => p.id === selectedProduct)
  if (!product) return null

  const isPurchased = isProductOwnedByUser(product, userPurchases || [])

  return (
    <div className="space-y-6 sticky top-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Codesandbox className="h-5 w-5 mr-2 text-primary-500" />
            Product Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Description</h4>
            <p className="text-sm text-muted-foreground">
              {product.description || "No description available"}
            </p>
          </div>

          {product.features && product.features.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Key Features</h4>
              <ul className="space-y-1 text-sm">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {product.files && product.files.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Files Included</h4>
              <div className="space-y-2">
                {product.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                    <div className="flex items-center">
                      {getFileTypeIcon(file.type)}
                      <span>{file.name}</span>
                    </div>
                    <span className="text-muted-foreground text-xs">{file.size || "N/A"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-500" />
            License Terms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            {product.licenseTerms ? (
              <p>{product.licenseTerms}</p>
            ) : (
              <>
                <p>This digital product is licensed for personal use only.</p>
                <p>Redistribution or commercial use is prohibited without permission.</p>
                {product.price > 0 && (
                  <p>One purchase grants you lifetime access to all future updates.</p>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {!isPurchased && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-primary-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Coins className="h-5 w-5 mr-2 text-primary-500" />
              {product.price === 0 ? 'Get This Free Resource' : 'Purchase Options'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {product.price > 0 && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Price:</span>
                  <span className="text-2xl font-bold">{product.price} TND</span>
                </div>
              )}
              <Button className="w-full" size="lg" asChild>
                <Link href={`/${creatorSlug}/${slug}/products/${product.id}`}>
                  {product.price === 0 ? 'Get Free' : 'Buy'}
                </Link>
              </Button>
              {product.price > 0 && (
                <div className="text-center text-sm text-muted-foreground">
                  30-day money back guarantee
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
