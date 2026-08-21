import { Sparkles } from "lucide-react";
import { EventRegistration, EventWithTickets } from "@/lib/api/events-community.api";
import { computeEventStartAt } from "@/lib/utils/event-time";

interface EventsHeaderProps {
  availableEvents: EventWithTickets[];
  myTickets: EventRegistration[];
}

export default function EventsHeader({ availableEvents, myTickets }: EventsHeaderProps) {
  const now = new Date();

  // Upcoming means active + published + future start date.
  const upcomingEventsCount = (availableEvents || []).filter((event) => {
    if (!event?.isActive || event?.isPublished === false || !event?.startDate) {
      return false;
    }

    const startDate = computeEventStartAt(event.startDate, event.startTime, event.timezone);
    if (!startDate) {
      return false;
    }

    return startDate >= now;
  }).length;

  // Count actual ticket quantity owned by user, ignoring cancelled registrations.
  const myTicketsCount = (myTickets || []).reduce((total, registration) => {
    if (registration?.status === "cancelled") {
      return total;
    }

    const quantity = Number(registration?.quantity || 1);
    return total + (Number.isFinite(quantity) && quantity > 0 ? quantity : 1);
  }, 0);

  // Prefer attendee count when available, fall back to sold values on ticket types.
  const totalTicketsSold = (availableEvents || []).reduce((acc, event) => {
    if (!event?.isActive || event?.isPublished === false) {
      return acc;
    }

    const soldFromTickets = (event?.tickets || []).reduce((sum, ticket) => {
      const sold = Number(ticket?.sold || 0);
      return sum + (Number.isFinite(sold) && sold > 0 ? sold : 0);
    }, 0);

    const attendeeCount = Number(event?.attendeesCount || 0);
    const normalizedAttendeeCount =
      Number.isFinite(attendeeCount) && attendeeCount > 0 ? attendeeCount : 0;

    return acc + Math.max(soldFromTickets, normalizedAttendeeCount);
  }, 0);

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl p-4 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
        {/* Background circles */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>

        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Events</h1>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-purple-100 text-sm md:ml-4 mt-2 md:mt-0">
          Discover and register for upcoming events
        </p>

        {/* Stats horizontal */}
        <div className="flex space-x-6 mt-4 md:mt-0">
          <div className="text-center">
            <div className="text-xl font-bold">{upcomingEventsCount}</div>
            <div className="text-purple-100 text-xs">Upcoming Events</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{myTicketsCount}</div>
            <div className="text-purple-100 text-xs">My Tickets</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{totalTicketsSold}</div>
            <div className="text-purple-100 text-xs">Tickets Sold</div>
          </div>
        </div>
      </div>
    </div>
  );
}
