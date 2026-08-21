"use client"

import * as React from "react"
import { Lightbulb, Loader2, MessageSquare, Sparkles, X } from "lucide-react"
import { challengesApi } from "@/lib/api/challenges.api"
import { toast } from "sonner"
import {
  IOSCard,
  IOSCardContent,
  IOSCardHeader,
  IOSText,
  IOSButton,
  IOSBadge,
} from "@/components/ui/ios"

interface AiCoachWidgetProps {
  challengeId: string
  taskId: string
  taskTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AiCoachWidget({
  challengeId,
  taskId,
  taskTitle,
  open,
  onOpenChange,
}: AiCoachWidgetProps) {
  const [hint, setHint] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  const fetchHint = async () => {
    setLoading(true)
    setHint(null)
    try {
      const result = await challengesApi.getAiHint(challengeId, taskId)
      setHint(result.hint)
    } catch (error: any) {
      toast.error(error?.message || "Could not get a hint right now")
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch when opened
  React.useEffect(() => {
    if (open && !hint && !loading) {
      fetchHint()
    }
  }, [open])

  if (!open) return null

  return (
    <div className="mt-4">
      <IOSCard variant="elevated">
        <IOSCardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--p2)]">
                <Lightbulb className="h-4 w-4 text-[var(--p)]" />
              </div>
              <div>
                <IOSText size="headline" weight="semibold">AI Coach</IOSText>
                <IOSText size="caption1" color="secondary">{taskTitle}</IOSText>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--t3)] transition-colors hover:bg-[var(--bd)]/60 hover:text-[var(--t1)]"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </IOSCardHeader>
        <IOSCardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--p)]" />
              <IOSText size="footnote" color="secondary" className="mt-2">
                Thinking about your task...
              </IOSText>
            </div>
          ) : hint ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-[var(--p2)]/40 p-4">
                <IOSText size="body">{hint}</IOSText>
              </div>
              <div className="flex items-center justify-between">
                <IOSBadge variant="outline" size="sm">
                  <Sparkles className="h-3 w-3" /> AI hint
                </IOSBadge>
                <IOSButton variant="plain" size="sm" onClick={fetchHint} disabled={loading}>
                  {loading ? "Loading..." : "Get another hint"}
                </IOSButton>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <IOSText size="footnote" color="secondary">
                Could not generate a hint. Try again later.
              </IOSText>
              <IOSButton variant="tinted" size="sm" onClick={fetchHint} className="mt-3">
                Try again
              </IOSButton>
            </div>
          )}
        </IOSCardContent>
      </IOSCard>
    </div>
  )
}
