"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { localizeHref, stripLocaleFromPath } from "@/lib/i18n/client"
import { adminApi } from "@/lib/api/admin-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Search, 
  MoreHorizontal, 
  CheckCircle, 
  Eye, 
  Star,
  AlertCircle,
  Loader2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  MapPin,
  Video,
  Mail
} from "lucide-react"
import { toast } from "sonner"

interface Event {
  id: string
  title: string
  description: string
  coverImage?: string
  status: string
  creator: { id: string; name: string; email: string }
  community: { id: string; name: string }
  startDate: string
  endDate: string
  location: string
  isOnline: boolean
  onlineLink?: string
  attendeeCount: number
  maxAttendees?: number
  eventStatus: 'upcoming' | 'ongoing' | 'ended' | 'cancelled'
  ticketTypes: Array<{
    id: string
    type: string
    name: string
    price: number
    quantity?: number
    sold: number
  }>
  isFeatured: boolean
  createdAt: string
}

interface PaginatedEvents {
  data: Event[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export default function EventsManagementPage() {
  const t = useTranslations("admin.content.events")
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const internalPath = stripLocaleFromPath(pathname)

  const [events, setEvents] = useState<PaginatedEvents | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all")

  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = 20

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const filters: any = { page, limit }
      if (searchTerm) filters.searchTerm = searchTerm
      if (statusFilter && statusFilter !== "all") filters.status = statusFilter
      
      const response = await adminApi.content.getEvents(filters)
      if (response.success) {
        setEvents(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
      toast.error(t("fetchError"))
    } finally {
      setLoading(false)
    }
  }, [page, searchTerm, statusFilter, t])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchEvents()
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    const params = new URLSearchParams(searchParams)
    if (value === "all") {
      params.delete("status")
    } else {
      params.set("status", value)
    }
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleApprove = async (eventId: string) => {
    try {
      await adminApi.content.approveEvent(eventId)
      toast.success(t("approveSuccess"))
      fetchEvents()
    } catch (error) {
      toast.error(t("approveError"))
    }
  }

  const handleCancel = async (eventId: string) => {
    try {
      await adminApi.content.cancelEvent(eventId, "Cancelled by admin")
      toast.success(t("cancelSuccess"))
      fetchEvents()
    } catch (error) {
      toast.error(t("cancelError"))
    }
  }

  const getStatusBadge = (status: string, eventStatus: string) => {
    if (status === "pending") {
      return <Badge variant="outline" className="text-amber-600 border-amber-200">{t("status.pending")}</Badge>
    }
    if (status === "featured") {
      return <Badge className="bg-primary">{t("status.featured")}</Badge>
    }
    if (eventStatus === "cancelled") {
      return <Badge variant="destructive">{t("status.cancelled")}</Badge>
    }
    if (eventStatus === "ongoing") {
      return <Badge className="bg-emerald-500">{t("status.ongoing")}</Badge>
    }
    if (eventStatus === "ended") {
      return <Badge variant="secondary">{t("status.ended")}</Badge>
    }
    if (eventStatus === "upcoming") {
      return <Badge variant="outline" className="text-blue-600">{t("status.upcoming")}</Badge>
    }
    return <Badge variant="secondary">{t("status.approved")}</Badge>
  }

  return (
    <div className="space-y-8">
      <div className="admin-section-header">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
        </div>
      </div>

      <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </form>

            <div className="flex gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("filterByStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allStatuses")}</SelectItem>
                  <SelectItem value="pending">{t("status.pending")}</SelectItem>
                  <SelectItem value="approved">{t("status.approved")}</SelectItem>
                  <SelectItem value="upcoming">{t("status.upcoming")}</SelectItem>
                  <SelectItem value="ongoing">{t("status.ongoing")}</SelectItem>
                  <SelectItem value="ended">{t("status.ended")}</SelectItem>
                  <SelectItem value="cancelled">{t("status.cancelled")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="admin-table-shell border-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : events?.data.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center text-center p-8">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">{t("noEvents")}</h3>
              <p className="text-muted-foreground">{t("noEventsDescription")}</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.event")}</TableHead>
                    <TableHead>{t("table.creator")}</TableHead>
                    <TableHead>{t("table.dates")}</TableHead>
                    <TableHead>{t("table.attendees")}</TableHead>
                    <TableHead>{t("table.location")}</TableHead>
                    <TableHead>{t("table.status")}</TableHead>
                    <TableHead className="w-[100px]">{t("table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events?.data.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {event.coverImage && (
                            <img 
                              src={event.coverImage} 
                              alt={event.title}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <Link 
                              href={localizeHref(pathname, `/admin/content/events/${event.id}`)}
                              className="font-medium hover:underline"
                            >
                              {event.title}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {event.ticketTypes.length} {t("ticketTypes")}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{event.creator.name}</p>
                          <p className="text-muted-foreground">{event.community.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <p>{new Date(event.startDate).toLocaleDateString()}</p>
                          <p className="text-muted-foreground">
                            {new Date(event.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{event.attendeeCount}</span>
                          {event.maxAttendees && (
                            <span className="text-muted-foreground">/ {event.maxAttendees}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {event.isOnline ? (
                            <>
                              <Video className="h-4 w-4 text-muted-foreground" />
                              <span>{t("online")}</span>
                            </>
                          ) : (
                            <>
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate max-w-[100px]">{event.location}</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(event.status, event.eventStatus)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={localizeHref(pathname, `/admin/content/events/${event.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                {t("actions.view")}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={localizeHref(pathname, `/admin/content/events/${event.id}/attendees`)}>
                                <Users className="h-4 w-4 mr-2" />
                                {t("actions.viewAttendees")}
                              </Link>
                            </DropdownMenuItem>
                            {event.status === "pending" && (
                              <DropdownMenuItem onClick={() => handleApprove(event.id)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {t("actions.approve")}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild>
                              <Link href={localizeHref(pathname, `/admin/content/events/${event.id}/message`)}>
                                <Mail className="h-4 w-4 mr-2" />
                                {t("actions.messageAttendees")}
                              </Link>
                            </DropdownMenuItem>
                            {event.eventStatus !== "cancelled" && event.eventStatus !== "ended" && (
                              <DropdownMenuItem 
                                onClick={() => handleCancel(event.id)}
                                className="text-destructive"
                              >
                                <AlertCircle className="h-4 w-4 mr-2" />
                                {t("actions.cancel")}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {events && events.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {t("showing")} {(page - 1) * limit + 1} - {Math.min(page * limit, events.total)} {t("of")} {events.total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!events.hasPrevPage}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams)
                        params.set("page", (page - 1).toString())
                        router.push(`${pathname}?${params.toString()}`)
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!events.hasNextPage}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams)
                        params.set("page", (page + 1).toString())
                        router.push(`${pathname}?${params.toString()}`)
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
