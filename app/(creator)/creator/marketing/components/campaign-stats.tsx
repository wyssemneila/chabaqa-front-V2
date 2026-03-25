"use client"

import { Card } from "@/components/ui/card"
import { Users, Send, MousePointerClick, Mail, Loader2 } from "lucide-react"
import { CampaignStats as CampaignStatsType } from "@/lib/api"

interface CampaignStatsProps {
  stats: CampaignStatsType | null;
  loading: boolean;
  error?: string | null;
}

export function CampaignStats({ stats, loading, error }: CampaignStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-center h-24">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-center h-24 text-muted-foreground">
              <p className="text-sm">No data</p>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const statItems = [
    {
      name: "Total Campaigns",
      value: stats.totalCampaigns.toLocaleString(),
      icon: Mail,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      name: "Emails Sent",
      value: stats.totalEmailsSent.toLocaleString(),
      icon: Send,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      name: "Average Open Rate",
      value: `${stats.averageOpenRate.toFixed(1)}%`,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      name: "Average Click Rate",
      value: `${stats.averageClickRate.toFixed(1)}%`,
      icon: MousePointerClick,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((stat) => (
        <Card key={stat.name} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-500 font-medium">{stat.name}</p>
              <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              {stat.name.includes("Rate") && stats.totalEmailsSent > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  of {stats.totalEmailsSent.toLocaleString()} sent
                </p>
              )}
            </div>
            <div className={`${stat.bgColor} p-3 rounded-full`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}