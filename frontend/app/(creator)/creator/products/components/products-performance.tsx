import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, TrendingUp } from "lucide-react"

interface TopProduct {
  id: string
  title: string
  sales: number
  revenue?: number
  rating?: number
}

interface ProductsPerformanceProps {
  products: any[]
  topProducts?: TopProduct[]
}

const toFiniteNumber = (value: unknown): number | undefined => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function ProductsPerformance({ products, topProducts = [] }: ProductsPerformanceProps) {
  const derivedProducts: TopProduct[] = products
    .slice()
    .sort((a, b) => Number(b.sales ?? b.salesCount ?? 0) - Number(a.sales ?? a.salesCount ?? 0))
    .slice(0, 3)
    .map((product: any) => {
      const sales = Number(product.sales ?? product.salesCount ?? 0)
      const revenue = sales * Number(product.price ?? 0)
      return {
        id: product.id,
        title: product.title,
        sales,
        revenue,
        rating: toFiniteNumber(product.rating),
      }
    })

  const items = (topProducts.length > 0 ? topProducts : derivedProducts).map((product) => ({
    ...product,
    sales: Number(product.sales ?? 0),
    revenue: toFiniteNumber(product.revenue),
    rating: toFiniteNumber(product.rating),
  }))

  if (items.length === 0) return null

  return (
    <EnhancedCard variant="glass" className="bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-primary-600" />
          Product Performance Overview
        </CardTitle>
        <CardDescription>Your top selling products this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((product, index) => (
              <div key={product.id} className="flex items-center space-x-4 p-4 bg-white/50 rounded-lg">
                <div className="flex-shrink-0">
                  <Badge
                    variant="secondary"
                    className={`w-8 h-8 rounded-full p-0 flex items-center justify-center ${
                      index === 0
                        ? "bg-yellow-100 text-yellow-800"
                        : index === 1
                          ? "bg-gray-100 text-gray-800"
                          : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {index + 1}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{product.title}</h4>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                    <span>{product.sales} sales</span>
                    <span>{Number(product.revenue ?? 0).toLocaleString()} TND revenue</span>
                    {typeof product.rating === "number" && product.rating > 0 && (
                      <div className="flex items-center">
                        <Star className="h-3 w-3 mr-1 text-yellow-500" />
                        {product.rating.toFixed(1)} rating
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </EnhancedCard>
  )
}
