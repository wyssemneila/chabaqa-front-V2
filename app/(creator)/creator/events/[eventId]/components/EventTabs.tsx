"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Event } from "@/lib/models"
import EventDetailsTab from "./EventDetailsTab"
import EventSessionsTab from "./EventSessionsTab"
import EventAttendeesTab from "./EventAttendeesTab"
import EventTicketsTab from "./EventTicketsTab"
import EventSpeakersTab from "./EventSpeakersTab"
import EventAnalyticsTab from "./EventAnalyticsTab"
import EventSettingsTab from "./EventSettingsTab"

interface EventTabsProps {
  event: Event
  onUpdateEvent: (updates: Partial<Event>) => void
  onSetActive: (isActive: boolean) => Promise<void>
  onTogglePublished: () => Promise<boolean>
  isUpdatingStatus?: boolean
}

export default function EventTabs({
  event,
  onUpdateEvent,
  onSetActive,
  onTogglePublished,
  isUpdatingStatus = false,
}: EventTabsProps) {
  const [activeTab, setActiveTab] = useState("details")

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="w-full">
        <TabsTrigger value="details">Event Details</TabsTrigger>
        <TabsTrigger value="sessions">Sessions</TabsTrigger>
        <TabsTrigger value="attendees">Attendees</TabsTrigger>
        <TabsTrigger value="tickets">Tickets</TabsTrigger>
        <TabsTrigger value="speakers">Speakers</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-6">
        <EventDetailsTab event={event} onUpdateEvent={onUpdateEvent} />
      </TabsContent>

      <TabsContent value="sessions" className="space-y-6">
        <EventSessionsTab event={event} onUpdateEvent={onUpdateEvent} />
      </TabsContent>

      <TabsContent value="attendees" className="space-y-6">
        <EventAttendeesTab event={event} />
      </TabsContent>

      <TabsContent value="tickets" className="space-y-6">
        <EventTicketsTab event={event} onUpdateEvent={onUpdateEvent} />
      </TabsContent>

      <TabsContent value="speakers" className="space-y-6">
        <EventSpeakersTab event={event} onUpdateEvent={onUpdateEvent} />
      </TabsContent>

      <TabsContent value="analytics" className="space-y-6">
        <EventAnalyticsTab event={event} />
      </TabsContent>

      <TabsContent value="settings" className="space-y-6">
        <EventSettingsTab
          event={event}
          onSetActive={onSetActive}
          onTogglePublished={onTogglePublished}
          isUpdatingStatus={isUpdatingStatus}
        />
      </TabsContent>
    </Tabs>
  )
}
