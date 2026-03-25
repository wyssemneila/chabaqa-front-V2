import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Layers, PlayCircle, Timer } from "lucide-react"
import { cn } from "@/lib/utils"

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
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-100",
      description: "Across all categories",
    },
    {
      label: "Completed",
      value: summary.completed,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-100",
      description: "Finished successfully",
    },
    {
      label: "In Progress",
      value: summary.inProgress,
      icon: Timer,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100",
      description: "Currently active",
    },
    {
      label: "Not Started",
      value: summary.notStarted,
      icon: PlayCircle,
      color: "text-slate-600",
      bgColor: "bg-slate-50",
      borderColor: "border-slate-100",
      description: "Ready to start",
    },
  ]

  return (
    <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card
            key={stat.label}
            className={cn(
              "h-full border bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
              stat.borderColor,
            )}
          >
            <CardContent className="flex h-full flex-col justify-between gap-4 p-5">
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    "rounded-xl p-2.5 ring-1 ring-black/5",
                    stat.bgColor,
                    stat.color,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div>
                <p className={cn("text-2xl font-bold tracking-tight", stat.color)}>
                  {stat.value}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{stat.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </section>
  )
}
