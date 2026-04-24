import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Event } from "@/lib/models"

interface EventAttendeesTabProps {
  event: Event
}

export default function EventAttendeesTab({ event }: EventAttendeesTabProps) {
  const totalAttendees = event.attendees.length

  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle>Attendees ({totalAttendees})</CardTitle>
        <CardDescription>Manage event attendees and their details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {event.attendees.map((attendee) => (
            <div key={attendee.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  {attendee.user.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-medium">{attendee.user.name}</h4>
                  <p className="text-sm text-muted-foreground">{attendee.user.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="font-semibold">{attendee.ticketType}</div>
                  <div className="text-sm text-muted-foreground">Ticket</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </EnhancedCard>
  )
}
