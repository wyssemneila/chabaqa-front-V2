"use client"

/**
 * Skip Navigation Link Component
 * 
 * Provides a keyboard-accessible link that allows users to skip
 * directly to the main content, bypassing navigation elements.
 * This is a WCAG 2.1 Level A requirement.
 */

import Link from "next/link"
import { cn } from "@/lib/utils"

export function SkipNav() {
  return (
    <Link
      href="#main-content"
      className={cn(
        "sr-only focus:not-sr-only",
        "fixed top-4 left-4 z-[100]",
        "bg-primary text-primary-foreground",
        "px-4 py-2 rounded-md",
        "font-medium text-sm",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "transition-all"
      )}
    >
      Skip to main content
    </Link>
  )
}
