"use client"

import React from 'react'
import { useState, useEffect } from "react"
import { Loader2, AlertCircle, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CommunityReviewsSection } from "@/components/reviews/community-reviews-section"
import { communitiesApi } from "@/lib/api/communities.api"
import { StarRating } from "@/components/reviews/star-rating"
import { feedbackApi, FeedbackStats } from "@/lib/api/feedback.api"

interface Community {
  id: string;
  _id?: string;
  name: string;
  averageRating?: number;
  ratingCount?: number;
}

export default function CommunityReviewsPage({ params }: { params: Promise<{ creator?: string; feature: string }> }) {
  const resolvedParams = React.use(params)
  const { creator, feature } = resolvedParams

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [community, setCommunity] = useState<Community | null>(null)
  const [stats, setStats] = useState<FeedbackStats | null>(null)

  const fetchCommunity = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await communitiesApi.getBySlug(feature)
      const communityData = response.data
      setCommunity(communityData)

      const communityId = communityData?._id || communityData?.id
      if (communityId) {
        const statsData = await feedbackApi.getStats('Community', String(communityId))
        setStats(statsData)
      } else {
        setStats(null)
      }
    } catch (err: any) {
      console.error('Error fetching community:', err)
      setError(err.message || 'Failed to load community')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCommunity()
  }, [feature])

  const handleRefresh = async () => {
    await fetchCommunity()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-500 mb-4" />
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    )
  }

  if (error || !community) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load reviews</h2>
          <p className="text-gray-600 mb-4">{error || 'Community not found'}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  const communityId = community._id || community.id
  const averageRating = stats?.averageRating ?? community.averageRating ?? 0
  const ratingCount = stats?.ratingCount ?? community.ratingCount ?? 0
  const distribution = stats?.distribution ?? {}
  const fiveStarCount =
    Number(distribution[5] ?? distribution["5"] ?? 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="bg-gradient-to-r from-lime-600 to-green-500 rounded-xl p-4 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>

            <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-3">
              <div className="flex items-center space-x-2">
                <Star className="h-6 w-6" />
                <h1 className="text-2xl font-bold">{community.name} Reviews</h1>
              </div>
              <div className="flex items-center gap-3">
                {averageRating > 0 ? (
                  <>
                    <StarRating rating={averageRating} size="sm" />
                    <span className="text-sm font-semibold">{averageRating.toFixed(1)}</span>
                    <span className="text-lime-100 text-xs">
                      ({ratingCount} {ratingCount === 1 ? 'review' : 'reviews'})
                    </span>
                  </>
                ) : (
                  <span className="text-lime-100 text-sm">No reviews yet</span>
                )}
              </div>
            </div>

            <p className="text-lime-100 text-sm md:ml-4 mt-2 md:mt-0">
              See what members think about {community.name}
            </p>

            <div className="flex space-x-6 mt-4 md:mt-0">
              <div className="text-center">
                <div className="text-xl font-bold">{averageRating > 0 ? averageRating.toFixed(1) : "0.0"}</div>
                <div className="text-lime-100 text-xs">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{ratingCount}</div>
                <div className="text-lime-100 text-xs">Total Reviews</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{fiveStarCount}</div>
                <div className="text-lime-100 text-xs">5-Star Reviews</div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <CommunityReviewsSection 
          communityId={communityId} 
          showForm={true}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  )
}
