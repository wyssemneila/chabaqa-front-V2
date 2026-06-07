'use client'

import { useState } from 'react'
import { X, Video, Calendar, Clock, Sparkles, Loader2, CheckCircle2, ExternalLink } from 'lucide-react'

export interface BookingForModal {
  _id: string; studentName: string; studentEmail: string
  sessionTitle: string; duration: string; date: string
}

interface Props {
  booking: BookingForModal
  onConfirmed: (id:string, link:string) => void
  onClose: () => void
}

function genMeetLink() {
  const r = () => Math.random().toString(36).slice(2,5)
  return `https://meet.google.com/${r()}-${r()}${r().slice(0,1)}-${r()}`
}

const DM = { fontFamily:"'DM Sans',sans-serif" }
const SORA = { fontFamily:"'Sora',sans-serif" }

export default function ConfirmModal({ booking, onConfirmed, onClose }: Props) {
  const [step, setStep] = useState<'idle'|'loading'|'success'>('idle')
  const [link, setLink] = useState('')

  const generate = async () => {
    setStep('loading')
    await new Promise(r => setTimeout(r,1400))
    setLink(genMeetLink())
    setStep('success')
  }

  const confirm = () => { onConfirmed(booking._id, link); onClose() }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background:'rgba(15,23,42,.5)', backdropFilter:'blur(6px)', animation:'fadeIn .18s ease' }}>

      <div className="w-full max-w-[420px] rounded-2xl shadow-2xl overflow-hidden bg-white border border-slate-200"
        style={{ animation:'slideUp .22s ease' }}>

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div>
            <p className="text-[16px] font-bold text-slate-900" style={SORA}>Confirm Booking</p>
            <p className="text-[12px] text-slate-400 mt-0.5 flex items-center gap-1.5" style={DM}>
              <Video className="w-3.5 h-3.5" strokeWidth={1.7} /> {booking.sessionTitle}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Student info */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[12px] font-bold text-white"
            style={{ background:'#6366f1' }}>
            {booking.studentName.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-900" style={DM}>{booking.studentName}</p>
            <p className="text-[11px] text-slate-400" style={DM}>{booking.studentEmail}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[12px] font-semibold text-slate-700" style={DM}>{booking.date}</p>
            <p className="text-[11px] text-slate-400" style={DM}>{booking.duration}</p>
          </div>
        </div>

        {/* Meet link zone */}
        <div className="px-6 py-5">
          {step === 'idle' && (
            <button onClick={generate}
              className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold
                         flex items-center justify-center gap-2.5 cursor-pointer transition-colors"
              style={DM}>
              <Sparkles className="w-4 h-4" strokeWidth={1.7} />
              Create Meeting Link
            </button>
          )}

          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
              <p className="text-[13px] text-slate-400 font-medium" style={DM}>Generating link…</p>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-4">
              {/* Success card */}
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={1.7} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-emerald-800" style={SORA}>Meeting Created!</p>
                    <p className="text-[11px] text-emerald-600" style={DM}>Link is ready. Confirm to notify the student.</p>
                  </div>
                </div>
                {/* Link row */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-emerald-100">
                  <Video className="w-3 h-3 text-indigo-500 shrink-0" strokeWidth={1.7} />
                  <span className="text-[11px] font-mono text-slate-600 truncate flex-1">{link}</span>
                  <a href={link} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 text-indigo-500 hover:text-indigo-700 transition-colors">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                {/* Context */}
                <div className="mt-2.5 flex items-center gap-3 text-[11px] text-emerald-600" style={DM}>
                  <span className="flex items-center gap-1.5">
                    <Video className="w-3 h-3" strokeWidth={1.7} />{booking.sessionTitle}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" strokeWidth={1.7} />{booking.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" strokeWidth={1.7} />{booking.duration}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2.5">
                <button onClick={onClose}
                  className="flex-1 h-10 rounded-xl border border-slate-200 text-[12px] font-semibold text-slate-500
                             hover:bg-slate-50 cursor-pointer transition-colors"
                  style={DM}>
                  Cancel
                </button>
                <button onClick={confirm}
                  className="flex-[2] h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-semibold
                             flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  style={DM}>
                  <CheckCircle2 className="w-4 h-4" strokeWidth={1.7} />
                  OK, Confirm Booking
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
