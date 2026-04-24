"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import OverviewTab from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/[challengeId]/components/OverviewTab"
import TimelineTab from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/[challengeId]/components/TimelineTab"
import LeaderboardTab from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/[challengeId]/components/LeaderboardTab"
import SubmissionsTab from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/[challengeId]/components/SubmissionsTab"
import { Lock } from "lucide-react"

interface ChallengeTabsProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  slug: string
  challenge: any
  isUpcoming: boolean
  startDate: string | Date
  challengeTasks: any[]
  selectedTaskDay: number | null
  setSelectedTaskDay: (day: number | null) => void
  sequentialProgressionEnabled?: boolean
  unlockMessage?: string
  submissions: any[]
  submissionByTaskId: Record<string, any>
  onSubmissionCreated: (submission: any) => void
}

export default function ChallengeTabs({
  activeTab,
  setActiveTab,
  slug,
  challenge,
  isUpcoming,
  startDate,
  challengeTasks,
  selectedTaskDay,
  setSelectedTaskDay,
  sequentialProgressionEnabled = false,
  unlockMessage,
  submissions,
  submissionByTaskId,
  onSubmissionCreated,
}: ChallengeTabsProps) {
  const startDateLabel = new Date(startDate).toLocaleString()

  const LockedPanel = () => (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-amber-500" />
          Challenge Not Started Yet
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Details are locked until the official start time.
          <div className="mt-2 font-medium">Starts on: {startDateLabel}</div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
      <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        <TabsTrigger value="submissions">My Work</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-8">
        {isUpcoming ? (
          <LockedPanel />
        ) : (
          <OverviewTab 
            challenge={challenge} 
            challengeTasks={challengeTasks} 
            selectedTaskDay={selectedTaskDay} 
            setSelectedTaskDay={setSelectedTaskDay}
            sequentialProgressionEnabled={sequentialProgressionEnabled}
            unlockMessage={unlockMessage}
            submissionByTaskId={submissionByTaskId}
            onSubmissionCreated={onSubmissionCreated}
          />
        )}
      </TabsContent>

      <TabsContent value="timeline" className="space-y-6">
        <TimelineTab 
          challengeTasks={challengeTasks} 
          isUpcoming={isUpcoming}
          setSelectedTaskDay={setSelectedTaskDay}
          sequentialProgressionEnabled={sequentialProgressionEnabled}
          unlockMessage={unlockMessage}
          submissionByTaskId={submissionByTaskId}
        />
      </TabsContent>

      <TabsContent value="leaderboard" className="space-y-6">
        {isUpcoming ? <LockedPanel /> : <LeaderboardTab challenge={challenge} />}
      </TabsContent>

      <TabsContent value="submissions" className="space-y-6">
        {isUpcoming ? (
          <LockedPanel />
        ) : (
          <SubmissionsTab 
            challengeTasks={challengeTasks} 
            submissions={submissions}
            submissionByTaskId={submissionByTaskId}
          />
        )}
      </TabsContent>
    </Tabs>
  )
}
