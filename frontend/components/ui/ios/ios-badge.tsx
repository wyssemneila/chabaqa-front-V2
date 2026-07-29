"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * iOS-style rounded-full badge. Variants mirror Apple's count/badge system:
 *  - count: filled brand (notification count)
 *  - neutral: gray pill
 *  - success: green
 *  - warning: orange
 *  - destructive: red
 *  - outline: bordered only
 */
const iosBadgeVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-full font-semibold transition-colors whitespace-nowrap",
  {
    variants: {
      variant: {
        count: "bg-[var(--p)] text-white",
        neutral: "bg-[var(--bd)] text-[var(--t2)]",
        success: "bg-[color:rgb(48,209,88)] text-white",
        warning: "bg-[color:rgb(255,159,10)] text-white",
        destructive: "bg-[color:rgb(244,63,94)] text-white",
        outline: "border border-[var(--bd)] text-[var(--t2)]",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px] min-h-[18px]",
        md: "px-2.5 py-0.5 text-[12px] min-h-[20px]",
        lg: "px-3 py-1 text-[13px] min-h-[24px]",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "md",
    },
  },
)

export interface IOSBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof iosBadgeVariants> {}

export function IOSBadge({
  className,
  variant,
  size,
  ...props
}: IOSBadgeProps) {
  return (
    <span
      className={cn(iosBadgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { iosBadgeVariants }
