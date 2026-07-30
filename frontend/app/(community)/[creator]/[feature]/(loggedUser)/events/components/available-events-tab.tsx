"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EventWithTickets } from "@/lib/api/events-community.api";
import EventCard from "@/app/(community)/[creator]/[feature]/(loggedUser)/events/components/event-card";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { eventsApi } from "@/lib/api/events.api";
import { trackingApi } from "@/lib/api/tracking.api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { computeEventStartAt } from "@/lib/utils/event-time";
import { PaymentProviderModal } from "@/components/payment-provider-modal";
import { usePaymentProviderModal } from "@/lib/hooks/use-payment-provider-modal";

interface AvailableEventsTabProps {
  availableEvents: EventWithTickets[];
  highlightedEventId?: string;
  targetEventNotice?: string | null;
}

export default function AvailableEventsTab({
  availableEvents,
  highlightedEventId,
  targetEventNotice,
}: AvailableEventsTabProps) {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const [selectedEvent, setSelectedEvent] = useState<EventWithTickets | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<string>("");
  const [notes, setNotes] = useState("");

  const [promoCode, setPromoCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentModal = usePaymentProviderModal({
    initStripe: (key) => (eventsApi as any).initStripePayment(String(selectedEvent?.id), String(selectedTicket), promoCode.trim() || undefined, key),
    onError: (err: any) => toast({ title: "Payment failed", description: err?.message || "Please try again.", variant: "destructive" }),
  });

  // Filter only published and upcoming events, but keep events with invalid/missing dates visible.
  const upcomingEvents = useMemo(
    () => {
      const now = Date.now();
      return availableEvents?.filter((event) => {
        if (!event?.isActive || event?.isPublished === false) {
          return false;
        }

        const startAt = computeEventStartAt(event.startDate, event.startTime, event.timezone);
        if (!startAt) {
          return true;
        }

        return startAt.getTime() >= now;
      }) || []
    },
    [availableEvents],
  );

  useEffect(() => {
    if (!highlightedEventId) return;

    const element = document.getElementById(`event-card-${highlightedEventId}`);
    if (!element) return;

    element.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedEventId, upcomingEvents]);

  const handleOpenRegistration = (event: EventWithTickets) => {
    setSelectedEvent(event);
    setSelectedTicket(event.tickets?.[0]?.id || "");
    setNotes("");
    setPromoCode("");
    const trackingId = String((event as any)?._id || event.id || "").trim();
    if (trackingId) {
      void trackingApi.trackView("event", trackingId, { source: "event_registration_open" }).catch(() => undefined);
    }
  };

  const isAlreadyRegisteredError = (error: any): boolean => {
    const message = String(
      error?.message ||
      error?.error?.message ||
      error?.data?.message ||
      ""
    ).toLowerCase();

    return message.includes("déjà inscrit") || message.includes("already registered");
  };

  const handleRegister = async () => {
    if (!selectedEvent) return;
    if (!selectedTicket) {
      toast({ title: "Select a ticket", description: "Please select a ticket type.", variant: "destructive" });
      return;
    }

    const ticket = selectedEvent.tickets?.find((t) => t.id === selectedTicket);
    const price = Number(ticket?.price || 0);
    const creator = String((params as any)?.creator || "");
    const feature = String((params as any)?.feature || "");

    setIsSubmitting(true);
    try {
      if (price <= 0) {
        await eventsApi.register(String(selectedEvent.id), String(selectedTicket));
        toast({ title: "Registered", description: "Your registration has been confirmed." });
        const qrHref = creator && feature
          ? `/${creator}/${feature}/events/qr?eventId=${encodeURIComponent(String(selectedEvent.id))}`
          : `/dashboard`;
        router.push(qrHref);
        return;
      }

      setIsSubmitting(false);
      paymentModal.open();
    } catch (error: any) {
      if (isAlreadyRegisteredError(error)) {
        toast({
          title: "Already Registered",
          description: "You can only register once per event (1 ticket per user).",
        });
        return;
      }

      toast({
        title: "Registration failed",
        description: error?.message || error?.error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (upcomingEvents.length === 0) {
    return (
      <TabsContent value="available" className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="text-center py-12">
            <Sparkles className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Events Available</h3>
            <p className="text-muted-foreground">
              Check back later for new upcoming events
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    )
  }

  return (
    <>
      <PaymentProviderModal
        open={paymentModal.isOpen}
        onOpenChange={paymentModal.close}
        onSelect={paymentModal.handleSelect}
        isLoading={paymentModal.isLoading}
        error={paymentModal.error}
      />
    <TabsContent value="available" className="space-y-6">
      {targetEventNotice && (
        <Alert>
          <AlertDescription>{targetEventNotice}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {upcomingEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isHighlighted={highlightedEventId === String(event.id)}
            selectedEventId={selectedEvent?.id}
            selectedTicket={selectedTicket}
            setSelectedTicket={setSelectedTicket}
            notes={notes}
            setNotes={setNotes}
            onOpenRegistration={handleOpenRegistration}
            handleRegister={handleRegister}
            promoCode={promoCode}
            setPromoCode={setPromoCode}
            isSubmitting={isSubmitting}
          />
        ))}
      </div>
    </TabsContent>
    </>
  );
}
