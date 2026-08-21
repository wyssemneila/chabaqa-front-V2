"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * iOS-style text input. Rounded-xl, subtle border, 44pt height, clear-button
 * affordance on focus. Pairs with IOSLabel for forms.
 */
export interface IOSInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Show a trailing clear (×) button when there is a value. */
  clearable?: boolean
  onClear?: () => void
}

export const IOSInput = React.forwardRef<HTMLInputElement, IOSInputProps>(
  ({ className, clearable, onClear, value, ...props }, ref) => {
    const showClear =
      clearable && onClear && (typeof value === "string" ? value.length > 0 : Boolean(value))
    return (
      <div className="relative flex items-center">
        <input
          ref={ref}
          value={value}
          className={cn(
            "h-11 min-h-[44px] w-full rounded-xl border border-[var(--bd)] bg-[var(--white)] px-3.5 text-[15px] text-[var(--t1)] placeholder:text-[var(--t3)] transition-colors",
            "focus:border-[var(--p)] focus:outline-none focus:ring-2 focus:ring-[var(--p)]/25",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showClear && "pr-10",
            className,
          )}
          {...props}
        />
        {showClear ? (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2.5 flex h-6 w-6 items-center justify-center rounded-full text-[var(--t3)] transition-colors hover:bg-[var(--bd)]/60 hover:text-[var(--t1)]"
            aria-label="Clear"
            tabIndex={-1}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d="M2 2L10 10M10 2L2 10"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ) : null}
      </div>
    )
  },
)
IOSInput.displayName = "IOSInput"

export interface IOSTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const IOSTextarea = React.forwardRef<
  HTMLTextAreaElement,
  IOSTextareaProps
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-[88px] w-full rounded-xl border border-[var(--bd)] bg-[var(--white)] p-3.5 text-[15px] leading-[1.5] text-[var(--t1)] placeholder:text-[var(--t3)] transition-colors",
      "focus:border-[var(--p)] focus:outline-none focus:ring-2 focus:ring-[var(--p)]/25",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "resize-y",
      className,
    )}
    {...props}
  />
))
IOSTextarea.displayName = "IOSTextarea"

export const IOSLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "mb-1.5 block text-[13px] font-medium text-[var(--t2)]",
      className,
    )}
    {...props}
  />
))
IOSLabel.displayName = "IOSLabel"
