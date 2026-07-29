"use client"

import * as React from "react"
import { FileText, Search } from "lucide-react"

export interface TranscriptSegment {
  text: string
  startMs: number
  endMs: number
}

interface TranscriptTrackerProps {
  segments: TranscriptSegment[]
  onSeek?: (ms: number) => void
  className?: string
}

function formatTimestamp(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

/**
 * Clickable transcript timeline shown under the video player. Each segment
 * is clickable to seek the video to that timestamp. Includes a simple
 * text search filter so learners can find a specific moment.
 */
export function TranscriptTracker({
  segments,
  onSeek,
  className,
}: TranscriptTrackerProps) {
  const [query, setQuery] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)

  const filtered = React.useMemo(() => {
    if (!query.trim()) return segments
    const q = query.toLowerCase()
    return segments.filter((s) => s.text.toLowerCase().includes(q))
  }, [segments, query])

  if (!segments?.length) return null

  const handleSeek = (ms: number) => {
    onSeek?.(ms)
    if (typeof window !== "undefined") {
      const seconds = Math.max(0, Math.floor(ms / 1000))
      window.dispatchEvent(
        new CustomEvent("chabaqa:video-seek", { detail: { seconds } }),
      )
    }
  }

  return (
    <div className={className}>
      <div className="mb-3 flex items-center gap-2">
        <FileText className="h-4 w-4 text-[var(--p)]" />
        <span className="text-sm font-semibold text-[var(--t1)]">Transcript</span>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--t3)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search transcript..."
          className="h-10 w-full rounded-xl border border-[var(--bd)] bg-[var(--white)] pl-9 pr-3 text-sm text-[var(--t1)] placeholder:text-[var(--t3)] focus:border-[var(--p)] focus:outline-none focus:ring-2 focus:ring-[var(--p)]/25"
        />
      </div>

      <div
        ref={containerRef}
        className="max-h-80 space-y-1 overflow-y-auto rounded-xl border border-[var(--bd)] bg-[var(--white)] p-2"
      >
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-sm text-[var(--t3)]">
            No matches for "{query}"
          </p>
        ) : (
          filtered.map((seg, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSeek(seg.startMs)}
              className="flex w-full items-start gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[var(--bd)]/40"
            >
              <span className="shrink-0 font-mono text-xs font-medium text-[var(--p)]">
                {formatTimestamp(seg.startMs)}
              </span>
              <span className="text-sm leading-relaxed text-[var(--t2)]">
                {seg.text}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
