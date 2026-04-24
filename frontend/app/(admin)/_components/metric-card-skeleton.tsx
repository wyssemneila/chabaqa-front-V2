/**
 * Loading skeleton for MetricCard component
 */

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function MetricCardSkeleton() {
  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            {/* Title skeleton */}
            <Skeleton className="h-4 w-24" />
            {/* Value skeleton */}
            <Skeleton className="h-8 w-32" />
            {/* Change indicator skeleton */}
            <Skeleton className="h-3 w-16" />
          </div>
          {/* Icon skeleton */}
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}
