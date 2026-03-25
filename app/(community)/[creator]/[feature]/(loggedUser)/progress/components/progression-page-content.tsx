"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { progressionApi } from "@/lib/api/progression.api"
import type {
  Community,
  ProgressionContentType,
  ProgressionItem,
  ProgressionOverview,
} from "@/lib/api/types"
import ProgressByType from "./progress-by-type"
import ProgressHeader from "./progress-header"
import ProgressItemCard from "./progress-item-card"
import ProgressStatsGrid from "./progress-stats-grid"
import ProgressTabs from "./progress-tabs"

type TypeFilter = "all" | ProgressionContentType

const DEFAULT_LIMIT = 12

interface ProgressionPageContentProps {
  slug: string
  community: Community
  initialData: ProgressionOverview
}

export default function ProgressionPageContent({
  slug,
  community,
  initialData,
}: ProgressionPageContentProps) {
  const { toast } = useToast()
  const [items, setItems] = useState<ProgressionItem[]>(initialData.items || [])
  const [summary, setSummary] = useState(initialData.summary)
  const [pagination, setPagination] = useState(initialData.pagination)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeLimit = pagination?.limit || DEFAULT_LIMIT

  const fetchProgress = useCallback(
    async (options?: { page?: number; append?: boolean }) => {
      const pageToFetch = options?.page ?? 1
      const append = options?.append ?? false
      const params = {
        communitySlug: slug,
        page: pageToFetch,
        limit: activeLimit,
        contentTypes:
          typeFilter === "all" ? undefined : ([typeFilter] as ProgressionContentType[]),
      }

      try {
        setError(null)
        const response = await progressionApi.getOverview(params)

        if (!response) {
          throw new Error("No data received from server")
        }

        setSummary(response.summary)
        setPagination(response.pagination)

        setItems((prev) => {
          if (!append) {
            return response.items || []
          }

          const existingKeys = new Set(
            prev.map((item) => `${item.contentType}-${item.contentId}`),
          )
          const merged = [...prev]
          ;(response.items || []).forEach((item) => {
            const key = `${item.contentType}-${item.contentId}`
            if (!existingKeys.has(key)) {
              merged.push(item)
            }
          })
          return merged
        })
      } catch (err: any) {
        console.error("[ProgressionPage] Fetch error:", err)
        const errorMessage =
          err.response?.data?.message || err.message || "Failed to sync your progress"
        setError(errorMessage)
        throw err
      }
    },
    [activeLimit, slug, typeFilter],
  )

  const handleRefresh = useCallback(async () => {
    setIsLoading(true)
    try {
      await fetchProgress({ page: 1, append: false })
      toast({
        title: "Progress synced",
        description: "Your latest progression data has been loaded.",
      })
    } catch (refreshError) {
      console.error(refreshError)
      toast({
        variant: "destructive",
        title: "Refresh failed",
        description: "We couldn't refresh your progress right now.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [fetchProgress, toast])

  // Keep initial behavior: if initial payload is missing, fetch immediately.
  useEffect(() => {
    if (!initialData || !initialData.items) {
      void handleRefresh()
    }
  }, [])

  const handleTypeChange = useCallback(
    async (value: string) => {
      setTypeFilter(value as TypeFilter)
      setIsLoading(true)
      try {
        await fetchProgress({ page: 1, append: false })
      } catch (filterError) {
        console.error(filterError)
        toast({
          variant: "destructive",
          title: "Unable to load data",
          description: "Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [fetchProgress, toast],
  )

  const filteredItems = useMemo(() => {
    let result = [...items]

    if (typeFilter !== "all") {
      result = result.filter((item) => item.contentType === typeFilter)
    }

    if (searchQuery.trim().length > 0) {
      const term = searchQuery.toLowerCase()
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term) ||
          (item.meta &&
            Object.values(item.meta).some((value) =>
              String(value).toLowerCase().includes(term),
            )),
      )
    }

    return result
  }, [items, searchQuery, typeFilter])

  const hasMore =
    (pagination?.page || 1) < (pagination?.totalPages || 1) &&
    !isLoading &&
    !isLoadingMore

  const handleLoadMore = useCallback(async () => {
    if (!hasMore) return

    setIsLoadingMore(true)
    try {
      await fetchProgress({ page: (pagination?.page || 1) + 1, append: true })
    } catch (loadMoreError) {
      console.error(loadMoreError)
      toast({
        variant: "destructive",
        title: "Unable to load more",
        description: "Please try again.",
      })
    } finally {
      setIsLoadingMore(false)
    }
  }, [fetchProgress, hasMore, pagination?.page, toast])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <ProgressHeader
          summary={summary}
          communityName={community?.name || undefined}
        />

        <ProgressStatsGrid summary={summary} />

        <ProgressByType summary={summary} />

        <ProgressTabs
          typeFilter={typeFilter}
          onTypeChange={handleTypeChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          summary={summary}
        />

        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden border border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="h-44 w-full animate-pulse bg-slate-200 md:h-52 md:w-56" />
                      <div className="flex-1 space-y-3 p-5">
                        <div className="h-5 w-2/5 animate-pulse rounded bg-slate-200" />
                        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                        <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
                        <div className="h-2 w-full animate-pulse rounded bg-slate-100" />
                        <div className="h-9 w-36 animate-pulse rounded bg-slate-100" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="border border-red-200 bg-white shadow-sm">
              <CardContent className="py-12 text-center">
                <div className="mx-auto mb-4 inline-flex rounded-full bg-red-50 p-3 text-red-600">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Unable to load progress</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{error}</p>
                <Button onClick={handleRefresh} variant="outline" className="mt-4 gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardContent className="py-12 text-center">
                <h3 className="text-lg font-semibold text-foreground">No progress to show yet</h3>
                <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                  Start a course, join a challenge, or register for an event to see your
                  progression history here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4">
                {filteredItems.map((item) => (
                  <ProgressItemCard
                    key={`${item.contentType}-${item.contentId}`}
                    item={item}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="min-w-[180px]"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading more
                      </>
                    ) : (
                      "Load more"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
