"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "gradient" | "elevated"
  hover?: boolean
  glow?: boolean
}

const EnhancedCard = React.forwardRef<HTMLDivElement, EnhancedCardProps>(
  ({ className, variant = "default", hover = false, glow = false, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          "transition-all duration-300",
          {
            "glass-card": variant === "glass",
            "bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800": variant === "gradient",
            "shadow-lg border-0": variant === "elevated",
            "hover-lift": hover,
            "animate-pulse-glow": glow,
          },
          className,
        )}
        {...props}
      />
    )
  },
)
EnhancedCard.displayName = "EnhancedCard"

export { EnhancedCard }
