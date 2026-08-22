'use client'

import type { LucideIcon } from 'lucide-react'

export interface PageStat {
  label: string
  value: string | number
  icon: LucideIcon
  color: string
  bg: string
}

export interface PageStatsBarProps {
  stats: PageStat[]
}

/**
 * Compact stat cards row used across creator pages
 * (courses / sessions / events / products / challenges).
 * Numbers are semibold — not black — so they read cleanly.
 */
export function PageStatsBar({ stats }: PageStatsBarProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-${Math.min(stats.length, 4)} gap-4`}>
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl p-5 flex items-center gap-4"
             style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
               style={{ background: s.bg }}>
            <s.icon className="w-5 h-5" style={{ color: s.color }} />
          </div>
          <div>
            <p className="text-[22px] font-semibold leading-none" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[12px] font-medium mt-1" style={{ color: 'var(--t3)' }}>{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Status filter tabs (All / Active / Inactive with counts) ─── */

export interface PageFilterTab<K extends string> {
  key: K
  label: string
}

export interface PageFilterTabsProps<K extends string> {
  tabs: PageFilterTab<K>[]
  counts: Record<K, number>
  active: K
  onChange: (k: K) => void
}

export function PageFilterTabs<K extends string>({ tabs, counts, active, onChange }: PageFilterTabsProps<K>) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl"
         style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
      {tabs.map((t) => {
        const on = active === t.key
        return (
          <button key={t.key} onClick={() => onChange(t.key)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer transition-colors"
                  style={{
                    background: on ? 'var(--p)' : 'transparent',
                    color:      on ? '#fff'     : 'var(--t3)',
                  }}>
            {t.label}
            <span className="text-[11px] w-5 h-5 rounded-full flex items-center justify-center font-bold"
                  style={{
                    background: on ? 'rgba(255,255,255,.25)' : 'var(--bg)',
                    color: on ? '#fff' : 'var(--t3)',
                  }}>
              {counts[t.key]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
