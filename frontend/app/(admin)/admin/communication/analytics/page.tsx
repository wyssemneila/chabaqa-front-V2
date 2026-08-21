"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { adminApi } from "@/lib/api/admin-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

export default function CommunicationAnalyticsPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAdminAuth()

  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<any | null>(null)
  const [deliveryStats, setDeliveryStats] = useState<any | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/admin/login")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (authLoading || !isAuthenticated) return
      setLoading(true)
      try {
        const [campaignAnalytics, notificationDelivery] = await Promise.all([
          adminApi.communication.getCampaignAnalytics({}),
          adminApi.communication.getNotificationDeliveryStats({}),
        ])

        setAnalytics(campaignAnalytics.data)
        setDeliveryStats(notificationDelivery.data)
      } catch (error) {
        console.error("[Communication Analytics] Failed to load", error)
        toast.error("Failed to load communication analytics")
      } finally {
        setLoading(false)
      }
    }

    void fetchAnalytics()
  }, [authLoading, isAuthenticated])

  if (authLoading || loading) {
    return <div className="p-4 sm:p-6 lg:p-8 text-muted-foreground">Loading analytics...</div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/communication") }>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Communication Analytics</h1>
          <p className="text-sm text-muted-foreground">Campaign and notification performance overview.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader><CardDescription>Total Sent</CardDescription><CardTitle>{deliveryStats?.totalSent ?? 0}</CardTitle></CardHeader>
        </Card>
        <Card>
          <CardHeader><CardDescription>Total Delivered</CardDescription><CardTitle>{deliveryStats?.totalDelivered ?? 0}</CardTitle></CardHeader>
        </Card>
        <Card>
          <CardHeader><CardDescription>Delivery Rate</CardDescription><CardTitle>{Number(deliveryStats?.deliveryRate ?? 0).toFixed(1)}%</CardTitle></CardHeader>
        </Card>
        <Card>
          <CardHeader><CardDescription>Read Rate</CardDescription><CardTitle>{Number(deliveryStats?.readRate ?? 0).toFixed(1)}%</CardTitle></CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Delivery by Type</CardTitle>
          <CardDescription>Breakdown from `/admin/communication/notifications/analytics/delivery-stats`.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(deliveryStats?.byType ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No delivery stats available.</p>
          ) : (
            (deliveryStats?.byType ?? []).map((item: any) => (
              <div key={item.type} className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
                <span className="font-medium">{item.type}</span>
                <span className="text-muted-foreground">Sent {item.sent} • Delivered {item.delivered} • Read {item.read}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Analytics</CardTitle>
          <CardDescription>Metrics, delivery status, and engagement endpoint aggregation.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto bg-muted p-3 rounded-md">{JSON.stringify(analytics, null, 2)}</pre>
        </CardContent>
      </Card>
    </div>
  )
}
