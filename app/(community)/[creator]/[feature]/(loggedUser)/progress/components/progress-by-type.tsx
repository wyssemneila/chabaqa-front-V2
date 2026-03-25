import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen,
  Building2,
  CalendarDays,
  FileText,
  Flag,
  Layers,
  MessageSquare,
  Repeat,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProgressionSummary } from "@/lib/api/types"

interface ProgressByTypeProps {
  summary: ProgressionSummary
}

const TYPE_METADATA: Record<
  string,
  { label: string; icon: any; color: string; bgColor: string; borderColor: string }
> = {
  course: {
    label: "Courses",
    icon: BookOpen,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-100",
  },
  challenge: {
    label: "Challenges",
    icon: Flag,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-100",
  },
  session: {
    label: "Sessions",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-100",
  },
  event: {
    label: "Events",
    icon: CalendarDays,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-100",
  },
  product: {
    label: "Products",
    icon: ShoppingBag,
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-100",
  },
  post: {
    label: "Posts",
    icon: MessageSquare,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-100",
  },
  resource: {
    label: "Resources",
    icon: FileText,
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-100",
  },
  community: {
    label: "Communities",
    icon: Building2,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-100",
  },
  subscription: {
    label: "Subscriptions",
    icon: Repeat,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-100",
  },
}

export default function ProgressByType({ summary }: ProgressByTypeProps) {
  const activeTypes = Object.entries(summary.byType || {})
    .filter(([, data]) => (data?.total ?? 0) > 0)
    .sort((a, b) => (b[1]?.total ?? 0) - (a[1]?.total ?? 0))

  if (activeTypes.length === 0) return null

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Progress by Content Type</h2>
          <p className="text-sm text-muted-foreground">
            See where you are most active and where to continue next.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {activeTypes.map(([type, data]) => {
          const meta = TYPE_METADATA[type] || {
            label: type,
            icon: Layers,
            color: "text-slate-600",
            bgColor: "bg-slate-50",
            borderColor: "border-slate-100",
          }

          const Icon = meta.icon
          const completionRate =
            data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
          const inProgress = Number(data.inProgress || 0)
          const notStarted = Math.max(data.total - data.completed - inProgress, 0)

          return (
            <Card
              key={type}
              className={cn(
                "border bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                meta.borderColor,
              )}
            >
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("rounded-lg p-2", meta.bgColor, meta.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{meta.label}</p>
                      <p className="text-xs text-muted-foreground">{data.total} items</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-medium",
                      completionRate >= 100
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-700",
                    )}
                  >
                    {completionRate}%
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Completion</span>
                    <span className="font-medium text-foreground">{completionRate}%</span>
                  </div>
                  <Progress
                    value={completionRate}
                    className="h-2 bg-slate-100 [&>*]:bg-primary"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-md bg-emerald-50 px-2 py-1.5 text-center">
                    <p className="font-semibold text-emerald-700">{data.completed}</p>
                    <p className="text-emerald-600/80">Done</p>
                  </div>
                  <div className="rounded-md bg-blue-50 px-2 py-1.5 text-center">
                    <p className="font-semibold text-blue-700">{inProgress}</p>
                    <p className="text-blue-600/80">Active</p>
                  </div>
                  <div className="rounded-md bg-slate-100 px-2 py-1.5 text-center">
                    <p className="font-semibold text-slate-700">{notStarted}</p>
                    <p className="text-slate-600/80">Left</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
