"use client"

import { MetricCard } from "@/components/ui/metric-card"
import { Zap, Play, Users, Coins } from "lucide-react";

interface StatsGridProps {
  allChallenges: any[]
  revenue?: number | null
}

export default function StatsGrid({ allChallenges, revenue }: StatsGridProps) {
  const participantsTotal = allChallenges.reduce((acc, c) => acc + (Array.isArray(c.participants) ? c.participants.length : (c.participantsCount ?? 0)), 0)
  const stats = [
    {
      title: "Total Challenges",
      value: allChallenges.length,
      icon: Zap,
      color: "challenges" as const,
    },
    {
      title: "Active Challenges",
      value: allChallenges.filter((c) => {
        const now = new Date()
        return c.startDate <= now && c.endDate >= now
      }).length,
      icon: Play,
      color: "success" as const,
    },
    {
      title: "Total Participants",
      value: participantsTotal,
      icon: Users,
      color: "primary" as const,
    },
    {
      title: "Challenge Revenue",
      value: typeof revenue === "number" && Number.isFinite(revenue)
        ? `${Number(revenue).toLocaleString()} TND`
        : "N/A",
      icon: Coins,
      color: "success" as const,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <MetricCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
        />
      ))}
    </div>
  )
}
