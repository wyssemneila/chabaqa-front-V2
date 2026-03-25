"use client"

import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Ticket, TrendingUp, Coins } from "lucide-react"
import { Event } from "@/lib/models"

interface EventAnalyticsTabProps {
  event: Event
}

export default function EventAnalyticsTab({ event }: EventAnalyticsTabProps) {
  const totalAttendees = event.attendees.length
  const totalRevenue = event.tickets.reduce((acc, ticket) => acc + (ticket.price * ticket.sold), 0)
  const averageAttendance = event.sessions.reduce((acc, s) => acc + (s.attendance || 0), 0) / event.sessions.length || 0
  const sessionAttendance = (Array.isArray(event.sessions) ? event.sessions : []).map((session) => ({
    id: session.id,
    title: session.title || "Untitled Session",
    attendance: Number(session.attendance ?? 0),
  }))
  const maxSessionAttendance = Math.max(1, ...sessionAttendance.map((session) => session.attendance))
  const maxTicketSales = Math.max(1, ...event.tickets.map((ticket) => Number(ticket.sold ?? 0)))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <EnhancedCard>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalAttendees}</p>
                <p className="text-sm text-muted-foreground">Total Attendees</p>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Ticket className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{event.tickets.reduce((acc, t) => acc + t.sold, 0)}</p>
                <p className="text-sm text-muted-foreground">Tickets Sold</p>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{Math.round(averageAttendance)}%</p>
                <p className="text-sm text-muted-foreground">Avg Attendance</p>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Coins className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{totalRevenue} TND</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnhancedCard>
          <CardHeader>
            <CardTitle>Attendance Trends</CardTitle>
            <CardDescription>Track attendee engagement over time</CardDescription>
          </CardHeader>
          <CardContent>
            {sessionAttendance.length > 0 ? (
              <div className="space-y-4">
                {sessionAttendance.map((session) => {
                  const percentage = Math.min(100, Math.round((session.attendance / maxSessionAttendance) * 100))
                  return (
                    <div key={session.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate pr-3">{session.title}</span>
                        <span className="text-muted-foreground">{session.attendance} attendees</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <p>No session attendance data available.</p>
              </div>
            )}
          </CardContent>
        </EnhancedCard>

        <EnhancedCard>
          <CardHeader>
            <CardTitle>Ticket Sales</CardTitle>
            <CardDescription>See which tickets are most popular</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {event.tickets.slice(0, 5).map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between">
                  <span className="text-sm">
                    {ticket.name} ({ticket.type})
                  </span>
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const sold = Number(ticket.sold ?? 0)
                      const quantity = typeof ticket.quantity === "number" && ticket.quantity > 0 ? ticket.quantity : null
                      const width = quantity
                        ? Math.min(100, (sold / quantity) * 100)
                        : Math.min(100, (sold / maxTicketSales) * 100)

                      return (
                        <>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-events-500 h-2 rounded-full"
                              style={{ width: `${width}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {quantity ? `${sold}/${quantity}` : `${sold} sold`}
                          </span>
                        </>
                      )
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </EnhancedCard>
      </div>
    </div>
  )
}
