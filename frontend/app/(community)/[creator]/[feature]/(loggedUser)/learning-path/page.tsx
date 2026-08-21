'use client'

import { use, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { communitiesApi } from '@/lib/api/communities.api'
import { coursesApi } from '@/lib/api/courses.api'
import { challengesApi } from '@/lib/api/challenges.api'
import { resourcesApi } from '@/lib/api/resources.api'
import { learningPathApi } from '@/lib/api/learning-path.api'
import type { Community, LearningPathItem, ProgressionItem, Resource } from '@/lib/api/types'
import ProgressItemCard from '../progress/components/progress-item-card'
import LearningPathHeader from './components/learning-path-header'
import { resolveImageUrl } from '@/lib/resolve-image-url'

const DEFAULT_LIMIT = 12

const localGoalsKey = (communitySlug: string) => `learning_path_goals_${communitySlug}`

export default function LearningPathPage({
  params,
}: {
  params: Promise<{ creator: string; feature: string }>
}) {
  const { feature, creator } = use(params)
  const normalisedSlug = decodeURIComponent(feature).trim()
  const { toast } = useToast()

  const [community, setCommunity] = useState<Community | null>(null)
  const [goals, setGoals] = useState('')
  const [savedGoals, setSavedGoals] = useState('')
  const [items, setItems] = useState<LearningPathItem[]>([])
  const [courseDetails, setCourseDetails] = useState<Record<string, any>>({})
  const [challengeDetails, setChallengeDetails] = useState<Record<string, any>>({})
  const [resourceDetails, setResourceDetails] = useState<Record<string, Resource>>({})
  const [loading, setLoading] = useState(true)
  const [loadingItems, setLoadingItems] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cachedGoals =
      typeof window !== 'undefined' ? window.localStorage.getItem(localGoalsKey(normalisedSlug)) : null
    if (cachedGoals) {
      setGoals(cachedGoals)
      setSavedGoals(cachedGoals)
    }
  }, [normalisedSlug])

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const communityResponse = await communitiesApi.getBySlug(normalisedSlug)
        const communityPayload =
          (communityResponse as any)?.data?.data ?? communityResponse?.data
        const resolvedCommunity = Array.isArray(communityPayload)
          ? communityPayload[0]
          : communityPayload

        if (!resolvedCommunity) {
          throw new Error('Community not found')
        }

        setCommunity(resolvedCommunity as Community)
      } catch (err: any) {
        setError(err?.message || 'Unable to load community')
      } finally {
        setLoading(false)
      }
    }

    void fetchCommunity()
  }, [normalisedSlug])

  const communityId = useMemo(() => {
    return (community as any)?.id || (community as any)?._id || (community as any)?.communityId
  }, [community])

  const hasGoals = goals.trim().length > 0
  const hasSavedGoals = savedGoals.trim().length > 0

  const fetchRecommendations = async (goalsValue: string) => {
    if (!communityId) return
    if (!goalsValue.trim()) {
      setItems([])
      return
    }

    setLoadingItems(true)
    setError(null)
    try {
      const response = await learningPathApi.getRecommendations({
        goals: goalsValue,
        limit: DEFAULT_LIMIT,
        communityId,
      })
      setItems(response.items || [])
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.message || err?.message || 'Unable to load learning path')
    } finally {
      setLoadingItems(false)
    }
  }

  const handleSaveGoals = async () => {
    const trimmed = goals.trim()
    if (!trimmed) {
      toast({
        variant: 'destructive',
        title: 'Goals required',
        description: 'Add at least one learning goal to continue.',
      })
      return
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(localGoalsKey(normalisedSlug), trimmed)
    }

    setSavedGoals(trimmed)
    await fetchRecommendations(trimmed)
    toast({
      title: 'Goals saved',
      description: 'Your learning path has been updated.',
    })
  }

  const handleRefresh = async () => {
    if (!hasSavedGoals) return
    await fetchRecommendations(savedGoals)
  }

  useEffect(() => {
    if (communityId && hasSavedGoals) {
      void fetchRecommendations(savedGoals)
    }
  }, [communityId, hasSavedGoals, savedGoals])

  useEffect(() => {
    if (!normalisedSlug || items.length === 0) return

    let mounted = true

    const hydrateDetails = async () => {
      const courseIds = items
        .filter((item) => item.type === 'chapter')
        .map((item) => item.metadata?.courseId || item.metadata?.course_id)
        .filter(Boolean)
        .map((id) => String(id))

      const challengeIds = items
        .filter((item) => item.type === 'challenge')
        .map((item) => String(item.contentId))

      const resourceIds = items
        .filter((item) => item.type === 'resource')
        .map((item) => String(item.contentId))

      const [coursesResult, challengesResult] = await Promise.allSettled([
        coursesApi.getByCommunity(normalisedSlug, { page: 1, limit: 200, published: true }),
        challengesApi.getByCommunity(normalisedSlug),
      ])

      if (!mounted) return

      if (coursesResult.status === 'fulfilled') {
        const payload: any = coursesResult.value
        const rawList = payload?.data?.courses || payload?.cours || payload?.data || payload || []
        const list = Array.isArray(rawList) ? rawList : []
        const map: Record<string, any> = {}
        list.forEach((course: any) => {
          const id = String(course.id || course._id || '')
          if (id) {
            map[id] = course
          }
        })
        const filteredMap: Record<string, any> = {}
        courseIds.forEach((id) => {
          if (map[id]) filteredMap[id] = map[id]
        })
        setCourseDetails(filteredMap)
      }

      if (challengesResult.status === 'fulfilled') {
        const payload: any = challengesResult.value
        const rawList = payload?.data || payload?.challenges || payload || []
        const list = Array.isArray(rawList) ? rawList : []
        const map: Record<string, any> = {}
        list.forEach((challenge: any) => {
          const id = String(challenge.id || challenge._id || '')
          if (id) {
            map[id] = challenge
          }
        })
        const filteredMap: Record<string, any> = {}
        challengeIds.forEach((id) => {
          if (map[id]) filteredMap[id] = map[id]
        })
        setChallengeDetails(filteredMap)
      }

      if (resourceIds.length > 0) {
        const results = await Promise.allSettled(
          resourceIds.map((id) => resourcesApi.getById(id)),
        )
        if (!mounted) return
        const map: Record<string, Resource> = {}
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const id = resourceIds[index]
            map[id] = result.value
          }
        })
        setResourceDetails(map)
      }
    }

    void hydrateDetails()

    return () => {
      mounted = false
    }
  }, [items, normalisedSlug])

  const mappedItems = useMemo<ProgressionItem[]>(() => {
    const basePath = `/${encodeURIComponent(creator)}/${encodeURIComponent(normalisedSlug)}`

    return items.map((item) => {
      const metadata = item.metadata || {}
      const courseId = metadata.courseId || metadata.course_id
      const challengeId = metadata.challengeId || item.contentId
      const courseInfo = courseId ? courseDetails[String(courseId)] : undefined
      const challengeInfo = challengeDetails[String(challengeId)]
      const resourceInfo = resourceDetails[String(item.contentId)]

      const thumbnail = resolveImageUrl(
        metadata.thumbnail ||
          (item.type === 'chapter' ? courseInfo?.thumbnail || courseInfo?.thumbnailUrl : undefined) ||
          (item.type === 'challenge' ? challengeInfo?.thumbnail || challengeInfo?.image : undefined) ||
          (item.type === 'resource' ? resourceInfo?.thumbnailUrl || resourceInfo?.coverImageUrl : undefined),
      )

      const title =
        item.title ||
        (item.type === 'chapter' ? courseInfo?.title || courseInfo?.titre : undefined) ||
        (item.type === 'challenge' ? challengeInfo?.title : undefined) ||
        (item.type === 'resource' ? resourceInfo?.titre : undefined) ||
        'Recommendation'

      const description =
        metadata.description ||
        (item.type === 'chapter' ? courseInfo?.description : undefined) ||
        (item.type === 'challenge' ? challengeInfo?.description : undefined) ||
        (item.type === 'resource' ? resourceInfo?.description : undefined) ||
        item.reason
      const contentType = item.type === 'chapter' ? 'course' : item.type
      const viewHref = (() => {
        if (item.type === 'chapter' && courseId) return `${basePath}/courses/${courseId}`
        if (item.type === 'challenge') return `${basePath}/challenges/${challengeId}`
        if (item.type === 'resource') return `${basePath}/resources/${item.contentId}`
        return undefined
      })()

      const continueHref = (() => {
        if (item.type === 'chapter' && courseId) return `${basePath}/courses/${courseId}`
        if (item.type === 'challenge') return `${basePath}/challenges/${challengeId}`
        if (item.type === 'resource') return `${basePath}/resources/${item.contentId}`
        return undefined
      })()

      const baseItem: ProgressionItem = {
        contentType: contentType as ProgressionItem['contentType'],
        contentId: item.contentId,
        title,
        description,
        progressPercent: typeof metadata.progressPercent === 'number' ? metadata.progressPercent : undefined,
        thumbnail: thumbnail || undefined,
        status:
          typeof metadata.progressPercent === 'number'
            ? metadata.progressPercent >= 100
              ? 'completed'
              : metadata.progressPercent > 0
                ? 'in_progress'
                : 'not_started'
            : 'not_started',
        actions: viewHref
          ? {
              view: viewHref,
              continue: continueHref,
            }
          : undefined,
        meta: {
          category: metadata.category,
          level: metadata.level,
          communityId: metadata.communityId || communityId,
        },
        community: community
          ? {
              name: community.name,
              id: (community as any).id || (community as any)._id || '',
            }
          : undefined,
        lastAccessedAt: metadata.lastAccessedAt || metadata.lastActivityAt || metadata.updatedAt,
      }

      return baseItem
    })
  }, [items, normalisedSlug, community, communityId, courseDetails, challengeDetails, resourceDetails])

  const counts = useMemo(() => {
    const chapterCount = items.filter((item) => item.type === 'chapter').length
    const challengeCount = items.filter((item) => item.type === 'challenge').length
    const resourceCount = items.filter((item) => item.type === 'resource').length
    return {
      total: items.length,
      chapterCount,
      challengeCount,
      resourceCount,
    }
  }, [items])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-8">
          <Card className="w-full max-w-lg border border-slate-200 bg-white shadow-sm">
            <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading learning path...
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error && !community) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-8">
          <Card className="w-full max-w-lg border border-red-200 bg-white shadow-sm">
            <CardContent className="py-10 text-center">
              <div className="mx-auto mb-4 inline-flex rounded-full bg-red-50 p-3 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Unable to load learning path</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{error}</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <LearningPathHeader
          communityName={community?.name}
          communityLogo={(community as any)?.logo || (community as any)?.image}
          totalCount={counts.total}
          chapterCount={counts.chapterCount}
          challengeCount={counts.challengeCount}
          resourceCount={counts.resourceCount}
        />

        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <Textarea
              value={goals}
              onChange={(event) => setGoals(event.target.value)}
              rows={3}
              placeholder="Example: master React fundamentals, build a portfolio, and improve marketing skills"
              className="min-h-[96px] resize-none"
            />

            <div className="flex flex-col gap-2">
              <Button onClick={handleSaveGoals} disabled={!hasGoals || loadingItems}>
                {loadingItems ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  'Save goals'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={!hasSavedGoals || loadingItems}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border border-red-200 bg-white shadow-sm">
            <CardContent className="py-6 text-center">
              <div className="mx-auto mb-3 inline-flex rounded-full bg-red-50 p-3 text-red-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <p className="text-sm text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        )}

        {loadingItems ? (
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
        ) : !hasSavedGoals ? (
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardContent className="py-10 text-center">
              <h2 className="text-lg font-semibold text-foreground">Add your learning goals</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Tell us what you want to achieve and we’ll build a personalized learning path.
              </p>
            </CardContent>
          </Card>
        ) : mappedItems.length === 0 ? (
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardContent className="py-10 text-center">
              <h2 className="text-lg font-semibold text-foreground">No recommendations yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Update your goals or engage with content to get new suggestions.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {mappedItems.map((item) => (
              <ProgressItemCard key={`${item.contentType}-${item.contentId}`} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
