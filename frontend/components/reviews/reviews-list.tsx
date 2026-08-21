"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "./star-rating"
import { Feedback } from "@/lib/api/social/feedback.api"
import { formatDistanceToNow } from "date-fns"

interface ReviewsListProps {
  reviews: Feedback[]
  isLoading?: boolean
  currentUserId?: string
  emptyMessage?: string
}

export function ReviewsList({
  reviews,
  isLoading,
  currentUserId,
  emptyMessage = "No reviews yet. Be the first to leave a review!"
}: ReviewsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                  <div className="h-16 w-full bg-gray-200 rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!Array.isArray(reviews)) {
    console.error("ReviewsList: reviews prop is not an array", reviews)
    return null
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        const isOwnReview = currentUserId && review.user?._id === currentUserId
        return (
          <Card key={review._id} className={isOwnReview ? "border-blue-200 bg-blue-50/30" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={review.user?.avatar} />
                  <AvatarFallback>
                    {review.user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{review.user?.name || "Anonymous"}</p>
                      {isOwnReview && (
                        <Badge variant="secondary" className="text-xs">Your review</Badge>
                      )}
                    </div>
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
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
