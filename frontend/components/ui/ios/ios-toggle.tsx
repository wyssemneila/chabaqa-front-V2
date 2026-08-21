"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

/**
 * iOS-style toggle switch. Standalone (not radix) so it can be themed with
 * Chabaqa tokens. 44pt hit area, sliding thumb, brand fill when on.
 */
export interface IOSToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  ariaLabel?: string
}

export function IOSToggle({
  checked,
  onChange,
  disabled = false,
  className,
  ariaLabel,
}: IOSToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--p)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40",
        checked ? "bg-[color:rgb(48,209,88)]" : "bg-[var(--bd2)]",
        className,
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 36 }}
        className={cn(
          "pointer-events-none block h-[27px] w-[27px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)]",
          checked ? "ml-[22px]" : "ml-[1px]",
        )}
      />
    </button>
  )
}
