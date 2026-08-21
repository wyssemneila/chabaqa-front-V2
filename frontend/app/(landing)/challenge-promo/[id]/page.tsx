"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import ChallengeSelectionModal from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/components/challenge-selection-modal"
import { challengesApi } from "@/lib/api/challenges.api"
import { communitiesApi } from "@/lib/api/communities.api"
import { trackChallengeViewOnce } from "@/lib/api/challenge-tracking"
import type { Challenge } from "@/lib/api/types"
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Code,
  ExternalLink,
  FileText,
  Shield,
  Star,
  Trophy,
  Users,
  Video,
  Wrench,
  Zap,
} from "lucide-react"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

interface PromoStats {
  totalViews: number
  totalLikes: number
  totalShares: number
  totalCompleted: number
  averageRating: number
  totalRatings: number
}

interface LeaderboardEntry {
  rank: number
  userName: string
  userAvatar?: string | null
  totalPoints: number
  progress: number
}

const resourceIcons: Record<string, any> = {
  video: Video,
  article: FileText,
  code: Code,
  tool: Wrench,
  pdf: BookOpen,
  link: ExternalLink,
}

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const unwrapResponse = <T,>(response: any): T => {
  if (response?.data?.data !== undefined) return response.data.data as T
  if (response?.data !== undefined) return response.data as T
  return response as T
}

const normalizeChallenge = (raw: any): Challenge | null => {
  if (!raw) return null
  const id = String(raw.id || raw._id || "")
  if (!id) return null

  const participants = Array.isArray(raw.participants)
    ? raw.participants
    : Array.isArray(raw.users)
      ? raw.users
      : []
  const tasks = Array.isArray(raw.tasks)
    ? raw.tasks
    : Array.isArray(raw.challengeTasks)
      ? raw.challengeTasks
      : Array.isArray(raw.taskList)
        ? raw.taskList
        : []
  const resources = Array.isArray(raw.resources)
    ? raw.resources
    : Array.isArray(raw.ressources)
      ? raw.ressources
      : Array.isArray(raw.materials)
        ? raw.materials
        : []
  const pricing = raw.pricing || {}

  return {
    id,
    mongoId: raw._id ? String(raw._id) : undefined,
    title: raw.title || "Untitled Challenge",
    description: raw.description || "",
    slug: raw.slug || undefined,
    communityId: String(raw.communityId || ""),
    communitySlug: raw.communitySlug || raw.community?.slug || undefined,
    creatorId: String(raw.creatorId || ""),
    thumbnail: raw.thumbnail || raw.image || undefined,
    startDate: raw.startDate || new Date().toISOString(),
    endDate: raw.endDate || raw.startDate || new Date().toISOString(),
    difficulty: raw.difficulty || "medium",
    category: raw.category || undefined,
    isActive: raw.isActive !== false,
    participantCount: Math.max(
      toNumber(raw.participantCount),
      participants.length,
    ),
    participants,
    tasks,
    resources,
    notes: raw.notes || undefined,
    duration: raw.duration || undefined,
    depositAmount: toNumber(raw.depositAmount, toNumber(pricing.depositAmount, 0)),
    completionReward: toNumber(raw.completionReward, toNumber(pricing.completionReward, 0)),
    pricing,
    sequentialProgression: Boolean(raw.sequentialProgression),
    unlockMessage: raw.unlockMessage || undefined,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || undefined,
  }
}

const normalizeStats = (raw: any): PromoStats => ({
  totalViews: toNumber(raw?.totalViews),
  totalLikes: toNumber(raw?.totalLikes),
  totalShares: toNumber(raw?.totalShares),
  totalCompleted: toNumber(raw?.totalCompleted),
  averageRating: toNumber(raw?.averageRating),
  totalRatings: toNumber(raw?.totalRatings),
})

const normalizeLeaderboard = (raw: any): LeaderboardEntry[] => {
  const list = Array.isArray(raw?.leaderboard)
    ? raw.leaderboard
    : Array.isArray(raw)
      ? raw
      : []

  return list.map((entry: any, index: number) => ({
    rank: toNumber(entry?.rank, index + 1),
    userName: entry?.userName || entry?.name || "Participant",
    userAvatar: entry?.userAvatar || entry?.avatar || null,
    totalPoints: toNumber(entry?.totalPoints),
    progress: Math.max(0, Math.min(100, toNumber(entry?.progress))),
  }))
}

