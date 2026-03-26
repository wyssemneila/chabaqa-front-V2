"use client"

import { useEffect, useMemo, useState } from "react"
import BackButton from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/[challengeId]/components/BackButton"
import ChallengeHeader from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/[challengeId]/components/ChallengeHeader"
import ChallengeTabs from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/[challengeId]/components/ChallengeTabs"
import { challengesApi } from "@/lib/api/learning/challenges.api"
import { trackChallengeViewOnce } from "@/lib/api/learning/challenge-tracking"

interface ChallengeDetailPageContentProps {
  slug: string
  creatorSlug?: string
  community: any
  challenge: any
  challengeTasks: any[]
}

export default function ChallengeDetailPageContent({ 
  slug, 
  creatorSlug,
  community, 
  challenge, 
  challengeTasks 
}: ChallengeDetailPageContentProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedTaskDay, setSelectedTaskDay] = useState<number | null>(null)
  const [resolvedTasks, setResolvedTasks] = useState<any[]>(challengeTasks || [])
  const [unlockedByTaskId, setUnlockedByTaskId] = useState<
    Record<string, { isUnlocked: boolean; isCompleted: boolean }>
  >({})
  const [submissions, setSubmissions] = useState<any[]>([])
  const [submissionByTaskId, setSubmissionByTaskId] = useState<Record<string, any>>({})
  const [sequentialProgressionEnabled, setSequentialProgressionEnabled] = useState<boolean>(Boolean(challenge?.sequentialProgression))
  const [unlockMessage, setUnlockMessage] = useState<string | undefined>(challenge?.unlockMessage)
  const isUpcoming = useMemo(() => {
    const startAt = new Date(challenge?.startDate || "").getTime()
    return Number.isFinite(startAt) && startAt > Date.now()
  }, [challenge?.startDate])

  useEffect(() => {
    if (!challenge) return
    const trackingId = String(challenge.id || challenge._id || "")
    if (!trackingId) return
    void trackChallengeViewOnce(trackingId)
  }, [challenge])

  useEffect(() => {
    if (isUpcoming) {
      setActiveTab("timeline")
    }
  }, [isUpcoming])

  useEffect(() => {
    const run = async () => {
      if (!challenge || isUpcoming) return
      const id = String(challenge.id || challenge._id || "")
      if (!id) return

      try {
        const response = await challengesApi.getSubmissions(id)
        const payload = (response as any)?.data || response
        const list = Array.isArray(payload) ? payload : []
        setSubmissions(list)
        const byTask: Record<string, any> = {}
        list.forEach((submission: any) => {
          const taskId = String(submission?.taskId || "")
          if (!taskId) return
          if (!byTask[taskId]) byTask[taskId] = submission
        })
        setSubmissionByTaskId(byTask)
      } catch {
        setSubmissions([])
        setSubmissionByTaskId({})
      }
    }

    void run()
  }, [challenge, isUpcoming])

  const handleSubmissionCreated = (submission: any) => {
    if (!submission?.taskId) return
    setSubmissions((prev) => [submission, ...prev])
    setSubmissionByTaskId((prev) => ({
      ...prev,
      [String(submission.taskId)]: submission,
    }))
  }

  useEffect(() => {
    const run = async () => {
      if (!challenge || isUpcoming) return
      const id = String(challenge.id || challenge._id || "")
      if (!id) return

      try {
        const response = await challengesApi.getUnlockedTasks(id)
        const unlockedPayload = (response as any)?.data || response
        const unlockedTasks = ((unlockedPayload as any)?.unlockedTasks || []) as any[]
        const unlockedMap: Record<string, { isUnlocked: boolean; isCompleted: boolean }> = {}
        unlockedTasks.forEach((task: any) => {
          const taskId = String(task?.id || "")
          if (!taskId) return
          unlockedMap[taskId] = {
            isUnlocked: Boolean(task?.isUnlocked),
            isCompleted: Boolean(task?.isCompleted),
          }
        })
        const sequentialEnabled = Boolean((unlockedPayload as any)?.sequentialProgressionEnabled)
        const apiUnlockMessage = (unlockedPayload as any)?.unlockMessage as string | undefined

        setUnlockedByTaskId(unlockedMap)
        setSequentialProgressionEnabled(sequentialEnabled)
        setUnlockMessage(apiUnlockMessage || challenge?.unlockMessage)
      } catch {
        setUnlockedByTaskId({})
        setSequentialProgressionEnabled(Boolean(challenge?.sequentialProgression))
        setUnlockMessage(challenge?.unlockMessage)
      }
    }
    void run()
  }, [challenge, isUpcoming])

  useEffect(() => {
    const tasks = [...(challengeTasks || [])].sort(
      (a: any, b: any) => Number(a?.day || 0) - Number(b?.day || 0),
    )

    const mergedTasks = tasks.map((task: any) => {
      if (isUpcoming) {
        return {
          ...task,
          isUnlocked: false,
          isCompleted: false,
          hasSubmission: false,
          isPendingSubmission: false,
          submissionStatus: undefined,
          isActive: false,
          lockReason: "This challenge has not started yet.",
        }
      }
      const taskId = String(task?.id || "")
      const unlocked = unlockedByTaskId[taskId]
      const submission = submissionByTaskId[taskId]
      const isUnlocked = unlocked ? Boolean(unlocked.isUnlocked) : true
      const isCompleted = unlocked ? Boolean(unlocked.isCompleted) : Boolean(task?.isCompleted)
      const hasSubmission = Boolean(submission)
      const isPendingSubmission = hasSubmission && !isCompleted

      return {
        ...task,
        isUnlocked,
        isCompleted,
        hasSubmission,
        isPendingSubmission,
        submissionStatus: submission?.status,
        lockReason: isUnlocked
          ? undefined
          : (unlockMessage || challenge?.unlockMessage || "Complete the previous task to unlock this one."),
      }
    })

    const activeIndex = mergedTasks.findIndex(
      (task: any) => task.isUnlocked && !task.isCompleted,
    )

    setResolvedTasks(
      mergedTasks.map((task: any, index: number) => ({
        ...task,
        isActive: activeIndex === -1 ? false : index === activeIndex,
      })),
    )
  }, [challengeTasks, unlockedByTaskId, submissionByTaskId, unlockMessage, challenge?.unlockMessage, isUpcoming])

  if (!community || !challenge) {
    return <div>Challenge not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <BackButton slug={slug} creatorSlug={creatorSlug} />
        <ChallengeHeader challenge={challenge} challengeTasks={resolvedTasks} />
        <ChallengeTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          slug={slug}
          challenge={challenge}
          isUpcoming={isUpcoming}
          startDate={challenge.startDate}
          challengeTasks={resolvedTasks}
          selectedTaskDay={selectedTaskDay}
          setSelectedTaskDay={setSelectedTaskDay}
          sequentialProgressionEnabled={sequentialProgressionEnabled}
          unlockMessage={unlockMessage}
          submissions={submissions}
          submissionByTaskId={submissionByTaskId}
          onSubmissionCreated={handleSubmissionCreated}
        />
      </div>
    </div>
  )
}
