"use client"

import React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CalendarIcon, Clock, Video, Star, Loader2 } from "lucide-react"
import { format, isSameDay } from "date-fns"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { tokenStorage } from "@/lib/token-storage"
import { sessionsApi } from "@/lib/api/sessions.api"
import { feedbackApi, type Feedback, type FeedbackStats } from "@/lib/api/feedback.api"
import { trackingApi } from "@/lib/api/tracking.api"
import { ReviewsList } from "@/components/reviews/reviews-list"
import { StarRating } from "@/components/reviews/star-rating"
import { resolveImageUrl } from "@/lib/resolve-image-url"
import { getUserProfileHref } from "@/lib/profile-handle"

interface AvailableSlot {
  id: string
  startTime: string
  endTime: string
  isAvailable: boolean
  bookedBy?: string
}

interface SessionCardProps {
  session: any
  selectedSession: string
  setSelectedSession: (id: string) => void
}

export default function SessionCard({ session, selectedSession, setSelectedSession }: SessionCardProps) {
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [selectedSlotId, setSelectedSlotId] = useState<string>("")
  const [bookingNotes, setBookingNotes] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [reviewsDialogOpen, setReviewsDialogOpen] = useState(false)
  const [sessionReviews, setSessionReviews] = useState<Feedback[]>([])
  const [sessionReviewStats, setSessionReviewStats] = useState<FeedbackStats | null>(null)
  const [loadingSessionReviews, setLoadingSessionReviews] = useState(false)

  const [promoCode, setPromoCode] = useState("")
  // const [paymentProof, setPaymentProof] = useState<File | null>(null) // Removed
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Available slots from backend
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const pendingToastShown = useRef(false)
  const hasTrackedViewRef = useRef(false)

  const isPaidSession = useMemo(() => Number(session?.price ?? 0) > 0, [session])
  const pendingOrderId = searchParams.get("orderId")
  const paymentAction = searchParams.get("paymentAction")
  const pendingSessionId = searchParams.get("sessionId")
  const sessionFeedbackId = useMemo(
    () => String(session?.id || session?._id || "").trim(),
    [session?.id, session?._id],
  )
  const sessionAverageRating = Number(session?.averageRating ?? session?.mentor?.rating ?? 0)
  const sessionRatingCount = Number(session?.ratingCount ?? session?.mentor?.reviews ?? 0)
  const sessionCoverImage = resolveImageUrl(session?.thumbnail || session?.image) || "/placeholder.svg"
  const mentorProfileHref = getUserProfileHref({
    username: session?.mentor?.username,
    name: session?.mentor?.name || session?.creatorName || "Mentor",
  })
  const isPendingFinalizeForThisSession =
    paymentAction === "choose-slot" &&
    Boolean(pendingOrderId) &&
    (!pendingSessionId ||
      String(pendingSessionId) === String(session?.id) ||
      String(pendingSessionId) === String(session?._id))

  useEffect(() => {
    if (isPendingFinalizeForThisSession && !pendingToastShown.current) {
      pendingToastShown.current = true
      setDialogOpen(true)
      setSelectedSession(session?.id || session?._id || "")
      toast({
        title: "Finalize your booking",
        description: "Payment is complete. Choose a date and time to confirm your session.",
      })
    }
  }, [isPendingFinalizeForThisSession, session?.id, session?._id, setSelectedSession, toast])

  // Fetch available slots when dialog opens
  useEffect(() => {
    if (dialogOpen && session?.id) {
      console.log('[SessionCard] Dialog opened, fetching slots for session:', session.id)
      fetchAvailableSlots()
    }
  }, [dialogOpen, session?.id])

  useEffect(() => {
    if (!dialogOpen) return
    if (hasTrackedViewRef.current) return

    const trackingId = String(session?._id || session?.id || "").trim()
    if (!trackingId) return

    hasTrackedViewRef.current = true
    void trackingApi.trackView("session", trackingId, { source: "session_dialog_open" }).catch(() => undefined)
  }, [dialogOpen, session?._id, session?.id])

  useEffect(() => {
    if (!reviewsDialogOpen || !sessionFeedbackId) {
      return
    }

    const fetchReviews = async () => {
      setLoadingSessionReviews(true)
      try {
        const [reviewsData, statsData] = await Promise.allSettled([
          feedbackApi.getByRelated("Session", sessionFeedbackId),
          feedbackApi.getStats("Session", sessionFeedbackId),
        ])

        setSessionReviews(
          reviewsData.status === "fulfilled" && Array.isArray(reviewsData.value)
            ? reviewsData.value
            : [],
        )
        setSessionReviewStats(statsData.status === "fulfilled" ? statsData.value : null)
      } catch {
        setSessionReviews([])
        setSessionReviewStats(null)
      } finally {
        setLoadingSessionReviews(false)
      }
    }

    void fetchReviews()
  }, [reviewsDialogOpen, sessionFeedbackId])

  const fetchAvailableSlots = async () => {
    setLoadingSlots(true)
    try {
      const sessionId = session?.id || session?._id
      console.log('[SessionCard] Session object:', JSON.stringify(session, null, 2))
      console.log('[SessionCard] Fetching available slots for session ID:', sessionId)
      
      const response: any = await sessionsApi.getAvailableSlots(sessionId)
      console.log('[SessionCard] Raw API response:', JSON.stringify(response, null, 2))
      
      // Handle different response structures
      // Backend returns: { slots: [...], total, available, booked }
      const slotsData = response?.slots || response?.data?.slots || response?.data || []
      const slots = Array.isArray(slotsData) ? slotsData : []
      
      console.log('[SessionCard] Parsed slots count:', slots.length)
      console.log('[SessionCard] Available slots:', slots.filter((s: AvailableSlot) => s.isAvailable).length)
      
      // Set all slots (not just available ones) so we can show booked status too
      setAvailableSlots(slots)
    } catch (error) {
      console.error('[SessionCard] Failed to fetch available slots:', error)
      // If no slots configured, we'll show a message
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  // Get dates that have available slots
  const datesWithSlots = useMemo(() => {
    const dates = availableSlots
      .filter(slot => slot.isAvailable)
      .map(slot => new Date(slot.startTime))
    
    // Remove duplicates by converting to date strings and back
    const uniqueDates = [...new Set(dates.map(d => d.toDateString()))].map(ds => new Date(ds))
    
    console.log('[SessionCard] Dates with available slots:', uniqueDates.length, 'unique dates')
    if (uniqueDates.length > 0) {
      console.log('[SessionCard] First few dates:', uniqueDates.slice(0, 5).map(d => d.toDateString()))
    }
    
    return dates
  }, [availableSlots])

  // Auto-select the first available date when slots are loaded
  useEffect(() => {
    if (availableSlots.length > 0 && datesWithSlots.length > 0) {
      // Find the first available date that's not in the past
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const firstAvailableDate = datesWithSlots.find(d => d >= today)
      if (firstAvailableDate && (!selectedDate || !datesWithSlots.some(d => isSameDay(d, selectedDate)))) {
        console.log('[SessionCard] Auto-selecting first available date:', firstAvailableDate.toISOString())
        setSelectedDate(firstAvailableDate)
      }
    }
  }, [availableSlots, datesWithSlots])

  // Get time slots for the selected date
  const timeSlotsForDate = useMemo(() => {
    if (!selectedDate || availableSlots.length === 0) {
      console.log('[SessionCard] No date selected or no slots available')
      return []
    }
    
    console.log('[SessionCard] Filtering slots for date:', selectedDate.toDateString())
    console.log('[SessionCard] Total slots in state:', availableSlots.length)
    
    const filtered = availableSlots
      .filter(slot => {
        const slotDate = new Date(slot.startTime)
        const sameDay = isSameDay(slotDate, selectedDate)
        const isAvail = slot.isAvailable
        console.log(`[SessionCard] Slot ${slot.id}: ${slotDate.toDateString()} sameDay=${sameDay} isAvailable=${isAvail}`)
        return sameDay && isAvail
      })
      .map(slot => {
        const slotDate = new Date(slot.startTime)
        return {
          id: slot.id,
          time: format(slotDate, 'HH:mm'),
          startTime: slot.startTime,
        }
      })
      .sort((a, b) => a.time.localeCompare(b.time))
    
    console.log('[SessionCard] Filtered slots for selected date:', filtered.length)
    return filtered
  }, [selectedDate, availableSlots])

  const scheduledAt = useMemo(() => {
    if (!selectedDate || !selectedTime) return null
    const [hh, mm] = selectedTime.split(":").map((v) => Number(v))
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null
    const next = new Date(selectedDate)
    next.setHours(hh, mm, 0, 0)
    return next.toISOString()
  }, [selectedDate, selectedTime])

  const handleTimeSelect = (slotId: string, time: string) => {
    setSelectedSlotId(slotId)
    setSelectedTime(time)
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      const accessToken = tokenStorage.getAccessToken()
      if (!accessToken) {
        toast({
          title: "Authentication required",
          description: "Please sign in to book this session.",
          variant: "destructive",
        })
        return
      }

      if (isPendingFinalizeForThisSession && pendingOrderId) {
        const bookingData = {
          scheduledAt: scheduledAt || new Date().toISOString(),
          notes: bookingNotes.trim() || undefined,
          slotId: selectedSlotId || undefined,
        }

        await sessionsApi.finalizePaidSessionBooking(pendingOrderId, bookingData)
        toast({
          title: "Booking confirmed",
          description: "Your paid session has been finalized successfully.",
        })
        router.replace(pathname)
      } else if (isPaidSession) {
        // Only use Stripe Link payment
        try {
          if (!selectedSlotId && !scheduledAt) {
            throw new Error("Please select a date and time slot")
          }

          const bookingData = {
            scheduledAt: scheduledAt || new Date().toISOString(),
            notes: bookingNotes.trim() || undefined,
            // Pass slot ID if available
            slotId: selectedSlotId || undefined
          }
          
          const response: any = await sessionsApi.initStripePayment(
            String(session?.id),
            bookingData,
            promoCode.trim() || undefined
          )

          console.log('[SessionCard] Stripe payment initialized:', response)

          const checkoutUrl = response?.checkoutUrl || response?.data?.checkoutUrl;

          if (checkoutUrl) {
             window.location.href = checkoutUrl
             return
          } else {
            console.error('[SessionCard] No checkoutUrl in response:', response)
            throw new Error("Failed to initialize payment: No checkout URL received")
          }
        } catch (stripeError: any) {
             throw stripeError
        }
      }

      // For free sessions or sessions with available slots, book the slot
      if (selectedSlotId) {
        // Book using slot ID
        const response = await sessionsApi.bookSlot(
          String(session?.id),
          { slotId: selectedSlotId, notes: bookingNotes.trim() || undefined }
        )

        toast({
          title: "Session booked!",
          description: "Your session has been booked successfully. Check your email for details.",
        })
      } else if (scheduledAt) {
        // Fallback to traditional booking if no slot system
        const bookingData = {
          scheduledAt,
          notes: bookingNotes.trim() || undefined,
        }

        const response = await sessionsApi.book(
          String(session?.id), 
          bookingData,
          promoCode.trim() || undefined
        )

        toast({
          title: "Booking requested",
          description: "Your session booking was submitted successfully.",
        })
      } else {
        toast({
          title: "Missing date/time",
          description: "Please select a date and time slot.",
          variant: "destructive",
        })
        return
      }

      // Reset form and close dialog
      setSelectedDate(new Date())
      setSelectedTime("")
      setSelectedSlotId("")
      setBookingNotes("")
      setPromoCode("")
      setDialogOpen(false)
      
    } catch (error: any) {
      const backendMessage =
        error?.originalMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong. Please try again."

      const isSelfBookingError =
        typeof backendMessage === "string" &&
        backendMessage.toLowerCase().includes("réserver votre propre session")

      toast({
        title: isPaidSession ? "Payment submission failed" : "Booking failed",
        description: isSelfBookingError
          ? "Vous ne pouvez pas réserver votre propre session"
          : backendMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card key={session.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <div className="h-40 w-full overflow-hidden rounded-t-lg bg-muted">
        <img
          src={sessionCoverImage}
          alt={session?.title || "Session cover"}
          className="h-full w-full object-cover"
        />
      </div>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight">{session.title}</CardTitle>
            <CardDescription className="mt-2 text-sm">{session.description}</CardDescription>
          </div>
          <Badge variant="secondary" className="bg-sessions-100 text-sessions-700 shrink-0 text-xs">
            {session.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mentor Info */}
        <div className="flex items-center space-x-3">
          <Link href={mentorProfileHref} className="shrink-0 hover:opacity-90 transition-opacity">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={session.mentor?.avatar || "/placeholder.svg"} />
              <AvatarFallback>
                {(session.mentor?.name || 'Mentor')
                  .split(" ")
                  .map((n: any) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={mentorProfileHref} className="font-medium text-sm truncate hover:underline block">
              {session.mentor?.name || 'Mentor'}
            </Link>
            <div className="text-xs text-muted-foreground truncate">{session.mentor?.role || 'Mentor'}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center text-sm">
              <Star className="h-3 w-3 mr-1 text-yellow-500 fill-current" />
              {sessionRatingCount > 0 ? sessionAverageRating.toFixed(1) : "New"}
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {sessionRatingCount} {sessionRatingCount === 1 ? "review" : "reviews"}
            </div>
          </div>
        </div>

        {/* Session Details */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-4 w-4 mr-1 shrink-0" />
            {session.duration} minutes
          </div>
          <div className="flex items-center text-muted-foreground">
            <Video className="h-4 w-4 mr-1 shrink-0" />
            Video call
          </div>
        </div>

        {/* Tags */}
        {session.tags && session.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {session.tags.map((tag: any) => (
              <Badge key={tag} variant="outline" className="text-xs py-0.5 px-2">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Price and Book Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t">
          <div className="text-2xl font-bold text-sessions-600">
            {session.price > 0 ? `${session.price} TND` : 'Free'}
          </div>
          <div className="flex w-full sm:w-auto items-center gap-2">
            <Dialog open={reviewsDialogOpen} onOpenChange={setReviewsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Star className="h-4 w-4 mr-2" />
                  View Reviews
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-lg sm:text-xl">{session.title} Reviews</DialogTitle>
                  <DialogDescription className="text-sm">
                    See what members are saying about this session.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="rounded-lg border bg-sessions-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Average Rating</p>
                        <p className="text-2xl font-semibold">
                          {Number(sessionReviewStats?.averageRating || 0).toFixed(1)}
                        </p>
                      </div>
                      <div className="text-right">
                        <StarRating rating={Number(sessionReviewStats?.averageRating || 0)} size="md" />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {Number(sessionReviewStats?.ratingCount || 0)}{" "}
                          {Number(sessionReviewStats?.ratingCount || 0) === 1 ? "review" : "reviews"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <ReviewsList
                    reviews={sessionReviews}
                    isLoading={loadingSessionReviews}
                    emptyMessage="No reviews yet for this session."
                  />
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-sessions-500 hover:bg-sessions-600 w-full sm:w-auto"
                  onClick={() => setSelectedSession(session.id)}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Book Session
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <DialogHeader className="text-left">
                <DialogTitle className="text-lg sm:text-xl">{session.title}</DialogTitle>
                <DialogDescription className="text-sm">
                  Schedule your session with {session.mentor?.name || 'your mentor'}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 py-4">
                {/* Calendar Section */}
                <div className="space-y-4 order-1">
                  <div>
                    <Label className="text-sm font-medium">Select Date</Label>
                    <div className="mt-2 flex justify-center lg:justify-start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date)
                          setSelectedTime("")
                          setSelectedSlotId("")
                        }}
                        disabled={(date) => {
                          // Disable past dates
                          if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true
                          // If we have slots, only enable dates with available slots
                          if (availableSlots.length > 0) {
                            return !datesWithSlots.some(d => isSameDay(d, date))
                          }
                          return false
                        }}
                        className="rounded-md border w-fit"
                        classNames={{
                          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                          month: "space-y-4",
                          caption: "flex justify-center pt-1 relative items-center text-sm",
                          caption_label: "text-sm font-medium",
                          nav: "space-x-1 flex items-center",
                          nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                          nav_button_previous: "absolute left-1",
                          nav_button_next: "absolute right-1",
                          table: "w-full border-collapse space-y-1",
                          head_row: "flex",
                          head_cell: "text-muted-foreground rounded-md w-8 font-normal text-xs",
                          row: "flex w-full mt-2",
                          cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 h-8 w-8",
                          day: "h-8 w-8 p-0 font-normal text-sm hover:bg-accent hover:text-accent-foreground rounded-md",
                          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                          day_today: "bg-accent text-accent-foreground",
                          day_outside: "text-muted-foreground opacity-50",
                          day_disabled: "text-muted-foreground opacity-50",
                          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                          day_hidden: "invisible",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Time and Details Section */}
                <div className="space-y-4 order-2">
                  <div>
                    <Label className="text-sm font-medium">Available Times</Label>
                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : timeSlotsForDate.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                        {timeSlotsForDate.map((slot) => (
                          <Button
                            key={slot.id}
                            variant={selectedSlotId === slot.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleTimeSelect(slot.id, slot.time)}
                            className="justify-center text-xs h-8"
                          >
                            {slot.time}
                          </Button>
                        ))}
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        <p>No time slots configured yet.</p>
                        <p className="text-xs mt-1">The creator hasn&apos;t set up their availability.</p>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        <p>No available times for this date.</p>
                        <p className="text-xs mt-1">Please select a highlighted date on the calendar.</p>
                        {datesWithSlots.length > 0 && (
                          <p className="text-xs mt-2 text-sessions-600">
                            Next available: {format(datesWithSlots[0], 'EEE, MMM d')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-sm font-medium">
                      Session Notes (Optional)
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="What would you like to focus on in this session?"
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      rows={3}
                      className="mt-2 text-sm resize-none"
                    />
                  </div>

                  {isPaidSession && (
                    <div className="space-y-4">
                      {!isPendingFinalizeForThisSession && (
                        <div className="space-y-2">
                          <Label htmlFor="promoCode" className="text-sm font-medium">Promo code (optional)</Label>
                          <Input
                            id="promoCode"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            placeholder="e.g. WELCOME10"
                            disabled={isSubmitting}
                          />
                        </div>
                      )}

                      {/* Payment proof removed */}
                    </div>
                  )}

                  {/* Session Summary */}
                  <div className="bg-sessions-50 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Session Summary</span>
                    </div>
                    <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span>{session.duration} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Price:</span>
                        <span>{session.price > 0 ? `${session.price} TND` : 'Free'}</span>
                      </div>
                      {selectedDate && selectedTime && (
                        <div className="flex justify-between">
                          <span>Scheduled:</span>
                          <span className="text-right">
                            {format(selectedDate, "MMM dd, yyyy")} at {selectedTime}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleConfirm}
                    disabled={isSubmitting || (!selectedSlotId && !scheduledAt)}
                    className="w-full bg-sessions-500 hover:bg-sessions-600 h-10 text-sm font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isPaidSession ? (
                      isPendingFinalizeForThisSession ? "Finalize Booking" : `Pay with Card - ${session.price} TND`
                    ) : (
                      `Confirm Booking${session.price > 0 ? ` - ${session.price} TND` : ''}`
                    )}
                  </Button>
                </div>
              </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
