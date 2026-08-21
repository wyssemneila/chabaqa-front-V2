"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * iOS-style typography scale mapped to Chabaqa brand tokens.
 * Mirrors the SF typography hierarchy: largeTitle, title1-3, body, footnote, caption.
 * Uses --t1 (primary text), --t2 (secondary), --t3 (tertiary) for color weight.
 */
type IOSTextWeight = "regular" | "medium" | "semibold" | "bold"
type IOSTextColor = "primary" | "secondary" | "tertiary"
type IOSSize =
  | "largeTitle"
  | "title1"
  | "title2"
  | "title3"
  | "headline"
  | "body"
  | "callout"
  | "footnote"
  | "caption1"
  | "caption2"

const sizeClasses: Record<IOSSize, string> = {
  largeTitle: "text-[34px] leading-[1.1] tracking-[-0.02em]",
  title1: "text-[28px] leading-[1.15] tracking-[-0.015em]",
  title2: "text-[22px] leading-[1.2] tracking-[-0.01em]",
  title3: "text-[20px] leading-[1.25] tracking-[-0.005em]",
  headline: "text-[17px] leading-[1.3] tracking-[-0.005em]",
  body: "text-[17px] leading-[1.45]",
  callout: "text-[16px] leading-[1.4]",
  footnote: "text-[13px] leading-[1.35]",
  caption1: "text-[12px] leading-[1.3]",
  caption2: "text-[11px] leading-[1.25]",
}

const weightClasses: Record<IOSTextWeight, string> = {
  regular: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
}

const colorClasses: Record<IOSTextColor, string> = {
  primary: "text-[var(--t1)]",
  secondary: "text-[var(--t2)]",
  tertiary: "text-[var(--t3)]",
}

export interface IOSTextProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: IOSSize
  weight?: IOSTextWeight
  color?: IOSTextColor
  as?: "p" | "span" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "label" | "div"
}

export const IOSText = React.forwardRef<
  HTMLParagraphElement,
  IOSTextProps
>(
  (
    {
      className,
      size = "body",
      weight = "regular",
      color = "primary",
      as: Tag = "p",
      ...props
    },
    ref,
  ) => {
    const Component = Tag as React.ElementType
    return (
      <Component
        ref={ref as any}
        className={cn(
          sizeClasses[size],
          weightClasses[weight],
          colorClasses[color],
          className,
        )}
        {...props}
      />
    )
  },
)
IOSText.displayName = "IOSText"
