import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Layers, PlayCircle, Timer } from "lucide-react"

interface ProgressStatsGridProps {
  summary: {
    totalItems: number
    completed: number
    inProgress: number
    notStarted: number
  }
}

export default function ProgressStatsGrid({ summary }: ProgressStatsGridProps) {
  const stats = [
    {
      label: "Total Items",
      value: summary.totalItems,
      icon: Layers,
      iconClass: "text-[var(--p)]",
      bgClass: "bg-[var(--p)]/10",
      valueClass: "text-[var(--p)]",
      description: "Across all categories",
    },
    {
      label: "Completed",
      value: summary.completed,
      icon: CheckCircle2,
      iconClass: "text-emerald-600",
      bgClass: "bg-emerald-50",
      valueClass: "text-emerald-600",
      description: "Finished successfully",
    },
    {
      label: "In Progress",
      value: summary.inProgress,
      icon: Timer,
      iconClass: "text-[var(--orange)]",
      bgClass: "bg-orange-50",
      valueClass: "text-[var(--orange)]",
      description: "Currently active",
    },
    {
      label: "Not Started",
      value: summary.notStarted,
      icon: PlayCircle,
      iconClass: "text-[var(--t3)]",
      bgClass: "bg-[var(--bd)]",
      valueClass: "text-[var(--t2)]",
      description: "Ready to begin",
    },
  ]

  return (
    <section className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card
            key={stat.label}
            className="h-full border border-[var(--bd)] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <CardContent className="flex h-full flex-col justify-between gap-4 p-5">
              <div className={`inline-flex rounded-xl p-2.5 w-fit ${stat.bgClass}`}>
                <Icon className={`h-5 w-5 ${stat.iconClass}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold tracking-tight ${stat.valueClass}`}>
                  {stat.value}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-[var(--t1)]">{stat.label}</p>
                <p className="mt-0.5 text-xs text-[var(--t3)]">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </section>
  )
}
