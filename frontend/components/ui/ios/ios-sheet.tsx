"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

/**
 * iOS-style sheet. On mobile, a bottom sheet (vaul) with a grabber handle and
 * scrim; on desktop (lg+), a right-aligned side sheet up to 480px.
 *
 * Uses vaul (already a dependency) for the bottom-sheet motion + drag-to-dismiss.
 */
export interface IOSSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  sideContentClassName?: string
  footer?: React.ReactNode
}

export function IOSSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  sideContentClassName,
  footer,
}: IOSSheetProps) {
  // Mobile bottom sheet via vaul
  return (
    <>
      {/* Mobile: bottom sheet */}
      <div className="lg:hidden">
        <DrawerPrimitive.Root
          open={open}
          onOpenChange={onOpenChange}
          shouldScaleBackground={false}
        >
          <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
          <DrawerPrimitive.Content
            className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] rounded-t-2xl border-t border-[var(--bd)] bg-[var(--white)] p-0 outline-none"
          >
            <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-[var(--bd2)]" />
            {(title || description) && (
              <div className="px-5 pb-2 pt-3">
                {title ? (
                  <h2 className="text-[17px] font-semibold text-[var(--t1)]">
                    {title}
                  </h2>
                ) : null}
                {description ? (
                  <p className="mt-0.5 text-[13px] text-[var(--t2)]">
                    {description}
                  </p>
                ) : null}
              </div>
            )}
            <div className="max-h-[calc(88vh-80px)] overflow-y-auto p-5 pt-2">
              {children}
            </div>
            {footer ? (
              <div className="border-t border-[var(--bd)] p-4 bg-[var(--bg)]">
                {footer}
              </div>
            ) : null}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Root>
      </div>

      {/* Desktop: right side sheet */}
      {open ? (
        <div className="pointer-events-none hidden lg:block">
          <div
            className="pointer-events-auto fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
            onClick={() => onOpenChange(false)}
            aria-hidden="true"
          />
          <aside
            className={cn(
              "pointer-events-auto fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col border-l border-[var(--bd)] bg-[var(--white)] shadow-[0_-4px_40px_-8px_rgba(0,0,0,0.18)]",
              sideContentClassName,
            )}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3 px-6 pt-6">
              <div>
                {title ? (
                  <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-[var(--t1)]">
                    {title}
                  </h2>
                ) : null}
                {description ? (
                  <p className="mt-1 text-[14px] text-[var(--t2)]">
                    {description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--t3)] transition-colors hover:bg-[var(--bd)]/60 hover:text-[var(--t1)]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer ? (
              <div className="border-t border-[var(--bd)] px-6 py-4">
                {footer}
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </>
  )
}
