"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { MessageSquare, Star, Send, Loader2 } from "lucide-react"
import { feedbackApi, Feedback, FeedbackStats } from "@/lib/api/feedback.api"
import { formatDistanceToNow } from "date-fns"
import { getUserProfileHref } from "@/lib/profile-handle"

interface ProductReviewsProps {
  productId: string
  productMongoId?: string
  onStatsChange?: (stats: { averageRating: number; ratingCount: number }) => void
}

export default function ProductReviews({ productId, productMongoId, onStatsChange }: ProductReviewsProps) {
  const { toast } = useToast()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [myFeedback, setMyFeedback] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [hoverRating, setHoverRating] = useState(0)

  const relatedId = productMongoId || productId

  const loadFeedbackData = useCallback(async () => {
    setLoading(true)
    try {
      const [feedbacksData, statsData, myFeedbackData] = await Promise.all([
        feedbackApi.getByRelated("Product", relatedId).catch(() => []),
        feedbackApi.getStats("Product", relatedId).catch(() => null),
        feedbackApi.getMyFeedback("Product", relatedId).catch(() => null),
      ])

      setFeedbacks(feedbacksData || [])
      setStats(statsData)
      setMyFeedback(myFeedbackData)
      onStatsChange?.({
        averageRating: Number(statsData?.averageRating || 0),
        ratingCount: Number(statsData?.ratingCount || 0),
      })

      if (myFeedbackData) {
        setRating(myFeedbackData.rating)
        setComment(myFeedbackData.comment || "")
      }
    } catch (error) {
      console.error("Failed to load feedback:", error)
      onStatsChange?.({
        averageRating: 0,
        ratingCount: 0,
      })
    } finally {
      setLoading(false)
    }
  }, [onStatsChange, relatedId])

  useEffect(() => {
    if (!relatedId) return
    void loadFeedbackData()
  }, [loadFeedbackData, relatedId])

  const handleSubmitFeedback = async () => {
    if (!relatedId) return

    setSubmitting(true)
    try {
      if (myFeedback) {
        await feedbackApi.update(myFeedback._id, { rating, comment: comment.trim() || undefined })
        toast({
          title: "Review updated",
          description: "Your review has been updated successfully.",
        })
      } else {
        await feedbackApi.create({
          relatedTo: relatedId,
          relatedModel: "Product",
          rating,
          comment: comment.trim() || undefined,
        })
        toast({
          title: "Review submitted",
          description: "Thank you for your feedback!",
        })
      }

      await loadFeedbackData()
    } catch (error: any) {
      toast({
        title: "Failed to submit review",
        description: error?.message || "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return "recently"
    }
  }

  if (loading) {
    return (
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-3 sm:pb-5">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <CardTitle className="text-base sm:text-lg">Product Reviews</CardTitle>
        </div>
        <CardDescription className="mt-1 text-sm sm:mt-2 sm:text-base">
          Rate this product and see what others are saying
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0 pb-5 sm:space-y-6 sm:pb-6">
        <div className="flex items-center justify-center gap-4 rounded-lg bg-gray-50/50 py-3 sm:gap-6">
          <div className="text-center">
            <div className="text-base font-semibold text-primary sm:text-lg">{stats?.ratingCount || 0}</div>
            <div className="text-xs text-muted-foreground">Reviews</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="h-4 w-4 fill-current text-yellow-500" />
              <span className="text-base font-semibold text-primary sm:text-lg">
                {stats?.averageRating?.toFixed(1) || "0.0"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">Rating</div>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-primary-100/50 bg-primary-50/30 p-4">
          <h4 className="text-sm font-medium">{myFeedback ? "Update your review" : "Write a review"}</h4>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={`h-6 w-6 transition-colors ${
                    star <= (hoverRating || rating) ? "fill-current text-yellow-500" : "text-gray-300"
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-muted-foreground">
              {rating} star{rating !== 1 ? "s" : ""}
            </span>
          </div>

          <Textarea
            placeholder="Share your experience with this product..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="resize-none text-sm"
          />

          <Button onClick={handleSubmitFeedback} disabled={submitting} size="sm" className="w-full sm:w-auto">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {myFeedback ? "Update Review" : "Submit Review"}
              </>
            )}
          </Button>
        </div>

        {feedbacks.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Recent Reviews ({feedbacks.length})</h4>
            {feedbacks.slice(0, 5).map((feedback) => {
              const reviewerProfileHref = getUserProfileHref({
                username: (feedback.user as any)?.username,
                name: feedback.user?.name || "Anonymous",
              })

              return (
              <div key={feedback._id} className="flex gap-3 sm:gap-4">
                <Link href={reviewerProfileHref} className="shrink-0 hover:opacity-90 transition-opacity">
                  <Avatar className="mt-1 h-8 w-8 shrink-0 sm:h-10 sm:w-10">
                    <AvatarImage src={feedback.user?.avatar} />
                    <AvatarFallback className="text-xs sm:text-sm">
                      {getInitials(feedback.user?.name || "Anonymous")}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 space-y-2">
                  <div className="rounded-lg bg-gray-50/80 p-3 sm:p-4">
                    <div className="mb-2 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${star <= feedback.rating ? "fill-current text-yellow-500" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                    {feedback.comment && <p className="text-xs leading-relaxed text-foreground sm:text-sm">{feedback.comment}</p>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Link href={reviewerProfileHref} className="font-medium hover:underline">
                      {feedback.user?.name || "Anonymous"}
                    </Link>
                    <span>•</span>
                    <span>{formatTimeAgo(feedback.createdAt)}</span>
                  </div>
                </div>
              </div>
            )})}
          </div>
        ) : (
          <div className="py-6 text-center">
            <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No reviews yet. Be the first to share your experience!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
