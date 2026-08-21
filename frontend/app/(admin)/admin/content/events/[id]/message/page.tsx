"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { adminApi } from "@/lib/api/admin-api"
import { localizeHref } from "@/lib/i18n/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2, Mail, Send } from "lucide-react"
import { toast } from "sonner"

export default function MessageEventAttendeesPage() {
  const params = useParams()
  const pathname = usePathname()
  const eventId = params.id as string
  const [message, setMessage] = useState("")
  const [sendEmail, setSendEmail] = useState(true)
  const [sending, setSending] = useState(false)

  const submit = async () => {
    if (message.trim().length < 5) {
      toast.error("Write a clear message first.")
      return
    }
    setSending(true)
    try {
      await adminApi.content.messageAttendees(eventId, message.trim(), sendEmail)
      toast.success("Message queued for attendees.")
      setMessage("")
    } catch {
      toast.error("Failed to message attendees.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="admin-section-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={localizeHref(pathname, `/admin/content/events/${eventId}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Message attendees</h1>
            <p className="text-muted-foreground mt-2">Send an operational update to everyone registered for this event.</p>
          </div>
        </div>
      </div>

      <Card className="admin-surface max-w-3xl border-0 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" /> Attendee message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="attendee-message">Message</Label>
            <Textarea
              id="attendee-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Schedule change, reminder, joining link, or important update..."
              className="min-h-40"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="send-email">Send email copy</Label>
              <p className="text-sm text-muted-foreground">Also deliver the update by email when attendee emails are available.</p>
            </div>
            <Switch id="send-email" checked={sendEmail} onCheckedChange={setSendEmail} />
          </div>
          <Button onClick={submit} disabled={sending}>
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send message
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
