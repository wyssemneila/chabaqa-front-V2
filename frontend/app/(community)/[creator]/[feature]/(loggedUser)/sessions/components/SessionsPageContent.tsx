"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import HeaderSection from "@/app/(community)/[creator]/[feature]/(loggedUser)/sessions/components/HeaderSection"
import SessionsTabs from "@/app/(community)/[creator]/[feature]/(loggedUser)/sessions/components/SessionsTabs"
import { sessionsCommunityApi } from "@/lib/api/sessions-community.api"

interface SessionsPageContentProps {
  slug: string
  community: any
  sessions: any[]
  userBookings: any[]
}

export default function SessionsPageContent({
  slug,
  community,
  sessions,
  userBookings: initialBookings,
}: SessionsPageContentProps) {
  const [activeTab, setActiveTab] = useState("available")
  const [userBookings, setUserBookings] = useState<any[]>([])

  const normalizedSlug = useMemo(() => {
    try {
      return decodeURIComponent(String(slug || "")).trim().toLowerCase()
    } catch {
      return String(slug || "").trim().toLowerCase()
    }
  }, [slug])

  const currentCommunityId = useMemo(() => {
    const candidates = [community?.id, community?._id, community?.communityId]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
    return candidates[0] || ""
  }, [community])

  const scopedSessionIds = useMemo(
    () => new Set((sessions || []).map((session) => String(session?.id || "").trim()).filter(Boolean)),
    [sessions],
  )

  const filterBookingsToCurrentCommunity = useCallback((bookings: any[]) => {
    return (bookings || []).filter((booking) => {
      const bookingCommunityId = String(
        booking?.communityId || booking?.session?.communityId || "",
      ).trim()
      if (currentCommunityId && bookingCommunityId) {
        return bookingCommunityId === currentCommunityId
      }

      const bookingCommunitySlug = String(
        booking?.communitySlug || booking?.session?.communitySlug || "",
      ).trim().toLowerCase()
      if (normalizedSlug && bookingCommunitySlug) {
        return bookingCommunitySlug === normalizedSlug
      }

      const bookingSessionId = String(booking?.sessionId || booking?.session?.id || "").trim()
      if (bookingSessionId) {
        return scopedSessionIds.has(bookingSessionId)
      }

      return false
    })
  }, [currentCommunityId, normalizedSlug, scopedSessionIds])

  useEffect(() => {
    setUserBookings(filterBookingsToCurrentCommunity(initialBookings))
  }, [initialBookings, filterBookingsToCurrentCommunity])

  useEffect(() => {
    let isMounted = true

    const fetchUserBookings = async () => {
      try {
        const bookings = await sessionsCommunityApi.getUserBookings({
          communityId: currentCommunityId || undefined,
          communitySlug: normalizedSlug || undefined,
          sessionIds: Array.from(scopedSessionIds),
        })

        if (!isMounted) return
        setUserBookings(filterBookingsToCurrentCommunity(bookings))
      } catch (error) {
        if (!isMounted) return
        setUserBookings(filterBookingsToCurrentCommunity(initialBookings))
      }
    }

    void fetchUserBookings()

    return () => {
      isMounted = false
    }
  }, [
    currentCommunityId,
    normalizedSlug,
    scopedSessionIds,
    initialBookings,
    filterBookingsToCurrentCommunity,
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <HeaderSection sessions={sessions} userBookings={userBookings} />
        <SessionsTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sessions={sessions}
          userBookings={userBookings}
        />
      </div>
    </div>
  )
}
