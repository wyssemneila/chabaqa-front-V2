"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { StarRating } from "./star-rating"
import { ReviewForm } from "./review-form"
import { ReviewsList } from "./reviews-list"
import { feedbackApi, Feedback, FeedbackStats, CreateFeedbackDto } from "@/lib/api/feedback.api"
import { Star, MessageSquare, Award, ThumbsUp } from "lucide-react"

export type RelatedModel = 'Cours' | 'Community' | 'Challenge' | 'Event' | 'Product' | 'Session'

interface ReviewsSectionProps {
  relatedId: string
  relatedModel: RelatedModel
  showForm?: boolean
  onRefresh?: () => Promise<void>
  title?: string
  description?: string
  emptyMessage?: string
  promptMessage?: string
}

export function ReviewsSection({ 
  relatedId, 
  relatedModel, 
  showForm = true, 
  onRefresh,
  title = "Community Feedback",
  description = "See what our members have to say",
  emptyMessage = "No reviews yet. Be the first to share your thoughts!",
  promptMessage = "Have you experienced this? Share your feedback!"
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Feedback[]>([])
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [myReview, setMyReview] = useState<Feedback | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [reviewsData, statsData, myReviewData] = await Promise.allSettled([
        feedbackApi.getByRelated(relatedModel, relatedId),
        feedbackApi.getStats(relatedModel, relatedId),
        feedbackApi.getMyFeedback(relatedModel, relatedId).catch(() => null),
      ])

      let allReviews: Feedback[] = []
      let myReviewValue: Feedback | null = null

      if (reviewsData.status === "fulfilled" && Array.isArray(reviewsData.value)) {
        allReviews = reviewsData.value
      } else if (reviewsData.status === "fulfilled" && (reviewsData.value as any).data && Array.isArray((reviewsData.value as any).data)) {
         // Handle case where API returns wrapped response { data: [...] }
         allReviews = (reviewsData.value as any).data
      }

      if (myReviewData.status === "fulfilled" && myReviewData.value) {
        myReviewValue = myReviewData.value
      }

      setReviews(allReviews)
      setMyReview(myReviewValue)

      if (statsData.status === "fulfilled") {
        setStats(statsData.value)
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [relatedId, relatedModel])

  const handleReviewSubmitted = async (review: Feedback) => {
    setMyReview(review)
    await new Promise(resolve => setTimeout(resolve, 500))
    await fetchData()
    if (onRefresh) {
      await onRefresh()
    }
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      {stats && (stats.ratingCount > 0 || isLoading) && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              {/* Overall Rating */}
              <div className="text-center md:text-left flex-shrink-0 min-w-[180px]">
                <div className="text-5xl font-bold text-gray-900 tracking-tight mb-2">
                  {stats.averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center md:justify-start mb-2">
                  <StarRating rating={stats.averageRating} size="lg" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Based on {stats.ratingCount} review{stats.ratingCount !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="flex-1 w-full max-w-md space-y-3">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.distribution[star] || 0
                  const percentage = stats.ratingCount > 0 ? (count / stats.ratingCount) * 100 : 0
                  return (
                    <div key={star} className="flex items-center gap-3 group">
                      <div className="flex items-center gap-1 w-12 flex-shrink-0 text-sm font-medium text-gray-600">
                        <span>{star}</span>
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                      </div>
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-400 rounded-full transition-all duration-500 ease-out group-hover:bg-yellow-500"
                          style={{ width: `${percentage}%` }} 
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
                        {percentage > 0 ? `${Math.round(percentage)}%` : '0%'}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Highlights */}
              <div className="hidden lg:flex flex-col gap-4 border-l pl-8 ml-auto min-w-[200px]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Active Community</p>
                    <p className="text-xs text-muted-foreground">Detailed feedback</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg text-green-600">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Verified Reviews</p>
                    <p className="text-xs text-muted-foreground">Authentic experiences</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Form & List Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form (Sticky on Desktop) */}
        {showForm && (
          <div className="lg:col-span-4 lg:order-2 space-y-6">
            <div className="sticky top-6">
              {!myReview && stats && stats.ratingCount > 0 && (
                <Card className="mb-6 bg-primary/5 border-primary/10 shadow-sm">
                  <CardContent className="p-5 flex gap-4 items-start">
                    <div className="p-2 bg-primary/10 rounded-full shrink-0">
                      <ThumbsUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">Your opinion matters!</h4>
                      <p className="text-sm text-primary/80 leading-relaxed">
                        {promptMessage}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
              <ReviewForm
                relatedId={relatedId}
                relatedModel={relatedModel}
                existingReview={myReview}
                onReviewSubmitted={handleReviewSubmitted}
              />
            </div>
          </div>
        )}

        {/* Right Column: Reviews List */}
        <div className={showForm ? "lg:col-span-8 lg:order-1" : "lg:col-span-12"}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h2>
              <p className="text-muted-foreground mt-1">{description}</p>
            </div>
          </div>
          
          <ReviewsList 
            reviews={reviews} 
            isLoading={isLoading}
            currentUserId={myReview?.user?._id}
            emptyMessage={emptyMessage}
          />
        </div>
      </div>
    </div>
  )
}
