"use client"

import Link from "next/link"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EnhancedCard } from "@/components/ui/enhanced-card"

interface RevenueSnapshotProps {
  monthRevenue: string
  availableBalance: string
  pendingPayout: string
  bankConfigured: boolean | null
  href?: string
  revenueTrend?: Array<{ date: string; revenue: number }>
}

export function RevenueSnapshot({
  monthRevenue,
  availableBalance,
  pendingPayout,
  bankConfigured,
  href = "/creator/monetization/payouts",
  revenueTrend = [],
}: RevenueSnapshotProps) {
  const hasTrend = revenueTrend.some((item) => Number(item.revenue) > 0)

  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="text-lg">Revenue Snapshot</CardTitle>
        <CardDescription>Current money signals for this community.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-32 rounded-2xl border border-slate-100 bg-slate-50/70 p-2">
          {hasTrend ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8e78fb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8e78fb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis hide domain={[0, "dataMax"]} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                  formatter={(value) => [`${Number(value).toLocaleString()} TND`, "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8e78fb" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-center text-xs text-slate-400">
              Revenue trend appears after the next paid activity.
            </div>
          )}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">This month revenue</span>
          <span className="font-semibold text-gray-900">{monthRevenue}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Available balance</span>
          <span className="font-semibold text-gray-900">{availableBalance}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Pending payout</span>
          <span className="font-semibold text-gray-900">{pendingPayout}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Payout setup</span>
          <Badge variant={bankConfigured ? "secondary" : "outline"} className="gap-1">
            {bankConfigured ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
            {bankConfigured == null ? "Checking" : bankConfigured ? "Ready" : "Needed"}
          </Badge>
        </div>
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={href}>Manage Payouts</Link>
        </Button>
      </CardContent>
    </EnhancedCard>
  )
}
