"use client"

import React from "react"
import { useEffect, useState, useCallback, useRef } from "react"
import ClientSessionsView from "./components/client-sessions-view"
import { type CreatorBookingViewModel } from "@/lib/api/events/sessions.api"
import { useToast } from "@/hooks/use-toast"
import { useCommunityGuard } from "@/hooks/use-community-guard"
import { loadSessionsCached } from "@/app/(creator)/creator/context/community-switch-cache"
import { PageState, TOAST_MESSAGES } from "@/components/creator-dashboard"

export default function CreatorSessionsPage() {
  const { toast } = useToast()
  const {
    guard,
    selectedCommunityId,
    isLoading: communityLoading,
  } = useCommunityGuard()

  const [sessions, setSessions] = useState<any[]>([])
  const [bookings, setBookings] = useState<CreatorBookingViewModel[]>([])
  const [revenue, setRevenue] = useState<number | null>(null)
  const [isSwitchLoading, setIsSwitchLoading] = useState<boolean>(true)
  const requestIdRef = useRef(0)

  const loadSessions = useCallback(async (communityId: string, options?: { force?: boolean; keepCurrentData?: boolean }) => {
    const requestId = ++requestIdRef.current

    if (!options?.keepCurrentData) {
      setIsSwitchLoading(true)
      setSessions([])
      setBookings([])
      setRevenue(null)
    }

    try {
      const payload = await loadSessionsCached(communityId, { force: options?.force })
      if (requestId !== requestIdRef.current) return

      setSessions(payload.sessions)
      setBookings(payload.bookings)
      setRevenue(payload.revenue)
    } catch (e: any) {
      toast(TOAST_MESSAGES.error("load sessions"))
      if (requestId !== requestIdRef.current) return
      setSessions([])
      setBookings([])
      setRevenue(null)
    } finally {
      if (requestId === requestIdRef.current) {
        setIsSwitchLoading(false)
      }
    }
  }, [toast])

  useEffect(() => {
    if (communityLoading) return

    if (!selectedCommunityId) {
      requestIdRef.current += 1
      setSessions([])
      setBookings([])
      setRevenue(null)
      setIsSwitchLoading(false)
      return
    }

    loadSessions(selectedCommunityId)
  }, [selectedCommunityId, communityLoading, loadSessions])

  const handleSessionsUpdate = () => {
    if (!selectedCommunityId) return
    loadSessions(selectedCommunityId, { force: true, keepCurrentData: true })
  }

  // Community guard
  if (guard) return guard

  return (
    <ClientSessionsView
      allSessions={sessions}
      allBookings={bookings}
      revenue={revenue ?? undefined}
      isSwitchLoading={isSwitchLoading}
      onSessionsUpdate={handleSessionsUpdate}
    />
  )
}
