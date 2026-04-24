'use client'

import { useState, useEffect, use } from 'react'
import { communitiesApi } from "@/lib/api/communities.api"
import { achievementsApi } from "@/lib/api/achievements.api"
import type { Community, AchievementWithProgress } from "@/lib/api/types"
import AchievementsPageContent from "./components/achievements-page-content"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, AlertCircle } from "lucide-react"

export default function AchievementsPage({
  params,
}: {
  params: Promise<{ creator: string; feature: string }>
}) {
  const { feature } = use(params)
  const normalisedSlug = decodeURIComponent(feature).trim()

  const [community, setCommunity] = useState<Community | null>(null)
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([])
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setError(null)
      const [communityResponse, achievementsResponse] = await Promise.all([
        communitiesApi.getBySlug(normalisedSlug),
        achievementsApi.getUserAchievements({ communitySlug: normalisedSlug })
      ])

      const communityPayload = (communityResponse as any)?.data?.data ?? communityResponse?.data
      const community = Array.isArray(communityPayload) ? communityPayload[0] : communityPayload

      // Ensure achievements is always an array
      const achievements = Array.isArray(achievementsResponse) 
        ? achievementsResponse 
        : (achievementsResponse as any)?.data && Array.isArray((achievementsResponse as any).data)
          ? (achievementsResponse as any).data
          : []

      setCommunity(community as Community)
      setAchievements(achievements)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [normalisedSlug])

  if (loading) {
    return (
      <Card className="border border-dashed">
        <CardContent className="flex items-center gap-3 py-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading your achievements...
        </CardContent>
      </Card>
    )
  }

  if (error) {
    console.error("Error loading achievements page:", error)
    return (
      <Card className="border border-dashed">
        <CardContent className="py-10 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Unable to load achievements</h2>
          <p className="text-sm text-muted-foreground mb-4">
            We encountered an issue while loading your achievements. Please try again.
          </p>
          <Button
            variant="outline"
            onClick={fetchData}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!community) {
    return (
      <Card className="border border-dashed">
        <CardContent className="py-10 text-center">
          <h2 className="text-lg font-semibold">Community not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The community you're looking for doesn't exist or you don't have access.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <AchievementsPageContent
      slug={normalisedSlug}
      community={community}
      achievements={achievements}
      onRefresh={fetchData}
    />
  )
}
