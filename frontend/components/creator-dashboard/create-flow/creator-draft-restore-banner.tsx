"use client"

import { RotateCcw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CreatorDraftRestoreBannerProps {
  visible: boolean
  label?: string
  onRestore: () => void
  onDismiss: () => void
}

export function CreatorDraftRestoreBanner({
  visible,
  label = "A local draft was found for this creation flow.",
  onRestore,
  onDismiss,
}: CreatorDraftRestoreBannerProps) {
  if (!visible) return null

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
      <p>{label}</p>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onRestore} className="bg-white">
          <RotateCcw className="h-4 w-4" />
          Restore
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDismiss}>
          <Trash2 className="h-4 w-4" />
          Dismiss
        </Button>
      </div>
    </div>
  )
}

