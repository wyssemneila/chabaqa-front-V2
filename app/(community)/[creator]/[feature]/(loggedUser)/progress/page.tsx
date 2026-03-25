'use client'

import { use, useEffect, useState } from 'react'
import { AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { communitiesApi } from "@/lib/api/communities.api"
import { progressionApi } from "@/lib/api/progression.api"
import type { Community, ProgressionOverview } from "@/lib/api/types"
import ProgressionPageContent from "./components/progression-page-content"

export default function ProgressionPage({
  params,
}: {
  params: Promise<{ creator: string; feature: string }>
}) {
  const { feature } = use(params)
  const normalisedSlug = decodeURIComponent(feature).trim()

  const [community, setCommunity] = useState<Community | null>(null)
  const [progression, setProgression] = useState<ProgressionOverview | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const communityResponse = await communitiesApi.getBySlug(normalisedSlug)
        const communityPayload =
          (communityResponse as any)?.data?.data ?? communityResponse?.data
        const resolvedCommunity = Array.isArray(communityPayload)
          ? communityPayload[0]
          : communityPayload
        const communityId =
          resolvedCommunity?.id ??
          resolvedCommunity?._id ??
          resolvedCommunity?.communityId

        if (!resolvedCommunity || !communityId) {
          throw new Error('Community not found')
        }

        const overview = await progressionApi.getOverview({
          communityId,
          communitySlug: normalisedSlug,
        })

        setCommunity(resolvedCommunity as Community)
        setProgression(overview)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    void fetchData()
  }, [normalisedSlug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-8">
          <Card className="w-full max-w-lg border border-slate-200 bg-white shadow-sm">
            <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading your progress...
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    console.error("Error loading progression page:", error)
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-8">
          <Card className="w-full max-w-lg border border-red-200 bg-white shadow-sm">
            <CardContent className="py-10 text-center">
              <div className="mx-auto mb-4 inline-flex rounded-full bg-red-50 p-3 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Unable to load progress</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                We encountered an issue while loading your progression data. Please try again.
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="mt-4 gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!community || !progression) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-8">
          <Card className="w-full max-w-lg border border-slate-200 bg-white shadow-sm">
            <CardContent className="py-10 text-center">
              <h2 className="text-lg font-semibold text-foreground">No progress data available</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Start engaging with community content to see your progress here.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <ProgressionPageContent
      slug={normalisedSlug}
      community={community}
      initialData={progression}
    />
  )
}
