"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * iOS / Apple HIG button.
 * Variants: filled (primary), tinted (brand-tinted), gray, plain.
 * Min height 44pt for primary tap targets; rounded-xl; subtle press scale.
 */
const iosButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--p)] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97] [&_svg]:pointer-events-none [&_svg]:size-[18px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        filled:
          "bg-[var(--p)] text-white shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(142,120,251,0.22)] hover:brightness-1.05",
        tinted:
          "bg-[var(--p2)] text-[var(--p)] hover:bg-[var(--p2)]/80",
        gray:
          "bg-[var(--bd)] text-[var(--t1)] hover:bg-[var(--bd2)]",
        plain:
          "bg-transparent text-[var(--p)] hover:bg-[var(--p2)]/60",
        destructive:
          "bg-[color:rgb(244,63,94)] text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)] hover:brightness-1.05",
        outline:
          "border border-[var(--bd)] bg-transparent text-[var(--t1)] hover:bg-[var(--bd)]/40",
      },
      size: {
        sm: "h-9 min-h-9 px-3.5 text-[13px]",
        default: "h-11 min-h-[44px] px-5 text-[15px]",
        lg: "h-12 min-h-12 px-6 text-[17px]",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px] p-0",
        iconSm: "h-9 w-9 p-0",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "default",
    },
  },
)

export interface IOSButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iosButtonVariants> {
  asChild?: boolean
}

export const IOSButton = React.forwardRef<HTMLButtonElement, IOSButtonProps>(
  ({ className, variant, size, block, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(iosButtonVariants({ variant, size, block }), className)}
        ref={ref}
        {...props}
      />
    )
  },
)
IOSButton.displayName = "IOSButton"

export { iosButtonVariants }
