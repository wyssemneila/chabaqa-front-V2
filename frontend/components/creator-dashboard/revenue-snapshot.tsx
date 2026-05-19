"use client"

import Link from "next/link"
import { AlertCircle, CheckCircle2 } from "lucide-react"
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
}

export function RevenueSnapshot({
  monthRevenue,
  availableBalance,
  pendingPayout,
  bankConfigured,
  href = "/creator/monetization/payouts",
}: RevenueSnapshotProps) {
  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="text-lg">Revenue Snapshot</CardTitle>
        <CardDescription>Current money signals for this community.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
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
