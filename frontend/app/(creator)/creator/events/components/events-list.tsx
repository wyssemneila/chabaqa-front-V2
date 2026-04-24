"use client"

import { useState } from "react"
import Link from "next/link"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CalendarIcon,
  Clock,
  MapPin,
  Users,
  Ticket,
  Coins,
  Mic,
  Globe,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Plus
} from "lucide-react"
import Image from "next/image"
import { Event } from "@/lib/models"

interface EventsListProps {
  activeTab: string
  upcomingEvents: Event[]
  pastEvents: Event[]
  loading?: boolean
  communityEventBaseUrl?: string | null
}

export function EventsList({ activeTab, upcomingEvents, pastEvents, loading, communityEventBaseUrl }: EventsListProps) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)

  const toggleExpandEvent = (eventId: string) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId)
  }

  const displayEvents = activeTab === "upcoming" ? upcomingEvents : pastEvents

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {displayEvents.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          isExpanded={expandedEvent === event.id}
          onToggleExpand={toggleExpandEvent}
          communityEventBaseUrl={communityEventBaseUrl}
        />
      ))}

      {displayEvents.length === 0 && <EmptyState type={activeTab as 'upcoming' | 'past'} />}
    </div>
  )
}

interface EventCardProps {
  event: Event
  isExpanded: boolean
  onToggleExpand: (eventId: string) => void
  communityEventBaseUrl?: string | null
}

function EventCard({ event, isExpanded, onToggleExpand, communityEventBaseUrl }: EventCardProps) {
  const totalSessions = event.sessions?.length || 0
  const totalTicketsSold = (event.tickets || []).reduce((acc, ticket) => acc + (ticket.sold || 0), 0)
  const revenue = (event.tickets || []).reduce((acc, ticket) => acc + ((ticket.price || 0) * (ticket.sold || 0)), 0)

  return (
    <EnhancedCard key={event.id} className="overflow-hidden">
      <div className="p-6">
        <EventCardHeader
          event={event}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
          communityEventBaseUrl={communityEventBaseUrl}
        />

        {isExpanded && (
          <div className="mt-6 pt-6 border-t">
            <EventStats
              attendees={event.attendees?.length || 0}
              ticketsSold={totalTicketsSold}
              sessions={totalSessions}
              revenue={revenue}
            />

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <QuickActions eventId={event.id} />
              <EventDetails event={event} />
            </div>
          </div>
        )}
      </div>
    </EnhancedCard>
  )
}

function EventCardHeader({ event, isExpanded, onToggleExpand, communityEventBaseUrl }: EventCardProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start space-x-4">
        <EventImage image={event.image} title={event.title} />
        <div>
          <h3 className="text-xl font-semibold">{event.title}</h3>
          <EventMeta event={event} />
          <EventBadges event={event} />
        </div>
      </div>
      <EventActions
        eventId={event.id}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        communityEventBaseUrl={communityEventBaseUrl}
      />
    </div>
  )
}

function EventImage({ image, title }: { image?: string, title: string }) {
  return (
    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
      {image ? (
        <Image
          src={image}
          alt={title}
          width={96}
          height={96}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-200">
          <CalendarIcon className="h-8 w-8 text-gray-400" />
        </div>
      )}
    </div>
  )
}

function EventMeta({ event }: { event: Event }) {
  return (
    <div className="flex items-center space-x-4 mt-1">
      <div className="flex items-center text-sm text-muted-foreground">
        <CalendarIcon className="h-4 w-4 mr-1" />
        {new Date(event.startDate).toLocaleDateString()}
      </div>
      <div className="flex items-center text-sm text-muted-foreground">
        <Clock className="h-4 w-4 mr-1" />
        {event.startTime} - {event.endTime}
      </div>
      <div className="flex items-center text-sm text-muted-foreground">
        {event.type === "Online" ? (
          <>
            <Globe className="h-4 w-4 mr-1" />
            Online
          </>
        ) : (
          <>
            <MapPin className="h-4 w-4 mr-1" />
            {event.location}
          </>
        )}
      </div>
    </div>
  )
}

function EventBadges({ event }: { event: Event }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <Badge variant="outline">{event.category}</Badge>
      <Badge variant={event.isPublished ? "default" : "secondary"}>
        {event.isPublished ? "Published" : "Draft"}
      </Badge>
      <Badge variant={event.isActive ? "default" : "secondary"}>
        {event.isActive ? "Active" : "Inactive"}
      </Badge>
      {event.type === "Hybrid" && <Badge variant="outline">Hybrid</Badge>}
    </div>
  )
}

function EventActions({ eventId, isExpanded, onToggleExpand, communityEventBaseUrl }: {
  eventId: string
  isExpanded: boolean
  onToggleExpand: (eventId: string) => void
  communityEventBaseUrl?: string | null
}) {
  const viewHref = communityEventBaseUrl
    ? `${communityEventBaseUrl}?eventId=${encodeURIComponent(String(eventId))}`
    : `/creator/events/${eventId}`

  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={viewHref}>
          <Eye className="h-4 w-4 mr-2" />
          View
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href={`/creator/events/${eventId}`}>
          <Edit className="h-4 w-4 mr-2" />
          Manage
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onToggleExpand(eventId)}
      >
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}

function EventStats({
  attendees,
  ticketsSold,
  sessions,
  revenue
}: {
  attendees: number
  ticketsSold: number
  sessions: number
  revenue: number
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-xl font-bold">{attendees}</p>
              <p className="text-sm text-muted-foreground">Attendees</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Ticket className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-xl font-bold">{ticketsSold}</p>
              <p className="text-sm text-muted-foreground">Tickets Sold</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Mic className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-xl font-bold">{sessions}</p>
              <p className="text-sm text-muted-foreground">Sessions</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Coins className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-xl font-bold">{revenue.toFixed(2)} TND</p>
              <p className="text-sm text-muted-foreground">Revenue</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function QuickActions({ eventId }: { eventId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Button variant="outline" className="w-full" asChild>
            <Link href={`/creator/events/${eventId}`}>
              <Users className="h-4 w-4 mr-2" />
              Manage Attendees
            </Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href={`/creator/events/${eventId}`}>
              <Ticket className="h-4 w-4 mr-2" />
              Manage Tickets
            </Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href={`/creator/events/${eventId}`}>
              <CalendarIcon className="h-4 w-4 mr-2" />
              Manage Sessions
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function EventDetails({ event }: { event: Event }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span>
              <Badge variant={event.isPublished ? "default" : "secondary"}>
                {event.isPublished ? "Published" : "Draft"}
              </Badge>
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type:</span>
            <span>{event.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date:</span>
            <span>{new Date(event.startDate).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time:</span>
            <span>
              {event.startTime} - {event.endTime} ({event.timezone})
            </span>
          </div>
          {event.location && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location:</span>
              <span>{event.location}</span>
            </div>
          )}
          {event.onlineUrl && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground flex-shrink-0">Online URL:</span>
              <span className="truncate text-right">{event.onlineUrl}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ type }: { type: 'upcoming' | 'past' }) {
  return (
    <EnhancedCard className="text-center py-12">
      <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
      <h3 className="text-xl font-semibold mb-2">
        {type === 'upcoming' ? 'No upcoming events' : 'No past events'}
      </h3>
      <p className="text-muted-foreground mb-6">
        {type === 'upcoming'
          ? 'Create your first event to get started'
          : 'Your past events will appear here'}
      </p>
      {type === 'upcoming' && (
        <Button asChild>
          <Link href="/creator/events/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Link>
        </Button>
      )}
    </EnhancedCard>
  )
}
