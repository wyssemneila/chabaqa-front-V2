"use client"

import { useState } from "react"
import { CheckCircle2, Loader2, QrCode, UserCheck } from "lucide-react"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { eventsApi } from "@/lib/api/events.api"
import { Event } from "@/lib/models"

interface EventAttendeesTabProps {
  event: Event
}

export default function EventAttendeesTab({ event }: EventAttendeesTabProps) {
  const [qrToken, setQrToken] = useState("")
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const attendees = Array.isArray(event.attendees) ? event.attendees : []
  const checkedIn = attendees.filter((attendee: any) => attendee.checkedIn).length

  const eventId = String((event as any).id || (event as any)._id || "")
  const displayName = (attendee: any) => attendee.user?.name || attendee.user?.firstName || "Attendee"
  const displayEmail = (attendee: any) => attendee.user?.email || "No email available"

  const checkInQr = async () => {
    if (!qrToken.trim() || !eventId) return
    setBusy("qr")
    setMessage(null)
    try {
      const result: any = await eventsApi.checkInByQr(eventId, qrToken.trim())
      setMessage(result?.data?.message || result?.message || "Attendee checked in successfully.")
      setQrToken("")
    } catch (error: any) {
      setMessage(error?.message || "Unable to check in this ticket.")
    } finally {
      setBusy(null)
    }
  }

  const checkInManually = async (attendeeId: string) => {
    if (!eventId || !attendeeId) return
    setBusy(attendeeId)
    setMessage(null)
    try {
      const result: any = await eventsApi.checkInAttendee(eventId, attendeeId)
      setMessage(result?.data?.message || result?.message || "Attendee checked in successfully.")
    } catch (error: any) {
      setMessage(error?.message || "Unable to check in this attendee.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle>Attendees ({attendees.length})</CardTitle>
        <CardDescription>{checkedIn} checked in. Scan or paste a ticket QR token, or check in a listed attendee.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-violet-950"><QrCode className="h-4 w-4 text-violet-600" /> QR check-in</div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input value={qrToken} onChange={(event) => setQrToken(event.target.value)} placeholder="Paste the secure token from the attendee QR code" aria-label="Ticket QR token" />
            <Button onClick={checkInQr} disabled={!qrToken.trim() || busy !== null} className="bg-violet-600 hover:bg-violet-700">
              {busy === "qr" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check in"}
            </Button>
          </div>
          {message && <p className="mt-3 text-sm text-slate-700" role="status">{message}</p>}
        </div>

        <div className="space-y-3">
          {attendees.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No registered attendees yet.</p> : attendees.map((attendee: any) => (
            <div key={attendee.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 font-semibold text-violet-700">{displayName(attendee).charAt(0).toUpperCase()}</div>
                <div className="min-w-0">
                  <h4 className="truncate font-medium">{displayName(attendee)}</h4>
                  <p className="truncate text-sm text-muted-foreground">{displayEmail(attendee)} · {attendee.ticketType || "General admission"}</p>
                  {attendee.specialRequests && <p className="mt-1 text-xs text-muted-foreground">Request: {attendee.specialRequests}</p>}
                </div>
              </div>
              {attendee.checkedIn ? <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Checked in</span> : <Button variant="outline" size="sm" onClick={() => checkInManually(attendee.id)} disabled={busy !== null}><UserCheck className="mr-1.5 h-4 w-4" />{busy === attendee.id ? "Checking in…" : "Check in"}</Button>}
            </div>
          ))}
        </div>
      </CardContent>
    </EnhancedCard>
  )
}
