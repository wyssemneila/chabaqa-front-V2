'use client'

import { useState } from 'react'
import { onboardSteps } from '@/lib/dashboard-data'

export default function DashOnboarding() {
  const [steps, setSteps]       = useState(onboardSteps)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const toggle = (id: string) =>
    setSteps(prev => prev.map(s => s.id === id ? { ...s, done: !s.done } : s))

  return (
    <div className="relative overflow-hidden rounded-[14px] p-5 mb-6 flex items-center gap-6"
      style={{ background: 'linear-gradient(135deg,#1a1916 0%,#2d2c28 100%)', animation: 'dashFadeUp .4s ease both' }}>
      <div className="absolute top-[-40px] right-[-40px] w-[180px] h-[180px] rounded-full opacity-[.07]"
        style={{ background: '#2a5cff' }} />

      <div className="flex-1 relative z-10">
        <h3 className="text-sm font-semibold text-white mb-1">Launch your community in 3 steps</h3>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,.5)' }}>Complete these to reach your first students</p>
      </div>

      <div className="flex gap-2.5 flex-wrap relative z-10">
        {steps.map((step) => (
          <button key={step.id} onClick={() => toggle(step.id)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors"
            style={{
              border: step.done ? '1px solid rgba(255,255,255,.1)' : '1px solid rgba(255,255,255,.12)',
              background: step.done ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.07)',
              color: step.done ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.7)',
              textDecoration: step.done ? 'line-through' : 'none',
            }}>
            <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[9px] shrink-0"
              style={{
                background: step.done ? '#4ade80' : 'transparent',
                borderColor: step.done ? '#4ade80' : 'rgba(255,255,255,.3)',
                color: '#fff',
              }}>
              {step.done ? '✓' : ''}
            </span>
            {step.label}
          </button>
        ))}
      </div>

      <button onClick={() => setDismissed(true)} aria-label="Dismiss"
        className="text-lg leading-none shrink-0 relative z-10 transition-colors"
        style={{ color: 'rgba(255,255,255,.3)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.6)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.3)' }}>
        ×
      </button>
    </div>
  )
}
