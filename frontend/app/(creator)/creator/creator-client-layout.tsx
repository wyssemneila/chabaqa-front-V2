"use client"

import { Toaster } from "@/components/ui/toaster"
import { useDashPrefs } from "@/hooks/use-dash-prefs"

export default function CreatorClientLayout({ children }: { children: React.ReactNode }) {
  useDashPrefs()

  return (
    <div className="creator-theme min-h-screen bg-[var(--bg)] text-[var(--t1)]">
      {children}
      <Toaster
        viewportClassName="top-4 right-4 left-auto bottom-auto w-[calc(100vw-2rem)] max-w-[420px] flex-col sm:top-4 sm:right-4 sm:left-auto sm:bottom-auto sm:w-full sm:max-w-[420px] sm:flex-col"
      />
    </div>
  )
}
