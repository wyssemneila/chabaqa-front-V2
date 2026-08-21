/**
 * Empty state component for displaying when no data is available
 */

import * as React from "react"
import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  }
  secondaryAction?: {
    label: string
    onClick: () => void
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  }
  className?: string
  compact?: boolean
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
}: EmptyStateProps) {
  if (compact) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8 text-center", className)}>
        {Icon && <Icon className="h-8 w-8 text-muted-foreground mb-3" />}
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant || "default"}
            size="sm"
            className="mt-4"
          >
            {action.label}
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        {Icon && (
          <div className="rounded-full bg-muted p-4 mb-4">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        
        {description && (
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            {description}
          </p>
        )}
        
        {(action || secondaryAction) && (
          <div className="flex gap-3">
            {action && (
              <Button
                onClick={action.onClick}
                variant={action.variant || "default"}
              >
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                variant={secondaryAction.variant || "outline"}
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Empty state specifically for list/table views
 */
export function EmptyList({
  title = "No items found",
  description = "Get started by creating your first item.",
  actionLabel = "Create Item",
  onAction,
  icon: Icon,
}: {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: LucideIcon
}) {
  return (
    <EmptyState
      icon={Icon}
      title={title}
      description={description}
      action={onAction ? {
        label: actionLabel,
        onClick: onAction,
      } : undefined}
      compact
    />
  )
}

/**
 * Empty state for search results
 */
export function EmptySearchResults({
  searchTerm,
  onClear,
}: {
  searchTerm: string
  onClear?: () => void
}) {
  return (
    <EmptyState
      title="No results found"
      description={`We couldn't find any results for "${searchTerm}". Try adjusting your search or filters.`}
      action={onClear ? {
        label: "Clear Search",
        onClick: onClear,
        variant: "outline",
      } : undefined}
      compact
    />
  )
}

/**
 * Empty state for filtered results
 */
export function EmptyFilteredResults({
  onClearFilters,
}: {
  onClearFilters?: () => void
}) {
  return (
    <EmptyState
      title="No matching results"
      description="No items match your current filters. Try adjusting or clearing your filters."
      action={onClearFilters ? {
        label: "Clear Filters",
        onClick: onClearFilters,
        variant: "outline",
      } : undefined}
      compact
    />
  )
}
