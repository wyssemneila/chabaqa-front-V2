'use client'

import { activityItems } from '@/lib/dashboard-data'

const dotColor: Record<string, string> = {
  challenge: '#f59e0b',
  course:    '#2a5cff',
  post:      '#9a9890',
}
const typeColor: Record<string, string> = {
  challenge: '#8a5a00',
  course:    '#2a5cff',
  post:      '#9a9890',
}

export default function DashRecentActivity() {
  return (
    <div className="rounded-[14px] overflow-hidden" style={{ background: '#fff', border: '1px solid #e4e2db' }}>
      <div className="px-5 pt-4 pb-3 flex items-baseline justify-between" style={{ borderBottom: '1px solid #e4e2db' }}>
        <h3 className="text-[13px] font-semibold" style={{ color: '#1a1916' }}>Recent Activity</h3>
        <span className="text-[11px]" style={{ color: '#9a9890' }}>Latest interactions</span>
      </div>
      <div>
        {activityItems.map((item, i) => (
          <div key={i} className="flex items-start gap-3 px-5 py-3 transition-colors"
            style={{ borderBottom: i < activityItems.length - 1 ? '1px solid #e4e2db' : 'none' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f0efe9' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
            <div className="w-2 h-2 rounded-full mt-[5px] shrink-0"
              style={{ background: dotColor[item.type] }} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[.05em] mb-0.5"
                style={{ color: typeColor[item.type] }}>{item.label}</p>
              <p className="text-[13px] truncate" style={{ color: '#1a1916' }}>{item.name}</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#9a9890' }}>{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
