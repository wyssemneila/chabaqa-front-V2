'use client'
import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading]   = useState(false)
  const pathname = usePathname()
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
    } else {
      setVisible(true)
      setFading(false)
    }

    const t1 = setTimeout(() => setFading(true),  900)
    const t2 = setTimeout(() => setVisible(false), 1250)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [pathname])

  if (!visible) return null

  return (
    <div
      role="status"
      aria-label="Loading"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
      style={{
        transition: 'opacity 0.35s cubic-bezier(.4,0,.2,1)',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <svg className="w-24 h-24" viewBox="0 0 240 240" aria-hidden="true">
        <circle cx={120} cy={120} r={105} fill="none" strokeWidth={20} strokeDasharray="0 660" strokeDashoffset={-330} strokeLinecap="round" style={{ stroke: '#8e78fb', animation: 'ringA 2s linear infinite' }} />
        <circle cx={120} cy={120} r={35}  fill="none" strokeWidth={20} strokeDasharray="0 220" strokeDashoffset={-110} strokeLinecap="round" style={{ stroke: '#f65887', animation: 'ringB 2s linear infinite' }} />
        <circle cx={85}  cy={120} r={70}  fill="none" strokeWidth={20} strokeDasharray="0 440" strokeLinecap="round" style={{ stroke: '#47c7ea', animation: 'ringC 2s linear infinite' }} />
        <circle cx={155} cy={120} r={70}  fill="none" strokeWidth={20} strokeDasharray="0 440" strokeLinecap="round" style={{ stroke: '#ff9b28', animation: 'ringD 2s linear infinite' }} />
      </svg>
    </div>
  )
}
