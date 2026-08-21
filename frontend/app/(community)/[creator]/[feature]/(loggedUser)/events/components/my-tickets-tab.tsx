"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, Video, Plus, Ticket, MapPin, Clock, Users, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { TabsContent } from "@/components/ui/tabs";
import { buildGoogleCalendarTemplateUrl } from "@/lib/utils/google-calendar";

interface MyTicketsTabProps {
  myTickets: any[];
  setActiveTab: (tab: string) => void;
  isLoading?: boolean;
  errorMessage?: string | null;
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatTicketPrice(value: unknown): string {
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) return "Free";
  return `${price} TND`;
}

function buildCalendarLocation(registration: any): string | undefined {
  const location = String(registration?.event?.location || "").trim();
  const onlineUrl = String(registration?.event?.onlineUrl || "").trim();

  if (location && onlineUrl) {
    return `${location} | ${onlineUrl}`;
  }
  if (location) return location;
  if (onlineUrl) return onlineUrl;
  return undefined;
}

function buildCalendarDetails(registration: any): string {
  const event = registration?.event || {};
  const ticket = registration?.ticket || {};
  const lines: string[] = [];

  const eventDescription = String(event.description || "").trim();
  if (eventDescription) {
    lines.push(eventDescription);
  }

  const eventNotes = String(event.notes || "").trim();
  if (eventNotes) {
    if (lines.length > 0) lines.push("");
    lines.push(`Notes: ${eventNotes}`);
  }

  const infoLines: string[] = [];
  if (event.category) infoLines.push(`Category: ${event.category}`);
  if (event.type) infoLines.push(`Event Type: ${event.type}`);
  if (event.timezone) infoLines.push(`Timezone: ${event.timezone}`);
  if (event.onlineUrl) infoLines.push(`Online Link: ${event.onlineUrl}`);
  if (event.organizerName) infoLines.push(`Organizer: ${event.organizerName}`);
  if (event.communityName) infoLines.push(`Community: ${event.communityName}`);
  if (infoLines.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push(...infoLines);
  }

  const ticketLines: string[] = [];
  if (ticket.name) ticketLines.push(`Ticket: ${ticket.name}`);
  if (ticket.type) ticketLines.push(`Ticket Type: ${ticket.type}`);
  ticketLines.push(`Ticket Price: ${formatTicketPrice(ticket.price)}`);
  if (registration?.status) ticketLines.push(`Registration Status: ${registration.status}`);
  if (registration?.registeredAt) {
    const registeredAtDate = parseDate(registration.registeredAt);
    if (registeredAtDate) {
      ticketLines.push(`Registered On: ${format(registeredAtDate, "MMM dd, yyyy HH:mm")}`);
    }
  }
  if (ticketLines.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push(...ticketLines);
  }

  if (Array.isArray(event.speakers) && event.speakers.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push("Speakers:");
    event.speakers.slice(0, 8).forEach((speaker: any) => {
      const speakerName = String(speaker?.name || "").trim();
      if (!speakerName) return;
      const speakerTitle = String(speaker?.title || "").trim();
      lines.push(`- ${speakerName}${speakerTitle ? ` (${speakerTitle})` : ""}`);
    });
  }

  if (Array.isArray(event.sessions) && event.sessions.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push("Agenda:");
    event.sessions.slice(0, 12).forEach((session: any) => {
      const sessionTitle = String(session?.title || "").trim();
      if (!sessionTitle) return;
      const sessionStart = String(session?.startTime || "").trim();
      const sessionEnd = String(session?.endTime || "").trim();
      const sessionSpeaker = String(session?.speaker || "").trim();
      const sessionTime =
        sessionStart && sessionEnd
          ? `${sessionStart}-${sessionEnd}`
          : sessionStart || sessionEnd;
      const sessionSuffix = [sessionTime, sessionSpeaker].filter(Boolean).join(" | ");
      lines.push(`- ${sessionTitle}${sessionSuffix ? ` (${sessionSuffix})` : ""}`);
    });
  }

  return lines.join("\n").trim();
}

