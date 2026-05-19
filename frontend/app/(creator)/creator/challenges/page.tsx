"use client"

import { useEffect, useMemo, useState } from "react"
import ChallengesTabs from "./components/ChallengesTabs"
import ChallengePerformanceOverview from "./components/ChallengePerformanceOverview"
import { api, apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useCommunityGuard } from "@/hooks/use-community-guard"
import { ModuleEmptyState, ModulePage, TOAST_MESSAGES } from "@/components/creator-dashboard"
import { Coins, Plus, Trophy, Users, Zap } from "lucide-react"

export default function CreatorChallengesPage() {
  const { toast } = useToast()
  const { guard, selectedCommunity, selectedCommunityId } = useCommunityGuard()

  const [challenges, setChallenges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [reloadKey, setReloadKey] = useState(0)
  const [revenue, setRevenue] = useState<number | null>(null)
  const [topChallenges, setTopChallenges] = useState<any[]>([])

  useEffect(() => {
    if (!selectedCommunityId) return

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const me = await api.auth.me().catch(() => null as any)
        const user = me?.data || (me as any)?.user || null
        if (!user) {
          setChallenges([])
          setRevenue(null)
          setTopChallenges([])
          return
        }

        const slug = selectedCommunity?.slug || ""

        let listRes: any = null
        if (selectedCommunityId) {
          listRes = await apiClient.get<any>(`/challenges/by-user/${user._id || user.id}`, { type: 'created', limit: 50, communityId: selectedCommunityId }).catch(() => null as any)
        } else if (slug) {
          listRes = await apiClient.get<any>(`/challenges`, { communitySlug: slug, limit: 50 }).catch(() => null as any)
        } else {
          listRes = await apiClient.get<any>(`/challenges/by-user/${user._id || user.id}`, { type: 'created', limit: 50 }).catch(() => null as any)
        }

        const raw = listRes?.challenges || listRes?.data?.challenges || listRes?.data?.items || listRes?.items || []
        const normalized = (Array.isArray(raw) ? raw : []).map((c: any) => ({
          id: c.id || c._id,
          title: c.title,
          description: c.description,
          thumbnail: c.thumbnail,
          startDate: new Date(c.startDate),
          endDate: new Date(c.endDate),
          participants: Array.isArray(c.participants) ? c.participants : Array.from({ length: Number(c.participantsCount ?? 0) }),
          depositAmount: c.depositAmount ?? 0,
          prize: c.prize || c.pool || undefined,
          category: c.category,
          difficulty: c.difficulty,
        }))
        setChallenges(normalized)

        const now = new Date()
        const to = now.toISOString()
        const from = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString()
        const challAgg = await api.creatorAnalytics.getChallenges({ from, to, communityId: selectedCommunityId }).catch(() => null as any)
        const byChallenge = challAgg?.data?.byChallenge || challAgg?.byChallenge || challAgg?.data?.items || challAgg?.items || []
        const byChallengeList = Array.isArray(byChallenge) ? byChallenge : []
        const totalRevenue = byChallengeList.reduce((sum: number, x: any) => sum + Number(x.revenue ?? x.deposits ?? 0), 0)
        setRevenue(Number.isFinite(totalRevenue) ? totalRevenue : null)
        setTopChallenges(
          byChallengeList
            .slice()
            .sort((a: any, b: any) => Number(b.views ?? b.participants ?? b.starts ?? 0) - Number(a.views ?? a.participants ?? a.starts ?? 0))
            .slice(0, 3)
            .map((x: any) => {
              const completion = Number(x.completionRate ?? x.challengeCompletionRate)
              const engagementRate = Number(x.engagementRate)
              return {
                id: x.contentId || x._id || x.id,
                title: x.title || x.name || `Challenge ${String(x.contentId || x._id || x.id || "").slice(-6)}`,
                participants: Number(x.participants ?? x.starts ?? 0),
                deposits: Number(x.deposits ?? x.revenue ?? 0),
                completion: Number.isFinite(completion) ? completion : undefined,
                engagementRate: Number.isFinite(engagementRate) ? engagementRate : undefined,
              }
            }),
        )
      } catch (e: any) {
        setError(e?.message || "Failed to load challenges")
        setRevenue(null)
        setTopChallenges([])
        toast(TOAST_MESSAGES.error(e?.message || 'Failed to load challenges'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedCommunityId, selectedCommunity, toast, reloadKey])

  const filtered = useMemo(() => {
    if (!search) return challenges
    const q = search.toLowerCase()
    return challenges.filter(c => (c.title || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q))
  }, [challenges, search])

  const filteredTopChallenges = useMemo(() => {
    if (!search) return topChallenges
    const q = search.toLowerCase()
    return topChallenges.filter((challenge: any) => (challenge.title || "").toLowerCase().includes(q))
  }, [topChallenges, search])

  if (guard) return guard

  const activeChallenges = challenges.filter((challenge) => {
    const now = new Date()
    return challenge.startDate <= now && challenge.endDate >= now
  }).length

  const totalParticipants = challenges.reduce((sum, challenge) => {
    const participants = Array.isArray(challenge.participants) ? challenge.participants.length : Number(challenge.participantsCount || 0)
    return sum + participants
  }, 0)

  return (
    <ModulePage
      title="Challenges"
      description={`Create and manage accountability programs for ${selectedCommunity?.name || "this community"}.`}
      primaryAction={{ label: "Create Challenge", href: "/creator/challenges/new", icon: Plus }}
      metrics={[
        { title: "Challenges", value: challenges.length, icon: Zap, color: "challenges" },
        { title: "Active", value: activeChallenges, icon: Trophy, color: "success" },
        { title: "Participants", value: totalParticipants, icon: Users, color: "primary" },
        { title: "Revenue", value: revenue == null ? "..." : `${revenue.toLocaleString()} TND`, icon: Coins, color: "success" },
      ]}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search challenges..."
      dataFreshnessLabel="Challenge participation and revenue refresh from creator analytics."
      density="compact"
      loading={loading}
      error={error}
      onRetry={() => {
        setError(null)
        setReloadKey((key) => key + 1)
      }}
      emptyState={!loading && !error && challenges.length === 0 ? <ModuleEmptyState module="challenges" /> : null}
    >
      <ChallengesTabs allChallenges={filtered} hasSearchQuery={!!search} />
      {filtered.length > 0 && (
        <ChallengePerformanceOverview allChallenges={filtered} topChallenges={filteredTopChallenges} />
      )}
    </ModulePage>
  )
}
