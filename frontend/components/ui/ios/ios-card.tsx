"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * iOS-style card. Two variants:
 *  - default: rounded-2xl, subtle border, soft shadow (Apple content surface)
 *  - inset:   the "grouped" Apple Settings style — same surface but the inner
 *             content is expected to use IOSList rows with divider rules.
 *
 * Optionally use <IOSCardGroup> for the outer Settings-group wrapper (header +
 * footer + rounded container around a list of IOSList rows).
 */
type IOSCardVariant = "default" | "inset" | "elevated"

const variantClasses: Record<IOSCardVariant, string> = {
  default:
    "rounded-2xl border border-[var(--bd)] bg-[var(--white)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_18px_-12px_rgba(0,0,0,0.12)]",
  inset:
    "rounded-2xl border border-[var(--bd)] bg-[var(--white)] shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden",
  elevated:
    "rounded-2xl border border-[var(--bd)] bg-[var(--white)] shadow-[0_2px_4px_rgba(0,0,0,0.05),0_16px_36px_-16px_rgba(0,0,0,0.22)]",
}

export interface IOSCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: IOSCardVariant
}

export const IOSCard = React.forwardRef<HTMLDivElement, IOSCardProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "transition-colors",
        variantClasses[variant],
        // Dark mode surface uses card token from globals.css
        "dark:bg-[var(--white)]",
        className,
      )}
      {...props}
    />
  ),
)
IOSCard.displayName = "IOSCard"

export const IOSCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-5 pb-2", className)}
    {...props}
  />
))
IOSCardHeader.displayName = "IOSCardHeader"

export const IOSCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-[17px] font-semibold leading-none tracking-tight text-[var(--t1)]", className)}
    {...props}
  />
))
IOSCardTitle.displayName = "IOSCardTitle"

export const IOSCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("mt-1 text-[13px] text-[var(--t2)]", className)}
    {...props}
  />
))
IOSCardDescription.displayName = "IOSCardDescription"

export const IOSCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 pt-2", className)} {...props} />
))
IOSCardContent.displayName = "IOSCardContent"

export const IOSCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-2 p-5 pt-2",
      className,
    )}
    {...props}
  />
))
IOSCardFooter.displayName = "IOSCardFooter"

/**
 * Apple Settings "grouped" container: a section header label + rounded card
 * wrapping rows + optional footer caption.
 */
export interface IOSCardGroupProps {
  header?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export function IOSCardGroup({
  header,
  footer,
  className,
  children,
}: IOSCardGroupProps) {
  return (
    <section className={cn("space-y-2", className)}>
      {header ? (
        <p className="px-5 text-[13px] font-medium uppercase tracking-wide text-[var(--t3)]">
          {header}
        </p>
      ) : null}
      <div className="rounded-2xl border border-[var(--bd)] bg-[var(--white)] shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
        {children}
      </div>
      {footer ? (
        <p className="px-5 text-[13px] text-[var(--t3)]">{footer}</p>
      ) : null}
    </section>
  )
}
