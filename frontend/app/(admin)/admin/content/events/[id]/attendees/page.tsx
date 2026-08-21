"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"
import { adminApi } from "@/lib/api/admin-api"
import { localizeHref } from "@/lib/i18n/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, CheckCircle, ChevronLeft, ChevronRight, Loader2, Users } from "lucide-react"
import { toast } from "sonner"

interface Attendee {
  id: string
  user: { name: string; email: string; avatar?: string }
  ticketType: string
  registeredAt: string
  checkedIn: boolean
  checkedInAt?: string
  status: "registered" | "cancelled" | "attended"
}

interface AttendeePage {
  data: Attendee[]
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export default function EventAttendeesPage() {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = params.id as string
  const page = Number(searchParams.get("page") || 1)
  const limit = 20

  const [attendees, setAttendees] = useState<AttendeePage | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAttendees = useCallback(async () => {
    setLoading(true)
    try {
      const response = await adminApi.content.getEventAttendees(eventId, { page, limit })
      if (response.success) setAttendees(response.data)
    } catch {
      toast.error("Failed to load attendees.")
    } finally {
      setLoading(false)
    }
  }, [eventId, page])

  useEffect(() => {
    fetchAttendees()
  }, [fetchAttendees])

  const changePage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", String(nextPage))
    router.push(`${pathname}?${params.toString()}`)
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
            <h1 className="text-3xl font-bold">Event attendees</h1>
            <p className="text-muted-foreground mt-2">Registered guests and check-in status.</p>
          </div>
        </div>
        <Button asChild>
          <Link href={localizeHref(pathname, `/admin/content/events/${eventId}/message`)}>
            Message attendees
          </Link>
        </Button>
      </div>

      <Card className="admin-table-shell border-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : attendees?.data.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <Users className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">No attendees found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Attendee</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendees?.data.map((attendee) => (
                  <TableRow key={attendee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={attendee.user.avatar} />
                          <AvatarFallback>{attendee.user.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{attendee.user.name}</p>
                          <p className="text-sm text-muted-foreground">{attendee.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{attendee.ticketType || "Standard"}</TableCell>
                    <TableCell>{new Date(attendee.registeredAt).toLocaleString()}</TableCell>
                    <TableCell>
                      {attendee.checkedIn ? (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle className="h-4 w-4" /> {attendee.checkedInAt ? new Date(attendee.checkedInAt).toLocaleString() : "Checked in"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Not checked in</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={attendee.status === "cancelled" ? "destructive" : "secondary"}>{attendee.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {attendees && attendees.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{attendees.total} attendees</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!attendees.hasPrevPage} onClick={() => changePage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={!attendees.hasNextPage} onClick={() => changePage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
