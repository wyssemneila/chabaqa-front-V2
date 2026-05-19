"use client"

import { useEffect, useState, useMemo } from "react"
import { EventsList } from "./components/events-list"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useCommunityGuard } from "@/hooks/use-community-guard"
import { eventsApi } from "@/lib/api/events.api"
import { computeEventStartAt } from "@/lib/utils/event-time"
import {
  ModuleEmptyState,
  ModulePage,
  TOAST_MESSAGES,
} from "@/components/creator-dashboard"
import { Calendar, Coins, Plus, Ticket, Users } from "lucide-react"

export default function EventsPage() {
  const { toast } = useToast()
  const {
    guard,
    selectedCommunity,
    selectedCommunityId,
  } = useCommunityGuard()

  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [reloadKey, setReloadKey] = useState(0)
  const [revenue, setRevenue] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState("upcoming")

  const communityEventBaseUrl = useMemo(() => {
    const creatorSlug = selectedCommunity?.creator?.name
    const communitySlug = selectedCommunity?.slug
    if (!creatorSlug || !communitySlug) return null
    return `/${encodeURIComponent(String(creatorSlug))}/${encodeURIComponent(String(communitySlug))}/events`
  }, [selectedCommunity])

  useEffect(() => {
    if (!selectedCommunityId) {
      setEvents([])
      setRevenue(null)
      setLoading(false)
      return
    }

    const load = async () => {
      setLoading(true)
      setError(null)
      setRevenue(null)
      try {
        const me = await api.auth.me().catch(() => null as any)
        const user = me?.data || (me as any)?.user || null
        if (!user) {
          setEvents([])
          setLoading(false)
          return
        }

        const creatorId = user._id || user.id
        if (!creatorId) {
          setEvents([])
          setLoading(false)
          return
        }

        const params: any = { limit: 50 }
        if (selectedCommunityId) params.communityId = selectedCommunityId

        const eventsRes = await eventsApi.getByCreator(creatorId, params)
        const rawEvents = eventsRes?.data?.events || []

        const normalized = (Array.isArray(rawEvents) ? rawEvents : []).map((e: any) => ({
          id: e.id || e._id,
          title: e.title || "Untitled Event",
          description: e.description || "",
          startDate: e.startDate,
          endDate: e.endDate,
          startTime: e.startTime || "00:00",
          endTime: e.endTime || "23:59",
          timezone: e.timezone || "UTC",
          location: e.location || "TBD",
          type: e.type || "Online",
          category: e.category || "General",
          isActive: Boolean(e.isActive),
          isPublished: Boolean(e.isPublished),
          image: e.image || e.thumbnail,
          attendees: Array.isArray(e.attendees) ? e.attendees : [],
          tickets: Array.isArray(e.tickets) ? e.tickets : [],
          sessions: Array.isArray(e.sessions) ? e.sessions : [],
          speakers: Array.isArray(e.speakers) ? e.speakers : [],
          onlineUrl: e.onlineUrl,
        }))
        setEvents(normalized)

        // Revenue analytics
        try {
          const now = new Date()
          const to = now.toISOString()
          const from = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString()
          const evtAgg = await api.creatorAnalytics.getEvents({ from, to, communityId: selectedCommunityId }).catch(() => null as any)
          const byEvent = evtAgg?.data?.byEvent || evtAgg?.byEvent || []
          const analyticsRevenue = (Array.isArray(byEvent) ? byEvent : []).reduce(
            (sum: number, x: any) => sum + Number(x?.revenue ?? x?.creatorNetDT ?? x?.totalRevenue ?? 0),
            0,
          )
          const ticketsRevenue = normalized.reduce((sum: number, event: any) => {
            return (
              sum +
              (Array.isArray(event?.tickets) ? event.tickets : []).reduce(
                (acc: number, ticket: any) =>
                  acc + Number(ticket?.price ?? 0) * Number(ticket?.sold ?? ticket?.soldCount ?? 0),
                0,
              )
            )
          }, 0)
          const totalRevenue = analyticsRevenue > 0 ? analyticsRevenue : ticketsRevenue
          if (!Number.isNaN(totalRevenue)) setRevenue(totalRevenue)
        } catch {
          setRevenue(null)
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load events")
        toast(TOAST_MESSAGES.error("load events"))
        setEvents([])
        setRevenue(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedCommunityId, selectedCommunity, toast, reloadKey])

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return events
    return events.filter((event) => {
      return [event.title, event.description, event.location, event.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    })
  }, [events, searchQuery])

  const upcomingEvents = useMemo(() => {
    const now = Date.now()
    return filteredEvents.filter((event) => {
      const startAt = computeEventStartAt(event.startDate, event.startTime, event.timezone)
      if (!startAt) return true
      return startAt.getTime() >= now
    })
  }, [filteredEvents])

  const pastEvents = useMemo(() => {
    const now = Date.now()
    return filteredEvents.filter((event) => {
      const startAt = computeEventStartAt(event.startDate, event.startTime, event.timezone)
      if (!startAt) return false
      return startAt.getTime() < now
    })
  }, [filteredEvents])

  const totalEvents = events.length
  const totalUpcoming = upcomingEvents.length
  const totalPast = pastEvents.length
  const totalAttendees = events.reduce((acc, e) => acc + (e.attendees?.length || 0), 0)

  // Community guard
  if (guard) return guard

  return (
    <ModulePage
      title="Events"
      description={`Manage live, virtual, and in-person events for ${selectedCommunity?.name || "this community"}.`}
      primaryAction={{ label: "Create Event", href: "/creator/events/new", icon: Plus }}
      metrics={[
        { title: "Events", value: totalEvents, icon: Calendar, color: "primary" },
        { title: "Upcoming", value: totalUpcoming, icon: Ticket, color: "warning" },
        { title: "Attendees", value: totalAttendees, icon: Users, color: "success" },
        { title: "Revenue", value: revenue == null ? "..." : `${revenue.toLocaleString()} TND`, icon: Coins, color: "success" },
      ]}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search events..."
      dataFreshnessLabel="Event totals refresh from creator analytics and ticket data."
      density="compact"
      tabs={[
        { value: "upcoming", label: "Upcoming", count: totalUpcoming },
        { value: "past", label: "Past", count: totalPast },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      loading={loading}
      error={error}
      onRetry={() => {
        setError(null)
        setReloadKey((key) => key + 1)
      }}
      emptyState={
        !loading && !error && events.length === 0 ? (
          <ModuleEmptyState module="events" />
        ) : searchQuery && filteredEvents.length === 0 ? (
          <ModuleEmptyState module="events" hasSearchQuery />
        ) : null
      }
    >
      <EventsList
        activeTab={activeTab}
        upcomingEvents={upcomingEvents}
        pastEvents={pastEvents}
        loading={loading}
        communityEventBaseUrl={communityEventBaseUrl}
        hasSearchQuery={!!searchQuery}
      />
    </ModulePage>
  )
}
