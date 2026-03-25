"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductsGrid } from "./products-grid"
import { EmptyProducts } from "./empty-products"

interface ProductsTabsProps {
  products: any[]
  communityId: string
}

export function ProductsTabs({ products, communityId }: ProductsTabsProps) {
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const allProducts = products.filter((p) => p.communityId === communityId)

  const filteredProducts = allProducts.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === "published") {
      return matchesSearch && product.isPublished
    }
    if (activeTab === "draft") {
      return matchesSearch && !product.isPublished
    }
    if (activeTab === "physical") {
      return matchesSearch && product.type === "physical"
    }
    if (activeTab === "digital") {
      return matchesSearch && product.type === "digital"
    }
    if (activeTab === "free") {
      return matchesSearch && product.price === 0
    }
    if (activeTab === "paid") {
      return matchesSearch && product.price > 0
    }
    return matchesSearch
  })

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="all">All Products ({allProducts.length})</TabsTrigger>
        <TabsTrigger value="published">Published ({allProducts.filter((p) => p.isPublished).length})</TabsTrigger>
        <TabsTrigger value="draft">Draft ({allProducts.filter((p) => !p.isPublished).length})</TabsTrigger>
        <TabsTrigger value="physical">Physical ({allProducts.filter((p) => p.type === "physical").length})</TabsTrigger>
        <TabsTrigger value="digital">Digital ({allProducts.filter((p) => p.type === "digital").length})</TabsTrigger>
        <TabsTrigger value="free">Free ({allProducts.filter((p) => p.price === 0).length})</TabsTrigger>
        <TabsTrigger value="paid">Paid ({allProducts.filter((p) => p.price > 0).length})</TabsTrigger>
      </TabsList>

      <TabsContent value={activeTab} className="mt-6">
        {filteredProducts.length === 0 ? (
          <EmptyProducts hasSearchQuery={!!searchQuery} />
        ) : (
          <ProductsGrid products={filteredProducts} />
        )}
      </TabsContent>
    </Tabs>
  )
}