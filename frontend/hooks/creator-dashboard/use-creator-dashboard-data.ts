'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuthContext } from '@/app/providers/auth-provider'
import {
  communitiesApi,
  coursesApi,
  challengesApi,
  eventsApi,
  postsApi,
  productsApi,
  sessionsApi,
  creatorAnalyticsApi,
} from '@/lib/api'
import {
  makeDashboardOverview,
  mapBooking,
  mapChallenge,
  mapCourse,
  mapEvent,
  mapProduct,
  mapSession,
  unwrapArray,
  unwrapData,
  type CreatorBookingCard,
  type CreatorChallengeCard,
  type CreatorDashboardOverviewVm,
  type CreatorEventCard,
  type CreatorListStatus,
  type CreatorProductCard,
  type CreatorSessionCard,
} from '@/lib/creator-dashboard/fetch-adapters'
import type { CourseCardData } from '@/components/courses/course-card'

interface CreatorDataState<T> {
  data: T
  status: CreatorListStatus
  loading: boolean
  error: string
  refetch: () => void
}

const messageFromError = (error: any) =>
  String(error?.message || error?.error || 'Unable to load creator dashboard data')

function useCreatorId() {
  const { user, loading } = useAuthContext()
  return {
    creatorId: String(user?._id || user?.id || ''),
    authLoading: loading,
  }
}

function useCreatorApiList<T>(
  loader: (creatorId: string) => Promise<any>,
  mapper: (item: any) => T,
): CreatorDataState<T[]> {
  const { creatorId, authLoading } = useCreatorId()
  const [data, setData] = useState<T[]>([])
  const [status, setStatus] = useState<CreatorListStatus>('idle')
  const [error, setError] = useState('')
  const [refreshIndex, setRefreshIndex] = useState(0)

  useEffect(() => {
    if (authLoading) return

    let alive = true
    const run = async () => {
      setStatus('loading')
      setError('')

      if (!creatorId) {
        if (!alive) return
        setData([])
        setError('Sign in to load creator dashboard data.')
        setStatus('error')
        return
      }

      try {
        const response = await loader(creatorId)
        const list = unwrapArray(response).map(mapper)
        if (!alive) return
        setData(list)
        setStatus('success')
      } catch (err) {
        if (!alive) return
        setData([])
        setError(messageFromError(err))
        setStatus('error')
      }
    }

    run()
    return () => {
      alive = false
    }
  }, [authLoading, creatorId, loader, mapper, refreshIndex])

  const refetch = useCallback(() => setRefreshIndex((value) => value + 1), [])
  return { data, status, loading: status === 'idle' || status === 'loading', error, refetch }
}

export function useCreatorCoursesPage() {
  const loader = useCallback(() => coursesApi.getCreated({ page: 1, limit: 100 }), [])
  const mapper = useCallback((item: any) => mapCourse(item), [])
  return useCreatorApiList<CourseCardData>(loader, mapper)
}

export function useCreatorChallengesPage() {
  const loader = useCallback((creatorId: string) => challengesApi.getByCreator(creatorId, { page: 1, limit: 100 }), [])
  const mapper = useCallback((item: any) => mapChallenge(item), [])
  return useCreatorApiList<CreatorChallengeCard>(loader, mapper)
}

export function useCreatorEventsPage() {
  const loader = useCallback((creatorId: string) => eventsApi.getByCreator(creatorId, { page: 1, limit: 100 }), [])
  const mapper = useCallback((item: any) => mapEvent(item), [])
  return useCreatorApiList<CreatorEventCard>(loader, mapper)
}

export function useCreatorProductsPage() {
  const loader = useCallback((creatorId: string) => productsApi.getByCreator(creatorId, { page: 1, limit: 100 }), [])
  const mapper = useCallback((item: any) => mapProduct(item), [])
  return useCreatorApiList<CreatorProductCard>(loader, mapper)
}

