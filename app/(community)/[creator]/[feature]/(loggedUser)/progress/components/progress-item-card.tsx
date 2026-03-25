import Image from "next/image"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Flag,
  Layers,
  MapPin,
  MessageSquare,
  PlayCircle,
  Repeat,
  ShoppingBag,
  Star,
  Target,
  Timer,
  Users,
} from "lucide-react"
import type { ProgressionContentType, ProgressionItem } from "@/lib/api/types"
import { cn } from "@/lib/utils"

const TYPE_CONFIG: Record<
  ProgressionContentType,
  { label: string; icon: any; color: string; bgColor: string }
> = {
  course: { label: "Course", icon: BookOpen, color: "text-blue-700", bgColor: "bg-blue-100" },
  challenge: { label: "Challenge", icon: Flag, color: "text-orange-700", bgColor: "bg-orange-100" },
  session: { label: "Session", icon: Users, color: "text-purple-700", bgColor: "bg-purple-100" },
  event: { label: "Event", icon: CalendarDays, color: "text-indigo-700", bgColor: "bg-indigo-100" },
  product: { label: "Product", icon: ShoppingBag, color: "text-pink-700", bgColor: "bg-pink-100" },
  post: { label: "Post", icon: MessageSquare, color: "text-green-700", bgColor: "bg-green-100" },
  resource: { label: "Resource", icon: FileText, color: "text-slate-700", bgColor: "bg-slate-200" },
  community: { label: "Community", icon: Building2, color: "text-cyan-700", bgColor: "bg-cyan-100" },
  subscription: { label: "Subscription", icon: Repeat, color: "text-yellow-700", bgColor: "bg-yellow-100" },
}

const STATUS_CONFIG: Record<
  ProgressionItem["status"],
  { label: string; icon: any; className: string }
> = {
  not_started: {
    label: "Not started",
    icon: PlayCircle,
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
  in_progress: {
    label: "In progress",
    icon: Timer,
    className: "border-amber-200 bg-amber-100 text-amber-700",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-100 text-emerald-700",
  },
}

const currencyFormatter = new Intl.NumberFormat("fr-TN", {
  style: "currency",
  currency: "TND",
  maximumFractionDigits: 0,
})

const formatCurrency = (value?: unknown) => {
  if (typeof value !== "number") return undefined
  return currencyFormatter.format(value)
}

const formatDateLabel = (value?: unknown) => {
  if (!value) return undefined
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return undefined
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

interface ProgressItemCardProps {
  item: ProgressionItem
}

export default function ProgressItemCard({ item }: ProgressItemCardProps) {
  const typeConfig = TYPE_CONFIG[item.contentType] || {
    label: item.contentType,
    icon: Layers,
    color: "text-slate-700",
    bgColor: "bg-slate-200",
  }
  const statusConfig = STATUS_CONFIG[item.status]
  const TypeIcon = typeConfig.icon
  const StatusIcon = statusConfig.icon

  const metaChips = (() => {
    const chips: { label: string; value?: string; icon?: any }[] = []
    const meta = (item.meta || {}) as Record<string, any>

    switch (item.contentType) {
      case "course":
        if (meta.level) chips.push({ label: "Level", value: String(meta.level), icon: Target })
        if (meta.category) chips.push({ label: "Track", value: String(meta.category), icon: Layers })
        break
      case "challenge":
        if (meta.difficulty) {
          chips.push({ label: "Difficulty", value: String(meta.difficulty), icon: Star })
        }
        if (meta.startDate) {
          chips.push({ label: "Starts", value: formatDateLabel(meta.startDate), icon: CalendarDays })
        }
        break
      case "session":
        if (meta.duration) chips.push({ label: "Length", value: `${meta.duration}m`, icon: Clock })
        if (meta.category) chips.push({ label: "Focus", value: String(meta.category), icon: Target })
        break
      case "event":
        if (meta.eventType) {
          chips.push({ label: "Format", value: String(meta.eventType), icon: Building2 })
        }
        if (typeof meta.attendees === "number") {
          chips.push({ label: "Joined", value: String(meta.attendees), icon: Users })
        }
        break
      case "product":
        if (typeof meta.price === "number") {
          chips.push({ label: "Price", value: formatCurrency(meta.price), icon: ShoppingBag })
        }
        if (typeof meta.sales === "number") {
          chips.push({ label: "Sales", value: String(meta.sales), icon: Layers })
        }
        break
      default:
        break
    }

    return chips.filter((chip) => Boolean(chip.value))
  })()

  const timeLabel = (() => {
    if (item.status === "completed" && item.completedAt) {
      return `Completed ${formatDistanceToNow(new Date(item.completedAt), { addSuffix: true })}`
    }

    if (item.lastAccessedAt) {
      return `Last active ${formatDistanceToNow(new Date(item.lastAccessedAt), { addSuffix: true })}`
    }

    return "No activity yet"
  })()

  return (
    <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row md:items-center">
          <div className="relative h-44 w-full shrink-0 overflow-hidden rounded-t-lg md:mx-4 md:h-[184px] md:w-[248px] md:rounded-lg">
            {item.thumbnail ? (
              <Image
                src={item.thumbnail}
                alt={item.title}
                fill
                unoptimized
                className="object-contain object-center"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                <TypeIcon className={cn("h-10 w-10", typeConfig.color)} />
              </div>
            )}

            <div className="absolute left-3 top-3">
              <Badge className={cn("border-0 text-xs font-medium", typeConfig.bgColor, typeConfig.color)}>
                {typeConfig.label}
              </Badge>
            </div>
          </div>

          <div className="flex min-h-[220px] flex-1 flex-col p-4 sm:p-5 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1.5">
                {item.community?.name && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {item.community.name}
                  </p>
                )}
                <h3 className="text-lg font-semibold leading-snug text-foreground">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </div>

              <Badge
                variant="outline"
                className={cn("shrink-0 border text-xs font-medium", statusConfig.className)}
              >
                <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
                {statusConfig.label}
              </Badge>
            </div>

            {typeof item.progressPercent === "number" && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Completion progress</span>
                  <span className="font-medium text-foreground">{item.progressPercent}%</span>
                </div>
                <Progress
                  value={item.progressPercent}
                  className="h-2 bg-slate-100 [&>*]:bg-primary"
                />
              </div>
            )}

            {metaChips.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {metaChips.map((chip) => {
                  const ChipIcon = chip.icon
                  return (
                    <span
                      key={`${chip.label}-${chip.value}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
                    >
                      {ChipIcon && <ChipIcon className="h-3.5 w-3.5 text-slate-500" />}
                      <span className="text-slate-500">{chip.label}:</span>
                      <span className="font-medium">{chip.value}</span>
                    </span>
                  )
                })}
              </div>
            )}

            <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {timeLabel}
              </p>

              <div className="flex items-center gap-2">
                {item.actions?.view && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="h-9 gap-1.5 text-xs"
                  >
                    <Link href={item.actions.view}>
                      Details
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}

                {item.actions?.continue && item.status !== "completed" && (
                  <Button size="sm" asChild className="h-9 gap-1.5 text-xs">
                    <Link href={item.actions.continue}>
                      {item.status === "not_started" ? (
                        <>
                          <PlayCircle className="h-3.5 w-3.5" />
                          Start
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-3.5 w-3.5" />
                          Resume
                        </>
                      )}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
