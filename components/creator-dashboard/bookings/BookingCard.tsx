'use client'

import { useState } from 'react'
import { Video, Clock, Calendar, CheckCircle2, Loader2, XCircle } from 'lucide-react'

export interface Booking {
  _id: string; studentName: string; studentEmail: string; initials: string
  avatarColor: string; sessionTitle: string; duration: string
  date: string; status: 'pending'|'confirmed'|'completed'|'rejected'
  price: string; meetLink?: string
}

interface Props {
  booking: Booking
  index: number
  onConfirmClick: (b:Booking) => void
  onReject: (id:string) => void
}

const STATUS = {
  confirmed: {
    border: '#10b981',
    badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    label: 'Confirmed',
  },
  completed: {
    border: '#3b82f6',
    badge: 'bg-blue-100 text-blue-700 border border-blue-200',
    label: 'Completed',
  },
  rejected: {
    border: '#f43f5e',
    badge: 'bg-rose-100 text-rose-700 border border-rose-200',
    label: 'Rejected',
  },
  pending: {
    border: '#f59e0b',
    badge: 'bg-amber-100 text-amber-700 border border-amber-200',
    label: 'Pending',
  },
}

const DM   = { fontFamily:"'DM Sans',sans-serif"  }
const SORA = { fontFamily:"'Sora',sans-serif"      }

export default function BookingCard({ booking: b, index, onConfirmClick, onReject }: Props) {
  const [rejecting, setRejecting] = useState(false)
  const [hovered,   setHovered]   = useState(false)
  const cfg = STATUS[b.status]

  const doReject = async () => {
    setRejecting(true)
    await new Promise(r => setTimeout(r, 350))
    onReject(b._id)
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 12px 40px rgba(15,23,42,.12)'
          : '0 1px 3px rgba(15,23,42,.06)',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
        animation: `slideUp 300ms ease both`,
        animationDelay: `${index * 70}ms`,
        opacity: 0,
      }}
      className="flex bg-white rounded-2xl overflow-hidden border border-slate-200">

      {/* Status accent bar */}
      <div className="w-1 shrink-0 rounded-l-2xl" style={{ background: cfg.border }} />

      {/* Content */}
      <div className="flex-1 px-5 py-4">
        <div className="flex items-start gap-4">

          {/* Avatar */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[12px] font-bold text-white select-none"
            style={{ background: b.avatarColor, ...DM }}>
            {b.initials}
          </div>

          {/* Info zone */}
          <div className="flex-1 min-w-0">

            {/* Row 1: name + email */}
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[14px] font-semibold text-slate-900 leading-tight" style={DM}>{b.studentName}</p>
                <p className="text-[12px] text-slate-400 mt-0.5" style={DM}>{b.studentEmail}</p>
              </div>
              {/* Status badge — top right of card */}
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${cfg.badge}`} style={DM}>
                {cfg.label}
              </span>
            </div>

            {/* Row 2: session pill + duration + date */}
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-indigo-200 bg-indigo-50">
                <Video className="w-3 h-3 text-indigo-500 shrink-0" strokeWidth={1.8} />
                <span className="text-[11px] font-semibold text-indigo-700" style={DM}>{b.sessionTitle}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400" style={DM}>
                <Clock className="w-3 h-3" strokeWidth={1.7} /> {b.duration}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium" style={DM}>
                <Calendar className="w-3 h-3 shrink-0" strokeWidth={1.7} /> {b.date}
              </div>
            </div>

            {/* Row 3: actions */}
            <div className="mt-3 flex items-center gap-2.5 flex-wrap">

              {b.status === 'confirmed' && <>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={2} />
                  <span className="text-[12px] font-semibold text-emerald-600" style={DM}>Confirmed</span>
                </div>
                {b.meetLink && (
                  <a href={b.meetLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 h-8 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700
                               text-white text-[12px] font-semibold transition-colors cursor-pointer"
                    style={DM}>
                    <Video className="w-3.5 h-3.5" strokeWidth={1.8} /> Join Meet
                  </a>
                )}
              </>}

              {b.status === 'completed' && <>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" strokeWidth={2} />
                  <span className="text-[12px] font-semibold text-blue-600" style={DM}>Completed</span>
                </div>
                {b.meetLink && (
                  <a href={b.meetLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 h-8 px-4 rounded-xl border border-blue-200 bg-blue-50
                               text-blue-700 text-[12px] font-semibold hover:bg-blue-100 transition-colors cursor-pointer"
                    style={DM}>
                    <Video className="w-3.5 h-3.5" strokeWidth={1.8} /> View Recording
                  </a>
                )}
              </>}

              {b.status === 'rejected' && <>
                <div className="flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-400" strokeWidth={1.8} />
                  <span className="text-[12px] font-semibold text-rose-500" style={DM}>Rejected</span>
                </div>
                <button className="text-[12px] font-medium text-slate-400 hover:text-indigo-600 transition-colors underline underline-offset-2 cursor-pointer"
                  style={DM}>
                  Reschedule?
                </button>
              </>}

              {b.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <button onClick={() => onConfirmClick(b)}
                    className="flex items-center gap-1.5 h-8 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700
                               text-white text-[12px] font-semibold transition-colors cursor-pointer"
                    style={DM}>
                    <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} /> Confirm
                  </button>
                  <button onClick={doReject} disabled={rejecting}
                    className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl border border-slate-200 bg-white
                               text-slate-500 text-[12px] font-medium hover:bg-slate-50 disabled:cursor-not-allowed
                               transition-colors cursor-pointer"
                    style={DM}>
                    {rejecting
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <><XCircle className="w-3.5 h-3.5" strokeWidth={1.8} /> Reject</>
                    }
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right: price */}
      <div className="flex items-start px-5 pt-4 shrink-0">
        <span className="text-[16px] font-bold text-indigo-600" style={SORA}>{b.price}</span>
      </div>
    </div>
  )
}
