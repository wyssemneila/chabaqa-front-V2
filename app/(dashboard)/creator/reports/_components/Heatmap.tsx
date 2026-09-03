'use client'

import { segColor, fmtDuration } from './data'

// ─── One colored watch-timeline bar ─────────────────────────────────────────────
// Each segment is a slice of the video, colored by how many times it was watched.
export function HeatmapBar({
  segments,
  durationSec,
  height = 26,
  rounded = true,
}: {
  segments: number[]
  durationSec: number
  height?: number
  rounded?: boolean
}) {
  const n = segments.length
  return (
    <div
      className="flex w-full overflow-hidden"
      style={{
        height,
        borderRadius: rounded ? 7 : 0,
        // skipped color — subtle neutral that reads on both light & dark cards
        ['--seg-skip' as string]: 'rgba(130,130,155,.16)',
        border: '1px solid var(--bd)',
      } as React.CSSProperties}
    >
      {segments.map((count, i) => {
        const atSec = Math.round((i / n) * durationSec)
        const label =
          count <= 0
            ? `${fmtDuration(atSec)} · skipped`
            : `${fmtDuration(atSec)} · watched ${count}×`
        return (
          <div
            key={i}
            title={label}
            style={{ flex: '1 1 0', background: segColor(count), height: '100%' }}
          />
        )
      })}
    </div>
  )
}

// ─── Legend ──────────────────────────────────────────────────────────────────────
export function HeatmapLegend() {
  const items: [string, string][] = [
    ['rgba(130,130,155,.28)', 'Skipped'],
    ['#22c55e', 'Watched'],
    ['#f59e0b', 'Rewatched'],
    ['#ef4444', 'Rewatched a lot'],
  ]
  return (
    <div className="flex items-center gap-4 flex-wrap">
      {items.map(([c, label]) => (
        <div key={label} className="flex items-center gap-1.5">
          <span className="inline-block rounded-[3px]" style={{ width: 14, height: 14, background: c }} />
          <span className="text-[11px]" style={{ color: 'var(--t2)' }}>{label}</span>
        </div>
      ))}
    </div>
  )
}
