"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  Ticket,
  User,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Globe,
  Tag,
  Loader2,
  Sparkles,
} from "lucide-react";

interface VerificationData {
  valid: boolean;
  event: {
    title: string;
    description: string;
    startDate: string;
    endDate?: string;
    startTime: string;
    endTime: string;
    timezone: string;
    location?: string;
    onlineUrl?: string;
    type: string;
    category: string;
    image?: string;
    communityName?: string;
    creatorName?: string;
  };
  attendee: {
    name: string;
    profilePicture?: string;
    ticketType: string;
    registeredAt: string;
    checkedIn: boolean;
    checkedInAt?: string;
  };
  ticketInfo?: {
    name: string;
    type: string;
    description: string;
  };
  issuedAt: string;
  verifiedAt: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api`
    : "http://localhost:3000/api");

export function TicketVerifyClient({ token }: { token: string }) {
  const [data, setData] = useState<VerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/events/ticket/verify/${encodeURIComponent(token)}`
        );
        const json = await res.json();
        if (!res.ok || !json?.success) {
          setError(json?.message || "Invalid or expired ticket");
          return;
        }
        setData(json.data);
        setTimeout(() => setRevealed(true), 100);
      } catch {
        setError("Unable to verify ticket. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f0ecff] via-white to-[#e8e4ff] flex items-center justify-center">
        <div className="text-center space-y-4 animate-pulse">
          <div className="h-16 w-16 rounded-2xl bg-[#8e78fb]/10 flex items-center justify-center mx-auto">
            <ShieldCheck className="h-8 w-8 text-[#8e78fb]" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#1a1730]">Verifying ticket…</p>
            <p className="text-xs text-[#9590b8]">Checking cryptographic signature</p>
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-[#8e78fb] mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fff5f5] via-white to-[#ffe8e8] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-rose-500 p-6 text-center">
            <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white">Verification Failed</h1>
          </div>
          <div className="p-6 text-center space-y-3">
            <p className="text-sm text-[#46426a]">
              {error || "This ticket could not be verified."}
            </p>
            <p className="text-xs text-[#9590b8]">
              The QR code may be expired, invalid, or tampered with. Please contact the event organizer if you believe this is an error.
            </p>
          </div>
          <div className="border-t border-[#f1eeff] bg-[#faf9ff] px-6 py-4">
            <ChabaqaWatermark />
          </div>
        </div>
      </div>
    );
  }

  const ev = data.event;
  const att = data.attendee;
  const eventDate = new Date(ev.startDate);
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const typeConfig: Record<string, { bg: string; text: string; border: string; icon: typeof Globe }> = {
    Online: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", icon: Globe },
    Hybrid: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", icon: Sparkles },
    "In-person": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: MapPin },
  };
  const tc = typeConfig[ev.type] || typeConfig["In-person"];
  const TypeIcon = tc.icon;

  const initials = att.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0ecff] via-[#f7f7fe] to-[#e8e4ff] p-4 sm:p-8">
      <div className={`max-w-lg mx-auto space-y-4 transition-all duration-700 ${revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>

        {/* Verification Status Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-emerald-800">
              ✓ Verified Authentic Ticket
            </p>
            <p className="text-xs text-emerald-600 truncate">
              Verified at{" "}
              {new Date(data.verifiedAt).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
        </div>

        {/* Main Ticket Card */}
        <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(142,120,251,0.12)] overflow-hidden">
          {/* Event Image / Purple Header */}
          {ev.image ? (
            <div className="relative h-52 overflow-hidden">
              <img
                src={ev.image}
                alt={ev.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-[10px] text-white/70 uppercase tracking-widest mb-1 font-medium">Event</p>
                <h1 className="text-xl font-bold text-white leading-tight drop-shadow-sm">
                  {ev.title}
                </h1>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-[#8e78fb] via-[#7c6cf0] to-[#6c52f0] p-7">
              <p className="text-[10px] text-white/60 uppercase tracking-widest mb-1 font-medium">
                Event
              </p>
              <h1 className="text-xl font-bold text-white leading-tight">
                {ev.title}
              </h1>
            </div>
          )}

          {/* Rainbow accent bar */}
          <div className="h-1 bg-gradient-to-r from-[#8e78fb] via-[#f65887] via-[#ff9b28] to-[#47c7ea]" />

          {/* Event Details */}
          <div className="p-6 space-y-5">
            {/* Type & Category Badges */}
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${tc.bg} ${tc.text} ${tc.border}`}
              >
                <TypeIcon className="h-3 w-3" />
                {ev.type}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#f0ecff] text-[#6c52f0] border border-[#e8e4ff]">
                <Tag className="h-3 w-3" />
                {ev.category}
              </span>
            </div>

            {/* Date, Time, Location */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-lg bg-[#f0ecff] flex items-center justify-center flex-shrink-0">
                  <CalendarDays className="h-4 w-4 text-[#8e78fb]" />
                </div>
                <span className="text-[#1a1730] font-medium">
                  {formattedDate}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-lg bg-[#f0ecff] flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-[#8e78fb]" />
                </div>
                <span className="text-[#1a1730]">
                  {ev.startTime} – {ev.endTime}{" "}
                  <span className="text-[#9590b8] text-xs">({ev.timezone})</span>
                </span>
              </div>
              {ev.location && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-[#f0ecff] flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 text-[#8e78fb]" />
                  </div>
                  <span className="text-[#1a1730]">{ev.location}</span>
                </div>
              )}
              {ev.communityName && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-[#f0ecff] flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-[#8e78fb]" />
                  </div>
                  <span className="text-[#46426a]">
                    Hosted by{" "}
                    <span className="font-semibold text-[#1a1730]">
                      {ev.creatorName || ev.communityName}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Dashed Divider — realistic ticket tear line */}
            <div className="relative py-1">
              <div className="border-t-2 border-dashed border-[#e8e4ff]" />
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-gradient-to-br from-[#f0ecff] to-[#e8e4ff]" />
              <div className="absolute -right-6 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-gradient-to-br from-[#f0ecff] to-[#e8e4ff]" />
            </div>

            {/* Attendee Info */}
            <div className="bg-gradient-to-br from-[#f8f7ff] to-[#f0ecff] rounded-xl p-5 space-y-3 border border-[#e8e4ff]">
              <p className="text-[10px] text-[#8e78fb] uppercase tracking-widest font-bold">
                Attendee
              </p>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl overflow-hidden flex-shrink-0 shadow-[0_4px_12px_rgba(142,120,251,0.3)]">
                  {att.profilePicture ? (
                    <img
                      src={att.profilePicture}
                      alt={att.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          parent.classList.add("bg-gradient-to-br", "from-[#8e78fb]", "to-[#6c52f0]", "flex", "items-center", "justify-center", "text-white", "font-bold", "text-sm");
                          parent.textContent = initials;
                        }
                      }}
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#8e78fb] to-[#6c52f0] flex items-center justify-center text-white font-bold text-sm">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#1a1730] truncate">
                    {att.name}
                  </p>
                  <p className="text-xs text-[#9590b8]">Verified ticket holder</p>
                </div>
              </div>
            </div>

            {/* Ticket Info */}
            <div className="flex items-center justify-between bg-white rounded-xl p-4 border-2 border-[#e8e4ff] shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#8e78fb]/10 to-[#6c52f0]/10 flex items-center justify-center flex-shrink-0">
                  <Ticket className="h-5 w-5 text-[#8e78fb]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#1a1730] truncate">
                    {data.ticketInfo?.name || att.ticketType}
                  </p>
                  <p className="text-xs text-[#9590b8]">
                    Registered{" "}
                    {new Date(att.registeredAt).toLocaleDateString("en-US", {
                      dateStyle: "medium",
                    })}
                  </p>
                </div>
              </div>
              {att.checkedIn && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 flex-shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Checked In
                </div>
              )}
            </div>
          </div>

          {/* Chabaqa Watermark Footer */}
          <div className="border-t border-[#f1eeff] bg-gradient-to-r from-[#faf9ff] to-[#f8f7ff] px-6 py-4">
            <ChabaqaWatermark />
          </div>
        </div>

        {/* Security Note */}
        <p className="text-center text-[10px] text-[#9590b8] leading-relaxed">
          This is a cryptographically signed digital ticket<br />
          issued and verified by <span className="font-semibold text-[#8e78fb]">Chabaqa.io</span>
        </p>
      </div>
    </div>
  );
}

function ChabaqaWatermark() {
  return (
    <div className="flex items-center justify-center gap-2.5">
      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#8e78fb]/10 to-[#6c52f0]/10 flex items-center justify-center">
        <ShieldCheck className="h-4 w-4 text-[#8e78fb]" />
      </div>
      <div>
        <p className="text-xs font-bold text-[#8e78fb] leading-tight">chabaqa.</p>
        <p className="text-[10px] text-[#9590b8] leading-tight">
          Verified Digital Ticket
        </p>
      </div>
    </div>
  );
}
