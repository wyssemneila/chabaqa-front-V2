'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CommunitySession } from '@/lib/community-data'
import {
  Clock, Video, Users, Calendar, MapPin, Globe,
  ExternalLink, CalendarPlus, Eye,
} from 'lucide-react'

interface Props {
  slug: string
  sessions: CommunitySession[]
  communityName: string
  locale: string
}

const TYPE_CONFIG = {
  online:      { label: 'Online',    color: '#8e78fb', bg: '#ede9ff' },
  'in-person': { label: 'In-Person', color: '#ff9b28', bg: '#fff7ed' },
}

function formatBookedDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export default function SessionsClient({ slug, sessions, communityName, locale }: Props) {
  const isAr = locale === 'ar'
  const [filter, setFilter] = useState<'all' | 'online' | 'in-person'>('all')

  const bookedSessions = sessions.filter(s => s.booked)
  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.type === filter)

  const tabs: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'online', label: 'Online' },
    { key: 'in-person', label: 'In-Person' },
  ]

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#1a1730' }}>
          {communityName} Sessions
        </h1>
        <p className="mt-1 text-[14px]" style={{ color: '#9590b8' }}>
          Book 1-on-1 sessions with mentors and level up your skills
        </p>
      </div>

      {/* My Sessions (booked) */}
      {bookedSessions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#9590b8' }}>
            My Sessions
          </h2>
          <div className="space-y-2">
            {bookedSessions.map(session => (
              <div key={session.id}
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ border: '1px solid #e8e4ff', background: '#fff' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: '#d1fae5' }}>
                    <Calendar className="w-5 h-5" style={{ color: '#059669' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold truncate" style={{ color: '#1a1730' }}>
                      {session.title}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[12px] flex items-center gap-1" style={{ color: '#9590b8' }}>
                        <Calendar className="w-3 h-3" />
                        {session.bookedDate ? formatBookedDate(session.bookedDate) : 'TBD'}
                      </span>
                      <span className="text-[12px] flex items-center gap-1" style={{ color: '#9590b8' }}>
                        <Clock className="w-3 h-3" />
                        {session.bookedTime || 'TBD'} · {session.duration}min
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/communities/${slug}/sessions/${session.id}`}
                    className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-lg transition-colors hover:bg-[#f9f7ff]"
                    style={{ border: '1px solid #e8e4ff', color: '#46426a' }}>
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </Link>
                  <button className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-lg transition-colors hover:bg-[#f9f7ff] cursor-pointer"
                    style={{ border: '1px solid #e8e4ff', color: '#46426a' }}>
                    <CalendarPlus className="w-3.5 h-3.5" />
                    Add to Calendar
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-lg text-white transition-opacity hover:opacity-90 cursor-pointer"
                    style={{ background: '#8e78fb' }}>
                    <Video className="w-3.5 h-3.5" />
                    Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-6 mb-6 border-b" style={{ borderColor: '#e8e4ff' }}>
        {tabs.map(tab => (
          <button key={tab.key}
            onClick={() => setFilter(tab.key)}
            className="pb-3 text-sm font-medium border-b-2 transition-colors cursor-pointer"
            style={{
              borderColor: filter === tab.key ? '#8e78fb' : 'transparent',
              color: filter === tab.key ? '#1a1730' : '#9590b8',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Session Cards Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border p-12 flex flex-col items-center gap-3" style={{ borderColor: '#e8e4ff', background: '#fff' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#ede9ff' }}>
            <Video className="w-7 h-7" style={{ color: '#8e78fb' }} />
          </div>
          <p className="text-[15px] font-semibold" style={{ color: '#1a1730' }}>No sessions available</p>
          <p className="text-[13px]" style={{ color: '#9590b8' }}>Sessions will appear here when available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(session => {
            const cfg = TYPE_CONFIG[session.type]
            return (
              <Link key={session.id}
                href={`/communities/${slug}/sessions/${session.id}`}
                className="group rounded-2xl overflow-hidden border bg-white flex flex-col transition-all hover:shadow-xl hover:scale-[1.015]"
                style={{ borderColor: '#e8e4ff' }}>
                {/* Banner */}
                <div className="relative aspect-[16/9] w-full overflow-hidden">
                  {session.banner ? (
                    <img src={session.banner} alt={session.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: cfg.bg }}>
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#fff' }}>
                        <Video className="w-7 h-7" style={{ color: cfg.color }} />
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.25) 0%, transparent 30%, transparent 70%, rgba(0,0,0,.3) 100%)' }} />

                  {/* Type badge */}
                  <span className="absolute top-3 right-3 text-[11px] font-bold px-2 py-1 rounded-md text-white shadow-md"
                    style={{ background: cfg.color }}>
                    {cfg.label}
                  </span>

                  {/* Booked ribbon */}
                  {session.booked && (
                    <span className="absolute top-3 left-3 text-[11px] font-semibold px-2 py-1 rounded-md text-white shadow-md"
                      style={{ background: 'rgba(0,0,0,.55)' }}>
                      ✓ Booked
                    </span>
                  )}

                  {/* Price pill */}
                  <span className="absolute bottom-3 left-3 text-[12px] font-bold px-2.5 py-1 rounded-full shadow-md"
                    style={{ background: 'rgba(255,255,255,.95)', color: '#8e78fb' }}>
                    {session.price} {session.currency}
                  </span>
                </div>

                {/* Body */}
                <div className="p-3.5 flex-1 flex flex-col gap-2">
                  {session.category && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded self-start"
                      style={{ background: '#ede9ff', color: '#8e78fb' }}>
                      {session.category}
                    </span>
                  )}
                  <h3 className="text-[14px] font-bold line-clamp-2 leading-snug group-hover:text-[#8e78fb] transition-colors"
                    style={{ color: '#1a1730' }}>
                    {session.title}
                  </h3>
                  {session.description && (
                    <p className="text-[11.5px] line-clamp-2 leading-snug" style={{ color: '#9590b8' }}>
                      {session.description}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-[11px]" style={{ color: '#9590b8' }}>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {session.duration} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {session.availableSlots} slots
                    </span>
                  </div>

                  {/* Mentor */}
                  <div className="flex items-center gap-2 mt-auto">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ background: session.mentorColor }}>
                      {session.mentorInitials}
                    </div>
                    <span className="text-[11px]" style={{ color: '#9590b8' }}>
                      with <span className="font-semibold" style={{ color: '#46426a' }}>{session.mentorName}</span>
                    </span>
                  </div>

                  {/* CTA */}
                  <div className="w-full mt-1 py-2 text-[12px] font-semibold rounded-lg text-white text-center flex items-center justify-center gap-1.5 transition-opacity group-hover:opacity-90"
                    style={{ background: session.booked ? '#10b981' : '#8e78fb' }}>
                    <Calendar className="w-3 h-3" />
                    {session.booked ? 'Booked' : 'Book Session'}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
