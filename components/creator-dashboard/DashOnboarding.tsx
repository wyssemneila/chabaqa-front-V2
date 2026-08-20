'use client'

import { useState } from 'react'
import { onboardSteps } from '@/lib/dashboard-data'
import { useDashPrefs } from '@/hooks/use-dash-prefs'

const STEP_LABELS: Record<string, { en: string; ar: string }> = {
  community: { en: 'Create a community',    ar: 'أنشئ مجتمعاً'          },
  course:    { en: 'Add your first course', ar: 'أضف دورتك الأولى'      },
  share:     { en: 'Share your invite link', ar: 'شارك رابط الدعوة'     },
}

export default function DashOnboarding() {
  const { lang } = useDashPrefs()
  const [steps, setSteps]       = useState(onboardSteps)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const toggle = (id: string) =>
    setSteps(prev => prev.map(s => s.id === id ? { ...s, done: !s.done } : s))

  const title = lang === 'ar' ? 'أطلق مجتمعك في 3 خطوات' : 'Launch your community in 3 steps'
  const sub   = lang === 'ar' ? 'أكمل هذه الخطوات للوصول إلى طلابك الأوائل' : 'Complete these to reach your first students'

  return (
    <div className="relative overflow-hidden rounded-[14px] p-5 mb-6 flex items-center gap-6"
      style={{ background: 'linear-gradient(135deg,#8e78fb 0%,#6c52f0 100%)', animation: 'dashFadeUp .4s ease both' }}>
      <div className="absolute top-[-40px] right-[-40px] w-[180px] h-[180px] rounded-full opacity-[.15]"
        style={{ background: '#ffffff' }} />

      <div className="flex-1 relative z-10">
        <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,.5)' }}>{sub}</p>
      </div>

      <div className="flex gap-2.5 flex-wrap relative z-10">
        {steps.map((step) => (
          <button key={step.id} onClick={() => toggle(step.id)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            style={{
              border:          step.done ? '1px solid rgba(255,255,255,.1)' : '1px solid rgba(255,255,255,.12)',
              background:      step.done ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.07)',
              color:           step.done ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.7)',
              textDecoration:  step.done ? 'line-through' : 'none',
            }}>
            <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[11px] shrink-0"
              style={{
                background:  step.done ? '#4ade80' : 'transparent',
                borderColor: step.done ? '#4ade80' : 'rgba(255,255,255,.3)',
                color: '#fff',
              }}>
              {step.done ? '✓' : ''}
            </span>
            {STEP_LABELS[step.id]?.[lang] ?? step.label}
          </button>
        ))}
      </div>

      <button onClick={() => setDismissed(true)} aria-label="Dismiss"
        className="text-lg leading-none shrink-0 relative z-10 transition-colors cursor-pointer"
        style={{ color: 'rgba(255,255,255,.3)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.6)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.3)' }}>
        ×
      </button>
    </div>
  )
}
