"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Clock, Star } from "lucide-react"
import { format } from "date-fns"
import { feedbackApi, type Feedback, type FeedbackStats } from "@/lib/api/feedback.api"
import { ReviewForm } from "@/components/reviews/review-form"
import { ReviewsList } from "@/components/reviews/reviews-list"
import { StarRating } from "@/components/reviews/star-rating"

interface ReviewProps {
  userBookings: any[]
}

export default function Review({ userBookings }: ReviewProps) {
  const [reviewDialogTarget, setReviewDialogTarget] = useState<{
    bookingId: string
    sessionId: string
    sessionTitle: string
  } | null>(null)
  const [feedbackBySession, setFeedbackBySession] = useState<
    Record<
      string,
      {
        isLoading: boolean
        reviews: Feedback[]
        stats: FeedbackStats | null
        myReview: Feedback | null
      }
    >
  >({})

  const isBookingReviewEligible = (booking: any) => {
    if (!booking || booking?.status === "cancelled") return false

    if (booking?.status === "completed") return true

    if (booking?.status === "confirmed") {
      const scheduledAt = new Date(booking?.scheduledAt || 0)
      if (Number.isNaN(scheduledAt.getTime())) return false

      const sessionDuration = Number(booking?.session?.duration || booking?.sessionDuration || 60)
      const sessionEnd = new Date(scheduledAt.getTime() + sessionDuration * 60 * 1000)
      return sessionEnd.getTime() <= Date.now()
    }

    return false
  }

  const completedBookings = useMemo(() => {
    return (userBookings || [])
      .filter((booking) => isBookingReviewEligible(booking))
      .sort(
        (a, b) =>
          new Date(b?.scheduledAt || 0).getTime() - new Date(a?.scheduledAt || 0).getTime(),
      )
  }, [userBookings])

  const fetchSessionFeedback = async (sessionId: string) => {
    if (!sessionId) return

    setFeedbackBySession((prev) => ({
      ...prev,
      [sessionId]: {
        isLoading: true,
        reviews: prev[sessionId]?.reviews || [],
        stats: prev[sessionId]?.stats || null,
        myReview: prev[sessionId]?.myReview || null,
      },
    }))

    try {
      const [reviewsData, statsData, myReviewData] = await Promise.allSettled([
        feedbackApi.getByRelated("Session", sessionId),
        feedbackApi.getStats("Session", sessionId),
        feedbackApi.getMyFeedback("Session", sessionId).catch(() => null),
      ])

      setFeedbackBySession((prev) => ({
        ...prev,
        [sessionId]: {
          isLoading: false,
          reviews:
            reviewsData.status === "fulfilled" && Array.isArray(reviewsData.value)
              ? reviewsData.value
              : [],
          stats: statsData.status === "fulfilled" ? statsData.value : null,
          myReview: myReviewData.status === "fulfilled" ? myReviewData.value : null,
        },
      }))
    } catch {
      setFeedbackBySession((prev) => ({
        ...prev,
        [sessionId]: {
          isLoading: false,
          reviews: [],
          stats: null,
          myReview: null,
        },
      }))
    }
  }

  const openReviewDialog = async (booking: any) => {
    const session = booking?.session || {}
    const sessionId = String(session?.id || booking?.sessionId || "").trim()
    if (!sessionId) return

    setReviewDialogTarget({
      bookingId: String(booking?.id || ""),
      sessionId,
      sessionTitle: String(session?.title || "Session"),
    })
    await fetchSessionFeedback(sessionId)
  }

  const handleReviewSubmitted = async () => {
    if (!reviewDialogTarget?.sessionId) return
    await fetchSessionFeedback(reviewDialogTarget.sessionId)
  }

  if (completedBookings.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-12 text-center">
          <Star className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
          <h3 className="mb-2 text-lg font-semibold">No Completed Sessions Yet</h3>
          <p className="text-muted-foreground">
            Complete a session first, then you can leave a review here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {completedBookings.map((booking) => {
        const session = booking?.session || {}
        const sessionId = String(session?.id || booking?.sessionId || "").trim()
        const sessionFeedbackState = sessionId ? feedbackBySession[sessionId] : null
        const myReview = sessionFeedbackState?.myReview
        const stats = sessionFeedbackState?.stats
        const ratingCount = Number(stats?.ratingCount || session?.ratingCount || 0)
        const averageRating = Number(stats?.averageRating || session?.averageRating || 0)

        return (
          <Card key={booking?.id} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{session?.title || "Session"}</h3>
                  <p className="text-sm text-muted-foreground">{session?.description || ""}</p>
                </div>
                <Badge variant="secondary">Completed</Badge>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-2 text-sm text-muted-foreground md:grid-cols-3">
                <div className="flex items-center">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {booking?.scheduledAt ? format(new Date(booking.scheduledAt), "PPP") : "-"}
                </div>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  {session?.duration || 60} min
                </div>
                <div className="flex items-center">
                  <Star className="mr-2 h-4 w-4 text-yellow-500" />
                  {ratingCount > 0
                    ? `${averageRating.toFixed(1)} (${ratingCount} ${ratingCount === 1 ? "review" : "reviews"})`
                    : "No reviews yet"}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full bg-transparent sm:w-auto"
                onClick={() => void openReviewDialog(booking)}
              >
                <Star className="mr-2 h-4 w-4" />
                {myReview ? "Update Review" : "Leave Review"}
              </Button>
            </CardContent>
          </Card>
        )
      })}

      <Dialog
        open={Boolean(reviewDialogTarget)}
        onOpenChange={(open) => {
          if (!open) setReviewDialogTarget(null)
        }}
      >
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-3xl overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg sm:text-xl">
              {reviewDialogTarget?.sessionTitle || "Session"} Reviews
            </DialogTitle>
            <DialogDescription className="text-sm">
              Leave your feedback and see all session reviews.
            </DialogDescription>
          </DialogHeader>

          {reviewDialogTarget && (
            <div className="space-y-6 py-2">
              <div className="rounded-lg border bg-sessions-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Average Rating</p>
                    <p className="text-2xl font-semibold">
                      {Number(
                        feedbackBySession[reviewDialogTarget.sessionId]?.stats?.averageRating || 0,
                      ).toFixed(1)}
                    </p>
                  </div>
                  <div className="text-right">
                    <StarRating
                      rating={Number(
                        feedbackBySession[reviewDialogTarget.sessionId]?.stats?.averageRating || 0,
                      )}
                      size="md"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {Number(
                        feedbackBySession[reviewDialogTarget.sessionId]?.stats?.ratingCount || 0,
                      )}{" "}
                      {Number(
                        feedbackBySession[reviewDialogTarget.sessionId]?.stats?.ratingCount || 0,
                      ) === 1
                        ? "review"
                        : "reviews"}
                    </p>
                  </div>
                </div>
              </div>

              <ReviewForm
                relatedId={reviewDialogTarget.sessionId}
                relatedModel="Session"
                existingReview={feedbackBySession[reviewDialogTarget.sessionId]?.myReview || null}
                onReviewSubmitted={() => void handleReviewSubmitted()}
              />

              <ReviewsList
                reviews={feedbackBySession[reviewDialogTarget.sessionId]?.reviews || []}
                isLoading={feedbackBySession[reviewDialogTarget.sessionId]?.isLoading}
                currentUserId={feedbackBySession[reviewDialogTarget.sessionId]?.myReview?.user?._id}
                emptyMessage="No reviews yet for this session."
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
