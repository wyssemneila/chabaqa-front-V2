"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Community } from "@/lib/models"
import {
  ProductWithDetails,
  ProductPurchase,
  isProductOwnedByUser,
  productsCommunityApi,
} from "@/lib/api/products-community.api"
import HeaderSection from "./header-section"
import ProductsTabs from "./products-tabs"
import { useToast } from "@/components/ui/use-toast"

interface ProductsPageContentProps {
  creatorSlug: string
  slug: string
  community: Community
  allProducts: ProductWithDetails[]
  userPurchases: ProductPurchase[]
}

export default function ProductsPageContent({
  creatorSlug,
  slug,
  community,
  allProducts,
  userPurchases
}: ProductsPageContentProps) {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const accessToastShownRef = useRef(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [resolvedPurchases, setResolvedPurchases] = useState<ProductPurchase[]>(userPurchases || [])

  useEffect(() => {
    let active = true
    setResolvedPurchases(userPurchases || [])

    const syncPurchases = async () => {
      try {
        const latestPurchases = await productsCommunityApi.getUserPurchases()
        if (!active) return
        if (Array.isArray(latestPurchases)) {
          setResolvedPurchases(latestPurchases)
        }
      } catch {
        if (!active) return
      }
    }

    void syncPurchases()

    return () => {
      active = false
    }
  }, [userPurchases])

  useEffect(() => {
    if (searchParams.get("access") === "required" && !accessToastShownRef.current) {
      accessToastShownRef.current = true
      toast({
        title: "Grant access required",
        description: "Buy the product first to open details and downloads.",
      })
    }
  }, [searchParams, toast])

  const filteredProducts = (allProducts || []).filter((product) => {
    const matchesSearch =
      product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const isPurchased = isProductOwnedByUser(product, resolvedPurchases || [])

    // Filter by published status
    if (!product.isPublished) {
      return false
    }

    if (activeTab === "purchased") {
      return matchesSearch && isPurchased
    }
    if (activeTab === "available") {
      return matchesSearch && !isPurchased
    }
    if (activeTab === "templates") {
      return matchesSearch && product.category === "Templates"
    }
    if (activeTab === "courses") {
      return matchesSearch && product.category === "Courses"
    }
    if (activeTab === "assets") {
      return matchesSearch && product.category === "Assets"
    }
    if (activeTab === "free") {
      return matchesSearch && (product.price || 0) === 0
    }
    if (activeTab === "paid") {
      return matchesSearch && (product.price || 0) > 0
    }
    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <HeaderSection allProducts={allProducts} userPurchases={resolvedPurchases} />
        
        <ProductsTabs
          creatorSlug={creatorSlug}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          allProducts={allProducts}
          filteredProducts={filteredProducts}
          userPurchases={resolvedPurchases}
          selectedProduct={selectedProduct}
          setSelectedProduct={setSelectedProduct}
          slug={slug}
        />
      </div>
    </div>
  )
}
