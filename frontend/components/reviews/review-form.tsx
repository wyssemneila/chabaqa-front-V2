"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StarRating } from "./star-rating"
import { feedbackApi, Feedback, CreateFeedbackDto } from "@/lib/api/feedback.api"
import { useToast } from "@/components/ui/use-toast"

export type RelatedModel = 'Cours' | 'Community' | 'Challenge' | 'Event' | 'Product' | 'Session'

interface ReviewFormProps {
  relatedId: string
  relatedModel: RelatedModel
  existingReview?: Feedback | null
  onReviewSubmitted?: (review: Feedback) => void
}

export function ReviewForm({ relatedId, relatedModel, existingReview, onReviewSubmitted }: ReviewFormProps) {
  const { toast } = useToast()
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [comment, setComment] = useState(existingReview?.comment || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating)
      setComment(existingReview.comment || "")
    }
  }, [existingReview])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      toast({ title: "Please select a rating", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      let review: Feedback
      if (existingReview?._id) {
        review = await feedbackApi.update(existingReview._id, { rating, comment: comment || undefined })
        toast({ title: "Review updated successfully" })
      } else {
        try {
          review = await feedbackApi.create({
            relatedTo: relatedId,
            relatedModel,
            rating,
            comment: comment || undefined,
          })
          toast({ title: "Review submitted successfully" })
        } catch (createError: any) {
          if (createError?.statusCode === 409 || createError?.message?.includes('already submitted')) {
            const existing = await feedbackApi.getMyFeedback(relatedModel, relatedId)
            if (existing) {
              review = await feedbackApi.update(existing._id, { rating, comment: comment || undefined })
              toast({ title: "Review updated successfully" })
            } else {
              throw createError
            }
          } else {
            throw createError
          }
        }
      }
      onReviewSubmitted?.(review)
    } catch (error: any) {
      toast({
        title: existingReview ? "Failed to update review" : "Failed to submit review",
        description: error?.message || error?.error || "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {existingReview ? "Update Your Review" : "Leave a Review"}
        </CardTitle>
        {existingReview && (
          <p className="text-sm text-muted-foreground">
            You've already reviewed this. You can update your review below.
          </p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Your Rating</label>
            <StarRating
              rating={rating}
              size="lg"
              interactive
              onRatingChange={setRating}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Your Review (optional)</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows={4}
            />
          </div>
          <Button type="submit" disabled={isSubmitting || rating === 0}>
            {isSubmitting ? "Submitting..." : existingReview ? "Update Review" : "Submit Review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
