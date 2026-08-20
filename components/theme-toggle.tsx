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

  const dim = size === "sm" ? "w-8 h-8" : "w-9 h-9"

  if (!mounted) return <div className={`${dim} rounded-xl shrink-0`} aria-hidden="true" />

  const isDark = theme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`${dim} flex items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer shrink-0 ${className}`}
      style={{
        borderColor: "var(--bd,#e5e7eb)",
        background:  "var(--white,#fff)",
        color:       "var(--t2,#6b7280)",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "var(--p3,#c4b8fd)"
        e.currentTarget.style.color       = "var(--p,#8e78fb)"
        e.currentTarget.style.background  = "var(--p2,#ede9ff)"
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "var(--bd,#e5e7eb)"
        e.currentTarget.style.color       = "var(--t2,#6b7280)"
        e.currentTarget.style.background  = "var(--white,#fff)"
      }}
    >
      {isDark ? (
        <svg className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4"/>
          <line x1="12" y1="2"  x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="2"  y1="12" x2="4"  y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  )
}
