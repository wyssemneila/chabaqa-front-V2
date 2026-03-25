"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { adminApi } from "@/lib/api/admin-api"
import { MetricCard } from "@/app/(admin)/_components/metric-card"
import { ChartCard } from "@/app/(admin)/_components/chart-card"

// Dynamic imports for chart components with loading fallbacks
const LineChart = dynamic(
  () => import("@/app/(admin)/_components/charts/line-chart").then((mod) => ({ default: mod.LineChart })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    ),
    ssr: false
  }
)

const BarChart = dynamic(
  () => import("@/app/(admin)/_components/charts/bar-chart").then((mod) => ({ default: mod.BarChart })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    ),
    ssr: false
  }
)

const PieChart = dynamic(
  () => import("@/app/(admin)/_components/charts/pie-chart").then((mod) => ({ default: mod.PieChart })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    ),
    ssr: false
  }
)
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Coins, TrendingUp, Users, CreditCard, Download, Calendar } from "lucide-react"
import { toast } from "sonner"

interface RevenueMetrics {
  totalRevenue: number
  monthlyRevenue: number
  revenueGrowth: number
  averageTransactionValue: number
  totalTransactions: number
  activeSubscriptions: number
}

interface RevenueByContentType {
  contentType: string
  revenue: number
  percentage: number
}

interface TopCreator {
  _id: string
  username: string
  totalRevenue: number
  totalSales: number
}

interface RevenueGrowthData {
  period: string
  revenue: number
  growth: number
}

