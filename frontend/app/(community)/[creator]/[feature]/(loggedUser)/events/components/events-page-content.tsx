"use client";

import { useEffect, useMemo, useState } from "react";
import { EventRegistration, EventWithTickets, normalizeEventRegistrations } from "@/lib/api/events-community.api";
import { eventsApi } from "@/lib/api/events.api";
import EventsHeader from "@/app/(community)/[creator]/[feature]/(loggedUser)/events/components/events-header";
import EventsTabs from "@/app/(community)/[creator]/[feature]/(loggedUser)/events/components/events-tabs";
import { computeEventStartAt } from "@/lib/utils/event-time";

interface EventsPageContentProps {
  availableEvents: EventWithTickets[];
  myTickets: EventRegistration[];
  communitySlug: string;
  initialEventId?: string;
}

export default function EventsPageContent({
  availableEvents,
  myTickets,
  communitySlug,
  initialEventId,
}: EventsPageContentProps) {
  const [activeTab, setActiveTab] = useState("available");
  const [tickets, setTickets] = useState<EventRegistration[]>(myTickets || []);
  const [ticketsLoading, setTicketsLoading] = useState<boolean>((myTickets?.length || 0) === 0);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const normalizedCommunitySlug = useMemo(() => {
    try {
      return decodeURIComponent(communitySlug || "").trim();
    } catch {
      return (communitySlug || "").trim();
    }
  }, [communitySlug]);

  useEffect(() => {
    setTickets(myTickets || []);
    setTicketsLoading((myTickets?.length || 0) === 0);
    setTicketsError(null);
  }, [myTickets]);

  useEffect(() => {
    let isMounted = true;

    const fetchRegistrations = async () => {
      try {
        if ((myTickets?.length || 0) === 0) {
          setTicketsLoading(true);
        }

        const response = await eventsApi.getMyRegistrations();
        if (!isMounted) return;

        const normalized = normalizeEventRegistrations(response);
        setTickets(normalized);
        setTicketsError(null);
      } catch (error: any) {
        if (!isMounted) return;
        setTicketsError(error?.message || "Unable to refresh your tickets right now.");
      } finally {
        if (isMounted) {
          setTicketsLoading(false);
        }
      }
    };

    fetchRegistrations();

    return () => {
      isMounted = false;
    };
  }, [communitySlug, myTickets?.length]);

  const communityEventIds = useMemo(
    () => new Set((availableEvents || []).map((event) => String(event.id)).filter(Boolean)),
    [availableEvents]
  );

  const scopedTickets = useMemo(() => {
    return (tickets || []).filter((registration) => {
      const registrationCommunitySlug = registration?.event?.communitySlug;
      if (registrationCommunitySlug && normalizedCommunitySlug) {
        return registrationCommunitySlug === normalizedCommunitySlug;
      }

      const eventId = registration?.event?.id;
      return Boolean(eventId && communityEventIds.has(String(eventId)));
    });
  }, [tickets, normalizedCommunitySlug, communityEventIds]);

  const availableEventsWithRegistration = useMemo(() => {
    const registeredEventIds = new Set(scopedTickets.map((registration) => String(registration?.event?.id)));
    return (availableEvents || []).map((event) => ({
      ...event,
      isRegistered: event.isRegistered || registeredEventIds.has(String(event.id)),
    }));
  }, [availableEvents, scopedTickets]);

  const normalizedTargetEventId = useMemo(() => {
    const value = (initialEventId || "").trim()
    return value.length > 0 ? value : undefined
  }, [initialEventId])

  const targetEvent = useMemo(() => {
    if (!normalizedTargetEventId) return null
    return (
      availableEventsWithRegistration.find((event) => String(event.id) === normalizedTargetEventId) ||
      null
    )
  }, [availableEventsWithRegistration, normalizedTargetEventId])

  const targetEventIsVisible = useMemo(() => {
    if (!targetEvent) return false
    if (!targetEvent.isActive || targetEvent.isPublished === false) return false
    const startAt = computeEventStartAt(targetEvent.startDate, targetEvent.startTime, targetEvent.timezone)
    if (!startAt) return false
    return startAt >= new Date()
  }, [targetEvent])

  const targetEventNotice = useMemo(() => {
    if (!normalizedTargetEventId) return null
    if (!targetEvent) return "The selected event was not found in this community."
    if (!targetEventIsVisible) {
      return "This event is not currently visible here (draft, inactive, or already started)."
    }
    return null
  }, [normalizedTargetEventId, targetEvent, targetEventIsVisible])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <EventsHeader availableEvents={availableEventsWithRegistration} myTickets={scopedTickets} />
        <EventsTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          availableEvents={availableEventsWithRegistration}
          myTickets={scopedTickets}
          ticketsLoading={ticketsLoading}
          ticketsError={ticketsError}
          highlightedEventId={targetEventIsVisible ? normalizedTargetEventId : undefined}
          targetEventNotice={targetEventNotice}
        />
      </div>
    </div>
  );
}
