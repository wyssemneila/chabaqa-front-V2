"use client"

import type { ElementType, ReactNode } from "react"
import { cn } from "@/lib/utils"

const ARABIC_SCRIPT_RE =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
const LATIN_LETTER_RE = /[A-Za-z\u00C0-\u024F]/

export function getTextDirection(text: string): "rtl" | "ltr" | "auto" {
  const sample = String(text || "").replace(/\s+/g, "")
  if (!sample) return "ltr"

  let arabic = 0
  let latin = 0
  for (const char of sample) {
    if (ARABIC_SCRIPT_RE.test(char)) arabic += 1
    else if (LATIN_LETTER_RE.test(char)) latin += 1
  }

  if (arabic > latin) return "rtl"
  if (latin > 0 && arabic === 0) return "ltr"
  return "auto"
}

type BidiTextProps = {
  as?: ElementType
  className?: string
  children: ReactNode
  /** Force LTR for fixed UI labels (e.g. "Review:") */
  forceDirection?: "ltr" | "rtl"
}

/** Auto RTL/LTR from content; Latin UI chrome should use forceDirection="ltr" or omit wrapper. */
export function BidiText({
  as: Component = "p",
  className,
  children,
  forceDirection,
}: BidiTextProps) {
  const text =
    typeof children === "string" || typeof children === "number"
      ? String(children)
      : ""
  const dir = forceDirection ?? (text ? getTextDirection(text) : "auto")

  return (
    <Component
      dir={dir}
      className={cn("text-start [unicode-bidi:plaintext]", className)}
    >
      {children}
    </Component>
  )
}

type BidiListProps = {
  items: string[]
  className?: string
  itemClassName?: string
}

export function BidiList({ items, className, itemClassName }: BidiListProps) {
  if (!items.length) return null

  const listDir =
    items.filter((item) => getTextDirection(item) === "rtl").length >=
    Math.ceil(items.length / 2)
      ? "rtl"
      : items.every((item) => getTextDirection(item) === "ltr")
        ? "ltr"
        : "auto"

  return (
    <ul
      dir={listDir}
      className={cn(
        "list-disc space-y-1 ps-5 text-start marker:text-muted-foreground",
        className,
      )}
    >
      {items.map((item, i) => {
        const itemDir = getTextDirection(item)
        return (
          <li
            key={i}
            dir={itemDir === "auto" ? undefined : itemDir}
            className={cn("leading-relaxed [unicode-bidi:plaintext]", itemClassName)}
          >
            {item}
          </li>
        )
      })}
    </ul>
  )
}
