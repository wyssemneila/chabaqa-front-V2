"use client"

import { useEffect, useState } from "react"
import { ProductsHeader } from "./components/products-header"
import { ProductsStatsGrid } from "./components/products-stats-grid"
import { ProductsSearch } from "./components/products-search"
import { ProductsTabs } from "./components/products-tabs"
import { ProductsPerformance } from "./components/products-performance"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useCommunityGuard } from "@/hooks/use-community-guard"
import {
  PageShell,
  PageHeader,
  PageState,
  ModuleEmptyState,
  TOAST_MESSAGES,
} from "@/components/creator-dashboard"

export default function CreatorProductsPage() {
  const { toast } = useToast()
  const {
    guard,
    selectedCommunity,
    selectedCommunityId,
  } = useCommunityGuard()

  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revenue, setRevenue] = useState<number | null>(null)
  const [sales, setSales] = useState<number | null>(null)
  const [topProducts, setTopProducts] = useState<any[]>([])

  // Reload when community changes
  useEffect(() => {
    if (!selectedCommunityId) {
      setProducts([])
      setRevenue(null)
      setSales(null)
      setTopProducts([])
      setLoading(false)
      return
    }

    const load = async () => {
      setLoading(true)
      setError(null)
      setRevenue(null)
      setSales(null)
      setTopProducts([])
      try {
        const me = await api.auth.me().catch(() => null as any)
        const user = me?.data || (me as any)?.user || null
        if (!user) {
          setProducts([])
          return
        }

        const productsRes = await api.products.getByCreator(user._id || user.id, { limit: 50, communityId: selectedCommunityId }).catch(() => null as any)
        const rawProducts = productsRes?.data?.products || productsRes?.products || productsRes?.data?.items || productsRes?.items || []
        const normalized = (Array.isArray(rawProducts) ? rawProducts : []).map((p: any) => {
          const price = (p?.pricing?.price ?? p?.price ?? 0)
          const sales = Number(p?.sales ?? p?.salesCount ?? 0)

          return {
            id: p.id || p._id,
            title: p.title || p.name,
            name: p.title || p.name,
            description: p.description || "",
            price: Number(price || 0),
            type: p.type,
            category: p.category,
            communityId: p.communityId,
            isPublished: Boolean(p.isPublished),
            images: Array.isArray(p.images) && p.images.length > 0
              ? p.images
              : (p.thumbnail ? [p.thumbnail] : []),
            variants: Array.isArray(p.variants) ? p.variants : [],
            inventory: typeof p.inventory === 'number' ? p.inventory : 0,
            sales,
            salesCount: sales,
            rating: Number(p.averageRating ?? p.rating ?? 0),
            ratingCount: Number(p.ratingCount ?? 0),
          }
        })
        setProducts(normalized)

        // Fetch analytics revenue (last 30 days)
        const now = new Date()
        const to = now.toISOString()
        const from = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString()
        const prodAgg = await api.creatorAnalytics.getProducts({ from, to, communityId: selectedCommunityId }).catch(() => null as any)
        const byProduct = prodAgg?.data?.byProduct || prodAgg?.byProduct || prodAgg?.data?.items || prodAgg?.items || []
        const byProductList = Array.isArray(byProduct) ? byProduct : []
        const totalRevenue = byProductList.reduce((sum: number, x: any) => sum + Number(x.revenue ?? 0), 0)
        const totalSales = byProductList.reduce((sum: number, x: any) => sum + Number(x.sales ?? x.orders ?? 0), 0)

        setRevenue(Number.isFinite(totalRevenue) ? totalRevenue : null)
        setSales(Number.isFinite(totalSales) ? totalSales : null)
        setTopProducts(
          byProductList
            .slice()
            .sort((a: any, b: any) => Number(b.sales ?? b.orders ?? 0) - Number(a.sales ?? a.orders ?? 0))
            .slice(0, 3)
            .map((item: any) => {
              const rating = Number(item.rating ?? item.avgRating ?? item.customerRating)
              return {
                id: item.contentId || item._id || item.id,
                title: item.title || item.name || `Product ${String(item.contentId || item._id || item.id || "").slice(-6)}`,
                sales: Number(item.sales ?? item.orders ?? 0),
                revenue: Number(item.revenue ?? 0),
                rating: Number.isFinite(rating) ? rating : undefined,
              }
            }),
        )
      } catch (e: any) {
        setError(e?.message || "Failed to load products")
        toast(TOAST_MESSAGES.error("load products"))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedCommunityId, selectedCommunity, toast])

  // Community guard: loading / error / no-community states
  if (guard) return guard

  // Page-level loading state
  if (loading) return <PageState variant="loading" compact />

  // Page-level error state
  if (error) {
    return (
      <PageState
        variant="error"
        description={error}
        onRetry={() => {
          setError(null)
          setLoading(true)
        }}
      />
    )
  }

  // Empty state
  if (products.length === 0) {
    return (
      <PageShell>
        <PageHeader
          title="Products"
          breadcrumbs={[
            { label: "Dashboard", href: "/creator/dashboard" },
            { label: "Products" },
          ]}
        />
        <ModuleEmptyState module="products" />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <ProductsHeader />
      <ProductsStatsGrid products={products} revenue={revenue} sales={sales} />
      <ProductsSearch />
      <ProductsTabs products={products} communityId={selectedCommunityId || ""} />
      <ProductsPerformance products={products} topProducts={topProducts} />
    </PageShell>
  )
}
