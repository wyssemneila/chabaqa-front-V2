"use client"

import { useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Filter, Zap } from "lucide-react"
import ChallengeCard from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/components/challenge-card"
import { getChallengeStatus } from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/components/challenge-status"
interface Challenge {
  id: string
  title: string
  description: string
  startDate: string | Date
  endDate: string | Date
  isParticipating?: boolean
}

interface ChallengesTabsProps {
  creatorSlug: string
  slug: string
  allChallenges: Challenge[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function ChallengesTabs({
  creatorSlug,
  slug,
  allChallenges,
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab
}: ChallengesTabsProps) {
  const filteredChallenges = useMemo(() => allChallenges.filter((challenge) => {
    const matchesSearch =
      challenge.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      challenge.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const status = getChallengeStatus(challenge)
    const isParticipating = challenge.isParticipating || false

    switch (activeTab) {
      case "active":
        return matchesSearch && status === "active"
      case "upcoming":
        return matchesSearch && status === "upcoming"
      case "completed":
        return matchesSearch && status === "completed"
      case "joined":
        return matchesSearch && isParticipating
      case "browse":
      default:
        return matchesSearch
    }
  }), [allChallenges, searchQuery, activeTab])

  const tabCounts = useMemo(() => ({
    active: allChallenges.filter((c) => getChallengeStatus(c) === "active").length,
    upcoming: allChallenges.filter((c) => getChallengeStatus(c) === "upcoming").length,
    completed: allChallenges.filter((c) => getChallengeStatus(c) === "completed").length,
    joined: allChallenges.filter((c) => c.isParticipating).length,
  }), [allChallenges])

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      {/* Header with tabs + search/filter */}
      <div className="flex flex-col gap-4">
        {/* Scrollable Tabs on mobile */}
        <TabsList className="flex w-full overflow-x-auto scrollbar-hide sm:grid sm:grid-cols-5 lg:w-auto">
          <TabsTrigger value="browse" className="flex-shrink-0">Browse</TabsTrigger>
          <TabsTrigger value="active" className="flex-shrink-0">
            Active ({tabCounts.active})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex-shrink-0">
            Upcoming ({tabCounts.upcoming})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-shrink-0">
            Completed ({tabCounts.completed})
          </TabsTrigger>
          <TabsTrigger value="joined" className="flex-shrink-0">
            Joined ({tabCounts.joined})
          </TabsTrigger>
        </TabsList>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search challenges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon" className="sm:flex-shrink-0">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Challenges Content */}
      <TabsContent value={activeTab} className="space-y-8">
        {filteredChallenges.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="text-center py-12">
              <Zap className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No challenges found</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "No challenges match your current filter"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                creatorSlug={creatorSlug}
                slug={slug}
                challenge={challenge}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
