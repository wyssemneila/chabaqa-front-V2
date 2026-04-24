"use client"

import { useEffect, useState, useCallback } from "react"
import { sessionsApi, type BookingStats, type CreatorBookingViewModel } from "@/lib/api/sessions.api"
import { useToast } from "@/hooks/use-toast"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import BookingsPageContent from "./components/bookings-page-content"

export default function CreatorBookingsPage() {
  const { toast } = useToast()
  const { isLoading: communityLoading } = useCreatorCommunity()

  const [bookings, setBookings] = useState<CreatorBookingViewModel[]>([])
  const [stats, setStats] = useState<BookingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [timeFilter, setTimeFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const loadBookings = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = {
        page,
        limit: 20,
        timeFilter,
      }
      if (statusFilter) params.status = statusFilter
      if (searchQuery) params.search = searchQuery

      const response = await sessionsApi.getCreatorBookings(params)
      
      setBookings(response.bookings || [])
      setStats(response.stats || null)
      setTotal(response.total || 0)
      setTotalPages(response.totalPages || 1)
    } catch (error: any) {
      toast({
        title: "Failed to load bookings",
        description: error?.message || "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, timeFilter, searchQuery, toast])

  useEffect(() => {
    if (communityLoading) return
    loadBookings()
  }, [communityLoading, loadBookings])

  const handleRefresh = () => {
    loadBookings()
  }

  return (
    <BookingsPageContent
      bookings={bookings}
      stats={stats}
      loading={loading}
      page={page}
      totalPages={totalPages}
      total={total}
      statusFilter={statusFilter}
      timeFilter={timeFilter}
      searchQuery={searchQuery}
      onPageChange={setPage}
      onStatusFilterChange={setStatusFilter}
      onTimeFilterChange={setTimeFilter}
      onSearchChange={setSearchQuery}
      onRefresh={handleRefresh}
    />
  )
}
