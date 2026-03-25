"use client"

import { useEffect, useMemo, useState } from "react"
import PageHeader from "./components/PageHeader"
import StatsGrid from "./components/StatsGrid"
import SearchBar from "./components/SearchBar"
import ChallengesTabs from "./components/ChallengesTabs"
import ChallengePerformanceOverview from "./components/ChallengePerformanceOverview"
import { api, apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useCommunityGuard } from "@/hooks/use-community-guard"
import { PageShell, PageState, ModuleEmptyState, TOAST_MESSAGES } from "@/components/creator-dashboard"

export default function CreatorChallengesPage() {
  const { toast } = useToast()
  const { guard, selectedCommunity, selectedCommunityId } = useCommunityGuard()

  const [challenges, setChallenges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [revenue, setRevenue] = useState<number | null>(null)
  const [topChallenges, setTopChallenges] = useState<any[]>([])

  useEffect(() => {
    if (!selectedCommunityId) return

    const load = async () => {
      setLoading(true)
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
        setRevenue(null)
        setTopChallenges([])
        toast(TOAST_MESSAGES.error(e?.message || 'Failed to load challenges'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedCommunityId, selectedCommunity, toast])

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
  if (loading) return <PageState variant="loading" title="Loading challenges…" />

  return (
    <PageShell>
      <PageHeader />
      <StatsGrid allChallenges={filtered} revenue={revenue} />
      <SearchBar onSearch={setSearch} />
      <ChallengesTabs allChallenges={filtered} />
      {filtered.length > 0 && (
        <ChallengePerformanceOverview allChallenges={filtered} topChallenges={filteredTopChallenges} />
      )}
      {filtered.length === 0 && <ModuleEmptyState module="challenges" />}
    </PageShell>
  )
}
