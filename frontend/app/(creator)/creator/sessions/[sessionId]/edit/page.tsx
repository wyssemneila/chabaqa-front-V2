'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import { AlertCircle } from 'lucide-react'
import { sessionsApi, normalizeSessionResponse } from '@/lib/api/sessions.api'
import { SessionEditForm } from './components/session-edit-form'
import { SessionBookings } from './components/session-bookings'
import { SessionAvailabilityWrapper } from './components/session-availability-wrapper'
import { PageState } from '@/components/creator-dashboard/page-state'

function unwrapSession(response: any) {
  return normalizeSessionResponse(response)
}

export default function EditSessionPage() {
  const params = useParams<{ sessionId?: string; id?: string }>()
  const router = useRouter()
  const sessionId = String(params?.sessionId || params?.id || '')
  const [session, setSession] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadSession = async () => {
      if (!sessionId) {
        setError('Session ID is missing.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      try {
        const [response, bookingsResponse] = await Promise.all([
          sessionsApi.getById(sessionId),
          sessionsApi.getBookings(sessionId).catch(() => null),
        ])
        const nextSession = unwrapSession(response)
        if (!nextSession?.id && !nextSession?._id) {
          throw new Error('Session was not found.')
        }
        if (!cancelled) {
          const resolvedMongoId = String(nextSession.mongoId || nextSession._id || nextSession.id || '')
          setSession({
            ...nextSession,
            id: resolvedMongoId,
            mongoId: resolvedMongoId,
            publicId: nextSession.id && nextSession.id !== resolvedMongoId ? nextSession.id : undefined,
          })
          const bookingsPayload: any = bookingsResponse
          const nextBookings =
            bookingsPayload?.data?.bookings ||
            bookingsPayload?.data?.data ||
            bookingsPayload?.data ||
            bookingsPayload?.bookings ||
            []
          setBookings(Array.isArray(nextBookings) ? nextBookings : [])
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load session.')
          if (err?.statusCode === 404 || err?.status === 404) router.replace('/creator/sessions')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadSession()
    return () => {
      cancelled = true
    }
  }, [sessionId, router])

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <DashSidebar />
      <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
        <DashTopbar title="Edit Session" subtitle="Manage session details, availability and bookings" />
        <main id="main-content" className="flex-1 p-7">
          {loading ? (
            <PageState variant="loading" compact />
          ) : error ? (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : (
            <div className="space-y-6">
              <SessionEditForm session={session} sessionId={String(session?.mongoId || session?.id || sessionId)} />
              <SessionAvailabilityWrapper sessionId={String(session?.mongoId || session?.id || sessionId)} duration={Number(session?.duration || 60)} />
              <SessionBookings bookings={bookings} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
