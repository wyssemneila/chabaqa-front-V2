"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Star, Clock, Video, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { format, isSameDay, isPast } from "date-fns"
import { getUserProfileHref } from "@/lib/profile-handle"

interface CalendarViewProps {
  sessions: any[]
  userBookings: any[]
}

export default function CalendarView({ sessions, userBookings }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // Get all bookings (not cancelled)
  const allBookings = userBookings?.filter(b => b.status !== 'cancelled') || []
  
  // Separate upcoming and past bookings
  const upcomingBookings = allBookings.filter(b => !isPast(new Date(b.scheduledAt)))
  const pastBookings = allBookings.filter(b => isPast(new Date(b.scheduledAt)))

  // Get booked dates for calendar modifiers
  const bookedDates = allBookings.map(booking => new Date(booking.scheduledAt))
  const upcomingDates = upcomingBookings.map(booking => new Date(booking.scheduledAt))
  const pastDates = pastBookings.map(booking => new Date(booking.scheduledAt))

  // Get sessions for selected date
  const sessionsOnSelectedDate = selectedDate 
    ? allBookings.filter(b => isSameDay(new Date(b.scheduledAt), selectedDate))
    : []

  // Calculate stats
  const sessionsThisMonth = allBookings.filter(b => {
    const scheduledAt = new Date(b.scheduledAt)
    const now = new Date()
    return scheduledAt.getMonth() === now.getMonth() && scheduledAt.getFullYear() === now.getFullYear()
  }).length

  const totalSpent = allBookings.reduce((acc, booking) => {
    // Only count confirmed, completed, or pending (paid but waiting verification)
    // Exclude 'cancelled' which is already filtered out in allBookings
    // Use price paid if available, fallback to session price
    const amount = booking.amountPaid ?? booking.session?.price ?? 0
    return acc + amount
  }, 0)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'pending': return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />
      default: return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700'
      case 'completed': return 'bg-blue-100 text-blue-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Session Calendar</CardTitle>
            <CardDescription>View all your booked sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border w-full"
              modifiers={{
                upcoming: upcomingDates,
                past: pastDates,
              }}
              modifiersStyles={{
                upcoming: { backgroundColor: "#dcfce7", color: "#166534", fontWeight: "bold" },
                past: { backgroundColor: "#e0f2fe", color: "#0369a1", fontWeight: "bold" },
              }}
            />
            
            <div className="flex gap-4 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
                <span>Upcoming</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div>
                <span>Past</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions on selected date */}
        {selectedDate && (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">
                Sessions on {format(selectedDate, "EEEE, MMMM dd, yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessionsOnSelectedDate.length > 0 ? (
                <div className="space-y-4">
                  {sessionsOnSelectedDate.map((booking) => {
                    const session = booking.session
                    const scheduledAt = new Date(booking.scheduledAt)
                    const isUpcoming = !isPast(scheduledAt)
                    const mentor = session?.mentor || {
                      name: session?.creatorName || 'Unknown',
                      avatar: session?.creatorAvatar || undefined,
                    }
                    const mentorProfileHref = getUserProfileHref({
                      username: mentor?.username,
                      name: mentor?.name || session?.creatorName || "Unknown",
                    })

                    return (
                      <div 
                        key={booking.id} 
                        className={`p-4 rounded-lg border ${isUpcoming ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}
                      >
                        <div className="flex items-start gap-4">
                          <Link href={mentorProfileHref} className="shrink-0 hover:opacity-90 transition-opacity">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={mentor.avatar || "/placeholder.svg"} />
                              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-500 text-white">
                                {mentor.name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">{session?.title || 'Session'}</h4>
                              <Badge className={getStatusColor(booking.status)}>
                                {getStatusIcon(booking.status)}
                                <span className="ml-1 capitalize">{booking.status}</span>
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              with{" "}
                              <Link href={mentorProfileHref} className="hover:underline">
                                {mentor.name}
                              </Link>
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{format(scheduledAt, "h:mm a")}</span>
                              </div>
                              <span className="text-muted-foreground">•</span>
                              <span>{session?.duration || 60} minutes</span>
                              {session?.price > 0 && (
                                <>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="font-medium">{session.price} TND</span>
                                </>
                              )}
                            </div>
                            {booking.meetingUrl && isUpcoming && (
                              <a 
                                href={booking.meetingUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:underline"
                              >
                                <Video className="h-4 w-4" />
                                Join Meeting
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No sessions on this date</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        {/* All Sessions List */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">All Sessions ({allBookings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {allBookings.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {allBookings
                  .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
                  .map((booking) => {
                    const session = booking.session
                    const scheduledAt = new Date(booking.scheduledAt)
                    const isUpcoming = !isPast(scheduledAt)
                    const mentor = session?.mentor || {
                      name: session?.creatorName || 'Unknown',
                      avatar: session?.creatorAvatar || undefined,
                    }
                    const mentorProfileHref = getUserProfileHref({
                      username: mentor?.username,
                      name: mentor?.name || session?.creatorName || "Unknown",
                    })

                    return (
                      <div 
                        key={booking.id} 
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          isUpcoming 
                            ? 'bg-green-50 hover:bg-green-100 border border-green-200' 
                            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                        }`}
                        onClick={() => setSelectedDate(scheduledAt)}
                      >
                        <div className="flex items-center gap-3">
                          <Link
                            href={mentorProfileHref}
                            className="shrink-0 hover:opacity-90 transition-opacity"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={mentor.avatar || "/placeholder.svg"} />
                              <AvatarFallback className="text-xs bg-gradient-to-br from-pink-500 to-purple-500 text-white">
                                {mentor.name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{session?.title || 'Session'}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(scheduledAt, "MMM dd, h:mm a")}
                            </div>
                          </div>
                          {getStatusIcon(booking.status)}
                        </div>
                      </div>
                    )
                  })}
              </div>
            ) : (
              <div className="text-center py-6">
                <CalendarIcon className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No sessions booked yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Total Booked</span>
              <span className="font-semibold text-lg">{allBookings.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Upcoming</span>
              <span className="font-medium text-green-600">{upcomingBookings.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Completed</span>
              <span className="font-medium text-blue-600">{pastBookings.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>This Month</span>
              <span className="font-medium">{sessionsThisMonth}</span>
            </div>
            <div className="border-t pt-3 mt-3">
              <div className="flex items-center justify-between text-sm">
                <span>Total Spent</span>
                <span className="font-semibold text-lg">{totalSpent} TND</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Avg Rating Given</span>
              <span className="font-medium flex items-center">
                <Star className="h-4 w-4 mr-1 text-yellow-500 fill-current" />
                4.8
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
