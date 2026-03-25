"use client"

import React from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/ui/status-badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CalendarIcon, Clock, Coins, Video, MessageSquare, Plus, Star } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/utils/error-messages"
import { feedbackApi, type Feedback, type FeedbackStats } from "@/lib/api/feedback.api"
import { ReviewForm } from "@/components/reviews/review-form"
import { ReviewsList } from "@/components/reviews/reviews-list"
import { StarRating } from "@/components/reviews/star-rating"
import { getUserProfileHref } from "@/lib/profile-handle"
import { useParams, useRouter } from "next/navigation"

interface BookedSessionsProps {
  setActiveTab: (tab: string) => void
  userBookings: any[]
}

export default function BookedSessions({ setActiveTab, userBookings }: BookedSessionsProps) {
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const creator = typeof params?.creator === "string" ? params.creator : Array.isArray(params?.creator) ? params.creator[0] : ""
  const feature = typeof params?.feature === "string" ? params.feature : Array.isArray(params?.feature) ? params.feature[0] : ""
  const [openingChatBookingId, setOpeningChatBookingId] = useState<string | null>(null)
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

  // Filter out cancelled bookings
  const activeBookings = userBookings?.filter(b => 
    b.status !== 'cancelled'
  ) || []

  const getSessionEndTime = (booking: any, session: any): Date => {
    const scheduledAt = new Date(booking?.scheduledAt)
    const durationMinutes = Number(session?.duration || booking?.sessionDuration || 60)
    return new Date(scheduledAt.getTime() + durationMinutes * 60 * 1000)
  }

  const isReviewEligible = (booking: any, session: any): boolean => {
    if (!booking || booking?.status === "cancelled") return false
    if (booking?.status === "completed") return true
    if (booking?.status !== "confirmed") return false
    return Date.now() >= getSessionEndTime(booking, session).getTime()
  }

  const handleMessageMentor = async (booking: any, session: any) => {
    if (booking?.status !== "confirmed") {
      toast({
        title: "Chat unavailable",
        description: "Mentor chat is available only for confirmed bookings.",
        variant: "destructive",
      })
      return
    }

    const sessionEnd = getSessionEndTime(booking, session)
    if (Date.now() >= sessionEnd.getTime()) {
      toast({
        title: "Chat closed",
        description: "This session chat is closed because the session has finished.",
        variant: "destructive",
      })
      return
    }

    try {
      setOpeningChatBookingId(String(booking.id))
      const result = await api.dm.startSessionConversation(String(booking.id))
      const conversationId = result?.conversation?.id
      if (!conversationId) {
        throw new Error("Conversation could not be opened")
      }
      const basePath = creator && feature ? `/${creator}/${feature}` : ""
      router.push(`${basePath}/messages?conversationId=${conversationId}`)
    } catch (error: any) {
      toast({
        title: "Failed to open mentor chat",
        description: getErrorMessage(error) || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setOpeningChatBookingId(null)
    }
  }

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

  const openReviewDialog = (booking: any, session: any) => {
    const sessionId = String(session?.id || booking?.sessionId || "").trim()
    if (!sessionId) return

    setReviewDialogTarget({
      bookingId: String(booking?.id || ""),
      sessionId,
      sessionTitle: String(session?.title || "Session"),
    })
    void fetchSessionFeedback(sessionId)
  }

  const handleReviewSubmitted = async () => {
    if (!reviewDialogTarget?.sessionId) return
    await fetchSessionFeedback(reviewDialogTarget.sessionId)
  }

  if (activeBookings.length > 0) {
    return (
      <div className="space-y-4">
        {activeBookings.map((booking) => {
          const session = booking.session
          const scheduledAt = new Date(booking.scheduledAt)
          const sessionEnd = getSessionEndTime(booking, session)
          const isSessionEnded = Date.now() >= sessionEnd.getTime()
          const canMessageMentor = booking.status === "confirmed" && !isSessionEnded
          const canReview = isReviewEligible(booking, session)
          const isOpeningChat = openingChatBookingId === String(booking.id)
          const sessionId = String(session?.id || booking?.sessionId || "").trim()
          const sessionFeedbackState = sessionId ? feedbackBySession[sessionId] : null
          const hasMyReview = Boolean(sessionFeedbackState?.myReview?._id)
          const mentor = session?.mentor || {
            name: session?.creatorName || 'Unknown',
            avatar: session?.creatorAvatar || undefined,
            role: 'Mentor',
          }
          const mentorProfileHref = getUserProfileHref({
            username: mentor?.username,
            name: mentor?.name || session?.creatorName || "Unknown",
          })

          return (
            <Card key={booking.id} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{session?.title || 'Session'}</h3>
                    <p className="text-muted-foreground">{session?.description || ''}</p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Link href={mentorProfileHref} className="shrink-0 hover:opacity-90 transition-opacity">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={mentor.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {mentor.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div>
                        <Link href={mentorProfileHref} className="font-medium hover:underline">
                          {mentor.name}
                        </Link>
                        <div className="text-sm text-muted-foreground">{mentor.role}</div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        {format(scheduledAt, "EEEE, MMMM dd, yyyy")}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        {format(scheduledAt, "h:mm a")} ({session?.duration || 60} minutes)
                      </div>
                      {session?.price && (
                        <div className="flex items-center">
                          <Coins className="h-4 w-4 mr-2 text-muted-foreground" />{session.price} TND
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {booking.notes && (
                      <div>
                        <h4 className="font-medium mb-2">Session Notes</h4>
                        <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">{booking.notes}</p>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      {booking.status === "confirmed" && booking.meetingUrl && (
                        <Button asChild className="flex-1">
                          <a href={booking.meetingUrl} target="_blank" rel="noopener noreferrer">
                            <Video className="h-4 w-4 mr-2" />
                            Join Meeting
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent"
                        disabled={!canMessageMentor || isOpeningChat}
                        onClick={() => void handleMessageMentor(booking, session)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {isOpeningChat ? "Opening chat..." : "Message Mentor"}
                      </Button>
                    </div>
                    {canReview && sessionId && (
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={() => openReviewDialog(booking, session)}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        {hasMyReview ? "Update Review" : "Leave Review"}
                      </Button>
                    )}
                    {sessionFeedbackState?.stats && sessionFeedbackState.stats.ratingCount > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Session rating: {sessionFeedbackState.stats.averageRating.toFixed(1)} (
                        {sessionFeedbackState.stats.ratingCount}{" "}
                        {sessionFeedbackState.stats.ratingCount === 1 ? "review" : "reviews"})
                      </p>
                    )}
                    {booking.status === "confirmed" && !booking.meetingUrl && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Meeting link is being prepared. It will appear here automatically.
                      </p>
                    )}
                    {booking.status !== "confirmed" && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Mentor chat becomes available once the booking is confirmed.
                      </p>
                    )}
                    {booking.status === "confirmed" && isSessionEnded && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Chat closed after session ended.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        <Dialog
          open={Boolean(reviewDialogTarget)}
          onOpenChange={(open) => {
            if (!open) {
              setReviewDialogTarget(null)
            }
          }}
        >
          <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader className="text-left">
              <DialogTitle className="text-lg sm:text-xl">
                {reviewDialogTarget?.sessionTitle || "Session"} Reviews
              </DialogTitle>
              <DialogDescription className="text-sm">
                Share your experience and view what others said.
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

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="text-center py-12">
        <CalendarIcon className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Sessions Booked</h3>
        <p className="text-muted-foreground mb-6">
          Book your first 1-on-1 session to get personalized guidance
        </p>
        <Button onClick={() => setActiveTab("available")}>
          <Plus className="h-4 w-4 mr-2" />
          Browse Available Sessions
        </Button>
      </CardContent>
    </Card>
  )
}
