"use client"
import { MetricCard } from "@/components/ui/metric-card"
import { ShoppingBag, CheckCircle, Users, Coins } from "lucide-react"

interface ProductsStatsGridProps {
  products: any[]
  revenue?: number | null
  sales?: number | null
}

export function ProductsStatsGrid({ products, revenue, sales }: ProductsStatsGridProps) {
  const totalSales = typeof sales === "number" && Number.isFinite(sales)
    ? sales
    : products.reduce((acc: number, p: any) => acc + Number(p.salesCount ?? p.sales ?? 0), 0)

  const stats = [
    {
      title: "Total Products",
      value: products.length,
      icon: ShoppingBag,
      color: "primary" as const,
    },
    {
      title: "Published Products",
      value: products.filter((p) => p.isPublished).length,
      icon: CheckCircle,
      color: "success" as const,
    },
    {
      title: "Total Sales",
      value: totalSales,
      icon: Users,
      color: "primary" as const,
    },
    {
      title: "Total Revenue",
      value: typeof revenue === "number" && Number.isFinite(revenue)
        ? `${Number(revenue).toLocaleString()} TND`
        : "N/A",
      icon: Coins,
      color: "success" as const,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <MetricCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
        />
      ))}
    </div>
  )
}
