'use client'

import { useState } from 'react'
import { Video, Clock, Calendar } from 'lucide-react'

export interface Booking {
  _id: string
  studentName: string
  studentEmail: string
  initials: string
  avatarColor: string
  sessionTitle: string
  duration: string
  date: string
  status: 'pending' | 'confirmed' | 'completed' | 'rejected'
  price: string
  meetLink?: string
}

interface Props {
  booking: Booking
  index: number
}

const STATUS = {
  confirmed: {
    border: '#10b981',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    label: 'Confirmed',
  },
  completed: {
    border: '#0ea5e9',
    badge: 'bg-sky-50 text-sky-700 border border-sky-200',
    label: 'Completed',
  },
  rejected: {
    border: '#f43f5e',
    badge: 'bg-rose-50 text-rose-700 border border-rose-200',
    label: 'Rejected',
  },
  pending: {
    border: '#f59e0b',
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    label: 'Pending',
  },
}

const PJS = { fontFamily: "'Plus Jakarta Sans', sans-serif" }

export default function BookingCard({ booking: b, index }: Props) {
  const [hovered, setHovered] = useState(false)
  const cfg = STATUS[b.status]

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform:        hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow:        hovered ? '0 8px 32px rgba(15,23,42,.1)' : '0 1px 3px rgba(15,23,42,.05)',
        transition:       'transform 200ms ease, box-shadow 200ms ease',
        animation:        'cardIn 300ms ease both',
        animationDelay:   `${index * 60}ms`,
        ...PJS,
      }}
      className="flex bg-white rounded-xl border border-slate-200 overflow-hidden">

      {/* Left status accent */}
      <div className="w-1 shrink-0" style={{ background: cfg.border }} />

      {/* Card body */}
      <div className="flex-1 px-5 py-4">

        {/* Row 1: avatar + name/email + status badge */}
        <div className="flex items-start gap-3.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-white select-none"
            style={{ background: b.avatarColor }}>
            {b.initials}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-slate-800 leading-tight">{b.studentName}</p>
            <p className="text-[12px] text-slate-400 mt-0.5">{b.studentEmail}</p>
          </div>

          {/* Status badge — once only, top right */}
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>

        {/* Row 2: session + duration + date + price */}
        <div className="mt-3 flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-indigo-200 bg-indigo-50">
            <Video className="w-3 h-3 text-indigo-500 shrink-0" strokeWidth={1.8} />
            <span className="text-[11px] font-semibold text-indigo-700">{b.sessionTitle}</span>
          </div>

          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <Clock className="w-3 h-3 shrink-0" strokeWidth={1.7} />
            {b.duration}
          </span>

          <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            <Calendar className="w-3 h-3 shrink-0" strokeWidth={1.7} />
            {b.date}
          </span>

          <span className="ml-auto text-[14px] font-bold text-indigo-600 shrink-0">{b.price}</span>
        </div>

        {/* Row 3: action button */}
        <div className="mt-3">
          {b.status === 'confirmed' && (
            <a
              href={b.meetLink ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700
                         text-white text-[12px] font-semibold transition-colors cursor-pointer">
              <Video className="w-3.5 h-3.5" strokeWidth={1.8} />
              Join Meeting
            </a>
          )}

          {b.status === 'completed' && (
            <a
              href={b.meetLink ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg border border-sky-200 bg-white
                         text-sky-700 text-[12px] font-semibold hover:bg-sky-50 transition-colors cursor-pointer">
              <Video className="w-3.5 h-3.5" strokeWidth={1.8} />
              View Recording
            </a>
          )}

          {b.status === 'rejected' && (
            <button className="text-[12px] font-medium text-slate-400 hover:text-indigo-600
                               underline underline-offset-2 transition-colors cursor-pointer">
              Request Reschedule
            </button>
          )}

          {b.status === 'pending' && (
            <button
              disabled
              className="inline-flex items-center h-8 px-4 rounded-lg bg-slate-100 text-slate-400
                         text-[12px] font-semibold cursor-not-allowed select-none">
              Pending Confirmation
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
