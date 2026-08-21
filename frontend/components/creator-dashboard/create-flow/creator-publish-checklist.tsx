"use client"

import { CheckCircle2, Circle, Info, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CreatorChecklistItem } from "@/lib/creator-content"
import { cn } from "@/lib/utils"

interface CreatorPublishChecklistProps {
  items: CreatorChecklistItem[]
  title?: string
}

const iconForStatus = (status: CreatorChecklistItem["status"]) => {
  if (status === "ready") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
  if (status === "missing") return <XCircle className="h-4 w-4 text-red-600" />
  if (status === "recommended") return <Info className="h-4 w-4 text-amber-600" />
  return <Circle className="h-4 w-4 text-gray-400" />
}

export function CreatorPublishChecklist({ items, title = "Publish Checklist" }: CreatorPublishChecklistProps) {
  const readyCount = items.filter((item) => item.status === "ready").length

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {readyCount} of {items.length} ready
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0">{iconForStatus(item.status)}</span>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm font-medium",
                  item.status === "missing" ? "text-red-900" : "text-gray-900",
                )}
              >
                {item.label}
              </p>
              {item.message && <p className="text-xs text-muted-foreground">{item.message}</p>}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

