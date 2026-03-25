"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface ThemeToggleProps {
  className?: string
  size?: "sm" | "md"
}

export function ThemeToggle({ className = "", size = "md" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const dim = size === "sm" ? "w-8 h-8" : "w-10 h-10"

  if (!mounted) return <div className={`${dim} rounded-xl`} aria-hidden="true" />

  const isDark = theme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`${dim} flex items-center justify-center rounded-xl border transition-colors ${className}`}
      style={{
        borderColor: "var(--bd,#e5e7eb)",
        background: "var(--white,#fff)",
        color: "var(--t2,#6b7280)",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "var(--p3,#c4b8fd)"
        e.currentTarget.style.color = "var(--p,#8e78fb)"
        e.currentTarget.style.background = "var(--p2,#ede9ff)"
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "var(--bd,#e5e7eb)"
        e.currentTarget.style.color = "var(--t2,#6b7280)"
        e.currentTarget.style.background = "var(--white,#fff)"
      }}
    >
      {isDark ? (
        /* Sun */
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        /* Moon */
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}
