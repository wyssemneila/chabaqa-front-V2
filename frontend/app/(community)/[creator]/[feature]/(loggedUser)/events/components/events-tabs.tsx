"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import AvailableEventsTab from "@/app/(community)/[creator]/[feature]/(loggedUser)/events/components/available-events-tab";
import MyTicketsTab from "@/app/(community)/[creator]/[feature]/(loggedUser)/events/components/my-tickets-tab";
import CalendarTab from "@/app/(community)/[creator]/[feature]/(loggedUser)/events/components/calendar-tab";
import { EventWithTickets } from "@/lib/api/events-community.api";

interface EventsTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  availableEvents: EventWithTickets[];
  myTickets: any[];
  ticketsLoading: boolean;
  ticketsError?: string | null;
  highlightedEventId?: string;
  targetEventNotice?: string | null;
}

export default function EventsTabs({
  activeTab,
  setActiveTab,
  availableEvents,
  myTickets,
  ticketsLoading,
  ticketsError,
  highlightedEventId,
  targetEventNotice,
}: EventsTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
      <div className="flex items-center justify-between">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="mytickets">My Tickets</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      <AvailableEventsTab
        availableEvents={availableEvents}
        highlightedEventId={highlightedEventId}
        targetEventNotice={targetEventNotice}
      />
      <MyTicketsTab
        myTickets={myTickets}
        setActiveTab={setActiveTab}
        isLoading={ticketsLoading}
        errorMessage={ticketsError}
      />
      <CalendarTab
        myTickets={myTickets}
        availableEvents={availableEvents}
        isLoading={ticketsLoading}
        errorMessage={ticketsError}
      />
    </Tabs>
  );
}
