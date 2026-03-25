"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import { localizeHref, stripLocaleFromPath } from "@/lib/i18n/client"
import { adminApi } from "@/lib/api/admin-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  CheckCircle, 
  MapPin,
  Video,
  Loader2,
  Clock,
  Star,
  AlertCircle,
  ChevronRight,
  User,
  Ticket
} from "lucide-react"
import { toast } from "sonner"

interface Event {
  id: string
  title: string
  description: string
  coverImage?: string
  status: string
  creator: { id: string; name: string; email: string; avatar?: string }
  community: { id: string; name: string; slug: string }
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
  isPrivate: boolean
  approvalRequired: boolean
  agenda?: Array<{
    id: string
    startTime: string
    endTime: string
    title: string
    description: string
    speaker?: string
  }>
  speakers?: Array<{
    id: string
    name: string
    title: string
    bio?: string
    avatar?: string
  }>
  requirements?: string[]
  whatToBring?: string[]
  createdAt: string
}

export default function EventDetailPage() {
  const t = useTranslations("admin.content.events.detail")
  const params = useParams()
  const pathname = usePathname()
  const eventId = params.id as string
  const internalPath = stripLocaleFromPath(pathname)

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await adminApi.content.getEventById(eventId)
        if (response.success) {
          setEvent(response.data)
        }
      } catch (error) {
        console.error("Failed to fetch event:", error)
        toast.error(t("fetchError"))
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [eventId, t])

  const handleApprove = async () => {
    try {
      await adminApi.content.approveEvent(eventId)
      toast.success(t("approveSuccess"))
      const response = await adminApi.content.getEventById(eventId)
      if (response.success) setEvent(response.data)
    } catch (error) {
      toast.error(t("approveError"))
    }
  }

  const handleCancel = async () => {
    try {
      await adminApi.content.cancelEvent(eventId, "Cancelled by admin")
      toast.success(t("cancelSuccess"))
      const response = await adminApi.content.getEventById(eventId)
      if (response.success) setEvent(response.data)
    } catch (error) {
      toast.error(t("cancelError"))
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center p-8">
        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">{t("notFound")}</h3>
        <p className="text-muted-foreground">{t("notFoundDescription")}</p>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      upcoming: "bg-blue-500",
      ongoing: "bg-emerald-500",
      ended: "bg-gray-500",
      cancelled: "bg-red-500",
    }
    return colors[status] || "bg-gray-500"
  }

  return (
    <div className="space-y-8">
      <div className="admin-section-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={localizeHref(pathname, "/admin/content/events")}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{event.title}</h1>
            <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {event.status === "pending" && (
            <Button onClick={handleApprove}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {t("actions.approve")}
            </Button>
          )}
          {event.eventStatus !== "cancelled" && event.eventStatus !== "ended" && (
            <Button variant="destructive" onClick={handleCancel}>
              <AlertCircle className="h-4 w-4 mr-2" />
              {t("actions.cancel")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
            {event.coverImage && (
              <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                <img 
                  src={event.coverImage} 
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge className={getStatusColor(event.eventStatus)}>
                  {t(`status.${event.eventStatus}`)}
                </Badge>
                {event.isFeatured && (
                  <Badge className="bg-primary">
                    <Star className="h-3 w-3 mr-1" />
                    {t("featured")}
                  </Badge>
                )}
                {event.isOnline ? (
                  <Badge variant="outline" className="text-blue-600">
                    <Video className="h-3 w-3 mr-1" />
                    {t("online")}
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <MapPin className="h-3 w-3 mr-1" />
                    {t("inPerson")}
                  </Badge>
                )}
                {event.isPrivate && (
                  <Badge variant="outline" className="text-amber-600">
                    {t("private")}
                  </Badge>
                )}
              </div>
              <CardTitle>{t("overview.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{event.description}</p>
              
              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("overview.startDate")}</p>
                    <p className="font-medium">{new Date(event.startDate).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("overview.endDate")}</p>
                    <p className="font-medium">{new Date(event.endDate).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {event.isOnline ? (
                    <Video className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">{t("overview.location")}</p>
                    <p className="font-medium">{event.isOnline ? t("onlineEvent") : event.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("overview.attendees")}</p>
                    <p className="font-medium">{event.attendeeCount}</p>
                    {event.maxAttendees && (
                      <p className="text-xs text-muted-foreground">/ {event.maxAttendees} {t("overview.max")}</p>
                    )}
                  </div>
                </div>
              </div>

              {event.onlineLink && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-primary" />
                    <a 
                      href={event.onlineLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {t("overview.onlineLink")}
                    </a>
                  </div>
                </>
              )}

              {event.requirements && event.requirements.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">{t("overview.requirements")}</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {event.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {event.whatToBring && event.whatToBring.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">{t("overview.whatToBring")}</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {event.whatToBring.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="tickets" className="w-full">
            <TabsList>
              <TabsTrigger value="tickets">{t("tabs.tickets")}</TabsTrigger>
              {event.agenda && event.agenda.length > 0 && (
                <TabsTrigger value="agenda">{t("tabs.agenda")}</TabsTrigger>
              )}
              {event.speakers && event.speakers.length > 0 && (
                <TabsTrigger value="speakers">{t("tabs.speakers")}</TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="tickets">
              <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
                <CardHeader>
                  <CardTitle>{t("tickets.title")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {event.ticketTypes.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">{t("tickets.empty")}</p>
                  ) : (
                    <div className="space-y-3">
                      {event.ticketTypes.map((ticket) => (
                        <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Ticket className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{ticket.name}</p>
                              <Badge variant="outline" className="text-xs uppercase">{ticket.type}</Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {ticket.price > 0 ? `${ticket.price}` : t("tickets.free")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {ticket.sold} {t("tickets.sold")}
                              {ticket.quantity && ` / ${ticket.quantity} ${t("tickets.available")}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            {event.agenda && event.agenda.length > 0 && (
              <TabsContent value="agenda">
                <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
                  <CardHeader>
                    <CardTitle>{t("agenda.title")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {event.agenda.map((item) => (
                      <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                        <div className="text-sm text-muted-foreground min-w-[100px]">
                          <p>{item.startTime}</p>
                          <p>{item.endTime}</p>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          {item.speaker && (
                            <p className="text-sm text-primary mt-1">{t("agenda.speaker")}: {item.speaker}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            {event.speakers && event.speakers.length > 0 && (
              <TabsContent value="speakers">
                <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
                  <CardHeader>
                    <CardTitle>{t("speakers.title")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {event.speakers.map((speaker) => (
                        <div key={speaker.id} className="flex items-center gap-3 p-4 border rounded-lg">
                          {speaker.avatar ? (
                            <img 
                              src={speaker.avatar} 
                              alt={speaker.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-6 w-6 text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{speaker.name}</p>
                            <p className="text-sm text-muted-foreground">{speaker.title}</p>
                            {speaker.bio && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{speaker.bio}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
            <CardHeader>
              <CardTitle>{t("creator.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {event.creator.avatar ? (
                  <img 
                    src={event.creator.avatar} 
                    alt={event.creator.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-medium text-primary">
                      {event.creator.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium">{event.creator.name}</p>
                  <p className="text-sm text-muted-foreground">{event.creator.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
            <CardHeader>
              <CardTitle>{t("community.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{event.community.name}</p>
                  <Link 
                    href={localizeHref(pathname, `/admin/communities/${event.community.id}`)}
                    className="text-sm text-primary hover:underline"
                  >
                    {t("community.viewCommunity")}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" asChild>
            <Link href={localizeHref(pathname, `/admin/content/events/${eventId}/attendees`)}>
              <Users className="h-4 w-4 mr-2" />
              {t("viewAttendees")}
            </Link>
          </Button>

          <Button className="w-full" variant="outline" asChild>
            <Link href={localizeHref(pathname, `/admin/content/events/${eventId}/message`)}>
              <Star className="h-4 w-4 mr-2" />
              {t("messageAttendees")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
