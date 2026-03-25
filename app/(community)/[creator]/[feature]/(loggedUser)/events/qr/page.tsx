"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { eventsApi } from "@/lib/api/events.api";
import { normalizeEventRegistrations } from "@/lib/api/events-community.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, MapPin, ShieldCheck, Ticket } from "lucide-react";
import { format } from "date-fns";

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function EventQrPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = useMemo(() => searchParams.get("eventId") || "", [searchParams]);

  const [token, setToken] = useState<string>("");
  const [expiresIn, setExpiresIn] = useState<string>("");
  const [registration, setRegistration] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!eventId) {
        setError("Missing event ID.");
        setLoading(false);
        return;
      }
      try {
        const [qrRes, regsRes] = await Promise.all([
          eventsApi.getQrToken(eventId),
          eventsApi.getMyRegistrations(),
        ]);

        const qrData = (qrRes as any)?.data?.data || (qrRes as any)?.data;
        const qrToken = qrData?.token || "";
        const qrExpires = qrData?.expiresIn || "";

        const registrations = normalizeEventRegistrations(regsRes);
        const match = registrations.find((reg: any) => {
          const id = reg?.event?.id;
          const mongoId = reg?.event?._id || reg?.event?.mongoId;
          return String(id || "") === String(eventId) || String(mongoId || "") === String(eventId);
        }) || null;

        if (!isMounted) return;
        setToken(qrToken);
        setExpiresIn(qrExpires);
        setRegistration(match);
        setError(null);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.message || "Unable to load QR code.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [eventId]);

  const creator = String((params as any)?.creator || "");
  const feature = String((params as any)?.feature || "");
  const backHref = creator && feature ? `/${creator}/${feature}/events` : "/dashboard";

  const eventDate = parseDate(registration?.event?.startDate);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-10">
        <Card className="max-w-3xl mx-auto border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-slate-900 text-white p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/15 text-white flex items-center justify-center">
                <Ticket className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold">Event Ticket QR</h1>
                <p className="text-sm text-white/80">Present this QR at the entrance to confirm your ticket.</p>
              </div>
            </div>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading QR code…</div>
            ) : error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : (
              <>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-2">
                    <h2 className="text-lg sm:text-xl font-semibold">{registration?.event?.title || "Event"}</h2>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {registration?.ticket?.name || "General Admission"}
                      </Badge>
                      {registration?.event?.type && (
                        <Badge variant="secondary" className="text-xs">
                          {registration.event.type}
                        </Badge>
                      )}
                      {expiresIn && (
                        <span className="text-xs">Valid for {expiresIn}</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        {eventDate ? format(eventDate, "MMM dd, yyyy") : "Date TBA"}
                      </span>
                      {registration?.event?.startTime && <span>{registration.event.startTime}</span>}
                      {registration?.event?.location && (
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {registration.event.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Secure QR token
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                  <div className="flex justify-center lg:justify-start">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                      {token ? (
                        <QRCodeCanvas value={token} size={220} bgColor="#ffffff" fgColor="#111827" />
                      ) : (
                        <div className="text-sm text-muted-foreground">QR token unavailable.</div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-muted-foreground">
                      Scan at check-in to validate your ticket and confirm attendance.
                    </div>
                    <div className="rounded-xl border border-purple-100 bg-purple-50/70 p-4 text-sm text-purple-900">
                      Keep this screen ready and avoid zooming to ensure a fast scan.
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => router.push(backHref)} variant="outline" className="h-10">
                Back to Events
              </Button>
              {registration?.event?.onlineUrl && registration?.event?.type !== "In-person" && (
                <Button asChild className="h-10">
                  <a href={registration.event.onlineUrl} target="_blank" rel="noopener noreferrer">
                    Join Online Event
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