export default function FinancialDashboardPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAdminAuth()
  
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null)
  const [revenueByType, setRevenueByType] = useState<RevenueByContentType[]>([])
  const [topCreators, setTopCreators] = useState<TopCreator[]>([])
  const [revenueGrowth, setRevenueGrowth] = useState<RevenueGrowthData[]>([])
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month')

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch financial data
  useEffect(() => {
    if (!isAuthenticated || authLoading) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const [dashboardRes, revenueByTypeRes, topCreatorsRes, growthRes] = await Promise.allSettled([
          adminApi.financial.getRevenueDashboard({ period: dateRange }),
          adminApi.financial.getRevenueByContentType({ period: dateRange }),
          adminApi.financial.getTopCreators({ period: dateRange }, 10),
          adminApi.financial.getRevenueGrowth({ period: dateRange })
        ])

        // Parse dashboard metrics
        if (dashboardRes.status === 'fulfilled') {
          const dashboardData = dashboardRes.value?.data || dashboardRes.value
          setMetrics({
            totalRevenue: dashboardData?.totalRevenue || 0,
            monthlyRevenue: dashboardData?.monthlyRevenue || 0,
            revenueGrowth: dashboardData?.revenueGrowth || 0,
            averageTransactionValue: dashboardData?.averageTransactionValue || 0,
            totalTransactions: dashboardData?.totalTransactions || 0,
            activeSubscriptions: dashboardData?.activeSubscriptions || 0
          })
        } else {
          console.error('[Financial Dashboard] Metrics failed:', dashboardRes.reason)
          toast.error('Failed to load revenue metrics')
        }

        // Parse revenue by content type
        if (revenueByTypeRes.status === 'fulfilled') {
          const revenueData = revenueByTypeRes.value?.data || revenueByTypeRes.value || []
          setRevenueByType(Array.isArray(revenueData) ? revenueData : [])
        } else {
          console.error('[Financial Dashboard] Revenue by type failed:', revenueByTypeRes.reason)
        }

        // Parse top creators
        if (topCreatorsRes.status === 'fulfilled') {
          const creatorsData = topCreatorsRes.value?.data || topCreatorsRes.value || []
          setTopCreators(Array.isArray(creatorsData) ? creatorsData : [])
        } else {
          console.error('[Financial Dashboard] Top creators failed:', topCreatorsRes.reason)
        }

        // Parse revenue growth
        if (growthRes.status === 'fulfilled') {
          const growthData = growthRes.value?.data || growthRes.value || []
          setRevenueGrowth(Array.isArray(growthData) ? growthData : [])
        } else {
          console.error('[Financial Dashboard] Growth data failed:', growthRes.reason)
        }

      } catch (error) {
        console.error('[Financial Dashboard] Critical Error:', error)
        toast.error('Failed to load financial data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated, authLoading, dateRange])

  const handleExport = async () => {
    try {
      await adminApi.financial.generateReport({
        period: dateRange,
        format: 'pdf'
      })
      toast.success('Financial report generated successfully')
    } catch (error) {
      console.error('[Export] Error:', error)
      toast.error('Failed to generate report')
    }
  }

  const getStartDate = (period: 'week' | 'month' | 'year'): string => {
    const now = new Date()
    switch (period) {
      case 'week':
        now.setDate(now.getDate() - 7)
        break
      case 'month':
        now.setMonth(now.getMonth() - 1)
        break
      case 'year':
        now.setFullYear(now.getFullYear() - 1)
        break
    }
    return now.toISOString()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(amount)
  }

  const calculateGrowth = (value: number) => {
    if (value === 0) return { value: "0%", trend: "neutral" as const }
    const sign = value >= 0 ? "+" : ""
    return {
      value: `${sign}${Math.round(value)}%`,
      trend: value >= 0 ? "up" as const : "down" as const
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading financial data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor revenue, transactions, and financial health
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics?.totalRevenue || 0)}
          change={calculateGrowth(metrics?.revenueGrowth || 0)}
          icon={Coins}
          color="primary"
        />
        <MetricCard
          title="Monthly Revenue"
          value={formatCurrency(metrics?.monthlyRevenue || 0)}
          icon={TrendingUp}
          color="success"
        />
        <MetricCard
          title="Active Subscriptions"
          value={metrics?.activeSubscriptions || 0}
          icon={CreditCard}
          color="info"
        />
        <MetricCard
          title="Total Transactions"
          value={metrics?.totalTransactions || 0}
          icon={Users}
          color="warning"
        />
        <MetricCard
          title="Avg Transaction Value"
          value={formatCurrency(metrics?.averageTransactionValue || 0)}
          icon={Coins}
          color="primary"
        />
      </div>

      {/* Revenue by Content Type */}
      <ChartCard
        title="Revenue by Content Type"
        description="Breakdown of revenue by content category"
        loading={loading}
      >
        <PieChart
          data={revenueByType}
          nameKey="contentType"
          valueKey="revenue"
          height={350}
          formatTooltip={(value) => formatCurrency(value)}
          colors={[
            'hsl(var(--chart-1))',
            'hsl(var(--chart-2))',
            'hsl(var(--chart-3))',
            'hsl(var(--chart-4))',
            'hsl(var(--chart-5))'
          ]}
        />
      </ChartCard>

      {/* Top Creators */}
      <ChartCard
        title="Top Creators"
        description="Highest earning creators in the selected period"
        loading={loading}
      >
        <BarChart
          data={topCreators.map((creator) => ({
            name: creator.username,
            revenue: creator.totalRevenue,
            sales: creator.totalSales
          }))}
          xKey="name"
          yKeys={[
            { key: 'revenue', color: 'hsl(var(--chart-1))', name: 'Revenue' }
          ]}
          height={350}
          formatYAxis={(value) => `${(value / 1000).toFixed(0)}k TND`}
          formatTooltip={(value) => formatCurrency(value)}
        />
      </ChartCard>

      {/* Revenue Growth Chart */}
      <ChartCard
        title="Revenue Growth"
        description="Revenue trends over time"
        loading={loading}
      >
        <LineChart
          data={revenueGrowth}
          xKey="period"
          yKeys={[
            { key: 'revenue', color: 'hsl(var(--chart-1))', name: 'Revenue' },
            { key: 'growth', color: 'hsl(var(--chart-2))', name: 'Growth %' }
          ]}
          height={350}
          formatYAxis={(value: number) => {
            // Format revenue axis
            if (value > 1000) {
              return `${(value / 1000).toFixed(0)}k TND`
            }
            return `${value}%`
          }}
          formatTooltip={(value: number, name?: string) => {
            if (name === 'Revenue') {
              return formatCurrency(value)
            }
            return `${value}%`
          }}
        />
      </ChartCard>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          variant="outline"
          className="h-auto py-4"
          onClick={() => router.push('/admin/financial/subscriptions')}
        >
          <div className="text-center w-full">
            <CreditCard className="h-6 w-6 mx-auto mb-2" />
            <div className="font-semibold">View Subscriptions</div>
          </div>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4"
          onClick={() => router.push('/admin/financial/transactions')}
        >
          <div className="text-center w-full">
            <Coins className="h-6 w-6 mx-auto mb-2" />
            <div className="font-semibold">View Transactions</div>
          </div>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4"
          onClick={() => router.push('/admin/financial/payouts')}
        >
          <div className="text-center w-full">
            <Users className="h-6 w-6 mx-auto mb-2" />
            <div className="font-semibold">Manage Payouts</div>
          </div>
        </Button>
      </div>
    </div>
  )
}