export function useCreatorSessionsPage() {
  const { creatorId, authLoading } = useCreatorId()
  const [sessions, setSessions] = useState<CreatorSessionCard[]>([])
  const [bookings, setBookings] = useState<CreatorBookingCard[]>([])
  const [status, setStatus] = useState<CreatorListStatus>('idle')
  const [error, setError] = useState('')
  const [refreshIndex, setRefreshIndex] = useState(0)

  useEffect(() => {
    if (authLoading) return

    let alive = true
    const run = async () => {
      setStatus('loading')
      setError('')

      if (!creatorId) {
        if (!alive) return
        setSessions([])
        setBookings([])
        setError('Sign in to load creator dashboard data.')
        setStatus('error')
        return
      }

      try {
        const [sessionsResponse, bookingsResponse] = await Promise.allSettled([
          sessionsApi.getByCreator(creatorId, { page: 1, limit: 100 }),
          sessionsApi.getCreatorBookings({ page: 1, limit: 100 }),
        ])

        const nextSessions = sessionsResponse.status === 'fulfilled'
          ? unwrapArray(sessionsResponse.value).map(mapSession)
          : []
        const nextBookings = bookingsResponse.status === 'fulfilled'
          ? unwrapArray(bookingsResponse.value).map(mapBooking)
          : []

        if (!alive) return
        setSessions(nextSessions)
        setBookings(nextBookings)
        setError(
          [sessionsResponse, bookingsResponse]
            .filter((result) => result.status === 'rejected')
            .map((result: any) => messageFromError(result.reason))
            .join(' · '),
        )
        setStatus(sessionsResponse.status === 'rejected' && bookingsResponse.status === 'rejected' ? 'error' : 'success')
      } catch (err) {
        if (!alive) return
        setSessions([])
        setBookings([])
        setError(messageFromError(err))
        setStatus('error')
      }
    }

    run()
    return () => {
      alive = false
    }
  }, [authLoading, creatorId, refreshIndex])

  const refetch = useCallback(() => setRefreshIndex((value) => value + 1), [])
  return { sessions, bookings, status, loading: status === 'idle' || status === 'loading', error, refetch }
}

export function useCreatorDashboardOverview(): CreatorDataState<CreatorDashboardOverviewVm | null> {
  const { creatorId, authLoading } = useCreatorId()
  const [data, setData] = useState<CreatorDashboardOverviewVm | null>(null)
  const [status, setStatus] = useState<CreatorListStatus>('idle')
  const [error, setError] = useState('')
  const [refreshIndex, setRefreshIndex] = useState(0)

  useEffect(() => {
    if (authLoading) return

    let alive = true
    const run = async () => {
      setStatus('loading')
      setError('')

      if (!creatorId) {
        if (!alive) return
        setData(makeDashboardOverview({}))
        setError('Sign in to load creator dashboard data.')
        setStatus('error')
        return
      }

      const settled = await Promise.allSettled([
        communitiesApi.getMyManageable(),
        creatorAnalyticsApi.getOverview(),
        coursesApi.getCreated({ page: 1, limit: 100 }),
        challengesApi.getByCreator(creatorId, { page: 1, limit: 100 }),
        sessionsApi.getByCreator(creatorId, { page: 1, limit: 100 }),
        eventsApi.getByCreator(creatorId, { page: 1, limit: 100 }),
        productsApi.getByCreator(creatorId, { page: 1, limit: 100 }),
        postsApi.getByCreator(creatorId, { page: 1, limit: 100 }),
        creatorAnalyticsApi.getPayoutStats(),
        creatorAnalyticsApi.getAvailableBalance(),
      ])

      const valueAt = (index: number) => settled[index].status === 'fulfilled'
        ? (settled[index] as PromiseFulfilledResult<any>).value
        : null

      const overview = makeDashboardOverview({
        communities: unwrapArray(valueAt(0)),
        overview: unwrapData(valueAt(1), {}),
        courses: unwrapArray(valueAt(2)),
        challenges: unwrapArray(valueAt(3)),
        sessions: unwrapArray(valueAt(4)),
        events: unwrapArray(valueAt(5)),
        products: unwrapArray(valueAt(6)),
        posts: unwrapArray(valueAt(7)),
        payouts: unwrapData(valueAt(8), {}),
        balance: unwrapData(valueAt(9), {}),
      })

      if (!alive) return
      setData(overview)
      const failures = settled
        .filter((result) => result.status === 'rejected')
        .map((result: any) => messageFromError(result.reason))
      setError(failures.join(' · '))
      setStatus(failures.length === settled.length ? 'error' : 'success')
    }

    run().catch((err) => {
      if (!alive) return
      setError(messageFromError(err))
      setData(null)
      setStatus('error')
    })

    return () => {
      alive = false
    }
  }, [authLoading, creatorId, refreshIndex])

  const refetch = useCallback(() => setRefreshIndex((value) => value + 1), [])
  return useMemo(
    () => ({ data, status, loading: status === 'idle' || status === 'loading', error, refetch }),
    [data, error, refetch, status],
  )
}
