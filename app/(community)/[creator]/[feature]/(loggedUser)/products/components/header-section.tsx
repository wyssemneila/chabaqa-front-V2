import { ShoppingBag } from "lucide-react"
import { ProductWithDetails, ProductPurchase } from "@/lib/api/products-community.api"

interface HeaderSectionProps {
  allProducts: ProductWithDetails[]
  userPurchases: ProductPurchase[]
}

export default function HeaderSection({ allProducts, userPurchases }: HeaderSectionProps) {
  // Filter only published products
  const publishedProducts = allProducts?.filter(p => p.isPublished) || []
  const freeProducts = publishedProducts.filter(p => (p.price || 0) === 0).length
  const premiumProducts = publishedProducts.filter(p => (p.price || 0) > 0).length

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-primary-500 to-purple-500 rounded-xl p-4 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
        {/* Background circles */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>

        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-3">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Digital Marketplace</h1>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-primary-100 text-sm md:ml-4 mt-2 md:mt-0">
          Download premium digital resources from our community creators
        </p>

        {/* Stats horizontal */}
        <div className="flex space-x-6 mt-4 md:mt-0">
          <div className="text-center">
            <div className="text-xl font-bold">{publishedProducts.length}</div>
            <div className="text-primary-100 text-xs">Total Products</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{userPurchases?.length || 0}</div>
            <div className="text-primary-100 text-xs">Purchased</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{freeProducts}</div>
            <div className="text-primary-100 text-xs">Free</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{premiumProducts}</div>
            <div className="text-primary-100 text-xs">Premium</div>
          </div>
        </div>
      </div>
    </div>
  )
}
