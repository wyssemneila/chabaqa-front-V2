
import { Calendar, Video, History, Plus, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { sessionsApi, type CreatorBookingViewModel } from "@/lib/api/sessions.api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Link from "next/link";

interface UpcomingSessionsCardProps {
  bookings: CreatorBookingViewModel[];
  onBookingUpdated?: () => void;
}

export default function UpcomingSessionsCard({ bookings, onBookingUpdated }: UpcomingSessionsCardProps) {
  const { toast } = useToast();
  const [creatingMeet, setCreatingMeet] = useState<string | null>(null);
  
  const now = new Date();
  const upcoming = bookings
    .filter(b => new Date(b.scheduledAt) > now && b.status === "confirmed")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3);
  
  // If no upcoming, show recent past sessions
  const recentPast = bookings
    .filter(b => new Date(b.scheduledAt) <= now && b.status === "confirmed")
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .slice(0, 3);

  const displayBookings = upcoming.length > 0 ? upcoming : recentPast;
  const isShowingPast = upcoming.length === 0 && recentPast.length > 0;

  const handleCreateMeet = async (bookingId: string) => {
    if (!bookingId) return;
    
    setCreatingMeet(bookingId);
    try {
      await sessionsApi.createMeet(bookingId);
      toast({
        title: "Meet link created",
        description: "Google Meet link has been created and calendar event added.",
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
            {isShowingPast ? (
              <History className="h-5 w-5 mr-2 text-muted-foreground" />
            ) : (
              <Calendar className="h-5 w-5 mr-2 text-sessions-500" />
            )}
            {isShowingPast ? "Recent Sessions" : "Upcoming Sessions"}
          </div>
          <div className="flex items-center gap-2">
            {displayBookings.length > 0 && (
              <Badge variant="secondary">{displayBookings.length}</Badge>
            )}
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
            <div key={booking.id} className={`flex items-center space-x-3 p-3 rounded-lg ${isShowingPast ? 'bg-gray-50' : 'bg-sessions-50'}`}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={booking.userAvatar || "/placeholder.svg"} />
                <AvatarFallback>{(booking.userName || 'U').split(" ").map((n: string) => n[0]).join("")}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{booking.userName || 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">{booking.sessionTitle || 'Session'}</p>
                <p className={`text-xs font-medium ${isShowingPast ? 'text-muted-foreground' : 'text-sessions-600'}`}>
                  {new Date(booking.scheduledAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                {booking.meetingUrl ? (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.open(booking.meetingUrl, '_blank')}
                  >
                    <Video className="h-3 w-3 mr-1" /> Join
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline"
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
                )}
                {booking.meetingUrl ? (
                  <Badge variant="outline" className="text-xs text-green-700 border-green-300 justify-center">
                    <Video className="h-3 w-3 mr-1" /> Meet Ready
                  </Badge>
                ) : booking.meetStatus === 'pending' ? (
                  <Badge variant="outline" className="text-xs text-blue-700 border-blue-300 justify-center">
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Meet Pending
                  </Badge>
                ) : booking.meetStatus === 'failed' ? (
                  <Badge variant="outline" className="text-xs text-red-700 border-red-300 justify-center">
                    <AlertCircle className="h-3 w-3 mr-1" /> Meet Failed
                  </Badge>
                ) : null}
                {booking.meetFailureReason && !booking.meetingUrl && (
                  <p className="text-[10px] text-red-600 max-w-[140px] truncate" title={booking.meetFailureReason}>
                    {booking.meetFailureReason}
                  </p>
                )}
              </div>
            </div>
          )) : (
            <div className="text-center py-4">
              <Calendar className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No sessions yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </EnhancedCard>
  );
}
