'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import { Clock, Plus, RefreshCw, Globe, Lock, Calendar, DollarSign, Users } from 'lucide-react'

interface SessionCard {
  _id: string
  title: string
  banner?: string
  duration: number
  priceType: 'free' | 'paid'
  price?: number
  isPublished: boolean
  availabilityDays: number
  totalSlots: number
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
      <div className="aspect-video" style={{ background: 'var(--bg)' }} />
      <div className="p-5 space-y-3">
        <div className="h-4 rounded-lg w-3/4" style={{ background: 'var(--bg)' }} />
        <div className="h-3 rounded-lg w-full" style={{ background: 'var(--bg)' }} />
        <div className="flex gap-2 pt-2">
          <div className="h-8 rounded-lg flex-1" style={{ background: 'var(--bg)' }} />
          <div className="h-8 rounded-lg flex-1" style={{ background: 'var(--bg)' }} />
        </div>
      </div>
    </div>
  )
}

function SessionCardUI({ session }: { session: SessionCard }) {
  const durationLabel = session.duration >= 60
    ? `${session.duration / 60}h`
    : `${session.duration}min`

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col transition-all duration-200 group"
      style={{ background: 'var(--white)', border: '1px solid var(--bd)', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(142,120,251,.16)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,.04)'}>

      {/* banner */}
      <div className="relative aspect-video overflow-hidden" style={{ background: 'var(--bg)' }}>
        {session.banner
          ? <img src={session.banner} alt={session.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
          : <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-10 h-10 opacity-20" style={{ color: 'var(--t3)' }} />
            </div>
        }
        <span className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
          style={{ background: 'var(--p)', color: '#fff' }}>
          <Clock className="w-3 h-3" /> {durationLabel}
        </span>
        <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold"
          style={{
            background: session.isPublished ? 'rgba(16,185,129,.15)' : 'rgba(0,0,0,.4)',
            color: session.isPublished ? '#10b981' : '#fff',
            backdropFilter: 'blur(4px)',
          }}>
          {session.isPublished ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
          {session.isPublished ? 'Live' : 'Draft'}
        </span>
      </div>

      {/* body */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="text-[14px] font-bold leading-snug mb-3 line-clamp-2" style={{ color: 'var(--t1)' }}>
          {session.title}
        </h3>

        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: 'var(--t3)' }}>
            <Calendar className="w-3 h-3" /> {session.availabilityDays} days
          </span>
          <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: 'var(--t3)' }}>
            <Clock className="w-3 h-3" /> {session.totalSlots} slots/week
          </span>
        </div>

        <div className="flex items-center justify-between pt-3.5 border-t mt-auto" style={{ borderColor: 'var(--bd)' }}>
          <span className="text-[13px] font-bold"
            style={{ color: session.priceType === 'free' ? '#10b981' : 'var(--p)' }}>
            {session.priceType === 'free' ? 'Free' : `${session.price ?? 0} TND`}
          </span>
          <div className="flex items-center gap-2">
            <Link href={`/creator/sessions/${session._id}/manage`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-white transition-all hover:opacity-90"
              style={{ background: 'var(--p)', boxShadow: '0 2px 8px rgba(142,120,251,.3)' }}>
              Manage
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionCard[]>([])
  const [loading,  setLoading]  = useState(true)

  const load = () => {
    setLoading(true)
    try {
      const stored: SessionCard[] = JSON.parse(localStorage.getItem('chabaqa_mock_sessions') ?? '[]')
      setSessions(stored)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  return (
    <>
      <style>{`
        @keyframes dashFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:var(--p3);border-radius:10px}
      `}</style>

      <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
        <DashSidebar />
        <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar title="Sessions" subtitle="Manage your 1-on-1 coaching sessions" />

          <main className="p-7 flex-1" style={{ animation: 'dashFadeUp .4s ease both' }}>

            <div className="flex items-center justify-between mb-7">
              <div>
                <h2 className="text-[18px] font-bold" style={{ color: 'var(--t1)' }}>Your Sessions</h2>
                <p className="text-[13px] mt-0.5" style={{ color: 'var(--t3)' }}>
                  {loading ? 'Loading…' : `${sessions.length} session${sessions.length !== 1 ? 's' : ''} created`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={load}
                  className="p-2 rounded-xl transition-all cursor-pointer"
                  style={{ border: '1.5px solid var(--bd)', background: 'transparent', color: 'var(--t3)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--p2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                  <RefreshCw className="w-4 h-4" />
                </button>
                <Link href="/creator/sessions/create"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: 'var(--p)', boxShadow: '0 4px 12px rgba(142,120,251,.35)' }}>
                  <Plus className="w-4 h-4" /> Create Session
                </Link>
              </div>
            </div>

            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
              </div>
            )}

            {!loading && sessions.length === 0 && (
              <div className="rounded-2xl flex flex-col items-center justify-center py-20 text-center"
                style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--p2)' }}>
                  <Calendar className="w-8 h-8" style={{ color: 'var(--p)' }} />
                </div>
                <h3 className="text-[15px] font-semibold mb-2" style={{ color: 'var(--t1)' }}>No sessions yet</h3>
                <p className="text-[13px] mb-5 max-w-xs" style={{ color: 'var(--t3)' }}>
                  Create your first 1-on-1 coaching session and start booking with students.
                </p>
                <Link href="/creator/sessions/create"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: 'var(--p)' }}>
                  <Plus className="w-4 h-4" /> Create your first session
                </Link>
              </div>
            )}

            {!loading && sessions.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {sessions.map(s => <SessionCardUI key={s._id} session={s} />)}
              </div>
            )}

          </main>
        </div>
      </div>
    </>
  )
}
