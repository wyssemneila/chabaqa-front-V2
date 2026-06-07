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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="rounded-lg border-[var(--bd)] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-6 w-6 animate-spin text-chabaqa-primary" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="rounded-lg border-[var(--bd)] bg-white p-4 shadow-sm">
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
      color: "text-chabaqa-primary",
      bgColor: "bg-chabaqa-primary/10",
    },
    {
      name: "Emails Sent",
      value: stats.totalEmailsSent.toLocaleString(),
      icon: Send,
      color: "text-courses-700",
      bgColor: "bg-courses/10",
    },
    {
      name: "Average Open Rate",
      value: `${stats.averageOpenRate.toFixed(1)}%`,
      icon: Users,
      color: "text-sessions-700",
      bgColor: "bg-sessions/10",
    },
    {
      name: "Average Click Rate",
      value: `${stats.averageClickRate.toFixed(1)}%`,
      icon: MousePointerClick,
      color: "text-challenges-700",
      bgColor: "bg-challenges/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {statItems.map((stat) => (
        <Card key={stat.name} className="rounded-lg border-[var(--bd)] bg-white p-4 shadow-sm transition hover:border-chabaqa-primary/30 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--t2)]">{stat.name}</p>
              <h3 className="mt-1 text-2xl font-bold text-[var(--t1)]">{stat.value}</h3>
              {stat.name.includes("Rate") && stats.totalEmailsSent > 0 && (
                <p className="mt-1 text-xs text-[var(--t3)]">
                  of {stats.totalEmailsSent.toLocaleString()} sent
                </p>
              )}
            </div>
            <div className={`${stat.bgColor} rounded-md p-3`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
