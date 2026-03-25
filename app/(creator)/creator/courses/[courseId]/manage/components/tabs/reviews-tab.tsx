"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StarRating } from "@/components/reviews/star-rating"
import { feedbackApi, Feedback, FeedbackStats } from "@/lib/api/feedback.api"
import { Star, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ReviewsTabProps {
  course: any
}

export function ReviewsTab({ course }: ReviewsTabProps) {
  const [reviews, setReviews] = useState<Feedback[]>([])
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const courseId = course?.mongoId || course?.id

  useEffect(() => {
    if (!courseId) return

    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [reviewsData, statsData] = await Promise.allSettled([
          feedbackApi.getByRelated("Cours", courseId),
          feedbackApi.getStats("Cours", courseId),
        ])

        if (reviewsData.status === "fulfilled") setReviews(reviewsData.value)
        if (statsData.status === "fulfilled") setStats(statsData.value)
      } catch (error) {
        console.error("Failed to fetch reviews:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [courseId])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-24 bg-gray-200 rounded" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold">{stats?.averageRating?.toFixed(1) || "0.0"}</div>
            <StarRating rating={stats?.averageRating || 0} size="md" className="justify-center mt-2" />
            <p className="text-sm text-muted-foreground mt-2">Average Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold">{stats?.ratingCount || 0}</div>
            <MessageSquare className="h-6 w-6 mx-auto mt-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Total Reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium mb-3">Rating Distribution</p>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats?.distribution?.[star] || 0
                const percentage = (stats?.ratingCount || 0) > 0 ? (count / stats!.ratingCount) * 100 : 0
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs w-3">{star}</span>
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    <Progress value={percentage} className="flex-1 h-1.5" />
                    <span className="text-xs text-muted-foreground w-6">{count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>Student Reviews</CardTitle>
          <CardDescription>All reviews from your students</CardDescription>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No reviews yet</p>
              <p className="text-sm mt-1">Reviews will appear here when students leave feedback</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.user?.avatar} />
                    <AvatarFallback>
                      {review.user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{review.user?.name || "Anonymous"}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <StarRating rating={review.rating} size="sm" className="mt-1" />
                    {review.comment && (
                      <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