const getDurationLabel = (challenge: Challenge): string => {
  if (challenge.duration && String(challenge.duration).trim().length > 0) return challenge.duration
  const start = new Date(challenge.startDate).getTime()
  const end = new Date(challenge.endDate).getTime()
  if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    return `${Math.max(1, days)} days`
  }
  if (Array.isArray(challenge.tasks) && challenge.tasks.length > 0) {
    return `${challenge.tasks.length} days`
  }
  return "N/A"
}

const slugifyText = (value: unknown): string =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

export default function ChallengePromoPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const challengeId = String(params.id || "")

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [communityName, setCommunityName] = useState<string>("")
  const [communitySlug, setCommunitySlug] = useState<string>("")
  const [communityCreatorSlug, setCommunityCreatorSlug] = useState<string>("")
  const [relatedChallenges, setRelatedChallenges] = useState<Challenge[]>([])
  const [stats, setStats] = useState<PromoStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isJoined, setIsJoined] = useState(false)
  const [userProgress, setUserProgress] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [countdownLabel, setCountdownLabel] = useState("Challenge starts in")
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [selectedChallenge, setSelectedChallenge] = useState<any | null>(null)
  const creatorFromQuery = String(searchParams.get("creator") || "").trim()
  const featureFromQuery = String(searchParams.get("feature") || "").trim()
  const detailsOnlyMode = String(searchParams.get("mode") || "").trim().toLowerCase() === "details"

  useEffect(() => {
    if (!challengeId) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const [challengeResult, statsResult, leaderboardResult] = await Promise.allSettled([
          challengesApi.getById(challengeId),
          challengesApi.getStats(challengeId),
          challengesApi.getLeaderboard(challengeId, 5),
        ])

        if (challengeResult.status === "rejected") {
          throw challengeResult.reason
        }

        const normalized = normalizeChallenge(unwrapResponse<any>(challengeResult.value))
        if (!normalized) {
          throw new Error("Invalid challenge data")
        }
        if (cancelled) return
        setChallenge(normalized)
        setCommunitySlug(normalized.communitySlug || "")

        if (statsResult.status === "fulfilled") {
          setStats(normalizeStats(unwrapResponse<any>(statsResult.value)))
        } else {
          setStats(normalizeStats({}))
        }

        if (leaderboardResult.status === "fulfilled") {
          const leaderboardPayload = unwrapResponse<any>(leaderboardResult.value)
          setLeaderboard(normalizeLeaderboard(leaderboardPayload))
        } else {
          setLeaderboard([])
        }

        void trackChallengeViewOnce(challengeId)

        if (normalized.communitySlug) {
          const [communityResult, communityChallengesResult] = await Promise.allSettled([
            communitiesApi.getBySlug(normalized.communitySlug),
            challengesApi.getByCommunity(normalized.communitySlug),
          ])

          if (!cancelled && communityResult.status === "fulfilled") {
            const communityPayload = unwrapResponse<any>(communityResult.value)
            setCommunityName(communityPayload?.name || "")
            setCommunitySlug(String(communityPayload?.slug || normalized.communitySlug || "").trim())
            const rawCreatorSlug =
              communityPayload?.creatorSlug ||
              communityPayload?.creator?.username ||
              communityPayload?.creator?.slug ||
              communityPayload?.createur?.username ||
              communityPayload?.createur?.slug ||
              slugifyText(communityPayload?.creator?.name || communityPayload?.createur?.name || communityPayload?.creatorName)
            setCommunityCreatorSlug(String(rawCreatorSlug || "").trim())
          }

          if (!cancelled && communityChallengesResult.status === "fulfilled") {
            const list = unwrapResponse<any>(communityChallengesResult.value)
            const normalizedRelated = (Array.isArray(list) ? list : [])
              .map((item: any) => normalizeChallenge(item))
              .filter((item: Challenge | null): item is Challenge => Boolean(item))
              .filter((item: Challenge) => item.id !== normalized.id)
              .slice(0, 3)
            setRelatedChallenges(normalizedRelated)
          }
        }

        if (typeof window !== "undefined" && localStorage.getItem("accessToken")) {
          const [participationsResult, progressResult] = await Promise.allSettled([
            challengesApi.getMyParticipations(
              normalized.communitySlug ? { communitySlug: normalized.communitySlug } : undefined,
            ),
            challengesApi.getUserProgress(normalized.id),
          ])

          if (!cancelled && participationsResult.status === "fulfilled") {
            const payload = unwrapResponse<any>(participationsResult.value)
            const participations = Array.isArray(payload?.participations)
              ? payload.participations
              : Array.isArray(payload)
                ? payload
                : []
            const joined = participations.some((item: any) => {
              const cid = String(item?.challengeId || "")
              return cid === normalized.id || (normalized.mongoId && cid === normalized.mongoId)
            })
            setIsJoined(joined)
          }

          if (!cancelled && progressResult.status === "fulfilled") {
            const progressPayload = unwrapResponse<any>(progressResult.value)
            const percent = toNumber(
              progressPayload?.progressPercent ?? progressPayload?.progress ?? progressPayload?.data?.progressPercent,
              -1,
            )
            if (percent >= 0) setUserProgress(Math.max(0, Math.min(100, Math.round(percent))))
          }
        }
      } catch (loadError: any) {
        if (!cancelled) {
          setError(loadError?.message || "Failed to load challenge promotion data.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [challengeId])

  useEffect(() => {
    if (!challenge?.startDate || !challenge?.endDate) return

    const start = new Date(challenge.startDate).getTime()
    const end = new Date(challenge.endDate).getTime()

    const calculate = () => {
      const now = Date.now()
      const target = now < start ? start : now <= end ? end : null

      if (!target) {
        setCountdownLabel("Challenge ended")
        return { days: 0, hours: 0, minutes: 0, seconds: 0 }
      }

      setCountdownLabel(now < start ? "Challenge starts in" : "Challenge ends in")
      const diff = target - now
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      }
    }

    setTimeLeft(calculate())
    const timer = setInterval(() => setTimeLeft(calculate()), 1000)
    return () => clearInterval(timer)
  }, [challenge?.startDate, challenge?.endDate])

  const paymentAmount = useMemo(
    () =>
      toNumber(
        challenge?.depositAmount ??
          challenge?.pricing?.depositAmount ??
          challenge?.pricing?.participationFee ??
          0,
      ),
    [challenge],
  )

  const completionReward = useMemo(
    () => toNumber(challenge?.completionReward ?? challenge?.pricing?.completionReward ?? 0),
    [challenge],
  )

  const participantsCount = useMemo(
    () =>
      Math.max(
        toNumber(challenge?.participantCount),
        leaderboard.length,
        toNumber(leaderboard[0]?.rank, 0),
      ),
    [challenge?.participantCount, leaderboard],
  )

  const completionRate = useMemo(() => {
    const completed = toNumber(stats?.totalCompleted)
    const denominator = Math.max(1, participantsCount)
    return Math.max(0, Math.min(100, Math.round((completed / denominator) * 100)))
  }, [participantsCount, stats?.totalCompleted])

  const averageRating = useMemo(
    () => (toNumber(stats?.averageRating) > 0 ? toNumber(stats?.averageRating) : 0),
    [stats?.averageRating],
  )
  const includedItems = useMemo(() => {
    const items: string[] = []
    const tasksCount = challenge?.tasks?.length || 0
    const resourcesCount = challenge?.resources?.length || 0

    if (tasksCount > 0) {
      items.push(`${tasksCount} challenge task${tasksCount > 1 ? "s" : ""} with deliverables`)
    }
    if (resourcesCount > 0) {
      items.push(`${resourcesCount} curated learning resource${resourcesCount > 1 ? "s" : ""}`)
    }
    if (challenge?.sequentialProgression) {
      items.push("Sequential progression with step-by-step unlocks")
    }
    if (participantsCount > 0) {
      items.push(`Community support from ${participantsCount}+ member${participantsCount > 1 ? "s" : ""}`)
    }
    if (completionReward > 0) {
      items.push(`Completion reward up to $${completionReward}`)
    }
    if (paymentAmount > 0) {
      items.push(`One-time deposit: $${paymentAmount}`)
    }
    if (challenge?.category) {
      items.push(`Category focus: ${challenge.category}`)
    }
    if (challenge?.difficulty) {
      items.push(`Difficulty level: ${challenge.difficulty}`)
    }
    if (items.length === 0) {
      items.push("Structured challenge plan and participation tracking")
      items.push("Community interaction and progress visibility")
    }
    return items.slice(0, 7)
  }, [
    challenge?.tasks,
    challenge?.resources,
    challenge?.sequentialProgression,
    challenge?.category,
    challenge?.difficulty,
    completionReward,
    participantsCount,
    paymentAmount,
  ])

  const resolvedCreatorSlug = useMemo(
    () => creatorFromQuery || communityCreatorSlug,
    [communityCreatorSlug, creatorFromQuery],
  )

  const resolvedFeatureSlug = useMemo(
    () => featureFromQuery || communitySlug || challenge?.communitySlug || "",
    [challenge?.communitySlug, communitySlug, featureFromQuery],
  )

  const challengeDetailHref = useMemo(() => {
    const resolvedChallengeId = String(challenge?.id || challenge?.mongoId || "").trim()
    if (!resolvedChallengeId || !resolvedCreatorSlug || !resolvedFeatureSlug) return ""
    return `/${encodeURIComponent(resolvedCreatorSlug)}/${encodeURIComponent(resolvedFeatureSlug)}/challenges/${encodeURIComponent(resolvedChallengeId)}`
  }, [challenge?.id, challenge?.mongoId, resolvedCreatorSlug, resolvedFeatureSlug])

  const challengeEnded = useMemo(() => {
    const endAt = new Date(challenge?.endDate || "").getTime()
    return Number.isFinite(endAt) && endAt < Date.now()
  }, [challenge?.endDate])

  const handlePromoCta = () => {
    if (!challenge) return
    if (detailsOnlyMode) return
    if (isJoined) {
      if (challengeDetailHref) router.push(challengeDetailHref)
      return
    }
    if (challengeEnded) return
    setSelectedChallenge(challenge)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/30 border-t-white mx-auto mb-4" />
          <p className="text-white text-lg font-medium">Loading challenge...</p>
        </div>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600 p-4">
          <div className="text-center text-white max-w-md mx-auto">
            <Zap className="h-16 w-16 mx-auto mb-4 opacity-80" />
            <h1 className="text-3xl font-bold mb-2">Challenge not found</h1>
            <p className="text-white/90 mb-6">{error || "Unable to load challenge promotion page."}</p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="bg-white/10 text-white border-white/30 hover:bg-white/20"
              >
                Go Back
              </Button>
              <Button onClick={() => router.push("/")} className="bg-white text-orange-600 hover:bg-white/90">
                Go Home
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const ctaDisabled = detailsOnlyMode || (!isJoined && challengeEnded) || (isJoined && !challengeDetailHref)
  const showCtaArrow = !ctaDisabled
  const compactCtaLabel = detailsOnlyMode
    ? "Joined"
    : isJoined
    ? challengeDetailHref
      ? "Continue"
      : "Joined"
    : challengeEnded
      ? "Ended"
      : "Join Now"
  const heroCtaLabel = detailsOnlyMode
    ? "Joined"
    : isJoined
    ? challengeDetailHref
      ? "Continue Challenge"
      : "Already Joined"
    : challengeEnded
      ? "Challenge Ended"
      : paymentAmount > 0
        ? `Join for $${paymentAmount}`
        : "Join Free Challenge"
  const joinButtonLabel = detailsOnlyMode
    ? "Joined"
    : isJoined
    ? challengeDetailHref
      ? "Go to Challenge"
      : "Already Joined"
    : challengeEnded
      ? "Challenge Ended"
      : paymentAmount > 0
        ? "Join Challenge"
        : "Join Free"
  const durationLabel = getDurationLabel(challenge)
  const visibleTasks = (challenge.tasks || []).slice(0, 6)
  const visibleResources = (challenge.resources || []).slice(0, 6)

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Minimal Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-orange-600" />
            <span className="font-semibold text-gray-900">Challenge</span>
          </div>
          <Button
            size="sm"
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 h-8 px-4 text-sm"
            onClick={handlePromoCta}
            disabled={ctaDisabled}
          >
            {compactCtaLabel}
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-start max-w-7xl mx-auto">
            {/* Left: Image */}
            {challenge.thumbnail && (
              <div className="order-2 lg:order-1 lg:sticky lg:top-24">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white ring-2 ring-orange-100">
                  <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                    <Image
                      src={challenge.thumbnail}
                      alt={challenge.title}
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Right: Content */}
            <div className="order-1 lg:order-2 space-y-5">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {challenge.difficulty && (
                  <Badge className="bg-orange-100 text-orange-700 border border-orange-200 px-4 py-1.5 text-xs font-semibold">
                    {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
                  </Badge>
                )}
                {challenge.category && (
                  <Badge className="bg-blue-100 text-blue-700 border border-blue-200 px-4 py-1.5 text-xs font-semibold">
                    {challenge.category}
                  </Badge>
                )}
                {communityName && (
                  <Badge className="bg-purple-100 text-purple-700 border border-purple-200 px-4 py-1.5 text-xs font-semibold">
                    {communityName}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">
                {challenge.title}
              </h1>

              {/* Description */}
              <p className="text-base text-gray-600 leading-relaxed">
                {challenge.description}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full shadow-sm border border-gray-200">
                  <Users className="h-4 w-4 text-orange-600" />
                  <span className="font-bold text-gray-900 text-sm">{participantsCount}</span>
                  <span className="text-sm text-gray-600">joined</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full shadow-sm border border-gray-200">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="font-semibold text-gray-900 text-sm">{durationLabel}</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full shadow-sm border border-gray-200">
                  <Star className="h-4 w-4 text-orange-600 fill-orange-600" />
                  <span className="font-bold text-gray-900 text-sm">
                    {averageRating > 0 ? averageRating.toFixed(1) : "New"}
                  </span>
                </div>
              </div>

              {/* Countdown Timer - Compact */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 shadow-lg">
                <p className="text-center text-white font-semibold text-xs uppercase tracking-wider mb-3">
                  {countdownLabel}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Days", value: timeLeft.days },
                    { label: "Hours", value: timeLeft.hours },
                    { label: "Min", value: timeLeft.minutes },
                    { label: "Sec", value: timeLeft.seconds },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center border border-white/30">
                      <div className="text-2xl font-bold text-white font-mono leading-none mb-1">
                        {String(Math.max(0, item.value)).padStart(2, "0")}
                      </div>
                      <div className="text-xs text-white/90 font-medium uppercase">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-2">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all group"
                  onClick={handlePromoCta}
                  disabled={ctaDisabled}
                >
                  <span className="flex items-center justify-center gap-2">
                    {heroCtaLabel}
                    {showCtaArrow && <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                  </span>
                </Button>
                {userProgress !== null && (
                  <div className="mt-3 text-center text-sm text-emerald-600 font-semibold">
                    Your progress: {userProgress}%
                  </div>
                )}
              </div>

              {/* Pricing Info - Compact */}
              {paymentAmount > 0 && (
                <div className="flex items-center justify-between gap-4 pt-2">
                  <div className="flex-1 p-3 rounded-lg bg-gray-50 border border-gray-200 text-center">
                    <p className="text-xs text-gray-600 mb-1">You pay</p>
                    <p className="text-lg font-bold text-gray-900">${paymentAmount}</p>
                  </div>
                  <div className="flex-1 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                    <p className="text-xs text-emerald-700 mb-1">Earn back</p>
                    <p className="text-lg font-bold text-emerald-600">${completionReward}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card className="shadow-sm border border-gray-200">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-orange-600" />
                    What&apos;s Included
                  </h3>
                  <div className="space-y-3">
                    {includedItems.map((item) => (
                      <div key={item} className="flex items-center gap-3 text-gray-700 text-base">
                        <div className="w-2 h-2 rounded-full bg-orange-600 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {visibleTasks.length > 0 && (
                <Card className="shadow-sm border border-gray-200">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <Trophy className="h-6 w-6 text-orange-600" />
                      Task Preview
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {visibleTasks.map((task: any) => (
                        <div key={task.id || task.day} className="rounded-xl border border-gray-200 p-4 bg-white hover:shadow-md transition-shadow">
                          <p className="text-xs text-orange-600 font-semibold mb-1">Day {task.day}</p>
                          <p className="font-bold text-gray-900 line-clamp-1 text-base mb-2">{task.title}</p>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{task.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                              {toNumber(task.points)} pts
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {visibleResources.length > 0 && (
                <Card className="shadow-sm border border-gray-200">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <BookOpen className="h-6 w-6 text-orange-600" />
                      Learning Resources
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {visibleResources.map((resource: any, idx: number) => {
                        const Icon = resourceIcons[String(resource?.type || "").toLowerCase()] || FileText
                        return (
                          <a
                            key={resource.id || `${resource.title}-${idx}`}
                            href={resource.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl border border-gray-200 p-4 bg-white hover:bg-orange-50 hover:border-orange-200 transition-all group"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                                <Icon className="h-5 w-5 text-orange-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-gray-900 line-clamp-1 text-base mb-1">{resource.title}</p>
                                <p className="text-sm text-gray-600 line-clamp-2">{resource.description || resource.url}</p>
                              </div>
                            </div>
                          </a>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {relatedChallenges.length > 0 && (
                <Card className="shadow-sm border border-gray-200">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <Users className="h-6 w-6 text-orange-600" />
                      More Challenges In This Community
                    </h3>
                    <div className="space-y-3">
                      {relatedChallenges.map((item) => (
                        <div key={item.id} className="rounded-xl border border-gray-200 p-4 bg-white hover:shadow-md transition-shadow">
                          <p className="font-bold text-gray-900 text-base mb-1">{item.title}</p>
                          <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-20">
                <Card className="shadow-xl border-2 border-orange-200">
                  <CardContent className="p-8">
                    <div className="text-center mb-8">
                      <div className="text-5xl font-bold text-gray-900 mb-2">
                        {paymentAmount > 0 ? `$${paymentAmount}` : "Free"}
                      </div>
                      <p className="text-gray-600 text-base">One-time deposit</p>
                    </div>

                    <div className="space-y-4 mb-8">
                      {paymentAmount > 0 && (
                        <>
                          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
                            <span className="text-gray-700 font-medium">You pay</span>
                            <span className="text-xl font-bold text-gray-900">${paymentAmount}</span>
                          </div>
                          <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                            <span className="text-emerald-700 font-medium">You can earn back</span>
                            <span className="text-xl font-bold text-emerald-600">${completionReward}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <Button
                      className="w-full h-14 text-base font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all group mb-6"
                      onClick={handlePromoCta}
                      disabled={ctaDisabled}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {joinButtonLabel}
                        {showCtaArrow && <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                      </span>
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-8">
                      <Shield className="h-4 w-4" />
                      <span>Secure checkout and payment flow</span>
                    </div>

                    {userProgress !== null && (
                      <div className="mb-8 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
                        <span className="text-sm text-emerald-700">Your progress: </span>
                        <span className="text-base font-bold text-emerald-700">{userProgress}%</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-8 border-t border-gray-200">
                      <div className="text-center">
                        <Calendar className="h-5 w-5 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 mb-1">Starts</p>
                        <p className="text-sm font-bold text-gray-900">
                          {new Date(challenge.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <Clock className="h-5 w-5 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 mb-1">Duration</p>
                        <p className="text-sm font-bold text-gray-900">{durationLabel}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-3 gap-3 mt-6">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-1">{participantsCount}</div>
                    <div className="text-xs text-gray-600 font-medium">Members</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-1">{completionRate}%</div>
                    <div className="text-xs text-gray-600 font-medium">Completion</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {averageRating > 0 ? averageRating.toFixed(1) : "-"}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedChallenge && (
        <ChallengeSelectionModal
          challenge={selectedChallenge}
          setSelectedChallenge={(_id: string | null) => setSelectedChallenge(null)}
          onJoined={() => setIsJoined(true)}
          redirectPath={challengeDetailHref || undefined}
        />
      )}
    </div>
  )
}
