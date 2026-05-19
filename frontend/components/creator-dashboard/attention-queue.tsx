"use client"

import Link from "next/link"
import type { ComponentType } from "react"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EnhancedCard } from "@/components/ui/enhanced-card"

export interface AttentionQueueItem {
  id: string
  title: string
  description: string
  href: string
  icon: ComponentType<{ className?: string }>
  priority: "high" | "medium" | "low"
}

export function AttentionQueue({ items, loading = false }: { items: AttentionQueueItem[]; loading?: boolean }) {
  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="text-lg">Attention Queue</CardTitle>
        <CardDescription>The few things most worth handling next.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((index) => <Skeleton key={index} className="h-14 rounded-lg" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-green-600" />
            <p className="mt-2 text-sm font-medium text-gray-900">All caught up</p>
            <p className="mt-1 text-xs text-gray-500">No urgent dashboard actions right now.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const ItemIcon = item.icon
              return (
                <Link key={item.id} href={item.href} className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50">
                  <div className="rounded-md bg-amber-50 p-2 text-amber-700">
                    <ItemIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="truncate text-xs text-gray-500">{item.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </EnhancedCard>
  )
}
