import React from "react"
import { Badge } from "@/components/ui/badge"

const MAP: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paid: "bg-sky-50 text-sky-700 border-sky-200",
  reversed: "bg-rose-50 text-rose-700 border-rose-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paused: "bg-slate-100 text-slate-700 border-slate-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",
  cancelled: "bg-slate-100 text-slate-700 border-slate-200",
}

export function StatusChip({ status }: { status?: string | null }) {
  const normalized = String(status || "pending").toLowerCase()
  const className = MAP[normalized] || "bg-slate-100 text-slate-700 border-slate-200"
  return (
    <Badge variant="outline" className={className}>
      {normalized.replace(/_/g, " ")}
    </Badge>
  )
}
