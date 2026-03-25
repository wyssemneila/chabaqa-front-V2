"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Ticket, CalendarIcon, MapPin, Users, Clock, ImageIcon, UserCircle } from "lucide-react";
import { format } from "date-fns";
import { EventWithTickets } from "@/lib/api/events-community.api";
import { resolveImageUrl } from "@/lib/resolve-image-url";
import { getUserProfileHref } from "@/lib/profile-handle";

interface EventCardProps {
  event: EventWithTickets;
  isHighlighted?: boolean;
  selectedEventId?: string;
  selectedTicket: string;
  setSelectedTicket: (ticket: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  onOpenRegistration: (event: EventWithTickets) => void;
  handleRegister: () => void;
  promoCode: string;
  setPromoCode: (code: string) => void;
  isSubmitting: boolean;
}

function formatMoney(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "Free";
  return `${amount} TND`;
}

function formatTimeRange(startTime?: string, endTime?: string): string {
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  if (startTime) return startTime;
  if (endTime) return `Until ${endTime}`;
  return "Time TBA";
}

export default function EventCard({
  event,
  isHighlighted = false,
  selectedEventId,
  selectedTicket,
  setSelectedTicket,
  notes,
  setNotes,
  onOpenRegistration,
  handleRegister,
  promoCode,
  setPromoCode,
  isSubmitting
}: EventCardProps) {
  const [hasImageError, setHasImageError] = useState(false);

  const isCurrentEventSelected = selectedEventId === event.id;
  const eventTickets = event.tickets || [];
  const selectedTicketData = isCurrentEventSelected
    ? eventTickets.find((ticket) => ticket.id === selectedTicket)
    : undefined;
  const resolvedImage = !hasImageError ? resolveImageUrl(event.image || event.thumbnail) : undefined;
  const minPrice = eventTickets.length > 0
    ? Math.min(...eventTickets.map((ticket) => Number(ticket.price || 0)))
    : Number(event.price || 0);

  const eventDate = useMemo(() => {
    if (!event.startDate) return undefined;
    const date = new Date(event.startDate);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }, [event.startDate]);

  const selectedPrice = Number(selectedTicketData?.price || 0);
  const totalPrice = selectedPrice;
  const isSoldOut = Boolean(selectedTicketData?.quantity) && Number(selectedTicketData?.sold || 0) >= Number(selectedTicketData?.quantity || 0);

  const availableSpeakers = event.speakers || [];
  const attendeeCount = Number(event.attendeesCount || event.attendees?.length || 0);
  const isVirtual = Boolean(event.onlineUrl) || event.isVirtual === true || (event.type || "").toLowerCase().includes("online");
  const organizerProfileHref = getUserProfileHref({
    username: (event as any).organizerUsername,
    name: event.organizerName || "Community team",
  });

  return (
    <Card
      id={`event-card-${String(event.id)}`}
      className={`border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        isHighlighted ? "border-purple-500 ring-2 ring-purple-200" : "border-slate-100"
      }`}
    >
      <CardHeader className="pb-4">
        <div className="relative w-full aspect-video overflow-hidden rounded-xl">
          {resolvedImage ? (
            <img
              src={resolvedImage}
              alt={event.title}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              onError={() => setHasImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-100 via-sky-100 to-emerald-100">
              <div className="text-center">
                <ImageIcon className="mx-auto mb-2 h-8 w-8 text-indigo-500" />
                <p className="text-xs font-medium text-indigo-700">Event Banner</p>
              </div>
            </div>
          )}

          <div className="absolute left-3 top-3 flex items-center gap-2">
            <Badge className="bg-white/90 text-slate-800 hover:bg-white/90">
              {event.type || "Event"}
            </Badge>
            {event.isRegistered && (
              <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">Registered</Badge>
            )}
          </div>

          {isVirtual && (
            <div className="absolute right-3 top-3">
              <Badge variant="secondary" className="bg-black/60 text-white hover:bg-black/60">
                Online
              </Badge>
            </div>
          )}
        </div>

        <div className="space-y-2 pt-1">
          <CardTitle className="line-clamp-1 text-lg leading-tight">{event.title}</CardTitle>
          <CardDescription className="line-clamp-2 text-sm">
            {event.description || "No description available for this event yet."}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <div className="space-y-2.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {eventDate ? format(eventDate, "EEE, MMM dd, yyyy") : "Date TBA"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0" />
            <span>{formatTimeRange(event.startTime, event.endTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {isVirtual ? "Online event" : (event.location || "Location TBA")}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span>{attendeeCount} attendee{attendeeCount !== 1 ? "s" : ""}</span>
          </div>
          <span>{availableSpeakers.length} speaker{availableSpeakers.length !== 1 ? "s" : ""}</span>
          <span>{eventTickets.length} ticket type{eventTickets.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link href={organizerProfileHref} className="shrink-0 hover:opacity-90 transition-opacity">
            <Avatar className="h-8 w-8">
              <AvatarImage src={event.organizerAvatar} />
              <AvatarFallback>
                <UserCircle className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Link>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            Hosted by{" "}
            <Link href={organizerProfileHref} className="font-medium text-foreground hover:underline">
              {event.organizerName || "Community team"}
            </Link>
          </p>
        </div>

        <div className="flex flex-col gap-3 border-t pt-4">
          <div className="text-center xs:text-left">
            <div className="text-xl font-bold text-purple-600">
              {minPrice > 0 ? `From ${formatMoney(minPrice)}` : "Free"}
            </div>
            <div className="text-xs text-muted-foreground">
              {eventTickets.length > 0 ? `${eventTickets.length} ticket options available` : "No ticket options yet"}
            </div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                className="h-10 w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => onOpenRegistration(event)}
                disabled={Boolean(event.isRegistered)}
              >
                <Ticket className="mr-2 h-4 w-4" />
                {event.isRegistered ? "Already Registered" : "Register"}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-h-[90vh] max-w-4xl overflow-y-auto p-4 sm:p-6">
              <DialogHeader className="text-left">
                <DialogTitle className="pr-8 text-lg sm:text-xl">Register for {event.title}</DialogTitle>
                <DialogDescription className="text-sm sm:text-base">
                  {event.description || "Select a ticket to complete your registration."}
                </DialogDescription>
              </DialogHeader>

              {eventTickets.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Ticket options are not available yet for this event.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 py-4 lg:grid-cols-2 lg:gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-3 block text-sm font-medium">Select Ticket Type</Label>
                      <div className="space-y-2">
                        {eventTickets.map((ticket) => {
                          const remaining = typeof ticket.quantity === "number"
                            ? Math.max(0, ticket.quantity - Number(ticket.sold || 0))
                            : undefined;
                          const soldOut = remaining === 0;
                          const isSelected = selectedTicket === ticket.id;

                          return (
                            <Button
                              key={ticket.id}
                              variant={isSelected ? "default" : "outline"}
                              className="h-auto w-full justify-between p-3 text-left"
                              onClick={() => setSelectedTicket(ticket.id)}
                              disabled={soldOut}
                            >
                              <div className="flex flex-col items-start">
                                <span className="text-sm font-medium">{ticket.name}</span>
                                {ticket.description && (
                                  <span className="mt-1 text-xs text-muted-foreground">{ticket.description}</span>
                                )}
                                {typeof remaining === "number" && (
                                  <span className="mt-1 text-xs text-muted-foreground">
                                    {soldOut ? "Sold out" : `${remaining} left`}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm font-bold">{formatMoney(Number(ticket.price || 0))}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                      One ticket per user. You can register once for this event.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="mb-2 block text-sm font-medium">Special Requests (Optional)</Label>
                      <Textarea
                        placeholder="Any dietary requirements, accessibility needs, or special requests?"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="resize-none text-sm"
                      />
                    </div>

                    <div className="rounded-lg border border-purple-100 bg-purple-50/80 p-4">
                      <span className="mb-2 block text-sm font-medium">Registration Summary</span>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {selectedTicketData ? (
                          <>
                            <div className="flex justify-between">
                              <span>Ticket:</span>
                              <span className="font-medium">{selectedTicketData.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Unit Price:</span>
                              <span className="font-medium">{formatMoney(Number(selectedTicketData.price || 0))}</span>
                            </div>
                            <div className="mt-2 border-t pt-1">
                              <div className="flex justify-between font-semibold text-purple-700">
                                <span>Total:</span>
                                <span>{formatMoney(totalPrice)}</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-center italic text-muted-foreground">
                            Select a ticket type to see summary
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedPrice > 0 && (
                      <div>
                        <Label className="mb-2 block text-sm font-medium">Promo code (optional)</Label>
                        <Input
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          placeholder="e.g. WELCOME10"
                          className="h-10"
                          disabled={isSubmitting}
                        />
                      </div>
                    )}

                    <Button
                      className="h-11 w-full bg-purple-600 font-medium hover:bg-purple-700"
                      onClick={handleRegister}
                      disabled={!isCurrentEventSelected || !selectedTicketData || isSubmitting || isSoldOut}
                    >
                      {isSubmitting
                        ? "Processing..."
                        : selectedPrice > 0
                          ? `Proceed to payment - ${formatMoney(totalPrice)}`
                          : "Confirm Free Registration"}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      Changes here are local until you confirm registration.
                    </p>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
