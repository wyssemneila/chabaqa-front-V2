'use client'
import { useEffect, useState } from 'react'

export default function LoadingScreen() {
  const [fading, setFading] = useState(false)
  const [gone,   setGone]   = useState(false)

  useEffect(() => {
    // Only show once per session — never on navigation
    if (sessionStorage.getItem('chabaqa_loaded')) {
      setGone(true)
      return
    }
    sessionStorage.setItem('chabaqa_loaded', '1')

    const t1 = setTimeout(() => setFading(true),  900)
    const t2 = setTimeout(() => setGone(true),    1250)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (gone) return null

  return (
    <div
      role="status"
      aria-label="Loading"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--bg)]"
      style={{
        transition: 'opacity 0.35s cubic-bezier(.4,0,.2,1)',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <svg className="w-24 h-24" viewBox="0 0 240 240" aria-hidden="true">
        <circle
          cx={120} cy={120} r={105}
          fill="none" strokeWidth={20} strokeDasharray="0 660"
          strokeDashoffset={-330} strokeLinecap="round"
          style={{ stroke: 'var(--p)', animation: 'ringA 2s linear infinite' }}
        />
        <circle
          cx={120} cy={120} r={35}
          fill="none" strokeWidth={20} strokeDasharray="0 220"
          strokeDashoffset={-110} strokeLinecap="round"
          style={{ stroke: 'var(--orange)', animation: 'ringB 2s linear infinite' }}
        />
        <circle
          cx={85} cy={120} r={70}
          fill="none" strokeWidth={20} strokeDasharray="0 440"
          strokeLinecap="round"
          style={{ stroke: 'var(--cyan)', animation: 'ringC 2s linear infinite' }}
        />
        <circle
          cx={155} cy={120} r={70}
          fill="none" strokeWidth={20} strokeDasharray="0 440"
          strokeLinecap="round"
          style={{ stroke: 'var(--pink)', animation: 'ringD 2s linear infinite' }}
        />
      </svg>
    </div>
  )
}
