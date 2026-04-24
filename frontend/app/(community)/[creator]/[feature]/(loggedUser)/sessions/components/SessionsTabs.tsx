"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"
import AvailableSessions from "@/app/(community)/[creator]/[feature]/(loggedUser)/sessions/components/AvailableSessions"
import BookedSessions from "@/app/(community)/[creator]/[feature]/(loggedUser)/sessions/components/BookedSessions"
import CalendarView from "@/app/(community)/[creator]/[feature]/(loggedUser)/sessions/components/CalendarView"
import Review from "@/app/(community)/[creator]/[feature]/(loggedUser)/sessions/components/review"

interface SessionsTabsProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  sessions: any[]
  userBookings: any[]
}

export default function SessionsTabs({ 
  activeTab, 
  setActiveTab, 
  sessions, 
  userBookings 
}: SessionsTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
      <div className="flex items-center justify-between">
        <TabsList className="grid w-full max-w-xl grid-cols-4">
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="booked">My Sessions</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
        </TabsList>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      <TabsContent value="available" className="space-y-6">
        <AvailableSessions sessions={sessions} />
      </TabsContent>

      <TabsContent value="booked" className="space-y-6">
        <BookedSessions setActiveTab={setActiveTab} userBookings={userBookings} />
      </TabsContent>

      <TabsContent value="calendar" className="space-y-6">
        <CalendarView sessions={sessions} userBookings={userBookings} />
      </TabsContent>

      <TabsContent value="review" className="space-y-6">
        <Review userBookings={userBookings} />
      </TabsContent>
    </Tabs>
  )
}
