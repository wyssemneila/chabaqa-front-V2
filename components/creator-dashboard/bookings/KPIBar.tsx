'use client'

import { CalendarDays, Clock4, CheckCircle2 } from 'lucide-react'

interface Props { total: number; pending: number; confirmed: number }

export default function KPIBar({ total, pending, confirmed }: Props) {
  const pills = [
    {
      label: 'Total Bookings', value: total,
      Icon: CalendarDays,
      wrap: 'bg-indigo-50 border-indigo-100',
      text: 'text-indigo-700', icon: 'text-indigo-400',
    },
    {
      label: 'Pending', value: pending,
      Icon: Clock4,
      wrap: 'bg-amber-50 border-amber-100',
      text: 'text-amber-700', icon: 'text-amber-400',
    },
    {
      label: 'Confirmed', value: confirmed,
      Icon: CheckCircle2,
      wrap: 'bg-emerald-50 border-emerald-100',
      text: 'text-emerald-700', icon: 'text-emerald-400',
    },
  ]

  return (
    <div className="flex items-center gap-3 px-7 py-4 border-b border-slate-100 bg-white">
      {pills.map(p => (
        <div key={p.label}
          className={`flex items-center gap-2.5 px-4 py-2 rounded-full border ${p.wrap}`}>
          <p.Icon className={`w-4 h-4 ${p.icon}`} strokeWidth={1.7} />
          <span className={`text-[12px] font-medium ${p.text}`}
            style={{ fontFamily:"'DM Sans',sans-serif" }}>
            {p.label}
          </span>
          <span className={`text-[16px] font-bold leading-none ${p.text}`}
            style={{ fontFamily:"'Sora',sans-serif" }}>
            {p.value}
          </span>
        </div>
      ))}
    </div>
  )
}
