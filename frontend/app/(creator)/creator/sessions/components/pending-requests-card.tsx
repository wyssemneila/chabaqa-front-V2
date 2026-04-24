import { AlertCircle, CheckCircle, Users, Video, Plus, ExternalLink, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { sessionsApi, type CreatorBookingViewModel } from "@/lib/api/sessions.api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Link from "next/link";

interface Props { bookings: CreatorBookingViewModel[]; onBookingUpdated?: () => void }

export default function PendingRequestsCard({ bookings, onBookingUpdated }: Props) {
  const { toast } = useToast()
  const [creatingMeet, setCreatingMeet] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const pending = bookings.filter(b => b.status === "pending");
  const confirmed = bookings.filter(b => b.status === "confirmed");
  
  // Show pending if any, otherwise show recent confirmed
  const displayBookings = pending.length > 0 ? pending.slice(0, 3) : confirmed.slice(0, 3);
  const isShowingConfirmed = pending.length === 0 && confirmed.length > 0;

  const accept = async (bookingId: string) => {
    if (!bookingId) {
      toast({ title: 'Error', description: 'Booking ID is missing', variant: 'destructive' })
      return
    }
    setActionLoading(bookingId)
    try {
      await sessionsApi.confirmBooking(bookingId, {})
      toast({ title: 'Booking confirmed' })
      onBookingUpdated?.()
    } catch (e: any) {
      toast({ title: 'Failed to accept', description: e?.message || 'Try again later.', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const decline = async (bookingId: string) => {
    if (!bookingId) {
      toast({ title: 'Error', description: 'Booking ID is missing', variant: 'destructive' })
      return
    }
    setActionLoading(bookingId)
    try {
      await sessionsApi.cancelBooking(bookingId, {})
      toast({ title: 'Booking declined' })
      onBookingUpdated?.()
    } catch (e: any) {
      toast({ title: 'Failed to decline', description: e?.message || 'Try again later.', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleCreateMeet = async (bookingId: string) => {
    if (!bookingId) return;
    
    setCreatingMeet(bookingId);
    try {
      await sessionsApi.createMeet(bookingId);
      toast({
        title: "Meet link created",
        description: "Google Meet link has been created.",
      });
      onBookingUpdated?.();
    } catch (error: any) {
      toast({
        title: "Failed to create Meet link",
        description: error?.message || "Please make sure Google Calendar is connected.",
        variant: "destructive",
      });
    } finally {
      setCreatingMeet(null);
    }
  };

  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            {isShowingConfirmed ? (
              <Users className="h-5 w-5 mr-2 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
            )}
            {isShowingConfirmed ? "Confirmed Bookings" : "Pending Requests"}
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={isShowingConfirmed ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}
            >
              {isShowingConfirmed ? confirmed.length : pending.length}
            </Badge>
            <Button variant="ghost" size="sm" asChild className="h-6 px-2">
              <Link href="/creator/sessions/bookings">
                <ExternalLink className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayBookings.length > 0 ? displayBookings.map((booking) => (
            <div 
              key={booking.id}
              className={`flex items-center space-x-3 p-3 rounded-lg ${isShowingConfirmed ? 'bg-green-50' : 'bg-orange-50'}`}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={booking.userAvatar || "/placeholder.svg"} />
                <AvatarFallback>{(booking.userName || 'U').split(" ").map((n: string) => n[0]).join("")}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{booking.userName || 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">{booking.sessionTitle || 'Session'}</p>
                <p className={`text-xs font-medium ${isShowingConfirmed ? 'text-green-600' : 'text-orange-600'}`}>
                  {new Date(booking.scheduledAt).toLocaleString()}
                </p>
              </div>
              {!isShowingConfirmed ? (
                <div className="flex flex-col space-y-1">
                  <Button size="sm" className="h-6 text-xs" onClick={() => accept(booking.id)} disabled={actionLoading === booking.id}>
                    <CheckCircle className="h-3 w-3 mr-1" /> Accept
                  </Button>
                  <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => decline(booking.id)} disabled={actionLoading === booking.id}>
                    Decline
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {booking.meetingUrl ? (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-6 text-xs"
                        onClick={() => window.open(booking.meetingUrl, '_blank')}
                      >
                        <Video className="h-3 w-3 mr-1" /> Join
                      </Button>
                      <Badge variant="outline" className="text-xs text-green-700 border-green-300 justify-center">
                        <Video className="h-3 w-3 mr-1" /> Meet Ready
                      </Badge>
                    </>
                  ) : (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-6 text-xs"
                        onClick={() => handleCreateMeet(booking.id)}
                        disabled={creatingMeet === booking.id}
                      >
                        {creatingMeet === booking.id ? (
                          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                        ) : (
                          <Plus className="h-3 w-3 mr-1" />
                        )}
                        {booking.meetStatus === 'pending' ? 'Retry Meet' : 'Create Meet'}
                      </Button>
                      {booking.meetStatus === 'pending' && (
                        <Badge variant="outline" className="text-xs text-blue-700 border-blue-300 justify-center">
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Meet Pending
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )) : (
            <div className="text-center py-4">
              <CheckCircle className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No bookings yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </EnhancedCard>
  );
}
