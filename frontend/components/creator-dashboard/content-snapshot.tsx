"use client"

import Link from "next/link"
import type { ComponentType } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EnhancedCard } from "@/components/ui/enhanced-card"

export interface ContentSnapshotRow {
  label: string
  count: number
  detail: string
  href: string
  icon: ComponentType<{ className?: string }>
}

export function ContentSnapshot({ rows, loading = false }: { rows: ContentSnapshotRow[]; loading?: boolean }) {
  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="text-lg">Content Snapshot</CardTitle>
        <CardDescription>A quick scan of what exists in this community.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((index) => <Skeleton key={index} className="h-14 rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => {
              const RowIcon = row.icon
              return (
                <div key={row.label} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="rounded-md bg-gray-100 p-2 text-gray-600">
                    <RowIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{row.label}</p>
                      <Badge variant="secondary" className="text-[10px]">{row.count}</Badge>
                    </div>
                    <p className="truncate text-xs text-gray-500">{row.detail}</p>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={row.href}>Manage</Link>
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </EnhancedCard>
  )
}
