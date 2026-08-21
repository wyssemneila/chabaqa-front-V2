import React from 'react'
import { notFound } from 'next/navigation'
import ChallengeDetailPageContent from '@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/[challengeId]/components/ChallengeDetailPageContent'
import { challengesApi } from '@/lib/api/challenges.api'
import { communitiesApi } from '@/lib/api/communities.api'

// Always fetch fresh data — prevents Next.js from caching stale challenge tasks
export const dynamic = 'force-dynamic'

export default async function ChallengeDetailPage({
  params
}: {
  params: Promise<{ creator: string, feature: string, challengeId: string }>
}) {
  const { creator, feature, challengeId } = await params

  try {
    // Fetch community and challenge data in parallel
    const [communityResponse, challengeResponse] = await Promise.all([
      communitiesApi.getBySlug(feature).catch(() => null),
      challengesApi.getById(challengeId).catch(() => null),
    ])

    const community = (communityResponse as any)?.data || communityResponse
    const challenge = (challengeResponse as any)?.data || challengeResponse

    if (!community || !challenge) {
      notFound()
    }

    const creatorRaw = challenge.creatorId
    const creatorId =
      typeof creatorRaw === 'string'
        ? creatorRaw
        : creatorRaw?._id || creatorRaw?.id || creatorRaw

    // Transform challenge data for the component
    const transformedChallenge = {
      id: challenge.id || challenge._id,
      title: challenge.title || '',
      description: challenge.description || '',
      thumbnail: challenge.thumbnail || challenge.image || null,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      depositAmount: challenge.depositAmount || challenge.pricing?.depositAmount || 0,
      completionReward: challenge.completionReward || challenge.pricing?.completionReward || 0,
      difficulty: challenge.difficulty || 'medium',
      category: challenge.category || 'General',
      duration: challenge.duration || calculateDuration(challenge.startDate, challenge.endDate),
      participantCount: challenge.participantCount || challenge.participants?.length || 0,
      participants: (challenge.participants || []).map((p: any, index: number) => ({
        id: p.id || p._id || index,
        oderId: p.oderId || p.id,
        userId: p.userId?._id || p.userId,
        // Backend returns userName and userAvatar, fallback to nested userId object
        name: p.userName || p.userId?.name || p.name || 'Participant',
        avatar: p.userAvatar || p.userId?.avatar || p.userId?.profile_picture || p.avatar,
        score: p.totalPoints || p.score || 0,
        progress: p.progress || 0,
        completedTasks: p.completedTasks || [],
        joinedAt: p.joinedAt,
        streak: p.streak || 0,
        isActive: p.isActive !== false,
      })),
      tasks: (challenge.tasks || []).map((t: any, index: number) => {
        const taskId = String(t.id || t._id || "")
        return {
          id: taskId,
          day: t.day || t.ordre || t.order || index + 1,
          title: t.title || `Task ${index + 1}`,
          description: t.description || '',
          points: t.points || 10,
          order: t.ordre || t.order || index,
          dueDate: t.dueDate,
          deliverable: t.deliverable || t.description || '',
          instructions: t.instructions || t.description || '',
          resources: (t.resources || []).map((r: any, resourceIndex: number) => ({
            id: r._id || r.id || `${taskId}-resource-${resourceIndex}`,
            title: r.title || r.name || 'Resource',
            type: r.type || 'link',
            url: r.url || r.link || '#',
            description: r.description || "",
          })),
          notes: t.notes || '',
          isActive: t.isActive ?? false,
          isCompleted: t.isCompleted ?? false,
        }
      }),
      resources: (challenge.resources || []).map((r: any, resourceIndex: number) => ({
        id: r._id || r.id || `resource-${resourceIndex}`,
        title: r.title || r.name || 'Resource',
        type: r.type || 'link',
        url: r.url || r.link || '#',
        description: r.description || "",
      })),
      rules: challenge.rules || [],
      prizes: challenge.prizes || [],
      creator: challenge.creatorId ? {
        id: creatorId,
        name: typeof creatorRaw === 'string'
          ? challenge.creatorName || 'Creator'
          : creatorRaw?.name || challenge.creatorName || 'Creator',
        avatar: typeof creatorRaw === 'string'
          ? challenge.creatorAvatar
          : creatorRaw?.avatar || creatorRaw?.profile_picture || challenge.creatorAvatar,
      } : null,
      communityId: challenge.communityId,
      isActive: challenge.isActive !== false,
      sequentialProgression: challenge.sequentialProgression || false,
      unlockMessage: challenge.unlockMessage,
      notes: challenge.notes || '',
    }

    return (
      <ChallengeDetailPageContent
        slug={feature}
        creatorSlug={creator}
        community={community}
        challenge={transformedChallenge}
        challengeTasks={transformedChallenge.tasks}
      />
    )
  } catch (error) {
    console.error('[Challenge Detail] Error loading challenge:', error)
    notFound()
  }
}

function calculateDuration(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return ''
  const start = new Date(startDate)
  const end = new Date(endDate)
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return `${days} days`
}
