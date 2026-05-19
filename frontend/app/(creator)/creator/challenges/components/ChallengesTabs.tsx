"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ModuleEmptyState } from "@/components/creator-dashboard"
import ChallengeCard from "./ChallengeCard"
import { useState, useMemo } from "react"

interface ChallengesTabsProps {
  allChallenges: any[]
  hasSearchQuery?: boolean
}

export default function ChallengesTabs({ allChallenges, hasSearchQuery = false }: ChallengesTabsProps) {
  const [activeTab, setActiveTab] = useState("all")

  const getChallengeStatus = (challenge: any) => {
    const now = new Date()
    if (challenge.startDate > now) return "upcoming"
    if (challenge.endDate < now) return "completed"
    return "active"
  }

  // Sort challenges: active first, then upcoming, then completed
  const sortedChallenges = useMemo(() => {
    const statusOrder = { active: 0, upcoming: 1, completed: 2 }
    return [...allChallenges].sort((a, b) => {
      const statusA = getChallengeStatus(a)
      const statusB = getChallengeStatus(b)
      // First sort by status
      if (statusOrder[statusA] !== statusOrder[statusB]) {
        return statusOrder[statusA] - statusOrder[statusB]
      }
      // Then sort by start date (most recent first for active/upcoming, oldest first for completed)
      if (statusA === 'completed') {
        return new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
      }
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    })
  }, [allChallenges])

  const filteredChallenges = sortedChallenges.filter((challenge) => {
    const now = new Date()
    if (activeTab === "active")
      return challenge.startDate <= now && challenge.endDate >= now
    if (activeTab === "upcoming") return challenge.startDate > now
    if (activeTab === "completed") return challenge.endDate < now
    return true
  })

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="all">All Challenges ({allChallenges.length})</TabsTrigger>
        <TabsTrigger value="active">
          Active ({allChallenges.filter((c) => getChallengeStatus(c) === "active").length})
        </TabsTrigger>
        <TabsTrigger value="upcoming">
          Upcoming ({allChallenges.filter((c) => getChallengeStatus(c) === "upcoming").length})
        </TabsTrigger>
        <TabsTrigger value="completed">
          Completed ({allChallenges.filter((c) => getChallengeStatus(c) === "completed").length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value={activeTab} className="mt-6">
        {filteredChallenges.length === 0 ? (
          <ModuleEmptyState module="challenges" hasSearchQuery={hasSearchQuery || allChallenges.length > 0} />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {filteredChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
