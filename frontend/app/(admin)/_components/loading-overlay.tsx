/**
 * Loading overlay component for page transitions
 */

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingOverlayProps {
  message?: string
  fullScreen?: boolean
  className?: string
}

export function LoadingOverlay({ 
  message = "Loading...", 
  fullScreen = false,
  className 
}: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        fullScreen ? "fixed inset-0 bg-background/80 backdrop-blur-sm z-50" : "p-4 sm:p-6 lg:p-8",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  )
}

/**
 * Inline loading spinner for smaller areas
 */
export function LoadingSpinner({ 
  size = "default",
  className 
}: { 
  size?: "sm" | "default" | "lg"
  className?: string 
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8"
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
    </div>
  )
}
