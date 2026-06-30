'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import { Loader2, AlertCircle } from 'lucide-react'
import { eventsApi, normalizeEventResponse } from '@/lib/api/events.api'
import ManageEventClient from './components/ManageEventClient'

export default function ManageEventPage() {
  const params = useParams<{ eventId?: string; id?: string }>()
  const router = useRouter()
  const eventId = String(params?.eventId || params?.id || '')
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const serverVersion = useMemo(() => String(event?.updatedAt || event?._id || event?.id || Date.now()), [event])

  useEffect(() => {
    let cancelled = false

    const loadEvent = async () => {
      if (!eventId) {
        setError('Event ID is missing.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      try {
        const response = await eventsApi.getById(eventId)
        const nextEvent = normalizeEventResponse(response)
        if (!nextEvent?.id && !nextEvent?._id) {
          throw new Error('Event was not found.')
        }
        const resolvedMongoId = String(nextEvent?.mongoId || nextEvent?._id || nextEvent?.id || '')
        const publicId = nextEvent?.id && nextEvent.id !== resolvedMongoId ? nextEvent.id : nextEvent?.publicId
        if (!cancelled) setEvent({ ...nextEvent, id: resolvedMongoId, mongoId: resolvedMongoId, publicId })
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load event.')
          if (err?.statusCode === 404 || err?.status === 404) router.replace('/creator/events')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadEvent()
    return () => {
      cancelled = true
    }
  }, [eventId, router])

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <DashSidebar />
      <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
        <DashTopbar title="Manage Event" subtitle="Edit event details, sessions, speakers, tickets and settings" />
        <main id="main-content" className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--p)' }} />
            </div>
          ) : error ? (
            <div className="m-7 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : (
            <ManageEventClient initialEvent={event} serverVersion={serverVersion} />
          )}
        </main>
      </div>
    </div>
  )
}
