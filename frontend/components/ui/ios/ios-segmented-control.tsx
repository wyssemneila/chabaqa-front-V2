"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export interface IOSSegmentedOption {
  value: string
  label: React.ReactNode
  icon?: React.ReactNode
}

export interface IOSSegmentedControlProps {
  options: IOSSegmentedOption[]
  value: string
  onChange: (value: string) => void
  className?: string
  size?: "sm" | "md"
  fullWidth?: boolean
  ariaLabel?: string
}

/**
 * iOS-style segmented control. A pill container with a sliding "thumb" that
 * animates between segments via framer-motion layoutId. Works as a tab bar
 * replacement in the new AI screens.
 */
export function IOSSegmentedControl({
  options,
  value,
  onChange,
  className,
  size = "md",
  fullWidth = false,
  ariaLabel,
}: IOSSegmentedControlProps) {
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  )

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex items-center rounded-xl bg-[var(--bd)]/60 p-1",
        size === "sm" ? "h-8" : "h-10",
        fullWidth && "flex w-full",
        className,
      )}
    >
      <AnimatePresence initial={false}>
        <motion.span
          key={selectedIndex}
          layoutId="ios-segmented-thumb"
          className={cn(
            "absolute inset-y-1 rounded-lg bg-[var(--white)] shadow-[0_1px_3px_rgba(0,0,0,0.12)] ring-1 ring-[var(--bd)]",
          )}
          style={{
            left: `calc(${(100 / options.length) * selectedIndex}% + 4px)`,
            width: `calc(${100 / options.length}% - 8px)`,
          }}
          initial={false}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      </AnimatePresence>
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative z-10 inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg font-medium transition-colors",
              size === "sm"
                ? "h-6 px-2.5 text-[12px]"
                : "h-8 px-3 text-[13px]",
              isActive
                ? "text-[var(--p)]"
                : "text-[var(--t2)] hover:text-[var(--t1)]",
              !fullWidth && "flex-none",
            )}
          >
            {option.icon}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
