import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Codesandbox, Search, Filter, RefreshCw } from "lucide-react"
import ProductCard from "./product-card"
import {
  ProductWithDetails,
  ProductPurchase,
  isProductOwnedByUser,
} from "@/lib/api/products-community.api"

interface ProductListProps {
  creatorSlug: string
  filteredProducts: ProductWithDetails[]
  userPurchases: ProductPurchase[]
  selectedProduct: string | null
  setSelectedProduct: (value: string | null) => void
  slug: string
  searchQuery: string
}

export default function ProductList({
  creatorSlug,
  filteredProducts,
  userPurchases,
  selectedProduct,
  setSelectedProduct,
  slug,
  searchQuery
}: ProductListProps) {
  // Empty state component
  if (filteredProducts.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="text-center py-8 sm:py-12 px-4 sm:px-6">
          <div className="max-w-sm mx-auto">
            <div className="relative mb-4 sm:mb-6">
              <Codesandbox className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground/50" />
              {searchQuery && (
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2">
                  <Search className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground bg-background rounded-full p-1 border" />
                </div>
              )}
            </div>
            
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-foreground">
              No products found
            </h3>
            
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4 sm:mb-6">
              {searchQuery 
                ? `No results for "${searchQuery}". Try different keywords or check your spelling.`
                : "No products match your current filters. Try adjusting your selection."
              }
            </p>

            {searchQuery && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                >
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Clear Search
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                >
                  <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Results Header - Mobile */}
      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 sm:gap-4 mb-2 sm:mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm sm:text-base font-medium text-foreground">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
          </h2>
          {searchQuery && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              "{searchQuery}"
            </Badge>
          )}
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {(userPurchases || []).length} owned
          </span>
          <span>•</span>
          <span>
            {filteredProducts.filter(p => (p.price || 0) === 0).length} free
          </span>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid gap-4 sm:gap-6">
        {filteredProducts.map((product, index) => (
          <div
            key={product.id}
            className={`transition-all duration-200 ${
              selectedProduct === product.id 
                ? 'ring-2 ring-primary/20 ring-offset-2 sm:ring-offset-4' 
                : ''
            }`}
          >
            <ProductCard
              creatorSlug={creatorSlug}
              product={product}
              isPurchased={isProductOwnedByUser(product, userPurchases || [])}
              isSelected={selectedProduct === product.id}
              onSelect={() => setSelectedProduct(product.id)}
              slug={slug}
            />
            
            {/* Mobile Selection Indicator */}
            {selectedProduct === product.id && (
              <div className="xl:hidden mt-2 p-2 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-xs text-primary font-medium text-center">
                  ✓ Selected for details
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Load More Hint (if needed) */}
      {filteredProducts.length > 10 && (
        <div className="text-center pt-4 sm:pt-6">
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-full text-xs sm:text-sm text-muted-foreground">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
            Showing {filteredProducts.length} products
          </div>
        </div>
      )}

      {/* Back to Top - Mobile */}
      <div className="sm:hidden sticky bottom-4 flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="bg-background/90 backdrop-blur-sm shadow-lg border-primary/20"
        >
          <RefreshCw className="h-3 w-3 mr-2" />
          Back to Top
        </Button>
      </div>
    </div>
  )
}
