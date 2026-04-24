"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Calendar, 
  Search, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Video,
  Plus,
  ArrowLeft,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Mail,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { sessionsApi, type CreatorBookingViewModel, type BookingStats } from "@/lib/api/sessions.api"
import { useToast } from "@/hooks/use-toast"
import { googleCalendarApi } from "@/lib/api/google-calendar.api"

interface BookingsPageContentProps {
  bookings: CreatorBookingViewModel[]
  stats: BookingStats | null
  loading: boolean
  page: number
  totalPages: number
  total: number
  statusFilter: string
  timeFilter: string
  searchQuery: string
  onPageChange: (page: number) => void
  onStatusFilterChange: (status: string) => void
  onTimeFilterChange: (time: string) => void
  onSearchChange: (query: string) => void
  onRefresh: () => void
}

const statusConfig = {
  pending: { label: "Pending", color: "bg-orange-100 text-orange-700 border-orange-200", icon: AlertCircle },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle },
  completed: { label: "Completed", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
}

export default function BookingsPageContent({
  bookings,
  stats,
  loading,
  page,
  totalPages,
  total,
  statusFilter,
  timeFilter,
  searchQuery,
  onPageChange,
  onStatusFilterChange,
  onTimeFilterChange,
  onSearchChange,
  onRefresh,
}: BookingsPageContentProps) {
  const { toast } = useToast()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [googleStatus, setGoogleStatus] = useState<{ connected: boolean; hasValidAccess: boolean } | null>(null)

  const checkGoogleStatus = async () => {
    try {
      const response = await googleCalendarApi.getConnectionStatus()
      setGoogleStatus(response.data)
    } catch {
      setGoogleStatus(null)
    }
  }

  useEffect(() => {
    void checkGoogleStatus()
  }, [])

  const handleConfirm = async (bookingId: string) => {
    setActionLoading(bookingId)
    try {
      await sessionsApi.confirmBooking(bookingId, {})
      toast({ title: "Booking confirmed", description: "The booking has been confirmed successfully." })
      onRefresh()
    } catch (error: any) {
      toast({ title: "Failed to confirm", description: error?.message, variant: "destructive" })
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (bookingId: string) => {
    setActionLoading(bookingId)
    try {
      await sessionsApi.cancelBooking(bookingId, {})
      toast({ title: "Booking cancelled", description: "The booking has been cancelled." })
      onRefresh()
    } catch (error: any) {
      toast({ title: "Failed to cancel", description: error?.message, variant: "destructive" })
    } finally {
      setActionLoading(null)
    }
  }

  const handleComplete = async (bookingId: string) => {
    setActionLoading(bookingId)
    try {
      await sessionsApi.completeBooking(bookingId, {})
      toast({ title: "Session completed", description: "The session has been marked as completed." })
      onRefresh()
    } catch (error: any) {
      toast({ title: "Failed to complete", description: error?.message, variant: "destructive" })
    } finally {
      setActionLoading(null)
    }
  }

  const handleCreateMeet = async (bookingId: string) => {
    setActionLoading(bookingId)
    try {
      await sessionsApi.createMeet(bookingId)
      toast({ title: "Meet link created", description: "Google Meet link has been created." })
      onRefresh()
    } catch (error: any) {
      toast({ title: "Failed to create Meet", description: error?.message || "Please connect Google Calendar first.", variant: "destructive" })
      void checkGoogleStatus()
    } finally {
      setActionLoading(null)
    }
  }

  const handleReconnectGoogle = async () => {
    try {
      const response = await googleCalendarApi.getAuthUrl()
      window.open(response.data.authUrl, "_blank", "width=500,height=700")
      toast({
        title: "Reconnect started",
        description: "Complete Google OAuth, then refresh bookings.",
      })
    } catch (error: any) {
      toast({
        title: "Reconnect failed",
        description: error?.message || "Unable to start Google Calendar reconnection.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/creator/sessions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold gradient-text-sessions">All Bookings</h1>
            <p className="text-muted-foreground mt-1">Manage all your session bookings</p>
          </div>
        </div>
        <Button onClick={onRefresh} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-purple-300" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-300" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Confirmed</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-300" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-300" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-50 to-white border-red-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Cancelled</p>
                  <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-300" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-cyan-50 to-white border-cyan-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Upcoming</p>
                  <p className="text-2xl font-bold text-cyan-600">{stats.upcoming}</p>
                </div>
                <Calendar className="h-8 w-8 text-cyan-300" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-50 to-white border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Past</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.past}</p>
                </div>
                <Clock className="h-8 w-8 text-gray-300" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or session..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={timeFilter} onValueChange={onTimeFilterChange} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="all">All Time</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={statusFilter || "all"} onValueChange={(val) => onStatusFilterChange(val === "all" ? "" : val)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Bookings ({total})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sessions-500" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No bookings found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery || statusFilter ? "Try adjusting your filters" : "Bookings will appear here when users book your sessions"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const config = statusConfig[booking.status]
                const StatusIcon = config.icon
                const isPast = !booking.isUpcoming
                const canComplete = booking.status === 'confirmed' && isPast
                const meetStatus = booking.meetStatus || (booking.meetingUrl ? 'created' : 'not_required')
                const showReconnectGoogle = meetStatus === 'failed' && (!googleStatus?.connected || !googleStatus?.hasValidAccess)
                
                return (
                  <div
                    key={booking.id}
                    className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                      booking.isUpcoming ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* User Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-12 w-12 border-2 border-white shadow">
                          <AvatarImage src={booking.userAvatar || "/placeholder.svg"} />
                          <AvatarFallback className="bg-sessions-100 text-sessions-700">
                            {booking.userName?.split(" ").map(n => n[0]).join("") || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate">{booking.userName}</p>
                          {booking.userEmail && (
                            <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {booking.userEmail}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Session Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sessions-700 truncate">{booking.sessionTitle}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {booking.sessionDuration} min
                          </span>
                          <span className="font-medium text-green-600">
                            {booking.sessionPrice} TND
                          </span>
                        </div>
                      </div>

                      {/* Date/Time */}
                      <div className="text-center lg:text-right min-w-[140px]">
                        <p className={`font-medium ${booking.isUpcoming ? 'text-sessions-600' : 'text-muted-foreground'}`}>
                          {formatDate(booking.scheduledAt)}
                        </p>
                        <p className="text-sm text-muted-foreground">{formatTime(booking.scheduledAt)}</p>
                        {booking.isUpcoming && (
                          <Badge variant="outline" className="mt-1 text-xs bg-cyan-50 text-cyan-700 border-cyan-200">
                            Upcoming
                          </Badge>
                        )}
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2">
                        <Badge className={`${config.color} border`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                        {meetStatus === 'created' && (
                          <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50">
                            <Video className="h-3 w-3 mr-1" />
                            Meet Ready
                          </Badge>
                        )}
                        {meetStatus === 'pending' && (
                          <Badge variant="outline" className="text-xs text-blue-700 border-blue-300 bg-blue-50">
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Meet Pending
                          </Badge>
                        )}
                        {meetStatus === 'failed' && (
                          <Badge variant="outline" className="text-xs text-red-700 border-red-300 bg-red-50">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Meet Failed
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {booking.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleConfirm(booking.id)}
                              disabled={actionLoading === booking.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {actionLoading === booking.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Confirm
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancel(booking.id)}
                              disabled={actionLoading === booking.id}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              Decline
                            </Button>
                          </>
                        )}
                        
                        {booking.status === 'confirmed' && (
                          <>
                            {booking.meetingUrl ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(booking.meetingUrl, '_blank')}
                              >
                                <Video className="h-4 w-4 mr-1" />
                                Join Meet
                              </Button>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCreateMeet(booking.id)}
                                  disabled={actionLoading === booking.id}
                                >
                                  {actionLoading === booking.id ? (
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                                  ) : (
                                    <Plus className="h-4 w-4 mr-1" />
                                  )}
                                  {meetStatus === 'pending' ? 'Retry Meet' : 'Create Meet'}
                                </Button>
                                {showReconnectGoogle && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleReconnectGoogle}
                                    className="text-amber-700 border-amber-300 hover:bg-amber-50"
                                  >
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    Reconnect Google
                                  </Button>
                                )}
                              </>
                            )}
                            {canComplete && (
                              <Button
                                size="sm"
                                onClick={() => handleComplete(booking.id)}
                                disabled={actionLoading === booking.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Mark Complete
                              </Button>
                            )}
                            {!isPast && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancel(booking.id)}
                                disabled={actionLoading === booking.id}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                Cancel
                              </Button>
                            )}
                          </>
                        )}

                        {booking.meetingUrl && booking.status !== 'cancelled' && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                            <Video className="h-3 w-3 mr-1" />
                            Has Meet
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {booking.notes && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Notes:</span> {booking.notes}
                        </p>
                      </div>
                    )}
                    {booking.meetFailureReason && !booking.meetingUrl && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-red-600">
                          <span className="font-medium">Meet Error:</span> {booking.meetFailureReason}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
