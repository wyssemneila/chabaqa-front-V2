"use client"

import { cn } from "@/lib/utils"
import { ReactNode } from "react"
import { TrendingDown, TrendingUp, Info } from "lucide-react"

export type StatCardProps = {
  label: string
  value: string | number
  description?: string
  icon?: ReactNode
  accent?: string
  className?: string
  valuePrefix?: string
  valueSuffix?: string
  hint?: string
  progress?: number // 0..100
  delta?: { value: number | string; direction: 'up' | 'down' }
  href?: string
  onClick?: () => void
  loading?: boolean
}

export function StatCard({
  label,
  value,
  description,
  icon,
  accent = "#8e78fb",
  className,
  valuePrefix,
  valueSuffix,
  hint,
  progress,
  delta,
  href,
  onClick,
  loading,
}: StatCardProps) {
  const clickable = !!href || !!onClick
  const content = (
    <div
      className={cn(
        "relative bg-white/60 backdrop-blur-md rounded-2xl p-6 border shadow-sm transition-all",
        clickable && "hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
        "border-transparent",
        className,
      )}
      style={{ boxShadow: `0 10px 30px -12px rgba(0,0,0,0.06)` }}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `rgba(255,255,255,0.6)`, color: accent, border: `1px solid rgba(255,255,255,0.35)` }}
          >
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <div className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
              {loading ? (
                <span className="inline-block h-7 w-24 rounded bg-muted animate-pulse" />
              ) : (
                <>
                  {valuePrefix}{value}{valueSuffix}
                </>
              )}
            </div>
            {delta && !loading && (
              <div
                className={cn(
                  "ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                  delta.direction === 'up' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}
              >
                {delta.direction === 'up' ? (
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 mr-1" />
                )}
                {delta.value}
              </div>
            )}
          </div>
          <div className="mt-1 font-medium text-gray-700 flex items-center gap-1">
            {label}
            {hint && (
              <span className="text-muted-foreground" title={hint}>
                <Info className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          {description && (
            <div className="mt-1 text-sm text-muted-foreground">{description}</div>
          )}
          {typeof progress === 'number' && !isNaN(progress) && (
            <div className="mt-3">
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(0, Math.min(100, progress))}%`, background: accent }}
                />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{Math.max(0, Math.min(100, progress))}%</div>
            </div>
          )}
        </div>
      </div>
      <div
        className="absolute -inset-0.5 rounded-2xl pointer-events-none opacity-0 hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.5), transparent)` }}
      />
    </div>
  )

  if (href) {
    return (
      <a href={href} aria-label={`${label} details`}>
        {content}
      </a>
    )
  }
  return content
}
