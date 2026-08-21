"use client"

import { useState, useEffect } from "react"
import HeaderSection from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/components/challenges-header"
import ChallengesTabs from "@/app/(community)/[creator]/[feature]/(loggedUser)/challenges/components/ChallengesTabs"
import { tokenStorage } from "@/lib/token-storage"

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api").replace(/\/$/, "")

interface ChallengesPageContentProps {
  creatorSlug: string
  slug: string
  community: any
  allChallenges: any[]
}

export default function ChallengesPageContent({ creatorSlug, slug, community, allChallenges }: ChallengesPageContentProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("browse")
  const [challenges, setChallenges] = useState(allChallenges)

  // Fetch user participations client-side to properly set isParticipating
  useEffect(() => {
    const fetchParticipations = async () => {
      const token = tokenStorage.getAccessToken()
      
      if (!token) {
        // Even without token, we can check if user is in participants array
        // But we need user ID for that, so skip if no token
        return
      }

      // Get user info from token
      const userInfo = tokenStorage.getUserInfo()
      
      if (!userInfo?.id) {
        return
      }

      // First, try to check participation from the challenge's participants array
      // This works even if the participations API fails
      setChallenges(prevChallenges => 
        prevChallenges.map(challenge => {
          const participants = challenge.participants || []
          const matchingParticipant = participants.find((p: any) => 
            String(p.userId) === String(userInfo.id) ||
            String(p.userId?._id) === String(userInfo.id) ||
            String(p.userId?.id) === String(userInfo.id)
          )
          return {
            ...challenge,
            isParticipating: Boolean(matchingParticipant) || challenge.isParticipating,
            progress: matchingParticipant?.progress ?? challenge.progress ?? 0,
            completedTasks: matchingParticipant?.completedTasks?.length ?? challenge.completedTasks ?? 0,
            joinedAt: matchingParticipant?.joinedAt ?? challenge.joinedAt,
          }
        })
      )

      // Also try to fetch from API for more detailed progress info
      try {
        const response = await fetch(`${API_BASE}/challenges/user/my-participations?communitySlug=${encodeURIComponent(slug)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: "include",
        })

        if (!response.ok) {
          return // Failed to fetch, keep data from participants array
        }
        
        const data = await response.json()
        const participations = data?.participations || data?.data?.participations || []
        
        // Update challenges with participation data
        setChallenges(prevChallenges => 
          prevChallenges.map(challenge => {
            const participation = participations.find((p: any) => 
              String(p.challengeId) === String(challenge.id) || 
              String(p.challengeId) === String(challenge.mongoId) || 
              String(p.challengeId) === String(challenge._id)
            )
            return {
              ...challenge,
              isParticipating: !!participation || challenge.isParticipating,
              progress: participation?.progress || challenge.progress || 0,
              completedTasks: participation?.completedTasks || challenge.completedTasks || 0,
              joinedAt: participation?.joinedAt || challenge.joinedAt,
            }
          })
        )
      } catch (error) {
        console.error('[Challenges Page] Error fetching participations:', error)
      }
    }

    fetchParticipations()
  }, [slug, allChallenges])

  if (!community) {
    return <div>Community not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <HeaderSection allChallenges={challenges} />
        <ChallengesTabs
          creatorSlug={creatorSlug}
          slug={slug}
          allChallenges={challenges}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
    </div>
  )
}
