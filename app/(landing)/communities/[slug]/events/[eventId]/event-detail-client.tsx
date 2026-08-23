'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CommunityEvent } from '@/lib/community-data'
import {
  ArrowLeft, Calendar, Clock, MapPin, Globe, Users, Ticket,
  CheckCircle2, ShieldCheck, ExternalLink, Minus, Plus, Video,
} from 'lucide-react'

interface Props {
  slug: string
  event: CommunityEvent
  communityName: string
  communityCreator: string
}

export default function EventDetailClient({ slug, event, communityName, communityCreator }: Props) {
  const free = event.price === 'free' || event.price === 0
  const spotsLeft = event.ticketsTotal - event.ticketsSold
  const hasVariants = event.ticketVariants && event.ticketVariants.length > 0

  const [selectedVariant, setSelectedVariant] = useState(
    hasVariants ? event.ticketVariants![0].id : null
  )
  const [quantity, setQuantity] = useState(1)

  const activeVariant = hasVariants
    ? event.ticketVariants!.find(v => v.id === selectedVariant) || event.ticketVariants![0]
    : null

  const unitPrice = activeVariant
    ? (activeVariant.price === 'free' ? 0 : activeVariant.price)
    : (free ? 0 : (event.price as number))

  const totalPrice = unitPrice * quantity
  const isFree = unitPrice === 0

  const capacityPercent = Math.round((event.ticketsSold / event.ticketsTotal) * 100)

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div className="w-full">
      {/* Back */}
      <Link href={`/communities/${slug}/events`}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-5 transition-colors hover:text-[#8e78fb]"
        style={{ color: '#9590b8' }}>
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
        Events
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">

        {/* LEFT — Main content */}
        <div>
          {/* Title area */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {/* Type badge */}
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: event.type === 'online' ? '#ede9ff' : '#fff7ed',
                  color: event.type === 'online' ? '#8e78fb' : '#ff9b28',
                }}>
                {event.type === 'online' ? <Globe className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                {event.type === 'online' ? 'Online' : 'In-Person'}
              </span>
              {event.registered && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: '#d1fae5', color: '#059669' }}>
                  <CheckCircle2 className="w-3 h-3" />
                  Registered
                </span>
              )}
            </div>
            <h1 className="text-[26px] font-bold leading-tight tracking-[-0.01em]" style={{ color: '#1a1730' }}>
              {event.title}
            </h1>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="text-[13px] flex items-center gap-1" style={{ color: '#9590b8' }}>
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(event.date)}
              </span>
              <span className="text-[13px] flex items-center gap-1" style={{ color: '#9590b8' }}>
                <Clock className="w-3.5 h-3.5" />
                {event.time}{event.endTime ? ` - ${event.endTime}` : ''}
              </span>
            </div>
          </div>

          <div className="h-px mb-6" style={{ background: '#ede9ff' }} />

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-[15px] font-semibold mb-3" style={{ color: '#1a1730' }}>
              Description
            </h2>
            <p className="text-[14px] leading-[1.7]" style={{ color: '#6b6885' }}>
              {event.description}
            </p>
          </div>

          {/* Location / Meeting Link */}
          {(event.meetLink || event.location) && (
            <div className="mb-8">
              <h2 className="text-[15px] font-semibold mb-3" style={{ color: '#1a1730' }}>
                {event.type === 'online' ? 'Meeting Link' : 'Location'}
              </h2>
              {event.type === 'online' && event.meetLink && (
                <a href={event.meetLink} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl transition-colors hover:opacity-80"
                  style={{ background: '#ede9ff', color: '#8e78fb' }}>
                  <Video className="w-4 h-4" />
                  <span className="text-[13px] font-semibold">Join Google Meet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {event.type === 'in-person' && event.location && (
                <a href={event.locationUrl || `https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl transition-colors hover:opacity-80"
                  style={{ background: '#fff7ed', color: '#ff9b28' }}>
                  <MapPin className="w-4 h-4" />
                  <span className="text-[13px] font-semibold">{event.location}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {/* Speakers */}
          {event.speakers && event.speakers.length > 0 && (
            <div className="mb-8">
              <h2 className="text-[15px] font-semibold mb-3" style={{ color: '#1a1730' }}>
                Speakers
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {event.speakers.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#f9f8fd' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
                      style={{ background: s.color }}>
                      {s.initials}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: '#1a1730' }}>{s.name}</p>
                      {s.role && <p className="text-[11px]" style={{ color: '#9590b8' }}>{s.role}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What to expect */}
          <div>
            <h2 className="text-[15px] font-semibold mb-3" style={{ color: '#1a1730' }}>
              What to expect
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { text: 'Live interactive content', color: '#8e78fb' },
                { text: 'Q&A session', color: '#47c7ea' },
                { text: 'Networking with members', color: '#f65887' },
                { text: 'Resources & materials', color: '#ff9b28' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#f9f8fd' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${item.color}12` }}>
                    <CheckCircle2 className="w-4 h-4" style={{ color: item.color }} strokeWidth={1.7} />
                  </div>
                  <span className="text-[13px] font-medium" style={{ color: '#46426a' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Sticky sidebar */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e4ff', background: '#fff' }}>

            {/* Ticket variant selector */}
            {hasVariants && (
              <div className="p-5 pb-0">
                <p className="text-[12px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: '#9590b8' }}>
                  Choose ticket
                </p>
                <div className="space-y-2">
                  {event.ticketVariants!.map(v => {
                    const selected = v.id === selectedVariant
                    const vFree = v.price === 'free' || v.price === 0
                    return (
                      <button key={v.id}
                        onClick={() => setSelectedVariant(v.id)}
                        className="w-full text-left p-3 rounded-xl transition-all cursor-pointer"
                        style={{
                          border: selected ? '2px solid #8e78fb' : '1px solid #e8e4ff',
                          background: selected ? '#f9f7ff' : '#fff',
                          padding: selected ? '11px' : '12px',
                        }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                              style={{ borderColor: selected ? '#8e78fb' : '#d8d5e8' }}>
                              {selected && <div className="w-2 h-2 rounded-full" style={{ background: '#8e78fb' }} />}
                            </div>
                            <span className="text-[13px] font-medium" style={{ color: '#1a1730' }}>
                              {v.label}
                            </span>
                          </div>
                          <span className="text-[13px] font-bold" style={{ color: vFree ? '#059669' : '#8e78fb' }}>
                            {vFree ? 'Free' : `${v.price} ${event.currency || 'TND'}`}
                          </span>
                        </div>
                        {v.perks && v.perks.length > 0 && selected && (
                          <div className="mt-2 ml-6.5 space-y-1">
                            {v.perks.map((perk, pi) => (
                              <p key={pi} className="text-[11px] flex items-center gap-1.5" style={{ color: '#6b6885' }}>
                                <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: '#8e78fb' }} />
                                {perk}
                              </p>
                            ))}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Price + Quantity */}
            <div className="p-5 pb-4">
              {!isFree && !event.registered && (
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: '#9590b8' }}>
                    Quantity
                  </span>
                  <div className="flex items-center gap-0 rounded-lg overflow-hidden" style={{ border: '1px solid #e8e4ff' }}>
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-9 h-9 flex items-center justify-center transition-colors hover:bg-[#f9f7ff] cursor-pointer"
                      style={{ color: quantity <= 1 ? '#d8d5e8' : '#46426a' }}
                      disabled={quantity <= 1}>
                      <Minus className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                    <span className="w-10 h-9 flex items-center justify-center text-[14px] font-bold"
                      style={{ color: '#1a1730', borderLeft: '1px solid #e8e4ff', borderRight: '1px solid #e8e4ff' }}>
                      {quantity}
                    </span>
                    <button onClick={() => setQuantity(Math.min(spotsLeft, quantity + 1))}
                      className="w-9 h-9 flex items-center justify-center transition-colors hover:bg-[#f9f7ff] cursor-pointer"
                      style={{ color: '#46426a' }}>
                      <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-[32px] font-bold tracking-tight" style={{ color: '#1a1730' }}>
                  {isFree ? 'Free' : totalPrice}
                </span>
                {!isFree && (
                  <span className="text-[14px] font-medium" style={{ color: '#9590b8' }}>
                    {event.currency || 'TND'}
                  </span>
                )}
                {!isFree && quantity > 1 && (
                  <span className="text-[12px]" style={{ color: '#b5b0d0' }}>
                    ({unitPrice} × {quantity})
                  </span>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="px-5 pb-4">
              {event.registered ? (
                <button className="w-full h-12 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 cursor-pointer"
                  style={{ background: '#10b981' }}>
                  <CheckCircle2 className="w-[18px] h-[18px]" strokeWidth={2} />
                  Registered
                </button>
              ) : (
                <button className="w-full h-12 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 cursor-pointer"
                  style={{ background: '#8e78fb', boxShadow: '0 4px 14px rgba(142,120,251,.35)' }}>
                  <Ticket className="w-[18px] h-[18px]" strokeWidth={2} />
                  {isFree ? 'Register free' : 'Get tickets'}
                </button>
              )}
              {!event.registered && (
                <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px]" style={{ color: '#b5b0d0' }}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Instant confirmation
                </div>
              )}
            </div>

            {/* Capacity bar */}
            <div className="mx-5 mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium" style={{ color: '#9590b8' }}>
                  {event.ticketsSold}/{event.ticketsTotal} joined
                </span>
                <span className="text-[11px] font-semibold" style={{ color: spotsLeft <= 10 ? '#ef4444' : '#46426a' }}>
                  {spotsLeft} spots left
                </span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#f0edf8' }}>
                <div className="h-full rounded-full transition-all"
                  style={{
                    width: `${capacityPercent}%`,
                    background: capacityPercent > 80 ? '#ef4444' : '#8e78fb',
                  }} />
              </div>
            </div>

            <div className="mx-5 h-px" style={{ background: '#f0edf8' }} />

            {/* Details */}
            <div className="p-5 space-y-3">
              <DetailRow label="Date" value={formatDate(event.date)} />
              <DetailRow label="Time" value={`${event.time}${event.endTime ? ` - ${event.endTime}` : ''}`} />
              <DetailRow label="Format" value={event.type === 'online' ? 'Online' : 'In-Person'} />
              <DetailRow label="Organizer" value={communityCreator} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px]" style={{ color: '#9590b8' }}>{label}</span>
      <span className="text-[12px] font-semibold" style={{ color: '#46426a' }}>{value}</span>
    </div>
  )
}
