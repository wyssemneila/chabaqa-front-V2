"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Apple Settings-style list. Stacked rows with hairline dividers,
 * optional leading icon chip, title/subtitle, and trailing accessory (chevron,
 * value, or custom node). Supports a "clickable" interactive state with a
 * subtle active background on press, matching iOS list behavior.
 */
export interface IOSListRowProps
  extends React.HTMLAttributes<HTMLElement> {
  icon?: React.ReactNode
  iconBg?: string
  title?: React.ReactNode
  subtitle?: React.ReactNode
  accessory?: React.ReactNode
  showChevron?: boolean
  clickable?: boolean
  divider?: "top" | "bottom" | "none"
}

export const IOSListRow = React.forwardRef<HTMLElement, IOSListRowProps>(
  (
    {
      className,
      icon,
      iconBg = "var(--p2)",
      title,
      subtitle,
      accessory,
      showChevron = false,
      clickable = false,
      onClick,
      divider = "bottom",
      ...props
    },
    ref,
  ) => {
    const Comp = clickable ? "button" : "div"
    return (
      <Comp
        ref={ref as any}
        type={clickable ? "button" : undefined}
        onClick={clickable ? onClick : undefined}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3 text-start",
          divider === "bottom" &&
            "border-b border-[var(--bd)] last:border-b-0",
          divider === "top" && "border-t border-[var(--bd)]",
          clickable &&
            "transition-colors hover:bg-[var(--bd)]/40 active:bg-[var(--bd)]/70 focus-visible:outline-none focus-visible:bg-[var(--bd)]/40",
          className,
        )}
        {...(props as React.HTMLAttributes<HTMLElement>)}
      >
        {icon ? (
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-[var(--p)]"
            style={{ backgroundColor: iconBg }}
            aria-hidden="true"
          >
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          {title ? (
            <div className="truncate text-[15px] font-medium text-[var(--t1)]">
              {title}
            </div>
          ) : null}
          {subtitle ? (
            <div className="truncate text-[13px] text-[var(--t2)]">
              {subtitle}
            </div>
          ) : null}
        </div>
        {accessory ? (
          <div className="shrink-0 text-[15px] text-[var(--t2)]">
            {accessory}
          </div>
        ) : null}
        {showChevron ? (
          <svg
            width="8"
            height="14"
            viewBox="0 0 8 14"
            fill="none"
            className="shrink-0 text-[var(--t3)]"
            aria-hidden="true"
          >
            <path
              d="M1 1L7 7L1 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </Comp>
    )
  },
)
IOSListRow.displayName = "IOSListRow"

export interface IOSListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Wrap rows in a card with rounded corners and border. Defaults to true. */
  grouped?: boolean
}

export const IOSList = React.forwardRef<HTMLDivElement, IOSListProps>(
  ({ className, grouped = true, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        grouped &&
          "rounded-2xl border border-[var(--bd)] bg-[var(--white)] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
)
IOSList.displayName = "IOSList"