export default function MyTicketsTab({
  myTickets,
  setActiveTab,
  isLoading = false,
  errorMessage,
}: MyTicketsTabProps) {
  const params = useParams();
  const router = useRouter();
  const tickets = myTickets || [];

  if (isLoading) {
    return (
      <TabsContent value="mytickets" className="space-y-4 sm:space-y-6">
        <div className="space-y-3 sm:space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="border-0 shadow-sm">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-4 w-56" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-40" />
                  <Skeleton className="h-10 w-36" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="mytickets" className="space-y-4 sm:space-y-6">
      {errorMessage && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-3 sm:p-4 text-sm text-amber-900 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </CardContent>
        </Card>
      )}

      {tickets.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          {tickets.map((reg: any) => {
            const eventDate = parseDate(reg.event?.startDate);
            const isInactive = reg?.event?.isActive === false || reg?.event?.isPublished === false;
            const googleCalendarUrl = buildGoogleCalendarTemplateUrl({
              title: reg.event?.title || "Event",
              description: buildCalendarDetails(reg),
              location: buildCalendarLocation(reg),
              startDate: reg.event?.startDate,
              endDate: reg.event?.endDate,
              startTime: reg.event?.startTime,
              endTime: reg.event?.endTime,
              timezone: reg.event?.timezone,
            });

            return (
              <Card key={reg.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold leading-tight truncate pr-2">
                        {reg.event?.title || "Event"}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {reg.ticket?.name || "General Admission"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isInactive && (
                        <Badge variant="outline" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                      <Badge
                        variant={(reg.status || "confirmed") === "confirmed" ? "default" : "secondary"}
                        className="text-xs shrink-0 w-fit"
                      >
                        {reg.status || "confirmed"}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 sm:space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span className="truncate">
                        {eventDate ? format(eventDate, "MMM dd, yyyy") : "Date TBA"}
                      </span>
                      {reg.event?.startTime && (
                        <>
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 shrink-0 ml-1" />
                          <span>{reg.event.startTime}</span>
                        </>
                      )}
                    </div>

                    {reg.event?.location && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        <span className="truncate">{reg.event.location}</span>
                        {reg.event.type && (
                          <Badge variant="outline" className="text-xs ml-auto shrink-0">
                            {reg.event.type}
                          </Badge>
                        )}
                      </div>
                    )}

                    {reg.ticket?.price !== undefined && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="text-xs text-muted-foreground">
                          Ticket Price: {reg.ticket.price} TND
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col xs:flex-row gap-2 xs:gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 xs:flex-none h-9 sm:h-10 text-sm"
                      onClick={() => {
                        const creator = String((params as any)?.creator || "");
                        const feature = String((params as any)?.feature || "");
                        const eventId = reg?.event?.id;
                        if (!creator || !feature || !eventId) return;
                        router.push(`/${creator}/${feature}/events/qr?eventId=${encodeURIComponent(String(eventId))}`);
                      }}
                      disabled={!reg?.event?.id}
                    >
                      <Ticket className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      View QR
                    </Button>

                    {reg.event?.type !== "In-person" && reg.event?.onlineUrl && (
                      <Button asChild className="flex-1 xs:flex-none h-9 sm:h-10 text-sm">
                        <a href={reg.event.onlineUrl} target="_blank" rel="noopener noreferrer">
                          <Video className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                          Join Online Event
                        </a>
                      </Button>
                    )}

                    {googleCalendarUrl ? (
                      <Button asChild variant="outline" size="sm" className="flex-1 xs:flex-none h-9 sm:h-10 text-sm">
                        <a href={googleCalendarUrl} target="_blank" rel="noopener noreferrer">
                          <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                          Add to Google Calendar
                        </a>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="flex-1 xs:flex-none h-9 sm:h-10 text-sm" disabled>
                        <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Calendar Unavailable
                      </Button>
                    )}
                  </div>

                  {reg.event?.speakers && reg.event.speakers.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 sm:hidden">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>
                          {reg.event.speakers.length} speaker{reg.event.speakers.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="text-center py-8 sm:py-12 px-4 sm:px-6">
            <div className="max-w-sm mx-auto">
              <Ticket className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground/50 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">No Tickets Yet</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
                You have not registered for any events yet. Explore our upcoming events to find something interesting!
              </p>
              <Button onClick={() => setActiveTab("available")} className="h-9 sm:h-10 px-6">
                <Plus className="h-4 w-4 mr-2" />
                Browse Events
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tickets.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 text-sm text-muted-foreground">
            <span>
              {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} total
            </span>
            <span className="font-medium text-primary">
              Total spent: {tickets.reduce((acc: number, reg: any) => acc + (Number(reg.ticket?.price) || 0), 0)} TND
            </span>
          </div>
        </div>
      )}
    </TabsContent>
  );
}
