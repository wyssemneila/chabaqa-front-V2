"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { eventsApi } from "@/lib/api/events.api";

const QRCodeCanvas = dynamic(
  () => import("qrcode.react").then(mod => ({ default: mod.QRCodeCanvas })),
  { ssr: false, loading: () => <div className="h-48 w-48 animate-pulse rounded-lg bg-muted" /> }
);
import { normalizeEventRegistrations } from "@/lib/api/events-community.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  MapPin,
  ShieldCheck,
  Ticket,
  Clock,
  Download,
  ExternalLink,
  Globe,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

const FRONTEND_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://chabaqa.io";

export default function EventQrPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = useMemo(
    () => searchParams.get("eventId") || "",
    [searchParams]
  );
  const qrRef = useRef<HTMLDivElement>(null);

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

        const qrData =
          (qrRes as any)?.data?.data || (qrRes as any)?.data;
        const qrToken = qrData?.token || "";
        const qrExpires = qrData?.expiresIn || "";

        const registrations = normalizeEventRegistrations(regsRes);
        const match =
          registrations.find((reg: any) => {
            const id = reg?.event?.id;
            const mongoId =
              reg?.event?._id || reg?.event?.mongoId;
            return (
              String(id || "") === String(eventId) ||
              String(mongoId || "") === String(eventId)
            );
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
  const backHref =
    creator && feature
      ? `/${creator}/${feature}/events`
      : "/dashboard";

  const eventDate = parseDate(registration?.event?.startDate);
  const verifyUrl = token
    ? `${FRONTEND_URL}/ticket/verify/${encodeURIComponent(token)}`
    : "";

  const handleDownloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `chabaqa-ticket-${registration?.event?.title || "event"}.png`;
    a.click();
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0ecff] via-[#f7f7fe] to-[#e8e4ff]">
      <div className="container mx-auto px-4 py-8 max-w-lg">
        {/* Back Button */}
        <button
          onClick={() => router.push(backHref)}
          className="inline-flex items-center gap-1.5 text-sm text-[#46426a] hover:text-[#8e78fb] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#8e78fb]" />
            <p className="text-sm text-[#46426a]">Loading your ticket…</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-3">
            <p className="text-red-600 text-sm">{error}</p>
            <Button
              variant="outline"
              onClick={() => router.push(backHref)}
            >
              Go Back
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(142,120,251,0.15)] overflow-hidden">
            {/* Ticket Header */}
            <div className="bg-gradient-to-r from-[#8e78fb] to-[#6c52f0] p-6 text-white">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Ticket className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold leading-tight truncate">
                    {registration?.event?.title || "Event"}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge className="bg-white/20 text-white border-0 text-[11px] hover:bg-white/25">
                      {registration?.ticket?.name || "General Admission"}
                    </Badge>
                    {registration?.event?.type && (
                      <Badge className="bg-white/10 text-white/90 border-0 text-[11px]">
                        {registration.event.type === "Online" && (
                          <Globe className="h-3 w-3 me-1" />
                        )}
                        {registration.event.type}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Event Details Row */}
            <div className="px-6 py-4 space-y-2.5 border-b border-[#f1eeff]">
              <div className="flex items-center gap-2.5 text-sm">
                <CalendarIcon className="h-4 w-4 text-[#8e78fb]" />
                <span className="text-[#1a1730] font-medium">
                  {eventDate
                    ? format(eventDate, "EEEE, MMMM d, yyyy")
                    : "Date TBA"}
                </span>
              </div>
              {registration?.event?.startTime && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Clock className="h-4 w-4 text-[#8e78fb]" />
                  <span className="text-[#1a1730]">
                    {registration.event.startTime}
                    {registration.event.endTime &&
                      ` – ${registration.event.endTime}`}
                  </span>
                </div>
              )}
              {registration?.event?.location && (
                <div className="flex items-center gap-2.5 text-sm">
                  <MapPin className="h-4 w-4 text-[#8e78fb]" />
                  <span className="text-[#1a1730]">
                    {registration.event.location}
                  </span>
                </div>
              )}
            </div>

            {/* Dashed tear line */}
            <div className="relative">
              <div className="border-t-2 border-dashed border-[#e8e4ff]" />
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-[#f0ecff]" />
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-[#f0ecff]" />
            </div>

            {/* QR Code Section */}
            <div className="px-6 py-6 text-center space-y-4">
              <p className="text-xs text-[#9590b8] uppercase tracking-wider font-medium">
                Present at entrance
              </p>
              <div
                ref={qrRef}
                className="inline-block bg-white rounded-2xl p-4 border-2 border-[#e8e4ff] shadow-[0_2px_12px_rgba(142,120,251,0.08)]"
              >
                {token ? (
                  <QRCodeCanvas
                    value={verifyUrl || token}
                    size={240}
                    bgColor="#ffffff"
                    fgColor="#1a1730"
                    level="H"
                    includeMargin={false}
                    imageSettings={{
                      src: "/logo-icon.png",
                      height: 36,
                      width: 36,
                      excavate: true,
                    }}
                  />
                ) : (
                  <div className="w-60 h-60 flex items-center justify-center text-sm text-[#9590b8]">
                    QR unavailable
                  </div>
                )}
              </div>

              {/* Validity */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure ticket
                {expiresIn && (
                  <span className="text-[#9590b8]">
                    · Valid for {expiresIn}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 pb-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 text-xs border-[#e8e4ff] text-[#46426a] hover:bg-[#f8f7ff]"
                onClick={handleDownloadQR}
              >
                <Download className="h-3.5 w-3.5 me-1.5" />
                Download QR
              </Button>
            </div>

            {/* Online Event Button */}
            {registration?.event?.onlineUrl &&
              registration?.event?.type !== "In-person" && (
                <div className="px-6 pb-4">
                  <Button
                    asChild
                    className="w-full h-10 bg-gradient-to-r from-[#8e78fb] to-[#6c52f0] hover:from-[#7d69ea] hover:to-[#5b41df] text-white"
                  >
                    <a
                      href={registration.event.onlineUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 me-2" />
                      Join Online Event
                    </a>
                  </Button>
                </div>
              )}

            {/* Chabaqa Footer */}
            <div className="border-t border-[#f1eeff] bg-[#faf9ff] px-6 py-3 flex items-center justify-center gap-2">
              <div className="h-5 w-5 rounded bg-[#8e78fb]/10 flex items-center justify-center">
                <ShieldCheck className="h-3 w-3 text-[#8e78fb]" />
              </div>
              <span className="text-[10px] text-[#9590b8]">
                Verified by{" "}
                <span className="font-semibold text-[#8e78fb]">
                  Chabaqa
                </span>{" "}
                · Secure digital ticket
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
