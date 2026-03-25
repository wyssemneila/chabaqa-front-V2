"use client"

import { Card } from "@/components/ui/card"
import { Mail, Clock, UserCheck, XCircle } from "lucide-react"
import type { InvitationStats } from "@/lib/api/community-invitations.api"

interface InvitationStatsCardsProps {
  stats: InvitationStats | null
  loading: boolean
  error?: string | null
}

export function InvitationStatsCards({ stats, loading, error }: InvitationStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 border-l-2 border-l-muted">
            <div className="space-y-2.5">
              <div className="h-3 w-16 bg-muted animate-pulse rounded" />
              <div className="h-7 w-10 bg-muted animate-pulse rounded" />
              <div className="h-2.5 w-12 bg-muted animate-pulse rounded" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-center h-16 text-muted-foreground">
              <p className="text-xs">No data</p>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const total = Number(stats.total ?? 0)
  const pending = Number(stats.pending ?? 0)
  const accepted = Number(stats.accepted ?? 0)
  const expired = Number(stats.expired ?? 0)
  const revoked = Number(stats.revoked ?? 0)
  const conversionRate = Number(stats.conversionRate ?? 0)

  const statItems = [
    {
      name: "Total Sent",
      value: total.toLocaleString(),
      icon: Mail,
      iconColor: "text-blue-500",
      accent: "border-l-blue-500",
    },
    {
      name: "Pending",
      value: pending.toLocaleString(),
      icon: Clock,
      iconColor: "text-amber-500",
      accent: "border-l-amber-500",
    },
    {
      name: "Accepted",
      value: accepted.toLocaleString(),
      icon: UserCheck,
      iconColor: "text-emerald-500",
      accent: "border-l-emerald-500",
      subtitle: total > 0 ? `${conversionRate}% conversion` : undefined,
    },
    {
      name: "Expired / Revoked",
      value: (expired + revoked).toLocaleString(),
      icon: XCircle,
      iconColor: "text-slate-400",
      accent: "border-l-slate-400",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {statItems.map((stat) => (
        <Card
          key={stat.name}
          className={`p-4 border-l-2 ${stat.accent} hover:shadow-sm transition-all duration-200`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide truncate">
                {stat.name}
              </p>
              <h3 className="text-2xl font-bold mt-1 tabular-nums leading-tight">
                {stat.value}
              </h3>
              {"subtitle" in stat && stat.subtitle && (
                <p className="text-xs text-emerald-600 font-medium mt-0.5">
                  {stat.subtitle}
                </p>
              )}
            </div>
            <stat.icon className={`w-5 h-5 ${stat.iconColor} mt-0.5 shrink-0`} />
          </div>
        </Card>
      ))}
    </div>
  )
}
