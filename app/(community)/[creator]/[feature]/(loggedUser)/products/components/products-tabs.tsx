"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter } from "lucide-react"
import ProductList from "@/app/(community)/[creator]/[feature]/(loggedUser)/products/components/product-list"
import ProductDetailsSidebar from "@/app/(community)/[creator]/[feature]/(loggedUser)/products/components/product-details-sidebar"
import { ProductWithDetails, ProductPurchase } from "@/lib/api/products-community.api"


interface ProductsTabsProps {
  creatorSlug: string
  activeTab: string
  setActiveTab: (value: string) => void
  searchQuery: string
  setSearchQuery: (value: string) => void
  allProducts: ProductWithDetails[]
  filteredProducts: ProductWithDetails[]
  userPurchases: ProductPurchase[]
  selectedProduct: string | null
  setSelectedProduct: (value: string | null) => void
  slug: string
}

export default function ProductsTabs({
  creatorSlug,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  allProducts,
  filteredProducts,
  userPurchases,
  selectedProduct,
  setSelectedProduct,
  slug
}: ProductsTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 sm:space-y-8">
      {/* Header Section - Responsive Layout */}
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Tabs - Scrollable on mobile */}
        <div className="w-full">
          <div className="flex overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground min-w-max sm:grid sm:w-full sm:grid-cols-4 lg:grid-cols-7 lg:w-auto">
              <TabsTrigger 
                value="all" 
                className="whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                All <span className="hidden sm:inline">({(allProducts || []).filter(p => p.isPublished).length})</span>
              </TabsTrigger>
              <TabsTrigger 
                value="purchased"
                className="whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <span className="sm:hidden">Library</span>
                <span className="hidden sm:inline">My Library ({(userPurchases || []).length})</span>
              </TabsTrigger>
              <TabsTrigger 
                value="templates"
                className="whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Templates <span className="hidden sm:inline">({(allProducts || []).filter(p => p.isPublished && p.category === "Templates").length})</span>
              </TabsTrigger>
              <TabsTrigger 
                value="courses"
                className="whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Courses <span className="hidden sm:inline">({(allProducts || []).filter(p => p.isPublished && p.category === "Courses").length})</span>
              </TabsTrigger>
              <TabsTrigger 
                value="assets"
                className="whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Assets <span className="hidden sm:inline">({(allProducts || []).filter(p => p.isPublished && p.category === "Assets").length})</span>
              </TabsTrigger>
              <TabsTrigger 
                value="free"
                className="whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Free <span className="hidden sm:inline">({(allProducts || []).filter(p => p.isPublished && (p.price || 0) === 0).length})</span>
              </TabsTrigger>
              <TabsTrigger 
                value="paid"
                className="whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Premium <span className="hidden sm:inline">({(allProducts || []).filter(p => p.isPublished && (p.price || 0) > 0).length})</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="flex flex-row items-center justify-between gap-2 flex-wrap">
          {/* Search input */}
          <div className="relative flex-1 min-w-[180px] sm:min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 text-sm w-full"
            />
          </div>

          {/* Filter button */}
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

      </div>

      {/* Tab Content - Responsive Grid */}
      <TabsContent value={activeTab} className="mt-0 space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
          {/* Product List Section */}
          <div className="space-y-4 sm:space-y-6 min-w-0">
            <ProductList
              creatorSlug={creatorSlug}
              filteredProducts={filteredProducts}
              userPurchases={userPurchases}
              selectedProduct={selectedProduct}
              setSelectedProduct={setSelectedProduct}
              slug={slug}
              searchQuery={searchQuery}
            />
          </div>
          
          {/* Sidebar Section - Desktop only */}
          <div className="hidden xl:block space-y-4 sm:space-y-6">
            <div className="sticky top-4">
              <ProductDetailsSidebar
                creatorSlug={creatorSlug}
                slug={slug}
                selectedProduct={selectedProduct}
                allProducts={allProducts}
                userPurchases={userPurchases}
              />
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}