"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, Calendar as CalendarLucide, TrendingUp, Ticket, Coins, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { TabsContent } from "@/components/ui/tabs";

interface CalendarTabProps {
  myTickets: any[];
  availableEvents: any[];
  isLoading?: boolean;
  errorMessage?: string | null;
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function CalendarSkeleton() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4 sm:gap-6 lg:gap-8">
      <div className="space-y-4 sm:space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 sm:pb-6">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="pt-0">
            <Skeleton className="h-80 w-full rounded-md" />
            <div className="mt-4 flex gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-36" />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-4 sm:space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 sm:pb-6">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CalendarTab({
  myTickets,
  availableEvents,
  isLoading = false,
  errorMessage,
}: CalendarTabProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const tickets = myTickets || [];
  const events = availableEvents || [];

  const bookedDates = useMemo(() => {
    return tickets
      .map((reg: any) => parseDate(reg.event?.startDate))
      .filter((date): date is Date => Boolean(date));
  }, [tickets]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return tickets.filter((ticket: any) => {
      const startDate = parseDate(ticket.event?.startDate);
      return Boolean(startDate && startDate > now);
    });
  }, [tickets]);

  const totalSpent = tickets.reduce((acc: number, reg: any) => acc + (Number(reg.ticket?.price) || 0), 0);

  return (
    <TabsContent value="calendar" className="space-y-4 sm:space-y-6">
      {isLoading ? (
        <CalendarSkeleton />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4 sm:gap-6 lg:gap-8">
          <div className="space-y-4 sm:space-y-6">
            {errorMessage && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-3 sm:p-4 text-sm text-amber-900 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </CardContent>
              </Card>
            )}

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 sm:pb-6">
                <div className="flex items-center gap-2">
                  <CalendarLucide className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <CardTitle className="text-base sm:text-lg">Event Calendar</CardTitle>
                </div>
                <CardDescription className="text-sm sm:text-base">
                  View all your registered events and plan ahead
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-center lg:justify-start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border w-fit"
                    modifiers={{ booked: bookedDates }}
                    modifiersStyles={{
                      booked: {
                        backgroundColor: "#f0f9ff",
                        color: "#7e22ce",
                        fontWeight: "bold",
                        border: "2px solid #7e22ce",
                      },
                    }}
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 relative items-center text-sm",
                      caption_label: "text-sm font-medium",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-muted-foreground rounded-md w-8 font-normal text-xs",
                      row: "flex w-full mt-2",
                      cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 h-8 w-8",
                      day: "h-8 w-8 p-0 font-normal text-sm hover:bg-accent hover:text-accent-foreground rounded-md",
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                      day_today: "bg-accent text-accent-foreground",
                      day_outside: "text-muted-foreground opacity-50",
                      day_disabled: "text-muted-foreground opacity-50",
                    }}
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-primary"></div>
                    <span>Today</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded border-2 border-purple-600 bg-blue-50"></div>
                    <span>Registered Events</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="xl:hidden grid grid-cols-1 xs:grid-cols-3 gap-3 sm:gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 sm:p-4 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-primary">{events.length}</div>
                  <div className="text-xs text-muted-foreground">This Month</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 sm:p-4 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Ticket className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-primary">{tickets.length}</div>
                  <div className="text-xs text-muted-foreground">My Tickets</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3 sm:p-4 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Coins className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-primary">{totalSpent} TND</div>
                  <div className="text-xs text-muted-foreground">Total Spent</div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 sm:pb-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-primary" />
                    Upcoming Events
                  </CardTitle>
                  {upcomingEvents.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {upcomingEvents.length}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {tickets.length > 0 ? (
                  <div className="space-y-3">
                    {tickets.slice(0, 4).map((reg: any) => {
                      const eventDate = parseDate(reg.event?.startDate);
                      return (
                        <div key={reg.id} className="p-3 bg-purple-50/80 border border-purple-100 rounded-lg hover:bg-purple-50 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{reg.event?.title || "Event"}</div>
                              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                {eventDate ? format(eventDate, "MMM dd, h:mm a") : "Date TBA"}
                              </div>
                              <div className="text-xs text-purple-700 mt-1 flex items-center gap-1">
                                <Ticket className="h-3 w-3" />
                                {reg.ticket?.name || "General"}
                              </div>
                            </div>
                            {reg.event?.type && (
                              <Badge variant="outline" className="text-xs shrink-0">
                                {reg.event.type}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {tickets.length > 4 && (
                      <div className="text-center pt-2">
                        <Badge variant="secondary" className="text-xs">
                          +{tickets.length - 4} more events
                        </Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <CalendarIcon className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-muted-foreground/50 mb-2 sm:mb-3" />
                    <p className="text-sm text-muted-foreground mb-2">No upcoming events</p>
                    <p className="text-xs text-muted-foreground">Register for events to see them here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hidden xl:block">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>Events This Month</span>
                  </div>
                  <span className="font-semibold text-primary">{events.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-muted-foreground" />
                    <span>Total Tickets</span>
                  </div>
                  <span className="font-semibold text-primary">{tickets.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-muted-foreground" />
                    <span>Money Spent</span>
                  </div>
                  <span className="font-semibold text-primary">{totalSpent} TND</span>
                </div>

                <div className="pt-3 border-t">
                  <div className="bg-blue-50/50 p-3 rounded-lg">
                    <div className="text-xs text-blue-800 font-medium mb-1">Event Activity</div>
                    <div className="text-xs text-blue-700">
                      {upcomingEvents.length > 0
                        ? `You have ${upcomingEvents.length} upcoming event${upcomingEvents.length !== 1 ? "s" : ""}`
                        : "No upcoming events scheduled"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </TabsContent>
  );
}
