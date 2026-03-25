import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, RefreshCw, Search } from "lucide-react"
import type { ProgressionContentType, ProgressionSummary } from "@/lib/api/types"
import { cn } from "@/lib/utils"

const TYPE_CONFIG: Record<ProgressionContentType, { label: string }> = {
  course: { label: "Courses" },
  challenge: { label: "Challenges" },
  session: { label: "Sessions" },
  event: { label: "Events" },
  product: { label: "Products" },
  post: { label: "Posts" },
  resource: { label: "Resources" },
  community: { label: "Communities" },
  subscription: { label: "Subscriptions" },
}

interface ProgressTabsProps {
  typeFilter: string
  onTypeChange: (value: string) => void
  searchQuery: string
  onSearchChange: (value: string) => void
  onRefresh: () => void
  isLoading: boolean
  summary: ProgressionSummary
}

export default function ProgressTabs({
  typeFilter,
  onTypeChange,
  searchQuery,
  onSearchChange,
  onRefresh,
  isLoading,
  summary,
}: ProgressTabsProps) {
  const activeTypes = Object.entries(summary.byType || {})
    .filter(([, data]) => (data?.total ?? 0) > 0)
    .map(([key]) => key as ProgressionContentType)

  return (
    <section className="mb-8 space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Learning Timeline</h2>
            <p className="text-sm text-muted-foreground">
              Filter your activity and continue where you left off.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-9 gap-2 self-start"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sync Progress
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by title, description, or metadata"
              className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-9 focus-visible:bg-white"
            />
          </div>

          <Tabs value={typeFilter} onValueChange={onTypeChange} className="w-full">
            <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1">
              <TabsTrigger
                value="all"
                className={cn(
                  "h-8 whitespace-nowrap rounded-lg px-3 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm",
                )}
              >
                All
                <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
                  {summary.totalItems ?? 0}
                </span>
              </TabsTrigger>

              {activeTypes.map((type) => (
                <TabsTrigger
                  key={type}
                  value={type}
                  className="h-8 whitespace-nowrap rounded-lg px-3 text-sm font-medium capitalize data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  {TYPE_CONFIG[type]?.label ?? type}
                  <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
                    {summary.byType?.[type]?.total ?? 0}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
    </section>
  )
}
