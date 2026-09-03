'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * A thin top progress line (YouTube / nprogress style) shown during in-app
 * navigation. It starts when the user clicks a same-app link and completes when
 * the route actually changes — so the previous page stays on screen and only a
 * subtle line at the top signals loading, instead of a full-screen spinner or a
 * white/skeleton flash. Dependency-free.
 */
export function TopProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timers = useRef<ReturnType<typeof setInterval>[]>([])
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = () => {
    timers.current.forEach(clearInterval)
    timers.current = []
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null }
    if (safetyTimer.current) { clearTimeout(safetyTimer.current); safetyTimer.current = null }
  }

  const done = () => {
    clearTimers()
    setProgress(100)
    hideTimer.current = setTimeout(() => { setVisible(false); setProgress(0) }, 260)
  }

  const start = () => {
    clearTimers()
    setVisible(true)
    setProgress(8)
    const id = setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + Math.max(0.5, (90 - p) * 0.12)))
    }, 180)
    timers.current.push(id)
    // Safety net: always finish even if the route change is never observed.
    safetyTimer.current = setTimeout(() => done(), 4000)
  }

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const anchor = (e.target as HTMLElement)?.closest?.('a') as HTMLAnchorElement | null
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || anchor.target === '_blank' || anchor.hasAttribute('download')) return
      try {
        const url = new URL(anchor.href, window.location.href)
        if (url.origin !== window.location.origin) return
        if (url.pathname === window.location.pathname && url.search === window.location.search) return
      } catch { return }
      start()
    }
    document.addEventListener('click', onClick, true)
    const onPop = () => start()
    window.addEventListener('popstate', onPop)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('popstate', onPop)
    }
  }, [])

  // Complete once the route (path or query) actually changes.
  useEffect(() => {
    done()
    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 top-0 z-[3000] pointer-events-none" style={{ height: 2.5 }}>
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, var(--p, #8e78fb), #b9a6ff)',
          boxShadow: '0 0 8px rgba(142,120,251,.6)',
          transition: 'width .18s ease',
        }}
      />
    </div>
  )
}
